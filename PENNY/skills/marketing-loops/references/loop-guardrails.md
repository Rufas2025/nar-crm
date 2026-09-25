# Guardrails de loop — autoridade, estado e conformidade

Loops agem em cadência, muitas vezes sobre dados de pessoas reais e, em alguns casos, com dinheiro ou voz pública da marca envolvidos. Esta referência consolida as regras que impedem um loop autônomo de causar dano ou de silenciosamente ampliar a autoridade da Penny. Aplicar a qualquer loop que publique, gaste, envie a terceiro, ou toque dado pessoal.

## Princípio — Capability ≠ Authority ≠ Identity

Ter a capability técnica de rodar um loop não amplia a autoridade da Penny. Os "Níveis de autonomia" reais pertencem a `SCOPE.md` — este documento apenas organiza *quando* cada nível já existente se aplica a uma ação de loop. Um loop nunca cria autoridade nova, e aprender a desenhar loops é aprendizado de domínio, não aprendizado estrutural (ver Learning Loop).

## Modelo de duas camadas

Toda ação que um loop pode realizar é classificada em uma das duas camadas:

**Tier 1 — autônomo dentro de política** (Penny pode executar sem novo checkpoint por execução, dentro do que `SCOPE.md` já autoriza): ler dado, analisar, comparar, pontuar, **preparar rascunho**, **sinalizar para revisão**, atualizar CRM dentro de critérios já aprovados, executar toque de cadência já autorizada.

**Tier 2 — exige checkpoint humano por padrão**: **publicar** qualquer coisa pública; **gastar** ou **realocar** orçamento de mídia; **enviar** mensagem fora de cadência/roteiro já aprovado; **apagar/suprimir** registro; **alterar** configuração viva de sistema (CRM, n8n, Agenda Service); qualquer compromisso comercial ou promessa excepcional.

Uma ação Tier 2 só pode rodar sem checkpoint por execução se Rufino tiver **autorizado isso explicitamente**, com limites (caps) e lista de permissão (allowlist) definidos. Na ausência disso, o loop prepara e sinaliza — nunca executa.

## Guardrails de gasto (quando aplicável a mídia paga)

- **Teto rígido**: limite de gasto diário/semanal que o loop nunca pode exceder; parar e alertar ao se aproximar.
- **Limite por execução**: quanto orçamento pode mudar em um único ciclo (ex.: ≤20%), para que uma leitura errada não realoque tudo de uma vez.
- **Lista de permissão**: apenas contas/campanhas especificadas são elegíveis para mudança autônoma; o resto é sempre sinalizado para revisão.
- **Métrica direcional correta**: julgar mudança de mídia paga por resultado real de negócio, nunca só por uma métrica-proxy que pode ser otimizada às custas do resultado real.

## Guardrails de publicação e envio

- **Fila de preparação + aprovação humana por padrão** para qualquer coisa pública ou enviada a terceiro. Preparar rascunho é sempre permitido; publicar/enviar não é, exceto com autorização explícita e limites definidos.
- **Limites de volume**: por execução e por destinatário, para que um loop não sature um canal ou uma lista.
- **Checar supressão/opt-out primeiro**: nunca contatar alguém que já pediu para não ser contatado.
- **Sem publicação automática onde há risco de marca ou de detecção**: redes sociais próprias, resposta a reclamação pública, comunidade — sempre preparado para um humano revisar antes.

## Conformidade e dado pessoal

- **Consentimento e opt-out**: honrar pedidos de não-contato imediata e permanentemente; identificar o remetente; nunca contatar sem base legítima.
- **Minimização de dado**: usar o mínimo de dado pessoal necessário para a decisão do loop; não acumular dado pessoal em estado além do necessário.
- **Transparência de indicação/depoimento**: qualquer uso de depoimento ou indicação real exige que a pessoa tenha de fato autorizado seu uso — nunca fabricar ou usar sem permissão (ver também o teste de legitimidade em `marketing-psychology/references/ethics-guardrails.md`).
- **Sem PII bruta em estado ou log de execução**: usar identificador interno, nunca nome/e-mail/telefone em texto puro no arquivo de estado do loop.
- Quando o loop não conseguir confirmar consentimento, permissão ou adequação — a condição de parada padrão é **não agir**; sinalizar para um humano em vez de assumir que está tudo bem.

## Lista de sempre-escalar

Estas situações nunca rodam de forma totalmente autônoma, mesmo com autorização prévia de outras ações do mesmo loop:

- Menção negativa ou de crise envolvendo a marca; resposta a reclamação ou a assunto sensível (jurídico, financeiro, de saúde).
- Conta institucional de alto valor ou em risco relevante (ex.: escola/gestor estratégico).
- Anomalia de receita ou de gasto de mídia — sinalizar imediatamente, nunca autocorrigir.
- Qualquer ação que apagaria dado ou contataria um volume grande de pessoas de uma vez.
- Comunicação que envolva promessa comercial excepcional ou compromisso financeiro.

## Estado e idempotência

Um loop só é seguro se souber o que já fez. Manter, por loop:

- **cursor/marca de água** — só processar itens mais novos que a última execução processada; avançar a marca só ao final de uma execução bem-sucedida.
- **conjunto de já tratados** — chaves de deduplicação (ex.: id de lead, id de conta) para nunca agir duas vezes sobre o mesmo item.
- **janelas de cooldown** — por contato/conta, para nunca recontatar alguém dentro da janela.
- **itens em andamento** — para não iniciar uma segunda ação conflitante sobre algo já em curso (ex.: um teste ainda aberto).

O estado do loop nunca substitui um sistema canônico: CRM continua sendo a fonte oficial do dado de lead/cliente; Agenda Service continua sendo a fonte oficial de compromisso. O estado do loop guarda apenas o que o próprio loop precisa lembrar para não se repetir — nunca uma cópia divergente do dado oficial.

## Log de execução

Registrar uma linha por execução, mesmo quando não há ação — isso é o que permite identificar um "loop de vaidade" (que nunca age e ninguém sente falta, ou que age toda vez, sinal de que está reagindo a ruído). Registrar no mínimo: quando rodou, quantos itens foram verificados, quantos geraram ação, e uma nota curta.

## Kill switch

Todo loop agendado precisa de um desligamento manual claro, documentado onde o loop está agendado (cron, `/loop`, `ScheduleWakeup`, ou equivalente). Um loop que não pode ser parado rapidamente é um risco, não uma capability.

## Checklist antes de agendar qualquer loop

- [ ] Toda ação do loop está classificada como Tier 1 ou Tier 2.
- [ ] Ações Tier 2 estão em fila de aprovação — ou têm autorização explícita de Rufino + limites + lista de permissão.
- [ ] Loops que envolvem gasto têm teto rígido e limite por execução.
- [ ] Loops que envolvem envio checam supressão/opt-out e têm limite de volume.
- [ ] Nenhum PII bruto em estado ou log.
- [ ] Casos de sempre-escalar estão mapeados para um humano.
- [ ] Existe um kill switch documentado.
- [ ] O loop não altera Soul, Positioning, Scope, Memory ou Learning Loop, e não assume nível de autonomia que `SCOPE.md` não concede.
