import { readFileSync } from 'node:fs'
import { matchesGlob } from 'node:path'
import { parseEnv } from 'node:util'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { z } from 'zod'

import { parseServerEnvironment } from '@/config/env-schema'
import { productionConfigurationIssues } from '@/config/production'
import { readCompetitionConfiguration } from '@/server/competition/config'
import { createPrivilegedSupabaseClient } from '@/server/persistence/supabase/privileged-client'
import {
  canStartAttempt,
  canSubmitAttempt,
} from '@/server/competition/attempts'
import { competitionFixture } from '../helpers/competition'

const template = parseEnv(
  readFileSync('deployment/vercel-supabase-production.env.example', 'utf8'),
)
const configured = {
  ...template,
  SUPABASE_INTERNAL_URL: 'https://deployment-test.supabase.co',
  SUPABASE_SECRET_KEY: 'sb_secret_unit-fixture',
  PARTICIPANT_IDENTITY_SECRET: '0123456789abcdef'.repeat(4),
  EGRESADO_ORGANIZER_PASSWORD_HASH: `scrypt:131072:8:1:${'a'.repeat(32)}:${'b'.repeat(64)}`,
}
afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})
function environment() {
  for (const key of [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
    'EGRESADO_SCHOOL_DIVISIONS',
  ])
    vi.stubEnv(key, undefined)
  for (const [key, value] of Object.entries(configured)) vi.stubEnv(key, value)
}

describe('contrato de despliegue Vercel / Supabase', () => {
  it('parsea la configuración y conserva una región sin overrides del framework', () => {
    const config = z
      .strictObject({
        $schema: z.literal('https://openapi.vercel.sh/vercel.json'),
        regions: z.tuple([z.literal('gru1')]),
        git: z.strictObject({
          deploymentEnabled: z.record(z.string(), z.boolean()),
        }),
      })
      .parse(JSON.parse(readFileSync('vercel.json', 'utf8')))
    // Vercel: cualquier coincidencia true gana; sin coincidencia permite.
    for (const branch of [
      'main',
      'develop',
      'preview',
      'feature/fix',
      'fix/nested/branch',
      'release/1.0',
    ]) {
      const matching = Object.entries(config.git.deploymentEnabled).filter(
        ([pattern]) => matchesGlob(branch, pattern),
      )
      expect(
        matching.length === 0 || matching.some(([, enabled]) => enabled),
      ).toBe(branch === 'main')
    }
  })
  it('la plantilla publica configuración aprobada y sólo placeholders para secretos', () => {
    expect(template['SUPABASE_SECRET_KEY']).toBe('<sb_secret_...>')
    expect(template['PARTICIPANT_IDENTITY_SECRET']).toBe(
      '<GENERATE_AND_STORE_SECURELY>',
    )
    expect(template['EGRESADO_ORGANIZER_PASSWORD_HASH']).toBe(
      '<GENERATE_WITH_REPOSITORY_SCRIPT>',
    )
    for (const omitted of [
      'DATABASE_URL',
      'POSTGRES_URL',
      'SUPABASE_DB_PASSWORD',
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
      'EGRESADO_ORGANIZER_PASSWORD',
      'EGRESADO_SCHOOL_DIVISIONS',
    ])
      expect(template).not.toHaveProperty(omitted)
    expect(template['ENABLE_EXPERIMENTAL_COREPACK']).toBe('1')
  })
  it.each(['https://egresado.vercel.app', 'https://egresado-fdl26.vercel.app'])(
    'acepta el perfil de la feria sin Supabase público: %s',
    (origin) => {
      environment()
      const env = parseServerEnvironment({
        ...configured,
        NEXT_PUBLIC_APP_URL: origin,
      })
      expect(productionConfigurationIssues(env)).toEqual([])
      const config = readCompetitionConfiguration()
      expect(config?.slug).toBe('egresado-fdl-2026')
      expect(config?.privacy).toEqual({
        name: 'Colegio Integral Piacentini',
        contact: 'Profesora de Matemática (maitezacgorac97@gmail.com)',
        address:
          'Gobernador Florencio Tenev 250, Ruta Nacional 16, Colectora Norte Km 12, H3500 Resistencia, Chaco, Argentina',
        noticeVersion: '1',
        retentionDays: 30,
      })
      expect(config?.schoolYears).toEqual([
        '7.º',
        '1.º',
        '2.º',
        '3.º',
        '4.º',
        '5.º',
      ])
      expect(config?.schoolDivisions).toEqual([])
      expect(config?.organizer.username).toBe('organizador')
    },
  )
  it('el cliente privilegiado usa HTTPS Data API sin variables públicas ni conexión Postgres', async () => {
    environment()
    const fetch = vi
      .fn()
      .mockResolvedValue(
        new Response('[]', { headers: { 'Content-Type': 'application/json' } }),
      )
    vi.stubGlobal('fetch', fetch)
    const client = createPrivilegedSupabaseClient()
    const result = await client.from('competitions').select('id').limit(1)
    expect(result.error).toBeNull()
    const [url, options] = fetch.mock.calls[0] as unknown as [
      string,
      RequestInit,
    ]
    expect(String(url)).toMatch(
      /^https:\/\/deployment-test\.supabase\.co\/rest\/v1\/competitions\?/u,
    )
    expect(new Headers(options.headers).get('apikey')).toBe(
      configured.SUPABASE_SECRET_KEY,
    )
  })
})

describe('ventana exacta Feria del Libro, reloj del servidor', () => {
  const competition = {
    ...competitionFixture(),
    id: 'fair-date-fixture',
    createdAt: '2026-09-22T00:00:00Z',
    updatedAt: '2026-09-22T00:00:00Z',
    status: 'OPEN' as const,
    opensAt: '2026-09-23T08:00:00-03:00',
    closesAt: '2026-09-25T11:00:00-03:00',
    submissionGraceSeconds: 300,
  }
  it('OPEN a las 07:50 no adelanta la apertura; el cierre impide emitir', () => {
    expect(
      canStartAttempt(competition, new Date('2026-09-23T10:50:00Z'))?.code,
    ).toBe('COMPETITION_NOT_OPEN')
    expect(
      canStartAttempt(competition, new Date('2026-09-23T11:00:00Z')),
    ).toBeUndefined()
    expect(
      canStartAttempt(competition, new Date('2026-09-25T14:00:00Z'))?.code,
    ).toBe('COMPETITION_CLOSED')
    expect(
      canStartAttempt(
        { ...competition, status: 'CLOSED' },
        new Date('2026-09-24T14:00:00Z'),
      )?.code,
    ).toBe('COMPETITION_CLOSED')
  })
  it('permite enviar hasta las 11:05 inclusive y rechaza un milisegundo después', () => {
    expect(
      canSubmitAttempt(competition, new Date('2026-09-25T14:05:00Z')),
    ).toBeUndefined()
    expect(
      canSubmitAttempt(competition, new Date('2026-09-25T14:05:00.001Z'))?.code,
    ).toBe('SUBMISSION_TOO_LATE')
  })
})
