# NAR Radar MCP

Servidor MCP do **Radar de obras em colégios** (Eduinfo + Eco Clear).

Opera como **qualificador de sinais manuais**: você traz URL e/ou texto de uma
publicação, o Radar persiste, você classifica semanticamente, o Radar confere
contra o texto, pontua e devolve o payload para o Rufas notificar.

Não faz discovery automático, não lê Instagram, não busca no LinkedIn, não
envia outreach e não depende de n8n.

## Requisitos

- Node.js >= 20
- Projeto Supabase com a migration `20260907120000_radar_core.sql` aplicada

## Variáveis de ambiente

Nenhum secret é lido de arquivo versionado.

| Nome | Obrigatória | Descrição |
|---|---|---|
| `SUPABASE_URL` | sim | URL do projeto Supabase |
| `SUPABASE_ANON_KEY` | sim | anon key (o JWT do chamador concede acesso via RLS) |
| `RADAR_MCP_PORT` | não | porta HTTP (default `8787`) |
| `RADAR_MCP_TRANSPORT` | não | `http` (default) ou `stdio` |
| `RADAR_LOG_LEVEL` | não | `silent` \| `error` \| `info` \| `debug` |
| `RADAR_SUPABASE_JWT` | não | apenas em modo `stdio`, para desenvolvimento local |

## Uso

```bash
npm install
npm run build
npm start          # Streamable HTTP em /mcp
npm test           # 38 testes do núcleo determinístico
```

Health check: `GET /health`. Endpoint MCP: `POST /mcp`.

## Autenticação

Cada requisição precisa de `Authorization: Bearer <supabase_jwt>`.
O servidor **nunca** usa `service_role`: todo acesso passa pelo JWT do usuário,
então a RLS do Postgres é a barreira real de isolamento.

`radar_get_capabilities` é a única tool que responde sem JWT.

## Tools

| Tool | Escrita? | Nota |
|---|---|---|
| `radar_get_capabilities` | não | capacidades reais de runtime |
| `radar_register_signal` | sim | persiste antes de processar; exige url **ou** texto |
| `radar_resolve_institution` | sim | dedupe; chave fraca exige `confirm_weak_match` |
| `radar_research_institution` | não | devolve **plano** de busca; o servidor não busca |
| `radar_classify_construction` | sim | persiste sua análise + contraprova léxica |
| `radar_find_contacts` | sim | exige `source_url`; rejeita `verified` sem contato real |
| `radar_score_opportunity` | sim | score determinístico 0–100 |
| `radar_save_opportunity` | sim | cria/atualiza oportunidade |
| `radar_get_opportunity` | não | inclui `rufas_payload` |
| `radar_list_opportunities` | não | ordenado por score |
| `radar_prepare_outreach` | sim | rascunho `pending_approval`; **nunca envia** |
| `radar_mark_false_positive` | sim | registra motivo como evidência |
| `radar_schedule_recheck` | sim | cria job pendente; sem scheduler próprio |

## Decisão de arquitetura: quem classifica

A decisão semântica é do **agente**, não do código. `radar_classify_construction`
recebe sua análise e roda uma contraprova léxica determinística que:

1. extrai evidência textual concreta;
2. lista divergências entre o que você afirmou e o que o texto sustenta;
3. **reduz** a confiança persistida a cada divergência (nunca aumenta).

Isso atende "não depender somente de keyword" sem fingir que regex faz
julgamento semântico.

## Limitações declaradas

- `eduinfo_fit` e `ecoclear_fit` são sempre `null` (`insufficient_service_catalog`)
  e ficam **fora** do score, sem redistribuir os pontos.
- Profundidade de escopo e discovery automático não existem nesta fase.
- Adapters de Instagram, LinkedIn e Composio existem apenas para fixar contrato:
  toda chamada lança `CapabilityUnavailableError`. Nenhum mock retorna dado falso.
