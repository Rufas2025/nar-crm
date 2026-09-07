/**
 * Adapters de capacidades disponíveis (ou condicionalmente disponíveis).
 *
 * ResearchAdapter: nesta arquitetura o Radar NÃO faz busca web por conta
 * própria — quem tem WebSearch/WebFetch é o agente que chama o MCP. O adapter
 * declara isso honestamente: `capability_available: false` no runtime do
 * servidor, e as tools de pesquisa devolvem um PLANO de busca para o agente
 * executar e trazer de volta via `radar.research_institution`.
 *
 * Alternativa futura: injetar um provedor de busca server-side (env var
 * RADAR_SEARCH_PROVIDER) sem mudar as tools.
 */

import {
  CapabilityUnavailableError,
  type EmailAdapter,
  type EmailDraft,
  type NotificationAdapter,
  type ResearchAdapter,
} from './types.js';

/**
 * Research delegado ao agente chamador.
 * O servidor não tem cliente HTTP de busca configurado nesta fase.
 */
export const agentDelegatedResearchAdapter: ResearchAdapter = {
  name: 'research.agent_delegated',
  capability_available: false,

  async search(): Promise<never> {
    throw new CapabilityUnavailableError(
      'research.agent_delegated',
      'web_research_server_side',
      'O servidor não executa busca web. Use radar.research_institution para obter ' +
        'o plano de busca, execute com suas próprias ferramentas e envie os achados de volta.',
    );
  },
  async fetchPage(): Promise<never> {
    throw new CapabilityUnavailableError(
      'research.agent_delegated',
      'web_fetch_server_side',
      'O servidor não busca páginas. Envie o conteúdo via raw_text.',
    );
  },
};

/** Notificação: devolve payload estruturado, nunca envia. */
export const payloadNotificationAdapter: NotificationAdapter = {
  name: 'notification.payload',
  capability_available: true,

  async buildNotification(payload: unknown) {
    return { delivered: false as const, payload };
  },
};

/**
 * E-mail: rascunho persistido no Radar. O envio real (Gmail) é do CRM e exige
 * aprovação humana — `send()` sempre lança, por design.
 */
export const draftOnlyEmailAdapter: EmailAdapter = {
  name: 'email.draft_only',
  capability_available: true,

  async createDraft(draft: EmailDraft) {
    return { draft_id: null, status: 'draft_prepared_in_radar' };
  },

  async send(): Promise<never> {
    throw new CapabilityUnavailableError(
      'email.draft_only',
      'email_send',
      'Envio de e-mail exige aprovação humana explícita e não é executado pelo Radar nesta fase.',
    );
  },
};
