# Handoff Contract — v0.1.0

> **STATUS: LAB.** Formato obrigatório de retorno de todo agente especialista ao `rufas-router`.

O propósito deste formato é permitir que o router **consolide sem reprocessar**. O router
lê `STATUS`, `SUMMARY`, `NEXT_OWNER` e decide. Ele não lê o raciocínio do agente, não o
reexecuta e não o corrige. Se o router precisar do raciocínio interno para decidir, o
handoff está mal formado.

---

## Formato

```
STATUS:      PASS | PARTIAL | BLOCKED | ESCALATE
SUMMARY:     <máximo 3 frases>
OUTPUT:      <estrutura definida em EXPECTED_OUTPUT da missão>
ASSUMPTIONS: <apenas quando necessário>
BLOCKERS:    <somente blockers reais>
NEXT_OWNER:  <agent_id | HUMAN | nenhum>
EVIDENCE:    <quando aplicável>
```

`STATUS`, `SUMMARY`, `OUTPUT` e `NEXT_OWNER` são sempre obrigatórios.
`ASSUMPTIONS`, `BLOCKERS` e `EVIDENCE` são condicionais — ausentes quando não se aplicam,
nunca preenchidos com texto vazio de conteúdo.

---

## `STATUS`

| Valor | Significado | `OUTPUT` | `NEXT_OWNER` típico |
|---|---|---|---|
| `PASS` | Missão cumprida conforme `SUCCESS_CRITERIA` | completo | `nenhum` ou próximo da cadeia |
| `PARTIAL` | Parte entregue, parte impossível **dentro desta missão** | parcial, com lacuna nomeada | `rufas-router` ou o dono da lacuna |
| `BLOCKED` | Não foi possível avançar por obstáculo concreto | vazio ou parcial | `rufas-router` ou o dono do desbloqueio |
| `ESCALATE` | Requer decisão que o agente não tem autoridade para tomar | o que foi apurado até a decisão | `HUMAN` |

Regras:

- `PARTIAL` exige que a lacuna esteja nomeada em `BLOCKERS`. `PARTIAL` sem blocker é `PASS` com escopo reduzido — e escopo reduzido silenciosamente é proibido.
- `BLOCKED` nunca é usado para "achei difícil" ou "faltou tempo". Só para obstáculo verificável.
- `ESCALATE` é sempre sobre **autoridade**, não sobre dificuldade. Ver `escalation-policy.md`.
- `ACCESS_DENIED` de uma tool produz `BLOCKED`, nunca uma segunda tentativa com outra tool.
- `UNKNOWN_TOOL` produz `BLOCKED` e um candidato a `CAPABILITY_GAP` em `BLOCKERS`.

## `SUMMARY`

Máximo 3 frases. Deve responder: **o que foi feito, com que resultado, e o que muda agora.**
Nunca narra o processo ("primeiro consultei…, depois analisei…"). O router decide a partir
daqui — se o `SUMMARY` não basta para a decisão, o handoff falhou.

## `OUTPUT`

Segue exatamente a estrutura de `EXPECTED_OUTPUT` da missão. Estrutura diferente da pedida
é falha de handoff, mesmo com conteúdo bom.

Nenhum número vindo do mock pode ser apresentado como resultado real. Dado de laboratório é
marcado como tal dentro do próprio `OUTPUT`.

## `ASSUMPTIONS`

Só o que o agente **assumiu para poder concluir**, e que, se falso, mudaria o resultado.

Não são premissas: o óbvio, o que está na missão, e preferências de estilo. Se a premissa
é material a ponto de mudar uma decisão de negócio, não é premissa — é `ESCALATE`.

## `BLOCKERS`

Somente blockers reais, isto é: **algo verificável que impediu concluir**. Cada blocker traz
o que falta e quem pode resolver.

Não são blockers: incerteza confortável, escopo que o agente achou grande, preferência por
mais contexto, ou tool que ele gostaria de ter mas não precisa para o `EXPECTED_OUTPUT`.

## `NEXT_OWNER`

Uma proposta, não uma delegação — **só o router delega**. O agente indica quem deveria
seguir; o router decide se cria a missão.

`HUMAN` quando a continuação exige decisão material (ver `approval-policy.md`).
`nenhum` quando a cadeia termina aqui.

## `EVIDENCE`

Referências verificáveis: `TASK_ID` de origem, ids consultados (`contact_id`, `proposal_id`,
`File_ID`, `campaign_id`), nome da tool usada, código de erro recebido.

Nunca inclui credencial, `download_url` ou conteúdo integral de asset. Serve para o router
ou um humano reconferir sem refazer o trabalho.

---

## Exemplos

**PASS**

```
STATUS:      PASS
SUMMARY:     6 propostas pendentes, a mais antiga esperando há 26 dias. Quatro estão em
             negociação e duas apenas enviadas sem resposta. A fila de retomada está pronta
             para atendimento-nar priorizar.
OUTPUT:      [ { proposal_id: "prop_004", contact_id: "contact_014", status: "negociacao",
                 dias_esperando: 26, stage: "negociacao", ultima_interacao: "2026-08-29" }, … ]
NEXT_OWNER:  atendimento-nar
EVIDENCE:    task T-20260901-004; tools proposal_get_pending, crm_get_contact_context;
             dados de laboratório (mock 2026-09-01)
```

**BLOCKED**

```
STATUS:      BLOCKED
SUMMARY:     Não foi possível obter o asset do banner: o arquivo está fora do escopo
             autorizado do Drive. Nenhuma alternativa foi tentada.
OUTPUT:      nenhum
BLOCKERS:    - file_out_of_scope_001 retornou ASSET_OUT_OF_SCOPE; a pasta não está na
               allowlist do contrato. Desbloqueio depende de decisão de escopo, não de
               nova tentativa.
NEXT_OWNER:  rufas-router
EVIDENCE:    tool eduinfo_get_asset; erro ASSET_OUT_OF_SCOPE
```

**ESCALATE**

```
STATUS:      ESCALATE
SUMMARY:     A retomada pedida exige oferecer condição comercial diferenciada para duas
             escolas. Isso é decisão de desconto, fora da autoridade do agente.
OUTPUT:      { contatos_afetados: ["contact_012", "contact_022"], contexto_apurado: … }
NEXT_OWNER:  HUMAN
EVIDENCE:    task T-20260901-007; regra approval-policy.md A3 (condição comercial)
```

**Handoff mal formado** — o router deve recusar e devolver ao agente:

```
STATUS:      PARTIAL
SUMMARY:     Consultei o CRM, cruzei com as propostas, considerei o histórico de cada
             contato, avaliei que alguns estavam frios, então decidi priorizar…
             (narrativa de processo, sem resultado)
OUTPUT:      nenhum
NEXT_OWNER:  nenhum
```

Três defeitos: `PARTIAL` sem `BLOCKERS`, `SUMMARY` narrando processo em vez de resultado, e
`OUTPUT` vazio. O router não tem como consolidar isso sem reler o raciocínio — que é
exatamente o que este contrato existe para evitar.
