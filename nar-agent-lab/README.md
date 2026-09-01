# nar-agent-lab

**Laboratório de contrato MCP do ecossistema NAR — `NAR-MCP-LAB-V0.1`.**

| | |
|---|---|
| Contrato | `nar-ops-mcp@0.1.0` (**FROZEN**) |
| Status | `LAB` · ambiente `mock` |
| Superfície | 10 capabilities, **todas read-only** |
| Agentes | `rufas-router`, `marketing-nar`, `atendimento-nar`, `crm-nar`, `produto-nar`, `engenharia-nar` |
| Orquestração | `rufas-router@0.1.0` + 4 contratos (`NAR-SUBAGENTS-ROUTER-V0.1`) |
| Agentes especialistas | ainda não escritos — primeiro provar o router |

## O que isto NÃO é

Não é um servidor. Não há processo, porta, endpoint publicado, credencial ou secret.
Nenhuma conexão com CRM real, Google Drive real ou n8n real. Nenhuma tool produz side
effect. Todos os dados são fictícios e não contêm informação pessoal real.

Este diretório é **documentação e dados** — não é código, não entra no build da aplicação
e não tem dependências.

## Objetivo

Congelar o contrato de capabilities **antes** de desenhar os subagentes, para que eles
sejam escritos contra uma superfície fechada de capabilities de negócio, em vez de acesso
técnico genérico.

## Arquivos

| Arquivo | Papel |
|---|---|
| `capabilities/capability-registry.json` | Fonte da verdade legível por máquina |
| `capabilities/capability-registry.md` | Mesma informação para leitura humana |
| `mcp/nar-ops-mcp-contract.json` | Contrato congelado: agentes, escopo, schemas, erros, ordem de avaliação |
| `mcp/nar-ops-mcp-mock.json` | Resolvers declarativos (não executável) |
| `mcp/mock-data/*.json` | Dados fictícios controlados |
| `tests/mcp-contract-tests.json` | 24 casos de contrato |
| `tests/mcp-policy-tests.json` | 21 casos de política |
| `reports/mcp-readiness-report.md` | **Comece por aqui** |
| `agents/rufas-router.md` | Orquestrador `rufas-router@0.1.0` — `allowed_tools: []` |
| `contracts/task-contract.md` | Formato obrigatório de missão emitida pelo router |
| `contracts/handoff-contract.md` | Formato obrigatório de retorno dos agentes |
| `contracts/escalation-policy.md` | Quando parar e para quem escalar |
| `contracts/approval-policy.md` | O que exige aprovação humana |
| `benchmarks/router-cases.json` | 22 casos de roteamento |
| `benchmarks/router-report.md` | Resultado da camada de orquestração |

## Política

Read-only · fail-closed · deny-by-default · sem credenciais · sem secrets · sem side
effects · sem capability inventada. Um agente só pode usar tool explicitamente autorizada;
caso contrário, `ACCESS_DENIED`. Tool fora do contrato: `UNKNOWN_TOOL`.
