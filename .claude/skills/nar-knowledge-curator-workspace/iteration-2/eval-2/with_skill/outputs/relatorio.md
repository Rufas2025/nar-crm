DOCUMENTO
01_Base_de_Prompt_do_Agente — 00_Governanca_e_Arquitetura

PROPÓSITO ATUAL
Documento único usado hoje, na íntegra, como system prompt do agente orquestrador Nathalia
Serrano. Na prática, virou uma base de conhecimento com outro nome: mistura identidade e
roteamento (que precisam estar sempre em contexto) com catálogo de produto, FAQ, objeções,
canais e regras operacionais de cinco marcas diferentes (que só deveriam ser consultados sob
demanda). É esse acúmulo que está deixando o agente lento e confundindo marcas nas respostas —
tudo está carregado ao mesmo tempo, o tempo todo, para toda conversa.

DIAGNÓSTICO
- Escopos misturados: identidade/roteamento do orquestrador, catálogo comercial de 5 marcas,
  FAQ, objeções, canais/redes sociais, regras de agendamento, regras comerciais, integração
  técnica com n8n/webhook e governança LGPD — tudo no mesmo arquivo e na mesma camada (SYSTEM).
- Vazamento de propriedade: "SOLUÇÕES DO ECOSSISTEMA" carrega catálogo, objeções e case de cada
  marca dentro do documento do orquestrador. Por `references/ecossistema.md`, isso pertence aos
  subagentes de marca, não à Nathalia. É a causa mais provável da mistura de marcas nas
  respostas: com tudo em um único contexto, nada impede o modelo de puxar objeção da EduInfo ao
  falar de Gennera.
- Conteúdo transversal mal alocado: "REGRAS DE AGENDAMENTO" é conteúdo de Agenda (subagente
  transversal), não do orquestrador nem de marca — está hoje preso ao system prompt do
  orquestrador.
- Conteúdo operacional fora de lugar: "INTEGRAÇÃO OPERACIONAL" descreve payload de webhook e
  fila de retry — é WORKFLOW, nunca precisa estar carregado para decidir o próximo turno de
  conversa.
- Runtime vs. referência: o documento não separa o que é necessário para *decidir* (identidade,
  classificação de intenção, roteamento, limites de conversa, escalonamento, LGPD) do que é
  necessário apenas para *responder* (produto, preço, objeção, case, canal). Aplicando o teste
  de 6 perguntas de `references/camadas-de-conhecimento.md`, a maior parte do conteúdo do
  documento não sobrevive à pergunta 1.
- Sem duplicação nem conflito identificados dentro deste único documento; o problema é
  inteiramente de alocação de camada e de dono, não de conteúdo factualmente errado.
- Nomenclatura do arquivo ("Base de Prompt do Agente") não indica escopo nem dono — mas isso é
  secundário frente ao problema estrutural.

DECISÃO
SPLIT

OWNER ALVO
NAR ECO (orquestrador) — para o núcleo que permanece; ver SPLIT MAP para os demais donos
(EduInfo, Gennera, Eco Clear, Educbank, Vibe Flow Educacional, Agenda).

LOCALIZAÇÃO ALVO
Ver SPLIT MAP.

TIPO DE CONHECIMENTO
Múltiplo — ver SPLIT MAP (SYSTEM, RAG, WORKFLOW, REFERENCE).

SYSTEM: SIM — apenas para identidade/persona, classificação de intenção, tabela de roteamento
por domínio, limites globais de conversa, escalonamento e LGPD/governança global. É o único
bloco necessário para o orquestrador decidir como agir e para quem rotear.

RAG: SIM — catálogo de soluções, objeções, FAQ de marca, canais/redes sociais de cada marca.
Esse conteúdo é necessário para responder, não para decidir, e deve migrar para os respectivos
subagentes de marca (isolado por marca, nunca compartilhado no índice do orquestrador).

DEPENDÊNCIAS
- O bloco SYSTEM remanescente depende de que cada subagente de marca exista e esteja acessível
  via roteamento (EduInfo, Gennera, Eco Clear, Educbank, Vibe Flow Educacional).
- O bloco de Agenda depende do critério de qualificação específico de marca que hoje está
  embutido nas regras de agendamento (ex.: "escolas com menos de 100 alunos recebem material
  gravado" é regra geral de canal, mas qualificação por porte pode ter variação por marca —
  sinalizado como pendente de validação abaixo).
