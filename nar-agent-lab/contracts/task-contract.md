# Task Contract — v0.1.0

> **STATUS: LAB.** Formato obrigatório de toda missão emitida pelo `rufas-router`.
> Fonte da verdade de `TOOLS_ALLOWED`: `../capabilities/capability-registry.json`.
> Este contrato não altera e não pode alterar `nar-ops-mcp@0.1.0`.

Uma missão é a unidade de trabalho que o router entrega a **um** agente especialista.
Uma missão tem **um único OWNER**. Se a intenção exige dois donos, são duas missões.

---

## Formato

```
TASK_ID:          <string>
OBJ:              <string>
OWNER:            <agent_id>
INPUTS:           <lista | vazio>
CONTEXT:          <contexto mínimo>
TOOLS_ALLOWED:    <lista derivada do registry>
DO:               <lista>
DO_NOT:           <lista>
EXPECTED_OUTPUT:  <estrutura>
SUCCESS_CRITERIA: <lista verificável>
ESCALATION_RULE:  <condição → destino>
STOP_CONDITION:   <condição de parada>
```

Todos os 12 campos são obrigatórios. Campo sem conteúdo aplicável é preenchido com
`nenhum` — nunca omitido. Uma missão com campo faltando é inválida e não deve ser executada
pelo agente: ele responde `BLOCKED` com `NEXT_OWNER: rufas-router`.

---

## Campos

### `TASK_ID`
Identificador único e estável. Formato: `T-<AAAAMMDD>-<sequencial 3 dígitos>` — ex.: `T-20260901-001`.
Missões sequenciais de uma mesma intenção mantêm a ordem no sequencial.

### `OBJ`
Uma frase, no imperativo, dizendo **o que deve estar pronto**. Não descreve como fazer.
Se `OBJ` precisa de "e" para ligar dois resultados independentes, provavelmente são duas missões.

### `OWNER`
Exatamente um agente de: `marketing-nar`, `atendimento-nar`, `crm-nar`, `produto-nar`,
`engenharia-nar`. Nunca `rufas-router` (o router não executa trabalho). Nunca uma lista.
A escolha segue `OWNERSHIP_BASE` e as regras de roteamento em `../agents/rufas-router.md`.

### `INPUTS`
Dados concretos que a missão recebe: ids, datas, marcas, intervalos, saída de missão
anterior. Nunca credencial. Nunca dado que o OWNER pode obter sozinho com suas próprias
tools — nesse caso, passe o parâmetro de busca, não o resultado.

### `CONTEXT`
O mínimo necessário para a decisão. Regra de minimalidade: se remover uma frase **não**
muda o que o agente vai fazer, ela não pertence ao contexto.

Proibido no `CONTEXT`:
- raciocínio completo do router ou de outro agente;
- histórico da conversa com o usuário;
- resultado de missão anterior que não é insumo desta;
- dado pessoal não necessário para a missão.

### `TOOLS_ALLOWED`
**Derivado exclusivamente de `capability-registry.json`.**

Regra dura: `TOOLS_ALLOWED ⊆ registry.agents[OWNER].allowed_tools`.

O router **não pode conceder uma tool que o OWNER não possui** — nem "por garantia", nem
para adiantar trabalho, nem porque outro agente a possui. Conceder tool fora do conjunto do
OWNER é violação de política, não erro de digitação: a missão é inválida.

O router também **não pode inventar tool**. Se a missão precisa de capability inexistente
no registry, o router não cria a missão: registra em `CAPABILITY_GAPS` e escala conforme
`escalation-policy.md`.

`TOOLS_ALLOWED` pode ser um subconjunto próprio das tools do OWNER — o mínimo que a missão
exige. `nenhuma` é valor válido para missão puramente analítica.

Conjuntos vigentes no registry `0.1.0`:

