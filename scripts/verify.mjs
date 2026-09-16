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
// El sistema de diseño se verifica antes que los tests: si un token rompió una
// combinación de contraste, conviene saberlo por su nombre y no por un escaneo
// de accesibilidad al final del pipeline.
runPnpm('Design system tokens and contrast', ['design:check'])
runPnpm('Unit, component, integration and property tests', ['test:coverage'])
// Content and simulation gates run after the tests: they exercise the same
// engine, so a failure here points at content or scale rather than at a unit.
runPnpm('Content validation', ['game:validate-content', '--', '--seeds=60'])
// The committed variant catalog must be exactly what today's code produces, and
// every entry in it must still validate. The deep statistical sweep is a
// separate, much slower command: `pnpm game:variants audit`.
runPnpm('Approved variant catalog', ['game:variants', 'check'])
runPnpm('Grade-1 content validation', [
  'game:validate-content',
  '--content=grade-1',
  '--seeds=60',
])
runPnpm('Grade-1 approved variant catalog', [
  'game:variants',
  'check',
  '--content=grade-1',
])
runPnpm('Grade-2 content validation', [
  'game:validate-content',
  '--content=grade-2',
  '--seeds=60',
])
runPnpm('Grade-2 approved variant catalog', [
  'game:variants',
  'check',
  '--content=grade-2',
])
runPnpm('Grade-3 content validation', [
  'game:validate-content',
  '--content=grade-3',
  '--seeds=60',
])
runPnpm('Grade-3 approved variant catalog', [
  'game:variants',
  'check',
  '--content=grade-3',
])
runPnpm('Grade-4 content validation', [
  'game:validate-content',
  '--content=grade-4',
  '--seeds=60',
])
runPnpm('Grade-4 approved variant catalog', [
  'game:variants',
  'check',
  '--content=grade-4',
])
runPnpm('Grade-5 content validation', [
  'game:validate-content',
  '--content=grade-5',
  '--seeds=60',
])
runPnpm('Grade-5 approved variant catalog', [
  'game:variants',
  'check',
  '--content=grade-5',
])
runPnpm('Grade-5 deterministic simulation', [
  'game:simulate',
  '--content=grade-5',
  '--runs=120',
])
runPnpm('Grade-4 deterministic simulation', [
  'game:simulate',
  '--content=grade-4',
  '--runs=200',
])
runPnpm('Grade-3 deterministic simulation', [
  'game:simulate',
  '--content=grade-3',
  '--runs=200',
])
runPnpm('Grade-2 deterministic simulation', [
  'game:simulate',
  '--content=grade-2',
  '--runs=200',
  '--verify=10',
])
runPnpm('Grade-1 deterministic simulation', [
  'game:simulate',
  '--content=grade-1',
  '--runs=200',
  '--verify=10',
])
runPnpm('Deterministic run simulation', [
  'game:simulate',
  '--',
  '--runs=200',
  '--verify=10',
])
runPnpm('Production build', ['build'])
runPnpm('Browser smoke tests', ['test:e2e:only'])
