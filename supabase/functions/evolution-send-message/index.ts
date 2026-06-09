import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

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
      .select("*")
      .maybeSingle();
    if (configErr) throw configErr;
    if (!config) {
      return new Response(
        JSON.stringify({ error: "Evolution API não configurada. Acesse Configurações." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const cleanPhone = phone.replace(/\D/g, "");
    const sendUrl = `${config.base_url.replace(/\/$/, "")}/message/sendText/${config.instance_name}`;
    const evoResp = await fetch(sendUrl, {
      method: "POST",
      headers: { apikey: config.api_key, "Content-Type": "application/json" },
      body: JSON.stringify({ number: cleanPhone, text: message }),
    });
    const evoData = await evoResp.json().catch(() => ({}));

    if (!evoResp.ok) {
      return new Response(
        JSON.stringify({ ok: false, error: evoData?.message ?? `Erro HTTP ${evoResp.status}`, raw: evoData }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const evolutionMessageId = evoData?.key?.id ?? null;

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
    return new Response(JSON.stringify({ ok: false, error: String(e?.message ?? e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
