# Regras de qualificação

## ELIGIBLE

Todos os três simultaneamente:

1. Instituição privada **confirmada** (não presumida) — mantenedora identificada ou declaração explícita de natureza privada em fonte confiável.
2. Sinal comercial relevante e dentro da lista de escopo (obra, reforma, expansão, nova unidade, investimento em infraestrutura, etc.) — não um sinal genérico de "a escola é boa" ou "tem muitos alunos".
3. Evidência pública suficiente — pelo menos uma fonte nomeável com `FACT` claro, idealmente com data.

## REVIEW_REQUIRED

Qualquer um destes, sem que os outros dois critérios de `NOT_ELIGIBLE` se apliquem:

- Instituição provavelmente privada, mas sem confirmação definitiva (ex.: nome sugere privada, mas não foi encontrada declaração explícita nem mantenedora).
- Sinal promissor, mas falta um elemento crítico (ex.: sinal claro de obra, mas sem data e sem segunda fonte).
- Pesquisa aprofundada não confirmou um sinal inicial razoável — não é uma rejeição, é uma lacuna a resolver antes de decidir.

## NOT_ELIGIBLE

Qualquer um destes:

- Instituição confirmada como pública.
- Sinal fora do escopo comercial relevante (ex.: menção de reforma de banheiro, evento pontual sem relação com infraestrutura/expansão real).
- Sinal antigo sem valor comercial atual (ex.: obra concluída há anos, sem sinal de continuidade/nova fase).
- Ausência total de evidência verificável, mesmo depois de pesquisa completa.

Suspeita de duplicação (`possible_duplicate_keys`/`possible_duplicate=true`) **não é**, por si só, motivo de `NOT_ELIGIBLE` — ver "Dedupe" abaixo.

## PRIVATE_STATUS = UNKNOWN

A taxonomia final de `eligibility` é somente `ELIGIBLE`/`REVIEW_REQUIRED`/`NOT_ELIGIBLE` — `UNKNOWN` nunca é um valor de `eligibility`. Quando não é possível confirmar se a instituição é privada ou pública com confiança razoável:

```
private_status=UNKNOWN
eligibility=REVIEW_REQUIRED
eligibility_reason=PRIVATE_STATUS_UNCONFIRMED
```

**Nunca promovido para Pré-Work automático**, independentemente de quão forte for o sinal comercial. A confirmação de natureza privada é pré-requisito, não um detalhe a resolver depois.

## Dedupe

A skill pode indicar possível duplicação conceitual (`possible_duplicate_keys`, opcionalmente `possible_duplicate=true`), mas **não é responsável pelo dedupe operacional final** e **não usa suspeita de duplicação como motivo automático de `NOT_ELIGIBLE`**. A elegibilidade comercial do candidato não muda só por essa suspeita — o n8n/Data Tables é quem decide se descarta, atualiza ou mantém o candidato como está.

## Confidence

`confidence` reflete a força da evidência reunida (não o entusiasmo com a oportunidade) — quantas fontes independentes confirmam o `FACT`, quão recente e específica é a data, e quão direta é a confirmação de status privado. Uma hipótese comercial forte com evidência fraca tem `confidence` baixo, não alto.

## Relação com o n8n

Esta skill classifica; **não decide** o que acontece depois da classificação. O n8n usa `eligibility` para decidir se um candidato avança automaticamente, entra em fila de revisão humana, ou é descartado — essa lógica de roteamento/limite/agenda não pertence a esta skill (ver `SKILL.md` — "Separação de responsabilidades").
