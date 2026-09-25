---
name: ux-copy
description: "Use quando Penny precisar diagnosticar fricção de comunicação e escrever/revisar texto de interação — formulário, CTA, mensagem de erro/sucesso, onboarding, confirmação, e-mail/WhatsApp de próximo passo, ou copy de atendimento — para GENNERA, EDUINFO, NAR ECO ou outra marca. NÃO usar para decidir posicionamento/estratégia de marca, nem para produzir dark patterns, falsa urgência, culpa, opt-out escondido ou confirmação enganosa — isso está fora do escopo desta skill por princípio."
metadata:
  adapted_from: "anthropics/knowledge-work-plugins (design/skills/ux-copy)"
  adapted_version: "unversioned upstream"
  penny_adaptation_version: "0.1.0"
---

# ux-copy (adaptação Penny)

Conhecimento aplicado de UX Writing + Content Design para diagnosticar fricção de comunicação e escrever/revisar a interação com quem lê — adaptado ao ecossistema Penny/NAR a partir de uma skill de origem externa. Ver `ORIGIN.md` para proveniência completa, versão de origem e diferenças introduzidas nesta adaptação.

**Esta skill ensina Penny a escrever e diagnosticar melhor a experiência de linguagem. Ela não redefine quem Penny é, nem amplia sua autoridade.** Identidade, autoridade e governança continuam vivendo em `SOUL.md`, `POSITIONING.md`, `SCOPE.md`, `MEMORY.md` e no Learning Loop, que têm precedência sobre qualquer orientação desta skill. `ux-copy` é uma **capability de método**, nunca uma fonte de autoridade nova. Capability ≠ Authority ≠ Identity.

## O que é (e o que não é) esta skill

`ux-copy` não é "microcopy de botão". É a camada de **experiência e linguagem** de qualquer ponto de contato — página, formulário, mensagem de erro, e-mail, WhatsApp, CRM, atendimento — aplicada à jornada inteira, não a um widget isolado.

Ela **não substitui**:
- `marketing-psychology` — que explica *por que* um comportamento acontece;
- `marketing-loops` — que estrutura *quando e com que recorrência* uma interação é revisada e aprendida;
- branding, estratégia editorial, copywriting de campanha ou direção criativa — que decidem posicionamento e narrativa de marca.

A relação entre as três skills, quando pertinente:

**`marketing-psychology` ajuda a entender o comportamento → `ux-copy` transforma isso em interação clara e ética → `marketing-loops` pode usar o feedback dessa experiência como evidência para aprendizado recorrente.**

Nenhuma das três decide sozinha se algo deve virar regra permanente — isso segue o Learning Loop real da Penny.

## Modelo de diagnóstico

Toda tarefa de `ux-copy` percorre este fluxo:

**CONTEXTO → INTENÇÃO → FRICÇÃO → MENSAGEM → AÇÃO → FEEDBACK → PRÓXIMO PASSO**

| Etapa | Pergunta que Penny responde |
|---|---|
| **Contexto** | Em que tela, canal, momento da jornada e marca isso acontece? (formulário, CTA, onboarding, erro, WhatsApp, e-mail, CRM, atendimento, campanha) |
| **Intenção** | O que a pessoa está genuinamente tentando fazer ou entender aqui — não o que a marca quer que ela faça. |
| **Fricção** | Onde exatamente a comunicação atual falha — ambiguidade, jargão, falta de contexto, inconsistência de termo, ausência de próximo passo claro, ou tom incompatível com o estado emocional da pessoa. |
| **Mensagem** | O que precisa mudar no texto/interação para resolver essa fricção específica — nunca um texto genérico "melhor por padrão". |
| **Ação** | Qual comportamento a mensagem deve viabilizar — a pessoa entende o que fazer a seguir sem precisar adivinhar? |
| **Feedback** | Que confirmação, erro ou estado a pessoa recebe depois de agir — e isso reduz ou aumenta a ansiedade dela? |
| **Próximo passo** | O que a pessoa sabe, sente ou pode fazer imediatamente depois — a interação termina em clareza ou em um vácuo? |

Diagnóstico completo de Penny sempre nomeia, nessa ordem: (1) onde existe fricção; (2) por que a comunicação atual falha; (3) o que mudar; (4) qual texto/interação recomenda; (5) qual comportamento ou entendimento espera melhorar; (6) como validar se melhorou (ver "Como validar" abaixo).

## Como usar

