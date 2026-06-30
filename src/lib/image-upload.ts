import { supabase } from "@/integrations/supabase/client";

const BUCKET = "email-assets";
const STORAGE_PUBLIC_FRAGMENT = "/storage/v1/object/public/email-assets/";
const STORAGE_SIGNED_FRAGMENT = "/storage/v1/object/sign/email-assets/";
const STORAGE_URL_RE = /https:\/\/[^"'\s<>]*\.supabase\.co\/storage\/v1\/object\/(?:public|sign)\/email-assets\//i;

function extFromType(mime: string): string {
  if (mime.includes("png")) return "png";
  if (mime.includes("webp")) return "webp";
  if (mime.includes("gif")) return "gif";
  if (mime.includes("svg")) return "svg";
  return "jpg";
}

/**
 * Uploads a Blob/File to the email-assets bucket and returns the public URL.
 * The bucket has a public SELECT policy, so getPublicUrl() works without signing.
 */
export async function uploadImage(file: Blob, hintName?: string): Promise<string> {
  const uploadBlob = await compressForEmailUpload(file);
  const marker = `eduinfo-upload-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const prepared = await callPrepareEmailAssets(`<img src="${marker}">`, hintName || "eduinfo-image", [
    { src: marker, dataUrl: await blobToDataUrl(uploadBlob) },
  ]);
  const publicUrl = prepared.replacements[0]?.public_url || prepared.public_url;
  if (!publicUrl || !isEmailStorageUrl(publicUrl)) {
    throw new Error("O upload concluiu, mas não retornou uma URL válida do Storage.");
  }
  return publicUrl;
}

/**
 * Fetches a (typically bundled local) asset URL, uploads it to storage and returns the public URL.
 * Used to promote bundled presets to Gmail-safe URLs.
 */
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
  // bundled vite asset path
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

function shouldSendToStorage(src: string): boolean {
  if (!src) return false;
  return !isEmailStorageUrl(src);
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Não foi possível ler a imagem local."));
    reader.readAsDataURL(blob);
  });
}

async function compressForEmailUpload(blob: Blob): Promise<Blob> {
  const type = (blob.type || "").toLowerCase();
  if (!type.startsWith("image/") || type.includes("gif") || type.includes("svg")) return blob;

  const objectUrl = URL.createObjectURL(blob);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("Não foi possível preparar a imagem local para upload."));
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

async function payloadForSource(src: string): Promise<{ src: string; dataUrl?: string }> {
  const normalized = src.trim();
  const lower = normalized.toLowerCase();

  if (lower.startsWith("data:image")) {
    const blob = await (await fetch(normalized)).blob();
    const uploadBlob = await compressForEmailUpload(blob);
    return { src: normalized, dataUrl: await blobToDataUrl(uploadBlob) };
  }

  const mustResolveInBrowser =
    lower.startsWith("blob:") ||
    lower.startsWith("/") ||
    lower.includes("localhost") ||
    lower.includes("127.0.0.1") ||
    (!lower.startsWith("http://") && !lower.startsWith("https://"));

  if (!mustResolveInBrowser) return { src: normalized };

  const res = await fetch(normalized);
  if (!res.ok) throw new Error(`Falha ao baixar imagem local (${res.status}).`);
  const blob = await res.blob();
  const uploadBlob = await compressForEmailUpload(blob);
  return { src: normalized, dataUrl: await blobToDataUrl(uploadBlob) };
}

export type PreparedEmail = {
  html: string;
  public_url?: string;
  uploaded_count: number;
  replacements: { src: string; public_url: string }[];
  bucket_public?: boolean;
  access?: "public" | "signed";
};

function assertFinalHtmlIsSafe(html: string) {
  const forbidden = [
    { re: /data:image/i, label: "data:image" },
    { re: /base64/i, label: "base64" },
    { re: /\bblob:/i, label: "blob:" },
    { re: /localhost|127\.0\.0\.1/i, label: "localhost" },
    { re: /\/src\/assets/i, label: "/src/assets" },
  ];
  const found = forbidden.find((item) => item.re.test(html));
  if (found) throw new Error(`HTML final ainda contém ${found.label}.`);
}

function assertFinalHtmlUsesEmailStorage(html: string) {
  if (extractImageSources(html).length > 0 && !STORAGE_URL_RE.test(html)) {
    throw new Error("HTML final não contém URL válida do Storage email-assets.");
  }
}

async function callPrepareEmailAssets(
  html: string,
  campaignId: string,
  images: { src: string; dataUrl?: string }[],
): Promise<PreparedEmail> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;
  if (!supabaseUrl) throw new Error("Configuração do Storage indisponível no app.");

  let response: Response;
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 45000);
  try {
    response = await fetch(`${supabaseUrl}/functions/v1/prepare-email-assets`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(publishableKey ? { apikey: publishableKey } : {}),
        ...(publishableKey ? { Authorization: `Bearer ${publishableKey}` } : {}),
      },
      signal: controller.signal,
      body: JSON.stringify({ html, campaignId, images }),
    });
  } catch {
    throw new Error("Edge Function prepare-email-assets não está disponível ou não foi publicada no Supabase.");
  } finally {
    window.clearTimeout(timeout);
  }

  const raw = await response.text();
  let parsed: Partial<PreparedEmail> & { error?: string } = {};
  try {
    parsed = raw ? JSON.parse(raw) : {};
  } catch {
    parsed = {};
  }

  if (!response.ok) {
    if (response.status === 404 && !parsed.error) {
      throw new Error("Edge Function prepare-email-assets não está disponível ou não foi publicada no Supabase.");
    }
    throw new Error(parsed.error || raw || "Falha ao preparar imagens para exportação.");
  }

  return {
    html: parsed.html || html,
    public_url: parsed.public_url,
    uploaded_count: parsed.uploaded_count ?? parsed.replacements?.length ?? 0,
    replacements: parsed.replacements || [],
    bucket_public: parsed.bucket_public,
    access: parsed.access,
  };
}

export async function prepareEmailForExport(
  html: string,
  campaignId = "eduinfo-email-studio",
): Promise<PreparedEmail> {
  const imageSources = extractImageSources(html);
  const sources = imageSources.filter(shouldSendToStorage);

  if (imageSources.length === 0) {
    assertFinalHtmlIsSafe(html);
    return { html, uploaded_count: 0, replacements: [] };
  }

  if (sources.length === 0) {
    assertFinalHtmlIsSafe(html);
    assertFinalHtmlUsesEmailStorage(html);
    return { html, uploaded_count: 0, replacements: [] };
  }

  const images = await Promise.all(sources.map(payloadForSource));
  const prepared = await callPrepareEmailAssets(html, campaignId, images);

  assertFinalHtmlIsSafe(prepared.html);
  assertFinalHtmlUsesEmailStorage(prepared.html);

  return prepared;
}
