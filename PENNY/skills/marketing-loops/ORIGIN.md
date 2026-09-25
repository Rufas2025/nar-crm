# Proveniência — marketing-loops

## Origem

- **Repositório**: `github.com/coreyhaines31/marketingskills`
- **Skill de origem**: `skills/marketing-loops`
- **Comando de referência**: `npx skills add https://github.com/coreyhaines31/marketingskills --skill marketing-loops`
- **Branch inspecionada**: `main`
- **Commit da branch `main` no momento da inspeção**: `5b2c0007766c6a1cf1d53fd8fc73e979e0821022` (mesmo commit inspecionado na adaptação de `marketing-psychology`)
- **Versão declarada no frontmatter de origem**: `metadata.version: 1.2.0`
- **Licença do repositório de origem**: MIT (Copyright (c) 2025 Corey Haines) — permite uso, cópia, modificação e redistribuição com manutenção do aviso de copyright/licença.
- **Estrutura de origem inspecionada**: `SKILL.md` + `references/loop-catalog.md` (43 loops, ~690 linhas), `references/loop-guardrails.md`, `references/loop-orchestration.md`, `references/loop-state.md`, `references/loop-template.md`, e `evals/` (não migrado — ver abaixo).

## O que foi preservado da metodologia original

- A distinção entre **check cadence** (com que frequência o loop *verifica*) e **acts when** (a condição real de *ação*) — preservada como o par "Trigger" + "Acts when" na anatomia da adaptação Penny.
- As nove partes originais da anatomia de um loop (cadência, condição de ação, propósito, skills usadas, corpo do loop, autoverificação, estado/idempotência, parada, output) — mapeadas nas onze partes da adaptação Penny, que acrescentam explicitamente marca/estágio de jornada e owner/checkpoint humano.
- A regra de cadência: "a frequência deve casar com a velocidade real do sinal, não com o desejo de atualização constante" — preservada quase literalmente.
- O modelo de duas camadas de ação (Tier 1 autônomo-seguro vs. Tier 2 com checkpoint humano por padrão) — preservado como núcleo de `references/loop-guardrails.md`, remapeado explicitamente sobre os "Níveis de autonomia" reais de `SCOPE.md` em vez de ser um sistema de autoridade paralelo.
- Os padrões de estado/idempotência (cursor/watermark, conjunto de deduplicação, janelas de cooldown, itens em andamento) — preservados quase literalmente em `references/loop-guardrails.md`, seção "Estado e idempotência".
- O princípio "a maioria das execuções de um loop saudável deve ser 'verifiquei, nada a fazer'" e o conceito de "loop de vaidade" (que nunca age e ninguém sente falta, ou age toda vez e está reagindo a ruído) — preservados no catálogo e no guardrails.
- A lista de sempre-escalar (menção de crise, conta estratégica, anomalia de receita/gasto, ação que afeta muita gente de uma vez) — preservada e adaptada ao vocabulário da Penny (ex.: "conta institucional/escola estratégica" em vez de "enterprise account").
- O conceito de kill switch documentado e checklist pré-agendamento — preservados quase literalmente.

## O que foi reescrito/adaptado (não copiado literalmente)

- Toda a prosa explicativa foi reescrita — não é cópia do texto original.
- O catálogo de 43 loops genéricos de SaaS/growth (SEO, ads, ranking, ativação de produto, dunning, etc.) foi **substituído** por um catálogo menor e específico aos domínios reais da Penny: LinkedIn/conteúdo, qualificação de leads/CRM, cadência de acompanhamento, sinais de experiência/retenção, referral, e aprendizado pós-campanha — a maior parte do catálogo de origem (SEO técnico, anúncios pagos em escala, métricas de produto SaaS) não se aplica ao contexto real das marcas do ecossistema (GENNERA, EDUINFO, NAR ECO) e foi deliberadamente deixada de fora em vez de forçada.
- O "modelo TRIGGER → ACTION → STATE → FEEDBACK → MEASUREMENT → LEARNING → NEXT ACTION / STOP" pedido explicitamente para esta adaptação não existe como tal na fonte (que usa as nove partes de anatomia); a adaptação Penny usa esse fluxo como estrutura primária e mapeia as partes originais dentro dele.
- Adicionada explicitamente a seção "Loop e o Learning Loop da Penny" — não existe equivalente na fonte; conecta loops de marketing ao ciclo real `DETECT → UNDERSTAND → VERIFY → CLASSIFY → LEARN → INCORPORATE → TEST → MEASURE → RETAIN/REVISE` de `LEARNING_LOOP.md`, deixando claro que um loop gera evidência, não governança.
- Adicionada explicitamente a distinção **LOOP ≠ CAMPANHA ≠ CADÊNCIA ≠ AUTOMAÇÃO ≠ WORKFLOW** — pedida pela tarefa de adaptação, não presente na fonte nesses termos.
- Adicionado o princípio "quem está fora quer entrar, quem está dentro não quer sair" como eixo de conexão entre loops de aquisição e de retenção/referral — ausente na fonte original.
- Reescrita a seção de autoridade para deixar explícito **Capability ≠ Authority ≠ Identity** e remapear o modelo de duas camadas sobre os "Níveis de autonomia" reais de `SCOPE.md`, em vez de tratá-lo como um sistema de permissão autocontido como na fonte.
- Removidos: `references/loop-orchestration.md` (guia de como compor múltiplos loops de um "sistema operacional de marketing" inteiro — prematuro para esta adaptação inicial) e `references/loop-template.md` (template genérico de autoria de novo loop) — ver "O que não foi migrado".
- A seção "Related Skills" da origem (referenciando `marketing-ideas`, `ab-testing`, `analytics`, `ads`, `seo-audit`, `emails`, `social`, `churn-prevention`, `pricing`, `referrals` — skills daquele repositório externo) foi substituída por referência apenas a `marketing-psychology`, já adaptada neste mesmo ecossistema, sem assumir que as demais skills externas existem aqui.

## O que não foi migrado

- `evals/` da fonte — os cenários de homologação desta adaptação (ver relatório de entrega) foram desenhados especificamente para os 6 cenários pedidos na tarefa, não os cenários genéricos de SaaS da fonte.
- `references/loop-orchestration.md` — trata de como sequenciar a adoção de múltiplos loops ("comece com 1, não construa 43 de uma vez"); o princípio central ("não criar loops demais de uma vez") já está preservado no `SKILL.md` da adaptação (seção implícita nos guardrails); o arquivo completo não foi migrado porque orquestrar múltiplos loops simultâneos não é uma necessidade atual documentada no Scope da Penny — pode ser adicionado depois, sob demanda real, sem exigir V2 desta skill.
- `references/loop-template.md` — template de autoria de novo loop do zero; não migrado nesta primeira adaptação porque o catálogo próprio já cobre os domínios atuais da Penny; se um domínio novo exigir um loop fora do catálogo, a estrutura de onze partes do `SKILL.md` já é suficiente para autorá-lo sem um template adicional.
- Nenhuma dependência, script ou código executável da fonte foi migrado — a skill de origem é puramente documento de instrução, sem dependência de execução externa.

## Atribuição

Esta adaptação deriva de conteúdo originalmente publicado por Corey Haines em `coreyhaines31/marketingskills`, sob licença MIT. O aviso de copyright original é preservado aqui como registro de proveniência, conforme exigido pela licença, ainda que o texto desta adaptação tenha sido reescrito.
