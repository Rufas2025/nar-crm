# Revisão do Índice Mestre da Base de Conhecimento — NAR ECO

**Arquivo revisado:** `/home/user/nar-crm/.claude/skills/nar-knowledge-curator/evals/fixtures/caso4_indice_mestre.md`
**Data da revisão:** 08/08/2026
**Veredito:** precisa de ajustes. A estrutura está boa como esqueleto, mas o documento tem **um erro factual comprovado**, **duas contradições internas** e **lacunas críticas** para um ecossistema com orquestrador + subagentes.

---

## 1. O que está bom (manter)

- **Escopo bem declarado.** A seção "Propósito" delimita corretamente que o índice é um mapa, não um repositório de conteúdo. Isso evita o vício comum de índice virar documento-canivete.
- **Coluna "Dono" existir.** Propriedade explícita por pasta é exatamente o que evita conflito de fonte de verdade num ecossistema multiagente.
- **Regra anti-versionamento por sufixo** (`99_Archive` em vez de `_v2`, `_final`). Correta e rara de ver aplicada.
- **Seção de Manutenção com gatilhos explícitos** (criar / renomear / trocar dono).

---

## 2. Problemas críticos (corrigir antes de publicar)

### 2.1 A numeração das pastas está errada — conflito real com documentos em uso

O índice declara:

| Índice diz | Documento real diz |
|---|---|
| `02_Gennera` | `caso2a_gennera_condicoes_comerciais.md` → **"Pasta atual: `03_Gennera`"** |
| `03_Eco_Clear` | — (colide com o 03 acima) |

Ou seja: pelo menos um documento vivo da Gennera aponta para `03_Gennera`, enquanto o índice reserva `03` para Eco Clear. **Um dos dois está errado, e hoje o índice não é a fonte de verdade que ele afirma ser.**

Impacto direto: se os subagentes de marca filtram RAG por prefixo de pasta, o subagente Eco Clear pode receber tabela comercial da Gennera — vazamento cruzado de preço entre marcas, que é o pior tipo de erro possível nesse ecossistema.

**Ação:** auditar todos os documentos da base, decidir a numeração canônica e corrigir o cabeçalho "Pasta atual" de cada arquivo divergente. Depois disso, tornar a numeração imutável (renumerar marca é operação proibida, não apenas desaconselhada).

### 2.2 A pasta `00_Governanca_e_Arquitetura` virou depósito, e o índice não reflete isso

O índice descreve o escopo de `00` como "Governança, compliance, arquitetura da base, convenções". Mas hoje moram lá:

- `01_Base_de_Prompt_do_Agente` — system prompt da Nathalia Serrano (configuração de agente, não governança)
- `02_Playbook_Omnichannel_NAR_ECO` — instrução operacional de atendimento
- `Material_de_Apoio_Comercial` — **conteúdo de marca e argumento comercial de EduInfo** dentro da pasta de governança

O terceiro caso é o mais grave: é conteúdo de marca fora da pasta da marca, sem dono de marca. Se a EduInfo mudar posicionamento, esse arquivo não será atualizado por ninguém, porque o dono formal dele é a governança.

**Ação:** criar pastas que hoje não existem e que a base claramente já demanda:

- `07_Agentes_e_Prompts` — dono: NAR ECO (orquestrador). System prompts, personas, regras de handoff orquestrador→subagente.
- `08_Playbooks_Operacionais` — dono: NAR ECO. Omnichannel, SLA, escalonamento, tom de voz transversal.
- Conteúdo comercial de marca deve ser **quebrado e realocado** para a pasta da marca correspondente, não mantido num documento guarda-chuva.

### 2.3 `06_Agenda` quebra o modelo de propriedade

A coluna "Dono" lista `Agenda` como dono de `06_Agenda`. Agenda não é marca nem pessoa nem agente — é uma capacidade. O resultado é uma linha que não tem dono real, e uma pasta que na prática ninguém mantém.

Além disso, a tabela mistura dois tipos de coisa sem sinalizar: pastas **de marca** (01–05) e pastas **funcionais** (00, 06, 99). O leitor — humano ou agente — não consegue distinguir "isto é território de um subagente" de "isto é infraestrutura compartilhada".

