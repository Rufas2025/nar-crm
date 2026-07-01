import { supabase as cloud } from "@/integrations/supabase/client";
import { supabase as crm } from "@/lib/supabase";

export const GMAIL_EXPECTED_ACCOUNT = "rufino@eduinfo.com.br";

export interface GmailStatus {
  connected: boolean;
  email: string | null;
  connectedAt: string | null;
}

export async function getGmailStatus(): Promise<GmailStatus> {
  const { data, error } = await cloud
    .from("gmail_connections")
    .select("email, connected_at")
    .maybeSingle();
  if (error) {
    console.warn("getGmailStatus", error);
    return { connected: false, email: null, connectedAt: null };
  }
  if (!data) return { connected: false, email: null, connectedAt: null };
  return { connected: true, email: data.email, connectedAt: data.connected_at };
}

export async function startGmailConnect(returnTo?: string): Promise<string> {
  const { data: sessionData } = await crm.auth.getSession();
  const accessToken = sessionData?.session?.access_token;
  if (!accessToken) throw new Error("Você precisa estar autenticado para conectar o Gmail.");

  const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/google-oauth-start`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      authToken: accessToken,
      returnTo: returnTo ?? `${window.location.origin}/configuracoes`,
    }),
  });

  const text = await response.text();
  let data: { url?: string; error?: string } | null = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }

  if (!response.ok) {
    const detail = data?.error || text || response.statusText || "Erro desconhecido";
    console.error("google-oauth-start failed", {
      status: response.status,
      body: data ?? text,
      authorizationSent: Boolean(accessToken),
    });
    throw new Error(`google-oauth-start ${response.status}: ${detail}`);
  }

  const url = (data as { url?: string })?.url;
  if (!url) throw new Error("URL de autorização não retornada");
  return url;
}

export async function disconnectGmail(): Promise<void> {
  const { data: userData } = await crm.auth.getUser();
  if (!userData?.user) throw new Error("Não autenticado");
  const { error } = await cloud
    .from("gmail_connections")
    .delete()
    .eq("user_id", userData.user.id);
  if (error) throw error;
}

export interface CreateDraftPayload {
  leadId?: string | null;
  to: string;
  subject: string;
  htmlBody: string;
  plainTextBody: string;
  templateType?: string;
  campaignId?: string;
  isTest?: boolean;
}

export async function createGmailDraft(payload: CreateDraftPayload) {
  const { data, error } = await cloud.functions.invoke("create-gmail-draft", { body: payload });
  if (error) throw new Error((error as { message?: string }).message || "Falha ao criar rascunho");
  return data as { gmailDraftId: string; draftUrl: string };
}

export interface BatchLead {
  leadId?: string | null;
  to: string;
  nome?: string;
  empresa?: string;
}

export async function createGmailDraftBatch(payload: {
  leads: BatchLead[];
  subject: string;
  htmlBody: string;
  plainTextBody: string;
  templateType?: string;
  campaignId: string;
}) {
  const { data, error } = await cloud.functions.invoke("create-gmail-draft-batch", { body: payload });
  if (error) throw new Error((error as { message?: string }).message || "Falha no lote");
  return data as {
    created: { leadId?: string | null; to: string; gmailDraftId: string; draftUrl: string }[];
    failed: { leadId?: string | null; to: string; error: string }[];
    summary: { total: number; created: number; failed: number };
  };
}

export async function approveTestCampaign(campaignId: string): Promise<void> {
  const { data: userData } = await crm.auth.getUser();
  if (!userData?.user) throw new Error("Não autenticado");
  const { error } = await cloud
    .from("gmail_test_approvals")
    .upsert(
      { user_id: userData.user.id, campaign_id: campaignId, approved_at: new Date().toISOString() },
      { onConflict: "user_id,campaign_id" },
    );
  if (error) throw error;
}

export async function isTestApproved(campaignId: string): Promise<boolean> {
  const { data } = await cloud
    .from("gmail_test_approvals")
    .select("id")
    .eq("campaign_id", campaignId)
    .maybeSingle();
  return !!data;
}
