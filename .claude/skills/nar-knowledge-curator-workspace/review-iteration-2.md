# nar-knowledge-curator — Relatório de Auditoria (Iteração 2 / Hardening)

Registro canônico da avaliação. Este documento é o registro de auditoria; o HTML
(`review-iteration-1.html`) permanece como evidência visual e não foi alterado nem removido.

---

## 1. Objetivo da skill

`nar-knowledge-curator` atua como Arquiteto de Conhecimento sênior e Arquiteto de Informação
para agentes de IA do ecossistema NAR ECO. Seu papel não é reescrever documentos — é decidir a
arquitetura correta antes de qualquer modificação: quem é o dono de cada bloco de informação,
em qual camada de runtime ele deve existir (SYSTEM, RAG, REFERENCE, WORKFLOW, ASSET, ARCHIVE),
e se o documento deve ser mantido, movido, dividido, fundido, reescrito, deduplicado ou
arquivado. O objetivo final é manter o agente orquestrador (NAR ECO / Nathalia Serrano) leve —
carregando o mapa de roteamento, não o território de conhecimento — e garantir que cada fato
relevante tenha uma única fonte canônica.

## 2. Arquitetura validada

- **Ecossistema**: NAR ECO Soluções como orquestrador (persona Nathalia Serrano, **não** é
  marca); cinco subagentes de marca (EduInfo, Gennera, Eco Clear, Educbank, Vibe Flow
  Educacional); Agenda como subagente **transversal** (não é marca).
- **Dois modos**: MODE 1 — Document Curation (padrão, um documento por vez, ciclo de 7 fases) e
  MODE 2 — Folder Architecture (somente sob pedido explícito, produz matriz consolidada sem
  reescrever ou mover nada).
- **Princípio de economia de SYSTEM**: "o orquestrador precisa do mapa, não do território" —
  formalizado como teste sequencial de 6 perguntas (decide COMO agir → SYSTEM; sabe a resposta →
  RAG/especialista; instrução executável → WORKFLOW; material enviável → ASSET; documentação
  humana → REFERENCE; obsoleto → ARCHIVE).
- **Fonte canônica única**: nunca duplicar automaticamente; indicar documento canônico e
  documentos que devem apenas referenciá-lo; divergência de conteúdo é CONFLITO, não duplicação.
- **Isolamento entre marcas**: conhecimento de uma marca nunca migra para outra; conteúdo
  transversal de agendamento vai sempre para Agenda, independentemente da marca de origem.
- **Governança**: nunca inventar fatos ausentes; nunca resolver conflito silenciosamente; nunca
  deletar (sempre ARCHIVE); classificação de status VERIFICADO/INFERIDO/DESCONHECIDO/CONFLITANTE.
- **"Eco Clear"** sempre em duas palavras.
- **Rewrite** apenas sob pedido explícito, nunca sobrescrevendo o original.
- **Google Drive**: capacidade opcional de leitura; nunca escreve, move, renomeia ou exclui.

Esta arquitetura foi aprovada pelo usuário ao final da Iteração 1 e **não foi alterada** nesta
etapa de hardening.

## 3. Resultado geral do benchmark (Iteração 1)

| Métrica | Com skill | Baseline (sem skill) | Delta |
|---|---|---|---|
| Taxa de acerto nas assertions | **100% (39/39)** | 74% (29/39) | +25 pontos |
| Tempo médio por execução | 100,2s ± 24,3 | 104,7s ± 15,8 | −4,5s |
| Tokens médios por execução | 56.910 ± 2.676 | 40.337 ± 1.403 | +16.573 |

A skill não custa tempo adicional. O custo em tokens (~41% a mais) compra a diferença de
100% vs 74% nas assertions — incluindo os dois erros de papel mais graves observados no
baseline (tratar NAR ECO como marca e tratar Agenda como pasta sem dono, ambos no caso 3).

## 4. Tabela Case 1–5: skill vs baseline

| Caso | Cenário | Pass rate — skill | Pass rate — baseline |
|---|---|---|---|
| 0 — escopo-misturado-split | Playbook omnichannel misturando governança, EduInfo e agendamento | 8/8 (100%) | 7/8 (88%) |
| 1 — conflito-comercial-gennera | Dois documentos com condições comerciais divergentes da Gennera | 7/7 (100%) | 7/7 (100%) |
| 2 — master-prompt-inchado | System prompt único acumulando as 5 marcas, FAQ, agenda e integração n8n | 8/8 (100%) | 6/8 (75%) |
| 3 — governanca-limpa-keep | Índice mestre bem escopado (controle negativo) | 8/8 (100%) | 2/8 (25%) |
| 4 — contaminacao-entre-marcas | Material de apoio comercial misturando EduInfo, Gennera, Eco Clear, regra global e agenda | 8/8 (100%) | 7/8 (88%) |
| **Total** | | **39/39 (100%)** | **29/39 (74%)** |

