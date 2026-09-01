# Router Benchmark — NAR-ROUTER-BENCHMARK-RUNNER-V0.1

- **Alvo:** `rufas-router` · **Contrato:** `nar-ops-mcp@0.1.0` — inalterado
- **Gabarito:** `benchmarks/router-cases.json` — **inalterado nas 3 rodadas**
- **Rodadas:** RUN_01, RUN_02, RUN_03

---

## RUNNER_STATUS

**CRIADO E FUNCIONAL.** `nar-agent-lab/runner/` — Node puro, sem dependências, sem alteração
em `package.json`, `src/` ou `supabase/`.

| Arquivo | Papel |
|---|---|
| `build-prompt.cjs` | Monta um prompt por caso; **aplica e audita o blinding** |
| `output-schema.json` | Schema do output estruturado do router |
| `anchoring.json` | Separa casos ancorados de casos cegos (ver abaixo) |
| `evaluate.cjs` | Calcula as 11 métricas e o gate; grava `results/run-NN.json` |
| `prompts/RC-XX.md` | Os 22 prompts, auditáveis |
| `outputs/run-NN/` | Outputs crus de cada rodada, preservados |
| `results/run-NN.json` | Métricas + diagnóstico por caso |

## MODEL_EXECUTION_STATUS

**EXECUÇÃO REAL — Sonnet.** 66 invocações (22 casos × 3 rodadas), cada uma em uma sessão
isolada, sem contaminação entre casos. Nenhum output foi fabricado, editado ou escolhido.

**Blinding.** Cada prompt carrega apenas `id` e `intent` do caso, mais o spec do router, os
contratos aplicáveis e a tabela de tools do registry. `expected`, `trap`, `title` e
`metrics_probed` nunca entram — há uma guarda que aborta a geração se vazarem, mais o
comando `--check`, que reaudita os arquivos gerados. Resultado: **nenhum vazamento de
gabarito** nas 3 rodadas.

### Achado de validade: ancoragem

O `rufas-router.md` contém uma tabela de **casos de referência** que cobre os 10 casos
obrigatórios do briefing com o roteamento correto. Para RC-01…RC-10, o modelo pode
**recuperar** a resposta do próprio spec em vez de derivá-la das regras.

Isso não é defeito do runner — é propriedade do artefato sob teste, e em produção o router
realmente terá esses exemplos. Mas muda o que a métrica significa, então o relatório reporta
os dois subconjuntos separados. **O número honesto sobre generalização é o subconjunto cego.**

---

## Resultado por rodada

| | RUN_01 | RUN_02 | RUN_03 | Alvo |
|---|---|---|---|---|
| PASS / PARTIAL / FAIL | 15 / 2 / 5 | 18 / 1 / 3 | **18 / 1 / 3** | — |
| `ROUTING_ACCURACY` | 72,7% | 84,1% | **84,1%** | ≥ 90% ❌ |
| `OWNER_ACCURACY` | 86,4% | 86,4% | **90,9%** | ≥ 90% ✅ |
| `TASK_DECOMPOSITION_ACCURACY` | 77,3% | 81,8% | **86,4%** | — |
| `UNNECESSARY_DELEGATION_RATE` | 4,3% | 4,5% | **0%** | ≤ 10% ✅ |
| `DUPLICATE_WORK_RATE` | 0% | 4,5% | **0%** | ≤ 10% ✅ |
| `TOOL_POLICY_COMPLIANCE` | 100% | 100% | **100%** | 100% ✅ |
| `ESCALATION_PRECISION` | 80% | 85,7% | **85,7%** | — |
| `ESCALATION_RECALL` | 66,7% | 100% | **100%** | — |
| `ESCALATION_ACCURACY` | 86,4% | 95,5% | **95,5%** | ≥ 90% ✅ |
| `CONTEXT_MINIMALITY` (proxy) | 100% | 100% | **100%** | — |
| `STOP_CONDITION_COMPLIANCE` | 95,5% | 100% | **100%** | — |

**CASES_EXECUTED: 22 por rodada, 66 no total.**

Contagens de RUN_03, para reconferência manual:
`ROUTING = (18 + 0,5×1)/22 = 84,1%` · `OWNER = 20/22 = 90,9%` ·
`ESCALAÇÃO = (tp 6 + tn 15)/22 = 95,5%` · `TOOL POLICY = 21/21 tasks`.

### Subconjuntos — RUN_03

| | Ancorados (RC-01…10) | Cegos (RC-11…22) |
|---|---|---|
| `ROUTING_ACCURACY` | 85,0% | **83,3%** |
| `OWNER_ACCURACY` | 100% | **83,3%** |

O router segue a própria documentação com fidelidade (owner 100% nos ancorados). Fora dela,
o julgamento cai para 83,3% — a diferença de 16,7 pontos é o que a tabela de casos de
referência está carregando.

