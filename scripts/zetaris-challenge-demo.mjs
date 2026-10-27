// Read-only Zetaris Demo Challenge adapter for the submitted project.
// Requires the same Zetaris environment variables as the existing adapter.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { Zetaris } from '../app/adapters.mjs';

const fixture = JSON.parse(await readFile(new URL('../input_examples/example_1.json', import.meta.url), 'utf8'));
const rowKey = p => JSON.stringify([p.source_id, p.version, p.passage_id, p.text, p.url]);
const expected = fixture.passages.map(rowKey).sort();
const live = await new Zetaris().passages();
assert.deepEqual(live.map(rowKey).sort(), expected, 'Zetaris rows differ from the synthetic fixture');

const grouped = new Map();
for (const row of live) {
  const key = `${row.source_id}/${row.passage_id}`;
  if (!grouped.has(key)) grouped.set(key, {});
  const pair = grouped.get(key);
  assert.ok(['before', 'after'].includes(row.version) && !pair[row.version], 'Unexpected version or duplicate');
  pair[row.version] = row;
}
const comparisons = [...grouped.entries()].map(([id, pair]) => {
  assert.ok(pair.before && pair.after, 'Incomplete evidence pair');
  return { id, changed: pair.before.text !== pair.after.text, before: pair.before.text, after: pair.after.text };
}).sort((a, b) => a.id.localeCompare(b.id));
const out = {
  checked_at_utc: new Date().toISOString(),
  data: 'synthetic fixture',
  mode: 'authenticated Zetaris read-only query; passage comparison, not a new assessment',
  rows: live.length,
  source_count: new Set(live.map(row => row.source_id)).size,
  changed_passages: comparisons.filter(item => item.changed).length,
  unchanged_passages: comparisons.filter(item => !item.changed).length,
  fixture_sha256: createHash('sha256').update(JSON.stringify(expected)).digest('hex'),
  comparisons,
  note: 'Historical model/assessment results are separate; a person makes real eligibility decisions.'
};
assert.equal(out.rows, 6);
assert.equal(out.changed_passages, 1);
assert.equal(out.unchanged_passages, 2);
console.log(JSON.stringify(out, null, 2));
