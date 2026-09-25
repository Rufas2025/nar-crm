# Catálogo de loops — domínios reais da Penny

Cada loop abaixo é um ponto de partida adaptável, não uma automação fixa. Antes de usar qualquer um, preencher as onze partes da anatomia em `SKILL.md` para o contexto específico (marca, público, estágio da jornada). A maioria das execuções de um loop saudável deve ser "verifiquei, nada a fazer" — um loop que age em toda execução provavelmente está reagindo a ruído.

## LinkedIn e conteúdo

### O loop de conteúdo com feedback (sem postagem automática infinita)
- **Trigger**: cadência semanal, ou publicação de uma nova peça de conteúdo.
- **Acts when**: uma peça publicada acumulou engajamento suficiente para avaliação, ou passou N dias sem nenhuma repercussão mensurável.
- **Objetivo**: aprender o que funciona por marca/público, sem transformar o loop em máquina de postar.
- **Loop body**: revisar peças publicadas na janela → comparar engajamento real (não vaidade) com a expectativa → identificar padrão (formato, tema, horário) → preparar rascunho de ajuste para a próxima peça → **nunca publicar automaticamente** a próxima peça sem checkpoint humano.
- **Self-check**: o resultado é padrão real ou variação de amostra pequena/sazonalidade (ex.: semana de recesso escolar)?
- **State/idempotência**: registrar quais peças já foram avaliadas neste ciclo; nunca reavaliar a mesma peça como "nova aprendizagem" duas vezes.
- **Stop/bail-out**: sem sinal suficiente → log "sem ação". Publicação em si é sempre Tier 2 (checkpoint humano) — o loop prepara e propõe, não publica.
- **Owner/checkpoint**: Penny prepara e recomenda; publicação exige aprovação de Rufino ou de quem ele designar por marca.

## Leads, qualificação e CRM

### O loop de qualificação sem duplicidade
- **Trigger**: novo lead capturado, ou lote de leads processado.
- **Acts when**: um lead atende (ou deixa de atender) critérios de qualificação já aprovados para aquela marca.
- **Objetivo**: manter qualidade de base — "uma base menor e confiável vale mais que muitos registros ruins" (princípio da Soul da Penny).
- **Loop body**: verificar se o lead já existe no CRM (deduplicação antes de qualquer ação) → aplicar critérios de qualificação aprovados → atualizar CRM dentro das políticas existentes → sinalizar leads ambíguos para revisão em vez de forçar classificação.
- **Self-check**: a fonte do lead é confiável? Dado incompleto foi tratado como incerteza explícita, não como "sem informação = desqualificado" ou "sem informação = qualificado".
- **State/idempotência**: CRM é a fonte canônica do estado do lead — o loop consulta e atualiza o CRM, nunca mantém uma cópia paralela em Memory que possa divergir.
- **Stop/bail-out**: lead já processado nesta janela → não reprocessar. Erro de integração com o CRM → parar e reportar, nunca "adivinhar" o estado.
- **Owner/checkpoint**: Penny executa dentro da política aprovada de qualificação; mudança nos critérios de qualificação em si é decisão de Rufino.

### O loop de cadência de acompanhamento (sem spam)
- **Trigger**: lead/prospect entra em uma cadência aprovada.
- **Acts when**: chegou o próximo toque da cadência **e** o destinatário não está em cooldown/opt-out.
- **Objetivo**: acompanhar prospects sem re-contatar quem já pediu para não ser contatado, ou duplicar mensagem.
- **Loop body**: verificar cooldown/opt-out no CRM antes de qualquer toque → confirmar que o próximo passo da cadência ainda é relevante (o lead avançou/estagnou?) → preparar ou executar o toque conforme a política já aprovada para aquela cadência.
- **Self-check**: essa cadência ainda faz sentido para esse lead, ou o contexto mudou desde que ele entrou nela?
- **State/idempotência**: cooldown por contato + contador de toques já enviados; nunca reenviar o mesmo toque por reprocessamento.
- **Stop/bail-out**: opt-out ou resposta recebida → parar a cadência para aquele contato imediatamente. Número máximo de toques atingido sem resposta → parar, não escalar frequência.
- **Owner/checkpoint**: toques dentro de cadência já aprovada são Tier 1 (executa dentro de política); qualquer mensagem fora do roteiro aprovado exige checkpoint humano.

## Retenção, experiência e referral

