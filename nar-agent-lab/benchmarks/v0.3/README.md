# NAR-ROUTER-BENCHMARK-V0.3 — preparado, **não executado**

Nasce dos achados confirmados na auditoria do RUN_01 do v0.2. v0.1 e v0.2 permanecem
congelados — nada neste diretório os altera.

| | |
|---|---|
| Casos | **42** |
| Preservados do v0.2 | 28 (renumerados `W-01`..`W-42`, gabarito idêntico) |
| Corrigidos | 6 — os `BENCHMARK_ISSUE` confirmados do RUN_01 (`V-09, V-10, V-16, V-19, V-32, V-34`) |
| Novos | 8 — 4 para a clarificação de policy, 4 para o fix do "Teste do insumo" |
| Modelo | Sonnet, uma invocação isolada por caso (quando executado) |
| Status | prompts gerados e auditados; **nenhuma execução feita** |

## O que motivou cada mudança

**Correções (6 casos)** — cada uma resolve exatamente a causa raiz nomeada na auditoria do
RUN_01, não um ajuste cosmético:

| Origem | Categoria | Causa raiz corrigida |
|---|---|---|
| `V-09` | `dependencia` | gabarito exigia decomposição incondicional numa intenção condicional ("se…") — reescrita sem condicional, forçando cadeia obrigatória |
| `V-10` | `dependencia` | gabarito propunha missão com `tools_allowed: []` para domínio fora do registry — corrigido para `escalate: true` por capability-gap, como a `escalation-policy` manda |
| `V-16` | `approval_gate` | gabarito colapsava levantamento de estado (CRM) e preparo (atendimento) numa missão só, contradizendo a separação que o resto da suíte testa — corrigido para 2 missões |
| `V-19` | `approval_gate` | intenção ambígua sobre haver preparo — reescrita para deixar explícito que o conteúdo ainda não existe |
| `V-32` | `produto_vs_engenharia` | mesma classe de `V-10`, para diagnóstico técnico de produção |
| `V-34` | `produto_vs_engenharia` | mesma classe de `V-10`/`V-32` |

Nenhuma intenção corrigida é paráfrase da original — auditado por similaridade de Jaccard
contra as intenções substituídas do v0.2 e contra as 22 do v0.1.

**Novos — clarificação de policy (`policy_ordinary_vs_action`, 4 casos)**: testam a regra
adicionada em `contracts/approval-policy.md` ("Trabalho ordinário do agente vs. ação sobre
terceiro"), causa raiz confirmada de `V-11`, `V-28`, `V-31`. Dois pares: preparo/análise que
não deve escalar mesmo tocando em tema sensível (plano de abordagem, análise de viabilidade de
desconto) vs. ação real inequívoca (envio explícito "agora", concessão de desconto concreto +
comunicação).

**Novos — Teste do insumo (`teste_do_insumo`, 4 casos)**: testam o reforço aplicado ao
`rufas-router.md` (resolução do dono do insumo por tipo de dado, não pelo agente que vai usá-lo
depois), causa raiz confirmada de `V-07`. Cobrem pares não testados no v0.2 (produto→marketing,
engenharia→produto) e um controle negativo (insumo e entregável do mesmo dono, para confirmar
que o router não superdecompoe quando não deveria).

## Arquivos

| Arquivo | Papel |
|---|---|
| `router-cases-v0.3.intents.json` | `id`, `category`, `intent`. Único arquivo que o construtor de prompts lê |
| `router-cases-v0.3.expected.json` | Gabarito, com campo `source` rastreando a origem de cada caso (`preserved:v0.2:V-XX`, `corrected:v0.2:V-XX`, `new`) |
| `../../runner/build-prompt-v03.cjs` | Gera os prompts; `--check` audita blinding, ancoragem, originalidade, coerência com o registry e uso indevido de display name |
| `../../runner/prompts-v03/W-XX.md` | Os 42 prompts, auditáveis |

## Auditorias — todas passaram

42 casos · blinding (gabarito em arquivo separado, nenhum fragmento nos prompts) · 0 ancoragem
no `rufas-router.md` · 0 paráfrase contra v0.1 e contra os 6 casos v0.2 substituídos · schema
válido · registry coerente (0 tool fora do conjunto do owner) · display names nunca usados
como OWNER técnico.

## Como executar, quando autorizado

```bash
node ../../runner/build-prompt-v03.cjs           # regenera os prompts
node ../../runner/build-prompt-v03.cjs --check   # precisa passar antes de qualquer execução
# uma invocação isolada de Sonnet por caso, gravando em runner/outputs/v03-run-NN/W-XX.json
node ../../runner/evaluate-v03.cjs --run 01      # ainda não existe — criar antes do primeiro RUN
```

**Pendência conhecida**: `evaluate-v03.cjs` não foi criado nesta etapa (não pedido). Antes da
primeira execução, precisa existir seguindo o mesmo padrão de `evaluate-v02.cjs` — lendo só os
artefatos do v0.3, nunca do v0.1 ou v0.2.
