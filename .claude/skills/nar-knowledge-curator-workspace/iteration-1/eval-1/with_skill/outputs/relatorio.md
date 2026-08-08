# Curadoria NAR ECO — Gennera: dois documentos comerciais divergentes

**Modo:** MODE 1 (curadoria documento a documento), aplicado aos dois documentos indicados.
**Prioridade de revisão:** `ALTA` — há conflito factual ativo sobre preço em material comercial, e as duas versões coexistem hoje sem status de vigência.

---

## Leitura curta antes do detalhe

Isto **não é duplicação** — é **CONFLITO**. Duplicação é o mesmo fato em dois lugares; aqui os dois documentos afirmam coisas diferentes sobre preço, taxa de implantação, desconto, multa de cancelamento, prazo de implantação e suporte. Não existe fusão automática possível: alguém precisa dizer qual tabela está valendo.

Eu **não vou escolher** qual está certa. Escolher a mais recente, a mais detalhada ou a que parece mais plausível seria inventar com passos extras — e o custo de errar aqui é uma proposta comercial errada enviada a uma escola.

O problema arquitetural, além do conflito, é que essas duas versões estão **ambas ativas e sem marcação de vigência**. Se as duas estiverem indexadas em RAG, a resposta do subagente Gennera sobre "quanto custa" depende de qual chunk ganhou o ranking naquela consulta. Isso é recuperação não determinística de informação de preço.

Há ainda um segundo problema, independente do conflito: `Gennera_Tabela_Comercial_2025` está em `00_Governanca_e_Arquitetura`. Tabela de preço de marca não é governança. É conhecimento comercial da Gennera que por acaso foi salvo em pasta de governança — vazamento de escopo clássico.

---

## Tabela de conflitos (para decisão humana)

Todos os itens abaixo estão com status `CONFLITANTE`. Nenhum foi resolvido.

| Item | caso2a — `Gennera_Condicoes_Comerciais` (`03_Gennera`) | caso2b — `Gennera_Tabela_Comercial_2025` (`00_Governanca_e_Arquitetura`) | Impacto |
|---|---|---|---|
| Preço até 500 alunos | R$ 4,90 aluno/mês | R$ 5,40 aluno/mês | Proposta errada / receita |
| Preço 501–1.500 alunos | R$ 4,20 aluno/mês | R$ 4,70 aluno/mês | Proposta errada / receita |
| Acima de 1.500 alunos | Sob consulta | R$ 3,90 aluno/mês | Muda o processo de venda, não só o número |
| Taxa de implantação | R$ 3.500,00, em até 3x | Isenta no 1º semestre | Valor de entrada da proposta |
| Desconto pagamento antecipado | 10% | 15% | Desconto concedido a maior/menor |
| Cancelamento | Multa de 30% do saldo remanescente | Aviso prévio de 60 dias, sem multa | **Cláusula contratual** — risco jurídico |
| Prazo de implantação | 45 dias | 60 dias | Promessa de entrega ao cliente |
| Suporte telefônico | Só acima de 1.500 alunos | Todas as faixas | Escopo de serviço prometido |
| Contrato semestral (piloto) | Ausente | Previsto | Existe só em uma fonte — pode ser adição nova ou omissão |

Notas de status:

- `VERIFICADO` — todos os números acima estão explícitos nos respectivos documentos.
- `INFERIDO` — o cabeçalho "Tabela vigente — revisão comercial 2025" **sugere** que caso2b é a versão em vigor. Isso é uma inferência a partir do texto do próprio documento, não uma confirmação. caso2a não declara vigência nem data, então não é possível saber se é uma versão anterior, uma condição especial para um segmento, ou uma tabela que continua valendo para contratos legados.
- `DESCONHECIDO` — data de aprovação de cada tabela; quem aprovou; se caso2a se aplica a contratos já assinados (grandfathering); se a isenção de implantação do 1º semestre se refere ao 1º semestre de 2025 e, portanto, já expirou.

Essa última pendência importa: se a isenção era só do 1º semestre de 2025, hoje (agosto de 2026) o documento "vigente" já contém uma condição vencida. Não corrija isso por conta própria — leve à validação.

---

## Relatório — documento A

