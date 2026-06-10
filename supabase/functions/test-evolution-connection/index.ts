import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

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
    const authHeader = req.headers.get("Authorization") ?? "";
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData?.user) {
      return responseJson({ ok: false, error: "Não autenticado" }, 401);
    }
    const userId = userData.user.id;

    const { data: config, error: configErr } = await supabase
      .from("evolution_config")
      .select("api_url, api_key, instance_name")
      .eq("user_id", userId)
      .maybeSingle();

    if (configErr) throw configErr;
    if (!config) {
      return responseJson({
        ok: false,
        error: "Evolution API não configurada. Preencha e salve as credenciais.",
        testedAt: new Date().toISOString(),
      });
    }

    const apiUrl = config.api_url.replace(/\/+$/, "");
    const url = `${apiUrl}/instance/info/${encodeURIComponent(config.instance_name)}`;
    const testedAt = new Date().toISOString();

    let resp: Response;
    try {
      resp = await fetch(url, {
        method: "GET",
        headers: { apikey: config.api_key, "Content-Type": "application/json" },
      });
    } catch (e) {
      const error = `Erro de rede: não foi possível acessar a URL da Evolution API. ${cleanMessage((e as Error)?.message ?? e)}`;
      await supabase
        .from("evolution_config")
        .update({ connection_status: "error", last_tested_at: testedAt, last_test_error: error })
        .eq("user_id", userId);
      return responseJson({ ok: false, status: 0, testedAt, error });
    }

    const text = await resp.text();
    let data: any = {};
    try {
      data = JSON.parse(text);
    } catch {
      // resposta não-JSON
    }

    let state: string | undefined;
    let error: string | null = null;

    if (!resp.ok) {
      error = formatHttpError(resp.status, text, data);
    } else {
      const instanceData = data?.data ?? data?.instance ?? data;
      const connected = instanceData?.connected;
      state = typeof connected === "boolean"
        ? (connected ? "open" : "close")
        : (instanceData?.state ?? data?.state);

      if (!state) {
        error = "Resposta 2xx, mas sem informação de estado da instância.";
      } else if (state !== "open") {
        error = `Instância não conectada. Estado retornado: "${state}".`;
      }
    }

    const connectionStatus = state ?? "error";

    await supabase
      .from("evolution_config")
      .update({ connection_status: connectionStatus, last_tested_at: testedAt, last_test_error: error })
      .eq("user_id", userId);

    return responseJson({ ok: state === "open", state, status: resp.status, testedAt, error });
  } catch (e) {
    return responseJson({ ok: false, error: cleanMessage((e as Error)?.message ?? e), testedAt: new Date().toISOString() }, 500);
  }
});
