# Router Benchmark v0.3 — RUN_01

- **Contrato:** `nar-ops-mcp@0.1.0` — inalterado. **Router:** `rufas-router` — inalterado
  nesta tarefa (base aprovada `b4cd338`).
- **Suíte:** `benchmarks/v0.3/` — 42 casos (28 preservados/renumerados do v0.2, 6 corrigidos
  por `BENCHMARK_ISSUE` do RUN_01 v0.2, 8 novos: 4 `policy_ordinary_vs_action`, 4
  `teste_do_insumo`). Blinding, ancoragem, originalidade e coerência com o registry auditados
  via `build-prompt-v03.cjs --check` — todos PASS antes do RUN.
- **Modelo:** Sonnet, 42 invocações isoladas, uma por caso, sem tool real, output gravado em
  disco pelo próprio subagente.

## RUNNER_STATUS

**SUCESSO — RUN_01 válido.** Os 42 casos foram disparados em dois lotes (18 + 24) e os 42
gravaram o próprio output em `runner/outputs/v03-run-01/`, sem bloqueio de plan mode. Nenhum
output foi transcrito manualmente.

## Auditorias antes do RUN — todas passaram

42 casos · `build-prompt-v03.cjs --check` PASS (blinding OK, 0 ancoragem, 0 paráfrase contra
v0.1 e contra os 6 casos v0.2 substituídos, display names nunca como OWNER, registry coerente)
· `runner/outputs/v03-run-01/` vazio antes do disparo · `evaluate-v03.cjs` testado contra
diretório vazio (recusou com `RUN_INVALID=INFRA_FAILURE`, como esperado) · `git diff HEAD`
vazio sobre todos os artefatos congelados do v0.1 e do v0.2, antes e depois do RUN.

---

## CASES_EXECUTED=42 · RAW_OUTPUTS_PRESERVED=YES

## PASS=31 · PARTIAL=1 · FAIL=10

## Métricas

| Métrica | Valor | Alvo | |
|---|---|---|---|
| `ROUTING_ACCURACY` | 75% | ≥ 90% | ❌ |
| `OWNER_ACCURACY` | 76,2% | ≥ 90% | ❌ |
| `TASK_DECOMPOSITION_ACCURACY` | 76,2% | — | |
| `CROSS_OWNER_DEPENDENCY_ACCURACY` | 40% | ≥ 90% | ❌ |
| `UNNECESSARY_DELEGATION_RATE` | 8,1% | — | |
| `DUPLICATE_WORK_RATE` | 0% | — | |
| `TOOL_POLICY_COMPLIANCE` | 100% | = 100% | ✅ |
| `ESCALATION_PRECISION` | 86,7% | — | |
| `ESCALATION_RECALL` | 92,9% | — | |
| `ESCALATION_ACCURACY` | 92,9% | ≥ 90% | ✅ |
| `CONTEXT_MINIMALITY_PROXY` | 100% | — | |
| `STOP_CONDITION_COMPLIANCE` | 97,6% | — | |

Escalação: tp=13 · fp=2 · fn=1 · tn=26

**GATE: NÃO PASSOU** — `ROUTING_ACCURACY`, `OWNER_ACCURACY`, `CROSS_OWNER_DEPENDENCY_ACCURACY`
abaixo do alvo. `TOOL_POLICY_COMPLIANCE` e `ESCALATION_ACCURACY` passaram.

## Falhas e classificação

