/**
 * Cliente Supabase por requisição, autenticado com o JWT do chamador.
 *
 * Decisão de segurança: o Radar NUNCA usa service_role. Todo acesso passa pelo
 * JWT do usuário, então a RLS do Postgres é a barreira real — o servidor MCP
 * não tem poder de contornar o isolamento entre usuários.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { RadarConfig } from '../config.js';

export class AuthRequiredError extends Error {
  constructor(message = 'Authorization: Bearer <supabase_jwt> é obrigatório.') {
    super(message);
    this.name = 'AuthRequiredError';
  }
}

export interface UserContext {
  userId: string;
  client: SupabaseClient;
}

/** Extrai o token de um header Authorization. */
export function extractBearer(authHeader: string | undefined | null): string | null {
  if (!authHeader) return null;
  const match = /^Bearer\s+(.+)$/i.exec(authHeader.trim());
  return match?.[1]?.trim() || null;
}

/**
 * Resolve o usuário a partir do JWT e devolve um client já escopado.
 * Mesmo padrão de `supabase/functions/_shared/gmail.ts` do CRM.
 */
export async function getUserContext(
  config: RadarConfig,
  token: string | null,
): Promise<UserContext> {
  if (!config.supabaseUrl || !config.supabaseAnonKey) {
    throw new AuthRequiredError(
      'SUPABASE_URL e SUPABASE_ANON_KEY não configurados no ambiente do servidor.',
    );
  }
  if (!token) throw new AuthRequiredError();

  const client = createClient(config.supabaseUrl, config.supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await client.auth.getUser();
  if (error || !data?.user) {
    throw new AuthRequiredError('JWT inválido ou expirado.');
  }

  return { userId: data.user.id, client };
}
