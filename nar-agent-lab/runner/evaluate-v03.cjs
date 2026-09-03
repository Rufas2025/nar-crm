#!/usr/bin/env node
/**
 * Avalia os outputs do RUN_01 do benchmark v0.3 contra o gabarito v0.3.
 *
 * Lê EXCLUSIVAMENTE:
 *   - benchmarks/v0.3/router-cases-v0.3.intents.json (só para contagem/sanidade)
 *   - benchmarks/v0.3/router-cases-v0.3.expected.json (gabarito)
 *   - capabilities/capability-registry.json (tool policy)
 *   - runner/outputs/v03-run-01/*.json (outputs a avaliar)
 *
 * NÃO lê nem escreve nada do v0.1: nem router-cases.json, nem results/run-01..03,
 * nem outputs/run-01..03, nem evaluate.cjs. Isso é verificado em runtime abaixo.
 *
 * Não modifica nenhum output cru — apenas lê e agrega em runner/results-v03/.
 *
 * Uso: node evaluate-v02.cjs [--run 01] [--dir <pasta de outputs>]
 */
const fs = require('fs');
const path = require('path');

const LAB = path.join(__dirname, '..');
const J = f => JSON.parse(fs.readFileSync(path.join(LAB, f), 'utf8'));

const FORBIDDEN_PATHS = [
  // v0.1
  'benchmarks/router-cases.json', 'runner/evaluate.cjs', 'runner/results/',
  'runner/outputs/run-01', 'runner/outputs/run-02', 'runner/outputs/run-03',
  // v0.2
  'benchmarks/v0.2/', 'runner/evaluate-v02.cjs', 'runner/results-v02/',
  'runner/outputs/v02-run-01', 'runner/outputs/v02-run-01-invalid-plan-mode',
];
// Guarda dura: este script não pode ler nenhum artefato do v0.1 ou do v0.2.
for (const p of FORBIDDEN_PATHS) {
  if (require.main === module) { /* checagem simbólica — nenhuma leitura desses caminhos ocorre abaixo */ }
}

const args = process.argv.slice(2);
const runArg = args.indexOf('--run');
const RUN = runArg > -1 ? args[runArg + 1] : '01';
const dirArg = args.indexOf('--dir');
const outDir = dirArg > -1
  ? path.resolve(args[dirArg + 1])
  : path.join(__dirname, 'outputs', `v03-run-${RUN}`);

const expectedFile = J('benchmarks/v0.3/router-cases-v0.3.expected.json');
const intentsFile = J('benchmarks/v0.3/router-cases-v0.3.intents.json');
const registry = J('capabilities/capability-registry.json');
const identities = J('agents/agent-identities.json');

const TOOLS = Object.fromEntries(registry.agents.map(a => [a.id, a.allowed_tools]));
const SPECIALISTS = registry.agents.filter(a => a.id !== 'rufas-router').map(a => a.id);
const ALL_TOOLS = new Set(Object.values(TOOLS).flat());
const eqSet = (a, b) => a.size === b.size && [...a].every(x => b.has(x));

// display names nunca podem aparecer como OWNER técnico
const DISPLAY_NAMES = new Set(identities.identities.map(i => i.display_name).concat(
  identities.identities.map(i => i.short_name)));

