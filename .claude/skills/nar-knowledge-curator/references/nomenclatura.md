# Nomenclatura de pastas e documentos

Um nome de documento tem uma função: dizer, sem abrir o arquivo, **qual é o escopo e quem é o
dono**. Nomes genéricos são a assinatura de uma base que cresceu sem arquitetura — e são a
razão pela qual ninguém sabe qual documento é a fonte da verdade.

## Nomes a evitar

`Informações gerais` · `Base completa` · `Documento final` · `Informações importantes` ·
`Documento atualizado` · `Novo` · `v2 final FINAL`

O problema não é estético. Nenhum desses nomes permite responder "onde está a regra de
cancelamento?" sem abrir tudo, e nenhum deles sinaliza propriedade — então o conteúdo migra
para lá por gravidade e o documento vira depósito.

## Padrão numerado

Quando a ordem de leitura importa (pastas de marca, onboarding de agente), o padrão numerado
funciona bem:

```
01_Identidade_e_Posicionamento
02_Produtos_e_Solucoes
03_FAQ_e_Objecoes
04_Tom_de_Voz
05_Canais_Oficiais
```

Convenções: prefixo de dois dígitos; `snake_case` com iniciais maiúsculas; sem acentos e sem
caracteres especiais (compatibilidade com Drive, n8n e pipelines de indexação); escopo antes de
detalhe.

Deixe espaço entre os números quando a lista tende a crescer no meio (`10`, `20`, `30`) — assim
inserir um documento novo não obriga a renumerar todos os seguintes, o que quebraria referências.

## Quando não usar o padrão numerado

Não imponha a numeração mecanicamente. Ela serve bem a conjuntos pequenos, estáveis e com ordem
natural de leitura. Serve mal quando:

- a pasta é um índice de temas sem ordem intrínseca (o número vira ruído e sugere hierarquia que
  não existe);
- o conjunto muda com frequência (a renumeração cria trabalho e quebra links);
- o documento é recuperado por RAG, onde o título deve espelhar o vocabulário da pergunta do
  usuário — `Precos_e_Condicoes_Comerciais_EduInfo` recupera melhor que `03_Comercial`.

## Sinalização de propriedade

Quando um documento pode ser confundido entre marcas, inclua o dono no nome:

```
EduInfo_FAQ_e_Objecoes
Gennera_Precos_e_Condicoes
Eco_Clear_Cases_e_Provas
Agenda_Regras_de_Reagendamento
NAR_ECO_Governanca_e_Compliance
```

Em nome de arquivo, `Eco Clear` vira `Eco_Clear` — duas palavras separadas por underscore, nunca
`EcoClear`.

## Versionamento e status

Não versione por nome de arquivo (`_v2`, `_final`): isso produz exatamente a coexistência de
versões que degrada o RAG. Mantenha um documento vigente e mova o substituído para `ARCHIVE/`,
registrando dentro do arquivado o que o substituiu e quando.

Quando a informação tem vigência (preços, condições, calendário), registre status e data
**dentro** do documento, não no nome — assim a recuperação carrega o status junto com o fato.
