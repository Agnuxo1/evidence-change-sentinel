import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { runSentinel } from './app/core.mjs';
import { ServiceError } from './app/adapters.mjs';

const root = path.dirname(fileURLToPath(import.meta.url));
const sample = process.env.SAMPLE_MODE !== 'false';
const example = () => JSON.parse(fs.readFileSync(path.join(root, 'input_examples', 'example_1.json'), 'utf8'));
export async function execute(input, opts = {}) {
  const runId = randomUUID();
  const result = await runSentinel(input, { sample, ...opts });
  const dir = path.join(root, 'logs');
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `trace-${runId}.jsonl`);
  fs.writeFileSync(file, result.trace.map(e => JSON.stringify({ run_id: runId, ...e })).join('\n') + '\n');
  console.log(JSON.stringify({ run_id: runId, ...result.summary, mode: result.mode }));
  return { run_id: runId, ...result, log_file: `logs/trace-${runId}.jsonl` };
}
const mode = process.argv[2] || 'serve';
if (mode === 'demo' || mode === 'run') {
  const result = await execute(mode === 'run' ? JSON.parse(fs.readFileSync(process.argv[3], 'utf8')) : example());
  if (process.argv[4]) fs.writeFileSync(process.argv[4], JSON.stringify(result, null, 2) + '\n');
  else console.log(JSON.stringify(result, null, 2));
} else if (mode === 'serve') {
  const server = http.createServer(async (req, res) => {
    const send = (status, payload) => { res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' }); res.end(JSON.stringify(payload)); };
    if (req.url === '/' && req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'X-Content-Type-Options': 'nosniff', 'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; connect-src 'self'; img-src 'self'; frame-ancestors 'none'" });
      return res.end(fs.readFileSync(path.join(root, 'web', 'index.html')));
    }
    if (req.url === '/health' && req.method === 'GET') return send(200, { status: 'ok', mode: sample ? 'offline_sample' : 'live', integration_claim: sample ? 'not_verified' : 'requires_live_preflight' });
    if (req.url === '/example' && req.method === 'GET') return send(200, example());
    if (req.url !== '/run' || req.method !== 'POST') return send(404, { error: 'Not found.' });
    // Reject browser cross-origin requests even on localhost.
    if (req.headers.origin && req.headers.origin !== `http://${req.headers.host}`) return send(403, { error: 'Cross-origin requests are not permitted.' });
    if (!(req.headers['content-type'] || '').startsWith('application/json')) return send(415, { error: 'Use application/json.' });
    let body = '', exceeded = false;
    for await (const chunk of req) { body += chunk; if (Buffer.byteLength(body) > 500000) { exceeded = true; break; } }
    if (exceeded) return send(413, { error: 'Request too large.' });
    try { send(200, await execute(JSON.parse(body))); }
    catch (error) { send(error instanceof ServiceError ? 503 : 400, { status: 'error', type: error instanceof ServiceError ? error.state : 'invalid_input', message: error instanceof ServiceError ? error.message : 'Invalid input. Check the documented schema.' }); }
  });
  server.requestTimeout = 420000;
  server.headersTimeout = 15000;
  server.listen(Number(process.env.PORT || 8788), process.env.HOST || '127.0.0.1', () => console.log(`Evidence Change Sentinel: http://${process.env.HOST || '127.0.0.1'}:${process.env.PORT || 8788} (${sample ? 'offline sample' : 'live'})`));
} else throw new Error('Usage: npm start | npm run demo | npx tsx run.mjs run input.json [output.json]');
