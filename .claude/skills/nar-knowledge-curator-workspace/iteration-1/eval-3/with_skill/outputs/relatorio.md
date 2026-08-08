# Revisão de curadoria — MODE 1 (documento único)

Resposta curta: **não precisa de ajuste**. O documento está no dono certo, na pasta certa, na camada certa e com escopo único. A decisão é `KEEP` e a análise para aí.

```
DOCUMENTO
00_Indice_Mestre_da_Base_de_Conhecimento — 00_Governanca_e_Arquitetura

PROPÓSITO ATUAL
Mapa da base de conhecimento do ecossistema NAR ECO: quais pastas existem, quem é o dono de
cada uma e qual convenção de nomes se aplica. É isso que ele se propõe a ser e é isso que ele
é na prática — não virou depósito de nada.

DIAGNÓSTICO
Escopo único e coerente. Documentação de arquitetura para leitura humana: sem conteúdo de
marca, sem regra comercial, sem instrução operacional e sem informação de runtime. O próprio
documento declara essa fronteira e remete ao dono canônico de cada tema, o que é exatamente o
comportamento correto de um índice.

Verificações específicas, todas aprovadas:
- Sem vazamento entre marcas — as cinco marcas aparecem só como linhas de estrutura, com
  conteúdo descrito de forma genérica ("Posicionamento, produtos, FAQ, canais da marca").
- Agenda tratada como pasta transversal (06_Agenda), com escopo de agendamento/reagendamento/
  confirmação/follow-up, e não como marca. Correto.
- NAR ECO aparece como orquestrador (governança e archive), não como marca. Correto.
- `03_Eco_Clear` — grafia em duas palavras preservada. Correto.
- Nomenclatura conforme a convenção: prefixo de dois dígitos, snake_case com iniciais
  maiúsculas, sem acentos e sem caracteres especiais.
- A regra "versões substituídas vão para 99_Archive; não se versiona por sufixo no nome" está
  alinhada à política de versionamento e à regra de nunca deletar.
- Seção de manutenção define responsável e gatilho de atualização. É o que falta na maioria
  dos índices e aqui existe.

Nada a corrigir.

DECISÃO
KEEP

OWNER ALVO
NAR ECO (orquestrador) — governança

LOCALIZAÇÃO ALVO
00_Governanca_e_Arquitetura (permanece)

TIPO DE CONHECIMENTO
REFERENCE

SYSTEM: NÃO — o orquestrador não precisa do índice para decidir como agir nem para rotear.
Roteamento se resolve pela tabela de intenção, não pelo mapa de pastas.
RAG: NÃO — documentação de arquitetura em RAG polui a recuperação e pode acabar sendo
respondida ao cliente final. É material de quem mantém a base, não de quem a executa.

DEPENDÊNCIAS
Referenciado (direta ou implicitamente) por todos os documentos de governança e por qualquer
decisão de onde criar documento novo. Depende da estrutura real de pastas: precisa ser
atualizado sempre que uma pasta for criada, renomeada ou trocar de dono.

CONFLITOS
Nenhum identificado dentro do documento. Fica um ponto de verificação, não um conflito: eu
analisei o índice isoladamente, então não posso afirmar que as pastas listadas correspondem
à estrutura real da base — isso é `DESCONHECIDO` até alguém conferir contra o Drive/repositório.

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

## Observação de baixa prioridade (não é ajuste no documento)

A numeração das pastas de marca é sequencial e sem folga (`01`…`06`). Se uma marca nova entrar
no meio da ordem, ou uma sair, a renumeração quebra referências. A convenção geral sugere
deixar espaço (`10`, `20`, `30`) em listas que tendem a crescer no meio.

Isso é uma decisão sobre a **estrutura real de pastas**, não sobre este índice — o índice está
descrevendo corretamente o que existe. Só vale a pena mexer se houver expectativa concreta de
novas marcas; caso contrário, renumerar agora custa mais do que resolve. Fica registrado para
você decidir, não como recomendação de mudança.

## Por que não propus mais nada

Um índice mestre bem escopado, no dono certo e na camada certa, é um dos poucos documentos que
não deveriam ser mexidos. Propor renomeação, divisão ou reescrita aqui geraria trabalho humano
sem nenhum ganho arquitetural — e gastaria a sua confiança nas recomendações que realmente
importam quando aparecer um documento com escopos misturados de verdade.