```
DOCUMENTO
caso2a_gennera_condicoes_comerciais.md (Gennera_Condicoes_Comerciais) — 03_Gennera

PROPÓSITO ATUAL
Condições comerciais da Gennera: modelo de contratação, faixas de preço, condições de contrato,
prazo de implantação e escopo de suporte. Na prática, é uma tabela comercial sem vigência
declarada, concorrendo com uma segunda tabela que se declara vigente.

DIAGNÓSTICO
Escopo único e coerente (comercial Gennera) e pasta correta — o documento está no dono certo.
O problema não é o conteúdo nem o lugar: é que ele afirma preços e cláusulas que divergem de
outro documento ativo, e não carrega status nem data que permita saber qual prevalece.
Enquadra-se na armadilha 5 de RAG: duas versões do mesmo fato no índice, sem marcação de
vigência, produzem resposta dependente do ranking. Sem verbosidade excessiva; sem escopos
misturados; sem conteúdo de outra marca; sem regra de agendamento.

DECISÃO
Condicional — bloqueada por conflito. Duas ramificações:
  - Se caso2b for confirmada como vigente  -> ARCHIVE (versão anterior, preservada)
  - Se caso2a for confirmada como vigente  -> KEEP + REWRITE mínimo (só para inserir status e
    vigência) e ARCHIVE de caso2b
Enquanto não houver decisão humana: nenhuma das duas ramificações pode ser executada.

OWNER ALVO
Gennera

LOCALIZAÇÃO ALVO
03_Gennera (permanece) ou 03_Gennera/ARCHIVE, conforme a decisão humana

TIPO DE CONHECIMENTO
RAG (condições comerciais consultáveis) — ou ARCHIVE, conforme a decisão

SYSTEM: NÃO — o orquestrador não precisa da tabela de preço da Gennera para rotear a conversa
        ao subagente da Gennera. Preço é para responder, não para decidir.
RAG: SIM, porém SUSPENSO ATÉ VALIDAÇÃO — um documento de preço sem status de vigência,
     coexistindo com outro divergente, não deve permanecer no índice ativo.

DEPENDÊNCIAS
Subagente Gennera (respostas comerciais e propostas). Qualquer material de apoio, proposta
modelo ou script de objeção que cite preço, taxa de implantação ou cláusula de cancelamento da
Gennera depende desta decisão e precisa ser reconferido depois dela.

CONFLITOS
Conflito ativo com caso2b_gennera_tabela_comercial_2025 em 9 itens (ver tabela acima), incluindo
preço de todas as faixas e cláusula de cancelamento. CONFLITANTE — não resolvido aqui.

CONTEÚDO A MANTER
Todo o conteúdo, íntegro, até a decisão humana. Nada aqui é descartável por si só: mesmo que
esta venha a ser a versão antiga, ela é o registro das condições sob as quais contratos
anteriores podem ter sido fechados.

CONTEÚDO A MOVER
Nenhum. O documento já está no dono e na pasta corretos.

CONTEÚDO A REMOVER/ARQUIVAR
Nada removido. Arquivamento integral apenas se caso2b for confirmada como vigente — e, nesse
caso, com registro interno de o que a substituiu e quando.

NOME PROPOSTO
Se permanecer vigente: Gennera_Precos_e_Condicoes_Comerciais
  (o nome atual não diz que o documento contém preços; "Precos" espelha melhor o vocabulário da
   pergunta real do usuário e melhora a recuperação)
Se for arquivado: Gennera_Precos_e_Condicoes_Comerciais (dentro de ARCHIVE/, sem sufixo de
  versão no nome do arquivo — status e vigência vão dentro do documento)

PRÓXIMA AÇÃO
Perguntar ao responsável comercial da Gennera qual tabela está em vigor e a partir de que data,
e se esta versão continua valendo para contratos já assinados. Não arquivar, não editar e não
fundir antes dessa resposta.
```

---

## Relatório — documento B