## 5. Assertions de cada caso

**Caso 0 — escopo-misturado-split**: decisão SPLIT (não KEEP/MOVE) · EduInfo atribuído ao
subagente EduInfo, não ao orquestrador · demonstrações atribuídas ao subagente Agenda · regras
globais (identificação da rede, LGPD, escalonamento) permanecem no orquestrador · SPLIT MAP
presente · nenhum fato inventado · campos obrigatórios do relatório presentes · "Eco Clear"
grafado corretamente.

**Caso 1 — conflito-comercial-gennera**: identifica ≥4 divergências factuais concretas · marca
como CONFLITO/CONFLITANTE · não escolhe vencedor sozinho · indica fonte canônica única a definir
· aponta que o documento comercial não pertence à pasta de governança · recomenda ARCHIVE em vez
de exclusão · "Eco Clear" grafado corretamente.

**Caso 2 — master-prompt-inchado**: SYSTEM restrito a identidade/tom/classificação/roteamento/
governança · catálogos de marca migram para RAG/especialistas · FAQ e canais migram para RAG ·
agendamento migra para Agenda · integração Evolution GO/n8n classificada como WORKFLOW · o
próprio system prompt não é recomendado para indexação como fato em RAG · "Eco Clear" grafado
corretamente.

**Caso 3 — governanca-limpa-keep** (controle negativo): decisão KEEP · sem SPLIT/REWRITE ·
sem renomeação · SYSTEM: NÃO · RAG: NÃO · camada REFERENCE · nenhum problema inventado para
gerar trabalho · "Eco Clear" grafado corretamente.

**Caso 4 — contaminacao-entre-marcas**: EduInfo → EduInfo · Gennera → Gennera · case → Eco Clear
· regra comercial global → orquestrador NAR ECO · agendamento → Agenda · zero contaminação
cruzada entre marcas · "Eco Clear" grafado corretamente · nenhum fato inventado.

## 6. Falhas encontradas no baseline (sem skill)

- **Caso 3 (mais grave)**: transformou um índice mestre íntegro em 16 itens de trabalho.
  Cometeu os dois erros de papel centrais do modelo de ecossistema: afirmou que "Agenda não é
  marca nem pessoa nem agente" e recomendou trocar o dono da pasta `06_Agenda` para NAR ECO
  (contradizendo Agenda como subagente transversal); tratou `nareco` como marca ao citar
  `src/lib/brands.ts`.
- **Caso 2**: manteve FAQ geral do ecossistema e canal institucional dentro do system prompt,
  quando deveriam sair para RAG.
- **Caso 0 e Caso 4**: nunca nomeou o subagente Agenda como destino do conteúdo de agendamento —
  em vez disso, deixou a mecânica de reunião dentro da governança ou de um "agente comercial"
  inexistente na topologia aprovada.
- **Estrutural, nas 5 execuções**: nenhuma produziu um SPLIT MAP no formato seção → destino →
  agente → camada; nenhuma usou o vocabulário de decisão controlado (KEEP/MOVE/SPLIT/MERGE/
  REWRITE/DEDUPLICATE/ARCHIVE) de forma explícita e consistente.

## 7. Comportamento obtido com a skill

Nas 5 execuções com skill (iteração 1), nenhuma decisão saiu do vocabulário controlado, todo
SPLIT produziu SPLIT MAP completo sem seção órfã, todo conteúdo de agendamento foi corretamente
roteado para o subagente Agenda independentemente da marca de origem, nenhuma informação de
marca vazou para outra marca, nenhum fato ausente da fixture foi inventado (lacunas marcadas
DESCONHECIDO/INFERIDO), e o caso de controle (índice mestre correto) recebeu KEEP sem gerar
trabalho de reestruturação artificial.

## 8. Alteração realizada neste hardening

Adicionada uma regra de governança ao `SKILL.md`, na mesma seção das demais regras de "nunca":

> **Nunca apresente percentual ou proporção estimada sem cálculo objetivo sobre o documento.**
> Dizer que "cerca de 3/4 do conteúdo sai do system prompt" sem ter contado linhas, seções ou
> blocos é o mesmo tipo de invenção que inventar um preço — parece preciso e não é. Se você
> contou e pode mostrar a conta, o número é legítimo. Se não contou, descreva o efeito
> qualitativamente: "redução substancial", "a maior parte do conteúdo sai de SYSTEM", "poucos
> blocos permanecem". Precisão falsa é pior que imprecisão honesta.

Nenhuma outra regra, pasta ou abstração foi introduzida. A arquitetura aprovada na Iteração 1
permanece intacta.

## 9. Resultado do teste de regressão

