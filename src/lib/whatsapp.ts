import { Lead } from "@/lib/supabase";

// ─── Telefone ──────────────────────────────────────────────────────────────

/**
 * Normaliza um telefone brasileiro para o formato exigido pela Evolution GO
 * (DDI 55 + DDD + número, somente dígitos). Ex: "11944739073" → "5511944739073".
 * Retorna null se não for possível normalizar.
 */
export function normalizePhoneForWhatsapp(rawPhone: string | null | undefined): string | null {
  if (!rawPhone) return null;
  let digits = rawPhone.replace(/\D/g, "");
  if (!digits) return null;

  // Remove "0" de discagem antes do DDD (ex: 0 11 94473-9073)
  if (digits.length === 12 && digits.startsWith("0")) {
    digits = digits.slice(1);
  }

  // Já tem DDI 55 (DDD + celular = 13, ou DDD + fixo = 12)
  if (digits.startsWith("55") && (digits.length === 12 || digits.length === 13)) {
    return digits;
  }

  // DDD + número, sem DDI
  if (digits.length === 10 || digits.length === 11) {
    return `55${digits}`;
  }

  return null;
}

// ─── Templates ─────────────────────────────────────────────────────────────

export type WhatsappTemplateVariable = {
  key: string;
  label: string;
};

export const WHATSAPP_TEMPLATE_VARIABLES: WhatsappTemplateVariable[] = [
  { key: "nome", label: "Nome do contato" },
  { key: "empresa", label: "Instituição / Escola" },
  { key: "escola", label: "Escola (mesmo valor de empresa)" },
  { key: "cidade", label: "Cidade" },
  { key: "uf", label: "UF" },
  { key: "estado", label: "Estado (mesmo valor de UF)" },
  { key: "status", label: "Status do lead" },
  { key: "produtos", label: "Produtos de interesse" },
  { key: "email", label: "E-mail do contato" },
  { key: "telefone", label: "Telefone do contato" },
  { key: "vendedor", label: "Seu nome (remetente)" },
];

/** Saudações automáticas pré-definidas (editáveis pelo usuário antes do envio). */
export type WhatsappGreetingPreset = { id: string; label: string; template: string };

export const WHATSAPP_GREETING_PRESETS: WhatsappGreetingPreset[] = [
  { id: "ola", label: "Olá, {{nome}}, tudo bem?", template: "Olá, {{nome}}, tudo bem?" },
  { id: "bom_dia", label: "Bom dia, {{nome}}, tudo bem?", template: "Bom dia, {{nome}}, tudo bem?" },
  { id: "boa_tarde", label: "Boa tarde, {{nome}}, tudo bem?", template: "Boa tarde, {{nome}}, tudo bem?" },
  { id: "boa_noite", label: "Boa noite, {{nome}}, tudo bem?", template: "Boa noite, {{nome}}, tudo bem?" },
  { id: "oi", label: "Oi, {{nome}}, tudo bem?", template: "Oi, {{nome}}, tudo bem?" },
];

export const NO_GREETING_ID = "none";

/** Rótulos legíveis para a variável {{status}}. */
export const LEAD_STATUS_LABELS: Record<string, string> = {
  novo: "Novo",
  em_contato: "Em Contato",
  qualificado: "Qualificado",
  fechado: "Fechado",
  perdido: "Perdido",
};

type EdgeFunctionError = { message?: string; context?: Response } | null | undefined;

/** Extrai uma mensagem de erro legível do retorno de `supabase.functions.invoke(...)`. */
export async function getEdgeFunctionError(data: { error?: string } | null | undefined, error: EdgeFunctionError): Promise<string> {
  let errMsg = data?.error;
  if (!errMsg && error?.context) {
    const body = await error.context.json?.().catch(() => null);
    errMsg = body?.error;
  }
  return errMsg || error?.message || "Erro desconhecido.";
}

/**
 * Substitui variáveis no formato {{variavel}} pelo valor correspondente.
 * Variáveis sem valor (ou ausentes do mapa) são substituídas por "", removendo
 * também uma vírgula adjacente para evitar "Olá, , tudo bem?" quando, por
 * exemplo, o lead não tem nome.
 */
export function renderTemplate(template: string, variables: Record<string, string | null | undefined>): string {
  return template.replace(
    /(\s*,\s*)?\{\{\s*([a-zA-Z0-9_]+)\s*\}\}(\s*,\s*)?/g,
    (match, before: string | undefined, key: string, after: string | undefined) => {
      const value = variables[key];
      if (value != null && String(value).trim() !== "") {
        return match.replace(/\{\{\s*[a-zA-Z0-9_]+\s*\}\}/, String(value));
      }
      return before && after ? after : "";
    }
  );
}

/** Junta saudação e corpo da mensagem com uma linha em branco entre eles. */
export function composeWhatsappMessage(greeting: string, body: string): string {
  return [greeting, body]
    .map((part) => part.trim())
    .filter(Boolean)
    .join("\n\n");
}

const PRODUCT_LABELS: Record<string, string> = {
  eduinfo: "EduInfo",
  gennera: "Gennera",
  ecoclear: "EcoClear",
  vibeflow: "VibeFlow",
};

