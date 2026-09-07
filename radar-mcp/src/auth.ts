/**
 * AuthContext — identidade confiável, produzida pela camada de transporte.
 *
 * Contrato de segurança:
 * 1. o transporte autentica (Bearer JWT);
 * 2. esta camada produz o AuthContext;
 * 3. a tool recebe o contexto pronto e NUNCA interpreta JWT ou header;
 * 4. todo `user_id` persistido deriva EXCLUSIVAMENTE daqui.
 *
 * Nenhum campo de identidade enviado pelo agente no payload tem autoridade.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

export type AuthMethod = 'supabase_jwt' | 'anonymous';

export interface AuthContext {
  /** Identificador do sujeito autenticado (sub do JWT). */
  readonly subject: string;
  /** Identidade efetiva usada em toda persistência. */
  readonly user_id: string;
  /** Reservado: o modelo atual não tem multi-tenant além do usuário. */
  readonly workspace_id?: string;
  readonly auth_method: AuthMethod;
}

export function buildAuthContext(userId: string, method: AuthMethod = 'supabase_jwt'): AuthContext {
  return Object.freeze({ subject: userId, user_id: userId, auth_method: method });
}

/**
 * Guarda anti-impersonation.
 *
 * Os schemas Zod das tools não declaram `user_id`/`workspace_id`, e o Zod
 * remove campos não declarados — então o payload nunca alcança a persistência.
 * Esta função existe para tornar a garantia EXPLÍCITA e testável: se um dia um
 * schema passar a aceitar esses campos, ela detecta a tentativa.
 *
 * Retorna a lista de campos de identidade encontrados no payload cru.
 */
export function detectIdentityInjection(rawPayload: unknown): string[] {
  if (!rawPayload || typeof rawPayload !== 'object') return [];
  const forbidden = ['user_id', 'userId', 'workspace_id', 'workspaceId', 'subject', 'auth_method'];
  return forbidden.filter((key) => key in (rawPayload as Record<string, unknown>));
}

/** Identidade efetiva. Sempre o AuthContext — o payload nunca vence. */
export function effectiveUserId(ctx: AuthContext): string {
  return ctx.user_id;
}

export interface AuthenticatedSession {
  auth: AuthContext;
  client: SupabaseClient;
}
