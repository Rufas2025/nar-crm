// Cliente mínimo para o backend "Evolution GO".
//
// Endpoints confirmados:
// - POST {apiUrl}/send/text   body: { number, text }
// - POST {apiUrl}/send/media  body: { number, url, type, caption?, filename? }
//   type aceito: "image" | "video" | "audio" | "document" (também existe "ptv",
//   não usado aqui). Validação no servidor: image precisa ser jpeg/png/webp,
//   video precisa ser mp4 — outros formatos retornam erro 4xx com mensagem.
// - GET  {apiUrl}/instance/info/{instanceName}
//
// Não existem /send/image, /send/video, /send/document, /send/audio nem
// /send/link — links são enviados como texto (o preview é gerado pelo WhatsApp
// a partir da URL presente na mensagem).

export type EvolutionConfig = {
  apiUrl: string;
  apiKey: string;
  instanceName: string;
};

export type EvolutionMediaType = "image" | "video" | "audio" | "document";

export type EvolutionResult = {
  ok: boolean;
  status: number;
  data: any;
  error?: string;
};

/** Mascara a apikey e qualquer JSON grande antes de logar/retornar ao cliente. */
export function cleanMessage(value: unknown): string {
  const message = typeof value === "string" ? value : JSON.stringify(value ?? "");
  return message.replace(/apikey\s*[:=]\s*[^\s,}"']+/gi, "apikey: ***").slice(0, 500);
}

const MEDIA_TYPE_LABEL: Record<EvolutionMediaType, string> = {
  image: "imagem",
  video: "vídeo",
  audio: "áudio",
  document: "documento",
};

function buildUrl(config: EvolutionConfig, path: string): string {
  return `${config.apiUrl.replace(/\/+$/, "")}${path}`;
}

async function evoFetch(config: EvolutionConfig, path: string, body: Record<string, unknown>): Promise<EvolutionResult> {
  let resp: Response;
  try {
    resp = await fetch(buildUrl(config, path), {
      method: "POST",
      headers: { apikey: config.apiKey, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch (e) {
    return { ok: false, status: 0, data: null, error: `Erro de rede ao acessar a Evolution API: ${cleanMessage((e as Error)?.message ?? e)}` };
  }

  const text = await resp.text();
  let data: any = {};
  try {
    data = JSON.parse(text);
  } catch {
    // resposta não-JSON
  }

  if (!resp.ok) {
    const details = cleanMessage(data?.message ?? data?.error ?? text ?? "sem corpo de resposta");
    return { ok: false, status: resp.status, data, error: `Erro ${resp.status}: ${details}` };
  }

  return { ok: true, status: resp.status, data };
}

/** POST /send/text — também usado para mensagens com link (URL embutida no texto). */
export async function sendText(config: EvolutionConfig, params: { number: string; text: string }): Promise<EvolutionResult> {
  return evoFetch(config, "/send/text", { number: params.number, text: params.text });
}

/** POST /send/media — base para sendImage/sendVideo/sendDocument/sendAudio. */
export async function sendMedia(
  config: EvolutionConfig,
  params: { number: string; url: string; type: EvolutionMediaType; caption?: string; filename?: string }
): Promise<EvolutionResult> {
  const body: Record<string, unknown> = {
    number: params.number,
    url: params.url,
    type: params.type,
  };
  if (params.caption) body.caption = params.caption;
  if (params.filename) body.filename = params.filename;

  const result = await evoFetch(config, "/send/media", body);
  if (!result.ok) {
    const label = MEDIA_TYPE_LABEL[params.type];
    return { ...result, error: `Falha ao enviar ${label}: ${result.error}` };
  }
  return result;
}

export async function sendImage(config: EvolutionConfig, params: { number: string; url: string; caption?: string }): Promise<EvolutionResult> {
  return sendMedia(config, { ...params, type: "image" });
}

export async function sendVideo(config: EvolutionConfig, params: { number: string; url: string; caption?: string }): Promise<EvolutionResult> {
  return sendMedia(config, { ...params, type: "video" });
}

export async function sendDocument(config: EvolutionConfig, params: { number: string; url: string; filename: string; caption?: string }): Promise<EvolutionResult> {
  return sendMedia(config, { ...params, type: "document" });
}

export async function sendAudio(config: EvolutionConfig, params: { number: string; url: string }): Promise<EvolutionResult> {
  return sendMedia(config, { ...params, type: "audio" });
}

/** GET /instance/info/{instanceName} — usado pelo teste de conexão. */
export async function getInstanceInfo(config: EvolutionConfig): Promise<EvolutionResult> {
  let resp: Response;
  try {
    resp = await fetch(buildUrl(config, `/instance/info/${encodeURIComponent(config.instanceName)}`), {
      method: "GET",
      headers: { apikey: config.apiKey, "Content-Type": "application/json" },
    });
  } catch (e) {
    return { ok: false, status: 0, data: null, error: `Erro de rede: ${cleanMessage((e as Error)?.message ?? e)}` };
  }

  const text = await resp.text();
  let data: any = {};
  try {
    data = JSON.parse(text);
  } catch {
    // resposta não-JSON
  }

  if (!resp.ok) {
    const details = cleanMessage(data?.message ?? data?.error ?? text ?? "sem corpo de resposta");
    return { ok: false, status: resp.status, data, error: `Erro ${resp.status}: ${details}` };
  }

  return { ok: true, status: resp.status, data };
}
