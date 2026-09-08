# Rufas Router — Freeze v0.4

> **STATUS: CONGELADO.** A fase de tuning do `rufas-router` está encerrada. Este documento
> registra o estado congelado, o que ele mede, o que ainda está errado e por quê o tuning
> parou. Nenhuma regra nova deve ser adicionada ao router sem revogar este freeze
> explicitamente.

## Estado congelado

| | |
|---|---|
| Commit do baseline | `b3f46356f314e48fcb9fed394e4d7d78c4721b0d` |
| Commit final (conteúdo idêntico ao baseline) | `a20d142` |
| `agents/rufas-router.md` | sha256 `3dcef5257a273c66…` |
| `benchmarks/v0.4/router-cases-v0.4.expected.json` | sha256 `8acc732cfa243d29…` |
| Conjunto dos 44 prompts (`runner/prompts-v04/`) | sha256 `8fe5661a4146a807…` |
| Contrato | `nar-ops-mcp@0.2.0` (`capability-registry-v0.2.json`) |
| Contrato anterior | `nar-ops-mcp@0.1.0` — congelado e intacto |

O front-matter do router continua marcado `status: LAB` e `contract: nar-ops-mcp@0.1.0`.
Não foi alterado de propósito: qualquer edição no arquivo mudaria o seu hash e o dos 44
prompts derivados, quebrando a identidade byte-a-byte com o baseline medido. O freeze é
declarado aqui, não dentro do artefato congelado.

## O que o sistema entrega

Medido em duas execuções completas sob condições idênticas — mesmo router, mesmos prompts
byte-a-byte, mesmo registry, mesmos contratos, mesmo evaluator, mesma configuração de
subagentes.

| | RUN_05 | RUN_06 |
|---|---|---|
| PASS | 30/44 | 35/44 |
| PASS_RATE | 68,2% | 79,5% |
| ROUTING_ACCURACY | 68,2% | 79,5% |
| OWNER_ACCURACY | 77,3% | 81,8% |
| TASK_DECOMPOSITION_ACCURACY | 79,5% | 84,1% |
| CROSS_OWNER_DEPENDENCY_ACCURACY | 50% | 50% |
| ESCALATION_ACCURACY | 79,5% | 88,6% |
| ESCALATION_PRECISION | 64% | 76,2% |
| TOOL_POLICY_COMPLIANCE | 100% | 100% |
| CONTEXT_MINIMALITY_PROXY | 100% | 100% |
| DUPLICATE_WORK_RATE | 0% | 0% |
| STOP_CONDITION_COMPLIANCE | 100% | 100% |

**O número honesto é a faixa, não o melhor RUN: 30–35/44 (68%–80%).** Citar 35/44 como
resultado do sistema seria relatar o melhor de duas amostras.

### Variância medida

**7 dos 44 casos (15,9%) mudaram de veredito entre duas execuções idênticas.**

Esse é o achado mais importante da série e ele reinterpreta tudo o que veio antes: deltas de
até ±7 casos entre configurações diferentes são indistinguíveis de ruído. As comparações
RUN_02→03→04, feitas com uma execução por configuração, não tinham poder estatístico para as
conclusões que se tentou extrair delas.

Três dimensões são perfeitamente reprodutíveis: conformidade de tool policy, minimalidade de
contexto e trabalho duplicado. O que varia é exatamente o que o tuning tentou ajustar —
decomposição, owner e escalação.

## Classificação final dos 44 casos

Derivada apenas de RUN_05 e RUN_06, as duas execuções de condições idênticas sobre o router
congelado.

### STABLE_CORRECT — 29 casos

`X-01 X-02 X-03 X-04 X-05 X-06 X-09 X-11 X-13 X-15 X-16 X-17 X-20 X-21 X-22 X-23 X-26 X-27
X-28 X-30 X-32 X-34 X-36 X-37 X-38 X-40 X-41 X-43 X-44`

Nota sobre `X-41`: acerta nas duas execuções, mas por uma leitura (relatos de bug são
documentos do acervo) que o contrato marca como `UNDETERMINED_BY_CONTRACT`. É acerto sobre
premissa não declarada.

### STABLE_WRONG — 5 casos

`X-07 X-08 X-10 X-29 X-42`

Falham de forma reprodutível nas duas execuções. Não corrigidos; ver "Por que o tuning parou".

- **X-07** — posicionamento de marca → brief de campanha: produz 1 missão de `marketing-nar`;
  o expected pede 2 (`produto-nar` → `marketing-nar`). **Pendente de adjudicação contratual**
  — ver abaixo.
- **X-08** — "a partir das falhas registradas, engenharia decide o rollback": produz 1 missão
  de `engenharia-nar`; o esperado são 2 (`engenharia-nar` → `produto-nar`, regra 5). O owner
  citado na intenção sobrepõe o ownership de contrato.
- **X-10** — consulta de histórico + arquivamento de relatório: produz 1 missão de
  `marketing-nar` com `escalate: true`; o expected pede `escalate: false`. **Pendente de
  adjudicação contratual** — ver abaixo.
