/**
 * Servidor MCP do Radar.
 *
 * Transporte: Streamable HTTP stateless (compatível com clientes cloud) ou
 * stdio para desenvolvimento local. Nenhuma infraestrutura de rede é criada
 * aqui — apenas um listener HTTP local; exposição pública é decisão de deploy.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { isSupabaseConfigured, type RadarConfig } from './config.js';
import { buildAuthContext, type AuthContext } from './auth.js';
import { getUserContext } from './db/client.js';
import { RadarRepository } from './db/repositories.js';
import { registerRadarTools } from './tools/index.js';

export const SERVER_NAME = 'nar-radar';
export const SERVER_VERSION = '0.1.0';

export interface BuildServerOptions {
  config: RadarConfig;
  /** Token do chamador (Bearer). Null em stdio sem auth configurada. */
  token: string | null;
  /** Log estruturado; nunca recebe token, header ou dado pessoal. */
  observe?: (event: {
    tool_name: string;
    duration_ms: number;
    result_status: 'ok' | 'error';
    request_id: string;
    error_code?: string;
  }) => void;
}

/**
 * Cria uma instância de servidor por requisição (stateless).
 * O contexto de usuário é resolvido preguiçosamente: tools read-only como
 * radar_get_capabilities funcionam sem JWT.
 */
export function buildServer({ config, token, observe }: BuildServerOptions): McpServer {
  const server = new McpServer(
    { name: SERVER_NAME, version: SERVER_VERSION },
    {
      instructions:
        'Radar de obras em colégios (Eduinfo + Eco Clear). Opera como QUALIFICADOR de sinais ' +
        'manuais: você traz URL e/ou texto, o Radar persiste, você classifica semanticamente e ' +
        'o Radar confere contra o texto, pontua e devolve o payload para o Rufas. ' +
        'Chame radar_get_capabilities antes de assumir qualquer integração. ' +
        'Instagram, LinkedIn e Composio NÃO estão disponíveis. O Radar nunca envia outreach.',
    },
  );

  // AuthContext é produzido AQUI, pela camada de auth — nunca dentro da tool.
  // A tool recebe um repositório já vinculado ao user_id confiável.
  let session: { auth: AuthContext; client: import('@supabase/supabase-js').SupabaseClient } | null = null;

  registerRadarTools(server, {
    supabaseConfigured: isSupabaseConfigured(config),
    observe,
    async getRepository() {
      if (!session) {
        const ctx = await getUserContext(config, token);
        session = { auth: buildAuthContext(ctx.userId, 'supabase_jwt'), client: ctx.client };
      }
      // user_id vem EXCLUSIVAMENTE do AuthContext.
      return new RadarRepository(session.client, session.auth.user_id);
    },
  });

  return server;
}