Reexecutadas as 5 execuções `with_skill` (mesmas fixtures, mesmos prompts, skill com a regra de
hardening) e gradadas contra as mesmas 39 assertions da Iteração 1.

| Eval | Pass rate — Iteração 1 | Pass rate — Iteração 2 (pós-hardening) |
|---|---|---|
| 0 — escopo-misturado-split | 8/8 (100%) | 8/8 (100%) |
| 1 — conflito-comercial-gennera | 7/7 (100%) | 7/7 (100%) |
| 2 — master-prompt-inchado | 8/8 (100%) | 8/8 (100%) |
| 3 — governanca-limpa-keep | 8/8 (100%) | 8/8 (100%) |
| 4 — contaminacao-entre-marcas | 8/8 (100%) | 8/8 (100%) |
| **Total** | **39/39 (100%)** | **39/39 (100%)** |

**Regressão: nenhuma.** Todas as 39 assertions continuam passando, avaliadas de forma
independente (não reaproveitando os veredictos da iteração 1).

**Verificação específica do hardening**: no caso 2 (master-prompt-inchado — o cenário mais
propenso a estimativas de redução), a versão anterior do relatório dizia *"cerca de 3/4 do
documento sai do system prompt"* (estimativa sem cálculo mostrado). A versão pós-hardening usa
linguagem qualitativa (*"a maior parte do conteúdo não sobrevive à pergunta 1"*) combinada com
uma contagem objetiva extraída da própria tabela SPLIT MAP produzida no relatório. Os
percentuais que aparecem nos demais casos (10%, 15%, 30% no caso 1; "100%" nos casos 0 e 4) são
valores verificados copiados das fixtures ou afirmações categóricas sobre natureza do conteúdo —
não estimativas de redução de SYSTEM, portanto fora do escopo desta regra e não constituem
violação.

## 10. Regras arquiteturais validadas

- NAR ECO Soluções e Agenda nunca são tratados como marca nas execuções com skill.
- "Eco Clear" grafado em duas palavras em 100% das execuções com skill.
- Conflito factual entre documentos nunca é resolvido silenciosamente — sempre marcado
  CONFLITANTE e encaminhado para validação humana.
- Nenhuma exclusão destrutiva é recomendada — ARCHIVE em todos os casos aplicáveis.
- Documento corretamente escopado recebe KEEP sem geração de trabalho artificial.
- Conteúdo de agendamento é roteado ao subagente Agenda independentemente da marca de origem.
- SYSTEM permanece restrito a identidade, tom global, classificação de intenção, roteamento e
  governança — conteúdo consultável (catálogos, FAQ, objeções, cases) migra para RAG ou
  especialista.
- Estimativas de redução de SYSTEM não são apresentadas como percentual sem cálculo mostrado
  (regra introduzida nesta iteração, verificada sem regressão).

## 11. Limitações conhecidas

- O conjunto de evals cobre 5 cenários; não testa folder-level (MODE 2) nem o fluxo de rewrite
  explícito (Fase 6), que permanecem sem cobertura de eval dedicada.
- A assertion "Eco Clear em duas palavras" passa por vacuidade em execuções onde a marca não é
  citada (observação já registrada na Iteração 1, não é regressão desta etapa).
- O grader e as execuções de eval rodam no mesmo ambiente de subagentes usado para desenvolver a
  skill; não houve teste com Google Drive real conectado, apenas fixtures em texto.
- O caso 3 mostrou que a skill, ao ficar disciplinadamente dentro do escopo do documento
  analisado, pode não capturar dependências declaradas em documentos vizinhos (ex.: conflito de
  numeração de pasta citado em outra fixture). Isso não foi alterado nesta etapa por instrução
  explícita de não introduzir novas regras.

## 12. Decisão final

**APPROVED**

Justificativa: arquitetura aprovada na Iteração 1 permanece intacta; hardening pontual aplicado
sem introduzir novas regras, pastas ou abstrações; teste de regressão confirma 39/39 assertions
preservadas; hardening de percentuais verificado como efetivo no caso crítico (eval-2).

## 13. Commit

`3b67b1a` — `fix(skills): endurece nar-knowledge-curator contra percentuais estimados`
(branch `claude/skill-creator-2skjyh`, repositório `rufas2025/nar-crm`)

Commits subsequentes de evidência de teste (execuções de regressão e gradings), mesma branch:
`68270ff`, `8a5d1ee`.

## 14. Caminho do pacote `.skill`

`.claude/skills/nar-knowledge-curator-workspace/package/nar-knowledge-curator.skill`

Empacotado a partir de `.claude/skills/nar-knowledge-curator/` (SKILL.md + references/ + assets/;
evals/ e fixtures/ excluídos do pacote por design do empacotador). **Não instalado** — aguardando
autorização explícita do usuário.
