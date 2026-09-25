# Proveniência — creative-direction

## Origem

- **Repositório**: `github.com/rampstackco/claude-skills`
- **Skill de origem**: `skills/creative-direction`
- **Comando de referência**: `npx skills add https://github.com/rampstackco/claude-skills --skill creative-direction`
- **Branch inspecionada**: `main`
- **Commit da branch `main` no momento da inspeção**: `3d4510a94a76ead80122c691b5c480f92f3fbe40`
- **Versão declarada no frontmatter de origem**: nenhuma — o `SKILL.md` original não tem campo `metadata.version` (mesma situação de `ux-copy`); tratado como "unversioned upstream" nesta adaptação.
- **Licença do repositório de origem**: MIT License, Copyright (c) 2026 RampStack Co. — verificada integralmente, sem trecho anômalo (diferente do caso de `knowledge-work-plugins` já registrado em `ux-copy/ORIGIN.md`).
- **Estrutura de origem inspecionada**: `SKILL.md` (153 linhas) + `references/axes-explained.md` (235 linhas) + `references/brief-template.md` (74 linhas) + `references/example-aesthetic-brief.md` (83 linhas). Também inspecionada a lista completa de skills do repositório (mais de 200 skills, incluindo `creative-brief`, `art-direction`, `brand-discovery`, `content-and-copy` — não solicitadas nesta tarefa, não inspecionadas em detalhe).

## Auditoria de segurança, dependências e scripts

Nenhum script, dependência ou código executável na skill de origem — puramente documento de instrução em Markdown. Nenhum secret, credencial ou dado sensível encontrado. Repositório clonado via `git clone --depth 1` (shallow clone), sem execução de nenhum código do repositório.

## Decisão

**ACTION=ADAPT**, com uma ressalva importante registrada aqui com transparência: a skill de origem chamada `creative-direction` naquele repositório é **mais estreita** do que o escopo pedido nesta tarefa. Ela é explicitamente descrita, no próprio frontmatter e na seção "When NOT to use" da fonte, como "a camada de profundidade estética, distinta de `creative-brief` (kickoff operacional) e de `art-direction` (briefing de peça específica)" — ou seja, na organização daquele repositório, a fonte cobre **apenas** os quatro eixos de direção verbal/visual (tom, filosofia estética, relação com o público, ambição sensorial) e a disciplina de manter um brief de referência. Ela não cobre, na fonte, problema criativo, insight, conceito, mensagem central, avaliação de ideia (estratégia/diferenciação/clareza/memorabilidade/desdobramento) nem sistema de peças multi-canal — que são exatamente o núcleo do que a tarefa de adaptação pediu.

Diante disso, a decisão foi ADAPT (não ADOPT puro, nem REJECT): os quatro eixos e a disciplina de brief/rejeição da fonte são genuinamente fortes e foram preservados como o componente "Direção verbal e visual" dentro de um modelo bem mais amplo — construído para esta adaptação — que cobre o funil completo pedido (contexto→objetivo→público→insight→conceito→mensagem→direção→sistema de peças→canais→critérios de avaliação). A skill de origem `creative-brief` daquele mesmo repositório não foi lida em detalhe nem usada como fonte nesta adaptação — o que cobre parte da lacuna de "briefing operacional" nesta adaptação Penny foi escrito do zero, não migrado de lá.

## O que foi preservado da metodologia original

- Os **quatro eixos direcionais** (registro de tom, filosofia estética, relação com o público, ambição sensorial), suas posições e a lógica de "como escolher" — preservados como núcleo de `references/direction-axes.md`, com prosa reescrita e exemplos de marca trocados por raciocínio genérico (ver "O que foi reescrito").
- O princípio de que **cada eixo é um espectro, não uma escolha binária**, e que a posição escolhida é "centro de gravidade, não cerca" — preservado literalmente.
- A prática de **sinalizar tensões** entre combinações difíceis de executar (ex.: Funcional + Provocador) antes de seguir, em vez de descobrir o problema na produção — preservada e ampliada com um exemplo específico ao contexto Penny (ressonância emocional forçada sem substância real).
- A estrutura de **lista de rejeição** ("o que este brief diz não") como uma das seções mais úteis de um brief — preservada em `references/creative-brief-template.md`.
- O padrão de falha "**brief drift**" (o brief é escrito e depois ignorado; a disciplina certa é toda peça posterior checar contra o brief) e "**brief que ninguém referencia é decoração**" — preservados como princípio de uso do brief completo.
- A ideia de que a direção **não substitui quem de fato desenha/escreve a peça** — ela dá um ponto de referência comum para decisões pequenas — preservada e reforçada explicitamente (a fonte já deixava isso implícito ao separar esta skill de `art-direction`; a adaptação Penny torna isso uma regra explícita de guardrail).