### O loop de sinais de experiência (família/aluno/cliente)
- **Trigger**: cadência semanal ou quinzenal, cruzada com eventos-chave da jornada (matrícula, virada de ano, fechamento de ciclo).
- **Acts when**: um sinal real de risco de saída (não suposição) aparece — queda de engajamento, reclamação registrada, ausência em momento crítico.
- **Objetivo**: agir no princípio "quem está dentro não quer sair" — cuidar da experiência antes que a saída se torne decisão.
- **Loop body**: revisar sinais disponíveis no CRM/sistema de atendimento → identificar contas/famílias com sinal real de risco → preparar recomendação de ação (não a ação em si, se envolver contato sensível) → sinalizar para o owner do relacionamento.
- **Self-check**: o sinal é robusto ou é ruído de um único ponto de dado? Momentos de transição (matrícula, início de ano, desligamento) merecem atenção redobrada — é onde a regra do pico-fim mais pesa na percepção da experiência.
- **State/idempotência**: contas já sinalizadas nesta janela não são resinalizadas como "nova descoberta"; cooldown evita alertar a mesma conta repetidamente sem novo sinal.
- **Stop/bail-out**: sem sinal robusto → log "estável". Conta institucional/estratégica ou comunicação sensível → sempre escalar para Rufino/responsável de negócio, nunca ação autônoma.
- **Owner/checkpoint**: Penny analisa e recomenda; contato direto sensível ou compromisso comercial pertence a Rufino ou ao responsável de negócio designado (conforme `SCOPE.md`).

### O loop de referral (quem está dentro traz quem está fora)
- **Trigger**: marco de experiência positiva atingido (ex.: NPS/feedback forte, tempo de permanência, indicação espontânea recebida).
- **Acts when**: existe evidência real de satisfação suficiente para convidar à indicação — nunca pedir referral de quem está insatisfeito ou sem sinal claro.
- **Objetivo**: conectar retenção e aquisição de forma legítima — a experiência real gera a prova social real usada em captação (ver `marketing-psychology`).
- **Loop body**: identificar clientes/famílias com sinal real de satisfação → preparar convite de indicação adequado ao tom da marca → registrar indicação recebida no CRM → conectar de volta ao loop de qualificação de leads quando a indicação se converter em novo lead.
- **Self-check**: o convite seria confortável de fazer abertamente? Está de acordo com o teste de legitimidade de `marketing-psychology/references/ethics-guardrails.md`?
- **State/idempotência**: não repetir convite de indicação para o mesmo contato dentro do cooldown; registrar indicações já convertidas para não contá-las duas vezes.
- **Stop/bail-out**: sem sinal de satisfação suficiente → não convidar. Indicação não gera dado verificável → não contar como resultado do loop.
- **Owner/checkpoint**: convite e registro dentro de política aprovada são Tier 1; qualquer incentivo financeiro ou compromisso comercial pelo referral é decisão de Rufino.

## Aprendizado de campanha

### O loop de aprendizado pós-campanha (sem transformar resultado em regra)
- **Trigger**: encerramento de uma campanha, ou marco intermediário relevante.
- **Acts when**: há dado suficiente para uma leitura real (volume mínimo, período mínimo) — nunca ao primeiro resultado fraco ou forte isolado.
- **Objetivo**: transformar resultado de campanha em hipótese testável, não em regra permanente.
- **Loop body**: comparar resultado real contra o objetivo/hipótese original da campanha → classificar a causa provável (criativo, público, canal, momento, oferta, execução) → formular hipótese específica para o próximo teste → propor incorporação **somente** se o padrão se repetir em mais de um ciclo.
- **Self-check**: o resultado tem volume/tempo suficiente para significância, ou é uma amostra pequena sendo lida como tendência? Ver erro de atribuição fundamental em `marketing-psychology` — antes de "essa campanha não funciona", revisar se o processo/momento explicam o resultado.
- **State/idempotência**: registrar campanhas já avaliadas; não reabrir a mesma análise sem novo dado.
- **Stop/bail-out**: dado insuficiente → aguardar próximo ciclo, não concluir. Um único resultado nunca se torna critério permanente sozinho — isso segue o Learning Loop da Penny (`DETECT → ... → RETAIN/REVISE`), não a decisão isolada deste loop.
- **Owner/checkpoint**: Penny analisa e propõe hipótese; incorporar o aprendizado a um Playbook, critério de qualificação ou Memory segue a governança do Learning Loop, não é automático.

## Tabela rápida — domínio → loop de partida

| Domínio da tarefa | Loop de partida |
|---|---|
| LinkedIn/conteúdo recorrente | Loop de conteúdo com feedback |
| Novo lead ou lote de leads | Loop de qualificação sem duplicidade |
| Prospect em acompanhamento | Loop de cadência de acompanhamento |
| Risco de evasão/insatisfação | Loop de sinais de experiência |
| Cliente/família satisfeito | Loop de referral |
| Campanha encerrada ou em marco | Loop de aprendizado pós-campanha |
| Marca fora de educação (ex.: NAR ECO) | Qualquer loop acima, sem forçar exemplo escolar — o mecanismo (trigger/estado/stop) é o mesmo, o conteúdo/tom muda por marca |
