/**
 * Interfaces de adapter.
 *
 * Regra da Fase: nenhum mock que pareça integração real. Todo adapter declara
 * `capability_available`. Quando false, chamar o método lança
 * `CapabilityUnavailableError` — nunca devolve dado inventado.
 */

export class CapabilityUnavailableError extends Error {
  constructor(
    public readonly adapter: string,
    public readonly capability: string,
    public readonly howToEnable: string,
  ) {
    super(
      `Capability '${capability}' indisponível no adapter '${adapter}'. ${howToEnable}`,
    );
    this.name = 'CapabilityUnavailableError';
  }
}

export interface Adapter {
  readonly name: string;
  readonly capability_available: boolean;
}

// ------------------------------------------------------------ Research

export interface ResearchQuery {
  query: string;
  maxResults?: number;
}

export interface ResearchResult {
  title: string;
  url: string;
  snippet: string;
}

export interface ResearchAdapter extends Adapter {
  search(query: ResearchQuery): Promise<ResearchResult[]>;
  fetchPage(url: string): Promise<{ url: string; text: string } | null>;
}

// ------------------------------------------------------------ Storage

export interface StorageAdapter extends Adapter {
  /** Cliente já autenticado como o usuário chamador; RLS aplicada pelo banco. */
  from(table: string): unknown;
}

// ------------------------------------------------------------ Notification

export interface NotificationAdapter extends Adapter {
  /**
   * Nesta fase retorna o payload estruturado para o Rufas consumir.
   * NÃO envia Telegram.
   */
  buildNotification(payload: unknown): Promise<{ delivered: false; payload: unknown }>;
}

// ------------------------------------------------------------ Email

export interface EmailDraft {
  to: string;
  subject: string;
  body: string;
}

export interface EmailAdapter extends Adapter {
  /** Cria rascunho. Envio é sempre bloqueado nesta fase. */
  createDraft(draft: EmailDraft): Promise<{ draft_id: string | null; status: string }>;
  /** Sempre lança nesta fase — a barreira de aprovação é estrutural. */
  send(draft: EmailDraft): Promise<never>;
}

// ------------------------------------------------------------ Indisponíveis

export interface InstagramAdapter extends Adapter {
  readPost(url: string): Promise<never>;
  discover(query: string): Promise<never>;
  monitorProfile(handle: string): Promise<never>;
}

export interface LinkedInAdapter extends Adapter {
  companyLookup(name: string): Promise<never>;
  peopleSearch(query: string): Promise<never>;
  profileRead(url: string): Promise<never>;
}

export interface ComposioAdapter extends Adapter {
  listActions(): Promise<never>;
  invoke(action: string, args: Record<string, unknown>): Promise<never>;
}
