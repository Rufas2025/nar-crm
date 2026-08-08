# Curadoria — `01_Base_de_Prompt_do_Agente` (system prompt da Nathalia)

MODE 1 — Document Curation. Nenhum arquivo foi modificado; isto é recomendação para validação humana.

---

## Por que o agente está lento e misturando marcas

O diagnóstico não é "o prompt está grande". É que o prompt virou **base de conhecimento com outro nome**.

Hoje o documento responde perguntas de cliente (o que a EduInfo faz, quanto tempo leva a implantação, como rebater "é caro", qual o Instagram da marca) em vez de apenas **decidir quem responde**. Duas consequências diretas, e as duas são exatamente o que você está observando:

1. **Mistura de marcas.** Os catálogos, objeções e cases das cinco marcas estão no mesmo contexto, ao mesmo tempo, sem nenhum isolamento. Não existe mecanismo algum impedindo o agente de usar o case da Rede Semear (Eco Clear) numa conversa sobre Gennera, ou de citar a faixa de entrada da EduInfo numa pergunta sobre Educbank — tudo está igualmente "presente" para ele. Isolamento de marca não se resolve com instrução; resolve-se **não carregando as cinco marcas juntas**.
2. **Lentidão e diluição.** Cada token de catálogo, FAQ, link e payload de webhook compete com as instruções que realmente governam o comportamento. Regras críticas (LGPD, escalonamento, aprovação comercial) estão enterradas no fim de um documento cuja maior parte é conteúdo consultável.

O teste que resolve o caso é sempre o mesmo: **o orquestrador precisa disso para decidir COMO agir, ou apenas para SABER a resposta?** Se é para saber a resposta, é RAG ou especialista — não system prompt.

Estimativa: **cerca de três quartos do documento deve sair do system prompt** (`INFERIDO`, por proporção de conteúdo). O que sobra é um prompt curto de identidade, roteamento e governança.

---

## Relatório