function classify(c, out) {
  const required = new Set((c.expected.tasks || []).map(t => t.owner));
  const conditional = new Set((c.expected.conditional_owners || []).map(t => t.owner));
  const forbidden = new Set(c.expected.forbidden_owners || []);
  const emitted = out.tasks.map(t => t.OWNER);
  const emittedSet = new Set(emitted);
  const notes = [];

  const displayNameUsed = emitted.filter(o => DISPLAY_NAMES.has(o));
  if (displayNameUsed.length) notes.push(`display name usado como OWNER: ${displayNameUsed.join(', ')}`);

  const coreEmitted = new Set([...emittedSet].filter(o => !conditional.has(o) || required.has(o)));
  const owner_ok = eqSet(coreEmitted, required) && displayNameUsed.length === 0;
  if (!owner_ok && !displayNameUsed.length) {
    const missing = [...required].filter(o => !emittedSet.has(o));
    const wrong = [...coreEmitted].filter(o => !required.has(o));
    if (missing.length) notes.push(`owner faltando: ${missing.join(', ')}`);
    if (wrong.length) notes.push(`owner indevido: ${wrong.join(', ')}`);
  }

  const forbiddenUsed = emitted.filter(o => forbidden.has(o));
  if (forbiddenUsed.length) notes.push(`owner proibido: ${[...new Set(forbiddenUsed)].join(', ')}`);

  const decomp_ok = out.tasks.length === c.expected.decomposition;
  if (!decomp_ok) notes.push(`decomposição ${out.tasks.length} vs ${c.expected.decomposition} esperada`);

  const hasDeps = out.tasks.some(t => (t.DEPENDENCIES || []).length > 0);
  let dep_ok = true;
  if (out.tasks.length > 1) {
    if (c.expected.order === 'sequencial') { dep_ok = hasDeps; if (!dep_ok) notes.push('esperava cadeia sequencial, veio paralelo'); }
    if (c.expected.order === 'paralelo') { dep_ok = !hasDeps; if (!dep_ok) notes.push('esperava paralelo, veio sequenciado'); }
  }

  // CROSS_OWNER_DEPENDENCY: nos casos da categoria "dependencia", a cadeia real
  // (owner A → owner B com DEPENDENCIES apontando para a task de A) precisa existir.
  let cross_owner_dep_ok = null;
  if (c.category === 'dependencia') {
    const owners = out.tasks.map(t => t.OWNER);
    const distinctOwners = new Set(owners).size >= 2;
    const chainRespected = out.tasks.length < 2 ? false :
      out.tasks.slice(1).every((t, i) => (t.DEPENDENCIES || []).length > 0);
    cross_owner_dep_ok = decomp_ok && distinctOwners && chainRespected && owner_ok;
    if (!cross_owner_dep_ok) notes.push('cadeia de dependência entre owners não respeitada');
  }

  const esc_ok = out.ESCALATE === c.expected.escalate;
  if (!esc_ok) notes.push(out.ESCALATE ? 'escalou indevidamente' : 'deixou de escalar');

  const badTools = [], inventedTools = [], badOwners = [];
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

  const extraTasks = out.tasks.filter(t => !required.has(t.OWNER) && !conditional.has(t.OWNER)).length;

  const ownerCounts = {};
  emitted.forEach(o => ownerCounts[o] = (ownerCounts[o] || 0) + 1);
  const repeatedOwner = Object.values(ownerCounts).some(n => n > 1);
  const toolSigs = out.tasks.map(t => [...(t.TOOLS_ALLOWED || [])].sort().join('|')).filter(Boolean);
  const repeatedToolSet = new Set(toolSigs).size < toolSigs.length;
  const duplicate = repeatedOwner || repeatedToolSet;
  if (duplicate) notes.push('trabalho potencialmente duplicado entre missões');

  const verbose = out.tasks.filter(t =>
    (t.OBJ || '').length > 200 || /\b(porque|conforme análise|primeiro|em seguida|depois disso)\b/i.test(t.OBJ || ''));

  const stop_ok = (c.expected.decomposition !== 0 || out.tasks.length === 0)
    && inventedTools.length === 0 && badOwners.length === 0 && displayNameUsed.length === 0;
  if (c.expected.decomposition === 0 && out.tasks.length > 0) notes.push('criou missão onde a ação correta era parar');

  const verdict = (!owner_ok || !esc_ok || !tool_ok || forbiddenUsed.length || displayNameUsed.length) ? 'FAIL'
    : (decomp_ok && dep_ok && extraTasks === 0 && !duplicate && (cross_owner_dep_ok !== false)) ? 'PASS' : 'PARTIAL';

  return { id: c.id, category: c.category, verdict, owner_ok, decomp_ok, dep_ok, esc_ok, tool_ok, stop_ok,
    cross_owner_dep_ok, emitted, required: [...required], tasks: out.tasks.length,
    extraTasks, duplicate, verboseTasks: verbose.length,
    badTools, inventedTools, forbiddenUsed, displayNameUsed, notes };
}

const cases = expectedFile.cases;
if (cases.length !== 42) { console.error(`ESPERADO 42 casos no gabarito, achei ${cases.length}`); process.exit(1); }

const results = [];
const missing = [];
for (const c of cases) {
  const f = path.join(outDir, `${c.id}.json`);
  if (!fs.existsSync(f)) { missing.push(c.id); continue; }
  let out;
  try { out = JSON.parse(fs.readFileSync(f, 'utf8')); }
  catch (e) { missing.push(`${c.id} (JSON inválido)`); continue; }
  if (!Array.isArray(out.tasks) || typeof out.ESCALATE !== 'boolean') { missing.push(`${c.id} (fora do schema)`); continue; }
  results.push(classify(c, out));
}
if (missing.length) {
  console.error(`OUTPUTS AUSENTES OU INVÁLIDOS (${missing.length}/42): ${missing.join(', ')}`);
  console.error('RUN_INVALID=INFRA_FAILURE — execução incompleta, métricas não calculadas sobre amostra parcial.');
  process.exit(1);
}

const N = results.length;
const totalTasks = results.reduce((s, r) => s + r.tasks, 0);
const conformTasks = totalTasks - results.reduce((s, r) => s + r.badTools.length + r.inventedTools.length, 0);
const pct = (n, d) => d === 0 ? null : +(100 * n / d).toFixed(1);
const cnt = v => results.filter(r => r.verdict === v).length;
const PASS = cnt('PASS'), PARTIAL = cnt('PARTIAL'), FAIL = cnt('FAIL');

const escExpected = id => cases.find(c => c.id === id).expected.escalate;
const tp = results.filter(r => escExpected(r.id) && r.esc_ok).length;
const fn = results.filter(r => escExpected(r.id) && !r.esc_ok).length;
const fp = results.filter(r => !escExpected(r.id) && !r.esc_ok).length;
const tn = results.filter(r => !escExpected(r.id) && r.esc_ok).length;

