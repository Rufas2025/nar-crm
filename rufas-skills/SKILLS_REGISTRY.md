# SKILLS_REGISTRY.md

Registro canônico de skills do Rufas. Toda skill instalada no runtime deve ter uma linha correspondente aqui, mantida sincronizada durante o processo de review/approval descrito em `README.md`.

| skill | status | purpose | execution_scope | automatic_route_allowed | terminal_allowed | external_write_allowed | source_of_truth | notes |
|---|---|---|---|---|---|---|---|---|
| `instagram-opportunity-intake` | ACTIVE | Validar, normalizar e encaminhar evento de oportunidade recebido via Instagram para o pipeline, preservando identidade do evento. | intake/normalização | YES | NO | NO | n8n/Data Tables | Escopo fino: validação, normalização, preservação de `source`/`message_id`/`correlation_id`, canonicalização de URL quando aplicável, encaminhamento. Não concentra inteligência comercial — isso é `prework-educacional-account-intelligence`. |
| `prework-educacional-account-intelligence` | DRAFT | Construir inteligência de conta de instituição de ensino antes de abordagem comercial NAR. | pesquisa/inteligência de conta | YES | NO | NO | n8n/Data Tables; CRM é downstream/exportação posterior | Default mode = `PREPARE_ONLY`. Realiza stakeholder mapping e deep contact enrichment de PRIMARY e SECONDARY quando elegíveis, mantendo `PREPARE_ONLY` e sem outbound automático. |
| `n8n-workflow-engineering` | DRAFT | Construir, revisar, corrigir e evoluir workflows n8n com segurança e baixo retrabalho. | engenharia de automação (n8n) | NO | ADMIN_SESSION_ONLY | CONTROLLED | instalação real do n8n (workflows, credentials, execution logs) | Mudança estrutural sempre exige sessão admin explícita; nunca rota automática. Só pode virar `ACTIVE` após review humano → instalação no runtime → validação mínima. |
| `automation-incident-recovery` | DRAFT | Diagnosticar e recuperar incidentes em n8n/Hermes/Composio/Traefik/webhooks sem destruir estado. | operação/incidente | NO | ADMIN_SESSION_ONLY | CONTROLLED | estado real observado nas camadas (SOURCE→OUTPUT, ver skill) | Nunca reinicia serviço amplo por padrão; sempre parte de checkpoint. Só pode virar `ACTIVE` após review humano → instalação no runtime → validação mínima. |

## Campos — definição

- **status** — `ACTIVE` (em uso), `DRAFT` (em revisão, ainda não aprovada), `DEPRECATED` (substituída, movida para `_archive/`).
- **execution_scope** — o domínio de trabalho real da skill (não o nome, o que ela de fato toca).
- **automatic_route_allowed** — se o roteamento automático (sem confirmação humana explícita) pode invocar essa skill a partir de um gatilho de conversa/evento.
- **terminal_allowed** — se a skill pode executar comandos de terminal, e sob qual condição (`YES`, `NO`, `ADMIN_SESSION_ONLY`).
- **external_write_allowed** — se a skill pode escrever em sistemas externos (`YES`, `NO`, `CONTROLLED` — só sob gate explícito descrito na própria skill).
- **source_of_truth** — de onde vem o dado real que a skill consome/produz; nunca a skill em si.
- **notes** — restrição ou contexto operacional relevante que não cabe nas colunas fixas.

## Skills planejadas (não registradas como linha ativa)

Ver `README.md` — "Skills planejadas". Elas não recebem linha na tabela acima até terem `SKILL.md` real e passarem pelo ciclo de aprovação.
