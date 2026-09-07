# RADAR_GAP_ANALYSIS — Lacunas e decisões bloqueantes

> Fase 1, item 7: nada implementado. Este documento existe para expor divergências
> entre o que o projeto assume e o que foi verificado, antes de qualquer código.

---

## 1. Bloqueadores (impedem executar as fases como escritas)

### B1 — "Expandir o MCP Eduinfo" colide com "não alterar n8n" — **CRÍTICO**

O MCP Eduinfo **é** um conjunto de workflows n8n. Não existe servidor MCP em código.
A instrução pede simultaneamente:

- *"Expandir o MCP atual em vez de criar outro servidor"*
- *"Não alterar workflows n8n existentes"* / *"Não depender de acesso direto ao n8n"*

As duas não podem ser verdadeiras ao mesmo tempo. Some-se que o conector n8n desta
sessão está `needs_reconnect` — não tenho nem leitura.

**Isso se enquadra no "salvo impedimento técnico real identificado na auditoria"** que a
própria Fase 3 prevê. Opções:

| Opção | Consequência |
|---|---|
| **A. Novo MCP Radar em código** (repo, Deno/Node) | não toca n8n, versionável, testável, CI. MCP Eduinfo intacto. Requer decidir onde hospedar. |
| B. Expandir o n8n | viola a instrução; exige reconectar n8n |
| C. Edge Functions Supabase + contrato HTTP, sem MCP | menor superfície; Rufas consome por HTTP, não por MCP |

Recomendação: **A**, com fallback para **C** se hospedagem for problema.

### B2 — Composio não existe neste ambiente — **CRÍTICO**

Zero conectores Composio (`ListConnectors`), zero menções em 211 commits. As Fases 4 e 5
dependem de "Composio" como se fosse infraestrutura existente. Não é.

Decisão necessária: (i) instalar/conectar Composio e reauditar, ou (ii) redesenhar as
Fases 4–5 sobre o que existe (`WebSearch`/`WebFetch` + Google Drive + Gmail).

### B3 — Instagram sem tool — **ALTO**

Fase 4 caminhos C e D (discovery e monitoramento) **não têm implementação possível hoje**.
Sobram A e B (URL enviada por humano). Isso muda a natureza do Radar: de *descoberta
automática* para *qualificação automática de sinais trazidos por humanos*.

Não é pouco — é justamente onde o Rufas agrega: recebe URL, resolve instituição,
enriquece, classifica, pontua e notifica. Mas precisa ser dito com clareza, porque
"Radar" sugere varredura autônoma, que não está disponível.

### B4 — LinkedIn sem tool, e API não expõe o que a Fase 5 pede — **ALTO**

Sem conector. E mesmo com um: a API oficial do LinkedIn não oferece busca de pessoas nem
dados de contato (restrito ao Sales Navigator); scraping viola os ToS. O item "pessoas
relevantes" da Fase 5 não tem caminho automatizado legítimo.

Alternativa viável: `WebSearch` sobre fontes públicas (site institucional, notícias,
Diário Oficial, CNPJ público) — cobre razoavelmente mantenedor/direção e telefone/e-mail
institucional, que são os alvos de prioridade 1 e 2 da própria Fase 5.

---

## 2. Lacunas menores (resolvíveis no design)

### G1 — Persistência exige tabelas novas
Não há tabela de instituição/sinal/contato. O modelo `Opportunity` tem relacionamentos e
exige dedupe — requisito da Fase 2 que JSON em Drive não atende bem.
→ Decisão em aberto: Supabase com migration (recomendado) vs. Drive JSON (sem migration).

### G2 — Telegram não é alcançável pelo Radar
Fase 7 deve entregar **contrato estruturado** (JSON + template de texto) para o Rufas
renderizar, sem infra de rede nova. Isso já é o que a própria fase prevê como fallback.

### G3 — `eduinfo_fit` / `ecoclear_fit` sem base
A Fase 6 reserva 15 + 10 pontos para fit, e a própria instrução proíbe inventar serviços.
Não há no repositório catálogo de serviços da Eduinfo nem da Eco Clear.
→ Preciso de: lista de serviços/produtos de cada uma, ou aceitar que esses 25 pontos
fiquem como `null` com `reason: "catálogo de serviços não fornecido"` até serem supridos.

### G4 — Estágios S0–S6 sem regra de transição
Os 7 estágios estão definidos, mas não como um sinal move a oportunidade entre eles.
→ Design a fazer: transição por evidência nova, nunca regressão automática.

---

## 3. O que sobra: Radar viável na infraestrutura atual

```
[humano envia URL de post/perfil]  ← única entrada disponível
        ↓
radar.register_signal          (persiste sinal bruto + source_url)
        ↓
radar.resolve_institution      (WebSearch: nome → site oficial, cidade/UF, dedupe)
        ↓
radar.classify_construction    (análise semântica: é escola? há obra? tipo? estágio? confiança)
        ↓
radar.research_institution     (WebSearch/WebFetch: site, telefone, e-mails públicos)
radar.find_contacts            (só fontes públicas; verification_status obrigatório)
        ↓
radar.score_opportunity        (0–100 com reasons; fit pendente de catálogo — G3)
        ↓
radar.save_opportunity         (Supabase ou Drive — decisão G1)
        ↓
radar.notify_rufas             (payload estruturado; Rufas renderiza no Telegram)
        ↓
[humano decide]  Investigar / Virou lead / Criar abordagem / Descartar / Rever depois
        ↓
radar.prepare_outreach → Gmail create_draft (automático)
                       → send: APPROVAL_REQUIRED (nunca automático)
```

Das 13 tools propostas, **11 são implementáveis hoje**. As duas comprometidas:
`radar.register_signal` no modo discovery automático (B3) e a parte LinkedIn de
`radar.find_contacts` (B4) — ambas degradam para modo manual/público, não somem.

---

## 4. Riscos

| # | Risco | Severidade | Mitigação |
|---|---|---|---|
| R1 | "Radar" prometer varredura autônoma que não existe (B3) | Alta | alinhar expectativa agora; posicionar como qualificador de sinais |
| R2 | Alucinação de contato/e-mail | Alta | `source_url` obrigatório; `verification_status`; proibição de padrão de e-mail inventado — já nas suas regras |
| R3 | Duplicação de instituição | Média | chave de dedupe (domínio do site + cidade/UF) definida antes de gravar |
| R4 | Score com fit inventado (G3) | Média | fit = `null` + reason explícito até haver catálogo |
| R5 | LGPD em contatos para outreach | Média | base legal registrada + opt-out antes do primeiro envio |
| R6 | Instagram bloquear leitura mesmo por URL | Média | aceitar texto colado pelo humano como fallback de conteúdo |
| R7 | Falso positivo (post de "reforma" que não é obra) | Média | `radar.mark_false_positive` + confidence + revisão humana antes de lead |

---

## 5. Dúvidas bloqueantes (precisam de você antes da Fase 2)

1. **B1** — Novo MCP Radar em código (A), expandir n8n (B), ou Edge Functions + HTTP (C)?
2. **B2** — Composio deve ser conectado, ou redesenho sobre WebSearch/Drive/Gmail?
3. **G1** — Persistência: Supabase com migration (recomendado) ou Drive JSON?
4. **G3** — Existe catálogo de serviços Eduinfo e Eco Clear? Se não, `fit` fica `null`?
5. **B3** — Confirma que o Radar entra em produção como *qualificador de sinais manuais*,
   sem discovery automático no Instagram?
