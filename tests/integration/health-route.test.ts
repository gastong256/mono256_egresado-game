import { afterEach, describe, expect, it, vi } from 'vitest'

import * as health from '@/server/competition/health'

import { GET } from '@/app/api/health/route'
import { currentRelease, releaseFingerprint } from '@/release'

/**
 * El health endpoint es una superficie pública sin autenticación.
 *
 * Lo que se prueba acá no es que responda: es **qué no dice**. Un health que
 * filtrara la URL de la base, el secreto de identidad o el nombre de un
 * participante lo haría en el peor momento posible, porque es el endpoint que
 * más se consulta durante un incidente.
 */

async function bodyOf(response: Response): Promise<Record<string, unknown>> {
  return (await response.json()) as Record<string, unknown>
}

const FORBIDDEN = [
  'SUPABASE_SECRET_KEY',
  'PARTICIPANT_IDENTITY_SECRET',
  'sb_secret_',
  'postgres://',
  'postgresql://',
  'scrypt:',
  'password',
  'dni',
  'identityHmac',
]

afterEach(() => vi.restoreAllMocks())

describe('GET /api/health', () => {
  it.each(['degraded', 'error'] as const)(
    'readiness returns 503 for %s while liveness stays available',
    async (status) => {
      const report = await health.healthReport()
      vi.spyOn(health, 'healthReport').mockResolvedValue({ ...report, status })
      expect(
        (await GET(new Request('http://localhost/api/health?ready=1'))).status,
      ).toBe(503)
      expect(
        (await GET(new Request('http://localhost/api/health'))).status,
      ).toBe(200)
    },
  )

  it('publishes the release identity and nothing configurable', async () => {
    const response = await GET(new Request('http://localhost/api/health'))

    expect(response.status).toBe(200)
    expect(response.headers.get('cache-control')).toBe('no-store')

    const body = await bodyOf(response)
    expect(body['service']).toBe('egresado-web')
    expect(body['status']).toBe('ok')
    expect(body['release']).toEqual({
      releaseId: currentRelease().releaseId,
      releaseVersion: currentRelease().releaseVersion,
      releaseChannel: currentRelease().releaseChannel,
      releaseFingerprint: releaseFingerprint(currentRelease()),
    })
  })

  it('keeps liveness cheap: it never reports a database check', async () => {
    const body = await bodyOf(
      await GET(new Request('http://localhost/api/health')),
    )
    const checks = body['checks'] as readonly { name: string }[]
    expect(checks.map((check) => check.name)).toEqual(['release-manifest'])
  })

  it('adds configuration, database and edition checks under ?ready', async () => {
    const body = await bodyOf(
      await GET(new Request('http://localhost/api/health?ready=1')),
    )
    const checks = body['checks'] as readonly { name: string }[]
    expect(checks.map((check) => check.name)).toEqual([
      'release-manifest',
      'competition-config',
      'database',
      'competition',
    ])
  })

  it('never serialises a secret, a connection string or a personal field', async () => {
    for (const url of [
      'http://localhost/api/health',
      'http://localhost/api/health?ready=1',
    ]) {
      const serialized = await (await GET(new Request(url))).text()
      for (const forbidden of FORBIDDEN) {
        expect(serialized.toLowerCase()).not.toContain(forbidden.toLowerCase())
      }
    }
  })
})