```
DOCUMENTO
caso2b_gennera_tabela_comercial_2025.md (Gennera_Tabela_Comercial_2025) — 00_Governanca_e_Arquitetura

PROPÓSITO ATUAL
Tabela comercial da Gennera que se declara "vigente — revisão comercial 2025". Na prática, é
conhecimento comercial de marca armazenado na pasta de governança do ecossistema.

DIAGNÓSTICO
Dois problemas independentes.
(1) Localização errada: 00_Governanca_e_Arquitetura é a pasta do que é genuinamente global —
    governança, compliance, índice mestre, convenções. Uma tabela de preço da Gennera muda se a
    Gennera sair do ecossistema; logo, não é global, é da marca. Estar nessa pasta faz
    conhecimento comercial de uma marca ficar visível como se fosse regra do orquestrador, e
    deixa o subagente da Gennera sem a fonte no seu próprio escopo de recuperação.
(2) Conflito factual ativo com caso2a em 9 itens, incluindo todas as faixas de preço e a
    cláusula de cancelamento.
O cabeçalho de vigência é um ponto positivo — é o único dos dois documentos que declara status.
Mas "revisão comercial 2025" não é uma data de vigência: não diz a partir de quando vale, nem
até quando, nem se substitui formalmente a outra tabela.

DECISÃO
MOVE (independentemente do conflito) + resolução de vigência pendente de validação humana.
O MOVE de 00_Governanca_e_Arquitetura para 03_Gennera é correto mesmo que este documento venha a
ser o arquivado — nos dois cenários ele é conteúdo da Gennera, não de governança.

OWNER ALVO
Gennera

LOCALIZAÇÃO ALVO
03_Gennera (ou 03_Gennera/ARCHIVE, se caso2a for confirmada como vigente)

TIPO DE CONHECIMENTO
RAG (condições comerciais consultáveis) — ou ARCHIVE, conforme a decisão

SYSTEM: NÃO — mesma razão do documento A; e o fato de estar na pasta de governança não torna
        nada disso global.
RAG: SIM, porém SUSPENSO ATÉ VALIDAÇÃO — mesma razão: enquanto as duas versões coexistirem sem
     vigência resolvida, manter as duas indexadas produz resposta não determinística sobre preço.

DEPENDÊNCIAS
Subagente Gennera. Índice mestre / mapa da arquitetura, que precisa refletir a saída deste
documento da pasta de governança. Propostas e materiais de apoio que citem valores da Gennera.

CONFLITOS
Conflito ativo com caso2a_gennera_condicoes_comerciais em 9 itens (ver tabela acima).
CONTEÚDO CONFLITANTE — não resolvido aqui.
Item adicional para validação: a isenção de implantação "para contratos fechados no primeiro
semestre" não indica o ano nem se ainda está em vigor. DESCONHECIDO.

CONTEÚDO A MANTER
Todo o conteúdo, íntegro, até a decisão humana.

CONTEÚDO A MOVER
O documento inteiro: 00_Governanca_e_Arquitetura -> 03_Gennera.

CONTEÚDO A REMOVER/ARQUIVAR
Nada removido. Arquivamento integral apenas se caso2a for confirmada como vigente.

NOME PROPOSTO
Gennera_Precos_e_Condicoes_Comerciais
  (sem o ano no nome do arquivo: versionar por nome é exatamente o que produz a coexistência de
   versões que degrada o RAG. Ano, status e vigência vão DENTRO do documento, para que a
   recuperação carregue o status junto com o fato.)

PRÓXIMA AÇÃO
Executar o MOVE para 03_Gennera — esta parte não depende da resolução do conflito. Em paralelo,
levar a tabela de conflitos ao responsável comercial da Gennera. Não renomear para o nome final
antes de saber qual dos dois documentos será o vigente, para não ter dois arquivos disputando o
mesmo nome.
```

---

## O que fazer, em ordem

1. **Hoje — conter o dano.** Suspenda do índice de RAG ativo *as duas* versões, ou, se o subagente Gennera não puder ficar sem tabela comercial, mantenha **uma só** indexada por decisão explícita e registrada do responsável comercial. Duas tabelas de preço divergentes no índice é a única coisa aqui que já está produzindo resposta errada em produção.
2. **MOVE de caso2b** de `00_Governanca_e_Arquitetura` para `03_Gennera`. Não depende de ninguém decidir nada — tabela de preço de marca não é governança em nenhum cenário.
3. **Validação humana** com o responsável comercial da Gennera, usando a tabela de conflitos acima como pauta. As perguntas concretas: qual tabela vale, desde quando, a antiga continua valendo para contratos já assinados, e a isenção de implantação do "primeiro semestre" ainda está em vigor.
4. **Depois da resposta:** o documento vigente recebe, no corpo, um bloco de status (versão, data de vigência, o que substituiu). O outro vai para `03_Gennera/ARCHIVE/`, registrando dentro dele o que o substituiu e quando. **Nenhum dos dois é deletado** — o arquivado é o registro das condições sob as quais contratos anteriores podem ter sido fechados.
5. **Só então** renomear o vigente para `Gennera_Precos_e_Condicoes_Comerciais` e reindexar.
6. **Varredura de arrasto:** depois de fixada a tabela canônica, revisar materiais de apoio, propostas modelo e scripts de objeção da Gennera que repitam preço, taxa de implantação ou cláusula de cancelamento. O que hoje repete o número deve passar a **referenciar** o documento canônico. Se, quando o preço mudar, houver mais de um arquivo para editar, a arquitetura ainda está errada.

## O que eu deliberadamente não fiz

- Não escolhi qual tabela está certa. Os dois documentos são internamente coerentes; nada no material permite decidir, e o cabeçalho "vigente 2025" é indício, não prova.
- Não fundi as duas em uma terceira tabela. Uma fusão aqui produziria uma tabela que nunca foi aprovada por ninguém.
- Não inventei datas de vigência, aprovador, nem o preço "correto" da faixa acima de 1.500 alunos.
- Não deletei nem reescrevi nada. Rewrite só acontece sob pedido explícito — e, neste caso, só depois da validação.