```
DOCUMENTO
01_Base_de_Prompt_do_Agente — 00_Governanca_e_Arquitetura
(em produção como system prompt do agente Nathalia Serrano)

PROPÓSITO ATUAL
Deveria ser o prompt de runtime do orquestrador: identidade, roteamento e governança.
Na prática acumulou catálogo das cinco marcas, FAQ, objeções, cases, canais oficiais,
regras de agendamento e documentação de integração n8n/webhook. É hoje uma base de
conhecimento carregada integralmente a cada conversa.

DIAGNÓSTICO
Oito escopos distintos com quatro donos diferentes (orquestrador, cinco marcas, Agenda,
operação). Blocos de runtime e blocos consultáveis convivem sem separação.
- Conteúdo de marca (Soluções, Objeções, Canais) é o maior bloco e é 100% consultável:
  não é necessário para rotear, apenas para responder.
- Ausência de isolamento entre marcas é a causa direta do vazamento observado em produção.
- INTEGRAÇÃO OPERACIONAL é documentação de workflow dentro de um prompt de conversa:
  além de inútil em runtime, é risco de o agente expor `lead_id`, `canal`, `motivo`,
  `classificacao` e a mecânica de retry ao cliente final.
- REGRAS DE AGENDAMENTO são operação transversal da Agenda, não do orquestrador.
- Duplicação interna: "não pedir dados pessoais de alunos/responsáveis em pré-venda"
  aparece em TOM DE VOZ e em GOVERNANÇA E LGPD; "Instagram @eduinfo.oficial" e
  "eduinfo.com.br" aparecem em SOLUÇÕES e em REDES SOCIAIS E CANAIS.
- Não há contradição factual interna identificada.
- Nomenclatura genérica: "Base de Prompt do Agente" não diz de qual agente nem qual escopo.

DECISÃO
SPLIT

OWNER ALVO
NAR ECO (orquestrador) · EduInfo · Gennera · Eco Clear · Educbank ·
Vibe Flow Educacional · Agenda

LOCALIZAÇÃO ALVO
Ver SPLIT MAP

TIPO DE CONHECIMENTO
Misto — resolvido bloco a bloco no SPLIT MAP

SYSTEM: SIM — apenas identidade, tom global, classificação de intenção, tabela de
roteamento (uma linha por marca), regras comerciais globais e governança/LGPD.
RAG: SIM — blocos de marca, FAQ institucional e canais, cada um em índice isolado
por dono. O documento inteiro nunca deve ser indexado como está.

DEPENDÊNCIAS
- Roteamento (SYSTEM) depende de existirem os subagentes das cinco marcas com seus
  documentos de posicionamento. Migrar as marcas antes de enxugar o prompt.
- FAQ "Qual o menor porte atendido?" depende da faixa de entrada da EduInfo. A resposta
  canônica é da EduInfo; o FAQ institucional deve referenciar, não repetir.
- Regra "escolas com menos de 100 alunos recebem material gravado" cruza critério de
  qualificação (possivelmente de marca) com mecânica de agendamento (Agenda) — fronteira
  ambígua, ver CONFLITOS.
- INTEGRAÇÃO OPERACIONAL depende do workflow n8n/Evolution GO real; o documento de destino
  passa a ser referência de contrato de payload.

CONFLITOS
Nenhuma contradição factual dentro deste documento.
Marcados para validação humana:
- `DESCONHECIDO` — alçada padrão de desconto nunca é definida ("descontos acima da alçada
  padrão exigem aprovação de diretoria" sem dizer qual é). Regra inaplicável como está.
- `DESCONHECIDO` — "responsável comercial da conta": não há definição de quem é, por marca
  ou por conta.
- `DESCONHECIDO` — o link de agendamento é citado ("link só após qualificação") mas não
  existe no documento.
- `DESCONHECIDO` — a regra dos 100 alunos é global ou específica da EduInfo (única marca
  com faixa de entrada mencionada)? Decide se o critério fica na marca ou na Agenda.
- A conferir antes de migrar: se já existirem documentos comerciais próprios de Gennera ou
  EduInfo, as condições aqui descritas (12 meses mínimos, IPCA, 30 dias de implantação)
  precisam ser confrontadas com eles. Divergência = CONFLITANTE, decisão humana — não
  escolher a versão "mais recente" por conta própria.

CONTEÚDO A MANTER (permanece no system prompt)
- IDENTIDADE (papel da Nathalia, público atendido)
- TOM DE VOZ global, incluindo "nunca prometa prazo, preço ou capacidade não confirmado"
- COMO CLASSIFICAR A INTENÇÃO + escalonamento imediato de reclamação formal / órgão regulador
- REGRAS COMERCIAIS (valem para todas as marcas — genuinamente globais)
- GOVERNANÇA E LGPD (fonte canônica da regra de dados pessoais)
- NOVO: tabela de roteamento, uma linha por marca, só com o domínio que ela cobre
  (ex.: "EduInfo — gestão pedagógica de educação básica"). É o mapa, não o território.

CONTEÚDO A MOVER
- Descrições, módulos, prazos, condições, objeções e cases das cinco marcas -> subagentes
- Canais oficiais de cada marca -> subagente da respectiva marca
- FAQ institucional e canais NAR ECO -> RAG institucional do orquestrador
- REGRAS DE AGENDAMENTO -> Agenda
- INTEGRAÇÃO OPERACIONAL -> WORKFLOW

CONTEÚDO A REMOVER/ARQUIVAR
Nenhuma exclusão. As duas duplicações internas (dados pessoais; canais EduInfo) não são
apagadas: mantém-se uma fonte canônica e a outra ocorrência deixa de existir no destino.
O documento original vai para ARCHIVE após o split, registrando o que o substituiu.

NOME PROPOSTO
NAR_ECO_System_Prompt_Orquestrador  (documento remanescente)

PRÓXIMA AÇÃO
1. Validar com você a fronteira do critério dos 100 alunos (marca x Agenda).
2. Migrar primeiro os cinco documentos de marca e o da Agenda — o prompt só pode encolher
   depois que os destinos existirem, senão o agente perde capacidade de resposta.
3. Só então enxugar o system prompt e trocar as seções de marca pela tabela de roteamento.
4. Resolver os quatro DESCONHECIDOS antes de considerar as regras comerciais e de
   agendamento aplicáveis.
Rewrite do prompt novo não foi executado — peça explicitamente quando quiser a versão.
```

---

## SPLIT MAP