- O bloco WORKFLOW (integração n8n/webhook) depende da documentação operacional existente do
  projeto NAR ECO n8n, se houver — não identificada neste documento; ver DESCONHECIDO abaixo.

CONFLITOS
Nenhum conflito factual identificado dentro deste documento.

CONTEÚDO A MANTER (no SYSTEM do orquestrador, após split)
- IDENTIDADE (integral)
- TOM DE VOZ (integral — é regra global de conversa)
- COMO CLASSIFICAR A INTENÇÃO (integral)
- Regra de escalonamento: "Reclamações formais e menções a órgão regulador são escaladas
  imediatamente para humano"
- GOVERNANÇA E LGPD (integral)
- Do FAQ GERAL: apenas a resposta "Vocês são uma empresa só?" — é institucional do orquestrador,
  útil para a Nathalia se apresentar. As demais perguntas do FAQ GERAL ("Atendem qual região?",
  "Trabalham com escola pública?", "Qual o menor porte atendido?") são consultáveis, não
  decisórias — migram para RAG (institucional do orquestrador, ou de marca quando específicas).
- Regra comercial transversal: "Nenhuma proposta é enviada sem aprovação do responsável
  comercial da conta. Descontos acima da alçada padrão exigem aprovação de diretoria." — vale
  para todas as marcas, portanto é global (critério de `references/ecossistema.md`: muda a
  mesma forma para toda marca, não é específica de uma).

CONTEÚDO A MOVER
Ver SPLIT MAP completo abaixo. Resumo:
- Catálogo, objeções e case de cada uma das 5 marcas -> RAG do respectivo subagente.
- REDES SOCIAIS E CANAIS -> RAG de cada marca (uma linha por marca); a linha "NAR ECO:
  naareco.com.br, LinkedIn NAR ECO" é institucional do orquestrador e pode ficar como REFERENCE
  ou RAG leve do orquestrador.
- REGRAS DE AGENDAMENTO (íntegra) -> Agenda, como WORKFLOW.
- INTEGRAÇÃO OPERACIONAL (íntegra) -> WORKFLOW do orquestrador/infra (n8n), não do agente
  conversacional.
- Perguntas não-institucionais do FAQ GERAL -> RAG (orquestrador ou marca, conforme o caso).

CONTEÚDO A REMOVER/ARQUIVAR
Nenhum. Não há conteúdo obsoleto ou substituído neste documento — é reestruturação de camada,
não descarte. O documento original deve ser preservado (ARCHIVE) somente depois que as versões
migradas forem validadas e o novo SYSTEM reduzido entrar em produção — nunca sobrescrito
diretamente.

NOME PROPOSTO
Documento original: manter até validação, depois mover para ARCHIVE com nome
`01_Base_de_Prompt_do_Agente_v1_ARQUIVADO`.
Novo núcleo SYSTEM: `00_NAR_ECO_System_Prompt_Nathalia` (ou nome equivalente que comunique que é
o núcleo mínimo de roteamento, não uma base de conhecimento).

PRÓXIMA AÇÃO
1. Validar com o responsável pelo agente se a divisão proposta no SPLIT MAP está correta —
   principalmente a fronteira entre "critério de qualificação por marca" e "mecânica de
   agendamento" (ver pendência abaixo).
2. Sob pedido explícito, executar o REWRITE do núcleo SYSTEM (documento novo, não sobrescrever o
   original) com apenas o conteúdo listado em CONTEÚDO A MANTER.
3. Criar/atualizar os documentos de RAG por marca com o conteúdo migrado, isolados por
   subagente.
4. Criar/atualizar o documento de Agenda com REGRAS DE AGENDAMENTO.
5. Mover INTEGRAÇÃO OPERACIONAL para a documentação de WORKFLOW n8n existente do projeto (fora
   do escopo deste documento).
6. Só depois de 1–5 validados, arquivar o documento original.

PENDENTE DE VALIDAÇÃO
- DESCONHECIDO: se já existe documentação canônica de WORKFLOW para a integração Evolution
  GO/n8n/webhook em outro lugar do projeto; se existir, o bloco INTEGRAÇÃO OPERACIONAL deste
  documento deve ser tratado como possível duplicidade (fonte canônica a decidir), não como
  conteúdo novo.