1. Identificar contexto real: tela/canal, marca, público, estágio da jornada — nunca escrever copy "genérica" sem esses quatro dados.
2. Diagnosticar a fricção real antes de propor texto — se a causa é falta de contexto, ambiguidade, inconsistência de termo ou tom incompatível, o remédio é diferente em cada caso.
3. Selecionar o padrão de interação aplicável em `references/copy-patterns.md` (CTA, erro, estado vazio, confirmação, tooltip, carregamento, onboarding, mensagem de próximo passo em e-mail/WhatsApp/CRM) — adaptar, não copiar mecanicamente.
4. Verificar a proposta contra `references/ux-ethics-guardrails.md` antes de recomendar qualquer confirmação, opt-out, urgência ou linguagem de consequência.
5. Adaptar tom e vocabulário à marca específica da tarefa (ver "Marcas e voz" abaixo) — nunca aplicar a mesma solução de outra marca sem passar pelo contexto dela.
6. Recomendar como validar se a mudança melhorou o entendimento/comportamento esperado — Penny não declara sucesso sem um sinal real para checar.

## Marcas e voz — a mesma interação, soluções diferentes

Penny não cria uma "voz Penny" única aplicada a todas as marcas. GENNERA, EDUINFO, NAR ECO e outras marcas têm público, posicionamento e linguagem próprios — a mesma interação (ex.: erro de pagamento, confirmação de matrícula, CTA de captação) pode e deve produzir textos diferentes conforme a marca, o público, a intenção e o estágio da jornada.

No contexto educacional, Penny considera gestores, professores, famílias, alunos e comunidade escolar quando pertinente — sem forçar linguagem ou exemplo escolar em uma marca ou tarefa que não pertence a esse contexto (ex.: NAR ECO fora do escopo educacional).

## Princípios de clareza (base para qualquer texto desta skill)

- **Claro** — dizer exatamente o que significa; sem jargão, sem ambiguidade.
- **Conciso** — usar o menor número de palavras que ainda transmita o significado completo.
- **Consistente** — o mesmo termo para a mesma coisa em toda a jornada e todos os canais daquela marca.
- **Útil** — cada palavra ajuda a pessoa a alcançar o objetivo real dela, não o objetivo da marca disfarçado de ajuda.
- **Humano** — escrever como uma pessoa que ajuda, não como uma máquina genérica — mas "humano" nunca significa "manipulativo" (ver guardrails).
- **Acessível** — linguagem compreensível para quem não domina o jargão do setor (gestor, família, aluno), e compatível com boas práticas de acessibilidade quando o canal permitir (contraste, leitura por voz, tamanho de alvo de toque).

## Guardrails éticos (resumo — detalhe em `references/ux-ethics-guardrails.md`)

Nunca recomendar ou produzir: dark patterns de interação (confirmshaming, roach motel, continuidade forçada); falsa urgência; culpa; opt-out/cancelamento escondido ou dificultado; confirmação enganosa (rótulo de botão que não corresponde à ação real); ambiguidade deliberada para induzir erro. Sempre que uma confirmação, cancelamento ou consequência estiver envolvida, o texto deve deixar a ação e a consequência claras antes de a pessoa confirmar — nunca depois.

## Como validar

Uma recomendação de `ux-copy` só é completa quando aponta um sinal real de melhora, por exemplo: queda em taxa de erro/abandono no formulário; redução de mensagens de suporte pedindo esclarecimento sobre o mesmo ponto; aumento de conclusão do próximo passo esperado (agendamento, resposta, matrícula confirmada). O sinal deve ser lido no sistema canônico correspondente (CRM, analytics, Agenda Service) — nunca inventado ou assumido sem dado.

## Referências

- `references/copy-patterns.md` — padrões de interação por tipo (CTA, erro, estado vazio, confirmação, tooltip, carregamento, onboarding, mensagem de próximo passo em e-mail/WhatsApp/CRM/atendimento), reescritos e adaptados ao ecossistema NAR a partir da fonte original.
- `references/ux-ethics-guardrails.md` — dark patterns de interação a nunca produzir, e como testar se uma confirmação/urgência/opt-out é legítima.
- `ORIGIN.md` — proveniência, versão de origem, licença, e diferenças introduzidas por esta adaptação.

## Relação com outras skills

`ux-copy` é a camada de experiência e linguagem; ela não decide posicionamento de marca nem substitui a lente de comportamento de `marketing-psychology` ou a estrutura de recorrência de `marketing-loops` — as três se complementam sem se confundir (ver "O que é e o que não é esta skill").
