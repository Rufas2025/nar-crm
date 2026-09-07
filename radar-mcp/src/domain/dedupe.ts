/**
 * Chaves de deduplicação e política de merge.
 *
 * Regra da Fase: NÃO fazer merge automático de baixa confiança. Chaves fortes
 * (domínio, instagram, URL exata, id externo) permitem reuso automático do
 * registro existente. Chave fraca (nome + cidade + UF) apenas SUGERE candidato
 * e exige confirmação humana/do agente.
 */

import {
  extractDomain,
  normalizeCity,
  normalizeInstagramUrl,
  normalizeInstitutionName,
  normalizeState,
  normalizeUrl,
} from './normalize.js';

export type DedupeStrength = 'strong' | 'weak';

export interface DedupeKey {
  field: string;
  value: string;
  strength: DedupeStrength;
}

export interface InstitutionIdentity {
  name?: string | null;
  website?: string | null;
  domain?: string | null;
  instagram_url?: string | null;
  city?: string | null;
  state?: string | null;
}

/**
 * Chaves de dedupe para instituição, da mais forte para a mais fraca.
 * Vazio significa que não há como deduplicar com os dados fornecidos.
 */
export function institutionDedupeKeys(identity: InstitutionIdentity): DedupeKey[] {
  const keys: DedupeKey[] = [];

  const domain = identity.domain ?? extractDomain(identity.website);
  if (domain) keys.push({ field: 'domain', value: domain, strength: 'strong' });

  const instagram = normalizeInstagramUrl(identity.instagram_url);
  if (instagram) keys.push({ field: 'instagram_url', value: instagram, strength: 'strong' });

  if (identity.name) {
    const normalized = normalizeInstitutionName(identity.name);
    const city = normalizeCity(identity.city) ?? '';
    const state = normalizeState(identity.state) ?? '';
    if (normalized) {
      keys.push({
        field: 'normalized_name_city_state',
        value: `${normalized}|${city}|${state}`,
        // Fraca de propósito: dois colégios homônimos em cidades diferentes
        // não podem ser fundidos sem confirmação.
        strength: city && state ? 'weak' : 'weak',
      });
    }
  }

  return keys;
}

export interface SignalIdentity {
  source?: string | null;
  source_url?: string | null;
  source_external_id?: string | null;
}

/** Chaves de dedupe para sinal. Ambas fortes: identificam o mesmo conteúdo. */
export function signalDedupeKeys(identity: SignalIdentity): DedupeKey[] {
  const keys: DedupeKey[] = [];

  const url = normalizeUrl(identity.source_url);
  if (url) keys.push({ field: 'source_url', value: url, strength: 'strong' });

  if (identity.source_external_id) {
    keys.push({
      field: 'source_external_id',
      value: `${identity.source ?? 'manual'}|${identity.source_external_id}`,
      strength: 'strong',
    });
  }

  return keys;
}

/** Chave de dedupe para contato: nome normalizado dentro da instituição. */
export function contactDedupeKey(
  institutionId: string,
  name: string,
): DedupeKey | null {
  const normalized = normalizeInstitutionName(name);
  if (!normalized) return null;
  return {
    field: 'institution_name',
    value: `${institutionId}|${normalized}`,
    strength: 'strong',
  };
}

/**
 * Decide se um candidato encontrado pode ser reusado automaticamente.
 * Só chave forte autoriza reuso silencioso.
 */
export function canAutoMerge(matchedBy: DedupeKey | null): boolean {
  return matchedBy?.strength === 'strong';
}