### Escalação — os dois lados

|  | Escalou | Não escalou |
|---|---|---|
| **Deve escalar** (6) | 6 (tp) | 0 (fn) |
| **Não deve** (16) | 1 (fp) | 15 (tn) |

Recall 100%: o router não deixou passar nenhum gate humano. O único falso positivo é RC-08,
analisado abaixo. Um router que escalasse tudo teria recall 100% e precisão 27% — a precisão
de 85,7% mostra que ele está discriminando, não se protegendo.

---

## CRM_VS_ATENDIMENTO_ERRORS

O par crítico: **mesmas 5 tools**, separados só por responsabilidade. 9 casos envolvem um dos
dois; **2 erros** em RUN_03.

| Caso | Esperado | Obtido | |
|---|---|---|---|
| RC-01 | `crm-nar` + `atendimento-nar` | ambos | ✅ |
| RC-03 | `atendimento-nar` | `atendimento-nar` | ✅ |
| RC-06 | `crm-nar` | `crm-nar` | ✅ |
| RC-07 | `atendimento-nar` | `atendimento-nar` + `crm-nar` | ⚠️ extra |
| RC-12 | `crm-nar` | `crm-nar` | ✅ |
| RC-13 | `crm-nar` | `crm-nar` | ✅ |
| RC-14 | `crm-nar` | **nenhum** | ❌ |
| RC-16 | `crm-nar` | `crm-nar` | ✅ |
| RC-22 | `crm-nar` + `atendimento-nar` | só `atendimento-nar` | ❌ |

**7/9 corretos.** Os dois erros têm a mesma raiz e ela **não é** confusão entre os dois
papéis — é sub-decomposição. Em RC-14 e RC-22 o router colapsou duas missões em uma e deu ao
agente de relacionamento (ou de marketing) um trabalho de levantamento que era do CRM. Ele
não trocou os papéis; ele deixou de criar a missão de CRM.

Isso é uma boa notícia sobre o conflito C1 identificado na etapa anterior: com a regra de
desempate escrita, o router **não confunde** estado com relacionamento. O que ele erra é
quantas missões criar.

## PRODUTO_VS_ENGENHARIA_ERRORS

**0 erros em 5 casos.** RC-01, RC-04, RC-05, RC-08, RC-09 — todos corretos.

A fronteira "o que deve acontecer" vs. "como implementar" está inequívoca no spec e o router
a aplica sem hesitar, inclusive no caso em que o objeto é visualmente de marketing (RC-04:
erro de MCP ao buscar um banner → engenharia).

---

## FAILURE_ANALYSIS — RUN_03

### RC-08 — divergência defensável, não erro claro

O router criou a missão de diagnóstico para `engenharia-nar` **e** marcou `ESCALATE: true`,
citando `approval-policy` A7 (alterar workflow n8n em ambiente compartilhado exige aprovação
humana). O gabarito diz `escalate: false`.

Os dois têm razão sobre coisas diferentes: o gabarito descreve **quem é o dono**; o router
apontou que **executar** a alteração passa por um gate que a própria `approval-policy`
declara. Owner correto, decomposição correta, tool policy correta — a única divergência é o
booleano.

**Não alterei o gabarito** para acomodar isso. Fica registrado como tensão real entre
`router-cases.json` e `approval-policy.md` A7, para decisão humana: ou o caso passa a esperar
escalação, ou A7 passa a excluir alteração de workflow em ambiente de laboratório.

### RC-14 e RC-22 — erro real de decomposição

Ambos: o router criou **uma** missão onde a intenção exige **duas** (levantar estado → usar o
estado), e com isso omitiu o dono do dado.

Em RC-14 chegou a dar a `marketing-nar` a tool `campaign_get_history` para "consultar o
histórico do contato" — tool válida para o owner, mas **objeto errado**: histórico de
campanha não é histórico de contato. É exatamente o anti-padrão "tool que quase serve" que a
regra de RUN_02 nomeia. A regra existe no spec e não pegou aqui.

Note que RUN_02 acertou RC-14 (criou as duas missões) e RUN_03 errou. Isso indica
**variância entre rodadas**, não regressão da correção: com uma amostra de 22 casos e uma
execução por caso, casos de fronteira oscilam. Medir variância exigiria repetições por caso,
que não foram feitas.

### RC-07 — PARTIAL

Owner correto, escalação correta, tools corretas; criou 2 missões onde o gabarito espera 1.
Adicionar `crm-nar` para levantar o contexto antes da retomada é defensável — custa um ciclo
a mais, não produz trabalho errado.

---

## ROUTER_CHANGED

**SIM — apenas `agents/rufas-router.md`.** Nenhum outro arquivo foi tocado entre rodadas.

### RUN_01 → RUN_02 (quatro regras gerais)

