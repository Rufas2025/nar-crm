## Email Studio — NAR CRM

Módulo de email integrado aos leads, com envio individual, em lote, biblioteca de templates e histórico. Envio via Resend (conector). Editor de texto simples com variáveis `{{nome}}`, `{{empresa}}`, `{{email}}`, `{{link}}`.

### 1. Conector Resend
- Vincular o conector Resend ao projeto (gateway). Sem expor `RESEND_API_KEY` no frontend.
- Domínio remetente configurado no Resend pelo usuário (ex.: `contato@seudominio.com`). Para testes: `onboarding@resend.dev`.

### 2. Banco de dados (novas tabelas)

**`email_templates`** — biblioteca reutilizável
- `id`, `user_id`, `nome`, `assunto`, `corpo` (texto), `created_at`, `updated_at`
- RLS: dono gerencia os próprios templates.

**`email_logs`** — histórico de envios (individual e lote)
- `id`, `user_id`, `lead_id` (nullable), `campaign_id` (nullable), `recipient_email`, `recipient_name`, `assunto`, `corpo_final`, `status` (`pending|sent|failed`), `provider_message_id`, `error_message`, `sent_at`, `created_at`
- RLS: dono lê os próprios.

**`email_campaigns`** — agrupador de envios em lote
- `id`, `user_id`, `nome`, `assunto`, `corpo`, `total`, `enviados`, `falhas`, `status` (`processing|done|partial`), `created_at`
- RLS: dono gerencia as próprias.

Cada envio bem-sucedido também cria uma `activity` no lead (tipo `email`) para aparecer em "Últimas Interações".

### 3. Edge Function `send-email`
Recebe `{ leadId?, to, name?, subject, body, templateVars?, campaignId? }`.
- Renderiza variáveis: `{{nome}}` → primeiro nome, `{{empresa}}`, `{{email}}`, `{{link}}`.
- Chama Resend via gateway: `POST /emails` com `from`, `to`, `subject`, `html` (texto convertido com quebras `<br>`).
- Grava `email_logs` (sent/failed) + activity no lead se sucesso.
- Não expõe chave no frontend.

### 4. Frontend

**Página `/email-studio`** (nova rota + item na sidebar)
- Aba **Templates**: CRUD da biblioteca (nome, assunto, corpo + preview de variáveis).
- Aba **Campanhas**: lista de envios em lote com status (X de Y enviados).
- Aba **Histórico**: tabela de `email_logs` filtrável por lead/status/data; cards de métricas (total, enviados, falhas, taxa de sucesso).

**Botão "Enviar Email" no `LeadDetailPage`**
- Abre `EmailSendModal` com: destinatário (email do lead, editável), assunto, corpo, dropdown para carregar template salvo, preview com variáveis renderizadas.
- Valida email; desabilita se lead não tem email.
- Após envio: toast + atualiza "Últimas Interações".

**Ação em lote "Enviar Email" no `LeadsPage`**
- Aparece na barra de ações em massa (segue padrão do WhatsApp em lote).
- Modal `EmailBulkModal`: assunto, corpo com `{{nome}}`/`{{empresa}}`, dropdown de template, lista dos leads selecionados (descartando sem email), preview rotativo dos 3 primeiros.
- Envio sequencial com 600ms de intervalo, progresso por lead (Pendente / Enviando / ✅ / ❌ + motivo).
- Cria registro em `email_campaigns` e linka cada `email_logs` via `campaign_id`.

### 5. Métricas no Dashboard de Email
Cards: total enviados (7/30 dias), taxa de sucesso, top template usado, últimas falhas.

### 6. Arquivos previstos
- `supabase/migrations/*` — tabelas + RLS + grants.
- `supabase/functions/send-email/index.ts` — envio via Resend gateway.
- `src/pages/EmailStudioPage.tsx` — página com tabs.
- `src/components/EmailSendModal.tsx`, `EmailBulkModal.tsx`, `EmailTemplatesManager.tsx`, `EmailHistoryTable.tsx`, `EmailCampaignsList.tsx`.
- `src/lib/email.ts` — helpers (render de variáveis, validação, chamada da function).
- `src/pages/LeadDetailPage.tsx` — botão "Enviar Email".
- `src/pages/LeadsPage.tsx` — ação em lote.
- `src/components/Sidebar.tsx` — item "Email Studio".
- `src/App.tsx` — rota `/email-studio`.

### 7. Não-mudanças
- Não toca em WhatsApp/Evolution.
- Não altera tabelas existentes (`leads`, `activities`) além de inserts novos.
- Sem editor rich text (texto simples + variáveis, como combinado).

### Pergunta antes de implementar
1. **Domínio remetente**: você já tem um domínio verificado no Resend? Se sim, qual email usar como `from` padrão? Se não, posso começar com `onboarding@resend.dev` (apenas testes, recipient = email da conta Resend).
2. **Item na sidebar**: posso adicionar "Email Studio" entre "Leads" e "Teste WhatsApp"?

Posso seguir?