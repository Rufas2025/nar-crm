# Curadoria — MODE 1 (documento único)

Resposta curta: **não, ele não está inteiramente no lugar certo.** A pasta `00_Governanca_e_Arquitetura` é o dono correto de apenas duas das cinco seções. As seções 3 e 4 são, respectivamente, conhecimento de marca (EduInfo) e operação de agendamento (Agenda) vivendo dentro de um documento de governança. A decisão é **SPLIT**, não MOVE — parte do documento fica onde está.

---

```
DOCUMENTO
02_Playbook_Omnichannel_NAR_ECO — 00_Governanca_e_Arquitetura

PROPÓSITO ATUAL
Propõe-se a ser o playbook global de atendimento omnichannel do orquestrador (canais, regras de
conduta, roteamento). Na prática virou um documento de três escopos: governança global, dossiê
comercial da EduInfo e manual de agendamento de demonstrações.

DIAGNÓSTICO
Três escopos distintos, três donos diferentes, um único arquivo.

- Seções 1, 2 e 5 são genuinamente globais: valem para todas as marcas e não mudariam se uma
  marca saísse do ecossistema. Estão na pasta certa.
- Seção 3 (EduInfo) é conhecimento de marca completo — posicionamento, proposta de valor,
  módulos, diferenciais, objeções, canais oficiais e tom de voz — dentro de um documento de
  governança. Consequência dupla: infla o escopo do orquestrador com informação que ele não
  precisa para rotear (ele já roteia corretamente com a seção 2 sozinha), e torna esse conteúdo
  não recuperável pelo subagente da EduInfo, que deveria ser o dono canônico. Nenhuma outra marca
  recebe tratamento equivalente aqui — a EduInfo aparece detalhada e as outras quatro só em uma
  linha de roteamento. Isso é assimetria de escrita legada, não decisão arquitetural.
- Seção 4 (agendamento) é operação transversal: janelas, blocos de 45 min, qualificação prévia,
  link, reagendamento, no-show, confirmação automática. É o padrão clássico descrito no
  `references/ecossistema.md`: o documento fala de "o que vendemos" e de repente explica como
  marcar a demonstração.
- Verbosidade: moderada e concentrada na seção 3. As seções globais são enxutas.
- Sem contradições internas identificadas. A faixa de entrada "até 300 alunos" (seção 3) e o
  corte de "menos de 100 alunos" para demo ao vivo (seção 4) são regras diferentes sobre coisas
  diferentes — não é conflito.
- Vigência: o documento declara última atualização em março/2025. Não há como verificar no
  material se as regras seguem vigentes hoje (agosto/2026). Status: `DESCONHECIDO`. Isso é
  motivo para validar antes de migrar, não para arquivar.

DECISÃO
SPLIT

OWNER ALVO
NAR ECO (orquestrador) · EduInfo · Agenda

LOCALIZAÇÃO ALVO
Ver SPLIT MAP

TIPO DE CONHECIMENTO
Misto — resolvido bloco a bloco no SPLIT MAP

SYSTEM: SIM — apenas os princípios globais de conduta/LGPD/escalonamento (seção 1) e a tabela de
roteamento por domínio (seção 2). Nada mais do documento sobrevive à pergunta "preciso disso para
decidir COMO agir?".

RAG: SIM — somente o bloco EduInfo (seção 3), no índice isolado da marca. As seções globais e as
regras de agenda não vão para RAG: governança em RAG vira regra probabilística, e regra de
compliance probabilística não é regra.

DEPENDÊNCIAS
- Agenda -> EduInfo: o critério de qualificação por porte ("menos de 100 alunos não recebem demo
  ao vivo") é critério de marca; a mecânica de agendamento é da Agenda. Registrar referência
  cruzada, não duplicar o número.
- Agenda -> EduInfo: "responsável pelas demonstrações de gestão pedagógica: equipe comercial
  EduInfo" é atribuição de responsabilidade da marca, consumida pela Agenda.
- Seção 2 (roteamento) depende da existência dos cinco subagentes de marca; se um documento de
  marca mudar de domínio, a tabela de roteamento precisa ser revista.
- Seção 5 (registro no CRM) depende do sistema de CRM e da taxonomia de status de lead, que não
  estão descritos neste documento.

CONFLITOS
Nenhum conflito factual identificado dentro deste documento. Não foi feita comparação com os
demais documentos da pasta — se houver outro playbook ou documento de agenda em `00_Governanca_e_
Arquitetura`, a checagem de sobreposição exige MODE 2 (arquitetura de pasta), que não foi pedido.

Ambiguidades marcadas para validação humana (não resolvidas aqui):
1. `DESCONHECIDO` — A seção 4 está escrita de forma genérica ("demonstrações são agendadas apenas
   às terças e quintas") mas fecha atribuindo a responsabilidade à equipe comercial EduInfo. Não
   dá para saber pelo material se essas janelas valem para todas as marcas ou só para a EduInfo.
   A resposta muda o destino: regra global de agenda vs. regra de agenda específica da EduInfo.
2. `DESCONHECIDO` — Se as janelas forem globais, falta saber quais são as regras das outras
   quatro marcas. Provável gap de arquitetura.
3. `INFERIDO` — A seção 5 (encerramento e classificação de lead) é tratada aqui como global por
   estar escrita sem marca. Confirmar que todas as marcas usam a mesma taxonomia de status.
4. `DESCONHECIDO` — Vigência das regras desde março/2025.

CONTEÚDO A MANTER
Seção 1 — princípios de atendimento omnichannel (identificação do interlocutor, SLA de 15 min,
não prometer prazo de implantação, LGPD em pré-venda, escalonamento para humano, persona e tom
global da Nathalia).
Seção 2 — tabela de roteamento por domínio (as cinco marcas, uma linha cada).
Seção 5 — encerramento, registro no CRM e classificação de lead (sujeito à validação nº 3).

CONTEÚDO A MOVER
Seção 3 integral -> subagente EduInfo, quebrada em documentos por tema (posicionamento/módulos,
objeções, canais oficiais, tom de voz).
Seção 4 -> subagente Agenda, exceto o critério de porte e o responsável, que permanecem
ancorados na EduInfo e são referenciados pela Agenda.

CONTEÚDO A REMOVER/ARQUIVAR
Nenhum. Nada aqui está obsoleto ou substituído. Nenhum bloco deve ser deletado — a seção 3 sai do
documento de governança porque muda de dono, não porque perde valor.

NOME PROPOSTO
NAR_ECO_Regras_Globais_de_Atendimento_Omnichannel (documento remanescente, seções 1, 2 e 5)

O nome atual promete um playbook completo, o que é exatamente o convite para que conteúdo de
marca volte a ser depositado ali. O prefixo `02_` pode ser mantido se a pasta já usa numeração;
se a pasta cresce no meio com frequência, considerar renumerar em passos de 10.

PRÓXIMA AÇÃO
1. Validar com o humano as quatro ambiguidades acima — em especial a nº 1, que decide o destino
   da seção 4 inteira. Não executar o split antes disso.
2. Confirmar que já existe (ou criar) o subagente EduInfo com índice de RAG isolado antes de mover
   a seção 3; mover conhecimento de marca para um destino inexistente perde a informação.
3. Só então executar o split. Rewrite dos documentos-destino não foi feito e só acontece sob
   pedido explícito.
```

