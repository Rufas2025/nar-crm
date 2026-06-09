import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { baseUrl, apiKey, instanceName } = await req.json();
    if (!baseUrl || !apiKey || !instanceName) {
      return new Response(
        JSON.stringify({ error: "baseUrl, apiKey e instanceName são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const url = `${baseUrl.replace(/\/$/, "")}/instance/connectionState/${instanceName}`;
    const resp = await fetch(url, { headers: { apikey: apiKey } });
    const data = await resp.json().catch(() => ({}));

    if (!resp.ok) {
      return new Response(
        JSON.stringify({ ok: false, error: data?.message ?? `Erro HTTP ${resp.status}`, raw: data }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const state = data?.instance?.state ?? data?.state ?? "unknown";
    return new Response(JSON.stringify({ ok: true, state, raw: data }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String(e?.message ?? e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
