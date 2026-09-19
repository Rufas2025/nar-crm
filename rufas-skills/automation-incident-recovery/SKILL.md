---
name: automation-incident-recovery
description: "Use sempre que houver um incidente operacional envolvendo n8n, Hermes, Composio, Traefik, relay/proxy, webhooks, HMAC, APIs, containers, filas ou callbacks — algo que estava funcionando parou, um erro intermitente precisa de diagnóstico em camadas, ou uma recuperação precisa acontecer sem perder estado/fila/idempotência. NÃO usar para engenharia de workflow n8n sem incidente em andamento (isso é n8n-workflow-engineering), nem para pesquisa comercial/CRM — isso pertence a outras skills."
---

# automation-incident-recovery

Maturidade atual: **M0** (draft — nunca executada; ver critério de classificação no final).

## Missão

Diagnosticar e recuperar incidentes envolvendo n8n, Hermes, Composio, Traefik, relay/proxy, webhooks, HMAC, APIs, containers, filas e callbacks — sem destruir estado e sem repetir trabalho já validado.

## Escopo

`automatic_route_allowed = NO`. `terminal_allowed = ADMIN_SESSION_ONLY`. `external_write_allowed = CONTROLLED`. Incidente é sempre sessão explícita — nunca acionado por roteamento automático.

## Governança

- **Owner**: NAR ECO / Anderson Rufino
- **Version**: 0.1.0
- **Last reviewed**: 2026-09-19

**Allowed tools**: healthchecks; logs; requests mínimos; diagnósticos de n8n/Hermes/Composio/Traefik/relay; comandos controlados `rufasops`; correções reversíveis após isolamento.

**Prohibited tools**: rota automática de webhook; root irrestrito; restart amplo exploratório; troca de secrets como tentativa; apagar/resetar fila/watermark; duplicar evento real para diagnóstico.

**Entry conditions**: incidente operacional real ou comportamento inesperado atravessando uma ou mais camadas.

**Exit conditions**: `LAST_KNOWN_GOOD`, `FIRST_KNOWN_BAD`, `ROOT_CAUSE`, `FIX`, `ROLLBACK`, `RESUME_FROM` preenchidos e estado estabilizado, ou bloqueio explicitamente escalado.

**Abort/escalation conditions**: quando a ação necessária ultrapassar mandato/permissão ou tiver blast radius não controlado.

## Princípio central

```
OBSERVE → ISOLATE → TEST → FIX → VERIFY → RESUME
```

Nenhuma etapa é pulada. "Consertar para frente" sem isolar a causa real produz incidentes secundários piores que o original.

## Princípios operacionais

- Usar checkpoint — cada camada confirmada é um ponto seguro de retomada.
- Preservar evidências (logs, respostas, timestamps) antes que expirem ou sejam sobrescritas.
- Timebox técnico — uma linha de investigação tem um tempo limite antes de reavaliar a hipótese.
- Evitar investigação circular — se a mesma hipótese já foi testada e refutada, não testar de novo com pequena variação cosmética.
- Não repetir chamadas caras/desnecessárias contra sistemas reais.
- Separar sintoma de causa raiz — o que o usuário/sistema reporta não é necessariamente onde está o problema.
- Identificar a fronteira exata da falha — a última camada que funciona e a primeira que não funciona.
- Validar cada camada independentemente (ver "Modelo de camadas" abaixo) — nunca assumir que uma camada está OK só porque a anterior está.
- Preferir healthcheck e requests mínimos a reprodução completa do fluxo real.
- Uma mudança por vez.
- Ter rollback definido antes de aplicar qualquer fix.
- Não reiniciar serviços amplos por padrão — reiniciar um serviço inteiro é uma ação de alto blast radius, usada só quando a causa já aponta especificamente para ele.
- Não alterar secrets como tentativa exploratória.
- Não invalidar fila/watermark como atalho de teste.
- Não duplicar oportunidades/eventos ao tentar reproduzir o problema.
- Retomar sempre do último checkpoint válido, não do início.

## Modelo de camadas

```
SOURCE
  → INGESTION
  → NORMALIZATION
  → DEDUPE
  → QUEUE
  → SIGNING
  → TRANSPORT
  → AGENT
  → CALLBACK
  → PERSISTENCE
  → OUTPUT
```

Cada camada é testada independentemente antes de assumir que o problema está em uma camada posterior. Ver `references/layered-diagnosis.md` para como isolar cada uma na prática.

## Contrato de saída do diagnóstico

Toda investigação conduzida por esta skill produz, ao final (ou ao pausar em um checkpoint):

```
LAST_KNOWN_GOOD=
FIRST_KNOWN_BAD=
ROOT_CAUSE=
FIX=
ROLLBACK=
RESUME_FROM=
```

Sem esses seis campos preenchidos (mesmo que alguns como "ainda não determinado"), a investigação não está em estado de checkpoint utilizável — apenas em progresso não documentado.

## Caso real incorporado — Hermes "down" que não estava down

```
127.0.0.1:8644 = PASS
subscription = PASS
HMAC unsigned = 401
relay service = PASS
Traefik route = missing
public = 404
```

**Aprendizado 1**: não diagnosticar "Hermes down" quando health check e subscription já estão ativos — o sintoma público (404) tinha causa em uma camada específica (rota Traefik ausente), não no serviço Hermes em si. Isolar sempre: Hermes; relay; bind local; Traefik; rota pública — como camadas distintas, cada uma com seu próprio teste.

**Aprendizado 2**: `HTTP 401` em um endpoint protegido pode representar **sucesso de reachability** — não tratar 401 nesse contexto como falha. Quando o incidente está especificamente no HTTP Request do n8n, ver o procedimento completo em `n8n-workflow-engineering/references/diagnostic-playbook.md` — este arquivo mantém só a regra conceitual, não repete o passo a passo.

## Referências

- `references/layered-diagnosis.md` — como testar cada camada do modelo SOURCE→OUTPUT na prática, com os dois aprendizados do caso real aplicados em contexto.

## Critério de classificação de maturidade (M0–M5)

Cumulativo — cada nível exige o anterior cumprido, mais o incremento:

- **M0** — definição existe, nunca executada contra um incidente real.
- **M1** — pelo menos um incidente real conduzido com os seis campos de saída preenchidos corretamente.
- **M2** — pelo menos uma recuperação real que preservou fila/idempotência/estado, sem duplicar processamento.
- **M3** — pelo menos um caso de fronteira de falha corretamente isolada em uma camada não óbvia (como o caso Hermes/Traefik).
- **M4** — uso repetido sem investigação circular e sem reinício de serviço amplo desnecessário.
- **M5** — uso prolongado, promoção humana explícita.

Esta skill está em **M0**. Não atribuir M4/M5 sem a evidência correspondente — nenhuma delas existe ainda.
