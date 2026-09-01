#!/usr/bin/env node
/**
 * Avalia os outputs do rufas-router contra o gabarito de router-cases.json.
 *
 * Uso: node evaluate.cjs [--run 01]
 *
 * O gabarito NUNCA é alterado aqui. Este script só lê.
 * Cada métrica é reportada com numerador e denominador para poder ser reconferida à mão.
 */
const fs = require('fs');
const path = require('path');

const LAB = path.join(__dirname, '..');
const J = f => JSON.parse(fs.readFileSync(path.join(LAB, f), 'utf8'));

const runArg = process.argv.indexOf('--run');
const RUN = runArg > -1 ? process.argv[runArg + 1] : '01';

const bench = J('benchmarks/router-cases.json');
const registry = J('capabilities/capability-registry.json');
const anchoring = J('runner/anchoring.json');
const TOOLS = Object.fromEntries(registry.agents.map(a => [a.id, a.allowed_tools]));
const SPECIALISTS = registry.agents.filter(a => a.id !== 'rufas-router').map(a => a.id);
const ALL_TOOLS = new Set(Object.values(TOOLS).flat());

const outDir = path.join(__dirname, 'outputs', `run-${RUN}`);
const eqSet = (a, b) => a.size === b.size && [...a].every(x => b.has(x));

/** Um owner condicional só é legítimo se o gatilho declarado se materializou no caso.
 *  Sem meio de verificar o gatilho a partir do output, tratamos owner condicional como
 *  aceitável (não conta como delegação desnecessária) mas não exigido. */
function classify(c, out) {
  const required = new Set((c.expected.tasks || []).map(t => t.owner));
  const conditional = new Set((c.expected.conditional_owners || []).map(t => t.owner));
  const forbidden = new Set(c.expected.forbidden_owners || []);
  const emitted = out.tasks.map(t => t.OWNER);
  const emittedSet = new Set(emitted);

  const notes = [];

  // OWNER: conjunto emitido bate com o exigido (condicionais são tolerados como extra).
  const coreEmitted = new Set([...emittedSet].filter(o => !conditional.has(o) || required.has(o)));
  const owner_ok = eqSet(coreEmitted, required);
  if (!owner_ok) {
    const missing = [...required].filter(o => !emittedSet.has(o));
    const wrong = [...coreEmitted].filter(o => !required.has(o));
    if (missing.length) notes.push(`owner faltando: ${missing.join(', ')}`);
    if (wrong.length) notes.push(`owner indevido: ${wrong.join(', ')}`);
  }

  const forbiddenUsed = emitted.filter(o => forbidden.has(o));
  if (forbiddenUsed.length) notes.push(`owner proibido: ${[...new Set(forbiddenUsed)].join(', ')}`);

  // DECOMPOSITION
  const decomp_ok = out.tasks.length === c.expected.decomposition;
  if (!decomp_ok) notes.push(`decomposição ${out.tasks.length} vs ${c.expected.decomposition} esperada`);

  // DEPENDÊNCIAS / ORDEM
  const hasDeps = out.tasks.some(t => (t.DEPENDENCIES || []).length > 0);
  let dep_ok = true;
  if (out.tasks.length > 1) {
    if (c.expected.order === 'sequencial') { dep_ok = hasDeps; if (!dep_ok) notes.push('esperava cadeia sequencial, veio paralelo'); }
    if (c.expected.order === 'paralelo') { dep_ok = !hasDeps; if (!dep_ok) notes.push('esperava paralelo, veio sequenciado'); }
  }

  // ESCALATION
  const esc_ok = out.ESCALATE === c.expected.escalate;
  if (!esc_ok) notes.push(out.ESCALATE ? 'escalou indevidamente' : 'deixou de escalar');

  // TOOL POLICY
  const badTools = [];
  const inventedTools = [];
  const badOwners = [];
  for (const t of out.tasks) {
    if (!SPECIALISTS.includes(t.OWNER)) badOwners.push(t.OWNER);
    for (const tool of (t.TOOLS_ALLOWED || [])) {
      if (!ALL_TOOLS.has(tool)) inventedTools.push(tool);
      else if (!(TOOLS[t.OWNER] || []).includes(tool)) badTools.push(`${t.OWNER}←${tool}`);
    }
  }
  const tool_ok = badTools.length === 0 && inventedTools.length === 0;
  if (badTools.length) notes.push(`tool fora do registry do owner: ${badTools.join(', ')}`);
  if (inventedTools.length) notes.push(`tool inventada: ${[...new Set(inventedTools)].join(', ')}`);
  if (badOwners.length) notes.push(`owner inválido: ${[...new Set(badOwners)].join(', ')}`);

  // DELEGAÇÃO DESNECESSÁRIA: task cujo owner não é exigido nem condicional previsto.
  const extraTasks = out.tasks.filter(t => !required.has(t.OWNER) && !conditional.has(t.OWNER)).length;

  // TRABALHO DUPLICADO: mesmo owner duas vezes, ou duas tasks com o mesmo conjunto de tools.
  const ownerCounts = {};
  emitted.forEach(o => ownerCounts[o] = (ownerCounts[o] || 0) + 1);
  const repeatedOwner = Object.values(ownerCounts).some(n => n > 1);
  const toolSigs = out.tasks.map(t => [...(t.TOOLS_ALLOWED || [])].sort().join('|')).filter(Boolean);
  const repeatedToolSet = new Set(toolSigs).size < toolSigs.length;
  const duplicate = repeatedOwner || repeatedToolSet;
  if (duplicate) notes.push('trabalho potencialmente duplicado entre missões');

  // CONTEXT_MINIMALITY (proxy estrutural, não semântico)
  const verbose = out.tasks.filter(t =>
    (t.OBJ || '').length > 200 || /\b(porque|conforme análise|primeiro|em seguida|depois disso)\b/i.test(t.OBJ || ''));

  // STOP_CONDITION: 0 tasks quando o esperado é 0; sem tool ou owner inventado.
  const stop_ok = (c.expected.decomposition !== 0 || out.tasks.length === 0)
    && inventedTools.length === 0 && badOwners.length === 0;
  if (c.expected.decomposition === 0 && out.tasks.length > 0) notes.push('criou missão onde a ação correta era parar');

  const verdict = (!owner_ok || !esc_ok || !tool_ok || forbiddenUsed.length) ? 'FAIL'
    : (decomp_ok && dep_ok && extraTasks === 0 && !duplicate) ? 'PASS' : 'PARTIAL';

  return { id: c.id, verdict, owner_ok, decomp_ok, dep_ok, esc_ok, tool_ok, stop_ok,
    emitted, required: [...required], tasks: out.tasks.length,
    extraTasks, duplicate, verboseTasks: verbose.length,
    badTools, inventedTools, forbiddenUsed, notes };
}

