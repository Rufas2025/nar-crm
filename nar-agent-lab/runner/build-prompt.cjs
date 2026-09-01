#!/usr/bin/env node
/**
 * Monta o prompt de execução do rufas-router para cada caso do benchmark.
 *
 * BLINDING — a razão de este arquivo existir:
 * o prompt carrega APENAS `id` e `intent` do caso. `expected`, `trap`, `title` e
 * `metrics_probed` nunca entram. Sem isso, a medição compara o gabarito consigo mesmo.
 *
 * Uso: node build-prompt.cjs         (gera prompts/RC-XX.md)
 *      node build-prompt.cjs --check (audita blinding dos prompts já gerados)
 */
const fs = require('fs');
const path = require('path');

const LAB = path.join(__dirname, '..');
const R = f => fs.readFileSync(path.join(LAB, f), 'utf8');
const J = f => JSON.parse(R(f));

const cases = J('benchmarks/router-cases.json');
const registry = J('capabilities/capability-registry.json');
const schema = R('runner/output-schema.json');

// Campos do caso que JAMAIS podem entrar no prompt.
// `title` NÃO está aqui de propósito: ele pode aparecer no prompt via a tabela "Casos de
// referência" do próprio rufas-router.md, que lista os 10 casos obrigatórios com o
// roteamento correto. Isso é uma propriedade do artefato sob teste, não um defeito deste
// script — e é exatamente por isso que `anchoring.json` existe: separa os casos ancorados
// (o modelo pode consultar a resposta no spec) dos casos cegos.
const FORBIDDEN_FIELDS = ['expected', 'trap', 'metrics_probed'];

const toolTable = registry.agents
  .filter(a => a.id !== 'rufas-router')
  .map(a => `| \`${a.id}\` | ${a.allowed_tools.map(t => '`' + t + '`').join(', ')} |`)
  .join('\n');

/** Contratos que cada caso recebe. Casos de consolidação também recebem o handoff. */
const CONSOLIDATION_CASES = new Set(['RC-16', 'RC-17', 'RC-18']);
function contractsFor(id) {
  const list = ['contracts/task-contract.md', 'contracts/escalation-policy.md', 'contracts/approval-policy.md'];
  if (CONSOLIDATION_CASES.has(id)) list.push('contracts/handoff-contract.md');
  return list;
}

function buildPrompt(c) {
  const contracts = contractsFor(c.id)
    .map(f => `### ${path.basename(f)}\n\n${R(f)}`)
    .join('\n\n---\n\n');

  return `Você é o **rufas-router**. Aja exatamente conforme a especificação abaixo.

Responda **somente** com um objeto JSON válido, sem texto antes ou depois, sem cercas de
código. **Não chame nenhuma ferramenta** — nem leitura de arquivo, nem busca, nem nada.
Toda a informação de que você precisa está neste prompt.

---

## Especificação do agente

${R('agents/rufas-router.md')}

---

## Contratos vigentes

${contracts}

---

## Tools por agente (capability registry ${registry.registry_version}, congelado)

| Agente | Tools autorizadas |
|---|---|
${toolTable}
| \`rufas-router\` | **nenhuma** |

---

## Formato de saída obrigatório

\`\`\`json
{
  "tasks": [
    {
      "TASK_ID": "T-20260901-001",
      "OBJ": "...",
      "OWNER": "<um dos 5 agentes especialistas>",
      "TOOLS_ALLOWED": ["..."],
      "DEPENDENCIES": ["<TASK_ID de que esta missão depende>"],
      "NEXT": "<agent_id | HUMAN | null>"
    }
  ],
  "ESCALATE": false,
  "ESCALATION_REASON": null
}
\`\`\`

Schema:

\`\`\`json
${schema}
\`\`\`

Regras do formato:

- \`tasks: []\` com \`"ESCALATE": true\` é a forma correta quando a intenção deve ser escalada a um humano em vez de virar missão.
- \`tasks: []\` com \`"ESCALATE": false\` é a forma correta quando a ação certa não é criar missão nem escalar (por exemplo: consolidar retornos, ou devolver um handoff mal formado ao agente que o produziu).
- \`OWNER\` nunca é \`rufas-router\`.
- \`TOOLS_ALLOWED\` deve ser subconjunto das tools do OWNER na tabela acima. Não conceda tool que o OWNER não possui. Não invente nome de tool.
- \`DEPENDENCIES\` vazio significa que a missão pode rodar em paralelo com as demais.

---

## Intenção recebida

Caso \`${c.id}\`:

> ${c.intent}

Produza agora o JSON.`;
}

