// Verified sponsor-API acceptance test for the Open Agent Hackathon.
// Does not generate, acquire or print tokens. Run with real services only.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runSentinel } from '../app/core.mjs';
import { Meterless, Zetaris } from '../app/adapters.mjs';
import { assertLiveResult } from './assert-live-result.mjs';
import { writeDiagnostic } from './evidence-output.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const json = file => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
const template = json('input_examples/example_1.json');
const report = {
  checked_at: new Date().toISOString(), evidence_kind: 'live_sponsor_connectivity',
  dataset_kind: 'synthetic_example', checked: {}, integration_verified: false,
  submission_check: 'not_performed_by_this_script',
};

try {
  assert.equal(process.env.SAMPLE_MODE, 'false',
    'Set SAMPLE_MODE=false to prevent confusing an offline demo with live evidence.');
  assert.ok(process.env.ZETARIS_API_KEY, 'Configure ZETARIS_API_KEY privately.');
  assert.ok(process.env.METERLESS_RUNTIME_TOKEN, 'Configure METERLESS_RUNTIME_TOKEN privately.');

  const z = new Zetaris();
  const m = new Meterless();
  const ping = await z.query('SELECT 1 AS one', { timeoutMs: 12000 });
  assert.equal(String(ping.data?.[0]?.[0]), '1', 'Zetaris must execute SQL.');
  report.checked.zetaris_sql = 'pass';

  const rows = await z.passages({ timeoutMs: 20000 });
  for (const requirement of template.requirements) {
    for (const version of ['before', 'after']) {
      assert.ok(rows.some(row =>
        row.source_id === requirement.source_id &&
        row.passage_id === requirement.passage_id && row.version === version),
        `Missing ${requirement.id} (${version}) in Zetaris sentinel_passages view.`);
    }
  }
  report.checked.zetaris_versioned_view = 'pass';
  report.checked.zetaris_rows = rows.length;

  const discovery = await m.probe({ timeoutMs: 12000 });
  assert.equal(discovery.state, 'online');
  report.checked.meterless_discovery = 'pass';

  // Live path: the application's own code must query Zetaris, call Nightshift
  // for at least one proposal, validate a quote and write H-MEM.
  const result = await runSentinel(template, { sample: false, maxDurationMs: 180000 });
  assertLiveResult(result, template);
  assert.ok(result.trace.some(e => e.agent === 'EvidenceReader' &&
    e.action === 'zetaris_query' && e.verified_live === true));
  assert.ok(result.trace.some(e => e.agent === 'RuleProposer' &&
    e.provider === 'meterless'));
  assert.ok(result.summary.model_calls > 0, 'No live Nightshift model call.');
  assert.ok(result.trace.some(e => e.agent === 'MemoryWriter' &&
    e.action === 'hmem_store'));
  assert.ok(result.memory.records > 0);
  assert.equal(result.summary.total, template.requirements.length);
  assert.ok(result.results.every(e => e.current.evidence &&
    e.current.evidence.source_id && e.current.evidence.sha256));
  report.checked.live_agent_execution = 'pass';
  report.checked.validated_evidence_count = result.results.length;
  report.checked.nightshift_model_calls = result.summary.model_calls;
  report.checked.hmem_records = result.memory.records;
  report.checked.abstentions = result.summary.human_review;
  report.integration_verified = true;
  report.note = 'This checks real sponsor endpoints with a synthetic, pre-loaded Zetaris dataset. It does not prove independent real-world grant evaluation, Nemotron model selection, Cursor use, eligibility or a completed HackOS submission.';
} catch (error) {
  report.error = String(error?.message || error).slice(0, 500);
  report.integration_verified = false;
  report.note = 'A failed or incomplete live check must never be reported as a successful sponsor integration.';
} finally {
  const target = writeDiagnostic('live-acceptance.json', report);
  console.log(JSON.stringify(report, null, 2));
  console.error(`Diagnostic saved: ${target}`);
  if (!report.integration_verified) process.exitCode = 1;
}
