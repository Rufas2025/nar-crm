import { supabase as cloudClient } from "@/integrations/supabase/client";

export const EVOLUTION_SETTINGS_KEY = "evolution_api_settings";

export type EvolutionSettings = {
  baseUrl: string;
  apiKey: string;
  instanceName: string;
  lastTestStatus: string | null;
  lastTestAt: string | null;
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
  error?: string;
};

/**
 * Testa a conexão com a Evolution API.
 * Tenta fetch direto do navegador; se falhar por rede/CORS,
 * usa a edge function `test-evolution-connection` no backend.
 */
export async function testEvolutionConnection(
  apiUrl: string,
  apiKey: string,
  instanceName: string
): Promise<EvolutionTestResult> {
  const url = `${apiUrl.replace(/\/$/, "")}/instance/connectionState/${encodeURIComponent(instanceName)}`;

  try {
    const resp = await fetch(url, {
      method: "GET",
      headers: {
        apikey: apiKey,
        "Content-Type": "application/json",
      },
    });

    const text = await resp.text();
    let data: any = {};
    try {
      data = JSON.parse(text);
    } catch {
      // resposta não-JSON
    }

    if (!resp.ok) {
      return {
        ok: false,
        error: `HTTP ${resp.status}: ${text ? text.slice(0, 300) : "sem corpo de resposta"}`,
      };
    }

    const state = data?.instance?.state ?? data?.state;
    if (!state) {
      return { ok: false, error: "Resposta 2xx, mas sem 'instance.state'." };
    }

    return { ok: true, state };
  } catch {
    // Provável erro de CORS/rede no navegador — usar edge function no backend
    try {
      const { data, error } = await cloudClient.functions.invoke("test-evolution-connection", {
        body: { baseUrl: apiUrl, apiKey, instanceName },
      });

      if (error) {
        return { ok: false, error: error.message };
      }
      if (!data?.ok) {
        return { ok: false, error: data?.error ?? "Erro desconhecido no teste de conexão." };
      }
      return { ok: true, state: data.state };
    } catch (e: any) {
      return { ok: false, error: String(e?.message ?? e) };
    }
  }
}
