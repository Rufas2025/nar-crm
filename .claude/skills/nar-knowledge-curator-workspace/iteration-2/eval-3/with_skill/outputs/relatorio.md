DOCUMENTO
`00_Indice_Mestre_da_Base_de_Conhecimento` — pasta atual `00_Governanca_e_Arquitetura`

PROPÓSITO ATUAL
Mapa da base de conhecimento do ecossistema NAR ECO: lista as pastas existentes, o dono de cada uma, o conteúdo esperado e a convenção de nomes. Documento explicitamente declara que não carrega conteúdo de marca, regra comercial nem instrução operacional.

DIAGNÓSTICO
- Escopo, dono e camada estão corretos: índice mestre é conhecimento genuinamente global (consta explicitamente em `references/ecossistema.md` como um dos itens que permanecem globais).
- A separação orquestrador/marcas/Agenda está respeitada: NAR ECO tratado como orquestrador (não como marca), Agenda listada como subagente transversal e não como marca — consistente com a topologia do ecossistema.
- "Eco Clear" grafado corretamente em duas palavras.
- Nenhum conteúdo comercial, de produto ou operacional vazou para dentro do índice — ele se limita a nomes de pasta, dono e descrição de uma linha, exatamente o nível de detalhe que um mapa deve ter.
- Convenção de nomes descrita no próprio documento (prefixo numérico de dois dígitos, `snake_case`, sem versionamento por sufixo, arquivamento em `99_Archive`) está alinhada com `references/nomenclatura.md`.
- Ponto de atenção (não bloqueante): a numeração das pastas de marca é sequencial e sem espaçamento (`01` a `05`, seguido de `06_Agenda`, depois `99_Archive`). `references/nomenclatura.md` recomenda deixar espaço entre números quando a lista tende a crescer no meio, justamente para não obrigar renumeração e não quebrar referências. Se uma sexta marca for incorporada ao ecossistema no futuro, a estrutura atual exigiria renumerar `06_Agenda` (ou inserir fora de ordem), o que quebraria links e referências existentes.
- Seção "Manutenção" define responsável (governança NAR ECO) e gatilho de atualização (criação, renomeação ou troca de dono de pasta) — presente e claro, sem necessidade de ajuste.
- Não há conteúdo desatualizado, duplicado ou conflitante identificável dentro deste documento; ele é curto e cumpre uma única função.

DECISÃO
KEEP, com uma recomendação pontual de nomenclatura (não uma reestruturação).

O documento está no dono certo, na camada certa (REFERENCE/global, não SYSTEM nem RAG de marca) e sem mistura de escopo. Não há problema arquitetural que justifique MOVE, SPLIT, MERGE ou REWRITE.

OWNER ALVO
NAR ECO (orquestrador) — governança. Sem mudança.

LOCALIZAÇÃO ALVO
`00_Governanca_e_Arquitetura/00_Indice_Mestre_da_Base_de_Conhecimento` — sem mudança.

TIPO DE CONHECIMENTO
REFERENCE (documentação de arquitetura para humanos e para orientação de curadoria). Não é SYSTEM nem RAG de resposta a cliente.

SYSTEM: NÃO
Não é necessário para o orquestrador decidir roteamento em tempo real; é material de governança/manutenção da base, consultado por quem cura a arquitetura, não pela Nathalia em runtime.

RAG: NÃO
Não é conteúdo recuperável para responder perguntas de cliente; é metadado estrutural da base de conhecimento.

DEPENDÊNCIAS
- Referenciado implicitamente por todos os documentos de `01_EduInfo` a `06_Agenda` e por `99_Archive`, na medida em que o índice declara a existência e o dono de cada pasta.
- Depende de `references/nomenclatura.md` (convenção de nomes) e `references/ecossistema.md` (fronteiras de propriedade) como fontes de critério — não deveria divergir delas.

CONFLITOS
Nenhum conflito de conteúdo identificado. O único ponto de divergência é entre a prática adotada (numeração sem espaçamento) e a recomendação de `references/nomenclatura.md` sobre deixar espaço entre números — é uma recomendação de melhoria, não um conflito factual entre fontes.

CONTEÚDO A MANTER
Todo o conteúdo atual: propósito, tabela de estrutura de pastas, convenção de nomes, seção de manutenção.

CONTEÚDO A MOVER
Nenhum.

CONTEÚDO A REMOVER/ARQUIVAR
Nenhum.

NOME PROPOSTO
Mantido: `00_Indice_Mestre_da_Base_de_Conhecimento`.

PRÓXIMA AÇÃO
Nenhuma ação obrigatória. Recomendação opcional para avaliação humana: caso o ecossistema preveja crescimento (novas marcas, novos subagentes transversais), considerar migrar a numeração das pastas para um esquema espaçado (ex.: `10_EduInfo`, `20_Gennera`, `30_Eco_Clear`, `40_Educbank`, `50_Vibe_Flow_Educacional`, `60_Agenda`, `99_Archive`), reservando `00`/`0X` para governança. Essa mudança é cosmética/organizacional (prioridade BAIXA) e só deve ser executada com validação humana, pois implica atualizar referências em outros documentos.
