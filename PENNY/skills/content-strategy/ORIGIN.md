# Proveniência — content-strategy

## Origem

- **Repositório**: `github.com/coreyhaines31/marketingskills`
- **Skill de origem**: `skills/content-strategy`
- **Comando de referência**: `npx skills add https://github.com/coreyhaines31/marketingskills --skill content-strategy`
- **Branch inspecionada**: `main`
- **Commit da branch `main` no momento da inspeção**: `5b2c0007766c6a1cf1d53fd8fc73e979e0821022` (mesmo commit já inspecionado nas adaptações de `marketing-psychology` e `marketing-loops`)
- **Versão declarada no frontmatter de origem**: `metadata.version: 2.1.1`
- **Licença do repositório de origem**: MIT (Copyright (c) 2025 Corey Haines) — permite uso, cópia, modificação e redistribuição com manutenção do aviso de copyright/licença.
- **Estrutura de origem inspecionada**: `SKILL.md` (439 linhas) + `references/content-distribution.md` (83 linhas) + `references/headless-cms.md` (194 linhas) + `evals/evals.json` (não migrado — ver abaixo).

## Decisão

**ACTION=ADAPT.** A fonte tem valor real e estruturado (pilares/clusters, disciplina de priorização, framework de distribuição ORB), mas é fortemente orientada a tráfego de busca de blog/produto SaaS (keyword research, backlinks, CMS headless) — não pode ser adotada como está (ADOPT) sem reescrever o núcleo para o contexto real de marca/relacionamento/educação da Penny, e o valor estrutural é grande demais para justificar rejeição (REJECT).

## O que foi preservado da metodologia original

- A ideia central de **pilares e clusters de tópicos** (3-5 pilares, cada um com subtemas desdobrados) — preservada como estrutura central de "Territórios editoriais e pilares".
- As quatro lentes para identificar um pilar (na fonte: product-led, audience-led, search-led, competitor-led) — preservadas e generalizadas em `references/content-prioritization.md` para "pela marca, pelo público, pela busca/demanda, pelo cenário competitivo", já que nem toda marca do ecossistema Penny vende um produto SaaS.
- O modelo de priorização por múltiplos fatores ponderados (na fonte: impacto no cliente 40%, fit produto-mercado 30%, potencial de busca 20%, recursos 10%) — preservado como estrutura em `references/content-prioritization.md`, mas sem pesos fixos por padrão (ver "O que foi reescrito").
- A lente **buscável vs. compartilhável** — preservada como lente complementar opcional, não como critério primário de priorização (ver "O que foi reescrito").
- Toda a seção "Criar uma vez, distribuir muitas" (Create Once, Distribute Twice), incluindo o framework **ORB** (Owned/Rented/Borrowed → Próprio/Alugado/Emprestado), o paradoxo da propriedade, meia-vida por canal, o volante de distribuição e o checklist de atomização — preservados quase literalmente em `references/content-distribution.md`, por serem conteúdo forte, agnóstico de setor e diretamente aplicável ao ecossistema Penny.
- A distinção entre conteúdo recorrente e campanha, e o alerta de que uma campanha comercial não deve atropelar a linha editorial — inspirada na disciplina de "tratar conteúdo como produto" da fonte, tornada explícita na adaptação.
- O princípio de nunca decidir por potencial de alcance isolado (a fonte já pondera "resource requirements" e "content-market fit" antes de puro volume de busca) — preservado e reforçado na seção "Critérios para dizer não".

## O que foi reescrito/adaptado (não copiado literalmente)

