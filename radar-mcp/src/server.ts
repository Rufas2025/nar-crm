/**
 * Servidor MCP do Radar.
 *
 * Transporte: Streamable HTTP stateless (compatível com clientes cloud) ou
 * stdio para desenvolvimento local. Nenhuma infraestrutura de rede é criada
 * aqui — apenas um listener HTTP local; exposição pública é decisão de deploy.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { isSupabaseConfigured, type RadarConfig } from './config.js';
import { getUserContext, type UserContext } from './db/client.js';
import { RadarRepository } from './db/repositories.js';
import { registerRadarTools } from './tools/index.js';

export const SERVER_NAME = 'nar-radar';
export const SERVER_VERSION = '0.1.0';

export interface BuildServerOptions {
  config: RadarConfig;
  /** Token do chamador (Bearer). Null em stdio sem auth configurada. */
  token: string | null;
}

/**
 * Cria uma instância de servidor por requisição (stateless).
 * O contexto de usuário é resolvido preguiçosamente: tools read-only como
 * radar_get_capabilities funcionam sem JWT.
 */
export function buildServer({ config, token }: BuildServerOptions): McpServer {
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

  let cached: UserContext | null = null;

  registerRadarTools(server, {
    supabaseConfigured: isSupabaseConfigured(config),
    async getRepository() {
      if (!cached) cached = await getUserContext(config, token);
      return new RadarRepository(cached.client, cached.userId);
    },
  });

  return server;
}
