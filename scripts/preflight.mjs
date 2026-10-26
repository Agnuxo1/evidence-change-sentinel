import { Meterless, Zetaris } from '../app/adapters.mjs';
import { writeDiagnostic } from './evidence-output.mjs';
const report = { checked_at: new Date().toISOString(), scope:'connectivity_only', checks: {}, integration_verified: false };
for (const [name, check] of [['zetaris_sql', async () => { const r = await new Zetaris().query('SELECT 1'); if (String(r.data?.[0]?.[0]) !== '1') throw new Error('Unexpected SELECT 1 response.'); return { state: 'online' }; }],
  ['zetaris_passages', () => new Zetaris().passages().then(rows => ({ state: 'online', rows: rows.length }))],
  ['meterless_models', () => new Meterless().probe()]]) {
  try { report.checks[name] = await check(); }
  catch (error) { report.checks[name] = { state: error.state || 'failed', message: error.state ? error.message : 'Check failed; verify configuration privately.' }; }
}
report.note = 'Connectivity alone does not prove a complete feature, Cursor development or Nemotron routing. An actual live run and recording are also required.';
const target = writeDiagnostic('preflight.json', report);
console.log(JSON.stringify(report, null, 2));
console.error(`Diagnostic saved: ${target}`);
process.exitCode = Object.values(report.checks).every(c => c.state === 'online') ? 0 : 1;
