const PRODUCT_LABELS: Record<string, string> = {
  eduinfo: "EduInfo",
  gennera: "Gennera",
  ecoclear: "EcoClear",
  vibeflow: "VibeFlow",
};

/**
 * Substitui variáveis no formato {{variavel}} pelo valor correspondente.
 * Variáveis sem valor (ou ausentes do mapa) são substituídas por "", removendo
 * também uma vírgula adjacente para evitar "Olá, , tudo bem?" quando, por
 * exemplo, o lead não tem nome (espelha src/lib/whatsapp.ts).
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

export type TemplateLead = {
  nome?: string | null;
  empresa?: string | null;
  cidade?: string | null;
  uf?: string | null;
  email?: string | null;
  telefone?: string | null;
  lead_status?: string | null;
};

/** Rótulos legíveis para a variável {{status}} (espelha src/lib/whatsapp.ts). */
const LEAD_STATUS_LABELS: Record<string, string> = {
  novo: "Novo",
  em_contato: "Em Contato",
  qualificado: "Qualificado",
  fechado: "Fechado",
  perdido: "Perdido",
};

/** Monta o mapa de variáveis disponíveis para um lead específico (espelha src/lib/whatsapp.ts). */
export function buildLeadTemplateVariables(lead: TemplateLead, produtos: string[], vendedor: string): Record<string, string> {
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

/** Nome de exibição do remetente, usado na variável {{vendedor}}. */
export function senderNameFromUser(user: { email?: string | null; user_metadata?: Record<string, unknown> | null }): string {
  const meta = user.user_metadata ?? {};
  const fullName = (meta.full_name ?? meta.name) as string | undefined;
  if (fullName && fullName.trim()) return fullName.trim();
  if (user.email) return user.email.split("@")[0];
  return "Equipe NAR";
}