// ---- carregar outputs ----
const results = [];
const missing = [];
for (const c of bench.cases) {
  const f = path.join(outDir, `${c.id}.json`);
  if (!fs.existsSync(f)) { missing.push(c.id); continue; }
  let out;
  try { out = JSON.parse(fs.readFileSync(f, 'utf8')); }
  catch (e) { missing.push(`${c.id} (JSON inválido)`); continue; }
  if (!Array.isArray(out.tasks) || typeof out.ESCALATE !== 'boolean') { missing.push(`${c.id} (fora do schema)`); continue; }
  results.push(classify(c, out));
}
if (missing.length) {
  console.error(`OUTPUTS AUSENTES OU INVÁLIDOS (${missing.length}): ${missing.join(', ')}`);
  console.error('Execução incompleta — métricas não são calculadas sobre amostra parcial.');
  process.exit(1);
}

// ---- métricas ----
const N = results.length;
const totalTasks = results.reduce((s, r) => s + r.tasks, 0);
const conformTasks = totalTasks - results.reduce((s, r) => s + r.badTools.length + r.inventedTools.length, 0);
const pct = (n, d) => d === 0 ? null : +(100 * n / d).toFixed(1);

const cnt = v => results.filter(r => r.verdict === v).length;
const PASS = cnt('PASS'), PARTIAL = cnt('PARTIAL'), FAIL = cnt('FAIL');

const escExpected = id => bench.cases.find(c => c.id === id).expected.escalate;
const tp = results.filter(r => escExpected(r.id) && r.esc_ok).length;
const fn = results.filter(r => escExpected(r.id) && !r.esc_ok).length;
const fp = results.filter(r => !escExpected(r.id) && !r.esc_ok).length;
const tn = results.filter(r => !escExpected(r.id) && r.esc_ok).length;

function subset(ids) {
  const rs = results.filter(r => ids.includes(r.id));
  const t = rs.reduce((s, r) => s + r.tasks, 0);
  return {
    n: rs.length,
    PASS: rs.filter(r => r.verdict === 'PASS').length,
    PARTIAL: rs.filter(r => r.verdict === 'PARTIAL').length,
    FAIL: rs.filter(r => r.verdict === 'FAIL').length,
    ROUTING_ACCURACY: pct(rs.filter(r => r.verdict === 'PASS').length + 0.5 * rs.filter(r => r.verdict === 'PARTIAL').length, rs.length),
    OWNER_ACCURACY: pct(rs.filter(r => r.owner_ok).length, rs.length),
    ESCALATION_ACCURACY: pct(rs.filter(r => r.esc_ok).length, rs.length),
    TOOL_POLICY_COMPLIANCE: pct(t - rs.reduce((s, r) => s + r.badTools.length + r.inventedTools.length, 0), t)
  };
}

