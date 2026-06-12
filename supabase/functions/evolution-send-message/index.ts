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

    // 6. Envio
    const sendUrl = `${apiUrl}/send/text`;
    console.log(
      `[evolution-send-message] endpoint=${sendUrl} numero=${maskPhone(normalizedPhone)} instancia=${config.instance_name}`
    );

    let evoResp: Response;
    try {
      evoResp = await fetch(sendUrl, {
        method: "POST",
        headers: { apikey: instance.token, "Content-Type": "application/json" },
        body: JSON.stringify({ number: normalizedPhone, text: message }),
      });
    } catch (e) {
      return responseJson({
        ok: false,
        error: `Erro de rede ao enviar mensagem: ${cleanMessage((e as Error)?.message ?? e)}`,
      });
    }

    const evoText = await evoResp.text();
    let evoData: any = {};
    try {
      evoData = JSON.parse(evoText);
    } catch {
      // resposta não-JSON
    }

    console.log(
      `[evolution-send-message] status=${evoResp.status} body=${cleanMessage(evoText).slice(0, 300)}`
    );

    if (evoResp.status === 401 || evoResp.status === 403) {
      return responseJson({ ok: false, error: `Erro ${evoResp.status}: API Key inválida` });
    }
    if (evoResp.status === 404) {
      return responseJson({ ok: false, error: "Erro 404: endpoint não encontrado" });
    }

    // 7. Parser flexível de sucesso
    const messageId =
      evoData?.messageId ??
      evoData?.id ??
      evoData?.data?.Info?.ID ??
      evoData?.data?.key?.id ??
      null;

    const success =
      evoResp.ok &&
      (evoData?.success === true ||
        evoData?.status === "success" ||
        evoData?.message === "success" ||
        Boolean(messageId) ||
        (evoData?.data != null && evoData?.error == null));

    if (!success) {
      const details = cleanMessage(evoData?.error ?? evoData?.message ?? evoText ?? "sem corpo de resposta");
      return responseJson({
        ok: false,
        error: `Erro da Evolution GO: mensagem não enviada. (HTTP ${evoResp.status}) ${details}`,
      });
    }

    // 8. Só registra interação após confirmação de sucesso — no banco do CRM, como o usuário
    const crmDb = createClient(CRM_URL, CRM_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${authToken}` } },
    });

    let interactionRegistered = false;
    if (leadId) {
      const { error: actErr } = await crmDb.from("activities").insert({
        lead_id: leadId,
        user_id: user.id,
        tipo: "whatsapp",
        descricao: `Mensagem de WhatsApp enviada pelo CRM (status: enviado): "${message.slice(0, 200)}"`,
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
      messageId,
      interactionRegistered,
      sentTo: maskPhone(normalizedPhone),
    });
  } catch (e) {
    console.error("[evolution-send-message] erro inesperado:", cleanMessage((e as Error)?.message ?? e));
    return responseJson({ ok: false, error: cleanMessage((e as Error)?.message ?? e) }, 500);
  }
});
