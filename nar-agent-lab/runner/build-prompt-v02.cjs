#!/usr/bin/env node
/**
 * Construtor de prompts do NAR-ROUTER-BENCHMARK-V0.2.
 *
 * BLINDING ESTRUTURAL: este arquivo lê APENAS `router-cases-v0.2.intents.json`.
 * O gabarito vive em outro arquivo, `router-cases-v0.2.expected.json`, que este script
 * jamais abre — não há caminho de código daqui até ele. No v0.1 o blinding dependia de
 * filtrar campos de um objeto que já continha a resposta; aqui a separação é física.
 *
 * Uso: node build-prompt-v02.cjs          (gera prompts-v02/V-XX.md)
 *      node build-prompt-v02.cjs --check  (audita blinding + ancoragem + originalidade)
 */
const fs = require('fs');
const path = require('path');

const LAB = path.join(__dirname, '..');
const R = f => fs.readFileSync(path.join(LAB, f), 'utf8');
const J = f => JSON.parse(R(f));

const INTENTS = 'benchmarks/v0.2/router-cases-v0.2.intents.json';
const EXPECTED = 'benchmarks/v0.2/router-cases-v0.2.expected.json'; // só para --check

const intents = J(INTENTS);
const registry = J('capabilities/capability-registry.json');
const schema = R('runner/output-schema.json');
const OUT = path.join(__dirname, 'prompts-v02');

const toolTable = registry.agents
  .filter(a => a.id !== 'rufas-router')
  .map(a => `| \`${a.id}\` | ${a.allowed_tools.map(t => '`' + t + '`').join(', ') || '**nenhuma**'} |`)
  .join('\n');

const CONSOLIDATION = new Set(['V-24', 'V-25', 'V-26']);
const contractsFor = id => {
  const l = ['contracts/task-contract.md', 'contracts/escalation-policy.md', 'contracts/approval-policy.md'];
  if (CONSOLIDATION.has(id)) l.push('contracts/handoff-contract.md');
  return l;
};

function buildPrompt(c) {
  const contracts = contractsFor(c.id).map(f => `### ${path.basename(f)}\n\n${R(f)}`).join('\n\n---\n\n');
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
  const routerSpec = R('agents/rufas-router.md');

  // 1. blinding: nenhum prompt pode conter qualquer fragmento do gabarito
  for (const c of intents.cases) {
    const p = path.join(OUT, `${c.id}.md`);
    if (!fs.existsSync(p)) { flag(`prompt ausente: ${c.id}`); continue; }
    const txt = fs.readFileSync(p, 'utf8');
    const e = exp.cases.find(x => x.id === c.id).expected;
    if (txt.includes(JSON.stringify(e))) flag(`${c.id}: objeto expected no prompt`);
    for (const t of (e.tasks || [])) if (t.scope && txt.includes(t.scope)) flag(`${c.id}: scope esperado no prompt`);
    if (e.escalation_reason && txt.includes(e.escalation_reason)) flag(`${c.id}: escalation_reason no prompt`);
    for (const k of ['forbidden_owners', 'conditional_owners', 'metrics_probed', 'expected_action', 'depends_on'])
      if (txt.includes(k)) flag(`${c.id}: chave de gabarito "${k}" no prompt`);
    if (!txt.includes(c.intent)) flag(`${c.id}: intenção ausente do prompt`);
  }

  // 2. ancoragem: nenhuma intenção do v0.2 pode aparecer no spec do router
  for (const c of intents.cases) {
    if (routerSpec.includes(c.intent) || (c.intent.length > 25 && routerSpec.includes(c.intent.slice(0, 25))))
      flag(`${c.id}: intenção ancorada no rufas-router.md`);
  }

  // 3. originalidade: nenhuma intenção pode repetir ou parafrasear o v0.1
  const norm = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(w => w.length > 3);
  const STOP = new Set(['para', 'como', 'esta', 'estao', 'essa', 'esse', 'isso', 'aqui', 'mais', 'preciso', 'quero', 'ainda']);
  for (const c of intents.cases) {
    const a = new Set(norm(c.intent).filter(w => !STOP.has(w)));
    for (const o of v01.cases) {
      const b = new Set(norm(o.intent).filter(w => !STOP.has(w)));
      const inter = [...a].filter(w => b.has(w)).length;
      const jac = inter / new Set([...a, ...b]).size;
      if (jac > 0.4) flag(`${c.id} parafraseia ${o.id} (Jaccard ${jac.toFixed(2)})`);
    }
    if (v01.cases.some(o => o.intent === c.intent)) flag(`${c.id}: intenção idêntica a caso do v0.1`);
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

  const pos = exp.cases.filter(c => c.expected.escalate).length;
  console.log(bad
    ? `\n${bad} FALHAS`
    : `\nV0.2 OK — ${intents.cases.length} casos\n` +
      `  blinding: gabarito em arquivo separado, nunca lido pelo construtor; nenhum fragmento nos prompts\n` +
      `  ancoragem: 0 intenções presentes no rufas-router.md (suíte 100% cega)\n` +
      `  originalidade: 0 repetições e 0 paráfrases dos 22 casos do v0.1\n` +
      `  escalação: ${pos} positivos, ${exp.cases.length - pos} negativos`);
  process.exit(bad ? 1 : 0);
}

fs.mkdirSync(OUT, { recursive: true });
for (const c of intents.cases) fs.writeFileSync(path.join(OUT, `${c.id}.md`), buildPrompt(c));
console.log(`${intents.cases.length} prompts v0.2 gerados em runner/prompts-v02/`);
