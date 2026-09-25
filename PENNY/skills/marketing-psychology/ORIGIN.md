# Proveniência — marketing-psychology

## Origem

- **Repositório**: `github.com/coreyhaines31/marketingskills`
- **Skill de origem**: `skills/marketing-psychology`
- **Comando de referência**: `npx skills add https://github.com/coreyhaines31/marketingskills --skill marketing-psychology`
- **Branch inspecionada**: `main`
- **Commit da branch `main` no momento da inspeção**: `5b2c0007766c6a1cf1d53fd8fc73e979e0821022` (autoria/data do último commit tocando a skill: 2026-09-04)
- **Versão declarada no frontmatter de origem**: `metadata.version: 2.0.0`
- **Licença do repositório de origem**: MIT (Copyright (c) 2025 Corey Haines) — permite uso, cópia, modificação e redistribuição com manutenção do aviso de copyright/licença.

## O que foi preservado da metodologia original

- A estrutura central: princípios psicológicos organizados por categoria de uso, cada um com explicação do mecanismo + aplicação prática em marketing.
- O catálogo de checagem inicial de contexto de produto/marca antes de aplicar qualquer modelo (na origem: `product-marketing.md`; nesta adaptação: os documentos canônicos da Penny — `SOUL`/`POSITIONING`/`SCOPE`/`MEMORY` — e o contexto de marca da tarefa).
- A tabela de referência rápida por tipo de desafio (baixa conversão, objeção de preço, confiança, etc.).
- O princípio de nunca aplicar um modelo mecanicamente, e de sempre distinguir uso ético de uso manipulativo em táticas sensíveis (escassez, urgência).

## O que foi reescrito/adaptado (não copiado literalmente)

- Toda a prosa explicativa de cada princípio foi **reescrita** para este pacote — não é uma cópia do texto original, é uma adaptação com linguagem e exemplos próprios do ecossistema NAR.
- O catálogo foi reorganizado por **estágio de jornada** (aquisição, decisão/preço, experiência/retenção, comunicação) em vez da organização original por "categoria de mental model" — mais compatível com o vocabulário de jornada usado no ecossistema Penny/NAR.
- Adicionado explicitamente o princípio "quem está fora quer entrar, quem está dentro não quer sair" como eixo de conexão entre aquisição e retenção — isso não existe na fonte original.
- Adicionada seção de guardrails éticos própria (`references/ethics-guardrails.md`), mais explícita e mais restritiva que a menção pontual de "usar com ética" da fonte original.
- Removidos exemplos e referências específicos de produto SaaS genérico da fonte original que não se aplicam ao contexto real de marcas do ecossistema (GENNERA, EDUINFO, NAR ECO) — substituídos por orientação de como adaptar por marca, em vez de exemplos fixos de um setor que não é o nosso.
- A seção "Related Skills" da origem (que referencia skills daquele repositório externo — `cro`, `copywriting`, `popups`, `pricing`, `ab-testing`) foi substituída por uma nota genérica de relação com skills de execução do próprio ecossistema Penny, sem assumir que essas skills externas existem aqui.

## O que não foi migrado

- O arquivo `evals/evals.json` da origem não foi copiado — os cenários de homologação desta adaptação (ver relatório de entrega) foram desenhados especificamente para o contexto Penny/NAR, cobrindo os cinco cenários pedidos na tarefa de adaptação, não os cenários genéricos de SaaS da fonte.
- Nenhuma dependência, script ou código executável da fonte foi migrado — a skill de origem é puramente um documento de instrução (`SKILL.md` + `evals.json`), sem dependência de execução externa.

## Atribuição

Esta adaptação deriva de conteúdo originalmente publicado por Corey Haines em `coreyhaines31/marketingskills`, sob licença MIT. O aviso de copyright original é preservado aqui como registro de proveniência, conforme exigido pela licença, ainda que o texto desta adaptação tenha sido reescrito.
