# RADAR_IMPLEMENTATION — Fase 2 (core)

Implementação da fundação do Radar. Complementa `CURRENT_ARCHITECTURE.md`,
`AVAILABLE_TOOLS.md` e `RADAR_GAP_ANALYSIS.md`.

## Confirmações de escopo

```
NETWORK_CHANGES=NO        listener HTTP local; sem túnel, sem porta pública, sem DNS/VPN/proxy
N8N_CHANGES=NO            nenhum workflow tocado, nenhuma dependência de n8n
INSTAGRAM_AUTOMATION=NO   adapter existe e lança CapabilityUnavailableError
LINKEDIN_AUTOMATION=NO    idem
COMPOSIO_ASSUMED=NO       adapter apenas fixa contrato futuro
```

## Arquitetura

Servidor MCP TypeScript isolado em `radar-mcp/`, **fora** do build do CRM.
Transporte Streamable HTTP stateless (uma instância de servidor por requisição)
e stdio para desenvolvimento.

```
Rufas/Hermes ──Bearer JWT──> Radar MCP (/mcp) ──JWT──> Supabase (RLS)
                                   │
                                   └─> payload estruturado ──> Rufas ──> Telegram
```

Decisão de segurança central: o servidor **nunca usa service_role**. Todo acesso
carrega o JWT do chamador, então a RLS do Postgres é a barreira real — o MCP não
tem poder de contornar o isolamento entre usuários.

## Quem classifica

A decisão semântica é do agente. `radar_classify_construction` recebe a análise
e roda contraprova léxica determinística que extrai evidência, lista divergências
e **reduz** a confiança persistida (`effectiveConfidence` nunca aumenta).

Seis divergências detectadas: obra afirmada sem léxico de obra; escola afirmada
sem léxico educacional; linguagem metafórica ("construir conhecimento"); estágio
sem sustentação textual; tipo sem sustentação textual; alta confiança sem texto.

## Arquivos criados

**Migration (1):** `supabase/migrations/20260907120000_radar_core.sql`

**Servidor (19 arquivos TS):**
- `src/{index,server,config,capabilities,types}.ts`
- `src/db/{client,repositories}.ts`
- `src/domain/{vocabulary,normalize,dedupe,classification,scoring,payload}.ts`
- `src/adapters/{types,available,unavailable}.ts`
- `src/tools/index.ts` — as 13 tools
- `tests/{fixtures,domain.test}.ts`

**Config:** `package.json`, `tsconfig.json`, `tsconfig.test.json`, `.gitignore`, `README.md`

**Modificados no CRM: nenhum.**

## Schema

8 tabelas: `radar_institutions`, `radar_signals`, `radar_opportunities`,
`radar_construction_assessments`, `radar_contacts`, `radar_evidence`,
`radar_outreach`, `radar_jobs`. Todas com `user_id` + RLS `auth.uid() = user_id`.

Barreiras estruturais no banco (não só no código):

| Constraint | Garante |
|---|---|
| `radar_signals_content_present` | sinal exige `source_url` ou `raw_text` |
| `radar_outreach_send_requires_approval` | nada vira `sent` sem `approved_at` e `sent_at` |
| `radar_contacts_inferred_not_verified` | `verified` exige e-mail ou telefone real |
| `confidence CHECK 0..1` | confiança fora de faixa é rejeitada |
| índices únicos parciais | dedupe por domínio, instagram, url, id externo |

`opt_out_status` já existe em `radar_contacts` — LGPD preparada antes da etapa de envio.

## Dedupe

Chave **forte** (domínio, instagram normalizado, url exata, id externo) reusa o
registro automaticamente. Chave **fraca** (nome normalizado + cidade + UF) apenas
devolve candidato e exige `confirm_weak_match=true`. Sem merge automático de
baixa confiança.

## Scoring

100 pontos entre 5 componentes verificáveis: `construction_signal` (30),
`recency` (20), `construction_stage` (15), `institution_confidence` (20),
`contact_quality` (15).

