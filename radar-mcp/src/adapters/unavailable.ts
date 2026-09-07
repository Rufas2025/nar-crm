/**
 * Adapters de capacidades NÃO disponíveis nesta fase.
 *
 * Existem para fixar o contrato de integração futura e para que
 * `radar.get_capabilities` reflita a realidade. Nenhum deles retorna dado
 * simulado: toda chamada lança CapabilityUnavailableError.
 */

import {
  CapabilityUnavailableError,
  type ComposioAdapter,
  type InstagramAdapter,
  type LinkedInAdapter,
} from './types.js';

const COMPOSIO_NEXT_STEP =
  'Conecte o Composio e rode nova auditoria das actions reais antes de habilitar.';

export const instagramAdapter: InstagramAdapter = {
  name: 'instagram',
  capability_available: false,

  async readPost(): Promise<never> {
    throw new CapabilityUnavailableError(
      'instagram',
      'instagram_post_read',
      'Nenhum conector de Instagram instalado. ' + COMPOSIO_NEXT_STEP,
    );
  },
  async discover(): Promise<never> {
    throw new CapabilityUnavailableError(
      'instagram',
      'instagram_discovery',
      'Discovery automático não implementado por decisão de escopo (MVP = sinais manuais).',
    );
  },
  async monitorProfile(): Promise<never> {
    throw new CapabilityUnavailableError(
      'instagram',
      'instagram_monitoring',
      'Monitoramento de perfis não implementado por decisão de escopo.',
    );
  },
};

export const linkedInAdapter: LinkedInAdapter = {
  name: 'linkedin',
  capability_available: false,

  async companyLookup(): Promise<never> {
    throw new CapabilityUnavailableError(
      'linkedin',
      'linkedin_company_lookup',
      'Nenhum conector de LinkedIn instalado. ' + COMPOSIO_NEXT_STEP,
    );
  },
  async peopleSearch(): Promise<never> {
    throw new CapabilityUnavailableError(
      'linkedin',
      'linkedin_people_search',
      'A API oficial do LinkedIn não expõe busca de pessoas nem dados de contato; ' +
        'scraping viola os Termos de Uso. Use fontes públicas via research.',
    );
  },
  async profileRead(): Promise<never> {
    throw new CapabilityUnavailableError(
      'linkedin',
      'linkedin_profile_read',
      'Leitura de perfil não disponível sem conector autorizado.',
    );
  },
};

export const composioAdapter: ComposioAdapter = {
  name: 'composio',
  capability_available: false,

  async listActions(): Promise<never> {
    throw new CapabilityUnavailableError('composio', 'composio_connected', COMPOSIO_NEXT_STEP);
  },
  async invoke(): Promise<never> {
    throw new CapabilityUnavailableError('composio', 'composio_connected', COMPOSIO_NEXT_STEP);
  },
};
