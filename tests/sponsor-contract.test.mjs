import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { Meterless, Zetaris, ServiceError } from '../app/adapters.mjs';
import { runSentinel, extractRule } from '../app/core.mjs';

const input = JSON.parse(readFileSync(new URL('../input_examples/example_1.json', import.meta.url), 'utf8'));

async function serverFor(handler) {
  const server = createServer(async (req, res) => {
    let data = '';
    for await (const chunk of req) data += chunk;
    try {
      const result = await handler(req, data ? JSON.parse(data) : undefined);
      res.writeHead(result.status || 200, { 'content-type': 'application/json' });
      res.end(JSON.stringify(result.body));
    } catch (e) {
      res.writeHead(500, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ message: String(e) }));
    }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  return { url: `http://127.0.0.1:${server.address().port}`, close: () => new Promise((resolve,reject)=>server.close(e=>e?reject(e):resolve())) };
}

test('mock contract exercises Zetaris → Nightshift → quote validation → H-MEM without claiming live sponsors', async () => {
  let sqlCalls = 0, proposals = 0, bearerChecks = 0;
  const fakeZ = await serverFor((req, data) => {
    assert.equal(req.method, 'POST');
    assert.equal(req.url, '/api/v1.0/sql-editor/sqls/run');
    assert.equal(req.headers.authorization, 'Bearer fake-test-z-key');
    assert.equal(req.headers['x-org-id'], '1');
    assert.ok(req.headers['x-request-id']);
    assert.ok(typeof data.sql === 'string');
    sqlCalls++;
    if (data.sql.startsWith('SELECT source_id')) {
      return {body:{data:input.passages.map(p=>[p.source_id,p.version,p.passage_id,p.text,p.url])}};
    }
    return {body:{data:[[1]]}};
  });
  const fakeM = await serverFor((req, data) => {
    assert.equal(req.headers.authorization, 'Bearer fake-test-m-token');
    assert.equal(req.headers['meterless-app'], 'evidence-change-sentinel');
    bearerChecks++;
    if (req.url === '/v1/models') return {body:{data:[{id:'meterless/auto'}]}};
    assert.equal(req.url, '/v1/chat/completions');
    assert.equal(req.method, 'POST');
    assert.equal(req.headers['meterless-scope'], 'user');
    assert.equal(data.model,'meterless/auto');
    const user = JSON.parse(data.messages.find(m=>m.role==='user').content);
    proposals++;
    return {body:{choices:[{message:{content:JSON.stringify(
      extractRule(user.evidence.passage,user.evidence.kind))}}]}};
  });
  try {
    const z = new Zetaris({ZETARIS_REST_URL:`${fakeZ.url}/api/v1.0`,ZETARIS_API_KEY:'fake-test-z-key',ZETARIS_ORG_ID:'1',ZETARIS_VIEW:'sentinel_passages'});
    const m = new Meterless({METERLESS_BASE_URL:`${fakeM.url}/v1`,METERLESS_RUNTIME_TOKEN:'fake-test-m-token',METERLESS_MODEL:'meterless/auto'});
    const result=await runSentinel(input,{sample:false,zetaris:z,meterless:m});
    assert.equal(result.mode,'live'); // application path mode only; servers are mocks
    assert.equal(result.synthetic,true);
    assert.equal(result.summary.total,3);
    assert.equal(result.summary.affected,1);
    assert.equal(result.summary.preserved,2);
    assert.equal(result.summary.model_calls,proposals);
    assert.ok(sqlCalls>=1 && bearerChecks>=1 && proposals>0);
    assert.ok(result.trace.some(e=>e.agent==='EvidenceReader'&&e.action==='zetaris_query'));
    assert.ok(result.trace.some(e=>e.agent==='MemoryWriter'&&e.action==='hmem_store'));
    assert.equal(result.results.find(r=>r.requirement_id==='staff').current.decision,'does_not_meet');
    assert.equal(result.results.find(r=>r.requirement_id==='staff').previous.decision,'meets');
    assert.equal(result.results.find(r=>r.requirement_id==='date').affected,false);
  } finally {
    await Promise.all([fakeZ.close(),fakeM.close()]);
  }
});

test('missing credentials fail closed without a false success', async () => {
  const z=new Zetaris({ZETARIS_REST_URL:'http://localhost:1/api/v1.0',ZETARIS_API_KEY:''});
  await assert.rejects(()=>z.query('SELECT 1'),e=>e instanceof ServiceError&&e.state==='unauthorized');
  const m=new Meterless({METERLESS_BASE_URL:'http://localhost:1/v1',METERLESS_RUNTIME_TOKEN:''});
  await assert.rejects(()=>m.probe(),e=>e instanceof ServiceError&&e.state==='unauthorized');
});