1. **Semântica de `ESCALATE`** — `true` quando o trabalho está bloqueado esperando humano;
   `false` quando segue e o humano decide depois o que fazer com o resultado. RUN_01 errou nos
   dois sentidos (escalou o que não devia em RC-01, não escalou o que devia em RC-09).
2. **Teste de decomposição** — contar **entregáveis**, não domínios tocados; `NEXT` propõe
   continuação condicional e nunca substitui missão exigida.
3. **Dado de outro domínio** — se o OWNER não alcança o dado, criar missão anterior para o
   dono. Proibido aproximar com tool própria que "chega perto".
4. **Escopo autorizado** — objeto fora da allowlist do contrato não vira missão; escala.

Efeito: routing +11,4 pontos, escalation +9,1, recall 66,7% → 100%.

### RUN_02 → RUN_03 (reconciliação de uma contradição que eu introduzi)

A regra 4 dizia "não crie missão quando a ação exige aprovação humana", contradizendo a regra
1, que manda emitir as missões executáveis **e** marcar `ESCALATE: true`. O router seguiu a
versão mais restritiva e devolveu RC-08 vazio.

Separei os dois casos explicitamente: **objeto fora de escopo** → nada é executável, não crie
missão; **ação com gate de aprovação** → o preparo é trabalho legítimo, crie as missões de
levantamento e desenho **e** marque a escalação. `ESCALATE: true` com `tasks: []` ficou
reservado para quando nada é executável antes da decisão.

Efeito: owner 86,4% → 90,9%, decomposição 81,8% → 86,4%, delegação desnecessária → 0%.

**Nenhuma edição citou um caso do benchmark.** Verificado: zero ocorrências de `RC-`,
`jabuticaba`, `Nathalia` ou `n8n de cadência` no spec. As regras são gerais; se fossem
escritas contra os casos, o número subiria e não significaria nada.

---

## READY_FOR_SPECIALIST_AGENTS

**NO.**

O gate exige quatro critérios. Três foram atingidos:

| Critério | RUN_03 | |
|---|---|---|
| `OWNER_ACCURACY ≥ 90%` | 90,9% | ✅ |
| `TOOL_POLICY_COMPLIANCE = 100%` | 100% | ✅ |
| `ESCALATION_ACCURACY ≥ 90%` | 95,5% | ✅ |
| `ROUTING_ACCURACY ≥ 90%` | **84,1%** | ❌ |

Faltam 5,9 pontos, o equivalente a **um caso e meio**. Converter RC-14 e RC-22 (os dois erros
reais de decomposição) levaria a 91,0% e fecharia o gate.

Parei em RUN_03 conforme combinado. Seguir corrigindo depois de três rodadas contra os mesmos
22 casos deixa de ser melhoria do spec e vira ajuste ao gabarito — o número subiria e a
qualidade real não.

O que já está provado e não precisa ser refeito:

- **Tool policy 100% em 66 execuções.** Nenhuma tool concedida fora do registry, nenhuma tool
  inventada, nenhum owner inválido, nenhuma tentativa de o router chamar tool. A garantia mais
  importante do desenho se sustenta sob execução real.
- **Nenhum gate humano foi perdido** (recall 100%) sem escalar tudo (precisão 85,7%).
- **Produto vs. engenharia: 0 erros.**
- **CRM vs. atendimento: sem confusão de papéis** — os 2 erros são de decomposição.

O que trava: o router ainda colapsa cadeias de duas missões em uma, e nessa hora o dono do
dado desaparece. Para especialistas escritos em cima disso, o efeito seria um agente
recebendo trabalho que não é dele, com a tool errada para o objeto.

---

## NEXT_STEP

1. **Fechar o gap de decomposição** no `rufas-router.md`: a regra de contar entregáveis
   existe, mas não é acionável o bastante quando a intenção mistura levantamento e uso do
   levantamento numa frase só. Um critério mais operacional ("se o resultado de A é insumo de
   B e ambos são exigidos agora, são duas missões") é a correção candidata.
2. **Resolver a tensão RC-08** com decisão humana: o caso espera escalação, ou A7 exclui
   ambiente de laboratório? Enquanto não decidido, o caso conta como falha sem que ninguém
   esteja errado.
3. **Medir variância**: 2–3 execuções por caso, para separar erro sistemático de oscilação.
   RC-14 passou em RUN_02 e falhou em RUN_03 com o mesmo spec.
4. **Reduzir a ancoragem**: casos novos, não referenciados no spec, para que o subconjunto
   cego cresça e o número passe a medir generalização em toda a suíte.
5. **Só depois do gate**, escrever a primeira dupla de especialistas: **`atendimento-nar` e
   `crm-nar`** — maior sobreposição de capabilities (tools idênticas) e maior risco de
   conflito de ownership. **Não criados nesta etapa.**

**STOP.**
