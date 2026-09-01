# NAR Capability Registry — v0.1.0

> **STATUS: LAB / MOCK / READ-ONLY.** Nenhuma capability aqui conecta CRM real, Google Drive real ou n8n real.
> Nenhuma credencial, nenhum secret, nenhum side effect, nenhum endpoint publicado.
> Fonte da verdade legível por máquina: `capability-registry.json`. Contrato: `../mcp/nar-ops-mcp-contract.json`.

## Princípio

O MCP expõe **capabilities de negócio delimitadas**, nunca acesso técnico genérico.

Formas de tool proibidas por política — nunca podem ser registradas:

- `sql_query`
- `execute_any_api`
- `drive_search_global`
- `http_request_anywhere`
- `run_code`
- `write_file_anywhere`

## Política

| Regra | Valor |
|---|---|
| `read_only_enforced` | `true` |
| `fail_closed` | `true` |
| `deny_by_default` | `true` |
| `no_credentials` | `true` |
| `no_secrets` | `true` |
| `no_side_effects` | `true` |
| `no_capability_invention` | `true` |
| `no_generic_access` | `true` |

- Um agente só pode invocar tool explicitamente listada em seu allowed_tools.
- Agente desconhecido é tratado como não autorizado (ACCESS_DENIED), nunca como permitido.
- Tool não declarada neste contrato não existe (UNKNOWN_TOOL), mesmo que o agente peça por ela.
- Nenhum input pode ampliar escopo: raízes e allowlists são fixas no contrato.
- Toda resposta usa o envelope padrão; erros nunca são silenciosos.

Se um agente invoca tool não autorizada: **`ACCESS_DENIED`**. Se a tool não existe no contrato: **`UNKNOWN_TOOL`**.

## Agentes

| Agente | Papel | Tools |
|---|---|---|
| `rufas-router` | Roteador de intenção entre subagentes. Não executa capability de negócio. | **nenhuma** |
| `marketing-nar` | Conteúdo, campanhas e assets de marca. | 5 |
| `atendimento-nar` | Atendimento e cadência com contatos. | 5 |
| `crm-nar` | Higiene, priorização e leitura do funil. | 5 |
| `produto-nar` | Produto, documentação e posicionamento. | 6 |
| `engenharia-nar` | Engenharia e integrações. | 3 |

## Matriz de acesso

| Tool | `rufas-router` | `marketing-nar` | `atendimento-nar` | `crm-nar` | `produto-nar` | `engenharia-nar` |
|---|---|---|---|---|---|---|
| `eduinfo_list_root` | ⛔ | ✅ | ⛔ | ⛔ | ✅ | ✅ |
| `eduinfo_search_folder` | ⛔ | ✅ | ⛔ | ⛔ | ✅ | ✅ |
| `eduinfo_get_asset` | ⛔ | ✅ | ⛔ | ⛔ | ✅ | ✅ |
| `crm_list_eligible_contacts` | ⛔ | ⛔ | ✅ | ✅ | ⛔ | ⛔ |
| `crm_get_contact_context` | ⛔ | ⛔ | ✅ | ✅ | ⛔ | ⛔ |
| `crm_get_followups_due` | ⛔ | ⛔ | ✅ | ✅ | ⛔ | ⛔ |
| `crm_get_demo_scheduled` | ⛔ | ⛔ | ✅ | ✅ | ⛔ | ⛔ |
| `proposal_get_pending` | ⛔ | ⛔ | ✅ | ✅ | ✅ | ⛔ |
| `campaign_get_history` | ⛔ | ✅ | ⛔ | ⛔ | ✅ | ⛔ |
| `campaign_get_brand_context` | ⛔ | ✅ | ⛔ | ⛔ | ✅ | ⛔ |

✅ = autorizado · ⛔ = `ACCESS_DENIED`

## Capabilities

| # | Tool | Domínio | Owner | Read-only | Side effects | Aprovação |
|---|---|---|---|---|---|---|
| 1 | `eduinfo_list_root` | eduinfo | `engenharia-nar` | ✅ | nenhum | não |
| 2 | `eduinfo_search_folder` | eduinfo | `engenharia-nar` | ✅ | nenhum | não |
| 3 | `eduinfo_get_asset` | eduinfo | `engenharia-nar` | ✅ | nenhum | não |
| 4 | `crm_list_eligible_contacts` | crm | `crm-nar` | ✅ | nenhum | não |
| 5 | `crm_get_contact_context` | crm | `crm-nar` | ✅ | nenhum | não |
| 6 | `crm_get_followups_due` | crm | `crm-nar` | ✅ | nenhum | não |
| 7 | `crm_get_demo_scheduled` | crm | `crm-nar` | ✅ | nenhum | não |
| 8 | `proposal_get_pending` | proposals | `produto-nar` | ✅ | nenhum | não |
| 9 | `campaign_get_history` | campaigns | `marketing-nar` | ✅ | nenhum | não |
| 10 | `campaign_get_brand_context` | campaigns | `marketing-nar` | ✅ | nenhum | não |

