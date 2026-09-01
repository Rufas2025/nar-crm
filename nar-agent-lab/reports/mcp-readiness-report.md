# MCP Readiness Report — NAR-MCP-LAB-V0.1

- **Contrato:** `nar-ops-mcp@0.1.0` — **FROZEN** em 2026-09-01
- **Registry:** `nar-capability-registry@0.1.0`
- **Ambiente:** `mock` · **Status:** `LAB` · **Produção:** não

> Este laboratório não é um servidor. Não há processo, porta, endpoint, credencial ou
> secret. Nenhuma conexão com CRM real, Google Drive real ou n8n real foi criada.

---

## MCP_ARCHITECTURE

```
nar-agent-lab/
├── capabilities/
│   ├── capability-registry.json     fonte da verdade legível por máquina (10 capabilities)
│   └── capability-registry.md        mesma informação em forma legível por humano
├── mcp/
│   ├── nar-ops-mcp-contract.json     contrato congelado: agentes, escopo, schemas, erros
│   ├── nar-ops-mcp-mock.json         resolvers declarativos (não executável)
│   └── mock-data/
│       ├── eduinfo.json              4 pastas, 12 arquivos (1 fora de escopo)
│       ├── crm.json                  32 contatos
│       ├── proposals.json            10 propostas
│       └── campaigns.json            10 campanhas, 10 templates, 3 contextos de marca
├── tests/
│   ├── mcp-contract-tests.json       24 casos (schema, dados, escopo, falhas de domínio)
│   └── mcp-policy-tests.json         21 casos (autorização, fail-closed, ausência de escrita)
└── reports/
    └── mcp-readiness-report.md       este documento
```

Camadas, de fora para dentro:

1. **Registry** — o que existe como capability de negócio e quem é dono.
2. **Contrato** — a superfície congelada: agentes, allowed_tools, escopo, schemas, códigos de erro, ordem de avaliação.
3. **Mock** — como cada tool resolve a resposta a partir dos datasets, e o que dispara cada erro.
4. **Mock data** — dados fictícios controlados.
5. **Testes** — contrato e política, declarativos.

**Envelope de resposta único**

```json
{ "ok": true,  "tool": "...", "agent": "...", "data": { } }
{ "ok": false, "tool": "...", "agent": "...", "error": { "code": "...", "message": "..." } }
```

**Ordem de avaliação (fail-closed), normativa**

| Passo | Verificação | Falha |
|---|---|---|
| 1 | A tool existe no contrato? | `UNKNOWN_TOOL` |
| 2 | O agente existe e tem a tool em `allowed_tools`? | `ACCESS_DENIED` |
| 3 | O input valida contra o `inputSchema`? | `INVALID_INPUT` |
| 4 | `limit` respeita `max_limit` (100)? | `LIMIT_EXCEEDED` |
| 5 | O recurso está na allowlist de escopo? | `ASSET_OUT_OF_SCOPE` |
| 6 | O recurso existe no dataset? | `*_NOT_FOUND` / `BRAND_UNKNOWN` |
| 7 | Resolver os dados | — |

`UNKNOWN_TOOL` precede `ACCESS_DENIED` de propósito: um agente não pode inferir a
existência de uma capability pelo tipo de negativa. Agente desconhecido ou ausente é
sempre `ACCESS_DENIED` — nunca permitido por omissão. Resultado vazio é `ok: true`,
nunca erro.

---

## TOOLS_CREATED

10 capabilities, todas de leitura.

| # | Tool | Domínio | Owner | Propósito |
|---|---|---|---|---|
| 1 | `eduinfo_list_root` | eduinfo | `engenharia-nar` | Listar itens autorizados da raiz Eduinfo |
| 2 | `eduinfo_search_folder` | eduinfo | `engenharia-nar` | Pesquisar dentro de Folder_ID autorizado |
| 3 | `eduinfo_get_asset` | eduinfo | `engenharia-nar` | Obter asset autorizado de forma consumível |
| 4 | `crm_list_eligible_contacts` | crm | `crm-nar` | Contatos aptos para cadência |
| 5 | `crm_get_contact_context` | crm | `crm-nar` | Contexto consolidado de um contato |
| 6 | `crm_get_followups_due` | crm | `crm-nar` | Follow-ups vencidos ou devidos |
| 7 | `crm_get_demo_scheduled` | crm | `crm-nar` | Demos agendadas num intervalo |
| 8 | `proposal_get_pending` | proposals | `produto-nar` | Propostas aguardando ação |
| 9 | `campaign_get_history` | campaigns | `marketing-nar` | Campanhas e templates anteriores |
| 10 | `campaign_get_brand_context` | campaigns | `marketing-nar` | Posicionamento e guardrails de marca |

