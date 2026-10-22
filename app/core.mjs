import { createHash } from 'node:crypto';
import { HMEM } from '../vendor/hmem/src/index.ts';
import { Meterless, Zetaris, ServiceError } from './adapters.mjs';

export const digest = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const dateValid = s => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s)) && new Date(s).toISOString().slice(0, 10) === s;
export function validateInput(input) {
  if (!input || typeof input !== 'object' || !/^[a-zA-Z0-9_-]{1,64}$/.test(input.project_id ?? '')) throw new Error('project_id must be a short identifier.');
  if (!Array.isArray(input.requirements) || !input.requirements.length || input.requirements.length > 100) throw new Error('Provide 1 to 100 requirements.');
  if (!Array.isArray(input.passages) || input.passages.length > 500) throw new Error('Provide at most 500 versioned passages.');
  if (!input.applicant || typeof input.applicant !== 'object' || Array.isArray(input.applicant)) throw new Error('Provide a synthetic applicant object.');
  const ids = new Set();
  for (const r of input.requirements) {
    if (!r || typeof r.id !== 'string' || ids.has(r.id) || !r.id || r.id.length > 80 || !['staff_limit', 'deadline', 'regions', 'unknown'].includes(r.kind)) throw new Error('Requirements need unique IDs and a supported kind.');
    ids.add(r.id);
    if (typeof r.source_id !== 'string' || typeof r.passage_id !== 'string') throw new Error('Each requirement needs a source and passage ID.');
  }
  const keys = new Set();
  for (const p of input.passages) {
    if (!p || !['before','after'].includes(p.version) || !['source_id','passage_id','text','url'].every(k => typeof p[k] === 'string') || p.text.length > 20000 || p.source_id.length > 100 || p.passage_id.length > 100) throw new Error('Invalid passage.');
    const key = JSON.stringify([p.source_id, p.version, p.passage_id]);
    if (keys.has(key)) throw new Error('Duplicate passage identity.');
    keys.add(key);
    if (!/^https?:\/\//i.test(p.url)) throw new Error('Passages need an HTTP(S) provenance URL.');
  }
  return input;
}

// A deliberately narrow executable grammar. Outside this grammar, abstain.
// These strings are synthetic examples, never purported to be official clauses.
export function extractRule(text, kind) {
  let match;
  const clean = text.trim();
  if (kind === 'staff_limit' && (match = /^Applicants must have at most (\d+) employees\.$/.exec(clean))) return { kind, value: Number(match[1]), quote: clean };
  if (kind === 'deadline' && (match = /^Applications must be submitted by (\d{4}-\d{2}-\d{2})\.$/.exec(clean)) && dateValid(match[1])) return { kind, value: match[1], quote: clean };
  if (kind === 'regions' && (match = /^Eligible regions: ([A-Z]{2}(?:, [A-Z]{2})*)\.$/.exec(clean))) return { kind, value: match[1].split(', '), quote: clean };
  return { kind: 'unknown', value: null, quote: clean };
}

export function checkProposal(proposal, passage, requiredKind) {
  const expected = extractRule(passage.text, requiredKind);
  if (!proposal || typeof proposal.quote !== 'string' || !proposal.quote || !passage.text.includes(proposal.quote)) return { ok: false, error: 'The quote is not an exact nonempty substring of the source.' };
  if (proposal.kind !== expected.kind || !same(proposal.value, expected.value)) return { ok: false, error: 'The proposed rule is not supported by the independently parsed source. Use unknown for an unsupported clause.' };
  // An unknown rule cannot be promoted to a factual eligibility decision.
  return { ok: true, rule: expected };
}

export function assess(rule, applicant) {
  if (rule.kind === 'staff_limit' && Number.isSafeInteger(applicant.employees) && applicant.employees >= 0) return { decision: applicant.employees <= rule.value ? 'meets' : 'does_not_meet', reason: `${applicant.employees} employees; limit ${rule.value}.` };
  if (rule.kind === 'deadline' && dateValid(applicant.submitted_on)) return { decision: applicant.submitted_on <= rule.value ? 'meets' : 'does_not_meet', reason: `Submitted ${applicant.submitted_on}; date limit ${rule.value}.` };
  if (rule.kind === 'regions' && typeof applicant.region === 'string' && /^[A-Z]{2}$/.test(applicant.region)) return { decision: rule.value.includes(applicant.region) ? 'meets' : 'does_not_meet', reason: `Region ${applicant.region}; listed ${rule.value.join(', ')}.` };
  return { decision: 'human_review', reason: 'Unsupported wording or missing/invalid applicant facts. No eligibility conclusion.' };
}

export async function runSentinel(raw, options = {}) {
  const input = validateInput(structuredClone(raw));
  const started = performance.now();
  const sample = options.sample ?? true;
  const maxDurationMs = options.maxDurationMs ?? 300000;
  const remaining = () => {
    const ms = maxDurationMs - (performance.now() - started);
    if (ms <= 0) throw new ServiceError('Sentinel', 'time_budget_exceeded', 'Run exceeded its configured time budget.');
    return Math.ceil(ms);
  };
  const trace = [];
  const emit = (agent, action, details = {}) => trace.push({ sequence: trace.length + 1, agent, action, ...details });
  emit('Planner', 'begin', { mode: sample ? 'offline_sample' : 'live', requirements: input.requirements.length });
  if (!sample) {
    const zetaris = options.zetaris || new Zetaris();
    input.passages = await zetaris.passages({ timeoutMs: remaining() });
    remaining();
    validateInput(input);
    emit('EvidenceReader', 'zetaris_query', { rows: input.passages.length, verified_live: true });
  } else emit('EvidenceReader', 'sample_data', { synthetic: input.synthetic === true });
  const hmem = options.hmem || new HMEM({ actor: 'sentinel', ...(options.persistDir ? { persistDir: options.persistDir } : {}) });
  const provider = sample ? null : (options.meterless || new Meterless());
  if (provider) { await provider.probe({ timeoutMs: remaining() }); remaining(); emit('Planner', 'meterless_model_discovery', { state: 'online' }); }
  const snapshot = version => new Map(input.passages.filter(p => p.version === version).map(p => [JSON.stringify([p.source_id, p.passage_id]), p]));
  const before = snapshot('before'), after = snapshot('after');
  const keyFor = r => JSON.stringify([r.source_id, r.passage_id]);
  const versions = { before, after };
  const reviews = [];
  const results = [];
  const knownKeys = new Set(input.requirements.map(keyFor));
  for (const key of new Set([...before.keys(), ...after.keys()])) {
    if (!knownKeys.has(key) && !same(before.get(key)?.text, after.get(key)?.text)) reviews.push({ type: 'unmapped_change', source_id: (after.get(key) || before.get(key)).source_id, passage_id: (after.get(key) || before.get(key)).passage_id, reason: 'An added, removed or changed clause has no mapped requirement. Human review is required.' });
  }
  let modelCalls = 0, cacheHits = 0, recomputed = 0;
  const evaluate = async (requirement, version, applicant) => {
    remaining();
    const p = versions[version].get(keyFor(requirement));
    if (!p) { emit('Validator', 'missing_evidence', { requirement_id: requirement.id, version }); return { decision: 'human_review', reason: 'Required evidence passage is missing.', evidence: null, memory_id: null }; }
    const fingerprint = digest({ project_id: input.project_id, applicant, requirement, text: p.text, url: p.url, sample });
    const tag = `fingerprint:${fingerprint}`;
    // H-MEM queries provide an auditable retrieval trace. Exact fingerprints,
    // rather than the reference embedder's semantic similarity, permit reuse.
    const recall = hmem.query(`${requirement.id} ${p.text}`, { topN: 100, threshold: 0 });
    const memory = hmem.store.all().find(m => m.tags.includes(tag) && !m.supersededBy);
    if (memory) {
      cacheHits++;
      emit('Planner', 'reuse_validated_memory', { requirement_id: requirement.id, memory_id: memory.id, retrieval_strategy: recall.trace.strategy });
      const cached = JSON.parse(memory.content);
      return { ...cached, evidence: { ...cached.evidence, version }, memory_id: memory.id, reused: true };
    }
    let rule, lastError;
    for (let attempt = 0; attempt < 2; attempt++) {
      const proposal = provider ? await provider.propose({ passage: p.text, kind: requirement.kind }, lastError, { timeoutMs: remaining() }) : extractRule(p.text, requirement.kind);
      remaining();
      if (provider) modelCalls++;
      emit('RuleProposer', 'propose_rule', { requirement_id: requirement.id, version, attempt, provider: provider ? 'meterless' : 'deterministic_sample' });
      const checked = checkProposal(proposal, p, requirement.kind);
      if (checked.ok) { rule = checked.rule; emit('Validator', 'accepted', { requirement_id: requirement.id, version, attempt }); break; }
      lastError = checked.error;
      emit('Validator', 'request_revision', { requirement_id: requirement.id, version, attempt, reason: lastError });
    }
    const assessment = rule ? assess(rule, applicant) : { decision: 'human_review', reason: 'The proposal failed validation twice. No unsupported conclusion was accepted.' };
    const value = { ...assessment, rule: rule ?? null, evidence: { source_id: p.source_id, passage_id: p.passage_id, url: p.url, quote: rule?.quote ?? p.text, sha256: digest(p.text), version } };
    const stored = hmem.add({ content: JSON.stringify(value), type: 'factual', source: p.url,
      confidence: assessment.decision === 'human_review' ? 0.5 : 1, tags: [tag, `project:${input.project_id}`, `requirement:${requirement.id}`],
      provenance: { origin: 'document', learnedAt: Date.now(), label: `${p.source_id}/${p.passage_id}`, refs: [digest(p.text)] } });
    emit('MemoryWriter', 'hmem_store', { requirement_id: requirement.id, memory_id: stored.id, decision: assessment.decision });
    return { ...value, memory_id: stored.id, reused: false };
  };
  for (const r of input.requirements) {
    remaining();
    const previousApplicant = input.previous_applicant ?? input.applicant;
    const previous = await evaluate(r, 'before', previousApplicant);
    const oldPassage = before.get(keyFor(r)), newPassage = after.get(keyFor(r));
    const affected = !oldPassage || !newPassage || oldPassage.text !== newPassage.text || oldPassage.url !== newPassage.url || !same(previousApplicant, input.applicant);
    let current;
    if (affected) {
      recomputed++;
      emit('Planner', 'invalidate_dependency', { requirement_id: r.id, old_memory_id: previous.memory_id });
      current = await evaluate(r, 'after', input.applicant);
      if (previous.memory_id && previous.memory_id !== current.memory_id) {
        hmem.store.update(previous.memory_id, { supersededBy: current.memory_id || 'missing-evidence' });
        if (current.memory_id) hmem.store.update(current.memory_id, { supersedes: previous.memory_id });
      }
    } else {
      current = { ...previous, reused: true, evidence: previous.evidence ? { ...previous.evidence, version: 'after' } : null };
      cacheHits++;
      emit('Planner', 'preserve_unaffected', { requirement_id: r.id, memory_id: previous.memory_id });
    }
    if (current.decision === 'human_review') reviews.push({ type: 'unresolved_requirement', requirement_id: r.id, reason: current.reason });
    results.push({ requirement_id: r.id, label: r.label || r.id, affected, decision_changed: previous.decision !== current.decision, previous, current });
  }
  remaining();
  emit('Planner', 'complete', { affected: recomputed, human_review: reviews.length });
  return { project_id: input.project_id, mode: sample ? 'offline_sample' : 'live', synthetic: input.synthetic === true,
    summary: { total: results.length, affected: recomputed, preserved: results.length - recomputed, changed_decisions: results.filter(r => r.decision_changed).length, human_review: reviews.length, model_calls: modelCalls, memory_reuses: cacheHits },
    results, review_queue: reviews, trace, memory: { engine: 'Meterless H-MEM reference', records: hmem.store.all().length, ledger_events: hmem.ledger.all().length },
    duration_ms: Math.round((performance.now() - started) * 100) / 100,
    limitations: ['Research prototype for reviewing evidence, not an official eligibility determination.', 'Only three explicit English rule grammars are automatically evaluated; other language goes to human review.', 'Offline sample mode does not demonstrate Zetaris, Nightshift, NVIDIA or Cursor use.'] };
}