- **X-29** — remarcação de demo: escala indevidamente. O eixo de escalação é estável; o owner
  oscilou entre `atendimento-nar` e `crm-nar` entre execuções, então o caso é híbrido.
- **X-42** — guardrail de marca → revisão de roteiro: produz 1 missão de `produto-nar`; o
  esperado são 2 (`marketing-nar` → `produto-nar`). Confunde `ALLOWED_AGENTS` com `OWNER`.

#### Pendências de adjudicação: X-07 e X-10

Os dois permanecem classificados como `STABLE_WRONG` porque **nenhuma adjudicação contratual
final foi executada** para eles. Existem hipóteses documentadas de que a divergência esteja no
gabarito e não no router — em X-07, uma possível contradição entre o expected e o
`OWNER=marketing-nar` declarado no registry; em X-10, uma possível contradição entre o expected
e a regra A6 da `approval-policy.md`. Essas hipóteses **não foram adjudicadas** e não sustentam,
por si, reclassificação.

Enquanto a adjudicação não acontecer, valem as regras:

- os dois contam como `STABLE_WRONG` em qualquer métrica ou relato;
- nenhum `expected` foi alterado — o benchmark está exatamente como estava no baseline;
- reclassificar qualquer um dos dois exige uma adjudicação contratual explícita, pós-freeze,
  registrada como decisão própria.

### CONTRACT_UNDERDETERMINED — 3 casos

Falham de forma estável, mas o defeito é do contrato/registry, não do router.

- **X-12** — diagnóstico de lentidão do acervo. O registry v0.2 declara que latência,
  telemetria e uptime não são observados por nenhuma tool; o gabarito ainda espera missão de
  diagnóstico.
- **X-31** — diagnóstico de fluxo travado. Mesma classe de X-12.
- **X-35** — avaliação da política de carência. O fato está no enunciado, mas o eixo real é
  Cluster D (vocabulário comercial), fora do escopo desta fase.

### MODEL_VARIANCE — 7 casos

`X-14 X-18 X-19 X-24 X-25 X-33 X-39`

Mudaram de veredito entre execuções idênticas. Não são alvo de regra: nenhuma mudança de texto
no router pode corrigir um caso cujo resultado não é reprodutível.

Destaque para `X-25`: reagiu de formas opostas ao **mesmo** payload de handoff nas duas
execuções. A formalização do payload mínimo resolveu a indecidibilidade diagnosticada, mas não
estabilizou a decisão.

## Por que o tuning parou

Quatro ciclos consecutivos de correção produziram o mesmo padrão: cada regra nova corrige um
modo de falha e abre ou preserva outro.

| Ciclo | Resultado |
|---|---|
| Router Fix v2 | corrigiu under-split, abriu over-split (X-27) |
| Router Fix v3 | corrigiu over-split, abriu under-split (X-18, X-36) |
| Final Fix (dois invariantes) | 4 correções contra 8 regressões |
| Post-stability minimal fix | 0 de 3 alvos corrigidos |

O último ciclo foi o mais limpo metodologicamente — duas invariantes gerais, sem case ID, sem
worked example, sem exceção nominal, validadas estaticamente antes do teste — e ainda assim não
moveu nenhum alvo do router. O modo da falha é o que fecha a questão: nos testes dirigidos, os
subagentes **absorveram o vocabulário novo e o usaram para justificar a mesma resposta errada**
("insumo e entregável sob o mesmo owner normativo") em X-08 e X-42.

Isso indica que o erro não vem da ausência da regra. Vem de uma premissa do modelo sobre quem é
dono de guardrail de marca e de decisão técnica — premissa que texto normativo adicional não
desloca. O patch foi rejeitado e revertido; a evidência está preservada em `4ca9d18`.

## O que fica fora do freeze

O freeze cobre o `rufas-router.md`. Não cobre, e pode evoluir sem revogá-lo:

- **Contrato e registry** — as pendências abertas em `UNDETERMINED_BY_CONTRACT` (relatos de bug
  no acervo observável) e os três casos `CONTRACT_UNDERDETERMINED` são resolvíveis no contrato.
- **Benchmark** — X-07 e X-10 têm hipóteses de contradição com o registry e a
  `approval-policy.md` levantadas mas não adjudicadas (ver "Pendências de adjudicação" acima).
  A adjudicação, seja qual for o resultado, não altera o router.
- **Metodologia de medição** — qualquer avaliação futura precisa de N repetições por
  configuração. Uma execução única não distingue efeito de ruído neste sistema.

## Condições para revogar o freeze

Reabrir o tuning do router só se pelo menos uma for verdadeira:

1. o contrato mudar de forma que altere ownership normativo ou domínio observacional;
2. a variância cair de forma medida abaixo de ~5% (o que mudaria o que é possível concluir);
3. surgir um mecanismo fora de texto normativo — exemplo em contexto, few-shot, avaliação com
   repetição — que enderece a premissa do modelo em vez da redação da regra.

Não reabrir para: perseguir 44/44, corrigir casos variantes, ou adicionar exceção por caso.
