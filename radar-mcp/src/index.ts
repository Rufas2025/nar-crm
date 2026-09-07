/**
 * Entrypoint do Radar MCP.
 *
 * RADAR_MCP_TRANSPORT=http  (default) — Streamable HTTP stateless em /mcp
 * RADAR_MCP_TRANSPORT=stdio           — para desenvolvimento local
 *
 * Não abre porta pública, não cria túnel, não altera network. O listener é
 * local; a exposição é responsabilidade da plataforma de deploy escolhida.
 */

import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { loadConfig } from './config.js';
import { extractBearer } from './db/client.js';
import { buildServer, SERVER_NAME, SERVER_VERSION } from './server.js';

const config = loadConfig();

function log(level: 'error' | 'info', message: string): void {
  if (config.logLevel === 'silent') return;
  if (config.logLevel === 'error' && level !== 'error') return;
  // stderr: stdout é reservado ao protocolo em modo stdio.
  process.stderr.write(`[${SERVER_NAME}] ${level}: ${message}\n`);
}

async function readBody(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk as Buffer);
  if (chunks.length === 0) return undefined;
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

async function startHttp(): Promise<void> {
  const httpServer = createServer(async (req: IncomingMessage, res: ServerResponse) => {
    if (req.url === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'ok', server: SERVER_NAME, version: SERVER_VERSION }));
      return;
    }

    if (!req.url?.startsWith('/mcp')) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'not_found' }));
      return;
    }

    // Stateless: uma instância de servidor e transporte por requisição.
    const token = extractBearer(req.headers.authorization);
    const server = buildServer({ config, token });
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      enableJsonResponse: true,
    });

    res.on('close', () => {
      void transport.close();
      void server.close();
    });

    try {
      await server.connect(transport);
      await transport.handleRequest(req, res, await readBody(req));
    } catch (err) {
      log('error', `falha ao tratar requisição: ${err instanceof Error ? err.message : String(err)}`);
      if (!res.headersSent) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'internal_error' }));
      }
    }
  });

  httpServer.listen(config.port, () => {
    log('info', `Streamable HTTP em http://127.0.0.1:${config.port}/mcp`);
    log('info', `Supabase configurado: ${Boolean(config.supabaseUrl && config.supabaseAnonKey)}`);
  });
}

async function startStdio(): Promise<void> {
  const server = buildServer({ config, token: process.env.RADAR_SUPABASE_JWT ?? null });
  await server.connect(new StdioServerTransport());
  log('info', 'transporte stdio ativo');
}

async function main(): Promise<void> {
  if (config.transport === 'stdio') await startStdio();
  else await startHttp();
}

main().catch((err) => {
  log('error', err instanceof Error ? err.message : String(err));
  process.exit(1);
});