`eduinfo_fit` e `ecoclear_fit` retornam `null` com
`fit_reason: insufficient_service_catalog` e ficam **fora** do score. Os pontos
que ocupariam **não são redistribuídos**, para o score não inflar artificialmente.

## Capabilities reais

```
manual_signal=true          supabase_storage=<conforme env>
web_research=false          (modo agent_delegated: o servidor não busca)
gmail_draft=true            email_send=false
instagram_*=false           linkedin_*=false
composio_connected=false    telegram_direct=false    n8n_access=false
```

## Testes executados

**38/38 do núcleo determinístico** (`node --test`), cobrindo os 9 cenários
exigidos, normalização, dedupe, scoring, payload e capabilities.

Um bug real foi encontrado pelos testes e corrigido: `manutenção`/`pintura`/
`reparo` viviam só em `TYPE_HINTS.maintenance` e não em `CONSTRUCTION_TERMS`,
então um caso legítimo de `maintenance` era acusado de "não ter léxico de obra".
A contraprova passou a considerar a união dos dois conjuntos.

**Migration validada contra PostgreSQL 16 real** (cluster descartável, com
`auth.uid()` e role `authenticated` recriados):

- 8 tabelas criadas, RLS ativa nas 8, 8 policies;
- sinal sem url e sem texto → rejeitado;
- outreach `sent` sem aprovação → rejeitado;
- `confidence = 1.5` → rejeitado;
- domínio duplicado no mesmo usuário → rejeitado; **em outro usuário → aceito**;
- trigger `updated_at` funcionando.

**RLS provada com dois usuários distintos:**

| Tentativa de B sobre dados de A | Resultado |
|---|---|
| SELECT | 0 linhas |
| INSERT com `user_id` de A | `ERROR: new row violates row-level security policy` |
| UPDATE | `UPDATE 0` |
| DELETE | `DELETE 0` |
| dado de A após as tentativas | intacto |

**Servidor MCP em execução:** handshake `initialize` OK, `tools/list` retorna as
13 tools, `radar_get_capabilities` responde sem JWT, e as tools de escrita falham
fechado (`AuthRequiredError`) sem JWT.

## Não testado

Fluxo ponta a ponta contra o Supabase de produção — exige `SUPABASE_URL`,
`SUPABASE_ANON_KEY` e um JWT de usuário real, indisponíveis nesta sessão.
O que foi validado é o schema (Postgres real), a RLS (dois usuários reais), a
lógica determinística (38 testes) e o protocolo MCP (servidor rodando).

## Deploy recomendado (uma opção, sem executar)

**Fly.io.** Atende os critérios pedidos: HTTPS automático com certificado
gerenciado, secrets via `fly secrets set` (nunca no repositório), logs agregados,
rollback por release (`fly releases` / `fly deploy --image`), escala a zero para
custo baixo e zero gestão manual de rede — sem túnel, sem abrir porta, sem DNS
manual. O servidor já é stateless, que é o requisito para isso funcionar.

Alternativas descartadas: Vercel/Netlify (functions com timeout curto, atrito com
servidor MCP de longa duração); VPS (exige gestão manual de rede e TLS, proibido).

**Nenhum deploy foi feito.** Requer sua aprovação.

## Como conectar o Composio depois

1. Conectar o Composio na conta e **reauditar** as actions reais (não presumir).
2. Atualizar `AVAILABLE_TOOLS.md` com as actions verificadas.
3. Implementar `src/adapters/composio.ts` conforme a interface `ComposioAdapter`
   já definida em `adapters/types.ts`.
4. Trocar o import em `capabilities.ts` — as tools não mudam.
5. Só então virar `composio_connected` para `true`.

O contrato já existe; o que falta é a implementação real, e ela só deve ser
escrita depois da auditoria das actions.

## Próximo prompt recomendado

> Aplicar a migration `20260907120000_radar_core.sql` no Supabase de dev, criar o
> service user do Rufas, e rodar o fluxo E2E com um sinal real:
> `register_signal → resolve_institution → classify_construction →
> find_contacts → score_opportunity → get_opportunity`, validando o payload do
> Rufas e a RLS com o JWT real.
