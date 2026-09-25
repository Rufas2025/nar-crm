---
name: creative-direction
description: "Use quando Penny precisar transformar um objetivo/briefing em conceito criativo, direção verbal/visual e sistema de peças coerente — para GENNERA, EDUINFO, NAR ECO ou outra marca. NÃO usar para decidir posicionamento estrutural de marca, para escrever a peça final (isso é ux-copy/copywriting/design), nem para publicar, enviar, gastar mídia ou contratar fornecedor — isso está fora do escopo desta skill por princípio."
metadata:
  adapted_from: "rampstackco/claude-skills (skills/creative-direction)"
  adapted_version: "unversioned upstream"
  penny_adaptation_version: "0.1.0"
---

# creative-direction (adaptação Penny)

Conhecimento aplicado de Creative Direction + Creative Strategy — transformar estratégia e briefing em conceito criativo, direção verbal/visual e sistema de peças coerente — adaptado ao ecossistema Penny/NAR a partir de uma skill de origem externa. Ver `ORIGIN.md` para proveniência completa, versão de origem e diferenças introduzidas nesta adaptação.

**Esta skill ensina Penny a transformar estratégia em conceito melhor. Ela não redefine quem Penny é, nem amplia sua autoridade, nem decide identidade estrutural de marca.** Identidade, autoridade e governança continuam vivendo em `SOUL.md`, `POSITIONING.md`, `SCOPE.md`, `MEMORY.md` e no Learning Loop, que têm precedência sobre qualquer orientação desta skill. `creative-direction` é uma **capability de método**, nunca uma fonte de autoridade nova. Capability ≠ Authority ≠ Identity.

## O que é (e o que não é) esta skill

`creative-direction` não é ferramenta de design gráfico, nem geradora genérica de peças. Ela existe para responder duas perguntas antes de qualquer peça ser produzida: **qual é o problema criativo real** e **qual conceito resolve esse problema de forma desdobrável em vários canais sem se repetir nem se dispersar.**

Ela **não decide**:
- posicionamento estrutural da marca (pertence a Rufino);
- territórios/pilares/prioridade editorial (pertence a `content-strategy`);
- a linguagem final de cada interação (pertence a `ux-copy`, `copywriting` ou execução de design);
- o sistema recorrente de revisão/aprendizado sobre o que foi publicado (pertence a `marketing-loops`);
- publicação, envio, gasto de mídia, contratação de fornecedor ou qualquer alteração de sistema externo — isso segue os Níveis de autonomia reais de `SCOPE.md`.

Relação entre as skills, quando pertinente: `content-strategy` decide território e prioridade → `marketing-psychology` explica o comportamento por trás do público → **`creative-direction` transforma isso em conceito e direção** → `ux-copy`/execução escrevem e desenham a peça final dentro dessa direção → `marketing-loops` estrutura a recorrência de revisão do que foi produzido.

## O modelo

Toda tarefa de `creative-direction` percorre este fluxo:

**CONTEXTO → OBJETIVO → PÚBLICO → INSIGHT → CONCEITO CRIATIVO → MENSAGEM CENTRAL → DIREÇÃO VERBAL/VISUAL → SISTEMA DE PEÇAS → CANAIS → CRITÉRIOS DE AVALIAÇÃO**

| Etapa | Pergunta que Penny responde |
|---|---|
| **Contexto** | Marca, momento, motivo real de existir esta peça/campanha — não "precisamos de conteúdo", e sim por que agora, para quê. |
| **Objetivo** | O que precisa mudar de fato (comportamento, percepção, ação) — herdado do objetivo real da tarefa, nunca inventado pela skill. |
| **Público** | Quem especificamente — nunca "público geral"; em educação, pode ser gestor, mantenedor, professor, família, aluno ou comunidade, cada um com relação diferente com a marca. |
| **Insight** | A verdade humana/comportamental específica que torna esta ideia relevante para esse público — não um fato genérico sobre o mercado. |
| **Conceito criativo** | A ideia central, desdobrável, que conecta insight e objetivo — nunca uma execução isolada (um post, uma frase) travestida de conceito. |
| **Mensagem central** | O que a pessoa deve entender/sentir, resumido em uma frase — o teste é: essa mensagem sobrevive à tradução para qualquer peça do sistema? |
| **Direção verbal/visual** | Tom, vocabulário, e philosophy estética que sustentam o conceito (ver "Direção verbal e visual" abaixo) — direção, não execução; não substitui quem escreve ou desenha a peça final. |
| **Sistema de peças** | Como o mesmo conceito se desdobra em formatos diferentes sem repetir a peça nem perder coerência — ver "Sistema de peças, não peça única" abaixo. |
| **Canais** | Onde cada peça do sistema vive, e como o canal muda a forma sem mudar o conceito. |
| **Critérios de avaliação** | Como testar se uma ideia é boa antes de produzi-la (ver "Como avaliar uma ideia" abaixo). |

