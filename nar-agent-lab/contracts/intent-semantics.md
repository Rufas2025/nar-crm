# Intent Semantics Contract — v0.1.0

> **STATUS: LAB.** Regra geral de leitura de intenção. Vale para qualquer intenção recebida
> pelo `rufas-router`, não para um caso específico.

Este contrato existe porque uma família de construções em português é sistematicamente
ambígua sobre **quantos entregáveis foram pedidos**, e essa ambiguidade não é resolvível por
preferência linguística: as duas leituras são defensáveis. Sem uma decisão contratual, o
mesmo enunciado produz decomposições diferentes a cada execução.

---

## A construção

São equivalentes, para efeito desta regra:

- "Antes de X, preciso saber Y"
- "Só consigo X depois de Y"
- "A partir de Y, X"
- "Depois de conferir Y, X"

Nelas, **Y é o insumo** e **X é o entregável final**. A oração que carrega X pode estar
subordinada, e o verbo em primeira pessoa pode recair sobre Y ("preciso saber", "consigo
enxergar") — isso não rebaixa X a contexto.

---

## A regra

**X e Y são ambos entregáveis pedidos.**

O falante enuncia X como a *razão* de precisar de Y. Se quisesse apenas Y, não teria nomeado
X: um pedido de levantamento puro não precisa declarar para que serve. Nomear X é pedi-lo.

Consequências:

- **X e Y pertencem a owners distintos** → podem gerar duas missões, segundo as demais
  regras de decomposição (que continuam valendo integralmente — esta regra não substitui
  nenhuma delas, apenas fixa que X conta como entregável pedido).
- **X e Y pertencem ao mesmo owner** → permanecem **uma** missão.

Esta regra decide apenas se X foi pedido. Ela não decide owner, não decide ordem e não
dispensa nenhuma outra condição de decomposição.

---

## Quando a construção NÃO está presente

Não confunda com dois padrões vizinhos, que continuam sendo **uma** missão:

- **Não há X além de Y.** A intenção pede um levantamento, um retrospecto, um mapeamento ou
  uma contagem, e não nomeia nenhum entregável posterior que o consuma. O levantamento é
  ele próprio o entregável final.
- **X e Y são do mesmo dono.** Dois verbos coordenados ("levante A e traga B") cujo trabalho
  cai inteiro na responsabilidade de um agente só. Coordenação não é cadeia.

---

## O que esta regra não faz

Ela não é um gatilho lexical. A presença de "antes de" não abre duas missões por si só, e a
ausência dele não fecha em uma: a construção apenas identifica **qual parte do enunciado é
insumo e qual é entregável**. Quantas missões existem continua sendo decidido pelas condições
de decomposição do `rufas-router`.
