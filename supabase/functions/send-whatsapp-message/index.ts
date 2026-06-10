import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { cleanMessage } from "../_shared/evolutionGoClient.ts";
import { loadEvolutionConfig } from "../_shared/config.ts";
import { normalizePhoneForWhatsapp } from "../_shared/phone.ts";
import { sendWhatsappPayload, AttachmentRecord } from "../_shared/sendDispatch.ts";

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

    const { leadId, phone, message, link, attachmentId, templateId } = await req.json();

    if (!phone) {
      return new Response(JSON.stringify({ error: "phone é obrigatório" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!message && !link && !attachmentId) {
      return new Response(JSON.stringify({ error: "Informe message, link ou attachmentId" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const cleanPhone = normalizePhoneForWhatsapp(phone);
    if (!cleanPhone) {
      return new Response(JSON.stringify({ error: "Telefone inválido para envio de WhatsApp." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const config = await loadEvolutionConfig(supabase, userId);
    if (!config) {
      return new Response(
        JSON.stringify({ error: "Evolution API não configurada. Acesse Configurações." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let attachment: AttachmentRecord | null = null;
    if (attachmentId) {
      const { data: att, error: attErr } = await supabase
        .from("whatsapp_message_attachments")
        .select("id, file_name, file_path, file_type")
        .eq("id", attachmentId)
        .eq("user_id", userId)
        .maybeSingle();
      if (attErr) throw attErr;
      if (!att) {
        return new Response(JSON.stringify({ ok: false, error: "Anexo não encontrado." }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      attachment = att as AttachmentRecord;
    }

    const evoResult = await sendWhatsappPayload(supabase, config, {
      phone: cleanPhone,
      message: message ?? null,
      link: link ?? null,
      attachment,
    });

    if (!evoResult.ok) {
      return new Response(JSON.stringify({ ok: false, error: evoResult.error }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const evolutionMessageId = evoResult.data?.key?.id ?? evoResult.data?.data?.key?.id ?? null;

    await supabase.from("whatsapp_messages").insert({
      lead_id: leadId ?? null,
      user_id: userId,
      direction: "outbound",
      phone: cleanPhone,
      message: message ?? null,
      link: link ?? null,
      attachment_id: attachmentId ?? null,
      template_id: templateId ?? null,
      status: "sent",
      evolution_message_id: evolutionMessageId,
      raw_payload: evoResult.data,
    });

    if (leadId) {
      const parts: string[] = [];
      if (message) parts.push(`"${String(message).slice(0, 200)}"`);
      if (link) parts.push(`link: ${link}`);
      if (attachment) parts.push(`anexo: ${attachment.file_name}`);

      await supabase.from("activities").insert({
        lead_id: leadId,
        user_id: userId,
        tipo: "whatsapp",
        descricao: `WhatsApp enviado via Evolution API: ${parts.join(" | ")}`,
      });

      await supabase
        .from("leads")
        .update({ lead_status: "em_contato", ultimo_contato_at: new Date().toISOString() })
        .eq("id", leadId);
    }

    return new Response(JSON.stringify({ ok: true, data: evoResult.data }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: cleanMessage((e as Error)?.message ?? e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
