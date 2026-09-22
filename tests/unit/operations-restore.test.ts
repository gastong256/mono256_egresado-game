import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
import { afterEach, describe, expect, it } from 'vitest'

const directories: string[] = []
afterEach(() => {
  for (const directory of directories.splice(0))
    rmSync(directory, { recursive: true, force: true })
})

function restore(scenario: string, extra: string[] = []) {
  const directory = mkdtempSync(join(tmpdir(), 'egresado-restore-test-'))
  directories.push(directory)
  const calls = join(directory, 'calls.jsonl')
  const data = join(directory, 'data.sql')
  writeFileSync(data, 'select 1;')
  // A fake executable exercises the operator-facing wrapper, its exit code,
  // argument propagation and output sanitation without mutating a database.
  writeFileSync(
    join(directory, 'psql'),
    `#!/usr/bin/env node
const fs = require('node:fs');
const args = process.argv.slice(2);
fs.appendFileSync(process.env.RC_RESTORE_CALLS, JSON.stringify(args) + '\\n');
const scenario = process.env.RC_RESTORE_SCENARIO;
if (args.includes('--file')) {
  if (scenario === 'apply-failure') { console.error('COPY private row: Ana Prueba 40123456'); process.exit(1); }
} else if (args.some(x => x.includes('pg_tables'))) console.log('competitions');
else if (args.some(x => x.includes('select exists'))) {
  if (scenario === 'probe-failure') { console.error('database password should never appear'); process.exit(1); }
  console.log(scenario === 'occupied' ? 't' : 'f');
} else console.log('1/2/3');
`,
    { mode: 0o700 },
  )
  const result = spawnSync(
    process.execPath,
    [
      resolve('scripts/operations/restore.mjs'),
      '--local',
      `--data=${data}`,
      ...extra,
    ],
    {
      env: {
        ...process.env,
        PATH: `${directory}:${process.env['PATH'] ?? ''}`,
        RC_RESTORE_CALLS: calls,
        RC_RESTORE_SCENARIO: scenario,
      },
      encoding: 'utf8',
    },
  )
  const invocations = readFileSync(calls, 'utf8')
    .trim()
    .split('\n')
    .map((line) => JSON.parse(line) as string[])
  return { result, invocations }
}

describe('restore fails closed and restores atomically', () => {
  it('refuses an occupied target even when only a competition exists', () => {
    const { result, invocations } = restore('occupied')
    expect(result.status).toBe(3)
    expect(invocations.some((args) => args.includes('--file'))).toBe(false)
  })
  it('refuses to apply when the occupancy probe fails', () => {
    const { result, invocations } = restore('probe-failure')
    expect(result.status).toBe(1)
    expect(invocations.some((args) => args.includes('--file'))).toBe(false)
    expect(result.stderr).not.toContain('password')
  })
  it('applies in one transaction, stops on errors and ignores psqlrc', () => {
    const { result, invocations } = restore('empty')
    expect(result.status).toBe(0)
    const apply = invocations.find((args) => args.includes('--file'))!
    expect(apply).toContain('--single-transaction')
    expect(apply).toContain('ON_ERROR_STOP=1')
    expect(apply).toContain('--no-psqlrc')
    expect(result.stdout).toContain('1/2/3')
  })
  it('does not print private COPY errors or report success', () => {
    const { result } = restore('apply-failure')
    expect(result.status).toBe(1)
    expect(result.stderr).not.toContain('Ana Prueba')
    expect(result.stderr).not.toContain('40123456')
    expect(result.stdout).not.toContain('Listo')
  })
})
