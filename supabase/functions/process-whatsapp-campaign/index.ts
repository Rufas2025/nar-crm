import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { cleanMessage } from "../_shared/evolutionGoClient.ts";
import { normalizePhoneForWhatsapp } from "../_shared/phone.ts";
import { renderTemplate, buildLeadTemplateVariables, senderNameFromUser } from "../_shared/templates.ts";

type CampaignFilters = {
  cidade?: string;
  uf?: string;
  lead_status?: string;
  produto?: string;
  lead_ids?: string[];
};

/**
 * Inicia (ou retoma) uma campanha de WhatsApp:
 * - status "draft": gera os destinatários a partir dos filtros, personaliza a
 *   mensagem de cada um com o template + variáveis do lead, e marca a campanha
 *   como "running".
 * - status "paused": apenas volta para "running" (os destinatários já existem).
 * - status "running"/"completed"/"cancelled": retorna o estado atual sem alterações.
 *
 * O envio em si é feito por `send-whatsapp-campaign-batch`, chamado pelo
 * frontend em lotes sucessivos.
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

    if (campaign.status === "paused") {
      const { data: updated, error: updErr } = await supabase
        .from("whatsapp_campaigns")
        .update({ status: "running", updated_at: new Date().toISOString() })
        .eq("id", campaignId)
        .select()
        .single();
      if (updErr) throw updErr;
      return new Response(JSON.stringify({ ok: true, campaign: updated }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (campaign.status !== "draft") {
      return new Response(JSON.stringify({ ok: true, campaign }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // status === "draft" → gera destinatários a partir dos filtros
    const filters: CampaignFilters = campaign.filters ?? {};

    let leadsQuery = supabase
      .from("leads")
      .select("id, nome, empresa, telefone, cidade, uf, lead_status, email")
      .eq("user_id", userId);

    if (filters.lead_ids && filters.lead_ids.length > 0) {
      leadsQuery = leadsQuery.in("id", filters.lead_ids);
    } else {
      if (filters.cidade) leadsQuery = leadsQuery.ilike("cidade", filters.cidade);
      if (filters.uf) leadsQuery = leadsQuery.eq("uf", filters.uf);
      if (filters.lead_status) leadsQuery = leadsQuery.eq("lead_status", filters.lead_status);
    }

    const { data: leads, error: leadsErr } = await leadsQuery;
    if (leadsErr) throw leadsErr;

    let candidateLeads = leads ?? [];

    if (filters.produto) {
      const { data: prodRows, error: prodErr } = await supabase
        .from("lead_products")
        .select("lead_id")
        .eq("produto", filters.produto);
      if (prodErr) throw prodErr;
      const idsWithProduct = new Set((prodRows ?? []).map((r: { lead_id: string }) => r.lead_id));
      candidateLeads = candidateLeads.filter((l) => idsWithProduct.has(l.id));
    }

    const leadIds = candidateLeads.map((l) => l.id);
    const productsByLead: Record<string, string[]> = {};
    if (leadIds.length > 0) {
      const { data: allProds, error: allProdsErr } = await supabase
        .from("lead_products")
        .select("lead_id, produto")
        .in("lead_id", leadIds);
      if (allProdsErr) throw allProdsErr;
      for (const row of (allProds ?? []) as { lead_id: string; produto: string }[]) {
        (productsByLead[row.lead_id] ??= []).push(row.produto);
      }
    }

    const vendedor = senderNameFromUser(userData.user);

    const recipients = candidateLeads
      .map((lead) => {
        const phone = normalizePhoneForWhatsapp(lead.telefone);
        if (!phone) return null;
        const variables = buildLeadTemplateVariables(lead, productsByLead[lead.id] ?? [], vendedor);
        return {
          campaign_id: campaignId,
          lead_id: lead.id,
          user_id: userId,
          phone,
          message_content: renderTemplate(campaign.message_template, variables),
          status: "pending" as const,
        };
      })
      .filter((r): r is NonNullable<typeof r> => r !== null);

    if (recipients.length === 0) {
      return new Response(
        JSON.stringify({ ok: false, error: "Nenhum lead com telefone válido encontrado para os filtros selecionados." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { error: insertErr } = await supabase.from("whatsapp_campaign_recipients").insert(recipients);
    if (insertErr) throw insertErr;

    const { data: updatedCampaign, error: updateErr } = await supabase
      .from("whatsapp_campaigns")
      .update({
        status: "running",
        total_recipients: recipients.length,
        started_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", campaignId)
      .select()
      .single();
    if (updateErr) throw updateErr;

    return new Response(JSON.stringify({ ok: true, campaign: updatedCampaign, totalRecipients: recipients.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: cleanMessage((e as Error)?.message ?? e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
