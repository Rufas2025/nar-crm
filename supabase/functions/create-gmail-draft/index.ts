import {
  corsHeaders, jsonResponse, getUserFromRequest, adminClient,
  getValidAccessToken, createSingleDraft, DraftInput,
} from "../_shared/gmail.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const auth = await getUserFromRequest(req);
    if (!auth) return jsonResponse(401, { error: "Unauthorized" });
    const body = await req.json() as DraftInput;
    if (!body.to || !body.subject || !body.htmlBody || !body.plainTextBody) {
      return jsonResponse(400, { error: "Campos obrigatórios: to, subject, htmlBody, plainTextBody" });
    }
    const admin = adminClient();
    const tok = await getValidAccessToken(admin, auth.userId);
    if ("error" in tok) return jsonResponse(412, { error: tok.error });

    const result = await createSingleDraft({
      admin, userId: auth.userId, accessToken: tok.accessToken, fromEmail: tok.email, input: body,
    });
    if (!result.ok) return jsonResponse(502, { error: result.error });
    return jsonResponse(200, { gmailDraftId: result.gmailDraftId, draftUrl: result.draftUrl });
  } catch (e) {
    console.error(e);
    return jsonResponse(500, { error: e instanceof Error ? e.message : String(e) });
  }
});