## O que foi reescrito/adaptado (não copiado literalmente)

- Toda a prosa explicativa foi reescrita.
- Os exemplos de marca de referência da fonte (Stripe, The Economist, Linear, Vercel, Notion, Slack, Patagonia, Liquid Death, Oatly, Apple) foram **removidos** — são referências de mercado internacional/SaaS sem relação com o contexto real de GENNERA/EDUINFO/NAR ECO, e a adaptação instrui explicitamente a nunca transplantar exemplo/estética de marca externa, preservando o mesmo princípio que a tarefa pediu para as marcas do ecossistema entre si.
- Construído **do zero** (ausente na fonte, que trata só de direção estética): o modelo completo de dez etapas CONTEXTO→OBJETIVO→PÚBLICO→INSIGHT→CONCEITO CRIATIVO→MENSAGEM CENTRAL→DIREÇÃO VERBAL/VISUAL→SISTEMA DE PEÇAS→CANAIS→CRITÉRIOS DE AVALIAÇÃO; a etapa de confrontar briefing incompleto antes de aceitar; a busca por insight e conceito criativo central; `references/creative-evaluation.md` com os cinco critérios (estratégia, diferenciação, clareza, memorabilidade, capacidade de desdobramento) e os sinais de alerta (cópia de concorrente, clichê, trend chasing sem fit, estética acima da estratégia); a seção "Sistema de peças, não peça única"; a conexão com o princípio "quem está fora quer entrar, quem está dentro não quer sair"; e toda a seção de guardrails de autoridade (Capability≠Authority≠Identity, proibição de publicar/gastar/enviar/contratar/alterar identidade estrutural).
- O template de brief (`references/creative-brief-template.md`) foi expandido do formato de 6 seções da fonte (header, quatro eixos, síntese, referências, lista de rejeição, questões abertas) para os doze campos pedidos pela tarefa (PROBLEMA/OBJETIVO/PÚBLICO/INSIGHT/PROMESSA/CONCEITO/TOM/DIREÇÃO VISUAL/MANDATÓRIOS/CANAIS/O QUE EVITAR/CRITÉRIOS DE SUCESSO) — a lista de rejeição e a disciplina de "atualizar só quando a direção genuinamente muda" da fonte foram preservadas dentro desse template maior.
- Adicionada explicitamente a instrução de **não transformar o brief completo em burocracia obrigatória para toda tarefa pequena** — a fonte assume implicitamente um projeto de porte suficiente para justificar o brief; a adaptação Penny torna essa condição explícita, dado que a tarefa pediu isso nominalmente.
- `references/example-aesthetic-brief.md` da fonte (um brief completo de exemplo para um projeto fictício de mercado internacional) não foi migrado como está — seu papel de "calibrar o olho" foi absorvido pelos próprios exemplos e sinais de alerta escritos em `references/direction-axes.md` e `references/creative-evaluation.md`, já no vocabulário e contexto do ecossistema Penny.

## O que não foi migrado

- `references/example-aesthetic-brief.md` (83 linhas) — brief de exemplo de um projeto fictício não relacionado ao ecossistema Penny; não migrado como arquivo próprio para não introduzir um exemplo de marca/mercado externo sem relação com GENNERA/EDUINFO/NAR ECO (ver "O que foi reescrito").
- Os assets de imagem do repositório (`assets/showcase/creative-direction-highlight-*.jpg`) — material de vitrine do próprio repositório de origem, sem relação com o conteúdo da skill.
- As demais ~200 skills do repositório `rampstackco/claude-skills` (incluindo `creative-brief`, `art-direction`, `brand-discovery`) — fora do escopo desta tarefa, não inspecionadas em detalhe, não migradas.
- Nenhum script, dependência ou código executável — a skill de origem é puramente documento de instrução.

## Atribuição

Esta adaptação deriva de conteúdo originalmente publicado no repositório `rampstackco/claude-skills`, sob licença MIT, Copyright (c) 2026 RampStack Co. O aviso de licença original é preservado aqui como registro de proveniência, conforme exigido pela licença, ainda que o texto desta adaptação tenha sido reescrito e a maior parte do modelo (problema, insight, conceito, avaliação de ideia, sistema de peças, guardrails de autoridade) tenha sido construída para esta adaptação, além do escopo da skill de origem.
