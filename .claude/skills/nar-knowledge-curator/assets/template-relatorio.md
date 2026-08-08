# Template — relatório de curadoria (MODE 1)

Um relatório por documento. Preencha todos os campos; quando um campo não se aplicar, escreva
`Nenhum` ou `Não se aplica` em vez de omitir — a ausência de um campo é ambígua, o "nenhum" é
uma informação.

```
DOCUMENTO
<nome atual — pasta atual>

PROPÓSITO ATUAL
<o que o documento se propõe a ser, e o que ele virou na prática>

DIAGNÓSTICO
<escopos presentes, duplicação, obsolescência, contradições, verbosidade,
 runtime vs referência>

DECISÃO
KEEP | MOVE | SPLIT | MERGE | REWRITE | DEDUPLICATE | ARCHIVE

OWNER ALVO
<NAR ECO (orquestrador) | EduInfo | Gennera | Eco Clear | Educbank |
 Vibe Flow Educacional | Agenda>

LOCALIZAÇÃO ALVO
<pasta de destino, ou "ver SPLIT MAP">

TIPO DE CONHECIMENTO
SYSTEM | RAG | REFERENCE | WORKFLOW | ASSET | ARCHIVE

SYSTEM: SIM/NÃO   <justificar em uma linha>
RAG: SIM/NÃO      <justificar em uma linha>

DEPENDÊNCIAS
<documentos ou agentes que dependem deste, ou dos quais este depende>

CONFLITOS
<divergências factuais com outros documentos, marcadas para validação humana;
 nunca resolvidas aqui>

CONTEÚDO A MANTER
CONTEÚDO A MOVER
CONTEÚDO A REMOVER/ARQUIVAR

NOME PROPOSTO
<nome novo, ou "inalterado">

PRÓXIMA AÇÃO
<o próximo passo concreto, incluindo o que precisa de validação humana antes>
```

Status de fato, quando relevante: `VERIFICADO` · `INFERIDO` · `DESCONHECIDO` · `CONFLITANTE`.
