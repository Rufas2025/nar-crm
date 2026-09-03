# Causa raiz — RC-14 e RC-22 (RUN_03)

> **Nada foi editado.** A regra da seção 4 é uma **proposta**, não está aplicada em
> `agents/rufas-router.md`.

## RC-14

**Intenção original**

> Peça para o marketing checar o histórico do contato antes de escrever a mensagem.

**Expected** — 2 missões, sequenciais:

| # | Owner | Escopo | Tools |
|---|---|---|---|
| 1 | `crm-nar` | levantar o histórico do contato | `crm_get_contact_context` |
| 2 | `marketing-nar` | escrever a mensagem com o histórico como INPUT | `campaign_get_brand_context` |

**Output RUN_03**

```json
{ "tasks": [ { "TASK_ID": "T-20260901-001",
    "OBJ": "Consultar o histórico do contato e redigir a mensagem com base nesse histórico.",
    "OWNER": "marketing-nar", "TOOLS_ALLOWED": ["campaign_get_history"],
    "DEPENDENCIES": [], "NEXT": null } ],
  "ESCALATE": false, "ESCALATION_REASON": null }
```

## RC-22

**Intenção original**

> Monta a prioridade de atendimento da semana: quem tem demo, quem tem proposta parada, quem sumiu.

**Expected** — 2 missões, sequenciais:

| # | Owner | Escopo | Tools |
|---|---|---|---|
| 1 | `crm-nar` | levantar o estado: demos, propostas pendentes, follow-ups vencidos | `crm_get_demo_scheduled`, `proposal_get_pending`, `crm_get_followups_due` |
| 2 | `atendimento-nar` | priorizar a carteira a partir do estado levantado | `crm_get_contact_context` |

**Output RUN_03**

```json
{ "tasks": [ { "TASK_ID": "T-20260901-001",
    "OBJ": "Montar a lista priorizada de atendimento da semana cruzando contatos com demo agendada, proposta parada e contatos sem interação recente.",
    "OWNER": "atendimento-nar",
    "TOOLS_ALLOWED": ["crm_get_demo_scheduled", "proposal_get_pending", "crm_get_followups_due"],
    "DEPENDENCIES": [], "NEXT": null } ],
  "ESCALATE": false, "ESCALATION_REASON": null }
```

---

## Onde exatamente a decomposição perdeu o dono do dado

Nos dois casos a intenção tem a mesma forma: **um verbo de levantamento seguido de um verbo de
uso do levantamento, numa frase só.** "Checar o histórico *antes de* escrever"; "montar a
prioridade *a partir de* quem tem demo, proposta parada, sumiço".

O router leu isso como **um** entregável — "a mensagem", "a lista priorizada" — e atribuiu a
missão inteira ao dono do **último** verbo, o de uso. O verbo de levantamento não desapareceu
do `OBJ`; desapareceu como **missão**. E como a missão sumiu, o dono do dado sumiu junto.

O efeito colateral é o que torna isso grave, e ele é diferente em cada caso:

**RC-14 — objeto errado, tool tecnicamente válida.** Sem a missão de CRM, o router precisou
resolver "histórico do contato" com as tools que `marketing-nar` tem, e escolheu
`campaign_get_history`. A tool está dentro do registry do owner, então **a tool policy não
acusa nada** — e mesmo assim o resultado seria falso: histórico de *campanha* não é histórico
de *contato*. É o anti-padrão "tool que quase serve", já nomeado no spec v2, passando por
baixo da única métrica que estava em 100%.

**RC-22 — dono certo para a parte errada.** `atendimento-nar` recebeu o levantamento de
estado, que é responsabilidade de `crm-nar`. Como os dois têm **as mesmas cinco tools**, a
execução funcionaria; o que se perde é a separação de responsabilidade que justifica os dois
agentes existirem. Nenhuma métrica de tool pega isso — só a de owner.

**A raiz é uma só, e não é confusão de papéis.** Nos dois casos, quando o router foi forçado a
escolher **um** dono para uma cadeia de dois, ele escolheu o dono do resultado final. Isso é
consistente e previsível: a regra de decomposição do spec v3 manda contar entregáveis, e nas
duas intenções o entregável final é mesmo um só. A regra está certa e insuficiente — ela não
diz o que fazer quando o insumo de um entregável é, ele próprio, trabalho de outro dono.

Note também que **RC-14 passou no RUN_02 e falhou no RUN_03 com o mesmo spec**. O
comportamento está na fronteira da regra, não do lado errado dela — o que reforça que falta
critério, não que o critério existente esteja invertido.

---

## Regra proposta para `agents/rufas-router.md` — **não aplicada**

Entra na seção **Procedimento**, logo após o Teste de decomposição.

> **Teste do insumo.** Antes de fechar uma missão, pergunte de cada coisa que ela precisa
> receber para começar: *isso já existe, ou alguém precisa produzir?*
>
> Se o insumo precisa ser produzido e quem o produz **não é o dono desta missão**, então ele é
> uma **missão anterior**, com o seu próprio dono — mesmo que o entregável final continue
> sendo um só, e mesmo que a intenção tenha vindo numa frase única.
>
> O sinal mais comum: a intenção liga dois verbos com "antes de", "a partir de", "com base
> em", "depois de conferir". O primeiro verbo quase sempre é um insumo de outro domínio; o
> segundo é o entregável. Isso é uma cadeia de duas missões, não uma missão com escopo largo.
>
> Não resolva o insumo esticando o escopo do dono do entregável. Se ele não tem a tool que
> alcança aquele dado, nenhuma tool que ele tenha vai servir — e a que parecer mais próxima
> vai produzir uma resposta plausível sobre o objeto errado.

**Verificação de generalidade.** A regra não cita RC-14, RC-22, nem nenhum conteúdo dos casos:
não menciona histórico de contato, prioridade de carteira, marketing, CRM, nem qualquer tool.
Descreve uma forma de intenção — verbo de insumo + verbo de entregável — que aparece em
qualquer domínio.

**Efeito esperado, se aplicada.** Converter RC-14 e RC-22 levaria `ROUTING_ACCURACY` de 84,1%
para 91,0% e `OWNER_ACCURACY` para 100%, fechando o gate. **Esse número é uma projeção
aritmética sobre casos já vistos, não uma medição** — e por isso não deve ser usado como
resultado. O valor real da regra só aparece contra os casos novos do v0.2, que ela nunca viu.
