# AVAILABLE_TOOLS — Tools reais verificadas

> Fonte: `ListConnectors` e `ToolSearch` executados nesta sessão em 2026-09-07.
> Nada aqui é suposição sobre o que uma integração "normalmente teria".

---

## 1. Conectores instalados (resultado literal de `ListConnectors`)

| Conector | installState | connected | enabledInChat |
|---|---|---|---|
| Google Drive | connected | true | **true** |
| Gmail | connected | true | **true** |
| Google Calendar | connected | true | **true** |
| Figma | connected | true | true |
| Higgsfield | connected | true | true |
| Canva | unknown | — | **false** |
| Nome: n8n Rufino LinkedIn — DEV | **needs_reconnect** | **false** | **false** |

### Conclusões diretas

- **Composio: NÃO INSTALADO.** Nenhum conector Composio existe nesta conta/sessão.
  O Google Drive disponível é o conector nativo da Anthropic.
- **Instagram: NÃO EXISTE** — nem nativo, nem Composio, nem via n8n acessível.
- **LinkedIn: NÃO EXISTE** como conector. O único item com "LinkedIn" no nome é o
  servidor n8n DEV, que está `needs_reconnect` e desabilitado no chat.
- **n8n: INACESSÍVEL** nesta sessão. Requer reautorização OAuth, impossível em sessão
  não-interativa. Coerente com a instrução de não depender de n8n.

---

## 2. Tools reais por domínio

### Google Drive — DISPONÍVEL (11 tools)

| Tool | Uso no Radar |
|---|---|
| `mcp__Google_Drive__search_files` | localizar JSON de estado, exports n8n |
| `mcp__Google_Drive__read_file_content` | ler estado persistido |
| `mcp__Google_Drive__download_file_content` | ler export de workflow n8n (Fase 9) |
| `mcp__Google_Drive__get_file_metadata` | metadata |
| `mcp__Google_Drive__create_file` | **escrever** estado do Radar |
| `mcp__Google_Drive__update_file` | atualizar oportunidade |
| `mcp__Google_Drive__list_recent_files` | inventário |
| `mcp__Google_Drive__copy_file`, `share_file`, `trash_file`, `get_file_permissions` | não necessários |

→ Drive é **leitura e escrita**. Viável como persistência sem migration.

### Gmail — DISPONÍVEL (29 tools)

Relevantes: `create_draft`, `update_draft`, `send_message`, `search_threads`,
`get_message`, `get_thread`, `list_drafts`.

→ Suporta o modelo `email_draft = automatic` / `email_send = approval_required`:
criar rascunho automaticamente e **nunca** chamar `send_message` sem aprovação.

### Google Calendar — DISPONÍVEL (9 tools)
Útil para agendar recheck (Fase `radar.schedule_recheck`), não essencial.

### Pesquisa web — DISPONÍVEL
`WebSearch` e `WebFetch` (deferred, carregáveis via ToolSearch).
→ **Este é o único mecanismo real de enrichment** (Fase 5): site oficial, cidade,
telefone institucional, e-mails públicos, notícias de obra.

### Instagram — **INDISPONÍVEL**
Nenhuma tool. Implicações sobre a Fase 4:

| Caminho da Fase 4 | Viável? | Como |
|---|---|---|
| A. Danielle/equipe envia URL manualmente | **Sim** | entrada manual, sem tool |
| B. Link enviado ao Rufas | **Sim** | via Telegram/n8n, fora do Radar |
| C. Discovery automático no Instagram | **Não** | sem tool |
| D. Monitoramento de perfis conhecidos | **Não** | sem tool |

Ressalva técnica adicional, independente de conector: mesmo com `WebFetch`, o Instagram
serve login-wall para clientes não-navegador na maior parte do conteúdo. Não posso
prometer leitura confiável de post público por URL sem testar caso a caso.

### LinkedIn — **INDISPONÍVEL**
Nenhuma tool. Ressalva adicional: mesmo com um conector, a API oficial do LinkedIn
**não expõe busca de pessoas nem dados de contato** — isso é restrito ao Sales Navigator,
e coleta por scraping viola os Termos de Uso da plataforma. A Fase 5, no item
"pessoas relevantes / LinkedIn", não tem caminho automatizado legítimo hoje.

### Telegram — **INDISPONÍVEL como tool**
Não há conector Telegram. O Telegram existe no fluxo Rufas/Hermes, mas via n8n —
fora do alcance desta sessão e explicitamente fora do escopo do Radar.
→ Fase 7 deve produzir **contrato/payload estruturado** para o Rufas consumir,
não uma chamada direta ao Telegram.

---

## 3. Persistência disponível — comparação

| Opção | Prós | Contras |
|---|---|---|
| **Supabase (novas tabelas)** | queries reais, RLS, joins, dedupe por constraint, escala | exige migration (3–4 tabelas novas) |
| **Google Drive (JSON)** | zero migration, já conectado, versionável | sem query, dedupe manual, concorrência frágil, não escala |
| `email_templates.data` (jsonb) | zero migration | desvio semântico grave — é tabela de e-mail |

Recomendação técnica: **Supabase com tabelas próprias**. O modelo `Opportunity` tem
relacionamentos reais (institution 1:N signals, 1:N contacts) e exige deduplicação —
requisito explícito da Fase 2 que JSON em Drive não atende de forma confiável.

---

## 4. Nota sobre dados pessoais

A Fase 5 coleta nome, cargo, e-mail e telefone de pessoas identificáveis para abordagem
comercial. Isso é tratamento de dado pessoal sob a LGPD. Duas salvaguardas que já estão
alinhadas ao que você pediu e que vale manter explícitas no design:

- `verification_status` distinguindo `public_source` de `inferred`/`unverified`, com
  `source_url` obrigatório — já previsto na Fase 2.
- Nunca fabricar padrão de e-mail (`nome@dominio`) como se fosse confirmado —
  já previsto nas suas regras.

Vale registrar base legal (legítimo interesse) e um caminho de opt-out antes do
primeiro envio real. Não bloqueia o Radar, mas bloqueia o `email_send`.
