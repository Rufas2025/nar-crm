---
name: nar-product-ux
description: "Camada de inteligência de produto, UX e regras de domínio do CRM NAR. Use SEMPRE que a tarefa envolver o CRM NAR: nova feature, alteração de UX, fluxo de usuário, Email Studio, campanhas, cadências, destinatários, lotes/batch, personalização, saudação, templates, imported_html, previews, drafts do Gmail, formulários, modais, seletores, estados vazios, feedback de erro/sucesso, navegação ou qualquer decisão de produto — mesmo que o usuário não use as palavras 'UX' ou 'produto'. Complementa (não substitui) skills genéricas de UI/UX como ui-ux-pro-max e frontend-design: esta skill define as regras específicas do NAR; as outras definem boas práticas gerais de interface."
---

# NAR Product UX

Você é a camada de decisão de produto do CRM NAR. Seu papel é garantir que qualquer feature,
fluxo ou alteração de interface respeite as decisões de produto já tomadas para este CRM
específico — não redescobrir boas práticas genéricas de UX a cada tarefa.

## Relação com outras skills

Esta skill **não substitui** skills genéricas de UI/UX — ela as complementa com o que é
específico do NAR. Quando a tarefa envolver interface ou frontend, consulte também:

- **ui-ux-pro-max** — inteligência de UI/UX geral (estilos, paletas, tipografia, padrões de
  interação)
- **frontend-design** — direção estética e escolhas visuais intencionais
- **web-quality-skills**, se disponível no ambiente, quando a tarefa envolver responsividade,
  acessibilidade, performance, formulários, modais, scroll, foco ou teclado

A divisão de trabalho é clara: esta skill decide **o quê** o NAR faz e **por quê** (regras de
domínio, defaults, contratos de dados); as skills genéricas decidem **como** isso deve parecer e
se comportar bem como interface. Quando uma recomendação genérica conflita com uma regra
explícita do NAR aqui documentada, **a regra do NAR prevalece** — desde que isso não signifique
violar segurança, acessibilidade ou um requisito técnico obrigatório. Nesses três casos, a
segurança e a acessibilidade vencem sempre.

## Princípios de UX do NAR

Toda feature deve buscar: mínimo esforço do usuário, defaults inteligentes, override manual
quando a decisão importa, progressive disclosure, preview antes de ação relevante, esconder
complexidade técnica, feedback curto e acionável, consistência entre fluxos, reutilização de
padrões existentes, e preservação do contexto do usuário.

Antes de implementar a primeira solução tecnicamente válida, pergunte internamente: **existe uma
UX mais simples, previsível ou inteligente?** A solução tecnicamente correta e a solução certa
para o usuário nem sempre são a mesma coisa — o anti-padrão mais comum desta skill é entregar a
primeira sem checar a segunda.

## Default inteligente + controle

O NAR pode sugerir decisões automaticamente, mas **nunca retira controle** quando a decisão
altera comunicação, destinatários ou resultado final. Um default errado que o usuário não pode
corrigir em um clique é pior do que nenhum default.

## Saudação: o exemplo canônico do princípio acima

Este é o caso de referência de "default inteligente + controle" no NAR — use-o como modelo
mental para qualquer decisão de produto parecida.

Contrato interno: `{{SAUDACAO}}`. **Nunca exponha esse placeholder na UX final** — o usuário vê
o resultado renderizado, não o contrato.

```
Informal:  Olá, <strong>PrimeiroNome</strong>!
Formal:    Olá, [CARGO FORMAL] <strong>PrimeiroNome</strong>!
```

Cargos formais elegíveis nesta fase: **Diretor, Diretora, Mantenedor, Mantenedora** — só esses.
Coordenador(a), Coordenador(a) de TI, Vice-Diretor(a), "Direção", cargos compostos e cargos
técnicos **não** entram na formalização automática, mesmo que soem hierarquicamente altos.

`cargo_original` nunca é despejado diretamente na saudação. Exemplos do que isso produz quando
alguém tenta atalho — e por que é proibido: "Olá, Diretora TI Nathalia!" e "Olá, Diretor /
Vice-Diretor Adriana!" — cargo composto ou técnico virando saudação ao pé da letra, sem passar
pelo filtro de elegibilidade.

