const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const CRM_URL = "https://szdpzatugxkhaocdsfdc.supabase.co";
const CRM_ANON_KEY = "sb_publishable_Tufx7JnQ0snrfrPo3XCnGQ_UznvEfZX";

function jsonResponse(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function getCrmUserId(authToken: string): Promise<string | null> {
  try {
    const resp = await fetch(`${CRM_URL}/auth/v1/user`, {
      headers: { apikey: CRM_ANON_KEY, Authorization: `Bearer ${authToken}` },
    });
    const data = await resp.json().catch(() => null);
    if (!resp.ok || !data?.id) {
      console.warn("[google-oauth-start] CRM auth validation failed", { status: resp.status });
      return null;
    }
    return data.id as string;
  } catch (error) {
    console.error("[google-oauth-start] CRM auth validation exception", error instanceof Error ? error.message : String(error));
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const clientId = Deno.env.get("GOOGLE_CLIENT_ID");
    const clientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET");
    const redirectUri = Deno.env.get("GOOGLE_REDIRECT_URI");
    const authHeader = req.headers.get("Authorization") || "";

    console.log("[google-oauth-start] Authorization header received", Boolean(authHeader));
    console.log("[google-oauth-start] GOOGLE_CLIENT_ID found", Boolean(clientId));
    console.log("[google-oauth-start] GOOGLE_CLIENT_SECRET found", Boolean(clientSecret));
    console.log("[google-oauth-start] GOOGLE_REDIRECT_URI found", Boolean(redirectUri));
    console.log("[google-oauth-start] redirect URI", redirectUri || "missing");

    if (!clientId || !redirectUri) {
      return jsonResponse(500, { error: "Missing Google OAuth env vars" });
    }

    let returnTo = "";
    let bodyAuthToken = "";
    try {
      const body = await req.json();
      returnTo = String(body?.returnTo || "");
      bodyAuthToken = String(body?.authToken || "");
    } catch { /* ignore */ }

    const bearerToken = authHeader.replace(/^Bearer\s+/i, "");
    const authToken = bodyAuthToken || bearerToken;
    if (!authToken) {
      return jsonResponse(401, { error: "Unauthorized: missing user session token" });
    }

    const userId = await getCrmUserId(authToken);
    if (!userId) {
      return jsonResponse(401, { error: "Unauthorized: invalid user session token" });
    }

    const nonce = crypto.randomUUID();
    const stateObj = { uid: userId, nonce, returnTo };
    const state = btoa(JSON.stringify(stateObj))
      .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      access_type: "offline",
      prompt: "consent",
      include_granted_scopes: "true",
      scope: "https://www.googleapis.com/auth/gmail.compose openid email",
      state,
    });
    const url = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
    console.log("[google-oauth-start] authUrl generated", Boolean(url));
    return jsonResponse(200, { url });
  } catch (e) {
    return jsonResponse(500, { error: e instanceof Error ? e.message : String(e) });
  }
});