## Como usar

1. **Confrontar o briefing antes de aceitar.** Se objetivo, público ou contexto estiverem vagos ou incompletos, Penny pergunta e desafia — nunca propõe conceito sobre briefing furado. Um briefing ruim vira boa direção só depois de ser confrontado, não aceito como está.
2. Identificar o problema criativo real — o que especificamente precisa ser resolvido, não "precisamos de uma campanha".
3. Buscar o insight: a verdade sobre o público que dá substância ao conceito — nunca partir direto para a execução sem esse passo.
4. Propor o conceito criativo central, e — quando a tarefa comportar — territórios/conceitos alternativos, não só uma única ideia sem contraste.
5. Definir mensagem central e, quando útil, estruturar o creative brief completo (ver `references/creative-brief-template.md`) — sem transformar isso em burocracia obrigatória para toda tarefa pequena (ver "Quando usar o brief completo" abaixo).
6. Definir direção verbal e visual usando `references/direction-axes.md` — direção, nunca execução final; Penny não substitui quem desenha ou escreve a peça.
7. Desdobrar o conceito em sistema de peças por canal, mantendo coerência sem produzir tudo idêntico.
8. Avaliar toda ideia (própria ou trazida por outra pessoa) contra os critérios de `references/creative-evaluation.md` antes de recomendar produção.
9. Adaptar tudo à marca específica — nunca transplantar estética, metáfora ou linguagem de uma marca para outra.

## Direção verbal e visual — direção, não substituição de designer

Quatro eixos ajudam a definir a direção com precisão (adaptados da fonte, que os chamava de "eixos direcionais"), detalhados em `references/direction-axes.md`:

1. **Registro de tom** — quão formal, quanto "calor" a linguagem carrega (profissional, conversacional, provocador, etc.).
2. **Filosofia estética** — quanta densidade visual a peça carrega, o que cada elemento precisa justificar (restrito/editorial, padrão, maximalista controlado, etc.).
3. **Relação com o público** — a marca fala de cima (autoridade), ao lado (par), à frente cuidando (companhia) ou desafiando (coach)?
4. **Ambição sensorial** — o quanto a peça pede emocionalmente de quem recebe (funcional, cuidado, ressonante).

Cada eixo é um espectro, não uma escolha binária — e a posição escolhida deve ter uma razão ligada ao público e objetivo reais, nunca uma preferência estética solta. **Esta direção nunca substitui quem de fato desenha ou escreve a peça** — ela dá a esse trabalho um ponto de referência comum, para que dezenas de decisões pequenas (escolha de palavra, imagem, espaçamento, o que deixar de fora) respondam à mesma lógica.

## Sistema de peças, não peça única

Um conceito forte se desdobra em múltiplos formatos e canais **sem virar cópia idêntica** e **sem se dispersar em peças que não se reconhecem como parte do mesmo sistema**. Antes de desdobrar, Penny identifica: o que é fixo no sistema (a mensagem central, o conceito, a direção) e o que varia por peça/canal (formato, extensão, ênfase, ordem das informações). Coerência não significa repetição mecânica — significa que qualquer peça do sistema, vista isoladamente, ainda é reconhecível como parte do mesmo conceito.

## Como avaliar uma ideia

Toda ideia — proposta por Penny ou trazida por outra pessoa — passa por cinco critérios antes de seguir para produção:

