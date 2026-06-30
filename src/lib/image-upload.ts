import { supabase } from "@/lib/supabase";

const BUCKET = "email-assets";
const STORAGE_PUBLIC_FRAGMENT = "/storage/v1/object/public/email-assets/";
const STORAGE_SIGNED_FRAGMENT = "/storage/v1/object/sign/email-assets/";
const STORAGE_URL_RE = /https?:\/\/[^"'\s<>]*\.supabase\.co\/storage\/v1\/object\/(?:public|sign)\/email-assets\//i;

function extFromMime(mime: string): string {
  if (mime.includes("png")) return "png";
  if (mime.includes("webp")) return "webp";
  if (mime.includes("gif")) return "gif";
  if (mime.includes("svg")) return "svg";
  return "jpg";
}

function randomId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

async function compressForEmailUpload(blob: Blob): Promise<Blob> {
  const type = (blob.type || "").toLowerCase();
  if (!type.startsWith("image/") || type.includes("gif") || type.includes("svg")) return blob;
  const objectUrl = URL.createObjectURL(blob);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("Não foi possível processar a imagem."));
      image.src = objectUrl;
    });
    const maxWidth = 1200;
    const scale = Math.min(1, maxWidth / Math.max(1, img.naturalWidth));
    const width = Math.max(1, Math.round(img.naturalWidth * scale));
    const height = Math.max(1, Math.round(img.naturalHeight * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return blob;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);
    const compressed = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, "image/jpeg", 0.82);
    });
    if (!compressed) return blob;
    return compressed.size < blob.size ? compressed : blob;
  } catch {
    return blob;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

/**
 * Uploads a Blob/File directly to the email-assets bucket and returns the public URL.
 * Best-effort registers the asset in public.email_assets (failure is non-fatal).
 */
export async function uploadImage(file: Blob, hintName?: string): Promise<string> {
  const blob = await compressForEmailUpload(file);
  const ext = extFromMime(blob.type || "image/jpeg");
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData?.user?.id ?? "anonymous";
  const safeHint = (hintName || "image").replace(/[^a-z0-9-_]/gi, "-").slice(0, 40);
  const path = `${userId}/${randomId()}-${safeHint}.${ext}`;

  const { error: upErr } = await supabase.storage
    .from(BUCKET)
    .upload(path, blob, { contentType: blob.type || "image/jpeg", upsert: false });
  if (upErr) throw new Error(`Falha no upload: ${upErr.message}`);

  const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);
  const publicUrl = pub?.publicUrl;
  if (!publicUrl) throw new Error("Não foi possível obter a URL pública.");

  // Best-effort registry — don't block on schema mismatch.
  try {
    await (supabase as unknown as {
      from: (t: string) => { insert: (row: Record<string, unknown>) => Promise<unknown> };
    })
      .from("email_assets")
      .insert({
        user_id: userId === "anonymous" ? null : userId,
        file_path: path,
        public_url: publicUrl,
      });
  } catch {
    /* ignore */
  }

  return publicUrl;
}

export async function uploadFromUrl(localUrl: string, hintName?: string): Promise<string> {
  const res = await fetch(localUrl);
  if (!res.ok) throw new Error(`Falha ao baixar imagem (${res.status})`);
  const blob = await res.blob();
  return uploadImage(blob, hintName);
}

/** Returns true when a URL is NOT a public https URL safe to embed in an email. */
export function isUnsafeImageUrl(url: string): boolean {
  if (!url) return false;
  const u = url.trim().toLowerCase();
  if (u.startsWith("data:")) return true;
  if (u.startsWith("blob:")) return true;
  if (u.includes("localhost") || u.includes("127.0.0.1")) return true;
  if (u.includes("/src/assets")) return true;
  if (u.startsWith("/")) return true;
  if (!u.startsWith("http://") && !u.startsWith("https://")) return true;
  return false;
}

export function isEmailStorageUrl(url: string): boolean {
  const normalized = url.trim().toLowerCase();
  return normalized.includes(STORAGE_PUBLIC_FRAGMENT) || normalized.includes(STORAGE_SIGNED_FRAGMENT);
}

function extractImageSources(html: string): string[] {
  const sources = new Set<string>();
  const imgRe = /<img\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi;
  let match: RegExpExecArray | null;
  while ((match = imgRe.exec(html))) {
    if (match[1]) sources.add(match[1]);
  }
  return [...sources];
}

function assertFinalHtmlIsSafe(html: string) {
  const forbidden = [
    { re: /data:image/i, label: "data:image" },
    { re: /;base64,/i, label: "base64" },
    { re: /\bblob:/i, label: "blob:" },
    { re: /localhost|127\.0\.0\.1/i, label: "localhost" },
    { re: /\/src\/assets/i, label: "/src/assets" },
  ];
  const found = forbidden.find((item) => item.re.test(html));
  if (found) throw new Error(`HTML final ainda contém ${found.label}.`);
}

export type PreparedEmail = {
  html: string;
  public_url?: string;
  uploaded_count: number;
  replacements: { src: string; public_url: string }[];
  bucket_public?: boolean;
  access?: "public" | "signed";
};

/**
 * Prepares HTML for export. If every image already has a safe URL, returns
 * the HTML as-is without touching Supabase. Otherwise, uploads any unsafe
 * images directly from the browser and rewrites the HTML.
 */
export async function prepareEmailForExport(
  html: string,
  campaignId = "eduinfo-email-studio",
): Promise<PreparedEmail> {
  void campaignId;
  const sources = extractImageSources(html);
  const unsafeSources = sources.filter(isUnsafeImageUrl);

  if (unsafeSources.length === 0) {
    assertFinalHtmlIsSafe(html);
    return { html, uploaded_count: 0, replacements: [], access: "public", bucket_public: true };
  }

  const replacements: { src: string; public_url: string }[] = [];
  let workingHtml = html;

  for (const src of unsafeSources) {
    try {
      let blob: Blob;
      const lower = src.toLowerCase();
      if (lower.startsWith("data:image")) {
        const res = await fetch(src);
        blob = await res.blob();
      } else {
        const res = await fetch(src);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        blob = await res.blob();
      }
      const publicUrl = await uploadImage(blob, "email-img");
      const escaped = src.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      workingHtml = workingHtml.replace(new RegExp(escaped, "g"), publicUrl);
      replacements.push({ src, public_url: publicUrl });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new Error(`Falha ao enviar imagem para Storage: ${msg}`);
    }
  }

  assertFinalHtmlIsSafe(workingHtml);
  if (sources.length > 0 && !STORAGE_URL_RE.test(workingHtml) && replacements.length > 0) {
    throw new Error("HTML final não contém URL válida do Storage email-assets.");
  }

  return {
    html: workingHtml,
    uploaded_count: replacements.length,
    replacements,
    access: "public",
    bucket_public: true,
    public_url: replacements[0]?.public_url,
  };
}
