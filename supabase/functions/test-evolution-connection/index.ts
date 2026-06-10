import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@3";

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

const BodySchema = z.object({
  apiUrl: z.string().url().max(500),
  apiKey: z.string().min(1).max(500),
  instanceName: z.string().min(1).max(200),
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const testedAt = new Date().toISOString();

  try {
    let rawBody: unknown = {};
    try {
      rawBody = await req.json();
    } catch {
      // corpo vazio ou inválido
    }

    const parsed = BodySchema.safeParse(rawBody);
    if (!parsed.success) {
      return responseJson(
        { ok: false, testedAt, error: "Dados inválidos: informe URL, API Key e nome da instância." },
        400
      );
    }

    const apiUrl = parsed.data.apiUrl.replace(/\/+$/, "");
    const { apiKey, instanceName } = parsed.data;

    // Evolution API (versão Go): GET /instance/all lista todas as instâncias
    let resp: Response;
    try {
      resp = await fetch(`${apiUrl}/instance/all`, {
        method: "GET",
        headers: { apikey: apiKey, "Content-Type": "application/json" },
      });
    } catch (e) {
      return responseJson({
        ok: false,
        status: 0,
        testedAt,
        error: `Erro de rede: não foi possível acessar a URL da Evolution API. ${cleanMessage((e as Error)?.message ?? e)}`,
      });
    }

    const text = await resp.text();
    let data: any = {};
    try {
      data = JSON.parse(text);
    } catch {
      // resposta não-JSON
    }

    if (resp.status === 401 || resp.status === 403) {
      return responseJson({
        ok: false,
        status: resp.status,
        testedAt,
        error: `Erro ${resp.status}: API Key inválida ou sem permissão.`,
      });
    }

    if (!resp.ok) {
      return responseJson({
        ok: false,
        status: resp.status,
        testedAt,
        error: `Erro ${resp.status}: ${cleanMessage(data?.error ?? data?.message ?? text ?? "sem corpo de resposta")}`,
      });
    }

    const instances: any[] = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
    const instance = instances.find((i) => i?.name === instanceName);

    if (!instance) {
      const available = instances.map((i) => i?.name).filter(Boolean).join(", ") || "nenhuma";
      return responseJson({
        ok: false,
        status: resp.status,
        testedAt,
        error: `Instância "${instanceName}" não encontrada. Instâncias disponíveis: ${available}.`,
      });
    }

    const state = instance.connected === true ? "open" : "close";

    return responseJson({
      ok: state === "open",
      state,
      status: resp.status,
      testedAt,
      error: state === "open" ? null : `Instância encontrada, mas não conectada ao WhatsApp (estado: "${state}").`,
    });
  } catch (e) {
    return responseJson(
      { ok: false, testedAt, error: cleanMessage((e as Error)?.message ?? e) },
      500
    );
  }
});