if (process.argv.includes('--check')) {
  // Audita se o GABARITO vazou para o prompt. Não confundir com ancoragem: uma regra de
  // política ("erro de tool é engenharia") aparecer no prompt é o spec funcionando; o que
  // não pode aparecer é a resposta esperada daquele caso específico.
  let bad = 0;
  const flag = (id, what) => { console.log(`VAZOU ${what} em ${id}`); bad++; };
  for (const c of cases.cases) {
    const p = path.join(__dirname, 'prompts', `${c.id}.md`);
    if (!fs.existsSync(p)) { console.log(`FALTA: ${c.id}`); bad++; continue; }
    const txt = fs.readFileSync(p, 'utf8');
    if (txt.includes('forbidden_owners') || txt.includes('conditional_owners')) flag(c.id, 'chave do gabarito');
    if (txt.includes(JSON.stringify(c.expected))) flag(c.id, 'objeto expected');
    if (c.trap && txt.includes(c.trap)) flag(c.id, 'trap');
    for (const t of (c.expected.tasks || [])) {
      if (t.scope && txt.includes(t.scope)) flag(c.id, 'scope esperado');
    }
    for (const m of (c.metrics_probed || [])) {
      if (txt.includes(`"${m}"`)) flag(c.id, 'metrics_probed');
    }
    // O prompt deve conter a intenção e nada mais do caso.
    if (!txt.includes(c.intent)) flag(c.id, 'intenção ausente (prompt inválido)');
  }
  const anchor = JSON.parse(fs.readFileSync(path.join(__dirname, 'anchoring.json'), 'utf8'));
  console.log(bad
    ? `\n${bad} VAZAMENTOS DE GABARITO`
    : `\nBLINDING OK — ${cases.cases.length} prompts, nenhum gabarito vazado.` +
      `\nANCORAGEM — ${anchor.anchored.length} casos ancorados no spec (${anchor.anchored.join(', ')}), ` +
      `${anchor.blind.length} cegos. Ver anchoring.json.`);
  process.exit(bad ? 1 : 0);
}

/**
 * Auditoria de ancoragem: quais casos têm sua resposta disponível dentro do próprio
 * rufas-router.md. O spec traz uma tabela de casos de referência com os 10 casos
 * obrigatórios do briefing; para esses, o modelo pode recuperar o roteamento em vez de
 * derivá-lo das regras. Os demais são cegos.
 */
function auditAnchoring() {
  const routerSpec = R('agents/rufas-router.md');
  const rows = cases.cases.map(c => {
    const byTitle = routerSpec.includes(c.title);
    const byIntent = c.intent.length > 25 && routerSpec.includes(c.intent.slice(0, 25));
    const anchored = Boolean(c.mandatory || byTitle || byIntent);
    return { id: c.id, anchored, reason: anchored
      ? (byTitle ? 'título presente na tabela de casos de referência do spec'
                 : 'caso obrigatório do briefing, coberto pela tabela de casos de referência')
      : 'não referenciado no spec' };
  });
  return {
    audited_at_contract: registry.registry_version,
    explanation: 'Casos ancorados têm o roteamento correto disponível dentro do próprio rufas-router.md. Métricas sobre eles medem recuperação, não julgamento. O gate deve ser lido primariamente sobre os casos cegos.',
    anchored: rows.filter(r => r.anchored).map(r => r.id),
    blind: rows.filter(r => !r.anchored).map(r => r.id),
    rows
  };
}

fs.mkdirSync(path.join(__dirname, 'prompts'), { recursive: true });
fs.writeFileSync(path.join(__dirname, 'anchoring.json'), JSON.stringify(auditAnchoring(), null, 2) + '\n');
for (const c of cases.cases) {
  // Guarda dura: nenhum campo proibido pode aparecer serializado no prompt.
  const prompt = buildPrompt(c);
  for (const f of FORBIDDEN_FIELDS) {
    const v = c[f];
    if (v === undefined) continue;
    // Só faz sentido checar conteúdo distintivo: um booleano serializa em "true", que
    // aparece legitimamente no schema de saída.
    const s = typeof v === 'object' ? JSON.stringify(v) : String(v);
    if (s.length < 20) continue;
    if (prompt.includes(s)) throw new Error(`campo proibido ${f} vazou em ${c.id}`);
  }
  fs.writeFileSync(path.join(__dirname, 'prompts', `${c.id}.md`), prompt);
}
console.log(`${cases.cases.length} prompts gerados em runner/prompts/`);