**Ação:** atribuir `06_Agenda` a NAR ECO (orquestrador) e adicionar uma coluna `Tipo` com valores `Marca` / `Transversal` / `Sistema`.

---

## 3. Lacunas para o ecossistema orquestrador + subagentes

Esta é a maior ausência do documento: **ele mapeia pastas para donos, mas não mapeia pastas para agentes.** Num ecossistema onde a Nathalia Serrano orquestra e subagentes especialistas por marca respondem, o índice mestre é o artefato natural para declarar escopo de leitura. Hoje ele não declara.

Recomendo adicionar uma coluna `Agente leitor` e uma seção nova:

### 3.1 Escopo de leitura por agente (sugestão de seção a incluir)

| Pasta | Agente leitor | Acesso |
|---|---|---|
| `00_Governanca_e_Arquitetura` | Orquestrador + todos os subagentes | Leitura |
| `01`–`05` (marcas) | Somente o subagente da respectiva marca + orquestrador | Leitura |
| `06_Agenda` | Orquestrador | Leitura |
| `07_Agentes_e_Prompts` | Orquestrador | Leitura |
| `99_Archive` | Nenhum agente | Excluído do RAG |

O ponto sobre `99_Archive` é crítico e hoje está totalmente ausente: **arquivo morto precisa ser explicitamente excluído da indexação**, senão versões substituídas continuam sendo recuperadas pelo RAG e competindo com a versão vigente. O índice diz que `99_Archive` existe "para auditoria", mas não diz que ele é invisível para os agentes — e essa omissão, na prática, garante que ele não será.

### 3.2 Regra de precedência em conflito

Não existe. Se o documento de governança e o documento de marca discordarem (ex.: playbook omnichannel diz uma coisa sobre desconto, tabela comercial da Gennera diz outra), nenhum agente sabe quem vence. Sugestão de regra a incluir:

> Em caso de conflito, prevalece: (1) compliance e governança, (2) documento canônico da marca, (3) material de apoio. Documento sem data de vigência declarada perde para documento datado.

Essa última cláusula resolve um problema já presente na base — `caso2a` declara explicitamente "Documento sem data de vigência declarada".

### 3.3 Conteúdo que cruza marcas

Não há regra sobre onde vive um comparativo EduInfo × Gennera, um bundle multi-produto ou uma proposta que combina marcas. Hoje isso cairia informalmente em `00`, agravando o problema 2.2. Definir: conteúdo cross-brand vive em pasta transversal com dono orquestrador, e nunca dentro da pasta de uma das marcas envolvidas.

---

## 4. Problemas na convenção de nomes

### 4.1 "snake_case com iniciais maiúsculas" é autocontraditório

`snake_case` é, por definição, minúsculo. O que o documento descreve é `Pascal_Snake_Case`. Como está, a regra é ambígua e já está sendo lida de formas diferentes.

**Ação:** trocar por: *"`Pascal_Snake_Case`: palavras separadas por underscore, cada palavra com inicial maiúscula. Ex.: `Condicoes_Comerciais_Gennera`."*

### 4.2 A própria tabela viola a própria regra

- `01_EduInfo` — camelCase interno (`EduInfo`), não Pascal_Snake_Case. Pela regra literal deveria ser `01_Edu_Info` ou a regra precisa abrir exceção explícita para grafia oficial de marca.
- `99_Archive` — único nome em inglês numa base em português.

**Ação:** adicionar cláusula de exceção: *"Nomes próprios de marca preservam a grafia oficial mesmo que violem a convenção."* E renomear `99_Archive` → `99_Arquivo_Historico`, ou assumir o inglês como escolha deliberada e declará-la.

### 4.3 Grafia das marcas não está padronizada — e a base já diverge

Contagem de ocorrências no repositório `nar-crm`:

