/**
 * Códigos de erro do Radar.
 *
 * Cada código só existe porque um caminho real de execução o produz.
 * Códigos que não se aplicam à implementação atual estão marcados como
 * NOT_USED com o motivo — não são enum morto para preencher checklist.
 */

export const ERROR_CODES = {
  /** Sem AuthContext válido (JWT ausente, inválido ou expirado). */
  UNAUTHENTICATED: 'UNAUTHENTICATED',
  /** Autenticado, mas o recurso não pertence ao usuário (RLS negou). */
  FORBIDDEN: 'FORBIDDEN',
  /** Entrada não satisfaz o contrato da tool. */
  INVALID_INPUT: 'INVALID_INPUT',
  /** Recurso inexistente OU pertencente a outro usuário (RLS não distingue). */
  NOT_FOUND: 'NOT_FOUND',
  /** Sinal já registrado — dedupe forte encontrou o mesmo conteúdo. */
  DUPLICATE_SIGNAL: 'DUPLICATE_SIGNAL',
  /** Evidência insuficiente para a operação pedida. */
  INSUFFICIENT_EVIDENCE: 'INSUFFICIENT_EVIDENCE',
  /** Capacidade indisponível neste runtime (Instagram, LinkedIn, Composio...). */
  CAPABILITY_UNAVAILABLE: 'CAPABILITY_UNAVAILABLE',
  /** Pesquisa delegada ao agente falhou ou não pôde ser planejada. */
  RESEARCH_FAILED: 'RESEARCH_FAILED',
  /** Match de baixa confiança: exige confirmação humana/do agente. */
  CONFLICT_REQUIRES_REVIEW: 'CONFLICT_REQUIRES_REVIEW',
  /** Falha ao gravar/ler no banco. Detalhe interno nunca é exposto. */
  PERSISTENCE_ERROR: 'PERSISTENCE_ERROR',
  /** Operação exige aprovação humana e não é executada pelo Radar. */
  APPROVAL_REQUIRED: 'APPROVAL_REQUIRED',
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

/** Erros transitórios: vale a pena o agente tentar de novo. */
const RETRYABLE: ReadonlySet<ErrorCode> = new Set([
  ERROR_CODES.PERSISTENCE_ERROR,
  ERROR_CODES.RESEARCH_FAILED,
]);

export function isRetryable(code: ErrorCode): boolean {
  return RETRYABLE.has(code);
}

export class RadarError extends Error {
  constructor(
    public readonly code: ErrorCode,
    message: string,
    public readonly hint?: string,
  ) {
    super(message);
    this.name = 'RadarError';
  }
}

/**
 * Mensagens seguras por código. Detalhe interno (SQL, stack, token,
 * connection string) NUNCA chega ao cliente: exceções desconhecidas são
 * mapeadas para uma mensagem genérica.
 */
const SAFE_MESSAGE: Record<ErrorCode, string> = {
  UNAUTHENTICATED: 'Autenticação obrigatória: envie Authorization: Bearer <jwt>.',
  FORBIDDEN: 'Acesso negado ao recurso solicitado.',
  INVALID_INPUT: 'Entrada inválida.',
  NOT_FOUND: 'Recurso não encontrado.',
  DUPLICATE_SIGNAL: 'Sinal já registrado anteriormente.',
  INSUFFICIENT_EVIDENCE: 'Evidência insuficiente para concluir a operação.',
  CAPABILITY_UNAVAILABLE: 'Capacidade indisponível neste runtime.',
  RESEARCH_FAILED: 'Não foi possível concluir a pesquisa.',
  CONFLICT_REQUIRES_REVIEW: 'Conflito detectado: requer revisão explícita.',
  PERSISTENCE_ERROR: 'Falha ao persistir os dados.',
  APPROVAL_REQUIRED: 'Esta operação exige aprovação humana.',
};

/** Padrões que jamais podem vazar numa mensagem de erro. */
const LEAK_PATTERNS: RegExp[] = [
  /eyJ[A-Za-z0-9_-]{10,}/,           // JWT
  /postgres(ql)?:\/\//i,             // connection string
  /\bselect\b.+\bfrom\b/i,           // SQL
  /\binsert\s+into\b/i,
  /\bat\s+.+\(.+:\d+:\d+\)/,         // stack frame
  /service_role/i,
  /bearer\s+\S+/i,
  /(api[_-]?key|secret|password)\s*[:=]/i,
];

export function containsLeak(text: string): boolean {
  return LEAK_PATTERNS.some((re) => re.test(text));
}

/**
 * Normaliza qualquer exceção num par (código, mensagem segura).
 * Mensagem própria só é preservada se for de um RadarError e não vazar nada.
 */
export function toSafeError(err: unknown): {
  code: ErrorCode;
  message: string;
  hint?: string;
  retryable: boolean;
} {
  if (err instanceof RadarError) {
    const message = containsLeak(err.message) ? SAFE_MESSAGE[err.code] : err.message;
    return { code: err.code, message, hint: err.hint, retryable: isRetryable(err.code) };
  }

  const name = err instanceof Error ? err.name : '';
  const raw = err instanceof Error ? err.message : String(err);

  let code: ErrorCode;
  if (name === 'AuthRequiredError') code = ERROR_CODES.UNAUTHENTICATED;
  else if (name === 'CapabilityUnavailableError') code = ERROR_CODES.CAPABILITY_UNAVAILABLE;
  else if (name === 'RepositoryError') {
    // RLS negando gravação aparece como violação de policy.
    code = /row-level security|violates row-level/i.test(raw)
      ? ERROR_CODES.FORBIDDEN
      : ERROR_CODES.PERSISTENCE_ERROR;
  } else code = ERROR_CODES.PERSISTENCE_ERROR;

  // Para exceções não-RadarError, só devolve a mensagem original quando ela é
  // comprovadamente segura; caso contrário usa a mensagem genérica do código.
  const safeToShow =
    (code === ERROR_CODES.UNAUTHENTICATED || code === ERROR_CODES.CAPABILITY_UNAVAILABLE) &&
    !containsLeak(raw);

  return {
    code,
    message: safeToShow ? raw : SAFE_MESSAGE[code],
    retryable: isRetryable(code),
  };
}

/**
 * Códigos definidos mas sem caminho de produção na fase atual.
 * Documentado para não virar enum morto silencioso.
 */
export const NOT_USED_CODES: { code: ErrorCode; reason: string }[] = [];
