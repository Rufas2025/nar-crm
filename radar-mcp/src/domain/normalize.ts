/**
 * Normalizações usadas por dedupe e por comparação de texto.
 * Funções puras, sem I/O — a base testável do Radar.
 */

/** Remove acentos e baixa a caixa. Base de toda comparação textual. */
export function foldText(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}

/**
 * Nome institucional normalizado para dedupe.
 * "Colégio São José - Unidade Centro" e "colegio sao jose unidade centro"
 * convergem para a mesma chave.
 */
export function normalizeInstitutionName(name: string): string {
  return foldText(name)
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Extrai o domínio de uma URL, sem `www.` e sem porta.
 * Retorna null quando a URL é inválida — nunca lança.
 */
export function extractDomain(url: string | null | undefined): string | null {
  if (!url) return null;
  const candidate = /^https?:\/\//i.test(url) ? url : `https://${url}`;
  try {
    const host = new URL(candidate).hostname.toLowerCase();
    return host.replace(/^www\./, '') || null;
  } catch {
    return null;
  }
}

/**
 * Normaliza URL de perfil do Instagram para `https://instagram.com/<handle>`.
 * Aceita handle cru (`@escola`), URL com query, com barra final, com `www.`.
 * Retorna null se não for possível extrair um handle plausível.
 */
export function normalizeInstagramUrl(input: string | null | undefined): string | null {
  if (!input) return null;
  const raw = input.trim();
  if (!raw) return null;

  let handle: string | null = null;

  if (raw.startsWith('@')) {
    handle = raw.slice(1);
  } else if (/instagram\.com/i.test(raw)) {
    const candidate = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
    try {
      const path = new URL(candidate).pathname.replace(/^\/+|\/+$/g, '');
      // Ignora rotas que não são perfil (p/, reel/, stories/...).
      const first = path.split('/')[0] ?? '';
      if (!first || ['p', 'reel', 'reels', 'stories', 'explore', 'tv'].includes(first)) {
        return null;
      }
      handle = first;
    } catch {
      return null;
    }
  } else if (/^[a-zA-Z0-9._]+$/.test(raw)) {
    handle = raw;
  }

  if (!handle) return null;
  handle = handle.toLowerCase().replace(/[^a-z0-9._]/g, '');
  if (!handle) return null;

  return `https://instagram.com/${handle}`;
}

/** Normaliza URL genérica para comparação: sem hash, sem barra final, sem UTM. */
export function normalizeUrl(input: string | null | undefined): string | null {
  if (!input) return null;
  const candidate = /^https?:\/\//i.test(input) ? input : `https://${input}`;
  try {
    const url = new URL(candidate);
    url.hash = '';
    for (const key of [...url.searchParams.keys()]) {
      if (/^utm_/i.test(key) || key === 'fbclid' || key === 'igshid') {
        url.searchParams.delete(key);
      }
    }
    let out = url.toString();
    if (out.endsWith('/') && url.pathname !== '/') out = out.slice(0, -1);
    return out;
  } catch {
    return null;
  }
}

/** UF em duas letras maiúsculas, ou null. */
export function normalizeState(state: string | null | undefined): string | null {
  if (!state) return null;
  const folded = foldText(state).replace(/[^a-z]/g, '');
  if (folded.length === 2) return folded.toUpperCase();
  const byName: Record<string, string> = {
    acre: 'AC', alagoas: 'AL', amapa: 'AP', amazonas: 'AM', bahia: 'BA',
    ceara: 'CE', distritofederal: 'DF', espiritosanto: 'ES', goias: 'GO',
    maranhao: 'MA', matogrosso: 'MT', matogrossodosul: 'MS', minasgerais: 'MG',
    para: 'PA', paraiba: 'PB', parana: 'PR', pernambuco: 'PE', piaui: 'PI',
    riodejaneiro: 'RJ', riograndedonorte: 'RN', riograndedosul: 'RS',
    rondonia: 'RO', roraima: 'RR', santacatarina: 'SC', saopaulo: 'SP',
    sergipe: 'SE', tocantins: 'TO',
  };
  return byName[folded] ?? null;
}

/** Cidade normalizada para dedupe. */
export function normalizeCity(city: string | null | undefined): string | null {
  if (!city) return null;
  const out = foldText(city).replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
  return out || null;
}

/**
 * Valida uma URL de PROVENIÊNCIA (source_url).
 *
 * Mais estrito que normalizeUrl de propósito: normalizeUrl aceita "nao-e-url"
 * porque prefixa https:// automaticamente, o que é aceitável para tolerância de
 * entrada mas NÃO para atestar a origem de um dado factual. Aqui exigimos
 * esquema http/https explícito e um host com TLD plausível.
 */
export function isValidSourceUrl(input: string | null | undefined): boolean {
  if (!input) return false;
  const raw = input.trim();
  if (!/^https?:\/\//i.test(raw)) return false;
  try {
    const { hostname, protocol } = new URL(raw);
    if (protocol !== 'http:' && protocol !== 'https:') return false;
    if (hostname === 'localhost') return true;
    // Exige ao menos um ponto e um TLD alfabético de 2+ caracteres.
    return /^[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,}$/i.test(hostname);
  } catch {
    return false;
  }
}
