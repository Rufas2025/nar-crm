DOCUMENTO
02_Playbook_Omnichannel_NAR_ECO — pasta atual `00_Governanca_e_Arquitetura`

PROPÓSITO ATUAL
Pelo nome e pela pasta, o documento se propõe a ser governança: regras globais de atendimento
omnichannel do orquestrador NAR ECO. Na prática, ele é isso só na Seção 1 (e parte da Seção 2).
Da Seção 3 em diante ele muda de natureza: vira material comercial e operacional da marca
EduInfo (posicionamento, objeções, canais, tom de voz) e regras de agendamento que não são
exclusivas de nenhuma marca. Um documento de governança não deveria conter argumentário de
vendas nem regras de booking — isso é escopo misturado, não governança.

DIAGNÓSTICO
- Seção 1 (Princípios de atendimento omnichannel): governança global legítima — vale para
  todos os canais e todas as marcas (SLA de resposta, LGPD, escalonamento, persona/tom global
  da Nathalia). Está no lugar certo em espírito, mas em formato de prosa livre dentro de um
  documento que depois muda de assunto.
- Seção 2 (Roteamento por domínio): tabela de roteamento por palavra-chave → especialista.
  É exatamente o tipo de conteúdo que o orquestrador precisa para decidir quem atende — pertence
  ao orquestrador, não à EduInfo nem a nenhuma outra marca isoladamente.
- Seção 3 (EduInfo — posicionamento e argumentação): 100% conhecimento de marca EduInfo
  (proposta de valor, módulos, diferenciais, objeções, canais oficiais, tom de voz específico).
  Nada disso serve para o orquestrador decidir roteamento; serve para responder ao cliente sobre
  a EduInfo. Não tem relação nenhuma com "governança e arquitetura" — é RAG de marca dentro de
  uma pasta de governança.
- Seção 4 (Agendamento de demonstrações): mecânica de booking (dias/horários, qualificação,
  regras de reagendamento/no-show, confirmação automática) — conteúdo transversal de
  agendamento, dono é o subagente Agenda, não a pasta de governança nem a EduInfo. Único ponto
  que é genuinamente da EduInfo aqui é o *critério de qualificação* específico da marca (número
  de alunos, sistema atual, poder de decisão) e a frase "responsável: equipe comercial EduInfo"
  — o critério é da marca, a mecânica é da Agenda (ver `references/ecossistema.md`, seção
  "Casos ambíguos").
- Seção 5 (Encerramento de atendimento): regra de processo de CRM (registrar motivo,
  classificar lead) — transversal, não específica de EduInfo, aplica-se a qualquer atendimento
  do ecossistema. Mais próxima de governança/processo operacional do que de conhecimento de
  marca.
- Verbosidade/escopo: o documento tenta ser três coisas ao mesmo tempo — regras globais de
  governança, playbook comercial de uma marca e manual de agendamento. Cada uma dessas
  tem dono e camada diferentes.
- Nenhuma contradição interna encontrada. Nenhum conflito com outro documento foi verificado
  porque nenhum outro documento da pasta foi fornecido para comparação — se existir um
  documento de posicionamento EduInfo em paralelo, checar duplicação/conflito é ação pendente.

DECISÃo
SPLIT

OWNER ALVO
NAR ECO (orquestrador) para Seções 1 e 2 · EduInfo para Seção 3 e o critério de qualificação da
Seção 4 · Agenda para o restante da Seção 4 · NAR ECO (orquestrador, como processo transversal
de CRM) para a Seção 5 — ver SPLIT MAP para justificativa por bloco.

LOCALIZAÇÃO ALVO
Ver SPLIT MAP

TIPO DE CONHECIMENTO
Misto — ver SPLIT MAP (SYSTEM para Seções 1 e 2; RAG para Seção 3; WORKFLOW para Seção 4; a
Seção 5 tende a SYSTEM/REFERENCE como regra de processo, ver observação abaixo)

SYSTEM: SIM — mas apenas para as Seções 1, 2 e 5. O orquestrador precisa de tom global, SLA,
LGPD, escalonamento e roteamento para decidir como agir e quem atende; não precisa do
argumentário de venda da EduInfo nem dos horários de demonstração para isso.

RAG: SIM — apenas para a Seção 3 (posicionamento, módulos, diferenciais, objeções, canais,
tom de voz da EduInfo), que deve ser consultável pelo subagente EduInfo, não pelo orquestrador
nem por outra marca.

DEPENDÊNCIAS
- O documento resultante do orquestrador (Seções 1+2) passa a ser referenciado pelos playbooks
  de todas as marcas, não só EduInfo — é candidato natural a documento canônico de "Regras
  Globais de Atendimento Omnichannel".
