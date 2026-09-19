---
name: educational-opportunity-discovery-brazil
description: "Use quando houver missão explícita de descoberta de oportunidades comerciais em instituições privadas de ensino no Brasil a partir de sinais públicos (obra, reforma, expansão, nova unidade, investimento em infraestrutura, retrofit, aquisição). Produz candidatos estruturados classificados como ELIGIBLE/REVIEW_REQUIRED/NOT_ELIGIBLE para encaminhamento a prework-educacional-account-intelligence. NÃO executa Pré-Work completo, NÃO faz stakeholder/contact enrichment profundo (isso é prework-educacional-account-intelligence), NÃO controla cron/agenda/limite diário/retry/fila/watermark/persistência/dedupe operacional/Google Sheets/CRM (isso é n8n)."
---

# educational-opportunity-discovery-brazil

Maturidade atual: **M0** (draft — nunca executada; ver critério de classificação no final).

## Missão

Encontrar, validar e priorizar instituições privadas de ensino no Brasil que apresentem sinais comerciais concretos e recentes capazes de justificar Pré-Work posterior. Esta skill **não executa o Pré-Work completo** — ela produz candidatos qualificados para serem encaminhados a `prework-educacional-account-intelligence`.

## Separação de responsabilidades

Esta skill **não controla**: cron; agenda (ex.: 04:00, segunda a sexta); limite diário (ex.: 10/dia); retry; fila; watermark; persistência; Data Tables; dedupe operacional; Google Sheets; CRM. Essas responsabilidades pertencem ao **n8n**. A skill apenas recebe uma missão de descoberta e retorna candidatos estruturados — o valor "10 por dia" e qualquer agendamento nunca são definidos dentro dela.

Esta skill também **não faz** stakeholder mapping profundo, contact enrichment (LinkedIn, e-mail, telefone/WhatsApp) ou qualquer inteligência de conta detalhada — isso é integralmente de `prework-educacional-account-intelligence`. Nomes encontrados incidentalmente durante a descoberta podem ser registrados como contexto bruto, nunca como um mapa de stakeholder processado.

## Escopo

Pesquisar instituições privadas de ensino no Brasil com sinais como: construção; obra; reforma; ampliação; expansão; nova unidade; novo campus; modernização; retrofit; aquisição ou incorporação relevante; investimento em infraestrutura; laboratório novo; complexo esportivo; expansão tecnológica; mudança física/estrutural relevante; crescimento operacional com impacto potencial em soluções educacionais.

## Private only

Antes de considerar uma oportunidade elegível: validar se a instituição é privada; identificar mantenedora quando possível; diferenciar escola/grupo/rede/unidade; evitar homônimos. Instituições públicas nunca são consideradas. Se o status privado/público não puder ser confirmado: `private_status = UNKNOWN`, `eligibility = REVIEW_REQUIRED`, `eligibility_reason = PRIVATE_STATUS_UNCONFIRMED` — e o candidato **não** é promovido para Pré-Work automático. `UNKNOWN` nunca é um valor de `eligibility` — a taxonomia final de `eligibility` é somente `ELIGIBLE`/`REVIEW_REQUIRED`/`NOT_ELIGIBLE` (ver `references/qualification-rules.md`).

## Sinal comercial — fato, leitura e hipótese

Para cada candidato, produzir três campos distintos, nunca fundidos:

- **FACT** — informação comprovada pela fonte (o que a fonte de fato diz/mostra).
- **READING** — interpretação do que o fato pode representar.
- **COMMERCIAL_HYPOTHESIS** — hipótese comercial ainda não validada.

Nunca declarar obra, expansão ou investimento apenas por inferência visual ou linguagem vaga — se a fonte não afirma o fato claramente, ele não é `FACT`, é no máximo `READING` ou `COMMERCIAL_HYPOTHESIS` explicitamente rotulado como tal.

## Recência

Priorizar sinais recentes e comercialmente acionáveis. Registrar `signal_date`, `publication_date`, `source_date` quando disponíveis. Nunca inventar data quando a fonte não a fornece — o campo fica vazio, não estimado.

## Pesquisa

Fontes públicas legítimas: site institucional; Instagram; LinkedIn; imprensa local; portais educacionais; notícias; mantenedora/rede; fornecedores/parceiros; anúncios públicos da própria instituição; fontes profissionais legítimas. **Ausência de evidência nunca vira evidência negativa** — não encontrar um sinal não prova que ele não existe, só que não foi encontrado.

## Dedup semântico (indicativo, não operacional)

A skill pode **indicar** possível duplicação conceitual usando CNPJ, INEP, nome da instituição, unidade, cidade/UF, canonical URL, ou o sinal identificado — mas **não é responsável pelo dedupe operacional final**. O n8n é a fonte de verdade para dedupe e persistência; esta skill só sinaliza `possible_duplicate_keys` (e opcionalmente `possible_duplicate=true`) como pista. **Suspeita de duplicação nunca é, por si só, motivo para `NOT_ELIGIBLE`** — a elegibilidade comercial não é alterada só por essa suspeita; o n8n decide se descarta, atualiza ou continua o candidato.

