# NAR-ROUTER-BENCHMARK-V0.2 — preparado, **não executado**

Ciclo novo, com casos próprios. O v0.1 está congelado em `../BENCHMARK-V0.1-FROZEN.md` e não
é tocado por nada aqui.

| | |
|---|---|
| Casos | **34** |
| Modelo | Sonnet, uma invocação isolada por caso |
| Status | prompts gerados e auditados; **nenhuma execução feita** |
| Reuso do v0.1 | **zero** — nem repetição, nem paráfrase |
| Ancoragem | **zero** — nenhuma intenção aparece no `rufas-router.md` |

## Arquivos

| Arquivo | Papel |
|---|---|
| `router-cases-v0.2.intents.json` | `id`, `category`, `intent`. **Único** arquivo que o construtor de prompts lê |
| `router-cases-v0.2.expected.json` | Gabarito. Lido **só** pelo avaliador |
| `../../runner/build-prompt-v02.cjs` | Gera os prompts; `--check` audita blinding, ancoragem, originalidade e coerência |
| `../../runner/prompts-v02/V-XX.md` | Os 34 prompts, auditáveis |

## Blinding — o que mudou em relação ao v0.1

No v0.1, cada caso era um objeto que continha intenção **e** gabarito; o blinding dependia de
o construtor filtrar os campos certos, e uma guarda em runtime cobria o erro humano.

No v0.2 a separação é **física**: intenção e gabarito vivem em arquivos diferentes, e
`build-prompt-v02.cjs` não tem caminho de código até o arquivo de gabarito. Vazar deixou de ser
um descuido possível e passou a exigir editar o construtor.

A auditoria (`--check`) verifica quatro coisas:

1. **Blinding** — nenhum fragmento do gabarito (objeto, `scope`, `escalation_reason`, chaves como `forbidden_owners` ou `depends_on`) aparece em prompt algum.
2. **Ancoragem** — nenhuma intenção do v0.2 consta do `rufas-router.md`. A suíte inteira é cega, ao contrário do v0.1, onde 10 dos 22 casos tinham a resposta no próprio spec.
3. **Originalidade** — similaridade de Jaccard contra as 22 intenções do v0.1, com corte em 0,40. Esse teste já reprovou uma versão anterior de `V-24`, que foi reescrita.
4. **Coerência** — `decomposition` bate com o número de tasks, toda escalação tem motivo nomeado, todo `tools_allowed` ⊆ registry do owner, nenhum owner proibido usado como dono.

## Cobertura

| Categoria | Casos | IDs |
|---|---|---|
| a) owner único | 6 | V-01 … V-06 |
| b) dependência entre owners | 5 | V-07 … V-11 |
| c) paralelo | 4 | V-12 … V-15 |
| d) approval gate | 5 | V-16 … V-20 |
| e) objeto fora de escopo | 3 | V-21 … V-23 |
| f) consolidação | 3 | V-24 … V-26 |
| g) atendimento vs CRM | 4 | V-27 … V-30 |
| h) produto vs engenharia | 4 | V-31 … V-34 |

**Escalação: 9 positivos e 25 negativos.** Os dois lados por desenho — um router que escala
tudo acerta 9 e erra 25.

Os casos de approval gate exercitam explicitamente as duas formas de escalação com tarefa,
distinção que só nasceu na v3 do router e que o v0.1 nunca testou de forma limpa:
`V-16`, `V-19` e `V-20` esperam **missão de preparo + `ESCALATE: true`**; `V-17`, `V-18` e os
três casos fora de escopo esperam **`tasks: []` + `ESCALATE: true`**.

A categoria **dependência** (5 casos) é a que mede diretamente a falha herdada do v0.1: a
sub-decomposição que faz o dono do dado desaparecer. Ver `../../reports/rc14-rc22-root-cause.md`.

## Como executar, quando autorizado

```bash
node ../../runner/build-prompt-v02.cjs           # regenera os prompts
node ../../runner/build-prompt-v02.cjs --check   # precisa passar antes de qualquer execução
# uma invocação isolada de Sonnet por caso, gravando em runner/outputs/v02-run-NN/V-XX.json
node ../../runner/evaluate.cjs --run v02-run-01  # (requer apontar o avaliador para o gabarito v0.2)
```

**Pendência conhecida:** `evaluate.cjs` hoje lê `benchmarks/router-cases.json`. Antes da
primeira execução do v0.2 ele precisa aceitar o gabarito v0.2 como fonte — mudança pequena,
ainda **não feita**, para não tocar no avaliador que produziu os resultados congelados do v0.1.