Nunca infira gênero pelo primeiro nome. O gênero do cargo formal (Diretor/Diretora,
Mantenedor/Mantenedora) vem do dado validado, não de heurística sobre o nome da pessoa.

**Defaults:**

| Situação | Default |
|---|---|
| Influente | Informal |
| Decisor com cargo formal elegível validado | Formal |
| Situação ambígua | Informal |

O usuário troca com 1 clique. Nunca menos controle que isso.

### Decisor vs. influente

Classificação de produto, não implementação técnica — trate como regra de domínio. Influente:
default Informal, e cargo_original isolado nunca justifica formalizar automaticamente. Decisor:
se houver Diretor/Diretora/Mantenedor/Mantenedora **validado**, pode sugerir Formal — mas o
usuário ainda escolhe. Nunca trate um cargo isoladamente como prova de papel decisório se a
classificação já existente no sistema disser o contrário; a classificação validada tem
precedência sobre a leitura literal do cargo.

## Preview = resultado final

Regra forte do NAR, aplicável a Email Studio, HTML importado, templates estruturados, draft
individual, draft de teste e batch: **o que o usuário vê no preview é o que chega ao resultado
final.** Não mantenha um resolvedor de personalização para o preview e outro para o envio — é
a fonte mais comum de bugs de "funcionou no preview, saiu errado no email" e o motivo pelo qual
esta regra existe. Se puder existir uma única fonte de verdade para renderizar o conteúdo, use
uma só, chamada nos dois contextos.

## Individual = batch

Toda lógica de personalização precisa de paridade entre preview, draft de teste, draft
individual e lote/batch. Cada destinatário usa exclusivamente seus próprios dados. **Nunca**
permita vazamento entre destinatários de nome, cargo, escola, artigo, saudação ou email — isso
não é um bug de UX, é um incidente de dados pessoais indo para a pessoa errada. Trate como
tal ao revisar qualquer código de resolução de lote.

## imported_html

Templates `imported_html` são produto, não conteúdo solto — reutilizam o contrato oficial de
personalização: `{{SAUDACAO}}`, `{{NOME}}`, `{{CARGO}}`, `{{ARTIGO}}`, `{{COLEGIO}}` e os aliases
já suportados pelo sistema. Não crie um placeholder novo se já existe um equivalente oficial —
isso fragmenta o contrato e quebra a paridade individual/batch da seção anterior.

HTML importado continua sandboxed sempre. Nunca enfraqueça o sandbox para resolver um problema
de UX, e nunca insira JavaScript ou outro mecanismo inseguro para viabilizar uma feature — a
resposta certa quando o sandbox atrapalha uma UX desejada é redesenhar a UX em torno do sandbox,
não relaxar o sandbox em torno da UX.

Quando o nome da instituição é personalizado no conteúdo, preserve o padrão visual aprovado de
instituição em negrito quando aplicável, e nunca deixe um placeholder literal (`{{COLEGIO}}`,
por exemplo) sobrevivendo no HTML final entregue ao destinatário.

## Não exponha detalhes técnicos

A UX nunca deve exigir que o usuário entenda placeholder, `cargo_original`, ID interno, código
interno de lote, edge function, payload, schema, nome de coluna ou lógica de fallback. O teste
prático: se corrigir um problema envolve mostrar ao usuário um conceito de implementação, a
correção certa normalmente é resolver internamente, não explicar o conceito.

Exemplo de referência — colisão de código de lote: o CRM gera automaticamente o próximo código
seguro. **Não** mostra "Use outro código." ao usuário. Isso é sempre um problema para o sistema
resolver, nunca para o usuário decidir.

## Lotes

Preserve lotes existentes. Nunca sobrescreva um lote anterior quando o conjunto de destinatários
for diferente — mesmo que pareça a mesma campanha. Em colisão técnica de código: gere um novo
código automaticamente, mantenha o lote anterior intacto, e não peça intervenção manual — a
mesma lógica da seção anterior aplicada a este caso específico. A UI deve ter uma única fonte de
verdade para quantidade e conjunto de destinatários — nunca dois lugares que podem divergir.

## Gmail/OAuth — área protegida

Não altere OAuth, tokens, escopos, fluxo de autenticação ou integração Gmail, a menos que a
tarefa dependa disso de forma comprovada. Uma feature de UX não deve virar alteração de
autenticação por conveniência de implementação — se uma mudança de UX parece exigir mexer em
OAuth, é sinal para parar e questionar o design antes de tocar nessa área.

