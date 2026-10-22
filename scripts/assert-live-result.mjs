import assert from 'node:assert/strict';
import { digest, extractRule } from '../app/core.mjs';

// Application-result validation only. Authentic sponsor identity still requires
// independently inspected service receipts; mocks can exercise this function.
export function assertLiveResult(result, template) {
  assert.equal(result.mode, 'live');
  assert.equal(result.summary.total, template.requirements.length);
  assert.equal(result.summary.human_review, 0, 'The controlled fixture must produce validated decisions, not abstentions.');
  assert.equal(result.summary.affected, 1);
  assert.equal(result.summary.preserved, 2);
  assert.equal(result.summary.changed_decisions, 1);
  assert.ok(result.summary.model_calls >= 4, 'Expected proposals for all four distinct fixture clauses.');
  assert.ok(result.memory.records >= 4);
  assert.ok(result.trace.some(e => e.agent === 'EvidenceReader' && e.action === 'zetaris_query'));
  assert.ok(result.trace.some(e => e.agent === 'MemoryWriter' && e.action === 'hmem_store'));
  assert.ok(result.trace.some(e => e.agent === 'RuleProposer' && e.provider === 'meterless'));
  const expected = { staff: ['meets', 'does_not_meet'], date: ['meets', 'meets'], region: ['meets', 'meets'] };
  assert.equal(result.results.length, template.requirements.length);
  for (const req of template.requirements) {
    const matches = result.results.filter(r => r.requirement_id === req.id);
    assert.equal(matches.length, 1, 'Missing or duplicate requirement result.');
    const row = matches[0];
    assert.deepEqual([row.previous.decision, row.current.decision], expected[req.id]);
    for (const [snapshot, version] of [['previous', 'before'], ['current', 'after']]) {
      const source = template.passages.find(p => p.source_id === req.source_id && p.passage_id === req.passage_id && p.version === version);
      const e = row[snapshot].evidence;
      assert.ok(e, 'Missing validated evidence.');
      assert.deepEqual(e, { source_id: source.source_id, passage_id: source.passage_id,
        url: source.url, quote: extractRule(source.text, req.kind).quote, sha256: digest(source.text), version });
      assert.equal(row[snapshot].rule.kind, req.kind);
    }
  }
}
