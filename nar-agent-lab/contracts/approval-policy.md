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
