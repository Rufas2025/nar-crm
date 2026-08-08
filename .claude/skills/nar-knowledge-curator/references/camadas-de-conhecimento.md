# Camadas de conhecimento — critérios de atribuição

Cada bloco de informação vive em exatamente uma camada primária. A camada determina *quando*
a informação entra em contexto, e é isso que separa um agente enxuto de um agente inchado.

Ordem de aplicação do teste (a primeira que der SIM vence):

| # | Pergunta | Camada |
|---|---|---|
| 1 | O agente principal precisa disso para decidir **COMO agir**? | `SYSTEM` |
| 2 | Precisa apenas para **SABER a resposta**? | `RAG` (ou especialista) |
| 3 | É instrução operacional executável? | `WORKFLOW` |
| 4 | É material enviável ao cliente? | `ASSET` |
| 5 | É documentação para humanos? | `REFERENCE` |
| 6 | Está obsoleto ou substituído? | `ARCHIVE` |

A ordem importa. A pergunta 1 é deliberadamente a mais restritiva, e a maioria dos blocos não
deveria sobreviver a ela.

---

## SYSTEM

**Entra**: identidade e papel do agente; persona e tom global; classificação de intenção;
tabela de roteamento (qual especialista para qual domínio); regras globais de conversa; limites
de segurança e governança; quando escalar para humano.

**Não entra**: catálogos, preços, FAQs, objeções, cases, links, tom de voz de marca específica,
detalhes de produto, procedimentos operacionais, qualquer coisa consultável.

**Erro clássico**: incluir algo porque é importante. Importância não é o critério — necessidade
para decidir é. O catálogo de produtos da EduInfo é importantíssimo e mesmo assim não pertence
ao system prompt do orquestrador, porque o orquestrador não precisa dele para saber que a
pergunta é da EduInfo.

**Sinal de inchaço**: se o system prompt responde perguntas do cliente em vez de decidir quem
responde, ele virou base de conhecimento com outro nome.

---

## RAG

**Entra**: conhecimento factual consultável — produtos, soluções, FAQs, objeções, cases,
posicionamento, condições comerciais, materiais de apoio. Conteúdo que o agente busca *quando
a pergunta chega*.

**Não entra** — as cinco armadilhas que degradam a base:

1. **Governança em RAG.** Regras de governança precisam valer sempre, não apenas quando a
   recuperação por acaso as trouxer. Governança é SYSTEM (o que restringe comportamento) ou
   REFERENCE (o que documenta política para humanos). Em RAG, ela se torna probabilística — e
   uma regra de compliance probabilística não é uma regra.

2. **Documentação interna de workflow em RAG.** Documentação de workflow n8n, payloads,
   endpoints e configuração de integração é WORKFLOW ou REFERENCE. Em RAG, ela polui a
   recuperação e, pior, pode acabar sendo respondida ao cliente final.

3. **System prompt indexado como conhecimento factual.** O prompt do agente descreve *como o
   agente se comporta*, não *o que é verdade sobre o mundo*. Indexá-lo faz o agente recuperar
   instruções sobre si mesmo e tratá-las como fatos a comunicar. Se o prompt precisa ser
   consultável por humanos, isso é REFERENCE.

4. **Documento de marca recuperável por outro subagente.** Cada marca deve ter seu escopo de
   recuperação isolado. Sem isso, o subagente da Gennera recupera um case da Eco Clear e
   atribui à marca errada. Se houver necessidade legítima de acesso cruzado, ela deve ser
   explícita e documentada como dependência — nunca um efeito colateral do índice.

5. **Versão desatualizada coexistindo com a atual sem status.** Duas versões do mesmo fato no
   índice, sem marcação de status ou vigência, produzem recuperação não determinística: a
   resposta depende de qual chunk ganhou o ranking. Toda informação com validade deve carregar
   status/versão, e a versão substituída vai para ARCHIVE — não fica no índice "por garantia".

**Boa forma para RAG**: um documento por tema, título que descreve o conteúdo, seções
autocontidas (um chunk recuperado isoladamente ainda faz sentido), sem dependência de contexto
de documentos vizinhos, vocabulário que espelha o que o usuário realmente pergunta.

---

## WORKFLOW

**Entra**: instruções operacionais executáveis — passos de processo, configuração de
integração, parâmetros, payloads, regras de automação n8n, mecânica de webhooks, tratamento de
erro operacional.

**Não entra**: conhecimento factual sobre produto ou marca; política; material de cliente.

**Erro clássico**: misturar, no mesmo documento, o *porquê* de um processo (REFERENCE) com o
*como executar* (WORKFLOW). Isso obriga quem quer só executar a ler tudo.

---

## ASSET

**Entra**: material enviável ao cliente — PDFs, apresentações, imagens, vídeos, propostas
modelo, links de material público.

**Não entra**: o conteúdo textual que descreve o asset (isso é RAG ou REFERENCE). O asset é o
arquivo; a descrição de quando enviá-lo é conhecimento.

**Erro clássico**: colar o texto integral de um material comercial dentro do prompt ou do RAG
quando o que o agente precisa é saber que o material existe e quando enviá-lo.

---

## REFERENCE

**Entra**: documentação para humanos — arquitetura, decisões, índice mestre, convenções,
histórico, runbooks, políticas internas explicadas.

**Não entra**: nada que o agente precise em runtime. REFERENCE é a camada de quem mantém o
sistema, não de quem o executa.

**Erro clássico**: tratar REFERENCE como depósito do que não se soube classificar. Se um
documento vai para REFERENCE, deve ser porque um humano vai lê-lo — não porque ninguém decidiu.

---

## ARCHIVE

**Entra**: conteúdo obsoleto, substituído, ou versão anterior de documento vigente.

**Regra**: arquivar nunca é deletar. Preserve o original e registre o que o substituiu, para
que a decisão seja auditável depois.

**Erro clássico**: deixar o obsoleto no índice ativo "por segurança". Isso é exatamente a
armadilha 5 do RAG e produz respostas contraditórias sem que ninguém entenda por quê.

---

## Camada primária e camada secundária

Um documento pode ter presença secundária em outra camada — por exemplo, um documento de
produto que é RAG e cujo PDF comercial é ASSET. Isso é legítimo, desde que a **fonte canônica**
seja uma só e a outra camada apenas referencie. O que não é legítimo é o mesmo fato existir
integralmente em duas camadas, porque aí ele passa a ter dois donos e diverge na primeira
atualização.
