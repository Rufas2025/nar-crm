# Curadoria — Material_de_Apoio_Comercial

```
DOCUMENTO
Material_de_Apoio_Comercial.md — pasta atual `00_Governanca_e_Arquitetura`

PROPÓSITO ATUAL
Nasceu como anotações soltas de reuniões comerciais e nunca virou um documento com escopo
próprio. Na prática, mistura em um único arquivo: posicionamento de marca (EduInfo), um link de
asset comercial (Gennera), um case de cliente (Eco Clear), uma regra de governança comercial que
vale para todo o ecossistema, e regras operacionais de agendamento. Cinco camadas e quatro donos
diferentes convivendo sob um nome que não descreve nenhum deles.

DIAGNÓSTICO
- Escopos misturados: 4 das 5 seções pertencem a agentes diferentes (EduInfo, Gennera, Eco Clear,
  Agenda) e uma é regra global do orquestrador. Nenhuma seção pertence à pasta onde o documento
  está hoje.
- Localização errada: está em `00_Governanca_e_Arquitetura`, mas só a seção "Regra comercial
  NAR ECO" é efetivamente governança. As demais são conhecimento comercial de marca ou operação
  de agenda — não pertencem a essa pasta em nenhuma hipótese.
- Runtime vs. referência: a seção de governança comercial é uma regra que restringe
  comportamento (nenhuma proposta sem aprovação prévia) e vale para todas as marcas — é candidata
  a SYSTEM do orquestrador, não a um documento de referência passivo.
- Vazamento entre marcas: ao ficar tudo em um único arquivo genérico, um subagente de marca que
  recuperasse este documento por engano teria acesso a case da Eco Clear, link da Gennera e
  posicionamento da EduInfo simultaneamente — exatamente a armadilha 4 de RAG (documento de marca
  recuperável por outro subagente).
- Nome genérico: "Material_de_Apoio_Comercial" não comunica escopo nem dono (ver
  `references/nomenclatura.md`) — sinal típico de documento que virou depósito.
- Nenhum conflito factual encontrado entre as seções nem com outros documentos consultados nesta
  análise (não foram fornecidos outros documentos para comparação — ausência de conflito é
  `INFERIDO` a partir do material disponível, não `VERIFICADO` contra a base inteira).

DECISÃO
SPLIT

OWNER ALVO
Ver SPLIT MAP — não há owner único; o documento cobre NAR ECO (orquestrador), EduInfo, Gennera,
Eco Clear e Agenda.

LOCALIZAÇÃO ALVO
Ver SPLIT MAP

TIPO DE CONHECIMENTO
Misto — ver SPLIT MAP (SYSTEM, RAG, ASSET, WORKFLOW)

SYSTEM: SIM   apenas a seção "Regra comercial NAR ECO" — é regra global que restringe
              comportamento comercial de todas as marcas, necessária para o orquestrador decidir
              como agir (não apenas para responder).
RAG: SIM      posicionamento EduInfo, case Eco Clear, e o texto que explica quando enviar o link
              da Gennera — conhecimento factual/consultável, não necessário para roteamento.

DEPENDÊNCIAS
- A seção de Agendamento depende de (e deveria referenciar, não redefinir) eventuais regras gerais
  de agenda já existentes no subagente Agenda — não verificado neste material; marcar para
  checagem humana antes da migração.
- A regra "Regra comercial NAR ECO" deveria se tornar a fonte canônica de aprovação de proposta
  para todas as marcas; qualquer menção equivalente em documentos de marca deve passar a
  referenciá-la em vez de repeti-la (não verificado — nenhum outro documento foi fornecido para
  checagem cruzada nesta análise).

CONFLITOS
Nenhum identificado dentro deste documento. Não foi possível checar conflito com outros
documentos do ecossistema, pois apenas este arquivo foi fornecido para análise — marcar como
`DESCONHECIDO` até checagem cruzada.

CONTEÚDO A MANTER
Todo o conteúdo é aproveitável — nenhuma seção é obsoleta, duplicada ou dispensável dentro do
material analisado. O problema é 100% de localização/camada, não de qualidade de conteúdo.

CONTEÚDO A MOVER
Todas as 5 seções — ver SPLIT MAP.

CONTEÚDO A REMOVER/ARQUIVAR
Nenhum.

NOME PROPOSTO
Não se aplica ao documento original (é dissolvido pelo SPLIT). Nomes dos documentos de destino
estão no SPLIT MAP.

PRÓXIMA AÇÃO
1. Validação humana da atribuição de camada da seção "Regra comercial NAR ECO" como SYSTEM do
   orquestrador (é a decisão de maior impacto deste relatório — afeta prompt de produção).
2. Confirmar com o dono do subagente Agenda se já existe documento de regras gerais de reunião
   com o qual a seção "Agendamento" deve fazer merge, em vez de virar documento novo isolado.
3. Confirmar que o link da Gennera segue válido (é uma URL externa não verificável neste
   ambiente — status `VERIFICADO` apenas quanto a estar presente no material de origem, não
   quanto à validade atual do link).
4. Após validação, criar os 5 documentos de destino do SPLIT MAP e arquivar o original em
   `00_Governanca_e_Arquitetura/ARCHIVE/`, registrando os destinos.
5. Nenhuma exclusão do arquivo original — apenas ARCHIVE após confirmação de que todo o conteúdo
   foi migrado.
```

## SPLIT MAP

```
SPLIT MAP
Sobre a EduInfo               -> EduInfo_Identidade_e_Posicionamento        -> EduInfo (marca)     -> RAG
Link Gennera                  -> Gennera_Apresentacao_Institucional (asset + nota de quando enviar) -> Gennera (marca) -> ASSET (link) + RAG (regra "quando enviar")
Case Eco Clear                -> Eco_Clear_Cases_e_Provas                   -> Eco Clear (marca)   -> RAG
Regra comercial NAR ECO       -> NAR_ECO_Regras_Comerciais_Globais          -> NAR ECO (orquestrador) -> SYSTEM
Agendamento                   -> Agenda_Regras_de_Reuniao_e_Cancelamento    -> Agenda (transversal) -> WORKFLOW
```

Notas sobre o mapa:

- **Link Gennera** tem dupla natureza: o link em si é ASSET (o material enviável), mas a regra
  "enviar somente após a primeira reunião de diagnóstico, nunca no primeiro contato" é
  conhecimento consultável (RAG) que a Gennera precisa para orientar quando oferecer o material —
  não é regra global de todas as marcas, por isso fica com a marca e não com o orquestrador.
- **Regra comercial NAR ECO** foi tratada como global porque o próprio texto declara
  explicitamente que vale "para EduInfo, Gennera, Eco Clear, Educbank e Vibe Flow Educacional" —
  é o caso descrito em `references/ecossistema.md` como regra comercial que vale para todas as
  marcas, portanto pertence ao orquestrador, não a uma marca específica.
- **Agendamento** vai inteiro para a Agenda porque não há, no texto, nenhum critério de
  qualificação específico de marca misturado à mecânica — é puramente duração de reunião, janela
  de horário e regra de cancelamento, o caso simples descrito nas referências (mover sem SPLIT
  adicional).
- Nenhuma seção fica órfã: as 5 seções do original têm destino explícito acima.
