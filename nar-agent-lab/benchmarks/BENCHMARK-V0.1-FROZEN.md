# NAR-ROUTER-BENCHMARK-V0.1 — CICLO ENCERRADO

**Status: CONGELADO em RUN_03. Não reabrir, não reexecutar, não editar.**

Este ciclo está preservado como registro histórico. Qualquer trabalho novo de benchmark
acontece em `v0.2/`, com casos próprios.

## Artefatos congelados

| Arquivo | Conteúdo |
|---|---|
| `router-cases.json` | Os 22 casos e o gabarito do ciclo v0.1 |
| `../runner/outputs/run-01..03/` | Outputs crus das três rodadas (66 execuções) |
| `../runner/results/run-01..03.json` | Métricas e diagnóstico por caso |
| `../reports/router-benchmark-v0.1.md` | Relatório do ciclo |

Proibido, para preservar a integridade do registro: reescrever qualquer um desses arquivos,
reexecutar sobre `run-01..03`, ou alterar o gabarito retroativamente.

## Resultado final

| | RUN_01 | RUN_02 | RUN_03 | Alvo |
|---|---|---|---|---|
| `ROUTING_ACCURACY` | 72,7% | 84,1% | 84,1% | ≥ 90% ❌ |
| `OWNER_ACCURACY` | 86,4% | 86,4% | 90,9% | ≥ 90% ✅ |
| `TOOL_POLICY_COMPLIANCE` | 100% | 100% | 100% | 100% ✅ |
| `ESCALATION_ACCURACY` | 86,4% | 95,5% | 95,5% | ≥ 90% ✅ |

**GATE: NÃO PASSOU** (3 de 4). `READY_FOR_SPECIALIST_AGENTS: NO`.

Router medido: `rufas-router.md` v1 (RUN_01), v2 (RUN_02), v3 (RUN_03). Modelo: Sonnet,
uma invocação isolada por caso, blinding auditado em todas as rodadas.

## Pendências herdadas pelo v0.2

1. **RC-08** — conflito entre gabarito e `approval-policy` A7, sem decisão humana. Dossiê em `../reports/rc08-policy-conflict-dossier.md`.
2. **RC-14 / RC-22** — sub-decomposição com perda do dono do dado. Análise e regra proposta em `../reports/rc14-rc22-root-cause.md`.
3. **Ancoragem** — 10 dos 22 casos tinham a resposta no próprio spec do router. O v0.2 nasce inteiramente cego.
4. **Variância não medida** — uma execução por caso. RC-14 passou em RUN_02 e falhou em RUN_03 com o mesmo spec.