```
SPLIT MAP
Princípios globais de atendimento (seção 1)     -> NAR_ECO_Regras_Globais_de_Atendimento_Omnichannel -> NAR ECO (orquestrador) -> SYSTEM
Roteamento por domínio (seção 2)                -> NAR_ECO_Regras_Globais_de_Atendimento_Omnichannel -> NAR ECO (orquestrador) -> SYSTEM
Posicionamento, valor e módulos EduInfo (3)     -> EduInfo_Identidade_e_Posicionamento               -> EduInfo               -> RAG
Diferenciais e objeções EduInfo (3)             -> EduInfo_FAQ_e_Objecoes                            -> EduInfo               -> RAG
Canais oficiais EduInfo (3)                     -> EduInfo_Canais_Oficiais                           -> EduInfo               -> RAG
Tom de voz EduInfo (3)                          -> EduInfo_Tom_de_Voz                                -> EduInfo               -> RAG
Critério de porte para demo (<100 alunos) (4)   -> EduInfo_Criterios_de_Qualificacao                 -> EduInfo               -> RAG
Responsável pelas demonstrações (4)             -> EduInfo_Criterios_de_Qualificacao                 -> EduInfo               -> RAG
Janelas, blocos e link de agendamento (4)       -> Agenda_Regras_de_Demonstracao                     -> Agenda                -> WORKFLOW
Reagendamento, cancelamento e no-show (4)       -> Agenda_Regras_de_Reagendamento                    -> Agenda                -> WORKFLOW
Confirmação automática 24h/1h e liberação (4)   -> Agenda_Regras_de_Confirmacao_e_Lembrete           -> Agenda                -> WORKFLOW
Encerramento e classificação de lead (seção 5)  -> NAR_ECO_Regras_Globais_de_Atendimento_Omnichannel -> NAR ECO (orquestrador) -> WORKFLOW
```

Nenhuma seção do documento de origem ficou sem destino.

---

## Observações que valem para a decisão

**O que este relatório deliberadamente não fez.** Não decidiu se as janelas de terça/quinta são
globais ou da EduInfo — o material não permite saber, e escolher a interpretação mais plausível
seria inventar com passos extras. Não moveu o critério de "menos de 100 alunos" para a Agenda
junto com a mecânica: critério de qualificação por porte é da marca, mecânica é da Agenda, e o
`references/ecossistema.md` trata exatamente esse caso como SPLIT com dependência documentada.
Não reescreveu nada. Não inventou preços, URLs ou responsáveis além dos que o documento traz
literalmente (`eduinfo.com.br` e `@eduinfo.oficial` são `VERIFICADO` no material — transportar sem
alterar, não completar com outros canais).

**Por que isso importa na prática.** Hoje, se a EduInfo mudar a lista de módulos ou uma objeção,
alguém precisa lembrar de editar um documento de governança omnichannel — que não é onde ninguém
procuraria. E o subagente da EduInfo, que deveria ser a fonte canônica, não recupera esse
conteúdo. É o sintoma padrão de dono errado: a informação está bem escrita e no lugar onde
ninguém vai mantê-la.

**Sobre a pasta.** Se a suspeita for de que outros documentos de `00_Governanca_e_Arquitetura`
têm o mesmo problema — e a assimetria da seção 3 sugere que essa pasta recebeu conteúdo por
gravidade — o certo é rodar MODE 2 (arquitetura de pasta) antes de executar splits documento a
documento. É ele que revela sobreposições e duplicidades invisíveis quando se olha um arquivo
isolado. Basta pedir.
