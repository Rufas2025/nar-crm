## Integração Gmail Drafts — NAR CRM + Email Studio

Objetivo: conectar Gmail (rufino@eduinfo.com.br) via OAuth, criar **rascunhos** (nunca envios) individuais e em lote (≤20) a partir dos leads. Não toca em Resend nem no Studio existente — apenas adiciona.

---

### 1. Banco (1 migration)

**`gmail_connections`** — guarda token da conta Gmail por user
- `user_id` (unique), `email`, `access_token`, `refresh_token`, `expires_at`, `scope`, `connected_at`
- RLS: dono lê/atualiza o próprio. Tokens nunca expostos ao client (só edge functions com service_role).
- GRANTs: `authenticated` (SELECT do próprio para mostrar status/email), `service_role` (ALL).

**`gmail_drafts`** — histórico de rascunhos criados
- `user_id`, `lead_id` (nullable), `campaign_id` (nullable), `gmail_draft_id`, `to_email`, `subject`, `template_type`, `status` (`created|failed`), `error_message`, `is_test` (bool), `created_at`.
- RLS: dono CRUD próprio.

**`gmail_test_approvals`** — marca aprovação do teste antes de liberar lote
- `user_id`, `campaign_id` (text/uuid livre), `approved_at`.

---

### 2. Edge Functions (4 novas)

Todas usam secrets já configurados: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`.

**`google-oauth-start`** (`verify_jwt = true`)
- Monta URL: `https://accounts.google.com/o/oauth2/v2/auth` com `scope=gmail.compose`, `access_type=offline`, `prompt=consent`, `state=<user_id>:<nonce>`.
- Retorna `{ url }` (frontend faz `window.location = url`).

**`google-oauth-callback`** (`verify_jwt = false`, público — Google chama)
- Recebe `code` + `state`; troca por tokens em `oauth2.googleapis.com/token`.
- Busca email via `gmail.googleapis.com/gmail/v1/users/me/profile`.
- Valida `emailAddress === "rufino@eduinfo.com.br"` (configurável via constante). Se errado: redireciona com `?gmail=wrong_account`.
- Upsert em `gmail_connections` com service_role.
- Redireciona para `/configuracoes?gmail=connected`.

**`create-gmail-draft`** (`verify_jwt = true`)
- Body: `{ leadId?, to, subject, htmlBody, plainTextBody, templateType, campaignId?, isTest? }`.
- Validação Gmail-safe: rejeita HTML contendo `data:`, `blob:`, `localhost`, `/src/assets`, `base64,`.
- Refresh token se `expires_at` venceu.
- Monta MIME `multipart/alternative` (plain + html), base64url-encode.
- POST `gmail.googleapis.com/gmail/v1/users/me/drafts` com `{ message: { raw } }`.
- Grava `gmail_drafts`. Retorna `{ gmailDraftId, draftUrl }`.

**`create-gmail-draft-batch`** (`verify_jwt = true`)
- Body: `{ leads: [{leadId,to,name,empresa}], subject, htmlBody, plainTextBody, templateType, campaignId }`.
- Hard cap: `leads.length <= 20`.
- Exige registro em `gmail_test_approvals` para o `campaignId` antes de processar (sem aprovação → 403).
- Loop sequencial (300ms entre cada), substitui `{{nome}}`/`{{empresa}}` por lead, chama mesma lógica de criação.
- Retorna `{ created: [...], failed: [...], pending: [...] }`.

---

### 3. Frontend

**`src/lib/gmail.ts`** — helpers: `startGmailConnect()`, `getGmailStatus()`, `disconnectGmail()`, `createDraft()`, `createDraftBatch()`, `approveTestCampaign()`.

**`ConfiguracoesPage.tsx`** — nova seção "Gmail da Eduinfo":
- Card mostra status (Conectado/Desconectado), email conectado, conta esperada (`rufino@eduinfo.com.br`).
- Botões: "Conectar Gmail" / "Desconectar Gmail".
- Trata query `?gmail=connected|wrong_account|error` com toast.

**`EmailStudioPage.tsx`** — barra de ações de rascunho (não substitui exportação atual):
- Botão **"Criar rascunho de teste"** → abre dialog para escolher 1 dos 2 leads de teste (Colégio Rufas, Colégio Serrano) e cria 1 draft (`isTest=true`). Mostra link "Abrir no Gmail".
- Botão **"Aprovar teste"** (habilita após criar teste) → grava `gmail_test_approvals` para o `campaignId` atual.
- Botão **"Criar rascunhos do lote"** (habilita após aprovação) → abre dialog com seleção de até 20 leads (lista vinda de `leads` com email válido), mostra progresso por lead.
- `campaignId` é gerado por sessão do Studio (uuid local), reaproveitado nas 3 ações.

Leads de teste hard-coded no dialog se não existirem no banco; se existirem com esses nomes, usa o registro real.

---

### 4. Garantias

- Não toca em Resend, Evolution, WhatsApp, templates existentes, tabelas de leads/activities.
- Nenhum envio automático — apenas `drafts.create`.
- Tokens só vivem em edge functions (service_role); frontend nunca vê access/refresh token.
- Validador Gmail-safe roda no servidor antes do MIME.

---

### Arquivos

Novos:
- `supabase/migrations/<timestamp>_gmail_drafts.sql`
- `supabase/functions/google-oauth-start/index.ts`
- `supabase/functions/google-oauth-callback/index.ts`
- `supabase/functions/create-gmail-draft/index.ts`
- `supabase/functions/create-gmail-draft-batch/index.ts`
- `src/lib/gmail.ts`
- `src/components/GmailConnectionCard.tsx`
- `src/components/GmailDraftActions.tsx`

Editados:
- `src/pages/ConfiguracoesPage.tsx` (insere `<GmailConnectionCard/>`)
- `src/pages/EmailStudioPage.tsx` (insere `<GmailDraftActions/>`)
- `supabase/config.toml` (verify_jwt do callback = false)

---

### Pergunta antes de implementar

1. O `GOOGLE_REDIRECT_URI` que vocês configuraram aponta para a URL pública do `google-oauth-callback` (`https://iwoatxmezwqytvsqjaoe.supabase.co/functions/v1/google-oauth-callback`)? Se for outra URL, me diga qual — preciso bater certinho senão o Google rejeita.
2. Posso travar a validação em `rufino@eduinfo.com.br` como única conta aceita, ou prefere uma allowlist (ex.: também aceitar outras contas `@eduinfo.com.br`)?

Posso seguir?