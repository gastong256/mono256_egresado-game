import { chmodSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { loadCompetitionEnvironment } from '../../scripts/competition/environment'

let directory: string
const keys = [
  'OPS_TEST_VALUE',
  'OPS_TEST_LOCAL',
  'OPS_TEST_BASE',
  'OPS_TEST_LITERAL',
]
beforeEach(() => {
  directory = mkdtempSync(join(tmpdir(), 'egresado-env-'))
  vi.spyOn(process, 'cwd').mockReturnValue(directory)
  for (const key of keys) vi.stubEnv(key, undefined)
})
afterEach(() => {
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
  rmSync(directory, { recursive: true, force: true })
})
function file(name: string, content: string) {
  const path = join(directory, name)
  writeFileSync(path, content, { mode: 0o600 })
  return path
}

describe('selección explícita del entorno del operador', () => {
  it('proceso > archivo explícito > .env.local > .env, incluidas cadenas vacías', () => {
    file('.env', 'OPS_TEST_VALUE=base\nOPS_TEST_LOCAL=base\nOPS_TEST_BASE=base')
    file('.env.local', 'OPS_TEST_VALUE=local\nOPS_TEST_LOCAL=local')
    file(
      'producción.env',
      'OPS_TEST_VALUE=explicit\nOPS_TEST_LITERAL="7.º,1.º"',
    )
    loadCompetitionEnvironment([
      '--',
      '--name=Feria',
      '--env-file=producción.env',
    ])
    expect(process.env['OPS_TEST_VALUE']).toBe('explicit')
    expect(process.env['OPS_TEST_LOCAL']).toBe('local')
    expect(process.env['OPS_TEST_BASE']).toBe('base')
    expect(process.env['OPS_TEST_LITERAL']).toBe('7.º,1.º')
    vi.stubEnv('OPS_TEST_VALUE', 'process')
    vi.stubEnv('OPS_TEST_LITERAL', '')
    loadCompetitionEnvironment(['--env-file', 'producción.env'])
    expect(process.env['OPS_TEST_VALUE']).toBe('process')
    expect(process.env['OPS_TEST_LITERAL']).toBe('')
  })
  it('mantiene el uso local sin archivo explícito', () => {
    file('.env', 'OPS_TEST_VALUE=base')
    file('.env.local', 'OPS_TEST_VALUE=local')
    loadCompetitionEnvironment([])
    expect(process.env['OPS_TEST_VALUE']).toBe('local')
  })
  it('acepta Unicode, comillas, comentarios y $ literalmente sin escribir salida', () => {
    const stdout = vi.spyOn(process.stdout, 'write').mockReturnValue(true)
    const stderr = vi.spyOn(process.stderr, 'write').mockReturnValue(true)
    file(
      'private.env',
      'OPS_TEST_VALUE="Profesora de Matemática" # contacto\nOPS_TEST_LITERAL=\'$HOME $(touch NEVER) `id` # literal\'',
    )
    loadCompetitionEnvironment(['--env-file=private.env'])
    expect(process.env['OPS_TEST_VALUE']).toBe('Profesora de Matemática')
    expect(process.env['OPS_TEST_LITERAL']).toBe(
      '$HOME $(touch NEVER) `id` # literal',
    )
    expect(stdout).not.toHaveBeenCalled()
    expect(stderr).not.toHaveBeenCalled()
  })
  it('falla sin fallback ni valores/rutas en el error si falta el archivo', () => {
    file('.env.local', 'OPS_TEST_VALUE=local')
    expect(() =>
      loadCompetitionEnvironment(['--env-file=do-not-disclose-this']),
    ).toThrow('--env-file')
    try {
      loadCompetitionEnvironment(['--env-file=do-not-disclose-this'])
    } catch (error) {
      expect(String(error)).not.toContain('do-not-disclose-this')
    }
    expect(process.env['OPS_TEST_VALUE']).toBeUndefined()
  })
  it.each([
    ['--env-file'],
    ['--env-file='],
    ['--env-file', '--apply'],
    ['--env-file=a', '--env-file=b'],
  ])('rechaza argumentos ambiguos: %j', (...args) => {
    expect(() => loadCompetitionEnvironment(args)).toThrow('único --env-file')
  })
  it.skipIf(process.platform === 'win32')(
    'rechaza permisos abiertos antes de cargar secretos',
    () => {
      const path = file('production.env', 'OPS_TEST_VALUE=do-not-disclose-this')
      chmodSync(path, 0o644)
      expect(() => loadCompetitionEnvironment(['--env-file', path])).toThrow(
        'chmod 600',
      )
      expect(process.env['OPS_TEST_VALUE']).toBeUndefined()
      chmodSync(path, 0o600)
      loadCompetitionEnvironment(['--env-file', path])
      expect(process.env['OPS_TEST_VALUE']).toBe('do-not-disclose-this')
    },
  )
})
