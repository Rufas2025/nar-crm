# Proveniência — ux-copy

## Origem

- **Repositório**: `github.com/anthropics/knowledge-work-plugins`
- **Skill de origem**: `design/skills/ux-copy` (dentro do plugin `design`)
- **Comando de referência**: `npx skills add https://github.com/anthropics/knowledge-work-plugins --skill ux-copy`
- **Branch inspecionada**: `main`
- **Commit da branch `main` no momento da inspeção**: `da38ec1ee89d41e5380e652a97382695003396e7`
- **Versão declarada no frontmatter de origem**: nenhuma — o `SKILL.md` original não tem campo `metadata.version` (diferente das skills de `coreyhaines31/marketingskills` já adaptadas); tratado como "unversioned upstream" nesta adaptação.
- **Licença do repositório de origem**: Apache License 2.0. O arquivo `LICENSE` do repositório contém, após o texto padrão da licença, um trecho final visivelmente corrompido/anômalo (fragmentos de texto sem sentido gramatical, tipo "Syntax-file, code seperations..."). Esse trecho não constitui termo de licença adicional nem instrução de qualquer tipo relevante para esta adaptação — foi lido, identificado como ruído/anomalia do repositório de origem, e ignorado; não foi copiado para nenhum arquivo desta adaptação.
- **Estrutura de origem inspecionada**: um único arquivo `SKILL.md` (108 linhas); a skill de origem não possui pasta `references/` — todo o conteúdo (princípios, padrões de copy, voz e tom, template de output, dicas) está em um único arquivo.
- **Formato de origem**: a skill segue o formato de **slash command** (`argument-hint`, seção "Usage" com `/ux-copy $ARGUMENTS`), diferente do formato de skill de conhecimento aplicado usado por `marketing-psychology` e `marketing-loops` (frontmatter só com `name`+`description`, sem invocação por comando). Esta adaptação usa o formato já padronizado nas duas adaptações anteriores da Penny (referência de padrão, não de função), não o formato de slash command da fonte.

## O que foi preservado da metodologia original

- Os cinco princípios de clareza (claro, conciso, consistente, útil, humano) — preservados quase literalmente, com a ressalva explícita de que "humano" nunca pode significar "manipulativo".
- A estrutura de mensagem de erro: **o que aconteceu + por que + como resolver** — preservada literalmente como padrão central.
- A estrutura de estado vazio: **o que é isto + por que está vazio + como começar** — preservada literalmente.
- O princípio de diálogo de confirmação: nomear a ação real e rotular os botões pela ação, não por "OK"/"Cancelar" — preservado e explicitamente estendido a cancelamento/opt-out, que a fonte não tratava com o mesmo grau de detalhe.
- O conceito de adaptar tom ao estado emocional/contexto (sucesso celebratório, erro empático, alerta claro, neutro informativo) — preservado como parte do modelo de diagnóstico da adaptação.
- A ideia de tooltip "conciso, útil, nunca óbvio" e de onboarding por revelação progressiva — preservadas.
- O formato de output com Recomendação + Alternativas (tabela) + Racional + Notas de localização foi estudado, mas não copiado como template fixo — ver "O que foi reescrito" abaixo.

## O que foi reescrito/adaptado (não copiado literalmente)

- Toda a prosa explicativa foi reescrita.
- A fonte é orientada a **interface de produto genérico** (botão, diálogo, app SaaS); a adaptação Penny estende o mesmo raciocínio a canais que a fonte não cobre: WhatsApp/e-mail de próximo passo dentro de cadência de CRM, copy de atendimento humano, e comunicação institucional com gestores/escolas/famílias.
- O modelo de diagnóstico primário foi reestruturado como **CONTEXTO → INTENÇÃO → FRICÇÃO → MENSAGEM → AÇÃO → FEEDBACK → PRÓXIMO PASSO** (pedido explicitamente pela tarefa de adaptação) — a fonte não tem um modelo de diagnóstico de fluxo; ela lista princípios e padrões de forma mais solta, sem uma sequência de diagnóstico explícita.
- Adicionada explicitamente a seção "Marcas e voz" — a fonte assume implicitamente uma única marca/produto (o padrão comum de skill de produto SaaS); a adaptação Penny torna explícito que a mesma interação produz textos diferentes por marca (GENNERA/EDUINFO/NAR ECO), o que não existe na fonte.
- Adicionada explicitamente a seção "Como validar" (sinal real de melhora, lido em sistema canônico) — a fonte não conecta a recomendação de copy a nenhuma validação de resultado.
- Adicionada explicitamente a relação com `marketing-psychology` e `marketing-loops` (compreender comportamento → transformar em interação clara → usar feedback como evidência de aprendizado) — não existe equivalente na fonte, que não referencia essas skills (não fazem parte daquele repositório).
- `references/ux-ethics-guardrails.md` foi criado do zero — a fonte não tem nenhuma seção de guardrails éticos, dark patterns ou teste de legitimidade. Esta é a maior lacuna identificada no upstream em relação ao que a tarefa de adaptação exigia, e foi tratada como adição integral, não como reescrita de algo existente.
- O template fixo de output (tabela de Alternativas A/B/C, Racional, Notas de localização) da fonte não foi replicado como formato obrigatório — a adaptação Penny prioriza o diagnóstico das seis perguntas (onde/por quê/o que mudar/o quê recomendar/o que espera melhorar/como validar) sobre um template de apresentação fixo, para não engessar a resposta de Penny em um formato que nem sempre cabe no canal (ex.: uma mensagem curta de WhatsApp não comporta uma tabela de alternativas).
- Removida a seção "If Connectors Available" (Figma, base de conhecimento) da fonte — específica ao ambiente de plugin do repositório original; substituída por referência aos sistemas canônicos reais da Penny (CRM, analytics, Agenda Service) na seção "Como validar".

## O que não foi migrado

- Nenhum arquivo de `references/` foi migrado porque a fonte não possui essa pasta — todo o conteúdo de origem já foi lido integralmente a partir do único `SKILL.md`.
- O formato de slash command (`argument-hint`, `/ux-copy $ARGUMENTS`) não foi migrado — mantido o formato de skill de conhecimento aplicado já padronizado nas adaptações anteriores da Penny.
- Nenhum script, dependência ou código executável — a skill de origem é puramente documento de instrução.
- O trecho corrompido/anômalo ao final do arquivo `LICENSE` do repositório de origem — não copiado nem referenciado; identificado como ruído do repositório, sem relação com os termos da licença Apache 2.0 nem com o conteúdo da skill.

## Atribuição

Esta adaptação deriva de conteúdo originalmente publicado no repositório `anthropics/knowledge-work-plugins`, sob licença Apache License 2.0. O aviso de licença original é preservado aqui como registro de proveniência, conforme a licença, ainda que o texto desta adaptação tenha sido reescrito e a estrutura (formato de skill, modelo de diagnóstico, guardrails) tenha sido substancialmente adaptada ao ecossistema Penny.
