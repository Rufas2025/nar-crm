import { supabase } from "@/lib/supabase";

const CACHE_KEY = "evolution_api_settings_cache";

export type EvolutionSettings = {
  apiUrl: string;
  apiKey: string;
  instanceName: string;
  connectionStatus: string | null;
  lastTestedAt: string | null;
  lastTestError: string | null;
};

// Cache visual: nunca guarda a API Key, apenas o necessário para exibir o
// formulário/status instantaneamente enquanto o Supabase responde.
type CachedSettings = Omit<EvolutionSettings, "apiKey">;

function loadCache(): CachedSettings | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    return {
      apiUrl: parsed.apiUrl ?? "",
      instanceName: parsed.instanceName ?? "",
      connectionStatus: parsed.connectionStatus ?? null,
      lastTestedAt: parsed.lastTestedAt ?? null,
      lastTestError: parsed.lastTestError ?? null,
    };
  } catch {
    return null;
  }
}

function saveCache(settings: EvolutionSettings) {
  try {
    const { apiKey: _apiKey, ...cacheable } = settings;
    localStorage.setItem(CACHE_KEY, JSON.stringify(cacheable));
  } catch {
    // localStorage indisponível — cache visual é apenas otimização
  }
}

/**
 * Lê a configuração da Evolution API a partir da tabela `evolution_config`
 * (fonte principal). Em caso de falha de rede, recai para o cache local
 * (sem API Key) apenas para exibição.
 */
export async function loadEvolutionSettings(): Promise<EvolutionSettings | null> {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData?.user?.id;
  if (!userId) return null;

  const { data, error } = await supabase
    .from("evolution_config")
    .select("api_url, api_key, instance_name, connection_status, last_tested_at, last_test_error")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    const cached = loadCache();
    return cached ? { ...cached, apiKey: "" } : null;
  }
  if (!data) return null;

  const settings: EvolutionSettings = {
    apiUrl: data.api_url ?? "",
    apiKey: data.api_key ?? "",
    instanceName: data.instance_name ?? "",
    connectionStatus: data.connection_status,
    lastTestedAt: data.last_tested_at,
    lastTestError: data.last_test_error,
  };
  saveCache(settings);
  return settings;
}

/**
 * Salva a configuração da Evolution API na tabela `evolution_config`
 * (uma linha por usuário). O cache local é só uma cópia para exibição.
 */
export async function saveEvolutionSettings(settings: EvolutionSettings): Promise<void> {
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  const userId = userData?.user?.id;
  if (userErr || !userId) {
    throw new Error("Usuário não autenticado.");
  }

  const { error } = await supabase.from("evolution_config").upsert(
    {
      user_id: userId,
      api_url: settings.apiUrl,
      api_key: settings.apiKey,
      instance_name: settings.instanceName,
      connection_status: settings.connectionStatus,
      last_tested_at: settings.lastTestedAt,
      last_test_error: settings.lastTestError,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  if (error) throw error;

  saveCache(settings);
}

export type EvolutionTestResult = {
  ok: boolean;
  state?: string;
  status?: number;
  error?: string | null;
  testedAt: string;
};

/**
 * Pede para a Edge Function testar a conexão com a Evolution API usando a
 * configuração já salva em `evolution_config` (lida no backend). A Edge
 * Function também atualiza connection_status/last_tested_at/last_test_error.
 */
export async function testEvolutionConnection(): Promise<EvolutionTestResult> {
  const testedAt = new Date().toISOString();

  try {
    const { data, error } = await supabase.functions.invoke("test-evolution-connection");

    if (error) {
      return {
        ok: false,
        testedAt,
        error: `Erro de rede ao chamar o backend de teste: ${error.message}`,
      };
    }

    return {
      ok: data?.ok === true,
      state: data?.state,
      status: data?.status,
      error: data?.error ?? null,
      testedAt: data?.testedAt ?? testedAt,
    };
  } catch (e: any) {
    return {
      ok: false,
      testedAt,
      error: `Erro de rede: não foi possível chamar o backend de teste. ${String(e?.message ?? e)}`,
    };
  }
}
