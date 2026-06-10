import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@3";

const BodySchema = z.object({
  baseUrl: z.string().url().max(500),
  apiKey: z.string().min(1).max(500),
  instanceName: z.string().min(1).max(200),
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const parsed = BodySchema.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) {
      return new Response(
        JSON.stringify({ ok: false, error: "baseUrl, apiKey e instanceName são obrigatórios e válidos" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const { baseUrl, apiKey, instanceName } = parsed.data;

    const url = `${baseUrl.replace(/\/$/, "")}/instance/connectionState/${encodeURIComponent(instanceName)}`;
    const resp = await fetch(url, {
      method: "GET",
      headers: { apikey: apiKey, "Content-Type": "application/json" },
    });

    const text = await resp.text();
    let data: any = {};
    try {
      data = JSON.parse(text);
    } catch {
      // resposta não-JSON
    }

    if (!resp.ok) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: `HTTP ${resp.status}: ${data?.message ?? text?.slice(0, 300) ?? "sem corpo"}`,
          raw: data,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const state = data?.instance?.state ?? data?.state;
    if (!state) {
      return new Response(
        JSON.stringify({ ok: false, error: "Resposta 2xx, mas sem 'instance.state'.", raw: data }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ ok: true, state, raw: data }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String((e as Error)?.message ?? e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