- Toda a prosa explicativa foi reescrita.
- O modelo primário foi reestruturado como **POSICIONAMENTO → PÚBLICO → OBJETIVOS → TERRITÓRIOS EDITORIAIS → PILARES → NARRATIVAS → FORMATOS/CANAIS → DISTRIBUIÇÃO → FEEDBACK → APRENDIZADO** (pedido explicitamente pela tarefa de adaptação) — a fonte não tem um fluxo de diagnóstico dessa forma; ela organiza o conteúdo por seções soltas (contexto → pilares → keyword research → ideação → priorização → calendário → execução → distribuição → output).
- O **calendário fixo 60% buscável / 30% compartilhável / 10% experimental** da fonte (pensado para tráfego de blog orientado a produto) foi **substituído** por um mix qualitativo de sete dimensões — educação, autoridade, relacionamento, prova, opinião, comunidade, demanda — mais compatível com marca/relacionamento/educação do que com tráfego de busca puro. A lente buscável/compartilhável da fonte foi mantida como complemento opcional, não como split obrigatório.
- Toda a seção de **keyword research por estágio do funil de compra** (awareness/consideration/decision/implementation com modificadores de busca tipo "melhor," "vs," "preço") não foi migrada como está — é específica a SEO de produto SaaS; o conceito de "mapear tema ao estágio da jornada" foi preservado de forma mais genérica dentro do modelo de dez etapas da adaptação (etapa "Narrativas" varia por estágio da jornada, sem depender de modificador de busca).
- As **fontes de ideação** da fonte (keyword exports de Ahrefs/SEMrush, pesquisa em Reddit/Quora/Hacker News, análise de conteúdo de concorrente via `site:concorrente.com/blog`) foram adaptadas em `references/content-prioritization.md` para fontes reais do ecossistema Penny: conversas/atendimento/CS, pesquisa de comunidade, cenário competitivo/mercado (sem prescrever ferramenta ou busca específica), e dados da própria marca dentro do Learning Loop.
- Adicionada explicitamente a seção "Territórios editoriais e critérios para dizer não" — a fonte não trata explicitamente de "o que a marca não deve cobrir"; isso foi pedido pela tarefa de adaptação e não existe de forma equivalente na fonte.
- Adicionada explicitamente a seção "Aquisição e retenção — o mesmo território, dois lados", incorporando "quem está fora quer entrar, quem está dentro não quer sair" — ausente na fonte.
- Adicionada explicitamente a seção "Aprendizado editorial (sem transformar um post em regra)", conectando ao Learning Loop real da Penny e ao loop de conteúdo já existente em `marketing-loops` — não existe equivalente na fonte, que não teoriza sobre governança de aprendizado.
- Adicionada explicitamente a seção "Guardrails de autoridade" (Capability ≠ Authority ≠ Identity; a skill não publica/gasta/envia por si própria) — ausente na fonte, que assume implicitamente que quem usa a skill tem autoridade de publicação irrestrita.
- A seção "Related Skills" da fonte (`copywriting`, `seo-audit`, `ai-seo`, `programmatic-seo`, `site-architecture`, `emails`, `social`, `launch` — skills daquele repositório externo) foi substituída por relação explícita com `marketing-psychology`, `ux-copy` e `marketing-loops`, já adaptadas neste mesmo ecossistema.

## O que não foi migrado

- `references/headless-cms.md` (194 linhas) — guia de seleção de CMS headless (Sanity, Contentful, Strapi) e modelagem de conteúdo para esses sistemas. Não migrado: é decisão de infraestrutura/ferramenta, e `SCOPE.md` deixa explícito que Penny não administra infraestrutura — decisão de qual CMS/sistema usar pertence ao RB ou a Rufino, não a uma skill de estratégia editorial da Penny.
- `evals/evals.json` da fonte — os cenários de homologação desta adaptação (ver relatório de entrega) foram desenhados especificamente para os 7 cenários pedidos na tarefa, cobrindo linha editorial vs. calendário, separação de público em educação, coerência sob campanha comercial, alcance vs. público certo, ideia viral desalinhada, aprendizado sem regra de post único, e marca não educacional — não os cenários genéricos de SEO/SaaS da fonte.
- A tabela de "Link-Earning Formats" (estatística de backlinks por formato, citando um estudo de vendor específico) — específica a SEO técnico de link building, sem aplicação direta ao contexto de marca/relacionamento/educação do ecossistema Penny.
- Nenhuma dependência, script ou código executável da fonte foi migrado — a skill de origem é puramente documento de instrução.

## Atribuição

Esta adaptação deriva de conteúdo originalmente publicado por Corey Haines em `coreyhaines31/marketingskills`, sob licença MIT. O aviso de copyright original é preservado aqui como registro de proveniência, conforme exigido pela licença, ainda que o texto desta adaptação tenha sido reescrito e o núcleo do modelo (calendário, fontes de ideação, keyword research) tenha sido substancialmente adaptado ao contexto real da Penny.
