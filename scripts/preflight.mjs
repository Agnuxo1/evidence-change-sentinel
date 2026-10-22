import fs from 'node:fs';
import { Meterless, Zetaris } from '../app/adapters.mjs';
const report = { checked_at: new Date().toISOString(), checks: {}, submission_ready: false };
for (const [name, check] of [['zetaris_sql', async () => { const r = await new Zetaris().query('SELECT 1'); if (String(r.data?.[0]?.[0]) !== '1') throw new Error('Unexpected SELECT 1 response.'); return { state: 'online' }; }],
  ['zetaris_passages', () => new Zetaris().passages().then(rows => ({ state: 'online', rows: rows.length }))],
  ['meterless_models', () => new Meterless().probe()]]) {
  try { report.checks[name] = await check(); }
  catch (error) { report.checks[name] = { state: error.state || 'failed', message: error.state ? error.message : 'Check failed; verify configuration privately.' }; }
}
report.note = 'Connectivity alone does not prove a complete feature, Cursor development or Nemotron routing. An actual live run and recording are also required.';
fs.mkdirSync('evidence', { recursive: true });
fs.writeFileSync('evidence/preflight.json', JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
process.exitCode = Object.values(report.checks).every(c => c.state === 'online') ? 0 : 1;
