---
name: n8n-workflow-engineering
description: "Use sempre que Rufas precisar construir, revisar, corrigir ou evoluir um workflow n8n com segurança — diagnóstico de node com falha, alteração estrutural de workflow, validação antes de ativar, HTTP Request retornando erro de serialização/transporte (ex.: circular structure, TLSSocket, EnvProxyHttpAgent), decisão sobre versão de node compatível, backup antes de mudança, ou qualquer situação onde uma alteração em n8n possa quebrar produção. NÃO usar para diagnóstico de incidente multi-camada além do n8n (isso é automation-incident-recovery), nem para pesquisa comercial/CRM/Pré-Work — isso pertence a outras skills."
---

# n8n-workflow-engineering

Maturidade atual: **M0** (draft — nunca executada; ver critério de classificação no final).

## Missão

Permitir que Rufas construa, revise, corrija e evolua workflows n8n com segurança, compatibilidade e baixo retrabalho — sem quebrar o que já funciona, sem inventar sucesso, e sem gastar ciclo em investigação repetida do mesmo problema.

## Escopo

`automatic_route_allowed = NO`. `terminal_allowed = ADMIN_SESSION_ONLY`. `external_write_allowed = CONTROLLED`. Esta skill nunca é acionada por roteamento automático — só em sessão explícita onde uma mudança em n8n foi pedida deliberadamente.

## Governança

- **Owner**: NAR ECO / Anderson Rufino
- **Version**: 0.1.0
- **Last reviewed**: 2026-09-19

**Allowed tools**: n8n editor/API em sessão admin; documentação/metadata; logs de execução; terminal controlado quando necessário; backups/read-only diagnostics.

**Prohibited tools**: rota automática de webhook; root irrestrito; comunicação comercial externa; rotação exploratória de secret; reset de fila/watermark/dedupe para forçar teste.

**Entry conditions**: mudança ou diagnóstico especificamente dentro de n8n.

**Exit conditions**: causa/mudança validada + evidência + rollback conhecido + checkpoint/documentação mínima.

**Abort/escalation conditions**: quando a falha atravessar o n8n para múltiplas camadas, delegar/ativar `automation-incident-recovery`.

## Princípios

- Observar antes de alterar.
- Identificar a versão real do n8n e dos nodes envolvidos antes de assumir comportamento.
- Usar node versions compatíveis com a instalação real, não a versão mais recente da documentação genérica.
- Fazer backup antes de qualquer mudança estrutural.
- Preservar IDs, credentials, connections e dados existentes sempre que possível — reconstrução só quando estritamente necessária.
- Não refazer etapas já comprovadas como `PASS` — se um passo do diagnóstico já deu evidência conclusiva, não repetir por dúvida infundada.
- Trabalhar por checkpoint — cada etapa validada é um ponto de retorno seguro.
- Preferir mudanças mínimas e reversíveis a reformas amplas.
- Uma causa por vez — nunca testar duas hipóteses simultaneamente misturando o resultado.
- Validar node isolado antes de testar o workflow completo.
- Nunca declarar sucesso sem evidência real (log, resposta, execução observada) — nunca por inferência otimista.
- Distinguir explicitamente erro de transporte, configuração, lógica, autenticação e dados — são categorias diferentes com diagnósticos diferentes.
- Não ativar workflow novo sem validação completa.
- Não alterar credenciais ou secrets sem necessidade comprovada — nunca como tentativa exploratória.
- Não resetar watermark/fila/dedupe só para "forçar" um teste passar.
- Preservar idempotência e `correlation_id` em qualquer mudança.
- Considerar n8n/Data Tables como source of truth operacional quando a arquitetura já definiu isso — não introduzir uma segunda fonte de verdade paralela.
- Não usar Rufas (o agente) como banco de estado do workflow — estado do workflow vive no n8n/banco correspondente, nunca na memória de conversa do agente.

## Checklists

Ver `references/checklists.md` para os sete checklists completos: diagnóstico de node; alteração segura; testes isolados; testes end-to-end; rollback; validação pós-deploy; documentação mínima da mudança.

## Playbook de diagnóstico — HTTP Request e erros de serialização/transporte

Um caso real observado (HTTP Request nativo retornando `Converting circular structure to JSON`, envolvendo `TLSSocket` e depois `Socket`/`EnvProxyHttpAgent`) gerou um procedimento de diagnóstico reutilizável — registrado como **playbook**, não como regra absoluta (o próximo erro parecido pode ter causa diferente). Ver `references/diagnostic-playbook.md` para o procedimento completo passo a passo.

## Referências

- `references/checklists.md` — os sete checklists operacionais completos.
- `references/diagnostic-playbook.md` — o playbook de diagnóstico de transporte/serialização, incluindo o caso HMAC/401-como-PASS.

## Critério de classificação de maturidade (M0–M5)

Cumulativo — cada nível exige o anterior cumprido, mais o incremento:

- **M0** — definição existe, nunca executada contra um workflow real.
- **M1** — pelo menos um diagnóstico real de node conduzido ponta a ponta usando os checklists, com causa raiz confirmada.
- **M2** — pelo menos uma alteração estrutural real aplicada com backup prévio, teste isolado, teste end-to-end e validação pós-deploy, sem regressão.
- **M3** — pelo menos um rollback real executado com sucesso a partir de um checkpoint registrado.
- **M4** — uso repetido sem declarar sucesso sem evidência e sem repetir diagnóstico já resolvido.
- **M5** — uso prolongado, promoção humana explícita.

Esta skill está em **M0**. Não atribuir M4/M5 sem a evidência correspondente — nenhuma delas existe ainda.