/** Monta o mapa de variáveis disponíveis para um lead específico. */
export function buildLeadTemplateVariables(
  lead: Pick<Lead, "nome" | "empresa" | "cidade" | "uf" | "email" | "telefone" | "lead_status">,
  produtos: string[],
  vendedor: string
): Record<string, string> {
  const produtosLabel = produtos.length > 0
    ? produtos.map((p) => PRODUCT_LABELS[p] || p).join(" / ")
    : "";

  return {
    nome: lead.nome ?? "",
    empresa: lead.empresa ?? "",
    escola: lead.empresa ?? "",
    cidade: lead.cidade ?? "",
    uf: lead.uf ?? "",
    estado: lead.uf ?? "",
    status: LEAD_STATUS_LABELS[lead.lead_status ?? ""] ?? lead.lead_status ?? "",
    produtos: produtosLabel,
    email: lead.email ?? "",
    telefone: lead.telefone ?? "",
    vendedor,
  };
}

export type WhatsappMessageTemplate = {
  name: string;
  content: string;
};

/** Templates padrão sugeridos (o usuário pode editar/criar os seus em whatsapp_message_templates). */
export const DEFAULT_WHATSAPP_TEMPLATES: WhatsappMessageTemplate[] = [
  {
    name: "Primeiro contato",
    content: `Aqui é {{vendedor}}, da NAR ECO Soluções.

Vi que a {{empresa}} pode ter interesse em {{produtos}} e gostaria de apresentar como podemos ajudar.

Posso te enviar mais informações?`,
  },
  {
    name: "Follow-up",
    content: `Aqui é {{vendedor}}, da NAR ECO Soluções.

Passando para saber se conseguiu ver as informações sobre {{produtos}} que enviei para a {{empresa}}.

Fico à disposição para qualquer dúvida.`,
  },
  {
    name: "Apresentação de produto",
    content: `Aqui é {{vendedor}}, da NAR ECO Soluções. Preparamos uma apresentação sobre {{produtos}} pensando nas necessidades da {{empresa}}, em {{cidade}}/{{uf}}.

Quando for um bom horário para conversarmos?`,
  },
  {
    name: "Reativação",
    content: `Aqui é {{vendedor}}, da NAR ECO Soluções. Faz um tempo que não conversamos sobre {{produtos}} para a {{empresa}}.

Continua sendo uma prioridade para vocês esse ano? Posso retomar nossa conversa.`,
  },
  {
    name: "Mensagem de teste",
    content: `Aqui é {{vendedor}}, da NAR ECO Soluções.

Estou fazendo um teste rápido do nosso fluxo de atendimento para escolas.

Escola: {{empresa}}
Interesse: {{produtos}}

Se essa mensagem abriu corretamente no WhatsApp, o teste manual do CRM funcionou.`,
  },
];

// ─── Anexos ────────────────────────────────────────────────────────────────

export type WhatsappAttachmentType = "image" | "video" | "document" | "audio";

const ALLOWED_MIME_TYPES: Record<WhatsappAttachmentType, string[]> = {
  image: ["image/jpeg", "image/png", "image/webp"],
  video: ["video/mp4", "video/quicktime", "video/webm"],
  document: [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "text/plain",
    "text/csv",
    "application/zip",
    "application/x-zip-compressed",
  ],
  audio: ["audio/mpeg", "audio/ogg", "audio/mp4", "audio/wav", "audio/webm", "audio/x-m4a", "audio/opus"],
};

const MAX_FILE_SIZE_BYTES: Record<WhatsappAttachmentType, number> = {
  image: 5 * 1024 * 1024,
  video: 16 * 1024 * 1024,
  document: 16 * 1024 * 1024,
  audio: 16 * 1024 * 1024,
};

const EXECUTABLE_EXTENSIONS = new Set([
  "exe", "bat", "cmd", "sh", "msi", "com", "scr", "ps1", "vbs", "js", "jar", "apk",
]);

/** Extensões cujo `file.type` o navegador às vezes reporta vazio/incorreto. */
const EXTENSION_TYPE_FALLBACK: Record<string, WhatsappAttachmentType> = {
  mov: "video",
  webm: "video",
  csv: "document",
  zip: "document",
  m4a: "audio",
  opus: "audio",
};

/** Classifica um arquivo pelo MIME type (com fallback por extensão) para definir o `type` enviado à Evolution GO. */
export function classifyAttachment(mimeType: string, fileName?: string): WhatsappAttachmentType | null {
  for (const [type, mimes] of Object.entries(ALLOWED_MIME_TYPES) as [WhatsappAttachmentType, string[]][]) {
    if (mimes.includes(mimeType)) return type;
  }
  const ext = fileName?.split(".").pop()?.toLowerCase();
  if (ext && EXTENSION_TYPE_FALLBACK[ext]) return EXTENSION_TYPE_FALLBACK[ext];
  return null;
}

/**
 * Valida um arquivo antes do upload: rejeita executáveis, tipos não suportados
 * e arquivos acima do limite de tamanho do tipo correspondente.
 */
export function validateAttachment(file: File): { ok: true; type: WhatsappAttachmentType } | { ok: false; error: string } {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (EXECUTABLE_EXTENSIONS.has(ext)) {
    return { ok: false, error: `Arquivos .${ext} não são permitidos.` };
  }

  const type = classifyAttachment(file.type, file.name);
  if (!type) {
    return { ok: false, error: `Tipo de arquivo não suportado: ${file.type || "desconhecido"}.` };
  }

  const maxSize = MAX_FILE_SIZE_BYTES[type];
  if (file.size > maxSize) {
    return { ok: false, error: `Arquivo muito grande. Limite para ${type}: ${(maxSize / (1024 * 1024)).toFixed(0)}MB.` };
  }

  return { ok: true, type };
}