- INFERIDO: a regra "escolas com menos de 100 alunos recebem material gravado em vez de demo ao
  vivo" pode ser critério de qualificação específico de marca (ex.: só se aplica a demos da
  EduInfo/Gennera) ou regra geral de canal da Agenda. O documento não deixa isso explícito — sinalizar
  para validação humana antes de decidir se fica inteiramente na Agenda ou se parte dela (o
  limiar de alunos) é referenciada a partir da marca, conforme a exceção descrita em
  `references/ecossistema.md`.

SPLIT MAP
seção de origem                                    ->  documento de destino                              ->  agente/pasta de destino          ->  camada
IDENTIDADE                                         ->  NAR_ECO_System_Prompt_Nathalia                    ->  NAR ECO (orquestrador)           ->  SYSTEM
TOM DE VOZ                                         ->  NAR_ECO_System_Prompt_Nathalia                    ->  NAR ECO (orquestrador)           ->  SYSTEM
COMO CLASSIFICAR A INTENÇÃO                        ->  NAR_ECO_System_Prompt_Nathalia                    ->  NAR ECO (orquestrador)           ->  SYSTEM
FAQ "Vocês são uma empresa só?"                    ->  NAR_ECO_System_Prompt_Nathalia                    ->  NAR ECO (orquestrador)           ->  SYSTEM
REGRAS COMERCIAIS (aprovação/alçada, global)       ->  NAR_ECO_System_Prompt_Nathalia                    ->  NAR ECO (orquestrador)           ->  SYSTEM
GOVERNANÇA E LGPD                                  ->  NAR_ECO_System_Prompt_Nathalia                    ->  NAR ECO (orquestrador)           ->  SYSTEM
EduInfo (catálogo, objeções)                       ->  EduInfo_Produtos_Objecoes                         ->  EduInfo                          ->  RAG
EduInfo (canais: site, Instagram)                  ->  EduInfo_Canais_Oficiais                           ->  EduInfo                          ->  RAG
Gennera (catálogo, condições, objeções)             ->  Gennera_Produtos_Objecoes                         ->  Gennera                          ->  RAG
Gennera (canal: site)                              ->  Gennera_Canais_Oficiais                           ->  Gennera                          ->  RAG
Eco Clear (programa, case Rede Semear)              ->  Eco_Clear_Produtos_Cases                          ->  Eco Clear                        ->  RAG
Eco Clear (canal: site)                            ->  Eco_Clear_Canais_Oficiais                         ->  Eco Clear                        ->  RAG
Educbank (proposta de valor)                       ->  Educbank_Produtos                                 ->  Educbank                         ->  RAG
Educbank (canal: site)                             ->  Educbank_Canais_Oficiais                          ->  Educbank                         ->  RAG
Vibe Flow Educacional (trilhas, diagnóstico)        ->  Vibe_Flow_Produtos                                ->  Vibe Flow Educacional            ->  RAG
Vibe Flow Educacional (canal: site)                 ->  Vibe_Flow_Canais_Oficiais                         ->  Vibe Flow Educacional            ->  RAG
FAQ "Atendem qual região?"                         ->  NAR_ECO_Institucional_FAQ                         ->  NAR ECO (orquestrador)           ->  RAG
FAQ "Trabalham com escola pública?"                ->  NAR_ECO_Institucional_FAQ                         ->  NAR ECO (orquestrador)           ->  RAG
FAQ "Qual o menor porte atendido?"                 ->  NAR_ECO_Institucional_FAQ (referencia EduInfo)    ->  NAR ECO (orquestrador)           ->  RAG
NAR ECO (canal: site, LinkedIn)                    ->  NAR_ECO_Institucional_FAQ ou REFERENCE            ->  NAR ECO (orquestrador)           ->  RAG/REFERENCE
REGRAS DE AGENDAMENTO (íntegra)                    ->  Agenda_Regras_de_Agendamento                      ->  Agenda                           ->  WORKFLOW
INTEGRAÇÃO OPERACIONAL (webhook, payload, retry)   ->  NAR_ECO_Integracao_Evolution_n8n                  ->  NAR ECO / infra                  ->  WORKFLOW
