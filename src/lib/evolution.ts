import { supabase as cloudClient } from "@/integrations/supabase/client";

export const EVOLUTION_SETTINGS_KEY = "evolution_api_settings";

export type EvolutionSettings = {
  baseUrl: string;
  apiKey: string;
  instanceName: string;
  lastTestStatus: string | null;
  lastTestAt: string | null;
  lastTestError: string | null;
};

export function loadEvolutionSettings(): EvolutionSettings | null {
  try {
    const raw = localStorage.getItem(EVOLUTION_SETTINGS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    return {
      baseUrl: parsed.baseUrl ?? "",
      apiKey: parsed.apiKey ?? "",
      instanceName: parsed.instanceName ?? "",
      lastTestStatus: parsed.lastTestStatus ?? null,
      lastTestAt: parsed.lastTestAt ?? null,
      lastTestError: parsed.lastTestError ?? null,
    };
  } catch {
    return null;
  }
}

export function saveEvolutionSettings(settings: EvolutionSettings) {
  localStorage.setItem(EVOLUTION_SETTINGS_KEY, JSON.stringify(settings));
}

export type EvolutionTestResult = {
  ok: boolean;
  state?: string;
  status?: number;
  error?: string;
  testedAt: string;
};

export async function testEvolutionConnection(
  apiUrl: string,
  apiKey: string,
  instanceName: string
): Promise<EvolutionTestResult> {
  const testedAt = new Date().toISOString();
  const cleanApiUrl = apiUrl.trim().replace(/\/+$/, "");
  const cleanApiKey = apiKey.trim();
  const cleanInstanceName = instanceName.trim();

  if (!cleanApiUrl || !cleanApiKey || !cleanInstanceName) {
    return { ok: false, testedAt, error: "Preencha URL, API Key e nome da instância." };
  }

  try {
    const { data, error } = await cloudClient.functions.invoke("test-evolution-connection", {
      body: { apiUrl: cleanApiUrl, apiKey: cleanApiKey, instanceName: cleanInstanceName },
    });

    if (error) {
      return {
        ok: false,
        testedAt,
        error: `Erro de rede ao chamar o backend de teste: ${error.message}`,
      };
    }

    return {
      ok: data?.ok === true && data?.state === "open",
      state: data?.state,
      status: data?.status,
      error: data?.error,
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
