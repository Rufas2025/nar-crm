## Escopo

Evoluir o Email Studio em 3 frentes sem tocar em WhatsApp, n8n, Evolution, Gmail Drafts, Supabase ou Edge Functions. Upload, preview, copiar HTML e baixar HTML continuam funcionando como hoje.

## 1. Sistema de marcas (`src/lib/brands.ts` — novo)

Config declarativa com 5 marcas:

| Marca | Paleta principal | Tagline footer |
|---|---|---|
| Eduinfo | coral #FE455C · azul #0098C7 · verde #38D64D | Arquitetura · Mobiliário · Tecnologia · Estratégia · Formação |
| Gennera | azul profundo · turquesa · cinza | Gestão · Dados · Secretaria · Financeiro |
| EcoClear | verde-água · branco · cinza claro | Limpeza · Cuidado · Rotina segura |
| Educbank | azul institucional · verde confiança | Previsibilidade · Financeiro · Sustentabilidade |
| NAR ECO | grafite · dourado sóbrio · verde escuro | Diagnóstico · Crescimento · Estratégia |

Cada marca exporta: `palette`, `logoText`, `tagline`, `defaultCTAs[]`, `defaultBody`, `whatsappUrl`, `contato`, `site`, `templateOverrides` (título/subtítulo/body/CTA por tipo de template).

## 2. Templates reorganizados (`src/lib/email-templates.ts`)

Novos tipos, cobrindo todas as marcas via geradores agnósticos que recebem `brand` + `data`:

1. `campanha` — Campanha de Impacto
2. `consultivo` — Conteúdo Consultivo
3. `solucao` — Solução por Frente (era `frentes`)
4. `projeto` — Antes e Depois / Projeto (novo)
5. `convite` — Convite para Conversa (novo)

Mantém geradores `renderEmail` / `renderPlainText`, mas assinatura passa a receber `brand` (default Eduinfo p/ retrocompatibilidade). Retiro `newsletter`/`tecnologia`/`reforma` do dropdown mas mantenho no switch como aliases dos novos tipos para não quebrar dados existentes.

## 3. Responsividade Gmail-safe

Shell HTML ganha:

- `<meta name="viewport">` já existe.
- `<style>` no `<head>` com `@media (max-width:600px)` usando classes `.eml-container`, `.eml-pad`, `.eml-h1`, `.eml-sub`, `.eml-body`, `.eml-cta`, `.eml-card`, `.eml-img` — Gmail (webmail e app) suporta.
- Tabelas passam a usar `width="100%"` + `max-width:600px` no lugar de `width="600"` fixo.
- Cards de 3 colunas usam `display:block` no mobile via classe → empilham em 1 coluna.
- Fallback inline continua legível quando media query for ignorada.

Tipografia conforme especificado (desktop 30–36 título, mobile 26–30 etc.).

## 4. UI do Email Studio (`src/pages/EmailStudioPage.tsx`)

Formulário à esquerda ganha, no topo, um novo bloco:

```
┌ Marca / Frente ────────┐
│ [ Eduinfo ▾ ]          │  ← novo, antes do "Tipo de template"
└────────────────────────┘
```

Campos adicionais (colapsáveis em "Contexto do lead" para não poluir):
Cidade/estado, Momento da escola, Objetivo do e-mail, Nível de relacionamento, Tom de voz, Observações. São opcionais e alimentam apenas variáveis de texto do template quando presentes.

Ao trocar marca:
- CSS vars da preview são atualizadas
- CTAs sugeridos mudam
- Defaults do template atual são reaplicados a partir do `templateOverrides` da marca
- Logo/tagline do header do e-mail troca

Preview à direita ganha toggle:

```
[ Desktop ] [ Mobile 390px ]
```

Implementado com wrapper `<div style="width:390px">` ao redor do iframe/preview quando "Mobile" ativo. Iframe já usa `srcDoc={html}`.

## 5. Preservação

- `uploadImage`, `prepareEmailForExport`, `GmailDraftActions`, botões do topo (Abrir preview / Baixar / Copiar texto / Copiar HTML): intocados na assinatura.
- `EmailData` recebe campos opcionais novos (`brand`, `cidade`, `momento`, etc.). Valores default preservam comportamento antigo.
- Nenhuma migração de banco.

## Arquivos afetados

- **novo** `src/lib/brands.ts`
- **edit** `src/lib/email-templates.ts` (aceita `brand`, novos templates, shell responsivo)
- **edit** `src/pages/EmailStudioPage.tsx` (seletor de marca, novos campos, toggle preview mobile)
- **edit** `src/index.css` (nada crítico; talvez classes utilitárias do preview mobile)

## Fora deste plano

- Envio real de e-mail
- Alterações em Gmail Drafts
- Alterações em Edge Functions ou Supabase
- Upload de logos por marca (usa texto/inicial por enquanto; podemos adicionar depois)
