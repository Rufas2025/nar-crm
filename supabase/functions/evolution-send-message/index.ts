import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

function cleanMessage(value: unknown) {
  const message = typeof value === "string" ? value : JSON.stringify(value ?? "");
  return message.replace(/apikey\s*[:=]\s*[^\s,}"']+/gi, "apikey: ***").slice(0, 500);
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
      return new Response(JSON.stringify({ error: "Não autenticado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = userData.user.id;

    const { leadId, phone, message } = await req.json();
    if (!phone || !message) {
      return new Response(JSON.stringify({ error: "phone e message são obrigatórios" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: config, error: configErr } = await supabase
      .from("evolution_config")
      .select("api_url, api_key, instance_name")
      .eq("user_id", userId)
      .maybeSingle();
    if (configErr) throw configErr;
    if (!config) {
      return new Response(
        JSON.stringify({ error: "Evolution API não configurada. Acesse Configurações." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const cleanPhone = phone.replace(/\D/g, "");
    const apiUrl = config.api_url.replace(/\/+$/, "");
    const sendUrl = `${apiUrl}/send/text`;

    let evoResp: Response;
    try {
      evoResp = await fetch(sendUrl, {
        method: "POST",
        headers: { apikey: config.api_key, "Content-Type": "application/json" },
        body: JSON.stringify({ number: cleanPhone, text: message }),
      });
    } catch (e) {
      return new Response(
        JSON.stringify({ ok: false, error: `Erro de rede ao enviar mensagem: ${cleanMessage((e as Error)?.message ?? e)}` }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const evoText = await evoResp.text();
    let evoData: any = {};
    try {
      evoData = JSON.parse(evoText);
    } catch {
      // resposta não-JSON
    }

    if (!evoResp.ok) {
      const details = cleanMessage(evoData?.message ?? evoData?.error ?? evoText ?? "sem corpo de resposta");
      return new Response(
        JSON.stringify({ ok: false, error: `Erro ${evoResp.status} ao enviar mensagem: ${details}` }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const evolutionMessageId = evoData?.key?.id ?? evoData?.data?.key?.id ?? null;

    await supabase.from("whatsapp_messages").insert({
      lead_id: leadId ?? null,
      user_id: userId,
      direction: "outbound",
      phone: cleanPhone,
      message,
      status: "sent",
      evolution_message_id: evolutionMessageId,
      raw_payload: evoData,
    });

    if (leadId) {
      await supabase.from("activities").insert({
        lead_id: leadId,
        user_id: userId,
        tipo: "whatsapp",
        descricao: `WhatsApp enviado via Evolution API: "${message.slice(0, 200)}"`,
      });

      await supabase
        .from("leads")
        .update({ lead_status: "em_contato", ultimo_contato_at: new Date().toISOString() })
        .eq("id", leadId);
    }

    return new Response(JSON.stringify({ ok: true, data: evoData }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: cleanMessage((e as Error)?.message ?? e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
