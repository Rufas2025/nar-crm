# Diagnóstico em camadas — SOURCE → OUTPUT

Cada camada é testada de forma independente, na ordem, até encontrar a primeira que falha (`FIRST_KNOWN_BAD`). A última camada que passou é `LAST_KNOWN_GOOD`.

## SOURCE
O evento/dado de origem existe e está correto? (ex.: o Instagram/webhook de fato disparou, o payload de origem é o esperado)

## INGESTION
O ponto de entrada recebeu o evento? (ex.: endpoint respondeu, log de recebimento existe)

## NORMALIZATION
O dado bruto foi transformado no formato esperado pelas etapas seguintes, sem perda/corrupção?

## DEDUPE
O evento não foi descartado incorretamente como duplicado, nem processado duas vezes por falha de dedupe?

## QUEUE
O evento está na fila esperada, na posição esperada, sem estar preso atrás de um item travado?

## SIGNING
Quando aplicável, a assinatura (HMAC) foi gerada corretamente sobre o payload exato que será enviado?

## TRANSPORT
A chamada de rede efetivamente saiu e chegou ao destino? Ver o aprendizado central: **um 401 aqui, quando o destino exige assinatura, é evidência de transporte funcionando** — não confundir com falha.

## AGENT
O processo/serviço que deveria processar a chamada está de fato rodando e alcançável nessa rota específica? (ver o caso Hermes: health check e subscription passando não provam que a rota pública/proxy até ele está correta — isso é testado separadamente)

## CALLBACK
Se o fluxo espera uma resposta assíncrona, ela está sendo entregue de volta corretamente?

## PERSISTENCE
O resultado foi de fato gravado onde deveria (banco, Data Table, etc.)?

## OUTPUT
O resultado final chegou a quem/o que deveria consumi-lo (usuário, próximo sistema, dashboard)?

## Aplicando o caso Hermes/Traefik a este modelo

No caso real registrado no `SKILL.md`:

- `AGENT` (Hermes local, `127.0.0.1:8644`) → `PASS`.
- `AGENT` (subscription) → `PASS`.
- `SIGNING`/`TRANSPORT` (HMAC unsigned) → `401`, que é `PASS` de transporte (ver acima).
- `TRANSPORT` (relay service) → `PASS`.
- A falha real estava numa camada de roteamento **entre** `TRANSPORT` e o público — a rota Traefik ausente. O modelo de 11 camadas acima é conceitual; na prática, "roteamento de borda" (proxy reverso, DNS, load balancer) é parte de `TRANSPORT` em sentido amplo, e precisa ser testado como sub-etapa própria quando o ambiente tem uma camada de proxy/roteamento na frente do serviço.

A lição geral: **testar cada sub-camada de `TRANSPORT` separadamente quando existe proxy/roteamento de borda** — "o serviço responde localmente" e "o público consegue alcançar o serviço" são dois testes diferentes, nunca inferidos um do outro.
