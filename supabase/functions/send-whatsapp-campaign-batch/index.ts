import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { cleanMessage } from "../_shared/evolutionGoClient.ts";
import { loadEvolutionConfig } from "../_shared/config.ts";
import { sendWhatsappPayload, AttachmentRecord } from "../_shared/sendDispatch.ts";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Processa um lote (até `batch_size` destinatários "pending") de uma campanha
 * "running", aplicando `delay_between_messages_seconds` entre cada envio.
 * O frontend chama esta function repetidamente, aguardando
 * `delay_between_batches_seconds` entre cada chamada, até `done: true`.
 * Pode ser interrompida entre envios se o status da campanha mudar para
 * "paused"/"cancelled" (ex.: o usuário clicou em Pausar).
 */
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

    const { campaignId } = await req.json();
    if (!campaignId) {
      return new Response(JSON.stringify({ error: "campaignId é obrigatório" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: campaign, error: campErr } = await supabase
      .from("whatsapp_campaigns")
      .select("*")
      .eq("id", campaignId)
      .eq("user_id", userId)
      .maybeSingle();
    if (campErr) throw campErr;
    if (!campaign) {
      return new Response(JSON.stringify({ error: "Campanha não encontrada." }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (campaign.status !== "running") {
      return new Response(JSON.stringify({ ok: true, done: true, processed: 0, campaign }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const config = await loadEvolutionConfig(supabase, userId);
    if (!config) {
      return new Response(JSON.stringify({ ok: false, error: "Evolution API não configurada. Acesse Configurações." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let attachment: AttachmentRecord | null = null;
    const { data: attRows, error: attErr } = await supabase
      .from("whatsapp_message_attachments")
      .select("id, file_name, file_path, file_type")
      .eq("campaign_id", campaignId)
      .limit(1);
    if (attErr) throw attErr;
    if (attRows && attRows.length > 0) attachment = attRows[0] as AttachmentRecord;

    const { data: recipients, error: recErr } = await supabase
      .from("whatsapp_campaign_recipients")
      .select("*")
      .eq("campaign_id", campaignId)
      .eq("status", "pending")
      .order("created_at", { ascending: true })
      .limit(campaign.batch_size);
    if (recErr) throw recErr;

    if (!recipients || recipients.length === 0) {
      const { data: completed, error: doneErr } = await supabase
        .from("whatsapp_campaigns")
        .update({ status: "completed", completed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq("id", campaignId)
        .select()
        .single();
      if (doneErr) throw doneErr;
      return new Response(JSON.stringify({ ok: true, done: true, processed: 0, campaign: completed }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let sentCount = 0;
    let failedCount = 0;

    for (let i = 0; i < recipients.length; i++) {
      const recipient = recipients[i];

      // Permite pausar/cancelar a campanha entre envios.
      const { data: liveCampaign } = await supabase
        .from("whatsapp_campaigns")
        .select("status")
        .eq("id", campaignId)
        .single();
      if (liveCampaign?.status !== "running") break;

      const evoResult = await sendWhatsappPayload(supabase, config, {
        phone: recipient.phone,
        message: recipient.message_content,
        link: campaign.link,
        attachment,
      });

      if (evoResult.ok) {
        const evolutionMessageId = evoResult.data?.key?.id ?? evoResult.data?.data?.key?.id ?? null;

        await supabase.from("whatsapp_campaign_recipients").update({
          status: "sent",
          evolution_message_id: evolutionMessageId,
          sent_at: new Date().toISOString(),
          error_message: null,
        }).eq("id", recipient.id);

        await supabase.from("whatsapp_messages").insert({
          lead_id: recipient.lead_id,
          user_id: userId,
          direction: "outbound",
          phone: recipient.phone,
          message: recipient.message_content,
          link: campaign.link,
          attachment_id: attachment?.id ?? null,
          campaign_id: campaignId,
          status: "sent",
          evolution_message_id: evolutionMessageId,
          raw_payload: evoResult.data,
        });

        if (recipient.lead_id) {
          await supabase.from("activities").insert({
            lead_id: recipient.lead_id,
            user_id: userId,
            tipo: "whatsapp",
            descricao: `WhatsApp (campanha "${campaign.name}") enviado: "${String(recipient.message_content ?? "").slice(0, 200)}"`,
          });

          await supabase
            .from("leads")
            .update({ lead_status: "em_contato", ultimo_contato_at: new Date().toISOString() })
            .eq("id", recipient.lead_id);
        }

        sentCount++;
      } else {
        await supabase.from("whatsapp_campaign_recipients").update({
          status: "failed",
          error_message: evoResult.error ?? "Erro desconhecido ao enviar mensagem.",
        }).eq("id", recipient.id);
        failedCount++;
      }

      const isLast = i === recipients.length - 1;
      if (!isLast && campaign.delay_between_messages_seconds > 0) {
        await sleep(campaign.delay_between_messages_seconds * 1000);
      }
    }

    const { count: pendingCount, error: pendingErr } = await supabase
      .from("whatsapp_campaign_recipients")
      .select("id", { count: "exact", head: true })
      .eq("campaign_id", campaignId)
      .eq("status", "pending");
    if (pendingErr) throw pendingErr;

    const updates: Record<string, unknown> = {
      sent_count: campaign.sent_count + sentCount,
      failed_count: campaign.failed_count + failedCount,
      updated_at: new Date().toISOString(),
    };

    let done = false;
    if ((pendingCount ?? 0) === 0) {
      updates.status = "completed";
      updates.completed_at = new Date().toISOString();
      done = true;
    }

    const { data: updatedCampaign, error: updErr } = await supabase
      .from("whatsapp_campaigns")
      .update(updates)
      .eq("id", campaignId)
      .select()
      .single();
    if (updErr) throw updErr;

    return new Response(
      JSON.stringify({
        ok: true,
        done,
        processed: sentCount + failedCount,
        sent: sentCount,
        failed: failedCount,
        remaining: pendingCount ?? 0,
        campaign: updatedCampaign,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: cleanMessage((e as Error)?.message ?? e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
