import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { runSentinel, extractRule } from '../app/core.mjs';
import { assertLiveResult } from '../scripts/assert-live-result.mjs';
const template = JSON.parse(fs.readFileSync(new URL('../input_examples/example_1.json', import.meta.url), 'utf8'));
const mocked = propose => runSentinel(template, { sample: false,
  zetaris: { passages: async () => template.passages },
  meterless: { probe: async () => ({ state: 'online' }), propose } });

test('acceptance checks all controlled outcomes and exact evidence (mocked providers)', async () => {
  const result = await mocked(async ({ passage, kind }) => extractRule(passage, kind));
  assert.doesNotThrow(() => assertLiveResult(result, template));
  const corrupt = structuredClone(result);
  corrupt.results[0].current.evidence.sha256 = 'invented';
  assert.throws(() => assertLiveResult(corrupt, template));
});

test('successful HTTP calls and H-MEM writes cannot certify rejected model proposals', async () => {
  const result = await mocked(async () => ({ kind: 'staff_limit', value: 999, quote: 'invented' }));
  assert.ok(result.summary.model_calls > 0 && result.memory.records > 0);
  assert.throws(() => assertLiveResult(result, template), /validated decisions/);
});
