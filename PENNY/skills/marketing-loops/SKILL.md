---
name: marketing-loops
description: "Use quando Penny precisar desenhar, avaliar ou ajustar um loop de marketing recorrente (LinkedIn/conteúdo, qualificação de leads, cadência de CRM, retenção/referral, aprendizado de campanha) para GENNERA, EDUINFO, NAR ECO ou outra marca. NÃO usar para criar automação infinita, spam, publicação/gasto/envio autônomo sem checkpoint, ou para decidir posicionamento/estratégia de marca — isso pertence a Rufino/Penny em outro nível, não a um loop."
metadata:
  adapted_from: "coreyhaines31/marketingskills (skills/marketing-loops)"
  adapted_version: "1.2.0"
  penny_adaptation_version: "0.1.0"
---

# marketing-loops (adaptação Penny)

Conhecimento aplicado para desenhar e avaliar **loops de marketing** — sistemas recorrentes com gatilho, ação limitada, autoverificação e condição de parada explícita — adaptado ao ecossistema Penny/NAR a partir de uma skill de origem externa. Ver `ORIGIN.md` para proveniência completa, versão de origem e diferenças introduzidas nesta adaptação.

**Esta skill ensina Penny a estruturar melhor um sistema recorrente. Ela não redefine quem Penny é, nem amplia sua autoridade.** Identidade, autoridade e governança continuam vivendo em `SOUL.md`, `POSITIONING.md`, `SCOPE.md`, `MEMORY.md` e no Learning Loop, que têm precedência sobre qualquer orientação desta skill. Um loop de marketing é uma **capability de método**, nunca uma fonte de autoridade nova.

## O que é (e o que não é) um loop

**LOOP ≠ CAMPANHA ≠ CADÊNCIA ≠ AUTOMAÇÃO ≠ WORKFLOW.**

- **Campanha** — esforço com início, fim e objetivo específico (ex.: campanha de matrícula do 2º semestre).
- **Cadência** — sequência de contatos com um lead/cliente específico ao longo do tempo (ex.: 5 toques de qualificação); pode ser *usada dentro* de um loop, mas não é o loop em si.
- **Automação** — execução técnica de uma etapa (disparo de e-mail, atualização de campo no CRM); é um componente possível de um loop, não o loop.
- **Workflow** — sequência operacional de um processo (ex.: como uma proposta é aprovada); pode ser acionado por um loop, mas descreve um processo, não um sistema recorrente com autoverificação e stop condition.
- **Loop** — o sistema recorrente que decide, a cada execução, **se e como agir**, guiado por um gatilho, uma verificação e uma condição de parada. Um loop pode orquestrar campanhas, cadências, automações e workflows — mas não é reduzível a nenhum deles isoladamente.

Confundir essas categorias é o erro mais comum ao "criar automações": um loop malfeito se torna cadência infinita disfarçada de sistema.

## Anatomia de um loop na Penny

Todo loop desenhado ou avaliado por Penny segue este fluxo:

**TRIGGER → ACTION → STATE → FEEDBACK → MEASUREMENT → LEARNING → NEXT ACTION / STOP**

Ao autorar ou avaliar um loop, Penny preenche explicitamente cada uma das partes abaixo. Um loop sem stop condition, sem autoverificação ou sem tratamento de estado é um risco, não uma capability:

| Parte | Pergunta que Penny responde |
|---|---|
| **Objetivo, público, marca, estágio da jornada** | Que resultado este loop protege ou melhora? Para quem? Em qual marca (GENNERA/EDUINFO/NAR ECO/outra)? Em que ponto da jornada (aquisição, ativação, experiência, retenção)? |
| **Trigger** | O que dispara a verificação — tempo (cadência fixa) ou evento (novo lead, queda de métrica, marco atingido)? |
| **Action** | O que o loop faz *quando* a condição de ação é atendida — não confundir com o trigger. A maioria das execuções de um loop saudável deve ser "verifiquei, nada a fazer". |
| **State** | Onde fica o estado entre execuções — cursor/marca de última execução, chaves de deduplicação, janelas de cooldown, itens em andamento. Sem isso o loop reage de forma duplicada ou repete contato com a mesma pessoa. |
| **Feedback / Measurement** | Que sinal real confirma se a ação funcionou (métrica de negócio, não vaidade) — e onde esse sinal é lido: CRM, analytics, Agenda Service ou outro sistema canônico, nunca uma cópia divergente em Memory. |
| **Learning** | O que este ciclo ensina — e para qual camada isso vai (ver "Loop e o Learning Loop da Penny" abaixo). Um resultado isolado não se torna regra automaticamente. |
| **Next action / Stop** | Sob que condição o loop repete, escala para checkpoint humano, ou se desliga. Todo loop precisa de uma condição de parada explícita — inclusive loops "sempre ativos" (a parada deles é "desligamento manual + parada em caso de erro", nunca "não se aplica"). |
| **Frequência / cooldown** | A frequência de verificação deve casar com a velocidade real do sinal, não com o desejo de "ver sempre". Verificar diariamente algo que só muda mensalmente produz ruído, não sinal. |
| **Deduplicação / idempotência** | Como o loop garante que não vai agir duas vezes sobre o mesmo lead/conta/conteúdo. Sem isso, reprocessamento gera contato duplicado, embaraço com a marca ou dado inconsistente no CRM. |
| **Owner e checkpoint humano** | Quem é o responsável funcional deste loop, e em que ponto uma ação exige aprovação humana antes de continuar — ver "Guardrails de autoridade" abaixo. |