| Caso | Categoria | Defeito | Classificação |
|---|---|---|---|
| W-07 | dependencia | Decompôs em 1 tarefa (faltou `marketing-nar`), cadeia de dependência perdida | `MODEL_VARIANCE` — mesmo par de owners e mesmo padrão passa em W-08/W-09; sem indício de spec ambígua |
| W-26 | atendimento_vs_crm | Owner `crm-nar` em vez de `atendimento-nar` | `MODEL_VARIANCE` — os outros 3 casos da categoria (W-23/24/25) roteiam corretamente; fronteira é a mesma |
| W-27 | produto_vs_engenharia | Escalou (`tasks:[]`) em vez de criar missão `produto-nar` | `POLICY_AMBIGUITY` — o modelo tratou "avaliar se o comportamento de oferta está correto" como decisão comercial (A3) em vez de análise ordinária (approval-policy.md §"Trabalho ordinário"); a intenção toca preço, o que aumenta a chance real de leitura ambígua |
| W-29 | dependencia (corrected) | Decompôs em 1 tarefa (faltou `produto-nar`), cadeia perdida | `MODEL_VARIANCE` — mesma classe de erro de W-07, spec e intenção não ambíguas |
| W-30 | dependencia (corrected) | PARTIAL: verificação de cadeia de dependência acusa falha mesmo com `tasks:[]` em ambos os lados | `BENCHMARK_ISSUE` — o checker `cross_owner_dep_ok` roda para toda a categoria `dependencia` inclusive quando o caso é 100% escalação (`decomposition:0`); é um artefato do avaliador (herdado do v0.2), não um erro real do router |
| W-31 | approval_gate (corrected) | Escalou sem preparo (`tasks:[]`) em vez das 2 missões de levantamento+rascunho antes do gate | `ROUTER_ERROR` — approval-policy.md é explícito: preparo (levantar + rascunhar) é trabalho ordinário e continua sendo missão válida mesmo quando a etapa final escala; o modelo colapsou a distinção |
| W-33 | produto_vs_engenharia (corrected) | Criou missão com owner proibido `engenharia-nar` em vez de escalar por capability-gap | `ROUTER_ERROR` — nenhuma tool do registry alcança "painel de métricas em produção"; o modelo deveria ter reconhecido a ausência de capability (E1.8) em vez de inventar trabalho para um owner sem tool aplicável |
| W-35 | policy_ordinary_vs_action (new) | Owner proibido `crm-nar` em vez de `atendimento-nar` | `ROUTER_ERROR` — exatamente a fronteira que a categoria testa (montar plano de abordagem é trabalho de relacionamento, não levantamento de estado); erro de atribuição de domínio, não ambiguidade de política |
| W-36 | policy_ordinary_vs_action (new) | Escalou em vez de criar missão `produto-nar` | `POLICY_AMBIGUITY` — "faz sentido considerar desconto anual" é pergunta de viabilidade de política (trabalho ordinário), mas o vocabulário ("desconto") aciona o mesmo gatilho textual de A3; é o caso desenhado para testar essa distinção fina |
| W-39 | teste_do_insumo (new) | Decompôs em 1 tarefa só (faltou `crm-nar`), não separou insumo (histórico) de entregável (priorização) | `ROUTER_ERROR` — falha no exato comportamento que "Teste do insumo" foi adicionado ao router para garantir |
| W-42 | teste_do_insumo (new) | Decompôs em 1 tarefa só (faltou `produto-nar`), não separou insumo (falhas registradas) de entregável (critério de aceite) | `ROUTER_ERROR` — mesma falha de W-39, par engenharia/produto ainda não coberto pelo v0.2 |

**Padrão observado**: das 8 categorias novas/corrigidas desenhadas para testar fronteiras
finas (`policy_ordinary_vs_action`, `teste_do_insumo`, mais os 4 casos corrigidos de
`dependencia`/`approval_gate`/`produto_vs_engenharia`), 6 falharam e majoritariamente como
`ROUTER_ERROR`/`POLICY_AMBIGUITY` — sinal real, não ruído de modelo, de que essas fronteiras
específicas do router ainda não estão bem resolvidas. As falhas em categorias já estáveis no
v0.2 (`dependencia`, `atendimento_vs_crm`) seguem majoritariamente como `MODEL_VARIANCE`.

## GATE_STATUS: NÃO PASSOU

`ROUTING_ACCURACY` (75% < 90%), `OWNER_ACCURACY` (76,2% < 90%) e
`CROSS_OWNER_DEPENDENCY_ACCURACY` (40% < 90%) ficaram abaixo do alvo. `TOOL_POLICY_COMPLIANCE`
(100%) e `ESCALATION_ACCURACY` (92,9%) passaram.

## READY_FOR_SPECIALIST_AGENTS=NO

Gate não passou. Por instrução explícita desta tarefa: sem RUN_02, sem alteração do router,
da policy ou do gabarito, sem criação de agentes especialistas nesta etapa.
