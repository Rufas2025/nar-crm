# Padrões de interação — por tipo de ponto de contato

Cada padrão é um ponto de partida adaptável por marca, público e canal — não um texto pronto para copiar e colar. Antes de aplicar qualquer um, percorrer o modelo CONTEXTO → INTENÇÃO → FRICÇÃO → MENSAGEM → AÇÃO → FEEDBACK → PRÓXIMO PASSO do `SKILL.md` para o caso real.

## CTAs (formulário, landing page, e-mail, WhatsApp)

- Começar com verbo de ação: "Agendar visita", "Falar com um consultor", "Confirmar matrícula" — nunca um rótulo vago como "Enviar" ou "Continuar" quando um verbo específico existe.
- Ser específico sobre o resultado: o rótulo do botão deve corresponder exatamente ao que acontece ao clicar — se abre uma conversa de WhatsApp, dizer "Falar no WhatsApp", não "Saiba mais".
- Casar o CTA com o estágio da jornada: um CTA de primeiro contato (aquisição) pede menos compromisso ("Conhecer a proposta") que um CTA de decisão já madura ("Confirmar matrícula").

## Mensagens de erro

Estrutura: **o que aconteceu + por que + como resolver.**
- Exemplo adaptável: "Não foi possível confirmar seu horário. Esse horário acabou de ser preenchido por outra família. Escolha outro horário disponível ou fale com a secretaria." — nunca só "Erro ao processar solicitação."
- Tom: empático e prático, nunca acusatório ("Você preencheu errado") — mesmo quando o erro é do usuário, o texto foca em como resolver, não em quem errou (ver "erro de atribuição fundamental" em `marketing-psychology`).

## Estados vazios (dashboard, painel, lista sem conteúdo ainda)

Estrutura: **o que é isto + por que está vazio + como começar.**
- Exemplo adaptável: "Nenhuma indicação registrada ainda. Quando uma família indicar alguém, ela aparece aqui. Compartilhe o link de indicação para começar." — nunca deixar uma tela vazia sem explicação nem próximo passo.

## Diálogos de confirmação (especialmente cancelamento/opt-out)

- Deixar a ação explícita: "Cancelar matrícula de [Nome]?" em vez de "Tem certeza?".
- Descrever a consequência real, sem exagero nem minimização: "Essa ação não pode ser desfeita" quando for verdade; "Você pode reativar a qualquer momento" quando também for verdade — nunca omitir a consequência real para reduzir a fricção de cancelar, e nunca inventar uma consequência para dificultar.
- Rotular os botões pela ação, não por "OK"/"Cancelar": "Cancelar matrícula" / "Manter matrícula".
- Cancelamento e opt-out seguem o mesmo padrão de clareza que qualquer confirmação de compromisso — ver `references/ux-ethics-guardrails.md` para o que nunca fazer aqui.

## Tooltips e ajuda contextual

- Concisos, úteis, nunca óbvios — um tooltip que só repete o rótulo do campo não ajuda ninguém.
- Usar quando o termo pode ser desconhecido do público (ex.: um termo técnico de gestão escolar para um gestor não especialista) — sem assumir que todo público entende o mesmo jargão.

## Estados de carregamento/espera

- Definir expectativa e reduzir ansiedade: "Isso pode levar até 1 minuto" é melhor que um carregamento silencioso sem prazo, especialmente em fluxos sensíveis (confirmação de pagamento, envio de matrícula).

## Onboarding

- Revelação progressiva: um conceito por vez, na ordem em que a pessoa realmente precisa dele — nunca uma lista de todos os recursos de uma vez.
- Adaptar profundidade ao público: onboarding de um gestor educacional pode assumir mais contexto de negócio que o onboarding de uma família em um app de comunicação escolar.

## Mensagens de próximo passo — e-mail e WhatsApp

Quando o canal é e-mail ou WhatsApp dentro de uma cadência de CRM (ver `marketing-loops`), a mensagem de próximo passo segue a mesma lógica de confirmação/feedback de uma interface, adaptada ao tom conversacional do canal:
- Confirmar o que a pessoa acabou de fazer (feedback) antes de pedir o próximo passo.
- Ser específica sobre o que vem a seguir: "Recebemos seu interesse na EDUINFO. Nosso time vai te ligar até quinta-feira às 18h para agendar a visita." — nunca um genérico "Em breve entraremos em contato."
- Respeitar deduplicação/cooldown do loop que originou a mensagem (ver `marketing-loops/references/loop-guardrails.md`) — nunca enviar a mesma mensagem de próximo passo duas vezes por reprocessamento.

## Copy de atendimento e CRM (texto usado por quem atende, não só interface)

- O mesmo princípio de "o que aconteceu + por que + como resolver" vale para uma resposta de atendimento a uma reclamação — clareza e caminho de resolução antes de qualquer desculpa genérica.
- Termos usados no CRM (nome de etapa do funil, status, motivo de perda) devem ser consistentes com os termos usados na comunicação externa da mesma marca — inconsistência de termo interno vs. externo é uma fricção comum e evitável.

## Tabela rápida — tipo de tarefa → padrão de partida

| Tarefa | Padrão de partida |
|---|---|
| Formulário de captação com abandono alto | CTA + diagnóstico de fricção no campo específico que causa abandono |
| Erro durante matrícula/onboarding | Mensagem de erro (o que + por quê + como resolver) |
| WhatsApp de próximo passo após ação de lead | Mensagem de próximo passo — e-mail e WhatsApp |
| Cancelamento/opt-out | Diálogo de confirmação — nunca esconder ou dificultar |
| Painel/lista sem conteúdo ainda | Estado vazio |
| Mesma interação, duas marcas | Repetir o modelo CONTEXTO→...→PRÓXIMO PASSO integralmente para cada marca — nunca traduzir palavra por palavra de uma marca para outra |
