# Curadoria — MODE 1 (Document Curation)

```
DOCUMENTO
Material_de_Apoio_Comercial — 00_Governanca_e_Arquitetura

PROPÓSITO ATUAL
Pretende ser um material de apoio comercial único. Na prática virou um caderno de anotações de
reunião: cinco blocos com cinco donos diferentes, empilhados por ordem de conversa e não por
arquitetura. Nome genérico ("Material de Apoio") e pasta de governança fizeram o resto — o
documento virou depósito por gravidade.

DIAGNÓSTICO
Cinco escopos distintos, quatro donos distintos, quatro camadas distintas.

- Posicionamento EduInfo: conhecimento de marca dentro de pasta de governança. Não é recuperável
  pelo subagente da EduInfo hoje e, se indexado onde está, é recuperável por quem pergunta de
  outra marca (armadilha 4 do RAG).
- Link Gennera: dois objetos misturados no mesmo bloco — o material enviável (ASSET) e a regra de
  quando enviá-lo (conhecimento da marca). Precisam de camadas diferentes.
- Case Eco Clear: prova social de marca, com números e autorização de uso. Mesmo problema de
  isolamento do bloco EduInfo — um case da Eco Clear aparecendo numa resposta sobre Gennera não é
  ruído, é atribuição errada.
- Regra comercial NAR ECO: este bloco é o único genuinamente global — o próprio texto enumera as
  cinco marcas. É governança que restringe comportamento, e precisa valer sempre, não apenas
  quando a recuperação por acaso a trouxer (armadilha 1 do RAG).
- Agendamento: mecânica transversal de reunião (duração, janela, pré-requisito, cancelamento).
  Pertence à Agenda, não à governança e não a nenhuma marca. É o sinal clássico: o documento fala
  de "o que vendemos" e de repente explica como marcar a reunião.

Sem contradições internas. Verbosidade baixa — o problema aqui não é texto sobrando, é
propriedade misturada. Nada obsoleto identificado.

Um único bloco (a regra comercial global) justifica a pasta atual. Os outros quatro estão lá por
acidente de origem, não por decisão.

DECISÃO
SPLIT

OWNER ALVO
NAR ECO (orquestrador) · EduInfo · Gennera · Eco Clear · Agenda

LOCALIZAÇÃO ALVO
Ver SPLIT MAP

TIPO DE CONHECIMENTO
Misto — resolvido bloco a bloco no SPLIT MAP

SYSTEM: SIM — apenas a regra comercial global (aprovação prévia de proposta e alçada de
desconto). É restrição de comportamento válida para todas as marcas.

RAG: SIM — posicionamento EduInfo, regra de envio da apresentação Gennera e case Eco Clear, cada
um no índice isolado da sua marca. NÃO para a regra global (governança) nem para as regras de
agendamento (operação).

DEPENDÊNCIAS
- Gennera -> Agenda: "enviar somente após a primeira reunião de diagnóstico" depende da definição
  de reunião de diagnóstico, que passa a viver na Agenda. Registrar referência cruzada; não
  duplicar a definição.
- Agenda -> CRM: a regra de cancelamento exige registro de justificativa no CRM. Dependência de
  sistema externo, a documentar no destino.
- Regra comercial global -> todas as cinco marcas: cada subagente de marca referencia a regra
  canônica do orquestrador; nenhum a repete no próprio conteúdo.
- A regra de "reunião de proposta só após diagnóstico realizada e registrada" depende de onde o
  registro acontece (CRM). DESCONHECIDO: quem registra e em que campo.

CONFLITOS
Nenhum conflito interno ao documento. Nenhum conflito externo pôde ser verificado — a análise
cobriu apenas este arquivo. Antes de executar o split, confirmar se já existem documentos de
Agenda, de governança comercial ou de cases das marcas cobrindo o mesmo terreno; se existirem, o
tratamento vira DEDUPLICATE/MERGE e a fonte canônica precisa ser decidida por bloco.

Pontos a validar com humano (não inventados aqui):
- "Alçada padrão" de desconto: DESCONHECIDO — o valor/percentual não está no material.
- "Responsável comercial da conta": DESCONHECIDO — papel citado, pessoa não nomeada.
- Formato do material Gennera: INFERIDO como landing page de material institucional a partir da
  URL; se for PDF, o asset canônico é o arquivo e o link é apenas o meio de entrega.
- Vigência: a apresentação Gennera carrega "2025" na URL e o case Eco Clear é de 2024. Registrar
  status/data dentro dos documentos de destino, nunca no nome do arquivo.

CONTEÚDO A MANTER
Na pasta de governança, apenas a regra comercial global (aprovação prévia de proposta + alçada de
desconto). Todo o resto sai.

CONTEÚDO A MOVER
- Sobre a EduInfo (posicionamento complementar, público-alvo, argumento de conversão) -> EduInfo
- Link e regra de envio da apresentação institucional -> Gennera (asset + regra de uso)
- Case Rede Semear, números e autorização de uso -> Eco Clear
- Duração, janelas, pré-requisito e cancelamento de reuniões -> Agenda

CONTEÚDO A REMOVER/ARQUIVAR
Nenhum conteúdo obsoleto. Após o split, o arquivo original vai para ARCHIVE/ registrando os cinco
documentos que o substituíram — não deletar.

NOME PROPOSTO
Documento remanescente na governança: NAR_ECO_Regras_Comerciais_Globais
O nome atual ("Material_de_Apoio_Comercial") é descartado: não diz escopo nem dono, e é
exatamente o tipo de nome que atraiu esta bagunça.

PRÓXIMA AÇÃO
1. Inventariar as pastas de destino antes de criar documento novo (evitar segunda fonte da verdade
   de Agenda ou de cases).
2. Validar com o humano os quatro DESCONHECIDOS acima — em especial a alçada de desconto, que hoje
   torna a regra global inexecutável na prática.
3. Executar o split na ordem: governança primeiro (é a canônica que as outras referenciam), depois
   Agenda, depois os três documentos de marca.
4. Não reescrever nada ainda — rewrite só sob pedido explícito.
```