- O bloco de agendamento (Seção 4) depende do critério de qualificação da EduInfo permanecer
  documentado e referenciado a partir da Agenda, para não perder o vínculo marca↔critério.
- Se já existir um documento de posicionamento/objeções EduInfo em pasta própria, este SPLIT gera
  dependência de deduplicação com ele — verificar antes de migrar (ação pendente, marcado abaixo).

CONFLITOS
Nenhum identificado dentro deste documento. Status: DESCONHECIDO se há conflito com outro
documento de posicionamento EduInfo ou com uma eventual base de regras da Agenda já existente —
não foi fornecido material para comparação; precisa de validação humana antes de finalizar a
migração, para não criar uma segunda fonte de verdade sobre agendamento ou sobre a EduInfo.

CONTEÚDO A MANTER
Seções 1 e 2, reescritas como documento de governança do orquestrador (fora desta pasta de
"playbook", que deixa de existir com esse nome — ver NOME PROPOSTO).

CONTEÚDO A MOVER
Seção 3 inteira → EduInfo. Seção 4 (mecânica de agendamento) → Agenda, preservando o critério de
qualificação como referência à marca de origem. Seção 5 → REFERENCE/SYSTEM de processo
transversal de CRM (não é claramente "governança e arquitetura" nem "marca"; é regra de operação
de atendimento — ver PRÓXIMA AÇÃO para decidir entre SYSTEM enxuto e REFERENCE).

CONTEÚDO A REMOVER/ARQUIVAR
Nenhum conteúdo é obsoleto ou deve ser descartado. O documento original (`02_Playbook_Omnichannel_NAR_ECO`,
versão de março/2025) deve ir para ARCHIVE assim que o SPLIT for validado e os quatro documentos
de destino existirem, registrando dentro do arquivo o que o substituiu.

NOME PROPOSTO
Documento original: inalterado até a migração ser validada; depois, ARCHIVE.
Documentos de destino: ver SPLIT MAP.

PRÓXIMA AÇÃO
1. Validação humana: confirmar se já existe documento de posicionamento/objeções da EduInfo e
   documento de regras da Agenda em outras pastas — se sim, este SPLIT vira também DEDUPLICATE
   contra eles, e não apenas SPLIT.
2. Decidir onde a Seção 5 (encerramento/classificação de lead no CRM) deve morar: como está
   escrita hoje ela é curta e comportamental o bastante para caber em SYSTEM (regra global de
   processo), mas se crescer em detalhe operacional deveria migrar para WORKFLOW/REFERENCE.
   Marcado como DESCONHECIDO até o humano decidir o nível de detalhe desejado.
3. Após validação, executar o SPLIT: criar os quatro documentos de destino, mover o conteúdo
   conforme o SPLIT MAP, e só então mover o original para ARCHIVE dentro de
   `00_Governanca_e_Arquitetura` (nunca deletar).
4. Renomear a pasta de origem do documento restante de governança para algo que não sugira
   "playbook comercial" — o nome atual convida à mistura de escopo que causou este diagnóstico.

SPLIT MAP
seção de origem                                    ->  documento de destino                              ->  agente/pasta de destino                        ->  camada
1. Princípios de atendimento omnichannel           ->  NAR_ECO_Regras_Globais_de_Atendimento_Omnichannel  ->  NAR ECO (orquestrador) / 00_Governanca_e_Arquitetura  ->  SYSTEM
2. Roteamento por domínio                          ->  NAR_ECO_Tabela_de_Roteamento_por_Dominio           ->  NAR ECO (orquestrador) / 00_Governanca_e_Arquitetura  ->  SYSTEM
3. EduInfo — posicionamento e argumentação          ->  EduInfo_Posicionamento_Modulos_e_Objecoes          ->  EduInfo / pasta de marca EduInfo               ->  RAG
4. Agendamento de demonstrações (mecânica)         ->  Agenda_Regras_de_Agendamento_Demonstracoes         ->  Agenda / pasta Agenda                          ->  WORKFLOW
4. Agendamento — critério de qualificação (nº de alunos, sistema atual, poder de decisão)  ->  EduInfo_Criterio_de_Qualificacao_para_Demo  ->  EduInfo / pasta de marca EduInfo (referenciado pela Agenda)  ->  RAG
5. Encerramento de atendimento (registro/classificação de lead no CRM)  ->  NAR_ECO_Regras_de_Encerramento_e_Classificacao_de_Lead  ->  NAR ECO (orquestrador) / 00_Governanca_e_Arquitetura  ->  SYSTEM (revisar se cresce para WORKFLOW/REFERENCE)
