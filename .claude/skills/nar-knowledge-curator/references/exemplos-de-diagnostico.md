# Exemplos de diagnóstico

Dois exemplos completos: um SPLIT e um KEEP. O segundo é tão importante quanto o primeiro — ele
mostra como é um documento que **não** deve ser mexido, que é a decisão mais fácil de errar por
excesso de zelo.

---

## Exemplo 1 — documento com escopos misturados (SPLIT)

**Entrada** (resumo): documento `Playbook_Comercial.docx`, na pasta de governança. Contém: (a)
regra global de que todo atendimento inicia identificando a rede de ensino; (b) três parágrafos
de posicionamento da Gennera com a lista de módulos do sistema; (c) a política de que
demonstrações só são agendadas às terças e quintas, com link de agendamento e responsável.

**Relatório**

```
DOCUMENTO
Playbook_Comercial.docx — 00_Governanca_e_Arquitetura

PROPÓSITO ATUAL
Playbook comercial genérico; na prática acumulou governança, conteúdo de marca e regra de agenda.

DIAGNÓSTICO
Três escopos distintos em um único documento, com três donos diferentes. A regra de identificação
inicial é global e hoje só existe aqui — é canônica e está em pasta correta. O bloco da Gennera é
conhecimento de marca em documento de governança: infla o escopo do orquestrador e não é
recuperável pelo subagente da Gennera. As regras de demonstração são operação de agendamento e
pertencem à Agenda. Verbosidade moderada; sem contradições internas.

DECISÃO
SPLIT

OWNER ALVO
NAR ECO (orquestrador) · Gennera · Agenda

LOCALIZAÇÃO ALVO
Ver SPLIT MAP

TIPO DE CONHECIMENTO
Misto — resolvido por bloco no SPLIT MAP

SYSTEM: SIM (apenas a regra global de abertura de atendimento)
RAG: SIM (bloco Gennera, no índice isolado da marca)

DEPENDÊNCIAS
A regra de qualificação prévia à demo depende do posicionamento Gennera (critério de porte da
rede). Registrar referência cruzada Agenda -> Gennera; não duplicar o critério.

CONFLITOS
Nenhum conflito factual identificado.

CONTEÚDO A MANTER
Regra global de identificação da rede no início do atendimento.

CONTEÚDO A MOVER
Posicionamento e módulos Gennera -> subagente Gennera.
Regras, link e responsável de demonstração -> subagente Agenda.

CONTEÚDO A REMOVER/ARQUIVAR
Nenhum. Nada aqui está obsoleto.

NOME PROPOSTO
NAR_ECO_Regras_Globais_de_Atendimento (documento remanescente)

PRÓXIMA AÇÃO
Validar com o humano a fronteira do critério de qualificação (marca x agenda) antes de executar
o split. Não reescrever ainda.
```

```
SPLIT MAP
Regra de identificação da rede   -> NAR_ECO_Regras_Globais_de_Atendimento -> NAR ECO (orquestrador) -> SYSTEM
Posicionamento e módulos Gennera -> Gennera_Posicionamento_e_Solucoes     -> Gennera              -> RAG
Regras/link/responsável de demo  -> Agenda_Regras_de_Demonstracao         -> Agenda               -> WORKFLOW
```

Note o que o relatório **não** fez: não escolheu sozinho onde fica o critério de qualificação
(fronteira genuinamente ambígua → validação humana), não reescreveu nada, e não inventou o nome
do responsável que o documento não trazia.

---

## Exemplo 2 — documento correto (KEEP)

**Entrada** (resumo): `00_Indice_Mestre_da_Base_de_Conhecimento`, na pasta de governança. Lista
as pastas da base, o dono de cada uma e a convenção de nomes. Sem conteúdo de marca, sem regra
operacional.

**Relatório**

```
DOCUMENTO
00_Indice_Mestre_da_Base_de_Conhecimento — 00_Governanca_e_Arquitetura

PROPÓSITO ATUAL
Mapa da base de conhecimento: pastas, donos e convenção de nomenclatura.

DIAGNÓSTICO
Escopo único e coerente. Documentação de arquitetura para leitura humana, sem conteúdo de marca,
sem regra operacional e sem informação de runtime. É a fonte canônica do mapa da base e não
compete com nenhum outro documento. Nada a corrigir.

DECISÃO
KEEP

OWNER ALVO
NAR ECO (orquestrador) — governança

LOCALIZAÇÃO ALVO
00_Governanca_e_Arquitetura (permanece)

TIPO DE CONHECIMENTO
REFERENCE

SYSTEM: NÃO — o orquestrador não precisa do índice para rotear.
RAG: NÃO — documentação de arquitetura em RAG polui a recuperação e pode vazar ao cliente.

DEPENDÊNCIAS
Referenciado por todos os documentos de governança. Deve ser atualizado quando pastas mudarem.

CONFLITOS
Nenhum.

CONTEÚDO A MANTER
Todo.

CONTEÚDO A MOVER
Nenhum.

CONTEÚDO A REMOVER/ARQUIVAR
Nenhum.

NOME PROPOSTO
00_Indice_Mestre_da_Base_de_Conhecimento (inalterado)

PRÓXIMA AÇÃO
Nenhuma ação de curadoria. Manter atualizado conforme a arquitetura evoluir.
```

Um documento no dono certo, na camada certa, com escopo único, recebe KEEP e a análise termina
aí. Propor renomeação, divisão ou reescrita aqui geraria trabalho humano sem ganho arquitetural.