| Marca | Grafias encontradas |
|---|---|
| EduInfo | `EduInfo` (35×), `eduinfo` (19×), `Eduinfo` (8×) |
| Eco Clear | `Eco Clear` (20×), `EcoClear` (8×), `ecoclear` (7×), `Eco_Clear` (4×) |
| Gennera | `Gennera` (46×), `gennera` (13×) |
| Educbank | `Educbank` (17×), `educbank` (7×) |
| Vibe Flow | `Vibe Flow` (11×), `Vibe_Flow` (1×), `vibeflow` (1×) |

Note que existem skills no ambiente nomeadas `eduinfo-design-system` e `eduinfo-template-master`, ou seja, a divergência já saiu da base de conhecimento e chegou à ferramentaria.

**Ação:** o índice mestre é o lugar certo para uma **tabela de grafia canônica** (nome oficial em prosa, nome em identificador, nome em pasta). Sem isso, busca semântica e filtros por marca ficam frágeis.

### 4.4 Faltam regras de alocação de prefixo

Não está dito quais prefixos estão livres (07–98), que `99` é reservado, que prefixo de marca descontinuada não é reaproveitado, nem qual é o processo para admitir uma nova marca no ecossistema. Num ecossistema que cresce por marca, essa é a regra que mais será exercitada.

---

## 5. Problemas de manutenção e metadados

1. **O índice não tem data de última atualização nem versão.** Documentos irmãos têm (`caso1` traz "Última atualização informada no documento: março/2025"). Um índice mestre sem data é o documento em que menos se pode confiar por antiguidade — e ele é justamente o que todos consultam primeiro. Adicionar `Última atualização` e `Versão`.
2. **"Responsável: governança NAR ECO" é vago.** Não é uma pessoa nem um agente nomeado. Se ninguém tem nome, o gatilho de manutenção não dispara.
3. **Falta lista de documentos canônicos.** O propósito diz "consulte o documento canônico do respectivo dono", mas o índice não diz qual é o documento canônico de cada pasta. O leitor fica sabendo que ele existe, sem saber onde. Adicionar coluna `Documento canônico`.
4. **Falta política de retenção do `99_Archive`.** Por quanto tempo, quem pode apagar, o que nunca pode ser apagado (compliance).
5. **Falta o gatilho mais provável:** o índice manda atualizar quando pasta é criada, renomeada ou muda de dono — mas não quando **um documento canônico é substituído**, que é o evento mais frequente da base.
6. **Faltam padrões de arquivo para RAG:** formato (`.md`), idioma, tamanho máximo, política de cabeçalho. Todos os documentos da base já usam o cabeçalho `Pasta atual:` — isso é uma convenção de fato que o índice deveria formalizar como obrigatória, já que é ela que permite validar drift de pasta (problema 2.1).

---

## 6. Checklist de ajustes, por prioridade

**Bloqueadores**
- [ ] Resolver o conflito de numeração Gennera `02` vs `03` e auditar o cabeçalho `Pasta atual:` de todos os documentos
- [ ] Declarar `99_Archive` como excluído da indexação/RAG
- [ ] Retirar conteúdo de marca de `00_Governanca_e_Arquitetura` e realocar para as pastas de marca

**Alta**
- [ ] Adicionar colunas `Tipo`, `Agente leitor` e `Documento canônico` à tabela
- [ ] Corrigir dono de `06_Agenda` para NAR ECO (orquestrador)
- [ ] Criar `07_Agentes_e_Prompts` e `08_Playbooks_Operacionais`
- [ ] Adicionar regra de precedência em conflito
- [ ] Adicionar tabela de grafia canônica das cinco marcas

**Média**
- [ ] Corrigir "snake_case com iniciais maiúsculas" → `Pascal_Snake_Case` + exceção para nomes de marca
- [ ] Adicionar `Última atualização`, `Versão` e responsável nominal
- [ ] Definir alocação de prefixos (livres, reservados, não reaproveitáveis) e processo de admissão de nova marca
- [ ] Definir política de retenção do arquivo histórico
- [ ] Adicionar gatilho de manutenção para substituição de documento canônico
- [ ] Formalizar o cabeçalho `Pasta atual:` como obrigatório em todo documento da base
- [ ] Definir regra para conteúdo cross-brand

**Baixa**
- [ ] Padronizar `99_Archive` para português, ou declarar o inglês como deliberado