---

### 1. `eduinfo_list_root`

- **DOMAIN:** `eduinfo`
- **OWNER:** `engenharia-nar`
- **PURPOSE:** Listar itens autorizados da raiz Eduinfo.
- **READ_ONLY:** `true`
- **SIDE_EFFECTS:** nenhum
- **APPROVAL_REQUIRED:** `false`
- **ALLOWED_AGENTS:** `marketing-nar`, `produto-nar`, `engenharia-nar`
- **DENIED_AGENTS:** `rufas-router`, `atendimento-nar`, `crm-nar`

**INPUT_SCHEMA**

| Campo | Tipo | Obrigatório | Restrições |
|---|---|---|---|
| `limit` | `integer` | não | min 1; max 100; default 20 |

`additionalProperties: false` — qualquer campo extra (inclusive token ou override de raiz) resulta em `INVALID_INPUT`.

**OUTPUT_SCHEMA**

Campos de topo: `count`, `items`. Schema completo em `capability-registry.json`.

**FAILURE_MODES**

- ACCESS_DENIED para atendimento-nar, crm-nar e rufas-router
- INVALID_INPUT se o chamador tentar passar raiz ou credencial
- LIMIT_EXCEEDED acima de 100

**MOCK_BEHAVIOR**

Retorna as 3 pastas autorizadas de mock-data/eduinfo.json. A pasta Financeiro_Restrito nunca é listada.

**FUTURE_REAL_BACKEND**

Google Drive API (files.list) restrita por allowlist de Folder_ID no servidor, com service account de leitura. _(não implementado; nenhuma conexão existe hoje)_

---

### 2. `eduinfo_search_folder`

- **DOMAIN:** `eduinfo`
- **OWNER:** `engenharia-nar`
- **PURPOSE:** Pesquisar arquivos e pastas dentro de um Folder_ID autorizado.
- **READ_ONLY:** `true`
- **SIDE_EFFECTS:** nenhum
- **APPROVAL_REQUIRED:** `false`
- **ALLOWED_AGENTS:** `marketing-nar`, `produto-nar`, `engenharia-nar`
- **DENIED_AGENTS:** `rufas-router`, `atendimento-nar`, `crm-nar`

**INPUT_SCHEMA**

| Campo | Tipo | Obrigatório | Restrições |
|---|---|---|---|
| `Search_Query` | `string` | sim | — |
| `Folder_ID` | `string` | sim | — |
| `limit` | `integer` | não | min 1; max 100; default 20 |

`additionalProperties: false` — qualquer campo extra (inclusive token ou override de raiz) resulta em `INVALID_INPUT`.

**OUTPUT_SCHEMA**

Campos de topo: `count`, `items`. Schema completo em `capability-registry.json`.

**FAILURE_MODES**

- ASSET_OUT_OF_SCOPE para pasta fora da allowlist
- FOLDER_NOT_FOUND para Folder_ID inexistente
- INVALID_INPUT para Search_Query vazia ou campo extra
- LIMIT_EXCEEDED acima de 100

**MOCK_BEHAVIOR**

Filtra por substring no nome dentro do Folder_ID autorizado. Resultado vazio é sucesso.

**FUTURE_REAL_BACKEND**

Google Drive API (files.list com q= e parents), sempre com o parent forçado à allowlist — nunca busca global. _(não implementado; nenhuma conexão existe hoje)_

---

### 3. `eduinfo_get_asset`

- **DOMAIN:** `eduinfo`
- **OWNER:** `engenharia-nar`
- **PURPOSE:** Obter um asset autorizado de forma consumível, com URL temporária.
- **READ_ONLY:** `true`
- **SIDE_EFFECTS:** nenhum
- **APPROVAL_REQUIRED:** `false`
- **ALLOWED_AGENTS:** `marketing-nar`, `produto-nar`, `engenharia-nar`
- **DENIED_AGENTS:** `rufas-router`, `atendimento-nar`, `crm-nar`

**INPUT_SCHEMA**

