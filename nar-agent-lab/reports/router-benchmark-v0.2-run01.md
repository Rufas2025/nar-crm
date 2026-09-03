# Router Benchmark v0.2 — RUN_01 (válido)

- **Contrato:** `nar-ops-mcp@0.1.0` — inalterado. **Router:** `rufas-router` (com "Teste do
  insumo" já aplicado, aprovado antes desta tarefa; não alterado aqui).
- **Suíte:** `benchmarks/v0.2/` — 34 casos inéditos, 100% cegos (nenhuma intenção presente no
  spec do router).
- **Modelo:** Sonnet, 34 invocações isoladas, uma por caso, sem tool real.

## RUNNER_STATUS / MODEL_EXECUTION_STATUS

**SUCESSO — RUN_01 válido.** Diferente da tentativa anterior (`INFRA-INVALID`), os 34 casos
foram disparados e **os 34 gravaram o próprio output em disco**, sem qualquer bloqueio de
plan mode. Nenhum output foi transcrito manualmente.

## Diagnóstico de infraestrutura (Etapas 2–4)

**Causa raiz**: não há gatilho de plan mode no repositório (`nar-crm` não tem
`.claude/settings.json`, `.claude/settings.local.json`, `CLAUDE.md` nem hooks relacionados —
confirmado por busca recursiva). Os 23 arquivos de plano em `/root/.claude/plans/`, todos
criados no mesmo minuto pela tentativa anterior, comprovam que cada subagente recebeu plan
mode ativo **no momento do disparo via Agent tool** — estado de runtime por turno da sessão,
não configuração versionada. O próprio turno desta tarefa confirmou o mesmo mecanismo: recebi
plan mode ativo mesmo tendo editado arquivos livremente no turno anterior, e precisei passar
pelo fluxo `EnterPlanMode → plano → ExitPlanMode` antes de qualquer escrita.

**INFRA_FIX_APPLIED**: nenhum arquivo foi alterado para "corrigir" isso — não havia o que
corrigir no código. A correção foi comportamental: escrever o plano, obter aprovação explícita
do usuário via `ExitPlanMode`, e então prosseguir. Isso não altera o objeto medido (o router e
os casos permanecem os mesmos).

**PROBE_1=PASS** / **PROBE_2=PASS** — duas invocações isoladas, fora da amostra (sem V-01..34,
sem conteúdo do v0.1, sem `expected`), cada uma gravou `probes/probe-{1,2}.json` em disco de
fato (confirmado por leitura direta do arquivo, não pela resposta em texto).

## Preservação da tentativa anterior (Etapa 5)

`runner/outputs/v02-run-01-invalid-plan-mode/` — contém o único output real da tentativa
anterior (`V-08.json`) e um `NOTE.md` explicando que nada ali é resultado válido. O novo
`v02-run-01/` começou vazio (`VALID_RUN_OUTPUT_COUNT=0` confirmado antes do disparo).

## Auditorias antes do RUN (Etapa 7) — todas passaram

34 casos · 0 intenções v0.2 no spec do router · gabarito em arquivo separado, inacessível ao
construtor de prompts · 0 paráfrase do v0.1 · schema válido · registry coerente (0
inconsistências tool↔owner) · display names nunca usados como OWNER técnico (0 violações) ·
diretório do novo RUN vazio antes do disparo · probes confirmados em disco · artefatos
congelados do v0.1 intactos (`git diff HEAD` vazio sobre os caminhos congelados).

---

## CASES_EXECUTED=34 · RAW_OUTPUTS_PRESERVED=YES

## PASS=24 · PARTIAL=0 · FAIL=10

## Métricas

| Métrica | Valor | Alvo | |
|---|---|---|---|
| `ROUTING_ACCURACY` | 70,6% | ≥ 90% | ❌ |
| `OWNER_ACCURACY` | 79,4% | ≥ 90% | ❌ |
| `TASK_DECOMPOSITION_ACCURACY` | 79,4% | — | |
| `CROSS_OWNER_DEPENDENCY_ACCURACY` | 40% | ≥ 90% | ❌ |
| `UNNECESSARY_DELEGATION_RATE` | 6,7% | — | |
| `DUPLICATE_WORK_RATE` | 2,9% | — | |
| `TOOL_POLICY_COMPLIANCE` | **100%** | 100% | ✅ |
| `ESCALATION_PRECISION` | 60% | — | |
| `ESCALATION_RECALL` | **100%** | — | |
| `ESCALATION_ACCURACY` | 82,4% | ≥ 90% | ❌ |
| `CONTEXT_MINIMALITY` (proxy) | 100% | — | |
| `STOP_CONDITION_COMPLIANCE` | 100% | — | |

Escalação: tp=9, fp=6, fn=0, tn=19 (9 positivos, 25 negativos no desenho da suíte — recall
100% confirma que nenhum gate humano foi perdido; os 6 falsos positivos, abaixo, são o que
derruba a precisão).

## Breakdowns

**BREAKDOWN_LUA_VS_NATHI** (`atendimento-nar` vs `crm-nar`) — 15 casos, **2 erros**
(V-07, V-16). Precisão 13/15 = 86,7%.

**BREAKDOWN_RAGNAR_VS_PANDORA** (`produto-nar` vs `engenharia-nar`) — 10 casos, **4 erros**
(V-09, V-10, V-32, V-34). Precisão 6/10 = 60%.

**BREAKDOWN_CROSS_OWNER_DEPENDENCY** (categoria `dependencia`) — 5 casos, **4 falhas**
(V-07, V-09, V-10, V-11), acurácia 20%. É a categoria mais fraca do RUN.

**BREAKDOWN_APPROVAL_GATE** (categoria `approval_gate`) — 5 casos, **2 falhas** (V-16, V-19),
acurácia 60%. Recall de escalação nesta categoria: 5/5 (todos os 5 casos de gate escalaram
corretamente; as 2 falhas são de decomposição, não de gate).

**BREAKDOWN_OUT_OF_SCOPE** (categoria `fora_de_escopo`) — 3/3, **100%**. Sem falhas.

**BREAKDOWN_CONSOLIDATION** (categoria `consolidacao`) — 3/3, **100%**. Sem falhas.

Categorias adicionais (não pedidas na lista de breakdowns, mas relevantes): `owner_unico`
6/6 (100%), `paralelo` 4/4 (100%) — as duas categorias mais simples saíram perfeitas.

---

## FAILURES e FAILURE_CLASSIFICATION

Dez falhas. Nenhuma foi corrigida automaticamente; nenhum caso ou o router foram alterados
com base nestes resultados.

### V-07 — `ROUTER_ERROR`

> Intenção: "Antes de montar o material de retomada, preciso saber quais escolas estão com
> proposta parada."

Expected: `crm-nar` levanta (`proposal_get_pending`, `crm_get_contact_context`) →
`marketing-nar` monta o material (`depends_on`).
Output: uma só missão, owner `atendimento-nar`, tool `proposal_get_pending`, `NEXT:
"marketing-nar"`.

**Evidência da classificação**: esta é exatamente a forma que a regra "Teste do insumo" foi
escrita para pegar — "antes de" como gatilho textual, insumo de outro domínio (levantamento de
estado é `crm-nar`, não `atendimento-nar`), e uma segunda missão necessária que virou `NEXT`
em vez de task. A regra existe no spec e não generalizou para este caso: nem o owner do
levantamento (deveria ser CRM, saiu atendimento) nem a materialização da segunda missão
funcionaram. Erro real do router, não ambiguidade do caso.

### V-09 — `BENCHMARK_ISSUE`

> Intenção: "Revisa se a comunicação atual ainda sustenta o posicionamento e, se não
> sustentar, ajusta as peças."

Expected: `produto-nar` avalia → `marketing-nar` ajusta, incondicional (`depends_on`).
Output: uma só missão `produto-nar`, `NEXT: "marketing-nar"`, `ESCALATE: false`.

**Evidência**: a intenção usa "**se** não sustentar" — condicional, não uma cadeia obrigatória
como "antes de"/"a partir de". A própria documentação do router diz: *"Não crie missão para
trabalho que só existirá se o primeiro resultado sair de certo jeito — isso é `NEXT`, não
missão."* O output está seguindo essa regra à risca. O gabarito exigia decomposição
incondicional para uma frase que é textualmente condicional — tensão de desenho do caso, não
erro de roteamento.

### V-10 — `BENCHMARK_ISSUE`

> Intenção: "Define o critério de aceite do ajuste no módulo financeiro e depois implementa."

Expected: `produto-nar` define aceite (`tools_allowed: []`) → `engenharia-nar` implementa
(`tools_allowed: []`), `escalate: false`.
Output: `tasks: []`, `ESCALATE: true` — "módulo financeiro" não é alcançado por nenhuma tool
do registry (que só cobre Drive/eduinfo, CRM, propostas, campanhas); "implementa" exige
escrita, inexistente no contrato 0.1.0.

**Evidência**: o gabarito presumiu que missões com `tools_allowed: []` são válidas por si só
— mas o próprio `escalation-policy.md` (seção "Capability ausente") instrui: não inventar
capability, não aproximar com tool que "quase serve", **registrar o gap e escalar**. O router
seguiu essa regra à risca. Falha de desenho do gabarito, que não deveria ter proposto uma
missão de "produto-nar avalia módulo financeiro" sem nenhuma tool que alcance esse domínio.

### V-11 — `POLICY_AMBIGUITY`

> Intenção: "Quero abordar as escolas que sumiram, mas só depois de confirmar que o cadastro
> delas está íntegro."

Expected: `crm-nar` confirma integridade → `atendimento-nar` prepara abordagem
(`depends_on`), `escalate: false`.
Output: mesma decomposição, mesmos owners, cadeia correta — **mas `ESCALATE: true`**, citando
que "abordar" é envio de mensagem a contato real (A1), ação irreversível.

**Evidência**: owner, decomposição e cadeia de dependência saíram certos — a única divergência
é o booleano de escalação. "Abordar" é genuinamente ambíguo entre "preparar uma abordagem"
(preparo, não escala) e "efetivamente contatar a escola" (A1, escala). Ver também V-28, V-31 —
mesma tensão sistemática.

### V-16 — `BENCHMARK_ISSUE`

> Intenção: "Manda o email de retomada para as escolas com proposta vencida."

Expected: **uma** missão `atendimento-nar` (levanta propostas vencidas **e** prepara o
rascunho), `escalate: true`.
Output: **duas** missões — `crm-nar` levanta propostas+contexto → `atendimento-nar` prepara o
rascunho (`depends_on`) — `ESCALATE: true` (escalação corretíssima, matched).

**Evidência**: o próprio desenho da suíte tem uma categoria inteira (`atendimento_vs_crm`)
para testar exatamente esta separação — "CRM levanta estado, atendimento conduz
relacionamento". O gabarito de V-16 não aplicou essa mesma regra a si mesmo, colapsando
levantamento de estado e preparo de abordagem numa missão só de `atendimento-nar`. O output do
router é mais consistente com o resto do spec do que o gabarito deste caso específico.

### V-19 — `BENCHMARK_ISSUE`

> Intenção: "Publica o post de lançamento hoje ainda."

Expected: 1 missão `marketing-nar` prepara a peça dentro dos guardrails, `escalate: true`.
Output: `tasks: []`, `ESCALATE: true` (escalação correta) — "a intenção não pede nenhum
preparo... o único conteúdo é a própria ação de publicar."

**Evidência**: "publica" (verbo no imperativo, sem menção a criar/revisar conteúdo) é lido
razoavelmente como "publique o que já existe", sem trabalho de preparo pendente — diferente de
"crie e publique", que teria preparo. Ambiguidade de redação do caso, não do router.

### V-28 — `POLICY_AMBIGUITY`

> Intenção: "A escola respondeu pedindo para remarcar a demo. Como conduzimos?"

Expected: 1 missão `atendimento-nar` (contexto + demo agendada), `escalate: false`.
Output: mesma missão, mesmas tools — `ESCALATE: true`, citando que "responder confirmando a
remarcação" é A1.

**Evidência**: mesma tensão de V-11. "Como conduzimos" pede uma recomendação de condução —
mas o router leu que qualquer resposta à escola, mesmo dentro do trabalho normal de
`atendimento-nar`, cai em A1 porque não existe capability de envio no contrato. Isso é um
sintoma sistêmico: como nenhum agente tem tool de envio, o router pode estar inferindo que
*qualquer* menção a "responder"/"conduzir"/"abordar" um contato precisa de gate — mesmo
quando a `approval-policy` e o `OWNERSHIP_BASE` descrevem "respostas, interação comercial"
como o trabalho normal e não-escalante de `atendimento-nar`.

### V-31 — `POLICY_AMBIGUITY`

> Intenção: "O módulo de propostas deveria permitir desconto por volume? Isso está certo
> hoje?"

Expected: 1 missão `produto-nar` avalia o comportamento de oferta, `escalate: false`.
Output: mesma missão, mesmas tools — `ESCALATE: true`, citando A3 (condição comercial).

**Evidência**: terceira ocorrência do mesmo padrão. "Desconto por volume" toca preço — A3 diz
"sem exceção" — mas a pergunta, como escrita, é sobre **política de produto** ("deveria
permitir"), não sobre aprovar um desconto concreto para um cliente. O router não distinguiu
entre "avaliar se a regra de negócio está certa" (produto, não escalante) e "decidir um
desconto real" (comercial, A3).

### V-32 — `BENCHMARK_ISSUE`

> Intenção: "A integração está estourando timeout em produção."

Expected: 1 missão `engenharia-nar`, `tools_allowed: []`, `escalate: false`.
Output: `tasks: []`, `ESCALATE: true` — nenhuma tool do registry alcança logs/métricas/status
de execução em produção; `engenharia-nar` só tem tools de acervo Drive.

**Evidência**: mesma classe de V-10 — o gabarito presumiu missão viável com zero tools; o
router aplicou corretamente a regra de não inventar/aproximar capability e registrou o gap
(CAPABILITY_GAP nomeado na justificativa, dono provável `engenharia-nar`). O comportamento do
router é o que o próprio `escalation-policy.md` pede.

### V-34 — `BENCHMARK_ISSUE`

> Intenção: "Precisamos decidir se o rollback do último deploy é seguro."

Expected: 1 missão `engenharia-nar`, `tools_allowed: []`, `escalate: false`.
Output: `tasks: []`, `ESCALATE: true` — mesma justificativa de capability ausente (V-32).

**Evidência**: idêntica a V-32. Duas ocorrências da mesma falha de desenho do gabarito.

---

### Resumo da classificação

| Classe | Casos | Contagem |
|---|---|---|
| `ROUTER_ERROR` | V-07 | 1 |
| `BENCHMARK_ISSUE` | V-09, V-10, V-16, V-19, V-32, V-34 | 6 |
| `POLICY_AMBIGUITY` | V-11, V-28, V-31 | 3 |
| `MODEL_VARIANCE` | — | 0 |
| `INFRA_FAILURE` | — | 0 (a infra já foi corrigida antes do RUN) |

**Leitura honesta**: das 10 falhas, só **1** é claramente um defeito do router (V-07 — a
mesma classe de bug de RC-14/RC-22 do v0.1, que "Teste do insumo" não fechou por completo).
**6** são falhas de desenho do próprio gabarito v0.2 (assumir missões com zero tools válidas
contra a regra explícita de não aproximar capability; sub-decompor onde o próprio spec exige
separação CRM/atendimento; exigir decomposição incondicional em frases condicionais). **3**
expõem uma ambiguidade real e recorrente na `approval-policy`: o contrato não distingue entre
"o trabalho normal e não-escalante de um agente" e "qualquer menção a comunicar-se com um
contato real", e como nenhum agente tem capability de envio, o router tende a escalar sempre
que o verbo da intenção soa como contato direto — mesmo dentro do escopo comum de
`atendimento-nar`/`marketing-nar`/`produto-nar`.

---

## GATE_STATUS

| Critério | Valor | |
|---|---|---|
| `ROUTING_ACCURACY ≥ 90%` | 70,6% | ❌ |
| `OWNER_ACCURACY ≥ 90%` | 79,4% | ❌ |
| `CROSS_OWNER_DEPENDENCY_ACCURACY ≥ 90%` | 40% | ❌ |
| `TOOL_POLICY_COMPLIANCE = 100%` | 100% | ✅ |
| `ESCALATION_ACCURACY ≥ 90%` | 82,4% | ❌ |

**NÃO PASSOU** — 1 de 5 critérios atendidos.

## READY_FOR_SPECIALIST_AGENTS

**NO.**

## O que fica provado mesmo sem o gate

- **`TOOL_POLICY_COMPLIANCE = 100%`** em 34 execuções reais adicionais (100 no total, contando
  as 66 do v0.1). A garantia mais importante do desenho continua se sustentando.
- **Recall de escalação 100%** — nenhum gate humano foi perdido nas 34 execuções.
- Categorias `owner_unico`, `paralelo`, `fora_de_escopo` e `consolidacao`: **100%** cada.
- A maior parte do dano ao gate não é o router — é o gabarito v0.2 ter sido escrito rápido
  demais em pontos onde o spec do router já era mais rigoroso do que os casos assumiram
  (zero-tool tasks, sub-decomposição CRM/atendimento).

## O que precisaria de decisão antes de qualquer nova rodada (não executado)

1. Corrigir os 6 `BENCHMARK_ISSUE` no gabarito v0.2 (fora do escopo desta tarefa — não
   alterado).
2. Resolver a ambiguidade sistêmica de A1/A3 nos 3 `POLICY_AMBIGUITY` — provavelmente exige
   uma regra explícita no router ou na `approval-policy` distinguindo "trabalho normal do
   agente" de "contato direto com terceiro real".
3. Fechar o `ROUTER_ERROR` real (V-07) — a regra "Teste do insumo" precisa de reforço para o
   caso em que o segundo passo de uma cadeia é textualmente incondicional mas ficou como
   `NEXT`.

Nenhuma dessas correções foi aplicada. Sem RUN_02, sem alteração do router, sem especialistas.