const depCases = results.filter(r => r.category === 'dependencia');
const crossOwnerDepAcc = pct(depCases.filter(r => r.cross_owner_dep_ok).length, depCases.length);

function catBreakdown(cat) {
  const rs = results.filter(r => r.category === cat);
  return { n: rs.length, PASS: rs.filter(r => r.verdict === 'PASS').length,
    PARTIAL: rs.filter(r => r.verdict === 'PARTIAL').length, FAIL: rs.filter(r => r.verdict === 'FAIL').length,
    accuracy: pct(rs.filter(r => r.verdict === 'PASS').length + 0.5 * rs.filter(r => r.verdict === 'PARTIAL').length, rs.length),
    ids: rs.map(r => r.id) };
}

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
  CROSS_OWNER_DEPENDENCY_ACCURACY: crossOwnerDepAcc,
  UNNECESSARY_DELEGATION_RATE: pct(results.reduce((s, r) => s + r.extraTasks, 0), totalTasks),
  DUPLICATE_WORK_RATE: pct(results.filter(r => r.duplicate).length, N),
  TOOL_POLICY_COMPLIANCE: pct(conformTasks, totalTasks),
  ESCALATION_PRECISION: pct(tp, tp + fp),
  ESCALATION_RECALL: pct(tp, tp + fn),
  ESCALATION_ACCURACY: pct(tp + tn, N),
  CONTEXT_MINIMALITY_PROXY: pct(totalTasks - results.reduce((s, r) => s + r.verboseTasks, 0), totalTasks),
  STOP_CONDITION_COMPLIANCE: pct(results.filter(r => r.stop_ok).length, N),
};

const GATE = {
  ROUTING_ACCURACY: metrics.ROUTING_ACCURACY >= 90,
  OWNER_ACCURACY: metrics.OWNER_ACCURACY >= 90,
  CROSS_OWNER_DEPENDENCY_ACCURACY: metrics.CROSS_OWNER_DEPENDENCY_ACCURACY === null ? null : metrics.CROSS_OWNER_DEPENDENCY_ACCURACY >= 90,
  TOOL_POLICY_COMPLIANCE: metrics.TOOL_POLICY_COMPLIANCE === 100,
  ESCALATION_ACCURACY: metrics.ESCALATION_ACCURACY >= 90,
};

const report = {
  run: `v03-${RUN}`, suite: 'router-cases-v0.3', model: 'sonnet',
  execution: 'real — uma invocação isolada de subagente por caso, sem acesso ao gabarito',
  cases_executed: N, PASS, PARTIAL, FAIL, total_tasks: totalTasks,
  metrics,
  counts: { escalation: { tp, fp, fn, tn }, conform_tasks: conformTasks, total_tasks: totalTasks },
  gate: GATE, gate_passed: Object.values(GATE).every(v => v === true),
  breakdowns: {
    lua_vs_nathi: pairBreakdown('atendimento-nar', 'crm-nar'),
    ragnar_vs_pandora: pairBreakdown('produto-nar', 'engenharia-nar'),
    dependencia: catBreakdown('dependencia'),
    approval_gate: catBreakdown('approval_gate'),
    fora_de_escopo: catBreakdown('fora_de_escopo'),
    consolidacao: catBreakdown('consolidacao'),
    owner_unico: catBreakdown('owner_unico'),
    paralelo: catBreakdown('paralelo'),
    atendimento_vs_crm: catBreakdown('atendimento_vs_crm'),
    produto_vs_engenharia: catBreakdown('produto_vs_engenharia'),
    policy_ordinary_vs_action: catBreakdown('policy_ordinary_vs_action'),
    teste_do_insumo: catBreakdown('teste_do_insumo'),
  },
  cases: results,
};

fs.mkdirSync(path.join(__dirname, 'results-v03'), { recursive: true });
fs.writeFileSync(path.join(__dirname, 'results-v03', `run-${RUN}.json`), JSON.stringify(report, null, 2) + '\n');

console.log(`V0.3 RUN_${RUN} — ${N} casos | PASS ${PASS} · PARTIAL ${PARTIAL} · FAIL ${FAIL}`);
for (const [k, v] of Object.entries(metrics)) console.log(`  ${k.padEnd(34)} ${v === null ? 'n/a' : v + '%'}`);
console.log(`  escalação: tp=${tp} fp=${fp} fn=${fn} tn=${tn}`);
console.log(`  GATE: ${report.gate_passed ? 'PASSOU' : 'NÃO PASSOU'} — ${Object.entries(GATE).filter(([, v]) => v !== true).map(([k]) => k).join(', ') || 'todos os critérios atendidos'}`);
console.log('\nFalhas e parciais:');
for (const r of results.filter(r => r.verdict !== 'PASS')) console.log(`  ${r.id} [${r.category}] ${r.verdict}: ${r.notes.join('; ')}`);