| Campo | Tipo | Obrigatório | Restrições |
|---|---|---|---|
| `File_ID` | `string` | sim | — |

`additionalProperties: false` — qualquer campo extra (inclusive token ou override de raiz) resulta em `INVALID_INPUT`.

**OUTPUT_SCHEMA**

Campos de topo: `success`, `file_id`, `name`, `mimeType`, `asset_available`, `download_url`, `expires`. Schema completo em `capability-registry.json`.

**FAILURE_MODES**

- ASSET_OUT_OF_SCOPE para arquivo fora da allowlist
- FILE_NOT_FOUND para File_ID inexistente
- INVALID_INPUT se vier token ou campo extra

**MOCK_BEHAVIOR**

Emite download_url mock:// não resolvível com expiração de 900s. Nenhum byte transferido.

**FUTURE_REAL_BACKEND**

Google Drive API com link assinado de curta duração, gerado no servidor. O agente nunca recebe credencial. _(não implementado; nenhuma conexão existe hoje)_

---

### 4. `crm_list_eligible_contacts`

- **DOMAIN:** `crm`
- **OWNER:** `crm-nar`
- **PURPOSE:** Listar contatos aptos a entrar em cadência numa data de referência.
- **READ_ONLY:** `true`
- **SIDE_EFFECTS:** nenhum
- **APPROVAL_REQUIRED:** `false`
- **ALLOWED_AGENTS:** `atendimento-nar`, `crm-nar`
- **DENIED_AGENTS:** `rufas-router`, `marketing-nar`, `produto-nar`, `engenharia-nar`

**INPUT_SCHEMA**

| Campo | Tipo | Obrigatório | Restrições |
|---|---|---|---|
| `date` | `string` | sim | padrão `^\d{4}-\d{2}-\d{2}$` |
| `limit` | `integer` | sim | min 1; max 100 |
| `segment` | `string` | não | enum: escola_privada, rede_ensino |

`additionalProperties: false` — qualquer campo extra (inclusive token ou override de raiz) resulta em `INVALID_INPUT`.

**OUTPUT_SCHEMA**

Campos de topo: `count`, `contacts`. Schema completo em `capability-registry.json`.

**FAILURE_MODES**

- ACCESS_DENIED para marketing-nar, produto-nar, engenharia-nar e rufas-router
- INVALID_INPUT para date fora de YYYY-MM-DD ou segment fora do enum
- LIMIT_EXCEEDED acima de 100

**MOCK_BEHAVIOR**

18 contatos elegíveis em 2026-09-01. Exclui inválidos, sem email e stages terminais.

**FUTURE_REAL_BACKEND**

View somente-leitura no Postgres/Supabase do CRM, com RLS por papel de agente. Nunca SQL arbitrário. _(não implementado; nenhuma conexão existe hoje)_

---

### 5. `crm_get_contact_context`

- **DOMAIN:** `crm`
- **OWNER:** `crm-nar`
- **PURPOSE:** Obter o contexto consolidado de um contato para decisão de atendimento.
- **READ_ONLY:** `true`
- **SIDE_EFFECTS:** nenhum
- **APPROVAL_REQUIRED:** `false`
- **ALLOWED_AGENTS:** `atendimento-nar`, `crm-nar`
- **DENIED_AGENTS:** `rufas-router`, `marketing-nar`, `produto-nar`, `engenharia-nar`

**INPUT_SCHEMA**

| Campo | Tipo | Obrigatório | Restrições |
|---|---|---|---|
| `contact_id` | `string` | sim | — |

`additionalProperties: false` — qualquer campo extra (inclusive token ou override de raiz) resulta em `INVALID_INPUT`.

**OUTPUT_SCHEMA**

Campos de topo: `contact`, `stage`, `history`, `last_interaction`, `demo_status`, `followup_status`. Schema completo em `capability-registry.json`.

**FAILURE_MODES**

- ACCESS_DENIED fora de atendimento-nar e crm-nar
- CONTACT_NOT_FOUND para contact_id inexistente
- INVALID_INPUT para contact_id vazio

**MOCK_BEHAVIOR**

Retorna contexto consolidado. Contatos inválidos são legíveis (stage null) para diagnóstico de higiene.

**FUTURE_REAL_BACKEND**

Endpoint de leitura por id no CRM, com minimização de campos e log de acesso a dado pessoal. _(não implementado; nenhuma conexão existe hoje)_

---

### 6. `crm_get_followups_due`

