# Curadoria — Gennera: condições comerciais divergentes

Dois documentos cobrem o mesmo território (condições comerciais Gennera) e **discordam em
quase todos os números**. Isso não é duplicação — é **CONFLITO**, e não foi resolvido aqui.
Nenhuma das duas versões foi escolhida como "a certa"; isso exige decisão humana.

## Resumo do conflito (lado a lado)

| Item | `caso2a_gennera_condicoes_comerciais.md` (pasta `03_Gennera`) | `caso2b_gennera_tabela_comercial_2025.md` (pasta `00_Governanca_e_Arquitetura`) |
|---|---|---|
| Modelo de contratação | Assinatura anual, faturamento mensal | Assinatura anual, faturamento mensal + opção semestral para pilotos |
| Até 500 alunos | R$ 4,90/aluno/mês | R$ 5,40/aluno/mês |
| 501–1.500 alunos | R$ 4,20/aluno/mês | R$ 4,70/aluno/mês |
| Acima de 1.500 alunos | Sob consulta | R$ 3,90/aluno/mês |
| Prazo mínimo | 12 meses | 12 meses (igual — sem conflito) |
| Taxa de implantação | R$ 3.500,00, parcelável em 3x | Isenta se fechado no 1º semestre |
| Reajuste | IPCA anual | IPCA anual (igual — sem conflito) |
| Desconto pagto. anual antecipado | 10% | 15% |
| Cancelamento | Multa de 30% sobre saldo remanescente | Aviso prévio de 60 dias, sem multa |
| Prazo de implantação | 45 dias | 60 dias |
| Suporte | Chat/e-mail seg-sex 8h-18h; telefone só acima de 1.500 alunos | Chat/e-mail/telefone seg-sex 8h-18h para todas as faixas |
| Vigência declarada | Nenhuma data declarada | Cabeçalho diz "Tabela vigente — revisão comercial 2025" |

Status de cada fato acima: `CONFLITANTE`. Nenhum dos dois documentos permite inferir qual
valor está correto — não há data de vigência no caso2a, e "revisão comercial 2025" no caso2b é
um indício, não uma prova (não diz se substitui o caso2a ou se é uma proposta ainda não
aprovada).

## O que fazer com isso (ação recomendada)

1. **Não usar nenhum dos dois documentos como fonte para o agente Gennera até a validação
   humana.** Enquanto o conflito não for resolvido por alguém com autoridade comercial
   (ex.: responsável comercial da Gennera / NAR ECO), qualquer resposta ao cliente baseada
   nesses números tem ~50% de chance de citar o preço errado.
2. **Levar às duas versões para o dono comercial da conta Gennera** com a tabela acima e
   perguntar diretamente: qual tabela está em vigor hoje (08/2026)? O caso2b já está em
   `00_Governanca_e_Arquitetura`, o que é em si um problema de arquitetura (ver abaixo),
   e seu cabeçalho sugere que é a versão mais recente — mas isso é uma pista, não uma
   confirmação, e não deve ser tratado como resposta.
3. **Depois da validação humana**: uma única fonte canônica passa a existir; a outra vira
   `ARCHIVE` (nunca deletar) com uma nota indicando qual documento a substituiu e a data da
   decisão.

---

## Relatório por documento

### DOCUMENTO
`caso2a_gennera_condicoes_comerciais.md` — pasta atual `03_Gennera`

**PROPÓSITO ATUAL**
Descrever as condições comerciais (preços, prazos, suporte) da Gennera. Documento sem data de
vigência declarada.

**DIAGNÓSTICO**
Escopo correto (é conteúdo de marca Gennera, na pasta certa). Conteúdo é factual/consultável,
não decisório — não pertence a SYSTEM. Problema real: divergência de valores frente ao caso2b
(ver seção de conflito acima) e ausência de data/versão, o que — segundo a armadilha 5 de RAG
(`references/camadas-de-conhecimento.md`) — é exatamente o cenário que produz recuperação não
determinística caso os dois documentos entrem em RAG simultaneamente.

**DECISÃO**
`KEEP` a localização e o escopo de marca — mas **NÃO indexar em RAG até o conflito ser
resolvido**. Após validação humana: se este for o documento correto, adicionar data de vigência
e seguir para RAG; se for o obsoleto, `ARCHIVE`.

**OWNER ALVO**
Gennera

**LOCALIZAÇÃO ALVO**
`03_Gennera` (inalterada — já está no lugar certo)

**TIPO DE CONHECIMENTO**
RAG (condicional à resolução do conflito)

**SYSTEM: NÃO** — preços e condições comerciais são conteúdo consultável, não decisório; o
agente não precisa disso para decidir quem responde.
**RAG: SIM, mas suspenso** — é exatamente o tipo de fato que o subagente Gennera precisa
recuperar quando perguntado, porém não deve entrar no índice enquanto divergir do caso2b sem
marcação de vigência.

**DEPENDÊNCIAS**
Conflita diretamente com `caso2b_gennera_tabela_comercial_2025.md`. Qualquer resposta comercial
do subagente Gennera depende de qual dos dois vence.