// breakdown de pares confundíveis
function pairBreakdown(a, b) {
  const rows = [];
  for (const r of results) {
    const req = r.required, got = r.emitted;
    if (!req.includes(a) && !req.includes(b)) continue;
    const expected = req.includes(a) ? (req.includes(b) ? `${a}+${b}` : a) : b;
    const gotPair = [...new Set(got.filter(o => o === a || o === b))].sort().join('+') || '(nenhum)';
    rows.push({ id: r.id, expected, got: gotPair, ok: r.owner_ok });
  }
  return { pair: `${a} vs ${b}`, cases: rows.length, errors: rows.filter(x => !x.ok).length, rows };
}

const metrics = {
  ROUTING_ACCURACY: pct(PASS + 0.5 * PARTIAL, N),
  OWNER_ACCURACY: pct(results.filter(r => r.owner_ok).length, N),
  TASK_DECOMPOSITION_ACCURACY: pct(results.filter(r => r.decomp_ok).length, N),
  UNNECESSARY_DELEGATION_RATE: pct(results.reduce((s, r) => s + r.extraTasks, 0), totalTasks),
  DUPLICATE_WORK_RATE: pct(results.filter(r => r.duplicate).length, N),
  TOOL_POLICY_COMPLIANCE: pct(conformTasks, totalTasks),
  ESCALATION_PRECISION: pct(tp, tp + fp),
  ESCALATION_RECALL: pct(tp, tp + fn),
  ESCALATION_ACCURACY: pct(tp + tn, N),
  CONTEXT_MINIMALITY_PROXY: pct(totalTasks - results.reduce((s, r) => s + r.verboseTasks, 0), totalTasks),
  STOP_CONDITION_COMPLIANCE: pct(results.filter(r => r.stop_ok).length, N)
};

const GATE = {
  ROUTING_ACCURACY: metrics.ROUTING_ACCURACY >= 90,
  OWNER_ACCURACY: metrics.OWNER_ACCURACY >= 90,
  TOOL_POLICY_COMPLIANCE: metrics.TOOL_POLICY_COMPLIANCE === 100,
  ESCALATION_ACCURACY: metrics.ESCALATION_ACCURACY >= 90
};

const report = {
  run: RUN, executed_at_contract: registry.registry_version,
  model: 'sonnet', execution: 'real — uma invocação isolada de subagente por caso, sem acesso ao gabarito',
  cases_executed: N, PASS, PARTIAL, FAIL, total_tasks: totalTasks,
  metrics,
  counts: { escalation: { tp, fp, fn, tn }, conform_tasks: conformTasks, total_tasks: totalTasks },
  subsets: { anchored: subset(anchoring.anchored), blind: subset(anchoring.blind) },
  gate: GATE, gate_passed: Object.values(GATE).every(Boolean),
  breakdowns: [pairBreakdown('crm-nar', 'atendimento-nar'), pairBreakdown('produto-nar', 'engenharia-nar')],
  cases: results
};

fs.mkdirSync(path.join(__dirname, 'results'), { recursive: true });
fs.writeFileSync(path.join(__dirname, 'results', `run-${RUN}.json`), JSON.stringify(report, null, 2) + '\n');

console.log(`RUN_${RUN} — ${N} casos | PASS ${PASS} · PARTIAL ${PARTIAL} · FAIL ${FAIL}`);
for (const [k, v] of Object.entries(metrics)) console.log(`  ${k.padEnd(30)} ${v === null ? 'n/a' : v + '%'}`);
console.log(`  escalação: tp=${tp} fp=${fp} fn=${fn} tn=${tn}`);
console.log(`  ancorados: routing ${report.subsets.anchored.ROUTING_ACCURACY}% owner ${report.subsets.anchored.OWNER_ACCURACY}%  |  cegos: routing ${report.subsets.blind.ROUTING_ACCURACY}% owner ${report.subsets.blind.OWNER_ACCURACY}%`);
console.log(`  GATE: ${report.gate_passed ? 'PASSOU' : 'NÃO PASSOU'} — ${Object.entries(GATE).filter(([, v]) => !v).map(([k]) => k).join(', ') || 'todos os critérios atendidos'}`);
console.log('\nFalhas e parciais:');
for (const r of results.filter(r => r.verdict !== 'PASS')) console.log(`  ${r.id} ${r.verdict}: ${r.notes.join('; ')}`);
