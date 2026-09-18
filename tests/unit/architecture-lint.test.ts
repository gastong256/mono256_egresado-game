import { ESLint } from 'eslint'
import { beforeAll, describe, expect, it } from 'vitest'

const eslint = new ESLint({ cwd: process.cwd() })

async function ruleIds(source: string, filePath: string) {
  const [result] = await eslint.lintText(source, { filePath })
  return result?.messages.map((message) => message.ruleId) ?? []
}

// RS-RA-TEST-001: la resolución inicial costó 5575 ms bajo cobertura.
// El presupuesto de preparación no cambia el timeout de ningún caso.
beforeAll(async () => {
  await eslint.lintText('export const value = 1', {
    filePath: 'src/game/core/lint-warmup.ts',
  })
}, 15_000)

describe('architecture lint policy', () => {
  it.each([
    ['export const value = Math.random()', 'src/game/core/direct-rng.ts'],
    [
      'const random = Math.random; export const value = random()',
      'src/game/core/aliased-rng.ts',
    ],
    [
      'const { random } = Math; export const value = random()',
      'src/game/core/destructured-rng.ts',
    ],
    ['export const value = Date()', 'src/game/core/direct-clock.ts'],
    [
      'const clock = Date; export const value = clock()',
      'src/game/core/aliased-clock.ts',
    ],
    [
      'export const value = globalThis.Math.random()',
      'src/game/core/global-rng.ts',
    ],
    [
      'export const value = new globalThis.Date()',
      'src/game/core/global-clock.ts',
    ],
    ['export const value = Math.random()', 'src/game/core/rng-bypass.tsx'],
    ['export const value = Math.random()', 'src/game/core/rng-bypass.mts'],
  ])('rejects implicit nondeterminism in %s', async (source, filePath) => {
    await expect(ruleIds(source, filePath)).resolves.toContain(
      source.includes('Math') && !source.includes('globalThis')
        ? 'no-restricted-syntax'
        : 'no-restricted-globals',
    )
  })

  it('allows deterministic numeric operations in the game core', async () => {
    await expect(
      ruleIds(
        'export const rounded = Math.round(1.5)',
        'src/game/core/numeric.ts',
      ),
    ).resolves.toEqual([])
  })

  it('rejects dynamic framework imports in the game core', async () => {
    await expect(
      ruleIds(
        "export async function loadFramework() { return import('react') }",
        'src/game/core/dynamic-framework.ts',
      ),
    ).resolves.toContain('no-restricted-syntax')
  })

  it('rejects non-literal dynamic imports in the game core', async () => {
    await expect(
      ruleIds(
        'export async function load(value: string) { return import(value) }',
        'src/game/core/dynamic-variable.ts',
      ),
    ).resolves.toContain('no-restricted-syntax')
  })

  it('rejects the engine reaching into concrete product content', async () => {
    // El motor entiende contratos, no ids de contenido. Si `src/game` pudiera
    // importar `src/content`, agregar un año dejaría de ser contenido y
    // volvería a ser una migración de motor.
    await expect(
      ruleIds(
        "export { grade7Challenges } from '@/content/grade-7'",
        'src/game/challenges/leak.ts',
      ),
    ).resolves.toContain('no-restricted-imports')
  })

  it('rejects JSX in the portable game core', async () => {
    await expect(
      ruleIds(
        'export const view = <div />',
        'src/game/core/framework-bypass.tsx',
      ),
    ).resolves.toContain('no-restricted-syntax')
  })

  it('rejects an inverted internal layer dependency', async () => {
    await expect(
      ruleIds(
        "import { NicknameForm } from '@/components/game/nickname-form'; export { NicknameForm }",
        'src/lib/inverted.ts',
      ),
    ).resolves.toContain('boundaries/dependencies')
  })

  it('rejects source files outside an explicit architecture layer', async () => {
    await expect(
      ruleIds('export const value = 1', 'src/rogue/unknown-layer.ts'),
    ).resolves.toContain('boundaries/no-unknown-files')
  })

  it('rejects unknown architecture layers using .mts', async () => {
    await expect(
      ruleIds('export const value = 1', 'src/rogue/unknown-layer.mts'),
    ).resolves.toContain('boundaries/no-unknown-files')
  })

  it('rejects UI access to Supabase through relative paths', async () => {
    await expect(
      ruleIds(
        "import { createPublicSupabaseClient } from '../lib/supabase/public-client'; export { createPublicSupabaseClient }",
        'src/components/persistence-access.ts',
      ),
    ).resolves.toContain('no-restricted-imports')
  })

  it('rejects dynamic UI access to Supabase adapters', async () => {
    await expect(
      ruleIds(
        "export const loadPersistence = () => import('../lib/supabase/public-client')",
        'src/components/dynamic-persistence-access.ts',
      ),
    ).resolves.toContain('no-restricted-syntax')
  })

  it('rejects dynamic UI access to aliased Supabase adapters', async () => {
    await expect(
      ruleIds(
        "export const loadPersistence = () => import('@/lib/supabase/public-client')",
        'src/components/dynamic-aliased-persistence.ts',
      ),
    ).resolves.toContain('no-restricted-syntax')
  })

  it('protects component boundaries using .mts', async () => {
    await expect(
      ruleIds(
        "import { createPrivilegedSupabaseClient } from '@/server/persistence/supabase/privileged-client'; export { createPrivilegedSupabaseClient }",
        'src/components/server-bypass.mts',
      ),
    ).resolves.toContain('boundaries/dependencies')
  })

  it('rejects dynamic route access to persistence internals', async () => {
    await expect(
      ruleIds(
        "export const loadPersistence = () => import('@/server/persistence/supabase/server-client')",
        'src/app/dynamic-persistence-access.ts',
      ),
    ).resolves.toContain('no-restricted-syntax')
  })

  it.each(['src/app/error.tsx', 'src/app/global-error.tsx'])(
    'protects mandatory client error boundary %s',
    async (filePath) => {
      await expect(
        ruleIds(
          "'use client'; export const loadPersistence = () => import('@/server/persistence/supabase/server-client')",
          filePath,
        ),
      ).resolves.toContain('no-restricted-syntax')
    },
  )

  it('keeps route composition server-first', async () => {
    await expect(
      ruleIds(
        "'use client'; export default function Page() {}",
        'src/app/client-page.tsx',
      ),
    ).resolves.toContain('no-restricted-syntax')
  })

  it('keeps .mts route composition server-first', async () => {
    await expect(
      ruleIds(
        "'use client'; export default function Page() {}",
        'src/app/client-page.mts',
      ),
    ).resolves.toContain('no-restricted-syntax')
  })
})
