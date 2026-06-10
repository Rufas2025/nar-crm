import { supabase as cloudFunctions } from "@/integrations/supabase/client";

const STORAGE_KEY = "evolution_api_settings";

export type EvolutionSettings = {
  apiUrl: string;
  apiKey: string;
  instanceName: string;
  connectionStatus: string | null;
  lastTestedAt: string | null;
  lastTestError: string | null;
};

/**
 * Lê a configuração da Evolution API do armazenamento local do navegador.
 */
export async function loadEvolutionSettings(): Promise<EvolutionSettings | null> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    return {
      apiUrl: parsed.apiUrl ?? "",
      apiKey: parsed.apiKey ?? "",
      instanceName: parsed.instanceName ?? "",
      connectionStatus: parsed.connectionStatus ?? null,
      lastTestedAt: parsed.lastTestedAt ?? null,
      lastTestError: parsed.lastTestError ?? null,
    };
  } catch {
    return null;
  }
}

/**
 * Salva a configuração da Evolution API no armazenamento local do navegador.
 */
export async function saveEvolutionSettings(settings: EvolutionSettings): Promise<void> {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

export type EvolutionTestResult = {
  ok: boolean;
  state?: string;
  status?: number;
  error?: string | null;
  testedAt: string;
};

/**
 * Testa a conexão com a Evolution API via backend (evita CORS no navegador).
 * Envia as credenciais informadas e recebe o estado real da instância.
 */
export async function testEvolutionConnection(
  settings: Pick<EvolutionSettings, "apiUrl" | "apiKey" | "instanceName">
): Promise<EvolutionTestResult> {
  const testedAt = new Date().toISOString();

  try {
    const { data, error } = await cloudFunctions.functions.invoke("test-evolution-connection", {
      body: {
        apiUrl: settings.apiUrl,
        apiKey: settings.apiKey,
        instanceName: settings.instanceName,
      },
    });

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
