// Receives HTML + images (as base64 data URLs) and uploads each to the
// private "email-assets" bucket under the authenticated user's folder.
// Returns signed URLs (1 year) and a rewritten HTML so images are Gmail-safe.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SIGNED_EXPIRES = 60 * 60 * 24 * 365; // 1 year

interface ImagePayload {
  src: string;
  dataUrl?: string;
}

interface RequestBody {
  html: string;
  campaignId?: string;
  images?: ImagePayload[];
}

function extFromMime(mime: string): string {
  if (mime.includes("png")) return "png";
  if (mime.includes("webp")) return "webp";
  if (mime.includes("gif")) return "gif";
  if (mime.includes("svg")) return "svg";
  return "jpg";
}

function dataUrlToBytes(dataUrl: string): { bytes: Uint8Array; mime: string } {
  const m = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!m) throw new Error("Invalid data URL");
  const mime = m[1];
  const b64 = m[2];
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return { bytes, mime };
}

function uuid(): string {
  return crypto.randomUUID();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace(/^Bearer\s+/i, "");

    // Identify the user from the JWT
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(
        JSON.stringify({ error: "Not authenticated" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    const userId = userData.user.id;

    const body: RequestBody = await req.json();
    let html = body.html ?? "";
    const campaignId = (body.campaignId ?? "campaign").replace(/[^a-z0-9-_]/gi, "-");
    const images = body.images ?? [];

    const admin = createClient(supabaseUrl, serviceKey);

    const replacements: { src: string; public_url: string }[] = [];

    for (const img of images) {
      if (!img.dataUrl) continue;
      try {
        const { bytes, mime } = dataUrlToBytes(img.dataUrl);
        const ext = extFromMime(mime);
        const path = `${userId}/${campaignId}/${uuid()}.${ext}`;
        const { error: upErr } = await admin.storage
          .from("email-assets")
          .upload(path, bytes, { contentType: mime, upsert: false });
        if (upErr) throw upErr;

        const { data: signed, error: signErr } = await admin.storage
          .from("email-assets")
          .createSignedUrl(path, SIGNED_EXPIRES);
        if (signErr || !signed?.signedUrl) throw signErr ?? new Error("sign failed");

        const publicUrl = signed.signedUrl;
        // Replace every occurrence of the original src in the HTML
        const escaped = img.src.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        html = html.replace(new RegExp(escaped, "g"), publicUrl);
        replacements.push({ src: img.src, public_url: publicUrl });
      } catch (e) {
        console.error("upload failed", e);
        // continue to next image
      }
    }

    return new Response(
      JSON.stringify({
        html,
        replacements,
        uploaded_count: replacements.length,
        bucket_public: false,
        access: "signed",
        public_url: replacements[0]?.public_url,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("prepare-email-assets error", msg);
    return new Response(
      JSON.stringify({ error: msg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
