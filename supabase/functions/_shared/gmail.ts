// Shared helpers for Gmail draft edge functions.
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

export function jsonResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

export async function getUserFromRequest(req: Request): Promise<{ userId: string; client: SupabaseClient } | null> {
  const authHeader = req.headers.get("Authorization") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "");
  const client = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: `Bearer ${token}` } } },
  );
  const { data, error } = await client.auth.getClaims(token);
  if (error || !data?.claims?.sub) return null;
  return { userId: data.claims.sub as string, client };
}

export function adminClient(): SupabaseClient {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
}

export function validateGmailSafe(html: string): { ok: boolean; reason?: string } {
  const lower = html.toLowerCase();
  const checks: { needle: string; reason: string }[] = [
    { needle: "data:", reason: "HTML contém data: URL (base64). Suba imagens para Storage antes." },
    { needle: "base64,", reason: "HTML contém base64 inline." },
    { needle: "blob:", reason: "HTML contém blob: URL." },
    { needle: "localhost", reason: "HTML referencia localhost." },
    { needle: "/src/assets", reason: "HTML referencia /src/assets (caminho de dev)." },
  ];
  for (const c of checks) {
    if (lower.includes(c.needle)) return { ok: false, reason: c.reason };
  }
  return { ok: true };
}

export async function getValidAccessToken(admin: SupabaseClient, userId: string): Promise<{ accessToken: string; email: string } | { error: string }> {
  const { data: conn, error } = await admin.from("gmail_connections").select("*").eq("user_id", userId).maybeSingle();
  if (error || !conn) return { error: "Gmail não conectado" };
  const expiresAt = new Date(conn.expires_at).getTime();
  if (Date.now() < expiresAt - 30_000) {
    return { accessToken: conn.access_token, email: conn.email };
  }
  const resp = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: Deno.env.get("GOOGLE_CLIENT_ID")!,
      client_secret: Deno.env.get("GOOGLE_CLIENT_SECRET")!,
      refresh_token: conn.refresh_token,
      grant_type: "refresh_token",
    }),
  });
  const json = await resp.json();
  if (!resp.ok) {
    console.error("refresh token failed", json);
    return { error: "Falha ao renovar token Gmail. Reconecte." };
  }
  const newExpires = new Date(Date.now() + ((json.expires_in ?? 3600) - 60) * 1000).toISOString();
  await admin.from("gmail_connections").update({
    access_token: json.access_token,
    expires_at: newExpires,
    updated_at: new Date().toISOString(),
  }).eq("user_id", userId);
  return { accessToken: json.access_token, email: conn.email };
}

function encodeHeader(value: string): string {
  // RFC 2047 encoded-word for any non-ASCII headers (subject, names).
  if (/^[\x00-\x7F]*$/.test(value)) return value;
  const b64 = btoa(unescape(encodeURIComponent(value)));
  return `=?UTF-8?B?${b64}?=`;
}

export function buildMimeMessage(opts: {
  to: string;
  from: string;
  subject: string;
  html: string;
  text: string;
}): string {
  const boundary = `=_bnd_${crypto.randomUUID().replace(/-/g, "")}`;
  const parts = [
    `To: ${opts.to}`,
    `From: ${opts.from}`,
    `Subject: ${encodeHeader(opts.subject)}`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    "",
    `--${boundary}`,
    'Content-Type: text/plain; charset="UTF-8"',
    "Content-Transfer-Encoding: base64",
    "",
    btoa(unescape(encodeURIComponent(opts.text))),
    `--${boundary}`,
    'Content-Type: text/html; charset="UTF-8"',
    "Content-Transfer-Encoding: base64",
    "",
    btoa(unescape(encodeURIComponent(opts.html))),
    `--${boundary}--`,
    "",
  ];
  const mime = parts.join("\r\n");
  return btoa(unescape(encodeURIComponent(mime)))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export interface DraftInput {
  leadId?: string | null;
  to: string;
  subject: string;
  htmlBody: string;
  plainTextBody: string;
  templateType?: string;
  campaignId?: string | null;
  isTest?: boolean;
}

export async function createSingleDraft(opts: {
  admin: SupabaseClient;
  userId: string;
  accessToken: string;
  fromEmail: string;
  input: DraftInput;
}): Promise<{ ok: true; gmailDraftId: string; draftUrl: string } | { ok: false; error: string }> {
  const { admin, userId, accessToken, fromEmail, input } = opts;
  const safe = validateGmailSafe(input.htmlBody);
  if (!safe.ok) {
    await admin.from("gmail_drafts").insert({
      user_id: userId, lead_id: input.leadId ?? null, campaign_id: input.campaignId ?? null,
      to_email: input.to, subject: input.subject, template_type: input.templateType ?? null,
      status: "failed", error_message: safe.reason, is_test: !!input.isTest,
    });
    return { ok: false, error: safe.reason || "HTML inválido" };
  }
  const raw = buildMimeMessage({
    to: input.to, from: fromEmail, subject: input.subject,
    html: input.htmlBody, text: input.plainTextBody,
  });
  const resp = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/drafts", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ message: { raw } }),
  });
  const json = await resp.json();
  if (!resp.ok) {
    const msg = json?.error?.message || `Gmail API ${resp.status}`;
    await admin.from("gmail_drafts").insert({
      user_id: userId, lead_id: input.leadId ?? null, campaign_id: input.campaignId ?? null,
      to_email: input.to, subject: input.subject, template_type: input.templateType ?? null,
      status: "failed", error_message: msg, is_test: !!input.isTest,
    });
    return { ok: false, error: msg };
  }
  const draftId = json.id as string;
  const messageId = json.message?.id as string | undefined;
  await admin.from("gmail_drafts").insert({
    user_id: userId, lead_id: input.leadId ?? null, campaign_id: input.campaignId ?? null,
    gmail_draft_id: draftId, to_email: input.to, subject: input.subject,
    template_type: input.templateType ?? null, status: "created", is_test: !!input.isTest,
  });
  const draftUrl = messageId
    ? `https://mail.google.com/mail/u/0/#drafts/${messageId}`
    : `https://mail.google.com/mail/u/0/#drafts`;
  return { ok: true, gmailDraftId: draftId, draftUrl };
}
