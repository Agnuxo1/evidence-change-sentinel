import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { Meterless, normalizeMeterlessURL, Zetaris } from '../app/adapters.mjs';

test('Meterless URL normalization handles documented suffixes', () => {
  for (const suffix of ['', '/', '/v1', '/v1/', '/v1/models', '/v1/chat/completions', '/healthz']) assert.equal(normalizeMeterlessURL(`localhost:8088${suffix}`), 'http://localhost:8088/v1');
  assert.throws(()=>normalizeMeterlessURL('https://user:secret@host/v1'));
});
test('placeholder runtime token is refused', async () => { await assert.rejects(new Meterless({METERLESS_RUNTIME_TOKEN:'rt-local'}).probe(),e=>e.state==='unauthorized'); });
test('real HTTP contract: headers, auth states, model discovery and text request', async () => {
  const seen = [];
  const server = http.createServer(async (req,res) => {
    let data = ''; for await(const chunk of req) data += chunk;
    seen.push({path:req.url, headers:req.headers, body:data && JSON.parse(data)});
    res.setHeader('Content-Type','application/json');
    if(req.headers.authorization !== 'Bearer test-only-token') {res.writeHead(401);return res.end('{}');}
    if(req.url==='/v1/models')return res.end(JSON.stringify({data:[{id:'meterless/auto'},{id:'meterless/future'}]}));
    return res.end(JSON.stringify({choices:[{message:{content:JSON.stringify({kind:'unknown',value:null,quote:'text'})}}]}));
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    await assert.rejects(new Meterless({METERLESS_BASE_URL:base,METERLESS_RUNTIME_TOKEN:'wrong'}).probe(),e=>e.state==='unauthorized');
    const adapter = new Meterless({METERLESS_BASE_URL:base,METERLESS_RUNTIME_TOKEN:'test-only-token'});
    assert.equal((await adapter.probe()).models.includes('meterless/future'),true);
    assert.equal((await adapter.propose({passage:'text',kind:'unknown'})).kind,'unknown');
    await adapter.propose({passage:'Eligible regions: NL, BE.',kind:'regions'});
    const chat = seen.at(-1); assert.equal(chat.headers['meterless-app'],'evidence-change-sentinel'); assert.equal(chat.headers['meterless-scope'],'user');
    assert.equal(chat.body.model,'meterless/auto');
    assert.equal(chat.body.max_tokens,512);
    assert.equal(chat.body.response_format.type,'json_schema');
    const schema=chat.body.response_format.json_schema.schema;
    assert.equal(schema.additionalProperties,false);
    assert.deepEqual(schema.required,['kind','value','quote']);
    assert.deepEqual(schema.properties.kind.enum,['regions','unknown']);
    assert.equal(schema.properties.value.anyOf[0].items.pattern,'^[A-Z]{2}$');
    assert.equal(schema.properties.value.anyOf[1].type,'null');
    assert.ok(chat.body.messages.at(-1).content.includes('Return the extracted rule, not the input object.'));
  } finally { await new Promise(resolve=>server.close(resolve)); }
});
test('SQL identifier injection is rejected before making a request', async () => {
  await assert.rejects(new Zetaris({ZETARIS_VIEW:'x; DROP TABLE y'}).passages(), /SQL identifier/);
});

test('Zetaris supports its real container.view syntax while rejecting SQL expressions', async () => {
  const z = new Zetaris({ZETARIS_VIEW:'sentinel_review.sentinel_passages'});
  let sql;
  z.query = async value => { sql=value; return {data:[['call','before','staff','A synthetic clause.','https://example.org/call']]}; };
  assert.equal((await z.passages()).length,1);
  assert.equal(sql,'SELECT source_id, version, passage_id, passage_text, source_url FROM sentinel_review.sentinel_passages');
  for(const name of ['a.b.c','a..b','a.b--','a.b WHERE 1=1','a."b"']) {
    await assert.rejects(new Zetaris({ZETARIS_VIEW:name}).passages(), /SQL identifier/);
  }
});