**Não criadas** (gate: somente após benchmark read-only aprovado e desenho de aprovação humana):
`crm_update_contact`, `crm_change_stage`, `send_email`, `send_whatsapp`, `publish_campaign`,
`create_proposal`, `delete_anything`, `share_drive_file`, `upload_drive_file`.

Elas não estão desabilitadas — **não existem**. Qualquer chamada retorna `UNKNOWN_TOOL`,
e o mock não possui caminho de execução para escrita.

**Formas de tool banidas por política**, que nunca podem ser registradas:
`sql_query`, `execute_any_api`, `drive_search_global`, `http_request_anywhere`,
`run_code`, `write_file_anywhere`.

---

## READ_ONLY_STATUS

| Invariante | Resultado |
|---|---|
| `read_only === true` nas 10 tools | ✅ |
| `side_effects === []` nas 10 tools | ✅ |
| `approval_required === false` nas 10 tools | ✅ |
| Nenhuma tool de escrita no contrato | ✅ |
| Nenhuma credencial ou secret em qualquer artefato | ✅ |
| Nenhuma URL de rede nos dados mock (única URL nos artefatos é o `$schema` do JSON Schema) | ✅ |
| `download_url` é `mock://`, não resolvível, sem transferência de bytes | ✅ |
| Nenhum endpoint publicado, nenhum processo em execução | ✅ |
| Input não pode ampliar escopo (`additionalProperties: false` em todas as tools) | ✅ |

`eduinfo_list_root` deliberadamente **não aceita parâmetro de raiz**: a raiz vem só de
`contract.scope.eduinfo.authorized_roots`. Um agente não consegue redirecionar a leitura
por input.

---

## AGENT_ACCESS_MATRIX

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
| **Total** | **0** | **5** | **5** | **5** | **6** | **3** |

✅ autorizado · ⛔ `ACCESS_DENIED`

`rufas-router` tem `allowed_tools: []` por desenho: ele roteia intenção, nunca lê dado.
Isso está explícito no contrato para não virar ambiguidade quando os subagentes forem escritos.

Separação de domínio resultante: marketing/produto/engenharia **não veem dado de contato**;
atendimento/CRM **não veem Drive**; `produto-nar` é o único ponto de cruzamento entre
propostas e marca, por ser quem conecta oferta e posicionamento.

---

## Verificação executada

Checagem cruzada dos artefatos (todas passaram — 45 casos de teste, 10 tools):

- Todos os 9 arquivos JSON parseiam.
- Tools do contrato ≡ resolvers do mock ≡ entradas do registry.
- Simetria total: para toda tool `T` e agente `A`, `A ∈ T.allowed_agents` ⟺ `T ∈ A.allowed_tools`.
- `allowed_agents` e `denied_agents` são disjuntos e cobrem os 6 agentes em todas as tools.
- Todo `error_code` usado nos testes está declarado em `contract.error_codes`.
- Toda tool referenciada nos testes existe — exceto nos casos que esperam `UNKNOWN_TOOL`, onde ela comprovadamente não existe.
- Todo `contact_id`/`File_ID`/`Folder_ID`/`proposal_id` dos testes existe no mock — exceto nos casos que esperam `*_NOT_FOUND`.
- Contagens do mock batem com os `expected_mock_result` do resolver: 18 elegíveis, 14 follow-ups vencidos, 5 demos, 6 propostas pendentes, 3 pastas na raiz, 1 arquivo fora de escopo.
- Nenhuma credencial, chave ou token real; o único token nos artefatos é o placeholder `ya29.fake` do caso P10, que existe justamente para ser rejeitado.

Cobertura de casos: **T1–T12 exigidos, todos presentes**, mais 33 casos adicionais
(variações de negação por agente, ordem de avaliação, tools de escrita inexistentes,
tools genéricas banidas, tentativa de ampliar raiz por input, tentativa de passar credencial).

---

## RISKS

