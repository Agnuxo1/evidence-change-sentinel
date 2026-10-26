import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {randomUUID} from 'node:crypto';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// A new diagnostic must not erase a historical acceptance or delivery receipt.
export function writeDiagnostic(filename, report, env = process.env) {
  if (path.basename(filename) !== filename || !filename.endsWith('.json')) throw new Error('Use a plain JSON filename.');
  const dir = env.SENTINEL_EVIDENCE_DIR ? path.resolve(env.SENTINEL_EVIDENCE_DIR)
    : path.join(root, '.state', 'diagnostics', `${new Date().toISOString().replace(/[:.]/g, '-')}-${randomUUID()}`);
  fs.mkdirSync(dir, {recursive:true});
  const target = path.join(dir, filename);
  fs.writeFileSync(target, JSON.stringify(report, null, 2) + '\n', {flag:'wx'});
  return target;
}