**CONFLITOS**
Ver tabela comparativa acima — CONFLITANTE em: faixas de preço (3 itens), taxa de implantação,
desconto de pagamento antecipado, multa/condição de cancelamento, prazo de implantação, e
abrangência do suporte telefônico. Requer decisão humana; não resolvido neste relatório.

**CONTEÚDO A MANTER**
Estrutura e todo o conteúdo, pendente de confirmação de qual versão é vigente.

**CONTEÚDO A MOVER**
Nenhum.

**CONTEÚDO A REMOVER/ARQUIVAR**
Nenhum agora. Se for confirmado como a versão obsoleta, o documento inteiro vai para
`ARCHIVE` (nunca deletar).

**NOME PROPOSTO**
Inalterado — mas recomenda-se adicionar data de vigência ao corpo do documento assim que
resolvido (ex.: "vigente até validação 2026" ou a data real aprovada), para não repetir este
mesmo problema no futuro.

**PRÓXIMA AÇÃO**
Aguardar validação humana do dono comercial da conta Gennera sobre qual tabela de preços está
em vigor. Até lá, não usar em RAG nem repassar valores ao cliente.

---

### DOCUMENTO
`caso2b_gennera_tabela_comercial_2025.md` — pasta atual `00_Governanca_e_Arquitetura`

**PROPÓSITO ATUAL**
Também descreve condições comerciais da Gennera (mesmo território do caso2a), com cabeçalho
"Tabela vigente — revisão comercial 2025".

**DIAGNÓSTICO**
Dois problemas distintos, e é importante não misturá-los:

1. **Conflito de conteúdo** com o caso2a — ver tabela acima. Mesmo status: `CONFLITANTE`.
2. **Problema de arquitetura independente do conflito**: este documento é conteúdo comercial
   específico da marca Gennera (preços, prazos, condições de cancelamento), mas está guardado
   em `00_Governanca_e_Arquitetura`. Isso é vazamento de conhecimento de marca para uma pasta
   de governança/orquestração — o mesmo tipo de erro que a skill trata como "conhecimento de
   marca não pertence ao orquestrador". `00_Governanca_e_Arquitetura` deveria conter
   arquitetura, decisões e políticas internas (REFERENCE), não uma tabela de preços de uma
   marca específica. Isso existiria mesmo que o caso2a não existisse.

**DECISÃO**
`MOVE` para `03_Gennera` (correção de pasta, independente da resolução do conflito) +
suspensão de uso até validação humana do conflito de valores, igual ao caso2a.

**OWNER ALVO**
Gennera (não NAR ECO/Governança — o cabeçalho "vigente" não muda a propriedade do conteúdo)

**LOCALIZAÇÃO ALVO**
`03_Gennera`

**TIPO DE CONHECIMENTO**
RAG (condicional à resolução do conflito)

**SYSTEM: NÃO** — mesma justificativa do caso2a: preço/condição comercial é conteúdo
consultável, não decisório.
**RAG: SIM, mas suspenso** — pelo mesmo motivo do caso2a.

**DEPENDÊNCIAS**
Conflita diretamente com `caso2a_gennera_condicoes_comerciais.md`.

**CONFLITOS**
Mesmos itens listados na tabela comparativa acima. O rótulo "Tabela vigente — revisão comercial
2025" no cabeçalho é um indício de que esta possa ser a versão mais recente, mas é
`INFERIDO`, não `VERIFICADO` — o documento não declara o que substituiu, nem se foi
formalmente aprovado, nem uma data específica de vigência. Não deve ser tratado como critério
de desempate sem confirmação humana.

**CONTEÚDO A MANTER**
Estrutura e todo o conteúdo, pendente de confirmação.

**CONTEÚDO A MOVER**
O documento inteiro deve migrar de `00_Governanca_e_Arquitetura` para `03_Gennera` — essa
correção de pasta é independente da resolução do conflito de preços e pode ser executada assim
que o humano confirmar.

**CONTEÚDO A REMOVER/ARQUIVAR**
Nenhum agora. Se confirmado como a versão obsoleta frente ao caso2a, vai para `ARCHIVE`.

**NOME PROPOSTO**
Inalterado no conteúdo; ao mover para `03_Gennera`, alinhar ao padrão de nomenclatura de marca
(ex.: `Gennera_Condicoes_Comerciais_2025`) para evitar dois documentos com nomes que não deixam
óbvio que competem pelo mesmo papel.

**PRÓXIMA AÇÃO**
1. Mover para `03_Gennera` (correção estrutural, não depende do conflito).
2. Aguardar validação humana do dono comercial sobre qual tabela de preços vigora.
3. Após a decisão, arquivar a versão descartada com nota de substituição e data.

---

## Nota de arquitetura (RAG)

Enquanto o conflito não for resolvido, **nenhum dos dois documentos deve ser indexado em RAG**
simultaneamente. Isso é a armadilha 5 documentada em
`references/camadas-de-conhecimento.md`: duas versões do mesmo fato no índice, sem marcação de
status/vigência, produzem recuperação não determinística — o subagente Gennera responderia com
um preço ou outro dependendo de qual chunk o ranking trouxer, sem que ninguém perceba o porquê.
