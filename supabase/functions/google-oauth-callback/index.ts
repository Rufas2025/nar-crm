import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const ALLOWED_EMAIL = "rufino@eduinfo.com.br";

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
  const base = stateObj.returnTo || "https://app.lovable.dev";
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
    const tokenJson = await tokenResp.json();
    if (!tokenResp.ok) {
      console.error("token exchange failed", tokenJson);
      return redirect(target("error", { reason: "token_exchange" }));
    }
    const accessToken: string = tokenJson.access_token;
    const refreshToken: string | undefined = tokenJson.refresh_token;
    const expiresIn: number = tokenJson.expires_in ?? 3600;
    const scope: string = tokenJson.scope ?? "";

    if (!refreshToken) {
      return redirect(target("error", { reason: "no_refresh_token" }));
    }

    const profResp = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/profile", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const prof = await profResp.json();
    const email = String(prof?.emailAddress || "").toLowerCase();
    if (!email) return redirect(target("error", { reason: "no_email" }));
    if (email !== ALLOWED_EMAIL.toLowerCase()) {
      return redirect(target("wrong_account", { email }));
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const expiresAt = new Date(Date.now() + (expiresIn - 60) * 1000).toISOString();
    const { error: upErr } = await admin.from("gmail_connections").upsert({
      user_id: stateObj.uid,
      email,
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_at: expiresAt,
      scope,
      connected_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" });
    if (upErr) {
      console.error("upsert gmail_connections", upErr);
      return redirect(target("error", { reason: "db_error" }));
    }
    return redirect(target("connected", { email }));
  } catch (e) {
    console.error(e);
    return redirect(target("error", { reason: "exception" }));
  }
});
