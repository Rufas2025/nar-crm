/**
 * Capabilities REAIS do Radar em runtime.
 *
 * Regra: estes valores refletem o que o servidor consegue fazer AGORA, nunca
 * intenção futura. `radar.get_capabilities` expõe este objeto sem maquiagem.
 */

import { payloadNotificationAdapter, draftOnlyEmailAdapter, agentDelegatedResearchAdapter } from './adapters/available.js';
import { composioAdapter, instagramAdapter, linkedInAdapter } from './adapters/unavailable.js';

export interface RadarCapabilities {
  manual_signal: boolean;
  web_research: boolean;
  web_research_mode: 'agent_delegated' | 'server_side' | 'unavailable';
  supabase_storage: boolean;
  gmail_draft: boolean;
  email_send: boolean;

  instagram_post_read: boolean;
  instagram_discovery: boolean;
  instagram_monitoring: boolean;

  linkedin_company_lookup: boolean;
  linkedin_people_search: boolean;
  linkedin_profile_read: boolean;

  composio_connected: boolean;
  telegram_direct: boolean;
  n8n_access: boolean;

  notes: string[];
}

export function getCapabilities(opts: { supabaseConfigured: boolean }): RadarCapabilities {
  return {
    manual_signal: true,
    // O servidor não busca; o agente busca e devolve. Declarado explicitamente.
    web_research: agentDelegatedResearchAdapter.capability_available,
    web_research_mode: 'agent_delegated',
    supabase_storage: opts.supabaseConfigured,
    gmail_draft: draftOnlyEmailAdapter.capability_available,
    email_send: false,

    instagram_post_read: instagramAdapter.capability_available,
    instagram_discovery: instagramAdapter.capability_available,
    instagram_monitoring: instagramAdapter.capability_available,

    linkedin_company_lookup: linkedInAdapter.capability_available,
    linkedin_people_search: linkedInAdapter.capability_available,
    linkedin_profile_read: linkedInAdapter.capability_available,

    composio_connected: composioAdapter.capability_available,
    telegram_direct: false,
    n8n_access: false,

    notes: [
      'MVP opera como qualificador de sinais manuais: a entrada é URL e/ou texto trazidos por humano ou pelo Rufas.',
      'web_research=false significa que o SERVIDOR não busca. radar.research_institution devolve um plano de busca para o agente executar.',
      'eduinfo_fit e ecoclear_fit permanecem null (insufficient_service_catalog) e ficam fora do score.',
      'email_send, whatsapp_send e qualquer interação LinkedIn exigem aprovação humana e não são executados pelo Radar.',
      `notification: ${payloadNotificationAdapter.name} devolve payload estruturado; o Rufas renderiza no Telegram.`,
    ],
  };
}
