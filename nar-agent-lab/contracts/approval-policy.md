# Approval Policy — v0.1.0

> **STATUS: LAB.** Define o que exige aprovação humana antes de acontecer.

No contrato MCP `0.1.0` **nenhuma capability de escrita existe**. Nada pode ser enviado,
publicado, alterado ou compartilhado por um agente — não porque está desabilitado, mas
porque não há caminho de execução. Esta política existe por dois motivos:

1. delimitar o que os agentes podem **recomendar** e o que precisa de decisão humana;
2. estar pronta antes de a primeira capability de escrita ser sequer discutida.

---

## Estado atual

| | |
|---|---|
| Capabilities de escrita | **0** |
| Tools com `approval_required: true` | **0** — não porque a aprovação foi dispensada, mas porque não há ação a aprovar |
| Ações externas possíveis | **nenhuma** |
| O que os agentes produzem | recomendação, análise, rascunho — nunca execução |

Toda saída de agente é **proposta**. A execução, quando existir, é humana.

---

## Ações que exigem aprovação humana

Valem hoje como limite de recomendação, e valem no futuro como gate de execução.

| # | Ação | Aprovador | Reversível |
|---|---|---|---|
| A1 | Enviar mensagem a contato real (email, WhatsApp) | humano responsável pela conta | não |
| A2 | Publicar campanha ou conteúdo externo | humano de marketing | não |
| A3 | Oferecer preço, desconto ou condição comercial | humano comercial | não |
| A4 | Criar, alterar ou cancelar proposta | humano comercial | parcialmente |
| A5 | Alterar dado de contato ou stage no CRM | humano de CRM | sim, com trilha |
| A6 | Compartilhar, mover ou subir arquivo no Drive | humano responsável pelo acervo | parcialmente |
| A7 | Alterar workflow n8n em ambiente compartilhado | humano de engenharia | sim, com rollback |
| A8 | Alterar o contrato MCP, o registry ou o escopo autorizado | humano de engenharia + produto | sim |
| A9 | Falar em nome de pessoa real | a própria pessoa | não |
| A10 | Usar dado pessoal além do necessário para a missão | humano responsável pelos dados | não |

A3 e A9 não têm exceção — nem "só desta vez", nem "o usuário já tinha dito que sim antes".
Aprovação vale para o caso concreto, não para a categoria.

---

## O que NÃO exige aprovação

Trabalho de leitura e recomendação dentro do domínio do agente e do contrato:

- consultar qualquer tool em `TOOLS_ALLOWED`;
- produzir rascunho, análise, comparação, priorização ou recomendação;
- apontar inconsistência de dado, sem corrigi-la;
- propor `NEXT_OWNER` (o router decide);
- recusar trabalho por `ACCESS_DENIED` ou por estar fora do domínio.

Exigir aprovação para leitura transforma a política em ruído e ensina o humano a aprovar no
automático — o que anula o valor do gate quando ele realmente importar.

---

## Trabalho ordinário do agente vs. ação sobre terceiro

A tabela de A1–A10 lista **ações**, não **temas**. Um agente cujo domínio inclui relacionamento,
comunicação ou oferta comercial passa a maior parte do tempo tratando desses temas sem que
isso, por si só, dispare aprovação. A pergunta que decide não é *"este assunto toca contato
real, dinheiro ou publicação?"* — é **quem o resultado afeta e o que muda no mundo fora do
laboratório quando a missão termina**.

**Trabalho ordinário do agente** — fica dentro do próprio domínio, produz um artefato interno
(texto, avaliação, priorização, rascunho), e **nada muda fora do laboratório** até que um
humano decida agir sobre esse artefato:

- avaliar se um comportamento, regra ou peça está correto, adequado ou alinhado ao
  posicionamento — mesmo quando o tema é preço, oferta ou comunicação;
- preparar, redigir ou esboçar uma resposta, mensagem, material ou abordagem — o rascunho
  em si não sai do agente para o terceiro;
- recomendar uma priorização, um próximo passo ou uma linha de conduta;
- diagnosticar, levantar contexto ou apontar inconsistência.

Isso vale **mesmo quando o objeto da análise é sensível** (preço, contato real, publicação).
Analisar não é decidir, e redigir não é enviar.

**Ação/decisão real sobre terceiro** — o resultado da missão, sozinho, muda algo que um
terceiro (contato, mercado, sistema compartilhado) vê ou recebe, ou compromete a organização
perante ele:

- enviar, publicar, compartilhar ou de qualquer forma entregar algo a um destinatário real;
- comprometer-se em nome da organização com uma condição, prazo ou compromisso específico;
- executar uma alteração que passa a valer para outros, sem revisão humana intermediária.

**O teste**: se o `OUTPUT` da missão é algo que um humano ainda vai ler, revisar e decidir o
que fazer, é trabalho ordinário — não escale só porque o tema é sensível. Se o `OUTPUT` da
missão é a própria coisa acontecendo (a mensagem já foi, o preço já foi oferecido, a peça já
está no ar), é ação sobre terceiro — sempre escale, e o preparo que veio antes continua sendo
missão válida, não vira gate por contaminação.

Quando o verbo da intenção é ambíguo entre os dois ("abordar", "responder", "conduzir",
"tratar de"), a missão em si — analisar, recomendar, redigir — é trabalho ordinário e não
escala. Só escala a etapa que, se executada, seria ela mesma o envio, a publicação ou o
compromisso — e essa etapa frequentemente nem existe como capability no contrato hoje, o que
a torna automaticamente fora de alcance por ausência de tool, não por gate.

---

## Forma da aprovação

Quando um agente chega em ação que exige aprovação, ele **para** e escala por
`escalation-policy.md` E1, entregando:

```
STATUS:      ESCALATE
SUMMARY:     <a decisão pendente, em uma frase>
OUTPUT:      <o apurado + a ação proposta, pronta para ser aprovada ou recusada>
NEXT_OWNER:  HUMAN
EVIDENCE:    <regra A<n> + ids consultados>
```

A ação proposta deve ser **específica o bastante para um sim/não**. "Fazer retomada dos
contatos frios" não é aprovável; "enviar a estas 4 escolas o texto abaixo" é.

Uma aprovação:
- vale para a ação descrita, naquele escopo, uma vez;
- não se estende a casos semelhantes;
- não se acumula em permissão permanente;
- expira quando o contexto muda (nova data de referência, novo dado, novo contato).

---

## Pré-condições para a primeira capability de escrita

Nenhuma tool de escrita deve ser criada antes de todas:

1. **Benchmark read-only aprovado** — router e especialistas provados sobre o mock.
2. **`approval_required: true`** declarado na tool, no contrato e no registry.
3. **Aprovação humana no caminho de execução**, não apenas documentada.
4. **Trilha de auditoria**: quem pediu, quem aprovou, o que foi executado, quando.
5. **Rollback definido** para ações reversíveis; **confirmação dupla** para as irreversíveis (A1, A2, A3, A9).
6. **Escopo mínimo**: uma ação, um objeto por vez — nunca operação em lote na primeira versão.
7. **Revisão de dado pessoal** (LGPD) antes de qualquer escrita que toque contato real.

Enquanto qualquer item estiver aberto, a resposta correta a "faça isso acontecer" é
`ESCALATE → HUMAN`.
