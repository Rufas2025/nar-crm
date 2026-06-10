import type { SupabaseClient } from "npm:@supabase/supabase-js@2";
import { sendText, sendImage, sendVideo, sendDocument, sendAudio, EvolutionConfig, EvolutionResult, EvolutionMediaType } from "./evolutionGoClient.ts";

export type AttachmentRecord = {
  id: string;
  file_name: string;
  file_path: string;
  file_type: EvolutionMediaType;
};

const SIGNED_URL_TTL_SECONDS = 600;

/**
 * Envia uma mensagem (texto, link e/ou anexo) via Evolution GO.
 * Se houver anexo, gera uma URL assinada temporária do Storage para que a
 * Evolution GO baixe o arquivo; texto + link viram a legenda (caption).
 * Sem anexo, texto + link são enviados como mensagem de texto única.
 */
export async function sendWhatsappPayload(
  supabase: SupabaseClient,
  config: EvolutionConfig,
  params: { phone: string; message?: string | null; link?: string | null; attachment?: AttachmentRecord | null }
): Promise<EvolutionResult> {
  const { phone, message, link, attachment } = params;

  if (attachment) {
    const { data: signed, error: signErr } = await supabase.storage
      .from("whatsapp-attachments")
      .createSignedUrl(attachment.file_path, SIGNED_URL_TTL_SECONDS);

    if (signErr || !signed?.signedUrl) {
      return { ok: false, status: 0, data: null, error: "Erro ao gerar link temporário do anexo no Storage." };
    }

    const caption = [message, link].filter(Boolean).join("\n\n") || undefined;

    switch (attachment.file_type) {
      case "image":
        return sendImage(config, { number: phone, url: signed.signedUrl, caption });
      case "video":
        return sendVideo(config, { number: phone, url: signed.signedUrl, caption });
      case "document":
        return sendDocument(config, { number: phone, url: signed.signedUrl, filename: attachment.file_name, caption });
      case "audio":
        return sendAudio(config, { number: phone, url: signed.signedUrl });
      default:
        return { ok: false, status: 0, data: null, error: `Tipo de anexo não suportado: ${attachment.file_type}` };
    }
  }

  const text = [message, link].filter(Boolean).join("\n\n");
  return sendText(config, { number: phone, text });
}