```
SPLIT MAP
IDENTIDADE                          -> NAR_ECO_System_Prompt_Orquestrador       -> NAR ECO (orquestrador) -> SYSTEM
TOM DE VOZ (global)                 -> NAR_ECO_System_Prompt_Orquestrador       -> NAR ECO (orquestrador) -> SYSTEM
COMO CLASSIFICAR A INTENÇÃO         -> NAR_ECO_System_Prompt_Orquestrador       -> NAR ECO (orquestrador) -> SYSTEM
REGRAS COMERCIAIS (todas as marcas) -> NAR_ECO_System_Prompt_Orquestrador       -> NAR ECO (orquestrador) -> SYSTEM
GOVERNANÇA E LGPD                   -> NAR_ECO_System_Prompt_Orquestrador       -> NAR ECO (orquestrador) -> SYSTEM
Tabela de roteamento (NOVO, 1 linha por marca) -> NAR_ECO_System_Prompt_Orquestrador -> NAR ECO (orquestrador) -> SYSTEM

EduInfo: solução, módulos, prazos, faixa de entrada -> EduInfo_Produtos_e_Solucoes        -> EduInfo   -> RAG
EduInfo: objeções                                   -> EduInfo_FAQ_e_Objecoes             -> EduInfo   -> RAG
EduInfo: site e Instagram                           -> EduInfo_Canais_Oficiais            -> EduInfo   -> RAG

Gennera: ERP, contratação, prazo, IPCA, suporte, implantação -> Gennera_Produtos_e_Condicoes_Comerciais -> Gennera -> RAG
Gennera: objeções                                   -> Gennera_FAQ_e_Objecoes             -> Gennera   -> RAG
Gennera: site                                       -> Gennera_Canais_Oficiais            -> Gennera   -> RAG

Eco Clear: programa e certificação                  -> Eco_Clear_Produtos_e_Solucoes      -> Eco Clear -> RAG
Eco Clear: case Rede Semear                         -> Eco_Clear_Cases_e_Provas           -> Eco Clear -> RAG
Eco Clear: site                                     -> Eco_Clear_Canais_Oficiais          -> Eco Clear -> RAG

Educbank: garantia e antecipação de recebíveis      -> Educbank_Produtos_e_Solucoes       -> Educbank  -> RAG
Educbank: site                                      -> Educbank_Canais_Oficiais           -> Educbank  -> RAG

Vibe Flow: trilhas, diagnóstico de clima, liderança -> Vibe_Flow_Educacional_Produtos_e_Solucoes -> Vibe Flow Educacional -> RAG
Vibe Flow: site                                     -> Vibe_Flow_Educacional_Canais_Oficiais     -> Vibe Flow Educacional -> RAG

FAQ GERAL (institucional, 4 perguntas)              -> NAR_ECO_FAQ_Institucional          -> NAR ECO (orquestrador) -> RAG
Canais NAR ECO (site + LinkedIn)                    -> NAR_ECO_Canais_Oficiais            -> NAR ECO (orquestrador) -> RAG

Demonstrações: dias, horários, blocos de 45 min     -> Agenda_Regras_de_Demonstracao      -> Agenda    -> WORKFLOW
Qualificação obrigatória antes de agendar           -> Agenda_Regras_de_Qualificacao      -> Agenda    -> WORKFLOW
Regra dos 100 alunos (material gravado x demo)      -> pendente de decisão humana         -> Agenda ou marca -> WORKFLOW
Reagendamento, cancelamento, no-show                -> Agenda_Regras_de_Reagendamento     -> Agenda    -> WORKFLOW
Confirmações automáticas 24h/1h                     -> Agenda_Regras_de_Confirmacao       -> Agenda    -> WORKFLOW
Reuniões de diagnóstico e de proposta               -> Agenda_Tipos_de_Reuniao            -> Agenda    -> WORKFLOW

INTEGRAÇÃO OPERACIONAL (Evolution GO, n8n, payload, retry) -> NAR_ECO_Workflow_Encerramento_CRM -> operação -> WORKFLOW

Documento original completo                         -> ARCHIVE/01_Base_de_Prompt_do_Agente -> NAR ECO  -> ARCHIVE
```

Nenhuma seção do original ficou sem destino. A única linha aberta é a regra dos 100 alunos, e ela está aberta de propósito: é fronteira genuína entre marca e Agenda, e escolher sozinho seria inventar com passos extras.

---

## Como fica o system prompt, em uma frase por bloco

O prompt final tem cinco blocos e nenhuma resposta de cliente dentro dele:

| Bloco | Por que sobrevive |
|---|---|
| Identidade e papel | define quem o agente é — sem isso não há comportamento |
| Tom de voz global | regra de conversa que vale em toda interação |
| Classificação de intenção + escalonamento | é a decisão que o orquestrador toma |
| Tabela de roteamento (1 linha por marca) | o mapa: o suficiente para saber quem atende |
| Regras comerciais globais + LGPD/governança | precisa valer sempre, não quando o RAG lembrar |

E o que sai, sai por um motivo único: **nada disso é necessário para decidir quem atende — só para responder.** Responder é trabalho do especialista.

Um ganho colateral importante: com os catálogos fora do contexto e cada marca em índice isolado, a mistura de marcas deixa de ser uma questão de o agente "se comportar bem" e passa a ser estruturalmente improvável.
