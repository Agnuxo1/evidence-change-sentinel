import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
const runner = fileURLToPath(new URL('../vendor/hmem/conformance/runner.ts', import.meta.url));
const result = spawnSync(process.execPath, ['--import', 'tsx', runner], {
  cwd: root, stdio: 'inherit', env: { ...process.env, HMEM_IMPL: fileURLToPath(new URL('../vendor/hmem/src/index.ts', import.meta.url)) }
});
process.exit(result.status ?? 2);
