/**
 * Configuração via environment. Nenhum secret é lido de arquivo versionado.
 *
 * Variáveis (apenas nomes; valores ficam no ambiente/secret manager):
 *   SUPABASE_URL          — URL do projeto Supabase
 *   SUPABASE_ANON_KEY     — anon key (o JWT do chamador é quem concede acesso via RLS)
 *   RADAR_MCP_PORT        — porta HTTP (default 8787)
 *   RADAR_MCP_TRANSPORT   — 'http' | 'stdio' (default 'http')
 *   RADAR_LOG_LEVEL       — 'silent' | 'error' | 'info' | 'debug' (default 'info')
 */

export interface RadarConfig {
  supabaseUrl: string | null;
  supabaseAnonKey: string | null;
  port: number;
  transport: 'http' | 'stdio';
  logLevel: 'silent' | 'error' | 'info' | 'debug';
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): RadarConfig {
  const transport = env.RADAR_MCP_TRANSPORT === 'stdio' ? 'stdio' : 'http';
  const levelRaw = env.RADAR_LOG_LEVEL ?? 'info';
  const logLevel = (['silent', 'error', 'info', 'debug'] as const).includes(
    levelRaw as never,
  )
    ? (levelRaw as RadarConfig['logLevel'])
    : 'info';

  return {
    supabaseUrl: env.SUPABASE_URL ?? null,
    supabaseAnonKey: env.SUPABASE_ANON_KEY ?? null,
    port: Number(env.RADAR_MCP_PORT ?? 8787),
    transport,
    logLevel,
  };
}

export function isSupabaseConfigured(config: RadarConfig): boolean {
  return Boolean(config.supabaseUrl && config.supabaseAnonKey);
}
