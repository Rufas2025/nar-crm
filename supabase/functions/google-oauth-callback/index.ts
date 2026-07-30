import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { upsertConnection } from "../_shared/gmail-connection.ts";

const ALLOWED_EMAIL = "rufino@eduinfo.com.br";
const DEFAULT_RETURN_TO = "https://app.lovable.dev";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

function decodeState(state: string): { uid?: string; returnTo?: string } {
  try {
    const padded = state.replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(padded));
  } catch {
    return {};
  }
}

/** Aceita apenas URLs absolutas https (ou localhost em dev) para o retorno. */
function safeReturnTo(raw: string | undefined): string {
  if (!raw) return DEFAULT_RETURN_TO;
  try {
    const url = new URL(raw);
    const isLocal = url.hostname === "localhost" || url.hostname === "127.0.0.1";
    if (url.protocol !== "https:" && !(url.protocol === "http:" && isLocal)) return DEFAULT_RETURN_TO;
    if (url.username || url.password) return DEFAULT_RETURN_TO;
    return url.toString();
  } catch {
    return DEFAULT_RETURN_TO;
  }
}

/** Extrai uma mensagem curta e sem segredos do corpo de erro de uma API Google. */
async function safeErrorMessage(resp: Response): Promise<string> {
  try {
    const text = await resp.text();
    if (!text) return resp.statusText || "sem corpo";
    try {
      const json = JSON.parse(text);
      const msg = json?.error?.message ?? json?.error_description ??
        (typeof json?.error === "string" ? json.error : null);
      if (msg) return String(msg).slice(0, 200);
    } catch { /* corpo não-JSON */ }
    return text.slice(0, 200);
  } catch {
    return resp.statusText || "corpo ilegível";
  }
}

function redirect(url: string) {
  return new Response(null, { status: 302, headers: { ...corsHeaders, Location: url } });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const u = new URL(req.url);
  const code = u.searchParams.get("code");
  const state = u.searchParams.get("state") || "";
  const err = u.searchParams.get("error");

  const stateObj = decodeState(state);
  const base = safeReturnTo(stateObj.returnTo);
  const target = (status: string, extra?: Record<string, string>) => {
    const sep = base.includes("?") ? "&" : "?";
    const qs = new URLSearchParams({ gmail: status, ...(extra ?? {}) }).toString();
    return `${base}${sep}${qs}`;
  };

  if (err) return redirect(target("error", { reason: err }));
  if (!code || !stateObj.uid) return redirect(target("error", { reason: "missing_code" }));

  try {
    const tokenResp = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: Deno.env.get("GOOGLE_CLIENT_ID")!,
        client_secret: Deno.env.get("GOOGLE_CLIENT_SECRET")!,
        redirect_uri: Deno.env.get("GOOGLE_REDIRECT_URI")!,
        grant_type: "authorization_code",
      }),
    });
    if (!tokenResp.ok) {
      // Nunca logar o corpo cru: pode ecoar o authorization code enviado.
      console.error("[google-oauth-callback] token exchange failed", { status: tokenResp.status });
      return redirect(target("error", { reason: "token_exchange", status: String(tokenResp.status) }));
    }
    const tokenJson = await tokenResp.json();
    const accessToken: string = tokenJson.access_token;
    const refreshToken: string | undefined = tokenJson.refresh_token;
    const expiresIn: number = tokenJson.expires_in ?? 3600;
    const scope: string = tokenJson.scope ?? "";

    if (!refreshToken) {
      return redirect(target("error", { reason: "no_refresh_token" }));
    }

    // OpenID userinfo: funciona com os escopos openid/email/profile e não exige
    // escopo de leitura do Gmail (gmail.compose não autoriza users.getProfile).
    const infoResp = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!infoResp.ok) {
      const message = await safeErrorMessage(infoResp);
      console.error("[google-oauth-callback] userinfo failed", { status: infoResp.status, message });
      return redirect(target("error", { reason: "userinfo_failed", status: String(infoResp.status) }));
    }
    const info = await infoResp.json().catch(() => null);
    const email = String(info?.email ?? "").toLowerCase();
    if (!email) {
      console.error("[google-oauth-callback] userinfo sem email", { status: infoResp.status });
      return redirect(target("error", { reason: "no_email", status: String(infoResp.status) }));
    }
    if (email !== ALLOWED_EMAIL.toLowerCase()) {
      return redirect(target("wrong_account", { email }));
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const expiresAt = new Date(Date.now() + (expiresIn - 60) * 1000).toISOString();
    const { error: upErr } = await upsertConnection(admin, {
      userId: stateObj.uid,
      email,
      accessToken,
      refreshToken,
      expiresAt,
      scope,
    });
    if (upErr) {
      console.error("[google-oauth-callback] upsert gmail_connections", { message: upErr });
      return redirect(target("error", { reason: "db_error" }));
    }
    return redirect(target("connected", { email }));
  } catch (e) {
    console.error("[google-oauth-callback] exception", e instanceof Error ? e.message : String(e));
    return redirect(target("error", { reason: "exception" }));
  }
});