```
SPLIT MAP
Sobre a EduInfo                  -> EduInfo_Identidade_e_Posicionamento    -> EduInfo               -> RAG
Link Gennera (o material)        -> Gennera_Apresentacao_Institucional     -> Gennera               -> ASSET
Link Gennera (quando enviar)     -> Gennera_Regras_de_Envio_de_Materiais   -> Gennera               -> RAG
Case Eco Clear (Rede Semear)     -> Eco_Clear_Cases_e_Provas               -> Eco Clear             -> RAG
Regra comercial (todas as marcas)-> NAR_ECO_Regras_Comerciais_Globais      -> NAR ECO (orquestrador)-> SYSTEM
Agendamento (tipos e duração)    -> Agenda_Regras_de_Reuniao               -> Agenda                -> WORKFLOW
Agendamento (cancelamento)       -> Agenda_Regras_de_Reuniao               -> Agenda                -> WORKFLOW
Cabeçalho/origem do documento    -> ARCHIVE/Material_de_Apoio_Comercial    -> NAR ECO (governança)  -> ARCHIVE
```

Nenhuma seção do original ficou órfã: as cinco seções têm destino, e o cabeçalho de origem é
preservado no arquivamento para manter a decisão auditável.

## Por que cada peça vai para onde vai

**Sobre a EduInfo → EduInfo, RAG.** É posicionamento e argumento de venda de uma marca. O
orquestrador não precisa disso para rotear: basta saber que EduInfo trata de gestão escolar. O
detalhe (solução complementar, público de coordenação e secretaria, implantação sem migração) é
o que o especialista usa para *responder*, e responder é trabalho dele.

**Link Gennera → dois destinos.** O material enviável é ASSET; a regra "somente após a primeira
reunião de diagnóstico, nunca no primeiro contato" é conhecimento comercial da Gennera e vive em
RAG. Colar o texto do material dentro do prompt ou do RAG é o erro clássico da camada ASSET — o
agente precisa saber que o material existe e quando enviá-lo, não reproduzi-lo.

**Case Eco Clear → Eco Clear, RAG.** Prova social é da marca, com escopo de recuperação isolado.
A autorização de uso em material comercial é VERIFICADO e deve viajar junto com o case, dentro do
documento — ela é parte do fato, não metadado descartável.

**Regra comercial NAR ECO → orquestrador, SYSTEM.** Este é o único bloco que passa no teste 1. O
texto enumera explicitamente as cinco marcas, então não é regra de marca escrita por acaso em
documento do NAR ECO — é genuinamente global. E é governança: precisa restringir comportamento
sempre, não probabilisticamente. Cada subagente de marca referencia; nenhum copia. Quando a
alçada mudar, um único lugar é editado.

**Agendamento → Agenda, WORKFLOW.** Agenda é subagente transversal, não marca. Duração, janela de
atendimento, pré-requisito entre tipos de reunião e prazo de cancelamento são mecânica executável
e valem para qualquer marca. Não há aqui nenhum critério de qualificação específico de marca —
então o bloco migra inteiro, sem split interno.
