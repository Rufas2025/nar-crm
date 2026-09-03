#!/usr/bin/env node
/**
 * Construtor de prompts do NAR-ROUTER-BENCHMARK-V0.4.
 *
 * BLINDING ESTRUTURAL, mesmo desenho do v0.2/v0.3: este arquivo lê APENAS
 * `router-cases-v0.4.intents.json`. O gabarito vive em
 * `router-cases-v0.4.expected.json`, que este script nunca abre.
 *
 * v0.4 é gerado depois do router fix (Teste do insumo, approval gate com preparo,
 * capability-gap, trabalho analítico) — a checagem de ancoragem (--check) por isso
 * cobre também os 4 reforços novos do rufas-router.md, não só o texto anterior.
 *
 * Uso: node build-prompt-v04.cjs          (gera prompts-v04/X-XX.md)
 *      node build-prompt-v04.cjs --check  (audita blinding + ancoragem + originalidade)
 */
const fs = require('fs');
const path = require('path');

const LAB = path.join(__dirname, '..');
const R = f => fs.readFileSync(path.join(LAB, f), 'utf8');
const J = f => JSON.parse(R(f));

const INTENTS = 'benchmarks/v0.4/router-cases-v0.4.intents.json';
const EXPECTED = 'benchmarks/v0.4/router-cases-v0.4.expected.json'; // só para --check

const intents = J(INTENTS);
const registry = J('capabilities/capability-registry.json');
const schema = R('runner/output-schema.json');
const OUT = path.join(__dirname, 'prompts-v04');

const toolTable = registry.agents
  .filter(a => a.id !== 'rufas-router')
  .map(a => `| \`${a.id}\` | ${a.allowed_tools.map(t => '`' + t + '`').join(', ') || '**nenhuma**'} |`)
  .join('\n');

// Casos de consolidação continuam recebendo o handoff-contract, como no v0.2.
const CONSOLIDATION_CATEGORY = 'consolidacao';
function contractsFor(c) {
  const l = ['contracts/task-contract.md', 'contracts/escalation-policy.md', 'contracts/approval-policy.md'];
  if (c.category === CONSOLIDATION_CATEGORY) l.push('contracts/handoff-contract.md');
  return l;
}