- **DOMAIN:** `crm`
- **OWNER:** `crm-nar`
- **PURPOSE:** Listar follow-ups vencidos ou devidos até uma data de referência.
- **READ_ONLY:** `true`
- **SIDE_EFFECTS:** nenhum
- **APPROVAL_REQUIRED:** `false`
- **ALLOWED_AGENTS:** `atendimento-nar`, `crm-nar`
- **DENIED_AGENTS:** `rufas-router`, `marketing-nar`, `produto-nar`, `engenharia-nar`

**INPUT_SCHEMA**

| Campo | Tipo | Obrigatório | Restrições |
|---|---|---|---|
| `date` | `string` | sim | padrão `^\d{4}-\d{2}-\d{2}$` |
| `limit` | `integer` | sim | min 1; max 100 |

`additionalProperties: false` — qualquer campo extra (inclusive token ou override de raiz) resulta em `INVALID_INPUT`.

**OUTPUT_SCHEMA**

Campos de topo: `count`, `contacts`. Schema completo em `capability-registry.json`.

**FAILURE_MODES**

- ACCESS_DENIED fora de atendimento-nar e crm-nar
- INVALID_INPUT para date malformada
- LIMIT_EXCEEDED acima de 100

**MOCK_BEHAVIOR**

14 follow-ups vencidos em 2026-09-01, ordenados do mais vencido para o menos.

**FUTURE_REAL_BACKEND**

Query parametrizada e nomeada no CRM (sem SQL do agente), com data de referência do servidor. _(não implementado; nenhuma conexão existe hoje)_

---

### 7. `crm_get_demo_scheduled`

- **DOMAIN:** `crm`
- **OWNER:** `crm-nar`
- **PURPOSE:** Listar demos agendadas num intervalo de datas.
- **READ_ONLY:** `true`
- **SIDE_EFFECTS:** nenhum
- **APPROVAL_REQUIRED:** `false`
- **ALLOWED_AGENTS:** `atendimento-nar`, `crm-nar`
- **DENIED_AGENTS:** `rufas-router`, `marketing-nar`, `produto-nar`, `engenharia-nar`

**INPUT_SCHEMA**

| Campo | Tipo | Obrigatório | Restrições |
|---|---|---|---|
| `date_from` | `string` | sim | padrão `^\d{4}-\d{2}-\d{2}$` |
| `date_to` | `string` | sim | padrão `^\d{4}-\d{2}-\d{2}$` |
| `limit` | `integer` | não | min 1; max 100; default 20 |

`additionalProperties: false` — qualquer campo extra (inclusive token ou override de raiz) resulta em `INVALID_INPUT`.

**OUTPUT_SCHEMA**

Campos de topo: `count`, `demos`. Schema completo em `capability-registry.json`.

**FAILURE_MODES**

- ACCESS_DENIED fora de atendimento-nar e crm-nar
- INVALID_INPUT para date_to < date_from
- LIMIT_EXCEEDED acima de 100

**MOCK_BEHAVIOR**

5 demos agendadas entre 2026-09-01 e 2026-09-30.

**FUTURE_REAL_BACKEND**

CRM + Google Calendar (somente leitura de eventos de demo), nunca criação ou alteração de evento. _(não implementado; nenhuma conexão existe hoje)_

---

### 8. `proposal_get_pending`

- **DOMAIN:** `proposals`
- **OWNER:** `produto-nar`
- **PURPOSE:** Listar propostas aguardando ação da escola ou do time.
- **READ_ONLY:** `true`
- **SIDE_EFFECTS:** nenhum
- **APPROVAL_REQUIRED:** `false`
- **ALLOWED_AGENTS:** `atendimento-nar`, `produto-nar`, `crm-nar`
- **DENIED_AGENTS:** `rufas-router`, `marketing-nar`, `engenharia-nar`

**INPUT_SCHEMA**

| Campo | Tipo | Obrigatório | Restrições |
|---|---|---|---|
| `limit` | `integer` | sim | min 1; max 100 |
| `status` | `string` | não | enum: rascunho, enviada, aguardando_resposta, negociacao, aceita, recusada, expirada |
| `proposal_id` | `string` | não | — |

`additionalProperties: false` — qualquer campo extra (inclusive token ou override de raiz) resulta em `INVALID_INPUT`.

**OUTPUT_SCHEMA**

Campos de topo: `count`, `proposals`. Schema completo em `capability-registry.json`.

**FAILURE_MODES**