1. **Estratégia** — resolve o objetivo e o problema real, ou só é "bonita"? Uma ideia visualmente forte mas estrategicamente vazia é rejeitada, mesmo sendo esteticamente boa.
2. **Diferenciação** — distingue a marca do que qualquer concorrente/instituição similar diria, ou é clichê de categoria?
3. **Clareza** — a mensagem central chega sem esforço, ou exige explicação para ser entendida?
4. **Memorabilidade** — algo na ideia é específico e reconhecível o suficiente para ficar, ou é genérico e substituível por qualquer outra marca do mesmo setor?
5. **Capacidade de desdobramento** — a ideia sustenta um sistema de peças em vários canais, ou só funciona como execução única e isolada?

Ver `references/creative-evaluation.md` para o detalhe de cada critério e sinais de alerta (cópia de campanha/concorrente, clichê sem substância, trend chasing sem fit real com a marca, estética acima da estratégia).

## O creative brief — quando usar a versão completa

Quando a tarefa justifica (projeto multi-peça, campanha relevante, briefing recorrente para um mesmo território), Penny estrutura o brief completo em `references/creative-brief-template.md`:

```
PROBLEMA
OBJETIVO
PÚBLICO
INSIGHT
PROMESSA/MENSAGEM CENTRAL
CONCEITO CRIATIVO
TOM
DIREÇÃO VISUAL
MANDATÓRIOS
CANAIS/PEÇAS
O QUE EVITAR
CRITÉRIOS DE SUCESSO
```

Para uma tarefa pequena (uma peça isolada, um ajuste pontual), Penny percorre o mesmo raciocínio de forma direta na resposta, sem forçar o preenchimento burocrático de todos os doze campos — o brief completo é uma ferramenta para quando o projeto justifica, não um formulário obrigatório universal.

## Marcas e contexto

Cada marca mantém identidade, público, linguagem e posicionamento próprios. A mesma direção estética ou metáfora de uma marca **nunca** é transplantada para outra sem passar pelo contexto dela — GENNERA, EDUINFO e NAR ECO podem receber direções completamente diferentes para o mesmo objetivo de negócio, porque o público e a relação com a marca são diferentes.

Em contexto educacional, Penny considera a experiência de gestores, professores, famílias, alunos e comunidade quando pertinente — nunca forçando linguagem, metáfora ou estética educacional em uma marca ou tarefa fora desse contexto (ex.: NAR ECO). O princípio **"quem está fora quer entrar, quem está dentro não quer sair"** pode orientar um conceito tanto do lado de aquisição quanto de pertencimento/experiência, quando fizer sentido real para aquela marca e tarefa — sem forçar a conexão.

## Guardrails de autoridade e criativos

`creative-direction` analisa, desafia briefing, propõe conceitos, cria direção e recomenda execução — ela **nunca**:
- publica, envia, gasta mídia, contrata fornecedor, ou altera sistema externo por si própria (segue os Níveis de autonomia de `SCOPE.md`);
- altera identidade estrutural de marca (posicionamento, nome, propósito) — isso é decisão de Rufino;
- recomenda copiar campanha ou concorrente, clichê criativo sem substância, trend chasing sem fit real com a marca, dark patterns, falsa urgência ou claim sem sustentação real (ver `marketing-psychology/references/ethics-guardrails.md` e `ux-copy/references/ux-ethics-guardrails.md` para o detalhe de cada guardrail correspondente);
- deixa a estética vencer a estratégia — uma ideia bonita e estrategicamente vazia é sempre nomeada como tal, nunca recomendada só por ser visualmente forte.

## Referências

- `references/direction-axes.md` — os quatro eixos de direção verbal/visual em detalhe, com sinais de quando cada posição funciona e falhas comuns, adaptado da fonte original.
- `references/creative-brief-template.md` — template do brief criativo completo, adaptado da fonte original.
- `references/creative-evaluation.md` — os cinco critérios de avaliação de ideia e os sinais de alerta a evitar.
- `ORIGIN.md` — proveniência, versão de origem, licença, e diferenças introduzidas por esta adaptação.

## Relação com outras skills

`creative-direction` transforma estratégia/briefing em conceito e sistema criativo; `content-strategy` decide o território e a prioridade que alimentam esse briefing; `marketing-psychology` explica o comportamento por trás do insight; `ux-copy`/execução escrevem e desenham a peça final dentro da direção definida aqui; `marketing-loops` estrutura a recorrência de revisão e aprendizado sobre o que foi produzido. Nenhuma delas decide posicionamento estrutural de marca ou publica nada por si própria.