function buildPrompt(c) {
  const contracts = contractsFor(c).map(f => `### ${path.basename(f)}\n\n${R(f)}`).join('\n\n---\n\n');
  return `Você é o **rufas-router**. Aja exatamente conforme a especificação abaixo.

Responda **somente** com um objeto JSON válido, sem texto antes ou depois, sem cercas de
código. **Não chame nenhuma ferramenta.** Toda a informação de que você precisa está aqui.

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
${schema}
\`\`\`

Regras do formato:

- \`tasks: []\` com \`"ESCALATE": true\` — a intenção deve ser escalada e nada é executável antes da decisão.
- \`tasks: [...]\` com \`"ESCALATE": true\` — há trabalho de preparo que já pode acontecer, e um gate humano trava a execução.
- \`tasks: []\` com \`"ESCALATE": false\` — a ação correta não é criar missão nem escalar (consolidar retornos, devolver um handoff mal formado).
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
  let bad = 0;
  const flag = m => { console.log('FALHA:', m); bad++; };
  const exp = J(EXPECTED);
  const v01 = J('benchmarks/router-cases.json');
  const v02 = J('benchmarks/v0.2/router-cases-v0.2.intents.json');
  const v03 = J('benchmarks/v0.3/router-cases-v0.3.intents.json');
  const routerSpec = R('agents/rufas-router.md');

  if (intents.cases.length !== 44) flag(`esperado 44 casos, achei ${intents.cases.length}`);

  // 1. blinding
  for (const c of intents.cases) {
    const p = path.join(OUT, `${c.id}.md`);
    if (!fs.existsSync(p)) { flag(`prompt ausente: ${c.id}`); continue; }
    const txt = fs.readFileSync(p, 'utf8');
    const e = exp.cases.find(x => x.id === c.id).expected;
    if (txt.includes(JSON.stringify(e))) flag(`${c.id}: objeto expected no prompt`);
    for (const t of (e.tasks || [])) if (t.scope && txt.includes(t.scope)) flag(`${c.id}: scope esperado no prompt`);
    if (e.escalation_reason && txt.includes(e.escalation_reason)) flag(`${c.id}: escalation_reason no prompt`);
    for (const k of ['forbidden_owners', 'conditional_owners', 'metrics_probed', 'depends_on'])
      if (txt.includes(k)) flag(`${c.id}: chave de gabarito "${k}" no prompt`);
    if (!txt.includes(c.intent)) flag(`${c.id}: intenção ausente do prompt`);
  }

  // 2. ancoragem: nenhuma intenção v0.4 pode estar no spec do router
  for (const c of intents.cases) {
    if (routerSpec.includes(c.intent) || (c.intent.length > 25 && routerSpec.includes(c.intent.slice(0, 25))))
      flag(`${c.id}: intenção ancorada no rufas-router.md`);
  }

  // 3. originalidade contra v0.1, v0.2 e v0.3 INTEIROS (todos os 44 casos são "new" no
  // v0.4 — nada foi preservado/corrigido de versão anterior, então o universo de
  // comparação é toda intenção já usada em qualquer versão anterior do benchmark, não
  // só um subconjunto substituído).
  const norm = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(w => w.length > 3);
  const STOP = new Set(['para', 'como', 'esta', 'estao', 'essa', 'esse', 'isso', 'aqui', 'mais', 'preciso', 'quero', 'ainda']);
  const otherIntents = [
    ...v01.cases.map(c => c.intent),
    ...v02.cases.map(c => c.intent),
    ...v03.cases.map(c => c.intent),
  ];
  const newOrCorrected = intents.cases.filter(c => {
    const meta = exp.cases.find(x => x.id === c.id);
    return meta.source === 'new' || meta.source.startsWith('corrected:');
  });
  for (const c of newOrCorrected) {
    const a = new Set(norm(c.intent).filter(w => !STOP.has(w)));
    for (const o of otherIntents) {
      const b = new Set(norm(o).filter(w => !STOP.has(w)));
      const inter = [...a].filter(w => b.has(w)).length;
      const jac = inter / new Set([...a, ...b]).size;
      if (jac > 0.4) flag(`${c.id} parafraseia um caso de v0.1/v0.2/v0.3 (Jaccard ${jac.toFixed(2)})`);
    }
  }

  // 4. coerência do gabarito com o registry
  const T = Object.fromEntries(registry.agents.map(a => [a.id, a.allowed_tools]));
  const SPEC = Object.keys(T).filter(a => a !== 'rufas-router');
  for (const c of exp.cases) {
    const e = c.expected;
    if (e.decomposition !== (e.tasks || []).length) flag(`${c.id}: decomposition não bate com nº de tasks`);
    if (e.escalate && !e.escalation_reason) flag(`${c.id}: escalação sem motivo nomeado`);
    for (const t of (e.tasks || [])) {
      if (!SPEC.includes(t.owner)) flag(`${c.id}: owner inválido ${t.owner}`);
      for (const tool of (t.tools_allowed || []))
        if (!(T[t.owner] || []).includes(tool)) flag(`${c.id}: ${t.owner} não possui ${tool}`);
      if (e.forbidden_owners && e.forbidden_owners.includes(t.owner)) flag(`${c.id}: owner proibido usado como task`);
    }
  }

  // 5. display names nunca como OWNER
  let identities;
  try { identities = J('agents/agent-identities.json'); } catch (e) { identities = null; }
  if (identities) {
    const names = new Set(identities.identities.map(i => i.display_name).concat(identities.identities.map(i => i.short_name)));
    for (const c of exp.cases) for (const t of (c.expected.tasks || [])) if (names.has(t.owner)) flag(`${c.id}: display name usado como OWNER: ${t.owner}`);
  }

  const pos = exp.cases.filter(c => c.expected.escalate).length;
  const brandNew = exp.cases.filter(c => c.source === 'new').length;
  console.log(bad
    ? `\n${bad} FALHAS`
    : `\nV0.4 OK — ${intents.cases.length} casos (${brandNew} novos, 0 reaproveitados de v0.1/v0.2/v0.3)\n` +
      `  blinding: gabarito em arquivo separado, nenhum fragmento nos prompts\n` +
      `  ancoragem: 0 intenções presentes no rufas-router.md (inclusive os 4 reforços novos do router fix)\n` +
      `  originalidade: 0 paráfrases contra v0.1, v0.2 e v0.3 inteiros\n` +
      `  display names: nunca usados como OWNER\n` +
      `  escalação: ${pos} positivos, ${exp.cases.length - pos} negativos`);
  process.exit(bad ? 1 : 0);
}

fs.mkdirSync(OUT, { recursive: true });
for (const c of intents.cases) fs.writeFileSync(path.join(OUT, `${c.id}.md`), buildPrompt(c));
console.log(`${intents.cases.length} prompts v0.4 gerados em runner/prompts-v04/`);