## Como usar

1. Identificar o resultado real que o loop deve proteger ou melhorar (não "que automação seria legal ter").
2. Verificar, em `references/loop-catalog.md`, se já existe um loop adaptável ao domínio da tarefa (LinkedIn/conteúdo, qualificação de leads/CRM, retenção/experiência, referral, aprendizado de campanha) — adaptar em vez de inventar do zero quando houver um bom ponto de partida.
3. Preencher as onze partes da anatomia acima — se qualquer uma não puder ser respondida com confiança, o loop não está pronto, e Penny diz isso explicitamente em vez de propor a execução mesmo assim.
4. Classificar cada ação do loop segundo o modelo de duas camadas em `references/loop-guardrails.md` (autônomo-seguro vs. exige checkpoint) — nunca assumir que "já automatizei" significa "posso publicar/gastar/enviar sem revisão".
5. Preservar diferenças entre marcas: um loop desenhado para GENNERA não deve ser copiado sem ajuste para EDUINFO ou NAR ECO — cadência, tom e canal variam por marca e público.
6. Adaptar exemplo e raciocínio ao contexto educacional brasileiro somente quando a tarefa de fato pertencer a esse contexto — para NAR ECO ou outra marca fora da educação, o loop funciona sem forçar analogia escolar.
7. Conectar aquisição e retenção quando pertinente — ver "Aquisição e retenção" abaixo.

## Aquisição e retenção — o mesmo princípio, dois loops

Penny preserva este princípio ao desenhar loops:

> **"Quem está fora quer entrar. Quem está dentro não quer sair."**

Um loop de aquisição (ex.: qualificação de leads de matrícula) e um loop de retenção/experiência (ex.: watch de sinais de insatisfação de família) frequentemente compartilham a mesma fonte de dado e o mesmo tipo de aprendizado — mas nunca devem ser tratados como o mesmo loop. Um loop de referral, por exemplo, só funciona bem quando a experiência de quem já está dentro é forte o suficiente para gerar indicação real — conectando os dois lados sem fundir suas condições de ação, estado ou stop condition.

## Guardrails de autoridade (resumo — detalhe em `references/loop-guardrails.md`)

Um loop de marketing **nunca**:
- altera Soul, Positioning, Scope, Memory ou Learning Loop;
- amplia a autoridade da Penny além do que `SCOPE.md` já define — aprender a desenhar loops não é aprendizado estrutural, é aprendizado de domínio (ver Learning Loop);
- transforma Penny em administradora de CRM, n8n ou infraestrutura — Penny opera o CRM dentro de políticas existentes, não administra seu banco de dados;
- publica conteúdo, gasta mídia, envia comunicação a terceiros, ou altera configuração de sistema fora das políticas já aprovadas, sem o checkpoint humano correto;
- cria cadência infinita, mensagem duplicada, ou re-contato de alguém dentro de uma janela de cooldown ainda válida;
- usa Memory como substituto de CRM, Agenda Service ou qualquer outro sistema canônico — Memory guarda contexto útil sobre o loop, nunca o dado estruturado que pertence ao sistema oficial.

Toda ação de um loop é classificada em duas camadas: o que Penny pode fazer sem novo checkpoint por execução (verificar, analisar, comparar, preparar rascunho, sinalizar) e o que exige aprovação humana por padrão (publicar, gastar, enviar a terceiro, apagar/suprimir registro, alterar configuração viva de sistema). Isso espelha diretamente os "Níveis de autonomia" de `SCOPE.md` — um loop nunca cria um nível de autonomia próprio, ele só organiza *quando* cada nível já existente se aplica.

## Loop e o Learning Loop da Penny

Um loop de marketing **gera evidência**, não governança. Um resultado de um único ciclo é hipótese, não regra: segue o ciclo `DETECT → UNDERSTAND → VERIFY → CLASSIFY → LEARN → INCORPORATE → TEST → MEASURE → RETAIN/REVISE` do Learning Loop real da Penny antes de qualquer aprendizado de um loop de marketing se tornar critério permanente. Um loop pode propor que algo seja incorporado (a um Playbook, a Memory, a um critério de qualificação) — mas a incorporação em si segue o Learning Loop, nunca é decidida pelo loop sozinho.

## Referências

- `references/loop-catalog.md` — catálogo de loops adaptados aos domínios reais da Penny (LinkedIn/conteúdo, qualificação de leads/CRM, retenção/experiência/referral, aprendizado de campanha), reescrito a partir da fonte original.
- `references/loop-guardrails.md` — modelo de duas camadas de ação, guardrails de estado/idempotência, sempre-escalar, e kill switch, adaptados à governança real da Penny.
- `ORIGIN.md` — proveniência, versão de origem, licença, e diferenças introduzidas por esta adaptação.

## Relação com outras skills

Esta skill fornece o método de estruturar um sistema recorrente; ela não substitui `marketing-psychology` (a lente de comportamento usada dentro de um loop de conteúdo ou copy) nem skills de execução específicas de canal. Quando o loop toca CRM, Agenda Service ou outro sistema canônico, Penny opera esses sistemas conforme `SCOPE.md`, nunca através de um estado paralelo criado só para o loop.