- ACCESS_DENIED para marketing-nar, engenharia-nar e rufas-router
- PROPOSAL_NOT_FOUND quando proposal_id não existe
- INVALID_INPUT para status fora do enum
- LIMIT_EXCEEDED acima de 100

**MOCK_BEHAVIOR**

Sem status, retorna as 6 propostas pendentes ordenadas por days_waiting desc.

**FUTURE_REAL_BACKEND**

Módulo de propostas do ERP Eduinfo, leitura por status. Criação de proposta permanece fora do MCP. _(não implementado; nenhuma conexão existe hoje)_

---

### 9. `campaign_get_history`

- **DOMAIN:** `campaigns`
- **OWNER:** `marketing-nar`
- **PURPOSE:** Consultar campanhas e templates anteriores, com performance mock.
- **READ_ONLY:** `true`
- **SIDE_EFFECTS:** nenhum
- **APPROVAL_REQUIRED:** `false`
- **ALLOWED_AGENTS:** `marketing-nar`, `produto-nar`
- **DENIED_AGENTS:** `rufas-router`, `atendimento-nar`, `crm-nar`, `engenharia-nar`

**INPUT_SCHEMA**

| Campo | Tipo | Obrigatório | Restrições |
|---|---|---|---|
| `brand` | `string` | não | — |
| `date_from` | `string` | não | padrão `^\d{4}-\d{2}-\d{2}$` |
| `date_to` | `string` | não | padrão `^\d{4}-\d{2}-\d{2}$` |
| `limit` | `integer` | não | min 1; max 100; default 20 |

`additionalProperties: false` — qualquer campo extra (inclusive token ou override de raiz) resulta em `INVALID_INPUT`.

**OUTPUT_SCHEMA**

Campos de topo: `count`, `campaigns`. Schema completo em `capability-registry.json`.

**FAILURE_MODES**

- ACCESS_DENIED fora de marketing-nar e produto-nar
- BRAND_UNKNOWN para marca não registrada
- INVALID_INPUT para date_to < date_from
- LIMIT_EXCEEDED acima de 100

**MOCK_BEHAVIOR**

10 campanhas com template embutido e performance fictícia. Métricas não devem ser citadas como resultado real.

**FUTURE_REAL_BACKEND**

Data warehouse de marketing (leitura agregada), sem acesso a plataformas de anúncio. _(não implementado; nenhuma conexão existe hoje)_

---

### 10. `campaign_get_brand_context`

- **DOMAIN:** `campaigns`
- **OWNER:** `marketing-nar`
- **PURPOSE:** Obter posicionamento e guardrails de marca antes de produzir conteúdo.
- **READ_ONLY:** `true`
- **SIDE_EFFECTS:** nenhum
- **APPROVAL_REQUIRED:** `false`
- **ALLOWED_AGENTS:** `marketing-nar`, `produto-nar`
- **DENIED_AGENTS:** `rufas-router`, `atendimento-nar`, `crm-nar`, `engenharia-nar`

**INPUT_SCHEMA**

| Campo | Tipo | Obrigatório | Restrições |
|---|---|---|---|
| `brand` | `string` | sim | — |

`additionalProperties: false` — qualquer campo extra (inclusive token ou override de raiz) resulta em `INVALID_INPUT`.

**OUTPUT_SCHEMA**

Campos de topo: `brand`, `positioning`, `guardrails`, `approved_messages`, `restricted_claims`. Schema completo em `capability-registry.json`.

**FAILURE_MODES**

- ACCESS_DENIED fora de marketing-nar e produto-nar
- BRAND_UNKNOWN para marca não registrada
- INVALID_INPUT para brand vazia

**MOCK_BEHAVIOR**

Retorna positioning, guardrails, approved_messages e restricted_claims de eduinfo, nar-eco ou jabuticaba.

**FUTURE_REAL_BACKEND**

Repositório versionado de guardrails de marca, com revisão humana obrigatória para alteração. _(não implementado; nenhuma conexão existe hoje)_

---

## Capabilities ainda NÃO criadas

**Gate:** Somente após benchmark read-only aprovado e desenho de aprovação humana.

- `crm_update_contact`
- `crm_change_stage`
- `send_email`
- `send_whatsapp`
- `publish_campaign`
- `create_proposal`
- `delete_anything`
- `share_drive_file`
- `upload_drive_file`

**Comportamento atual:** Qualquer chamada a estes nomes retorna UNKNOWN_TOOL.

Essas capabilities são de escrita e/ou têm efeito externo. Elas não estão desabilitadas — elas **não existem** no contrato, e o mock não possui caminho de execução para escrita.
