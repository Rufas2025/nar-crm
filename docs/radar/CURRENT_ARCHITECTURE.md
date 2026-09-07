# CURRENT_ARCHITECTURE — Auditoria para o Radar de Obras

> Documento de auditoria (Fase 1). Nada implementado. Todas as afirmações abaixo
> foram verificadas por leitura direta do repositório, do schema gerado do banco
> e da lista de conectores da sessão — não por suposição.

Data da auditoria: 2026-09-07
Repositório: `Rufas2025/nar-crm` — branch `claude/nar-eco-mcp-n8n-drive-b1my70`
(`origin/main` fetchado e idêntico, HEAD `0edef4e`)

---

## 1. Onde está o "MCP Eduinfo existente"

**Não existe servidor MCP em código.** Verificação: `grep -rl "modelcontextprotocol|McpServer|FastMCP"` → zero
ocorrências em todo o repositório.

O "MCP Eduinfo" é um **workflow n8n** hospedado em
`instituto-educacional-crescer-n8n.snfrzv.easypanel.host`, construído ao longo desta
sessão. Sua arquitetura atual (v3.5 / definitive):

```
MCP Server Trigger (Bearer auth, path /mcp/eduinfo-assets/sse)
├── eduinfo_list_root      → Source=Define Below (sem input de negócio)
├── eduinfo_search_folder  → Source=Database → workflow real separado
└── eduinfo_get_asset      → Source=Database → workflow real separado
     └── emite signed URL HMAC-SHA256, TTL 5 min
+ webhook /webhook/eduinfo-assets/v3.3/asset (valida HMAC → stream binário)
```

Escopo: read-only sobre a pasta `Eduinfo_2026_nar`
(`ROOT_ID=1WcIuTx8ydx-8umN3PiFQ9OPJGtnG6EpL`), profundidade root → pasta filha direta.

**Consequência para o Radar:** expandir esse MCP significa editar workflows n8n — o que
esta instrução proíbe explicitamente. Ver `RADAR_GAP_ANALYSIS.md`, bloqueador B1.

---

## 2. Estrutura do projeto CRM

- **Frontend:** Vite + React + TypeScript + shadcn/ui (`vite_react_shadcn_ts`). Não é Next.js.
  - `src/pages` — páginas; `src/components`; `src/lib` — lógica de negócio.
- **Backend:** Supabase (Edge Functions em Deno + Postgres).
  - `supabase/functions/*` — 9 funções + `_shared`
  - `supabase/migrations/*` — 7 migrations
- **Dois clients Supabase no frontend:** `src/integrations/supabase/client.ts` (aliased `cloud`)
  e `src/lib/supabase` (aliased `crm`).

### Edge Functions existentes

| Função | Papel |
|---|---|
| `prepare-email-assets` | upload de imagem (data URL base64) → bucket privado `email-assets` → signed URL 1 ano |
| `create-gmail-draft` / `-batch` | criação de rascunho no Gmail |
| `google-oauth-start` / `-callback` | fluxo OAuth Google |
| `evolution-config` / `-send-message` / `test-evolution-connection` | WhatsApp via Evolution GO |
| `admin-reset-password` | administrativo |
| `_shared/gmail.ts` | `getUserFromRequest()` (JWT → userId) e `adminClient()` (service role) |

---

## 3. Persistência atual (schema real, de `types.ts` gerado do banco)

Cinco tabelas, apenas:

| Tabela | Colunas |
|---|---|
| `email_templates` | `id, user_id, nome, template_type, data(jsonb), created_at, updated_at` |
| `evolution_config` | config WhatsApp por usuário |
| `gmail_connections` | tokens/conexão Gmail |
| `gmail_drafts` | rascunhos gerados |
| `gmail_test_approvals` | aprovações de teste |

**Não existe** nenhuma tabela de instituições, sinais, contatos, oportunidades ou leads.
`grep -ri "radar|opportunity|oportunidade"` em `.ts/.tsx/.sql` → só texto de marketing em
`src/lib/brands.ts`, nenhum código.

### Storage
- Bucket `email-assets` — **privado**, path `${userId}/${campaignId}/${uuid}.${ext}`,
  acesso por signed URL.

---

## 4. Autenticação

Padrão único em todo o backend: **JWT do Supabase Auth**.

- `supabase/config.toml` mantém `verify_jwt = true` para todas as funções exceto
  `google-oauth-callback`.
- RLS: `USING (auth.uid() = user_id)` — escopo por usuário.
- **Não existe** nenhum mecanismo de auth não-interativo (API key, shared secret,
  service account) para agentes externos. Decisão já tomada em rodada anterior:
  service user dedicado + JWT, reutilizando `getUserFromRequest()`.

---

## 5. Integração Composio

**Não existe.** Verificações:
- `grep -ri "composio"` no repositório → zero ocorrências, e zero em 211 commits de histórico.
- `ListConnectors` da sessão → nenhum conector Composio instalado.

O acesso a Google Drive desta sessão é o **conector nativo da Anthropic**, não Composio.
Ver `AVAILABLE_TOOLS.md`.

---

## 6. Integração Google Drive

Dois caminhos distintos, que não se confundem:

1. **MCP Eduinfo (n8n)** — Google Drive OAuth2 credential `ch54C5Fg1ElIedk9`
   ("Google Drive NAR ECO"), escopo restrito à árvore `Eduinfo_2026_nar`, read-only.
2. **Conector nativo Google Drive (esta sessão)** — `mcp__Google_Drive__*`, escopo da
   conta conectada, com search/read/create/update.

---

## 7. Agentes que consomem o MCP

- **Rufas / Hermes** — via Telegram → n8n → MCP Eduinfo (SSE + Bearer).
- O código do fluxo Telegram **não está neste repositório** (`grep -ri "telegram"` → zero,
  inclusive em todo o histórico). Vive inteiramente no n8n.
- `prepare-email-assets` **não tem nenhum caller em `src/`** — é alcançada apenas por HTTP
  externo, presumivelmente pelo n8n.

---

## 8. Resumo do que é reutilizável para o Radar

| Componente | Reutilizável? | Observação |
|---|---|---|
| Supabase Postgres + RLS | Sim | única persistência estruturada disponível |
| Padrão `getUserFromRequest()` + `adminClient()` | Sim | auth já resolvida |
| Edge Functions (padrão Deno) | Sim | molde pronto para novas funções |
| Google Drive (conector nativo) | Sim | leitura/escrita de JSON como persistência alternativa |
| Gmail (conector nativo + Edge Functions) | Sim | outreach por rascunho, com aprovação |
| MCP Eduinfo (n8n) | **Condicionado** | expandir = editar n8n, proibido nesta instrução |
| Composio | **Não** | não está conectado |
| Instagram | **Não** | nenhum conector |
| LinkedIn | **Não** | nenhum conector |