## Qualificação

- **ELIGIBLE** = instituição privada confirmada + sinal comercial relevante + evidência pública suficiente.
- **REVIEW_REQUIRED** = instituição provavelmente privada ou sinal promissor, mas falta confirmação crítica.
- **NOT_ELIGIBLE** = pública, sinal irrelevante, sinal antigo sem valor comercial, duplicação evidente, ou ausência de evidência.

Nunca executar Pré-Work completo em candidato `NOT_ELIGIBLE`. Ver `references/qualification-rules.md` para o detalhe de cada critério.

## Saída por candidato

```
institution_name=
official_name=
private_status=
maintainer=
cnpj=
inep=
city=
state=
website=
instagram=
linkedin=
signal_type=
signal_summary=
fact=
reading=
commercial_hypothesis=
signal_date=
publication_date=
source_url=
canonical_source_url=
additional_sources=
confidence=
eligibility=
eligibility_reason=
possible_duplicate_keys=
discovery_origin=
discovered_at=
```

`discovery_origin` aceita um valor como `Pesquisa_diaria_Eduinfo`, mas o valor final é fornecido pelo workflow (n8n) que invoca a skill — nunca hardcoded dentro dela. `discovered_at` segue a mesma lógica: é fornecido pelo workflow/n8n — a skill não inventa nem estima esse timestamp operacional.

## Governança

- **Owner**: NAR ECO / Anderson Rufino
- **Version**: 0.1.0
- **Maturity**: M0
- **Last reviewed**: 2026-09-19

**Allowed tools**: pesquisa em fontes públicas (web, redes sociais profissionais, portais de notícia/educação); leitura de site institucional; consulta a identificadores públicos (CNPJ/INEP) quando disponíveis via fonte pública.

**Prohibited tools**: terminal; filesystem admin; n8n admin; EasyPanel; Docker; envio de e-mail; WhatsApp; alteração em CRM; escrita em Google Sheets; outbound automático; qualquer compromisso comercial em nome da NAR.

**Entry conditions**: missão explícita de descoberta de oportunidades em instituições privadas de ensino no Brasil.

**Exit conditions**: candidatos estruturados classificados como `ELIGIBLE`/`REVIEW_REQUIRED`/`NOT_ELIGIBLE`, com evidência e fonte suficientes para o n8n decidir se encaminha ao Pré-Work.

**Abort/escalation conditions**: fonte indisponível; identidade institucional ambígua; status privado não validável; sinal comercial sem evidência; necessidade de ação externa; necessidade de terminal/admin.

## Output executivo

Para cada candidato elegível:

```
INSTITUTION=
CITY_UF=
PRIVATE_STATUS=
SIGNAL_TYPE=
SIGNAL_DATE=
FACT=
READING=
COMMERCIAL_HYPOTHESIS=
SOURCE=
CONFIDENCE=
ELIGIBILITY=
```

No final da missão de descoberta:

```
DISCOVERED=
ELIGIBLE=
REVIEW_REQUIRED=
NOT_ELIGIBLE=
```

O limite de instituições por execução (ex.: "10/dia") não é definido dentro desta skill — pertence ao n8n.

## Referências

- `references/discovery-method.md` — como conduzir a busca por sinal público sem transformar ausência de evidência em conclusão negativa.
- `references/qualification-rules.md` — detalhe de cada critério de `ELIGIBLE`/`REVIEW_REQUIRED`/`NOT_ELIGIBLE`, incluindo o caso `private_status=UNKNOWN → eligibility=REVIEW_REQUIRED`.

## Critério de classificação de maturidade (M0–M5)

Cumulativo — cada nível exige o anterior cumprido, mais o incremento:

- **M0** — definição existe, nunca executada com missão de descoberta real.
- **M1** — pelo menos uma execução real produziu candidatos corretamente classificados, com `FACT`/`READING`/`COMMERCIAL_HYPOTHESIS` distintos e sem data inventada.
- **M2** — sucesso repetido em instituições de perfis/regiões diferentes, sem promover `NOT_ELIGIBLE` para Pré-Work.
- **M3** — integração real com o n8n validada (a skill recebe missão e devolve candidatos no formato exato que o workflow espera, sem a skill assumir responsabilidade de fila/dedupe/persistência).
- **M4** — uso repetido sem candidato público classificado como privado, sem hipótese comercial apresentada como fato.
- **M5** — uso prolongado, promoção humana explícita.

Esta skill está em **M0**. Não atribuir M4/M5 sem a evidência correspondente — nenhuma delas existe ainda.
