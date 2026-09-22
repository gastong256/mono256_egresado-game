import { spawnSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { createRequire } from 'node:module'
import { afterEach, describe, expect, it } from 'vitest'

const require = createRequire(import.meta.url)
const viteNode = join(
  dirname(require.resolve('vite-node/package.json')),
  'dist/cli.mjs',
)
const directories: string[] = []
afterEach(() => {
  for (const directory of directories.splice(0))
    rmSync(directory, { recursive: true, force: true })
})

describe('las CLI detienen un destino explícito ausente antes de operar', () => {
  it.each([
    'scripts/release/preflight.ts',
    'scripts/competition/bootstrap.ts',
    'scripts/competition/purge.ts',
    'scripts/operations/export-results.ts',
  ])('%s acepta la opción y falla sin fallback a la base local', (script) => {
    const directory = mkdtempSync(join(tmpdir(), 'egresado-cli-'))
    directories.push(directory)
    const result = spawnSync(
      process.execPath,
      [
        viteNode,
        '--config',
        resolve('vitest.config.ts'),
        script,
        '--',
        `--env-file=${join(directory, 'not-present')}`,
      ],
      { encoding: 'utf8', timeout: 20_000 },
    )
    expect(result.error).toBeUndefined()
    expect(result.status).toBe(1)
    expect(result.stderr).toContain('No se pudo leer --env-file')
    expect(result.stdout).not.toContain('Listo')
    expect(result.stderr).not.toContain('not-present')
  })
})

describe('precedencia real a través de vite-node', () => {
  it.each([false, true])(
    'archivo explícito gana al local; proceso conserva prioridad (%s)',
    (override) => {
      const directory = mkdtempSync(join(tmpdir(), 'egresado-cli-precedence-'))
      directories.push(directory)
      const syntheticIdentity = '0123456789abcdef'.repeat(4)
      const syntheticHash = `scrypt:131072:8:1:${'a'.repeat(32)}:${'b'.repeat(64)}`
      const contents = readFileSync(
        'deployment/vercel-supabase-production.env.example',
        'utf8',
      )
        .replace('<PROJECT_REF>', 'preflight-fixture')
        .replace('<sb_secret_...>', 'sb_secret_unit-fixture')
        .replace('<GENERATE_AND_STORE_SECURELY>', syntheticIdentity)
        .replace('<GENERATE_WITH_REPOSITORY_SCRIPT>', syntheticHash)
      writeFileSync(join(directory, 'production.env'), contents, {
        mode: 0o600,
      })
      writeFileSync(
        join(directory, '.env.local'),
        'EGRESADO_ENVIRONMENT=local\nNEXT_PUBLIC_APP_URL=http://localhost:3000\n',
        { mode: 0o600 },
      )
      const env = { ...process.env }
      for (const key of Object.keys(env)) {
        if (/^(EGRESADO_|SUPABASE_|PARTICIPANT_|NEXT_PUBLIC_)/u.test(key))
          delete env[key]
      }
      if (override) env['NEXT_PUBLIC_APP_URL'] = 'http://localhost:3000'
      const result = spawnSync(
        process.execPath,
        [
          viteNode,
          '--config',
          resolve('vitest.config.ts'),
          resolve('scripts/release/preflight.ts'),
          '--',
          '--env-file=production.env',
        ],
        { cwd: directory, env, encoding: 'utf8', timeout: 20_000 },
      )
      expect(result.error).toBeUndefined()
      expect(result.status).toBe(override ? 1 : 0)
      expect(result.stdout).toContain('entorno  production')
      if (!override)
        expect(result.stdout).toContain(
          'La configuración satisface el contrato de producción.',
        )
      const output = result.stdout + result.stderr
      for (const secret of [
        syntheticIdentity,
        syntheticHash,
        'sb_secret_unit-fixture',
      ])
        expect(output).not.toContain(secret)
    },
  )
})
