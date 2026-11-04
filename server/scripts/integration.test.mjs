// Compatibility entry point for the retired MongoDB-memory-server harness.
// The backend now uses Supabase PostgreSQL; run its supported contract suite.
import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const result = spawnSync(process.execPath, ['--test', 'server/tests/account-provisioning.test.js'], {
  cwd: repositoryRoot,
  stdio: 'inherit',
})

if (result.error) {
  console.error('Unable to start the backend test runner.')
  process.exitCode = 1
} else {
  process.exitCode = result.status ?? 1
}
