import { supabase as crm } from "@/lib/supabase";
import { supabase as cloud } from "@/integrations/supabase/client";

export type EvolutionSettings = {
  apiUrl: string;
  apiKey: string;
  instanceName: string;
  connectionStatus: string | null;
  lastTestedAt: string | null;
  lastTestError: string | null;
};

async function getCrmToken(): Promise<string | null> {
  const { data } = await crm.auth.getSession();
  return data.session?.access_token ?? null;
}

/**
 * Lê a configuração da Evolution API da tabela `evolution_config` (via backend).
 */
export async function loadEvolutionSettings(): Promise<EvolutionSettings | null> {
  const authToken = await getCrmToken();
  if (!authToken) return null;

  const { data, error } = await cloud.functions.invoke("evolution-config", {
    body: { action: "get", authToken },
  });

  if (error || !data?.ok || !data?.config) return null;

  const c = data.config;
  return {
    apiUrl: c.api_url ?? "",
    apiKey: c.api_key ?? "",
    instanceName: c.instance_name ?? "",
    connectionStatus: c.connection_status ?? null,
    lastTestedAt: c.last_tested_at ?? null,
    lastTestError: c.last_test_error ?? null,
  };
}

/**
 * Salva a configuração da Evolution API na tabela `evolution_config` (via backend).
 */
export async function saveEvolutionSettings(settings: EvolutionSettings): Promise<void> {
  const authToken = await getCrmToken();
  if (!authToken) throw new Error("Usuário não autenticado.");

  const { data, error } = await cloud.functions.invoke("evolution-config", {
    body: {
      action: "save",
      authToken,
      apiUrl: settings.apiUrl,
      apiKey: settings.apiKey,
      instanceName: settings.instanceName,
      connectionStatus: settings.connectionStatus,
      lastTestedAt: settings.lastTestedAt,
      lastTestError: settings.lastTestError,
    },
  });

  if (error) throw new Error(error.message);
  if (!data?.ok) throw new Error(data?.error ?? "Erro ao salvar configuração.");
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
 */
export async function testEvolutionConnection(
  settings: Pick<EvolutionSettings, "apiUrl" | "apiKey" | "instanceName">
): Promise<EvolutionTestResult> {
  const testedAt = new Date().toISOString();

  try {
    const { data, error } = await cloud.functions.invoke("test-evolution-connection", {
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

export type SendWhatsAppResult = {
  ok: boolean;
  error?: string | null;
  messageId?: string | null;
  interactionRegistered?: boolean;
  attachmentDeferred?: boolean;
};

export type WhatsAppMediaInput = {
  url: string;
  type: "image" | "document";
  fileName?: string | null;
};

/**
 * Envia mensagem de WhatsApp pelo backend (Edge Function `evolution-send-message`),
 * que busca a configuração na tabela `evolution_config` e usa a Evolution GO.
 * Suporta opcionalmente um anexo (imagem ou documento) já hospedado em storage acessível.
 */
export async function sendWhatsAppMessage(params: {
  leadId?: string | null;
  phone: string;
  message?: string | null;
  media?: WhatsAppMediaInput | null;
}): Promise<SendWhatsAppResult> {
  const authToken = await getCrmToken();
  if (!authToken) return { ok: false, error: "Usuário não autenticado." };

  try {
    const { data, error } = await cloud.functions.invoke("evolution-send-message", {
      body: {
        authToken,
        leadId: params.leadId ?? null,
        phone: params.phone,
        message: params.message ?? null,
        mediaUrl: params.media?.url ?? null,
        mediaType: params.media?.type ?? null,
        fileName: params.media?.fileName ?? null,
      },
    });

    if (error) {
      // Tenta extrair a mensagem real do corpo da resposta de erro
      let errMsg: string | undefined;
      if ("context" in error) {
        const body = await (error as { context?: Response }).context?.json?.().catch(() => null);
        errMsg = body?.error;
      }
      return { ok: false, error: errMsg ?? error.message ?? "Erro ao enviar mensagem." };
    }

    return {
      ok: data?.ok === true,
      error: data?.error ?? null,
      messageId: data?.messageId ?? null,
      interactionRegistered: data?.interactionRegistered === true,
      attachmentDeferred: data?.attachmentDeferred === true,
    };
  } catch (e: any) {
    return { ok: false, error: String(e?.message ?? e) };
  }
}

