import { spawnSync } from 'node:child_process'
import { runPnpmSync } from './run-pnpm.mjs'

function run(label, command, args) {
  process.stdout.write(`\n==> ${label}\n`)
  const result = spawnSync(command, args, {
    env: process.env,
    stdio: 'inherit',
  })

  if (result.error) {
    throw result.error
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1)
  }
}

function runPnpm(label, args) {
  process.stdout.write(`\n==> ${label}\n`)
  const result = runPnpmSync(args, { stdio: 'inherit' })

  if (result.error) {
    throw result.error
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1)
  }
}

run('Pinned toolchain', process.execPath, ['scripts/check-toolchain.mjs'])
run('Agent workspace', process.execPath, [
  'scripts/validate-agent-workspace.mjs',
])
run('Master specification sync', process.execPath, [
  'scripts/sync-master-spec.mjs',
  '--check',
])
run('Secret patterns', process.execPath, ['scripts/check-secrets.mjs'])
runPnpm('Formatting', ['format:check'])
runPnpm('Lint and architecture boundaries', ['lint'])
runPnpm('TypeScript', ['typecheck'])
runPnpm('Unit, component, integration and property tests', ['test:coverage'])
runPnpm('Production build', ['build'])
runPnpm('Browser smoke tests', ['test:e2e:only'])