| OWNER | Tools disponíveis |
|---|---|
| `marketing-nar` | `eduinfo_list_root`, `eduinfo_search_folder`, `eduinfo_get_asset`, `campaign_get_history`, `campaign_get_brand_context` |
| `atendimento-nar` | `crm_list_eligible_contacts`, `crm_get_contact_context`, `crm_get_followups_due`, `crm_get_demo_scheduled`, `proposal_get_pending` |
| `crm-nar` | `crm_list_eligible_contacts`, `crm_get_contact_context`, `crm_get_followups_due`, `crm_get_demo_scheduled`, `proposal_get_pending` |
| `produto-nar` | `eduinfo_list_root`, `eduinfo_search_folder`, `eduinfo_get_asset`, `proposal_get_pending`, `campaign_get_history`, `campaign_get_brand_context` |
| `engenharia-nar` | `eduinfo_list_root`, `eduinfo_search_folder`, `eduinfo_get_asset` |
| `rufas-router` | **nenhuma** |

Todas são read-only. Nenhuma capability de escrita existe no contrato MCP.

### `DO`
Ações concretas esperadas. Verbos observáveis ("listar", "comparar", "produzir 3 variações"),
não intenções ("analisar bem").

### `DO_NOT`
Limites explícitos. Todo `DO_NOT` de missão herda, sem precisar repetir, as proibições
globais:

- não usar tool fora de `TOOLS_ALLOWED`;
- não inventar capability nem simular resultado de tool;
- não reportar número vindo do mock como resultado real;
- não executar escrita ou envio (nenhuma capability de escrita existe);
- não pedir nem manipular credencial;
- não delegar para outro agente por conta própria — só o router delega;
- não refazer trabalho já entregue por outra missão.

### `EXPECTED_OUTPUT`
Estrutura esperada dentro do campo `OUTPUT` do handoff. Descreve forma, não conteúdo.

### `SUCCESS_CRITERIA`
Lista verificável por terceiro sem refazer a análise. Cada critério deve ser respondível
com sim/não olhando só o output.

### `ESCALATION_RULE`
Condição → destino, conforme `escalation-policy.md`. Todo destino é um `agent_id`,
`rufas-router` ou `HUMAN`. Missão sem risco identificado usa a regra padrão:
`decisão material ou ambígua → HUMAN`.

### `STOP_CONDITION`
Quando o agente **para**, mesmo sem ter resolvido tudo. Existe para impedir escopo
crescente e retrabalho. Toda missão herda estas condições de parada:

- `EXPECTED_OUTPUT` produzido → parar e devolver `PASS`;
- tool retornou `ACCESS_DENIED` → parar, `BLOCKED`, nunca tentar outra tool para contornar;
- tool retornou `UNKNOWN_TOOL` → parar, `BLOCKED`, registrar possível `CAPABILITY_GAP`;
- a missão exige escrita, envio ou decisão material → parar, `ESCALATE`;
- o trabalho necessário pertence a outro domínio → parar, `NEXT_OWNER` para o dono correto.

---

## Exemplo válido

```
TASK_ID:          T-20260901-004
OBJ:              Levantar as propostas pendentes há mais de 15 dias e o contexto de cada contato.
OWNER:            crm-nar
INPUTS:           data_referencia = 2026-09-01
CONTEXT:          O usuário quer priorizar retomada comercial nesta semana. Só leitura; a
                  decisão de abordagem é de atendimento-nar, não desta missão.
TOOLS_ALLOWED:    proposal_get_pending, crm_get_contact_context
DO:               - listar propostas pendentes
                  - para cada uma, obter contexto do contato
                  - ordenar por dias de espera decrescente
DO_NOT:           - não redigir mensagem de retomada
                  - não classificar prioridade comercial
EXPECTED_OUTPUT:  lista de { proposal_id, contact_id, status, dias_esperando, stage, ultima_interacao }
SUCCESS_CRITERIA: - toda proposta pendente do período aparece na lista
                  - todo item traz stage e última interação
                  - nenhum texto de abordagem comercial foi produzido
ESCALATION_RULE:  contato sem dado suficiente para contexto → rufas-router
                  decisão sobre desconto ou condição comercial → HUMAN
STOP_CONDITION:   lista completa produzida; ou ACCESS_DENIED em qualquer tool
```

## Exemplo inválido

```
OWNER:            marketing-nar
TOOLS_ALLOWED:    crm_get_contact_context     ← VIOLAÇÃO
```

`crm_get_contact_context` não está em `registry.agents["marketing-nar"].allowed_tools`.
O router não pode conceder essa tool. A missão é inválida e deve ser recusada pelo agente
com `BLOCKED` / `NEXT_OWNER: rufas-router`, mesmo que a intenção do usuário fizesse sentido.
