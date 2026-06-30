import {
  corsHeaders, jsonResponse, getUserFromRequest, adminClient,
  getValidAccessToken, createSingleDraft,
} from "../_shared/gmail.ts";

interface BatchLead {
  leadId?: string | null;
  to: string;
  nome?: string;
  empresa?: string;
}

interface BatchInput {
  leads: BatchLead[];
  subject: string;
  htmlBody: string;
  plainTextBody: string;
  templateType?: string;
  campaignId: string;
}

function applyVars(tpl: string, lead: BatchLead): string {
  const nome = lead.nome || "";
  const firstName = nome.split(/\s+/)[0] || "";
  return tpl
    .replaceAll("{{nome}}", firstName)
    .replaceAll("{{nomeCompleto}}", nome)
    .replaceAll("{{empresa}}", lead.empresa || "")
    .replaceAll("{{email}}", lead.to);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const auth = await getUserFromRequest(req);
    if (!auth) return jsonResponse(401, { error: "Unauthorized" });
    const body = await req.json() as BatchInput;
    if (!Array.isArray(body.leads) || body.leads.length === 0) {
      return jsonResponse(400, { error: "Lista de leads vazia" });
    }
    if (body.leads.length > 20) {
      return jsonResponse(400, { error: "Máximo de 20 leads por lote" });
    }
    if (!body.campaignId) return jsonResponse(400, { error: "campaignId obrigatório" });
    if (!body.subject || !body.htmlBody || !body.plainTextBody) {
      return jsonResponse(400, { error: "Campos obrigatórios: subject, htmlBody, plainTextBody" });
    }

    const admin = adminClient();
    const { data: approval } = await admin
      .from("gmail_test_approvals").select("id")
      .eq("user_id", auth.userId).eq("campaign_id", body.campaignId).maybeSingle();
    if (!approval) {
      return jsonResponse(403, { error: "Crie um rascunho de teste e clique em 'Aprovar teste' antes do lote." });
    }

    const tok = await getValidAccessToken(admin, auth.userId);
    if ("error" in tok) return jsonResponse(412, { error: tok.error });

    const created: { leadId?: string | null; to: string; gmailDraftId: string; draftUrl: string }[] = [];
    const failed: { leadId?: string | null; to: string; error: string }[] = [];

    for (const lead of body.leads) {
      if (!lead.to || !lead.to.includes("@")) {
        failed.push({ leadId: lead.leadId ?? null, to: lead.to || "", error: "Email inválido" });
        continue;
      }
      const html = applyVars(body.htmlBody, lead);
      const text = applyVars(body.plainTextBody, lead);
      const subject = applyVars(body.subject, lead);
      const res = await createSingleDraft({
        admin, userId: auth.userId, accessToken: tok.accessToken, fromEmail: tok.email,
        input: {
          leadId: lead.leadId ?? null, to: lead.to, subject,
          htmlBody: html, plainTextBody: text,
          templateType: body.templateType, campaignId: body.campaignId, isTest: false,
        },
      });
      if (res.ok) {
        created.push({ leadId: lead.leadId ?? null, to: lead.to, gmailDraftId: res.gmailDraftId, draftUrl: res.draftUrl });
      } else {
        failed.push({ leadId: lead.leadId ?? null, to: lead.to, error: res.error });
      }
      await new Promise((r) => setTimeout(r, 300));
    }

    return jsonResponse(200, {
      created, failed, pending: [],
      summary: { total: body.leads.length, created: created.length, failed: failed.length },
    });
  } catch (e) {
    console.error(e);
    return jsonResponse(500, { error: e instanceof Error ? e.message : String(e) });
  }
});
