import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@3";

// Projeto Supabase do CRM (onde ficam auth, leads e activities)
const CRM_URL = "https://szdpzatugxkhaocdsfdc.supabase.co";
const CRM_ANON_KEY = "sb_publishable_Tufx7JnQ0snrfrPo3XCnGQ_UznvEfZX";

const DEFAULT_MESSAGE =
  "Olá, tudo bem? Aqui é da NAR ECO. Estou entrando em contato sobre as soluções para sua escola.";

function responseJson(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function cleanMessage(value: unknown) {
  const message = typeof value === "string" ? value : JSON.stringify(value ?? "");
  return message.replace(/apikey\s*[:=]\s*[^\s,}"']+/gi, "apikey: ***").slice(0, 500);
}

function maskPhone(digits: string) {
  if (!digits) return "(vazio)";
  if (digits.length <= 6) return digits[0] + "****";
  return `${digits.slice(0, 4)}****${digits.slice(-2)}`;
}

/**
 * Normaliza telefone brasileiro:
 * - remove tudo que não for número (espaços, parênteses, traços, +, símbolos)
 * - 10 ou 11 dígitos (DDD + número) → adiciona 55
 * - já começa com 55 (12-13 dígitos) → mantém
 */
function normalizePhone(raw: string): string | null {
  let digits = (raw ?? "").replace(/\D/g, "");
  digits = digits.replace(/^0+/, "");
  if (!digits) return null;

  if (digits.length === 10 || digits.length === 11) {
    return "55" + digits;
  }
  if (digits.startsWith("55") && (digits.length === 12 || digits.length === 13)) {
    return digits;
  }
  return null;
}

async function getCrmUser(authToken: string): Promise<{ id: string } | null> {
  try {
    const resp = await fetch(`${CRM_URL}/auth/v1/user`, {
      headers: { apikey: CRM_ANON_KEY, Authorization: `Bearer ${authToken}` },
    });
    const data = await resp.json().catch(() => null);
    if (!resp.ok || !data?.id) return null;
    return { id: data.id as string };
  } catch {
    return null;
  }
}

const BodySchema = z
  .object({
    authToken: z.string().min(10),
    leadId: z.string().uuid().nullable().optional(),
    phone: z.string().min(1).max(50).optional(),
    phoneNumber: z.string().min(1).max(50).optional(),
    message: z.string().max(4000).nullable().optional(),
    mediaUrl: z.string().url().nullable().optional(),
    mediaType: z.enum(["image", "document"]).nullable().optional(),
    fileName: z.string().max(255).nullable().optional(),
    skipText: z.boolean().optional(),
  })
  .refine((d) => d.phone || d.phoneNumber, { message: "Telefone obrigatório" });


Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const rawBody = await req.json().catch(() => ({}));
    const parsed = BodySchema.safeParse(rawBody);
    if (!parsed.success) {
      return responseJson({ ok: false, error: "Telefone inválido ou requisição malformada." }, 400);
    }
    const { authToken, leadId } = parsed.data;
    const rawPhone = parsed.data.phone ?? parsed.data.phoneNumber ?? "";

    // 1. Autenticação (token da sessão do CRM)
    const user = await getCrmUser(authToken);
    if (!user) return responseJson({ ok: false, error: "Não autenticado." }, 401);

    // 2. Telefone
    const normalizedPhone = normalizePhone(rawPhone);
    console.log(
      `[evolution-send-message] leadId=${leadId ?? "-"} telefone original=${maskPhone(
        rawPhone.replace(/\D/g, "")
      )} normalizado=${normalizedPhone ? maskPhone(normalizedPhone) : "INVÁLIDO"}`
    );
    if (!normalizedPhone) {
      return responseJson({ ok: false, error: "Telefone inválido" }, 400);
    }

    // 3. Mensagem: usa exatamente o texto do frontend; padrão apenas como fallback se vazia
    const trimmedMessage = (parsed.data.message ?? "").trim();
    if (trimmedMessage.length > 0 && trimmedMessage.length < 5) {
      return responseJson({ ok: false, error: "A mensagem deve ter pelo menos 5 caracteres." }, 400);
    }
    const message = trimmedMessage.length > 0 ? trimmedMessage : DEFAULT_MESSAGE;

    // 4. Configuração da Evolution (tabela evolution_config — mesma da tela Configurações)
    const serviceDb = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    const { data: config, error: configErr } = await serviceDb
      .from("evolution_config")
      .select("api_url, api_key, instance_name")
      .eq("user_id", user.id)
      .maybeSingle();

    if (configErr) throw configErr;
    if (!config) {
      return responseJson(
        { ok: false, error: "Configuração da Evolution não encontrada. Acesse Configurações e salve a conexão." },
        400
      );
    }

    const apiUrl = (config.api_url as string).replace(/\/+$/, "");

    // 5. Resolve a instância: na Evolution GO o envio usa o TOKEN da instância como apikey
    let instResp: Response;
    try {
      instResp = await fetch(`${apiUrl}/instance/all`, {
        headers: { apikey: config.api_key, "Content-Type": "application/json" },
      });
    } catch (e) {
      return responseJson({
        ok: false,
        error: `Erro de rede: não foi possível acessar a Evolution GO. ${cleanMessage((e as Error)?.message ?? e)}`,
      });
    }

    if (instResp.status === 401 || instResp.status === 403) {
      await instResp.text();
      return responseJson({ ok: false, error: `Erro ${instResp.status}: API Key inválida` });
    }
    if (!instResp.ok) {
      const t = await instResp.text();
      return responseJson({ ok: false, error: `Erro ${instResp.status}: ${cleanMessage(t)}` });
    }

    const instData = await instResp.json().catch(() => ({}));
    const instances: any[] = Array.isArray(instData?.data) ? instData.data : [];
    const instance = instances.find((i) => i?.name === config.instance_name);

    if (!instance) {
      return responseJson({
        ok: false,
        error: `Instância "${config.instance_name}" não encontrada na Evolution GO. Verifique em Configurações.`,
      });
    }
    if (instance.connected !== true) {
      return responseJson({
        ok: false,
        error: "Instância não está conectada ao WhatsApp. Acesse Configurações e teste a conexão novamente.",
      });
    }
    if (!instance.token) {
      return responseJson({ ok: false, error: "Erro da Evolution GO: instância sem token de acesso." });
    }

    // 6. Envio — texto primeiro, depois mídia (rota /send/media da Evolution GO)
    const mediaUrl = parsed.data.mediaUrl ?? null;
    const mediaType = parsed.data.mediaType ?? null;
    const fileName = parsed.data.fileName ?? null;
    const skipText = parsed.data.skipText === true;

    async function postEvo(path: string, payload: Record<string, unknown>) {
      const url = `${apiUrl}${path}`;
      console.log(`[evolution-send-message] POST ${url} numero=${maskPhone(normalizedPhone)}`);
      try {
        const r = await fetch(url, {
          method: "POST",
          headers: { apikey: instance.token, "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const text = await r.text();
        let data: any = {};
        try { data = JSON.parse(text); } catch { /* not json */ }
        return { status: r.status, ok: r.ok, text, data };
      } catch (e) {
        return { status: 0, ok: false, text: String((e as Error)?.message ?? e), data: {} as any };
      }
    }

    function extractId(data: any) {
      return data?.messageId ?? data?.id ?? data?.data?.Info?.ID ?? data?.data?.key?.id ?? null;
    }
    function isSuccess(resp: { ok: boolean; data: any }) {
      const id = extractId(resp.data);
      return (
        resp.ok &&
        (resp.data?.success === true ||
          resp.data?.status === "success" ||
          resp.data?.message === "success" ||
          Boolean(id) ||
          (resp.data?.data != null && resp.data?.error == null))
      );
    }

    // 6a. Texto
    let textSent = false;
    let textError: string | null = null;
    let messageId: string | null = null;

    if (!skipText) {
      const textResp = await postEvo("/send/text", { number: normalizedPhone, text: message });
      console.log(`[evolution-send-message] text status=${textResp.status} body=${cleanMessage(textResp.text).slice(0, 300)}`);
      if (textResp.status === 401 || textResp.status === 403) {
        return responseJson({ ok: false, error: `Erro ${textResp.status}: API Key inválida` });
      }
      textSent = isSuccess(textResp);
      messageId = extractId(textResp.data);
      if (!textSent) {
        textError = `Erro da Evolution GO ao enviar texto (HTTP ${textResp.status}): ${cleanMessage(
          textResp.data?.error ?? textResp.data?.message ?? textResp.text ?? "sem corpo de resposta"
        )}`;
      }
    }

    // 6b. Mídia (rota única /send/media)
    const mediaRequested = Boolean(mediaUrl && mediaType);
    let mediaSent = false;
    let mediaError: string | null = null;

    if (mediaRequested) {
      const mediaPayload: Record<string, unknown> = {
        number: normalizedPhone,
        url: mediaUrl,
        type: mediaType === "image" ? "image" : "document",
      };
      if (fileName) mediaPayload.filename = fileName;
      const mediaResp = await postEvo("/send/media", mediaPayload);
      console.log(
        `[evolution-send-message] media status=${mediaResp.status} body=${cleanMessage(mediaResp.text).slice(0, 200)}`
      );
      mediaSent = isSuccess(mediaResp);
      if (!mediaSent) {
        mediaError = `Anexo não enviado (HTTP ${mediaResp.status}): ${cleanMessage(
          mediaResp.data?.error ?? mediaResp.data?.message ?? mediaResp.text ?? "sem corpo de resposta"
        )}`;
      } else if (!messageId) {
        messageId = extractId(mediaResp.data);
      }
    }

    const anySent = textSent || mediaSent;
    if (!anySent) {
      return responseJson({
        ok: false,
        textSent: false,
        mediaRequested,
        mediaSent: false,
        mediaError,
        error: textError ?? mediaError ?? "Nada foi enviado.",
      });
    }

    // 8. Só registra interação após confirmação de sucesso — no banco do CRM, como o usuário
    const crmDb = createClient(CRM_URL, CRM_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${authToken}` } },
    });

    let interactionRegistered = false;
    if (leadId && anySent) {
      const { error: actErr } = await crmDb.from("activities").insert({
        lead_id: leadId,
        user_id: user.id,
        tipo: "whatsapp",
        descricao: skipText
          ? `Anexo de WhatsApp reenviado pelo CRM${fileName ? `: ${fileName}` : ""}`
          : `Mensagem de WhatsApp enviada pelo CRM (texto: ${textSent ? "enviado" : "falhou"}${mediaRequested ? `, anexo: ${mediaSent ? "enviado" : "falhou"}` : ""}): "${message.slice(0, 200)}"`,
      });
      interactionRegistered = !actErr;
      if (actErr) {
        console.error(`[evolution-send-message] falha ao registrar interação: ${cleanMessage(actErr.message)}`);
      }

      const { error: leadErr } = await crmDb
        .from("leads")
        .update({ lead_status: "em_contato", ultimo_contato_at: new Date().toISOString() })
        .eq("id", leadId);
      if (leadErr) {
        console.error(`[evolution-send-message] falha ao atualizar lead: ${cleanMessage(leadErr.message)}`);
      }
    }

    return responseJson({
      ok: true,
      textSent,
      mediaRequested,
      mediaSent,
      mediaError,
      messageId,
      interactionRegistered,
      sentTo: maskPhone(normalizedPhone),
    });

  } catch (e) {
    console.error("[evolution-send-message] erro inesperado:", cleanMessage((e as Error)?.message ?? e));
    return responseJson({ ok: false, error: cleanMessage((e as Error)?.message ?? e) }, 500);
  }
});
