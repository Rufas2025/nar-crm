import { supabase } from "@/lib/supabase";

export const ATTACHMENT_BUCKET = "whatsapp-attachments";
export const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024; // 10 MB
/** Acesso temporário apenas para a janela do disparo (30 min). */
export const SIGNED_URL_TTL_SECONDS = 30 * 60;

export const ALLOWED_IMAGE_MIMES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
export const ALLOWED_DOC_MIMES = ["application/pdf"];
export const ALLOWED_MIMES = [...ALLOWED_IMAGE_MIMES, ALLOWED_DOC_MIMES[0]];
export const ATTACHMENT_ACCEPT = ".jpg,.jpeg,.png,.webp,.pdf";

export type AttachmentKind = "image" | "document";

export type AttachmentValidation =
  | { ok: true; kind: AttachmentKind; error?: undefined }
  | { ok: false; kind?: undefined; error: string };

export function validateAttachment(file: File): AttachmentValidation {
  if (file.size > MAX_ATTACHMENT_BYTES) {
    return { ok: false, error: "Arquivo muito grande. Máximo 10 MB." };
  }
  const mime = file.type.toLowerCase();
  if (ALLOWED_IMAGE_MIMES.includes(mime)) return { ok: true, kind: "image" };
  if (ALLOWED_DOC_MIMES.includes(mime)) return { ok: true, kind: "document" };
  return { ok: false, error: "Formato inválido. Aceitos: JPG, PNG, WEBP ou PDF." };
}


export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export type UploadedAttachment = {
  signedUrl: string;
  fileName: string;
  kind: AttachmentKind;
  path: string;
};

/**
 * Faz upload do arquivo no bucket privado `whatsapp-attachments` sob `<userId>/<uuid>.<ext>`
 * e retorna uma URL assinada válida por 30 minutos, pronta para ser consumida pela Edge Function.
 */
export async function uploadWhatsAppAttachment(file: File): Promise<UploadedAttachment> {
  const validated = validateAttachment(file);
  if (!validated.ok) throw new Error(validated.error || "Arquivo inválido.");
  const kind: AttachmentKind = validated.kind;





  const { data: sess } = await supabase.auth.getSession();
  const userId = sess.session?.user?.id;
  if (!userId) throw new Error("Usuário não autenticado.");

  const ext = (file.name.split(".").pop() || "bin").toLowerCase().replace(/[^a-z0-9]/g, "");
  const baseName = file.name
    .replace(/\.[^.]+$/, "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9-_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "arquivo";
  const day = new Date().toISOString().slice(0, 10);
  const path = `${userId}/${day}/${crypto.randomUUID()}-${baseName}.${ext}`;

  const { error: upErr } = await supabase.storage
    .from(ATTACHMENT_BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });
  if (upErr) throw new Error(`Falha no upload: ${upErr.message}`);

  const { data: signed, error: signErr } = await supabase.storage
    .from(ATTACHMENT_BUCKET)
    .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);
  if (signErr || !signed?.signedUrl) throw new Error("Falha ao gerar URL do anexo.");

  return {
    signedUrl: signed.signedUrl,
    fileName: file.name,
    kind,
    path,
  };

}
