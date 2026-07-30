// Camada de acesso a public.gmail_connections.
//
// O schema divergiu entre ambientes: parte usa as colunas canônicas
// (access_token / refresh_token / expires_at / scope) e parte usa o nome com
// sufixo (access_token_enc / refresh_token_enc / token_expiry / scopes).
// Este módulo detecta o layout real em runtime e grava exatamente nas colunas
// existentes, sem depender de migration.
//
// IMPORTANTE sobre criptografia: não existe helper de encrypt/decrypt neste
// projeto e as funções de rascunho usam o valor lido diretamente como
// `Authorization: Bearer <token>` (ver createSingleDraft em ./gmail.ts).
// Logo, o token é gravado e lido no mesmo formato nos dois layouts. Se um dia
// as colunas *_enc passarem a ser realmente criptografadas, encrypt/decrypt
// devem entrar aqui — em um único ponto — e não no callback.
import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

export interface TokenColumns {
  accessToken: string;
  refreshToken: string;
  expiry: string;
  scope: string;
  encryptedNaming: boolean;
}

const CANONICAL: TokenColumns = {
  accessToken: "access_token",
  refreshToken: "refresh_token",
  expiry: "expires_at",
  scope: "scope",
  encryptedNaming: false,
};

const SUFFIXED: TokenColumns = {
  accessToken: "access_token_enc",
  refreshToken: "refresh_token_enc",
  expiry: "token_expiry",
  scope: "scopes",
  encryptedNaming: true,
};

let cachedColumns: TokenColumns | null = null;

/** Descobre qual layout de colunas a tabela realmente usa (resultado em cache por isolate). */
export async function detectTokenColumns(admin: SupabaseClient): Promise<TokenColumns> {
  if (cachedColumns) return cachedColumns;
  for (const layout of [CANONICAL, SUFFIXED]) {
    const cols = [layout.accessToken, layout.refreshToken, layout.expiry].join(",");
    const { error } = await admin.from("gmail_connections").select(cols).limit(1);
    if (!error) {
      if (layout.encryptedNaming) {
        console.warn(
          "[gmail_connections] tabela usa colunas *_enc; nenhum helper de cripto disponível — valor gravado e lido no mesmo formato",
        );
      }
      cachedColumns = layout;
      return layout;
    }
  }
  throw new Error("gmail_connections: colunas de token não reconhecidas");
}

export interface GmailConnection {
  email: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: string | null;
}

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

/** Lê a conexão aceitando qualquer um dos dois layouts de colunas. */
export async function getConnection(
  admin: SupabaseClient,
  userId: string,
): Promise<GmailConnection | null> {
  const { data, error } = await admin
    .from("gmail_connections").select("*").eq("user_id", userId).maybeSingle();
  if (error || !data) return null;
  const row = data as Record<string, unknown>;
  const accessToken = asString(row.access_token) || asString(row.access_token_enc);
  const refreshToken = asString(row.refresh_token) || asString(row.refresh_token_enc);
  const expiresAt = asString(row.expires_at) || asString(row.token_expiry) || null;
  if (!accessToken || !refreshToken) return null;
  return { email: asString(row.email), accessToken, refreshToken, expiresAt };
}

const MISSING_COLUMN = /Could not find the '([^']+)' column|column "?([\w.]+)"? of relation|column ([\w.]+) does not exist/i;

function missingColumnFrom(error: { message?: string } | null): string | null {
  const match = MISSING_COLUMN.exec(error?.message ?? "");
  if (!match) return null;
  const name = match[1] ?? match[2] ?? match[3] ?? "";
  return name.includes(".") ? name.split(".").pop()! : name || null;
}

/**
 * Executa a escrita removendo colunas opcionais que a tabela real não possui.
 * Colunas de token nunca entram em `optional`: se elas faltarem, o erro sobe.
 */
async function writeWithColumnFallback(
  payload: Record<string, unknown>,
  optional: Set<string>,
  exec: (p: Record<string, unknown>) => Promise<{ error: { message?: string } | null }>,
): Promise<{ error?: string }> {
  const current = { ...payload };
  for (let attempt = 0; attempt <= optional.size; attempt++) {
    const { error } = await exec(current);
    if (!error) return {};
    const missing = missingColumnFrom(error);
    if (!missing || !optional.has(missing) || !(missing in current)) {
      return { error: error.message ?? "erro desconhecido" };
    }
    delete current[missing];
  }
  return { error: "gmail_connections: schema incompatível" };
}

export async function upsertConnection(
  admin: SupabaseClient,
  conn: {
    userId: string;
    email: string;
    accessToken: string;
    refreshToken: string;
    expiresAt: string;
    scope: string;
  },
): Promise<{ error?: string }> {
  const cols = await detectTokenColumns(admin);
  const now = new Date().toISOString();
  const payload: Record<string, unknown> = {
    user_id: conn.userId,
    email: conn.email,
    [cols.accessToken]: conn.accessToken,
    [cols.refreshToken]: conn.refreshToken,
    [cols.expiry]: conn.expiresAt,
    [cols.scope]: conn.scope,
    connected_at: now,
    updated_at: now,
  };
  const optional = new Set([cols.scope, "connected_at", "updated_at"]);
  return await writeWithColumnFallback(payload, optional, async (p) => {
    const { error } = await admin.from("gmail_connections").upsert(p, { onConflict: "user_id" });
    return { error };
  });
}

export async function updateAccessToken(
  admin: SupabaseClient,
  userId: string,
  accessToken: string,
  expiresAt: string,
): Promise<{ error?: string }> {
  const cols = await detectTokenColumns(admin);
  const payload: Record<string, unknown> = {
    [cols.accessToken]: accessToken,
    [cols.expiry]: expiresAt,
    updated_at: new Date().toISOString(),
  };
  return await writeWithColumnFallback(payload, new Set(["updated_at"]), async (p) => {
    const { error } = await admin.from("gmail_connections").update(p).eq("user_id", userId);
    return { error };
  });
}
