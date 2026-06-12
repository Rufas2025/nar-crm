import { supabase } from "@/lib/supabase";

export const ATTACHMENT_BUCKET = "whatsapp-attachments";
export const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024; // 10 MB

export const ALLOWED_IMAGE_MIMES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
export const ALLOWED_DOC_MIMES = ["application/pdf"];
export const ALLOWED_MIMES = [...ALLOWED_IMAGE_MIMES, ALLOWED_DOC_MIMES[0]];
export const ATTACHMENT_ACCEPT = ".jpg,.jpeg,.png,.webp,.pdf";

export type AttachmentKind = "image" | "document";

export function validateAttachment(file: File): { ok: true; kind: AttachmentKind } | { ok: false; error: string } {
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
 * e retorna uma URL assinada válida por 1h, pronta para ser consumida pela Edge Function.
 */
export async function uploadWhatsAppAttachment(file: File): Promise<UploadedAttachment> {
  const validated = validateAttachment(file);
  if (validated.ok !== true) throw new Error(validated.error);



  const { data: sess } = await supabase.auth.getSession();
  const userId = sess.session?.user?.id;
  if (!userId) throw new Error("Usuário não autenticado.");

  const ext = (file.name.split(".").pop() || "bin").toLowerCase().replace(/[^a-z0-9]/g, "");
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;

  const { error: upErr } = await supabase.storage
    .from(ATTACHMENT_BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });
  if (upErr) throw new Error(`Falha no upload: ${upErr.message}`);

  const { data: signed, error: signErr } = await supabase.storage
    .from(ATTACHMENT_BUCKET)
    .createSignedUrl(path, 60 * 60);
  if (signErr || !signed?.signedUrl) throw new Error("Falha ao gerar URL do anexo.");

  return {
    signedUrl: signed.signedUrl,
    fileName: file.name,
    kind: validated.kind,
    path,
  };
}