## Supabase / Edge Functions

Mudanças em Edge Functions preservam autenticação existente, contratos atuais e paridade
client/server. Há automação de deploy para `supabase/functions/**` — não recomende deploy manual
quando o workflow automático já faz o trabalho. Migrations, RLS e schema não se alteram sem
necessidade comprovada pela tarefa em questão.

## Segurança acima de conveniência de UX

Nunca resolva um problema de experiência enfraquecendo sandbox, RLS, autenticação, validação
server-side, guardrails contra sobrescrita, ou isolamento entre contatos. Se um guardrail seguro
produz uma UX ruim, a resposta é preservar a proteção e melhorar a experiência **por cima** dela
— nunca remover a proteção para simplificar a experiência.

## Padrão de implementação

Antes de criar componente, helper ou estado novo: procure solução existente, avalie se pode ser
reutilizada, evite lógica paralela, mantenha fonte única de verdade, e mantenha individual e
batch em paridade. Prefira evolução incremental a reescrever áreas já aprovadas sem necessidade
concreta — "já que estou aqui, vou melhorar isso também" é o gatilho mais comum de regressão em
área que já funcionava.

## UX visual

O NAR é limpo, minimalista, profissional, denso apenas quando necessário, confortável em
desktop, responsivo, sem excesso de cards, labels ou controles. Use progressive disclosure: se
uma opção avançada só importa em um estado específico (ex.: um campo que só faz sentido quando
"Formal" está selecionado), mostre-a apenas nesse estado — não mantenha campos irrelevantes
sempre visíveis.

## Modais

Largura adequada ao conteúdo, nunca excessivamente estreitos e altos. Scroll interno quando
necessário, nunca scroll horizontal. Ações claras, foco e navegação por teclado preservados,
hierarquia visual clara. Não use fullscreen em desktop sem necessidade real.

## Mensagens e erros

Toda mensagem explica o que aconteceu, o que o sistema já fez, e se o usuário precisa agir. Se o
sistema pode resolver automaticamente com segurança, resolva — não mostre um erro técnico quando
um feedback de produto simples resolve (mesmo princípio da seção "não exponha detalhes
técnicos", aplicado a mensagens de erro especificamente).

## Processo para features novas

Para qualquer feature relevante, antes de codificar: entenda o objetivo real do usuário,
identifique o fluxo atual, consulte esta skill, consulte `ui-ux-pro-max`, consulte
`frontend-design`, consulte `web-quality-skills` quando aplicável, proponha a UX mínima
necessária — só então implemente.

Perguntas internas antes de codificar: qual problema do usuário isso resolve? Qual é o default
inteligente? Onde o usuário precisa de controle? O preview representa o resultado final? Existe
complexidade técnica exposta? Existe fluxo ou componente já reutilizável? Individual e batch
continuam consistentes? Há risco de regressão em Gmail/OAuth, sandbox, RLS ou autenticação?

## Anti-padrões

Solução tecnicamente correta mas UX ruim · hardcode de regra que já existe no CRM · inferência
de gênero pelo nome · `cargo_original` direto na comunicação · placeholders expostos na UX final
· IDs técnicos expostos · códigos internos gerenciados manualmente pelo usuário · fluxos
paralelos para a mesma operação · preview diferente do envio · comportamento diferente entre
individual e batch · modal estreito com conteúdo comprimido · excesso de opções sem progressive
disclosure · reauditar áreas já validadas sem motivo concreto.

## Saída esperada

Não gere respostas enormes por padrão. Ao analisar uma feature, produza: decisão de UX
recomendada, motivo curto, impacto no fluxo existente, riscos reais, implementação mínima, e o
que deve ser preservado. Se a tarefa for implementação, siga direto para o código após essa
análise interna — sem ciclos de revisão desnecessários.

## Referência

Para o texto completo das 23 seções originais desta especificação de produto — incluindo a
listagem exaustiva de gatilhos, cargos não elegíveis e a árvore completa de anti-padrões — veja
`references/especificacao-completa.md`. Consulte-a quando precisar citar a regra na íntegra ou
quando um caso não estiver claramente coberto pelo resumo acima.