| # | Risco | Severidade | Mitigação atual | Pendente |
|---|---|---|---|---|
| R1 | Contrato de laboratório ser confundido com produção | Alta | `status: LAB`, `executable: false` e aviso em todo artefato | Nomear versão real como `1.x` só depois de auditoria |
| R2 | Subagente inferir capability que não existe e alucinar resultado | Alta | `no_capability_invention`, `UNKNOWN_TOOL` explícito | System prompt de cada subagente deve listar apenas suas tools |
| R3 | Dados mock serem citados como fato real (métricas de campanha, propostas) | Alta | `_meta.status: LAB_MOCK` e nota explícita em `campaigns.json` | Regra no prompt: nunca reportar número mock como resultado |
| R4 | Escopo do Drive vazar por input | Média | `additionalProperties: false`, allowlist fixa no contrato | No backend real, forçar `parents` no servidor; nunca busca global |
| R5 | Dado pessoal real entrar quando o CRM for conectado | Alta | Mock 100% fictício, sem PII | LGPD: minimização de campos, log de acesso, retenção |
| R6 | Primeira capability de escrita quebrar o modelo read-only | Alta | Escrita não existe no contrato | Exigir `approval_required` + aprovação humana + trilha de auditoria |
| R7 | `produto-nar` acumular acesso amplo (6 tools) | Baixa | Escopo justificado e documentado | Revisar se o cruzamento propostas × marca continua necessário |
| R8 | `crm-nar` e `atendimento-nar` terem acesso idêntico | Baixa | Papéis distintos, superfície igual por ora | Diferenciar quando entrarem tools de escrita |
| R9 | Contrato congelado divergir do mock ao evoluir | Média | Checagem cruzada documentada acima | Automatizar a checagem quando houver runner |

---

## GAPS

Conhecidos e aceitos nesta versão:

- **G1 — Sem runner.** Os testes são declarativos; nenhum executa hoje. Falta o motor que aplica `guard_pipeline`.
- **G2 — Sem validador de JSON Schema.** Os schemas estão escritos, mas nada valida payload em tempo de execução.
- **G3 — Sem autenticação de agente.** O contrato assume que a identidade do agente é confiável; não há mecanismo que a prove.
- **G4 — Sem rate limit, quota ou timeout.**
- **G5 — Sem auditoria.** Nenhum log de quem leu o quê — necessário antes de tocar dado pessoal real.
- **G6 — Sem paginação real.** Só `limit`; não há cursor. Datasets reais vão exceder 100 itens.
- **G7 — Sem versionamento de dados.** O mock tem data de referência fixa (2026-09-01); tools que dependem de "hoje" precisarão de relógio do servidor, não do input.
- **G8 — Sem observabilidade de erro.** Códigos definidos, mas sem taxonomia de severidade nem alerta.
- **G9 — Sem capability de escrita.** Intencional, mas significa que os subagentes só poderão recomendar, nunca executar.
- **G10 — Sem contrato para o `rufas-router`.** Ele não tem tools; falta definir o formato de handoff entre router e subagentes — isso é o próximo desenho, não deste MCP.

---

## READY_FOR_SUBAGENT_DESIGN

**YES.**

O contrato está congelado e é suficiente para escrever os 6 subagentes:

- cada agente tem uma lista fechada e explícita de tools;
- cada tool tem propósito, input, output e modos de falha definidos;
- há dados mock determinísticos para benchmark de comportamento;
- há casos de negação para testar se o agente respeita `ACCESS_DENIED` sem tentar contornar;
- `rufas-router` está definido por ausência de capability, o que já delimita seu papel.

Condições ao desenhar os subagentes:
1. O system prompt de cada agente lista **apenas** suas tools autorizadas.
2. Nenhum agente pode assumir capability de escrita.
3. Todo agente deve tratar `ACCESS_DENIED` como final — nunca tentar outra tool para contornar.
4. Nenhum número vindo do mock pode ser reportado como resultado real.

## READY_FOR_REAL_MCP

**NO.**

Bloqueadores: G1 (runner), G2 (validação), G3 (autenticação de agente), G4 (rate limit),
G5 (auditoria), G6 (paginação), mais R5 (LGPD no CRM real) e R6 (desenho de aprovação
humana antes da primeira escrita). Backends reais (Drive, CRM, propostas, marketing) não
estão implementados nem conectados — a coluna `FUTURE_REAL_BACKEND` do registry é intenção
declarada, não integração.

---

## NEXT_STEP

1. **Congelar** `nar-ops-mcp@0.1.0` como baseline. Qualquer mudança de superfície vira `0.2.0`, com o registry atualizado junto.
2. **Desenhar os 6 subagentes** contra este contrato — `rufas-router` primeiro, definindo o formato de handoff (G10).
3. **Benchmark read-only** dos subagentes sobre o mock, usando os 45 casos como base: cada agente deve usar só suas tools, respeitar negações e nunca inventar capability.
4. **Só depois**, avaliar a primeira capability de escrita, obrigatoriamente com `approval_required: true`, aprovação humana e trilha de auditoria.
5. **Só depois disso**, discutir MCP real: runner, validação de schema, autenticação de agente, rate limit, auditoria e conexão com backend.

**STOP.** Nada além do passo 1 e 2 deve começar sem revisão deste relatório.
