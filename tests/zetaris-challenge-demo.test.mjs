import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { spawn } from 'node:child_process';
import { readFile } from 'node:fs/promises';

const fixture = JSON.parse(await readFile(new URL('../input_examples/example_1.json', import.meta.url), 'utf8'));
const rows = fixture.passages.map(p => [p.source_id, p.version, p.passage_id, p.text, p.url]);
const run = async payload => {
  let query = null;
  const server = http.createServer(async (req, res) => {
    let data = '';
    for await (const chunk of req) data += chunk;
    query = JSON.parse(data).sql;
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ data: payload }));
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  try {
    const port = server.address().port;
    const env = { ...process.env, ZETARIS_API_KEY: 'synthetic-test-token',
      ZETARIS_ORG_ID: '1', ZETARIS_VIEW: 'sentinel_review.sentinel_passages',
      ZETARIS_REST_URL: `http://127.0.0.1:${port}/api/v1.0` };
    const child = spawn(process.execPath, ['scripts/zetaris-challenge-demo.mjs'], { env });
    let stdout = '', stderr = '';
    child.stdout.on('data', x => stdout += x);
    child.stderr.on('data', x => stderr += x);
    const code = await new Promise(resolve => child.on('close', resolve));
    return { code, stdout, stderr, query };
  } finally { server.close(); }
};

test('synthetic fixture yields one changed and two unchanged passage pairs', async () => {
  const result = await run(rows);
  assert.equal(result.code, 0);
  assert.match(result.query, /^SELECT /);
  assert.doesNotMatch(result.stdout, /synthetic-test-token/);
  const parsed = JSON.parse(result.stdout);
  assert.equal(parsed.rows, 6);
  assert.equal(parsed.changed_passages, 1);
  assert.equal(parsed.unchanged_passages, 2);
  assert.match(parsed.mode, /not a new assessment/);
});

test('a mismatch against the fixture fails instead of being reported as verified', async () => {
  const altered = rows.map(row => [...row]);
  altered[0][3] = 'Altered text';
  const result = await run(altered);
  assert.notEqual(result.code, 0);
  assert.equal(result.stdout, '');
  assert.doesNotMatch(result.stderr, /synthetic-test-token/);
});
