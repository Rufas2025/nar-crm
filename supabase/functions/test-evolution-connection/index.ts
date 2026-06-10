import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@3";

const BodySchema = z.object({
  apiUrl: z.string().url().max(500).optional(),
  baseUrl: z.string().url().max(500).optional(),
  apiKey: z.string().min(1).max(500),
  instanceName: z.string().min(1).max(200),
}).refine((value) => Boolean(value.apiUrl || value.baseUrl), {
  message: "apiUrl é obrigatório",
  path: ["apiUrl"],
});

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

function formatHttpError(status: number, bodyText: string, data: any) {
  if (status === 401 || status === 403) return `Erro ${status}: API Key inválida ou sem permissão`;
  if (status === 404) return `Erro 404: instância não encontrada ou URL base incorreta`;
  const details = cleanMessage(data?.message ?? data?.error ?? bodyText ?? "sem corpo de resposta");
  return `Erro ${status}: ${details}`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const parsed = BodySchema.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) {
      return responseJson({ ok: false, error: "URL da Evolution API, API Key e nome da instância são obrigatórios e válidos", testedAt: new Date().toISOString() });
    }
    const { apiKey, instanceName } = parsed.data;
    const apiUrl = (parsed.data.apiUrl ?? parsed.data.baseUrl ?? "").replace(/\/+$/, "");

    const url = `${apiUrl}/instance/connectionState/${encodeURIComponent(instanceName)}`;
    const testedAt = new Date().toISOString();
    let resp: Response;
    try {
      resp = await fetch(url, {
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

    if (!resp.ok) {
      return responseJson({ ok: false, status: resp.status, testedAt, error: formatHttpError(resp.status, text, data) });
    }

    const state = data?.instance?.state ?? data?.state;
    if (!state) {
      return responseJson({ ok: false, status: resp.status, testedAt, error: "Resposta 2xx, mas sem instance.state." });
    }

    return responseJson({
      ok: state === "open",
      state,
      status: resp.status,
      testedAt,
      error: state === "open" ? null : `Instância não conectada. Estado retornado: "${state}".`,
    });
  } catch (e) {
    return responseJson({ ok: false, error: cleanMessage((e as Error)?.message ?? e), testedAt: new Date().toISOString() }, 500);
  }
});
