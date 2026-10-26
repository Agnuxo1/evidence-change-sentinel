import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {randomUUID} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {writeDiagnostic} from '../scripts/evidence-output.mjs';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function scratch(t) {
  const parent = path.join(root,'.state','tests');
  const dir = path.join(parent,randomUUID());
  fs.mkdirSync(dir,{recursive:true});
  t.after(()=>{assert.equal(path.dirname(path.resolve(dir)),parent);fs.rmSync(dir,{recursive:true});});
  return dir;
}

test('a new failed diagnostic cannot replace a previous successful receipt', t=>{
  const dir=scratch(t), target=path.join(dir,'live-acceptance.json');
  const prior=JSON.stringify({integration_verified:true,checked_at:'2026-10-23T02:50:17Z'});
  fs.writeFileSync(target,prior);
  assert.throws(()=>writeDiagnostic('live-acceptance.json',{integration_verified:false},
    {SENTINEL_EVIDENCE_DIR:dir}),e=>e.code==='EEXIST');
  assert.equal(fs.readFileSync(target,'utf8'),prior);
});

test('a preflight without credentials records failure separately and leaves archived evidence intact',t=>{
  const dir=scratch(t), archived=path.join(root,'evidence','preflight.json');
  const before=fs.readFileSync(archived);
  const env={...process.env,SENTINEL_EVIDENCE_DIR:dir};
  delete env.ZETARIS_API_KEY;delete env.METERLESS_RUNTIME_TOKEN;
  const run=spawnSync(process.execPath,[path.join(root,'scripts','preflight.mjs')],
    {env,cwd:root,encoding:'utf8',timeout:10000});
  assert.equal(run.status,1);
  const report=JSON.parse(fs.readFileSync(path.join(dir,'preflight.json'),'utf8'));
  assert.equal(report.scope,'connectivity_only');
  assert.equal(report.integration_verified,false);
  assert.ok(Object.values(report.checks).every(c=>c.state==='unauthorized'));
  assert.deepEqual(fs.readFileSync(archived),before);
  assert.equal(report.submitted_to_hackos,undefined);
});
