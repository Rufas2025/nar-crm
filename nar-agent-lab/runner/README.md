# runner — benchmark executável do rufas-router

Transforma os 22 casos declarativos de `../benchmarks/router-cases.json` em medição real do
comportamento do router. Node puro, sem dependências, sem tocar a aplicação.

## Como rodar

```bash
node build-prompt.cjs            # gera prompts/RC-XX.md + anchoring.json
node build-prompt.cjs --check    # audita se o gabarito vazou para algum prompt
# executar cada prompt em uma sessão isolada, gravando o JSON em outputs/run-NN/RC-XX.json
node evaluate.cjs --run 03       # calcula métricas → results/run-NN.json
```

Os arquivos são `.cjs` porque o `package.json` da aplicação declara `"type": "module"`; a
extensão mantém o runner autocontido sem alterar a configuração do projeto.

## Por que o blinding importa

O modelo que executa o router recebe **apenas** `id` e `intent` de cada caso, mais o spec e
os contratos. `expected`, `trap`, `title` e `metrics_probed` nunca entram no prompt —
`build-prompt.cjs` tem uma guarda que aborta a geração se algum deles vazar, e `--check`
reaudita os arquivos gerados.

Sem isso, a medição compararia o gabarito consigo mesmo e todo número seria 100%.

## Ancoragem — leia antes de interpretar as métricas

`rufas-router.md` traz uma tabela de **casos de referência** que cobre os 10 casos
obrigatórios do briefing (RC-01…RC-10) com o roteamento correto. Para esses, o modelo pode
**recuperar** a resposta do spec em vez de derivá-la das regras.

`anchoring.json` separa os dois grupos, e `evaluate.cjs` reporta métricas para cada um:

- **ancorados** (RC-01…RC-10): medem se o router segue a própria documentação;
- **cegos** (RC-11…RC-22): medem julgamento de roteamento a partir das regras.

O subconjunto cego é o número honesto sobre generalização.

## Como cada caso é julgado

Comparação semântica/estrutural, nunca textual:

| Dimensão | Regra |
|---|---|
| OWNER | conjunto de owners emitidos == exigidos (condicionais são tolerados) |
| DECOMPOSITION | número de tasks == `expected.decomposition` |
| DEPENDÊNCIAS | `sequencial` exige cadeia; `paralelo` exige ausência de dependências |
| ESCALATION | `ESCALATE` == `expected.escalate` |
| TOOL POLICY | todo `TOOLS_ALLOWED` ⊆ registry do OWNER |
| DELEGAÇÃO | nenhum owner proibido; extras contam contra |

`FAIL` = owner errado, escalação errada, tool fora do registry, ou owner proibido.
`PASS` = todas as dimensões corretas. `PARTIAL` = o resto.

`ROUTING_ACCURACY = (PASS + 0,5 × PARTIAL) / total`.

## Regras de integridade

- O gabarito (`router-cases.json`) **nunca** é alterado para o router passar. Se um caso
  parecer errado, isso é constatação a reportar, não edição a fazer.
- Entre rodadas, só `agents/rufas-router.md` pode mudar.
- Outputs ausentes ou fora do schema abortam a avaliação: nenhuma métrica é calculada sobre
  amostra parcial.
- `CONTEXT_MINIMALITY_PROXY` é um proxy estrutural declarado — mede verbosidade e marcas de
  raciocínio no `OBJ`, não minimalidade semântica.
