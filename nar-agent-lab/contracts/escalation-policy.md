# Escalation Policy — v0.1.0

> **STATUS: LAB.** Define quando parar e para quem escalar.

Escalar não é sinal de fraqueza nem de falha — é o comportamento correto quando a decisão
excede a autoridade do agente. O erro grave é o oposto: **decidir sozinho o que não era seu
para decidir**. O segundo erro mais grave é escalar tudo, o que transforma o humano em
gargalo e o laboratório em teatro.

---

## Destinos

| Destino | Quando |
|---|---|
| `rufas-router` | O trabalho continua, mas pertence a outro domínio, ou a missão está mal formada |
| `<agent_id>` | Sugestão de próximo dono; **o router decide**, o agente nunca delega direto |
| `HUMAN` | Decisão material, ambígua, irreversível, ou fora do contrato |

---

## E1 — Escalar para `HUMAN`

Obrigatório quando qualquer uma se aplica:

| # | Condição |
|---|---|
| E1.1 | **Decisão material**: preço, desconto, condição comercial, prazo contratual, escopo de contrato |
| E1.2 | **Ambiguidade real**: duas leituras da intenção levam a trabalhos materialmente diferentes |
| E1.3 | **Informação insuficiente** para decisão material, e o dado faltante não é obtenível pelas tools do registry |
| E1.4 | **Ação irreversível ou externa**: enviar, publicar, compartilhar, alterar dado de terceiro |
| E1.5 | **Comunicação em nome de pessoa real** (ex.: fala atribuída a Nathalia Serrano) |
| E1.6 | **Guardrail de marca em conflito** com o que foi pedido, incluindo `restricted_claims` |
| E1.7 | **Dado pessoal** cujo uso vai além do necessário para a missão |
| E1.8 | **Capability ausente** que muda o resultado do negócio (ver `CAPABILITY_GAPS` abaixo) |
| E1.9 | **Conflito entre agentes** sobre o mesmo objeto, sem regra de desempate no contrato |

E1.2 e E1.3 são a regra 9 do router: *decisão material ou ambígua → HUMAN*. Não vale
escolher a interpretação mais provável e seguir.

## E2 — Escalar para `rufas-router`

| # | Condição |
|---|---|
| E2.1 | O trabalho necessário pertence a outro domínio (`OWNERSHIP_BASE`) |
| E2.2 | A missão exige tool que o OWNER não possui no registry |
| E2.3 | A missão chegou mal formada (campo obrigatório ausente, `TOOLS_ALLOWED` fora do conjunto do OWNER) |
| E2.4 | Surgiu dependência não prevista que exige outra missão antes desta |
| E2.5 | Tool retornou `ACCESS_DENIED` — o agente para, sem tentar rota alternativa |
| E2.6 | Tool retornou `UNKNOWN_TOOL` — possível gap de capability |

## E3 — Quando NÃO escalar

Escalação indevida custa tanto quanto decisão indevida.

- Incerteza normal resolvível com as tools que o agente já tem.
- Preferência de estilo, formato ou tom dentro dos guardrails.
- Resultado vazio: `ok: true` com lista vazia é resposta legítima, não blocker.
- Escopo grande, mas claro. Grande não é ambíguo.
- Desconforto com o próprio julgamento técnico dentro do próprio domínio.
- Vontade de confirmar algo que a missão já definiu.

Se a dúvida é *"como faço bem isto que é meu?"* → faça. Se é *"quem decide isto?"* → escale.

---

## Comportamento ao escalar

1. **Parar.** Não produzir trabalho especulativo "para adiantar" depois de identificar a escalação.
2. **Entregar o apurado.** `OUTPUT` traz o que já foi levantado até o ponto da decisão — escalar não é devolver vazio.
3. **Nomear a decisão.** `SUMMARY` diz qual é a decisão pendente, não apenas que existe uma.
4. **Apontar o destino** em `NEXT_OWNER`.
5. **Citar a regra** (`E1.x` / `E2.x`) em `EVIDENCE`.
6. **Não escalar duas vezes** o mesmo ponto. Ponto já escalado e devolvido com decisão é seguido, não reaberto.

---

## `CAPABILITY_GAPS`

Quando a missão precisa de capability que **não existe** no registry:

1. **Não criar a capability.** Nem propor `TOOLS_ALLOWED` com nome inventado, nem simular o resultado que ela daria.
2. **Não contornar** com outra tool que "quase serve", produzindo resultado enganoso.
3. **Registrar** o gap: qual decisão de negócio fica bloqueada, qual capability faltaria, qual agente seria o dono.
4. **Escalar** por E1.8 se o gap muda o resultado; por E2.6 se é apenas caminho alternativo.

O registro vira entrada em `../benchmarks/router-report.md` → `CAPABILITY_GAPS`. Criação de
capability nova é decisão humana e exige alterar o contrato MCP — o que está congelado em
`0.1.0`.

---

## Anti-padrões

| Anti-padrão | Por que é errado |
|---|---|
| Escalar para não errar | Transfere o custo ao humano sem transferir informação |
| Decidir preço "só desta vez" | E1.1 não tem exceção |
| Tentar outra tool após `ACCESS_DENIED` | Contorno de política; a negativa é final |
| Inventar tool que "deveria existir" | Viola `no_capability_invention` |
| Escalar sem entregar o apurado | Perde trabalho já feito e obriga refazer |
| Escalar com `SUMMARY` genérico ("preciso de orientação") | O humano não sabe o que decidir |
| Reabrir ponto já decidido pelo humano | Loop de escalação |
