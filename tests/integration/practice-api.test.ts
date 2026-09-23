import { randomUUID } from 'node:crypto'
import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'
import { createFullCareerDependencies } from '@/content/full-career'
import { createRun, scoreRun, scoredEventsOf, type RunDescriptor } from '@/game'
import { createPracticeHandlers } from '@/server/practice/api'
import { issuePracticeRun, verifyPracticeRun } from '@/server/practice/service'
import {
  createPracticeRuntime,
  PRACTICE_RATE_LIMITS,
} from '@/server/practice/runtime'
import {
  consumeRateLimit,
  type RateLimitCounter,
} from '@/server/security/rate-limit'
import { MAX_ACTION_LOG_BYTES } from '@/server/game/submission-limits'
import { SupabaseCompetitionStore } from '@/server/persistence/competition/supabase-store'
import {
  identifyParticipant,
  resolveParticipantSession,
} from '@/server/competition/participants'
import { startAttempt, submitAttempt } from '@/server/competition/attempts'
import { loadPublicState } from '@/server/competition/ranking'
import {
  createTestContext,
  identityFixture,
  playCareer,
  type PlayedCareer,
} from '../helpers/competition'

const handlers = createPracticeHandlers(() => ({ allow: async () => true }))
let descriptor: RunDescriptor
let played: PlayedCareer
let perfect: PlayedCareer
beforeAll(() => {
  descriptor = issuePracticeRun()
  played = playCareer(descriptor, () => 'invalid')
  perfect = playCareer(descriptor)
}, 30_000)
beforeEach(() => {
  vi.spyOn(console, 'info').mockImplementation(() => {})
  vi.spyOn(console, 'error').mockImplementation(() => {})
})
afterEach(() => {
  vi.restoreAllMocks()
})

function request(
  body: unknown = {},
  suffix = '',
  headers: Record<string, string> = {},
) {
  return new Request(`https://egresado.test/api/practice/runs${suffix}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: JSON.stringify(body),
  })
}

describe('práctica: emisión y replay de la carrera real', () => {
  it('emite seeds independientes, práctica fija y sólo el contenido hosteable vigente', () => {
    const another = issuePracticeRun()
    expect(another.seed).not.toBe(descriptor.seed)
    expect(another.runId).not.toBe(descriptor.runId)
    expect(descriptor.seed).toMatch(/^practice-v1-[a-f0-9]{48}$/u)
    expect(descriptor.mode).toBe('practice')
    expect(descriptor.difficulty).toBe('fixed')
    const dependencies = createFullCareerDependencies()
    const created = createRun(descriptor, dependencies)
    expect(created.ok).toBe(true)
    if (!created.ok) throw new Error('invalid descriptor')
    expect(created.value.state.plan).toBeDefined()
    expect(played.final.progression.graduated).toBe(true)
    expect(played.final.progression.history.length).toBeGreaterThan(0)
    expect(descriptor.scoreVersion).toBe(dependencies.competitiveScore?.version)
  })
  it('no requiere PII, no emite cookie y entrega exclusivamente descriptor', async () => {
    const response = await handlers.issue(request())
    expect(response.status).toBe(200)
    expect(response.headers.get('set-cookie')).toBeNull()
    expect(response.headers.get('cache-control')).toBe('no-store')
    expect(Object.keys(await response.json())).toEqual(['descriptor'])
  })
  it.each([
    { seed: 'oficial' },
    { mode: 'fair' },
    { template: 'debug' },
    { dni: '1234' },
  ])('rechaza parámetros de emisión: %j', async (body) => {
    expect((await handlers.issue(request(body))).status).toBe(400)
  })
  it('rechaza overrides por query y origen cruzado', async () => {
    expect((await handlers.issue(request({}, '?seed=oficial'))).status).toBe(
      400,
    )
    expect(
      (await handlers.issue(request({}, '', { origin: 'https://otro.test' })))
        .status,
    ).toBe(400)
    expect(
      (
        await handlers.issue(
          request({}, '', { 'sec-fetch-site': 'cross-site' }),
        )
      ).status,
    ).toBe(400)
  })
  it('valida el origen público aun cuando Next usa un hostname interno', async () => {
    const proxied = (origin: string) =>
      new Request('http://localhost:3101/api/practice/runs', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          host: 'feria.example',
          'x-forwarded-proto': 'https',
          origin,
        },
        body: '{}',
      })
    expect(
      (await handlers.issue(proxied('https://feria.example'))).status,
    ).toBe(200)
    for (const origin of ['https://otro.example', 'http://feria.example']) {
      expect((await handlers.issue(proxied(origin))).status).toBe(400)
    }
  })
  it('recomputa FairScore con la política compartida e ignora afirmaciones dentro del log', async () => {
    const dependencies = createFullCareerDependencies()
    const expected = scoreRun(
      scoredEventsOf(played.final.history),
      dependencies.catalog,
      dependencies.competitiveScore!,
    )
    if (!expected.ok) throw new Error('score failed')
    const forged = {
      ...(played.serialized as object),
      score: 999999,
      fairScore: 10000,
      graduated: false,
    }
    const response = await handlers.verify(
      request({ actionLog: forged }, '/verify'),
    )
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      result: {
        kind: 'practice',
        runId: descriptor.runId,
        fairScore: expected.value.fairScore,
        graduated: true,
      },
    })
    expect(expected.value.fairScore).toBeLessThan(10000)
  })
  it('la partida perfecta conserva 10.000 y reenviar no crea otro resultado', () => {
    const first = verifyPracticeRun(perfect.serialized)
    expect(first).toEqual({
      ok: true,
      result: {
        kind: 'practice',
        runId: descriptor.runId,
        fairScore: 10000,
        graduated: true,
      },
    })
    expect(verifyPracticeRun(perfect.serialized)).toEqual(first)
  })
  it.each([
    ['mode', 'fair'],
    ['difficulty', 'adaptive'],
    ['seed', 'official-seed'],
    ['planFingerprint', 'false-plan'],
    ['scoreVersion', 'old'],
    ['variantCatalogVersion', 'historical'],
    ['gameVersion', '0.0.0'],
    ['contentVersion', 'unknown'],
    ['rulesetVersion', 'other'],
  ])('rechaza descriptor manipulado: %s', async (field, value) => {
    const log = JSON.parse(JSON.stringify(played.serialized)) as {
      descriptor: Record<string, unknown>
    }
    log.descriptor[field] = value
    const response = await handlers.verify(
      request({ actionLog: log }, '/verify'),
    )
    expect([400, 409]).toContain(response.status)
    const body = await response.text()
    expect(body).not.toContain(descriptor.seed)
    expect(body).not.toContain('stack')
    expect(body).not.toContain('expected')
  })
  it('un seed de práctica alterado sin recomponer el plan falla', () => {
    const log = JSON.parse(JSON.stringify(played.serialized)) as {
      descriptor: Record<string, unknown>
    }
    log.descriptor['seed'] = `practice-v1-${'a'.repeat(48)}`
    expect(verifyPracticeRun(log).ok).toBe(false)
  })
  it('rechaza score como campo de submission, logs inválidos, incompletos y más de 512 acciones', async () => {
    expect(
      (
        await handlers.verify(
          request({ actionLog: perfect.serialized, score: 999999 }, '/verify'),
        )
      ).status,
    ).toBe(400)
    for (const log of [
      null,
      {},
      { ...(perfect.serialized as object), actions: [] },
      {
        ...(perfect.serialized as object),
        actions: Array.from({ length: 513 }, () => ({
          sequence: 0,
          command: { type: 'CONTINUE' },
        })),
      },
    ]) {
      expect(
        (await handlers.verify(request({ actionLog: log }, '/verify'))).status,
      ).toBe(400)
    }
  })
})

describe('frontera HTTP y costo', () => {
  it('acota bytes declarados y reales, incluso multibyte sin Content-Length', async () => {
    expect(
      (
        await handlers.verify(
          request({}, '/verify', {
            'content-length': String(MAX_ACTION_LOG_BYTES + 1),
          }),
        )
      ).status,
    ).toBe(413)
    expect(
      (
        await handlers.verify(
          request({ value: 'á'.repeat(MAX_ACTION_LOG_BYTES / 2) }, '/verify'),
        )
      ).status,
    ).toBe(413)
  })
  it('cancela un stream que excede el límite antes de leer el resto', async () => {
    const cancel = vi.fn()
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new Uint8Array(MAX_ACTION_LOG_BYTES + 1))
      },
      cancel,
    })
    const streamed = new Request(
      'https://egresado.test/api/practice/runs/verify',
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body,
        duplex: 'half',
      } as RequestInit,
    )
    expect((await handlers.verify(streamed)).status).toBe(413)
    expect(cancel).toHaveBeenCalledOnce()
  })
  it('rechaza JSON roto y formatos ajenos', async () => {
    expect(
      (
        await handlers.issue(
          new Request('https://egresado.test/api/practice/runs', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: '{',
          }),
        )
      ).status,
    ).toBe(400)
    expect(
      (await handlers.issue(request({}, '', { 'content-type': 'text/plain' })))
        .status,
    ).toBe(400)
  })
  it('corta antes de componer/replay cuando falta cuota; falla cerrado si falta contador', async () => {
    const denied = createPracticeHandlers(() => ({ allow: async () => false }))
    const unavailable = createPracticeHandlers(() => ({
      allow: async () => {
        throw new Error('private database details')
      },
    }))
    const limited = await denied.verify(
      request({ actionLog: perfect.serialized }, '/verify'),
    )
    expect(limited.status).toBe(429)
    expect(limited.headers.get('retry-after')).toBe('300')
    const failed = await unavailable.issue(request())
    expect(failed.status).toBe(503)
    expect(await failed.text()).not.toContain('private database details')
  })
  it('admite la ráfaga escolar y reinicia cuota al cambiar ventana', async () => {
    const hits = new Map<string, number>()
    const counter: RateLimitCounter = {
      async incrementRateLimit(bucket, start) {
        const key = bucket + start
        const value = (hits.get(key) ?? 0) + 1
        hits.set(key, value)
        return value
      },
    }
    const now = new Date('2026-10-01T12:00:00Z')
    for (let i = 0; i < 120; i++)
      expect(
        await consumeRateLimit(
          counter,
          now,
          'practice:issue',
          'school',
          PRACTICE_RATE_LIMITS.issue,
        ),
      ).toBe(true)
    expect(
      await consumeRateLimit(
        counter,
        now,
        'practice:issue',
        'school',
        PRACTICE_RATE_LIMITS.issue,
      ),
    ).toBe(false)
    expect(
      await consumeRateLimit(
        counter,
        new Date(now.getTime() + 300000),
        'practice:issue',
        'school',
        PRACTICE_RATE_LIMITS.issue,
      ),
    ).toBe(true)
    expect(
      await consumeRateLimit(
        counter,
        now,
        'practice:verify',
        'school',
        PRACTICE_RATE_LIMITS.verify,
      ),
    ).toBe(true)
  })
  it('logs distinguen práctica sin guardar cuerpo, cookies ni seed', async () => {
    await handlers.verify(
      request({ actionLog: perfect.serialized }, '/verify', {
        cookie: 'egresado_participant=private-session',
      }),
    )
    const line = vi.mocked(console.info).mock.calls.at(-1)?.[0] as string
    expect(JSON.parse(line)).toMatchObject({
      scope: 'practice',
      event: 'verify',
      outcome: 'ok',
    })
    expect(line).not.toContain('private-session')
    expect(line).not.toContain(descriptor.seed)
    expect(line).not.toContain('actions')
  })
})

const databaseConfigured = Boolean(
  process.env['SUPABASE_SECRET_KEY'] &&
  (process.env['SUPABASE_INTERNAL_URL'] ??
    process.env['NEXT_PUBLIC_SUPABASE_URL']),
)
describe.skipIf(!databaseConfigured)('aislamiento sobre Postgres real', () => {
  it('sólo escribe contadores: conserva ranking, best, entidades y sesión de competencia', async () => {
    const store = new SupabaseCompetitionStore()
    const context = await createTestContext({
      store,
      competition: { slug: `practice-isolation-${randomUUID()}` },
    })
    const registered = await identifyParticipant(
      context.participants,
      context.competition,
      identityFixture(),
    )
    if (!registered.ok) throw new Error('registration failed')
    const participant = registered.value.participant
    const issued = await startAttempt(context, context.competition, participant)
    if (!issued.ok) throw new Error('attempt failed')
    const career = playCareer(issued.value.descriptor)
    expect(
      (
        await submitAttempt(
          context,
          context.competition,
          participant,
          issued.value.attemptId,
          career.serialized,
        )
      ).ok,
    ).toBe(true)
    const snapshot = async () => ({
      state: await loadPublicState(context, context.competition, participant),
      competition: await store.findCompetitionById(context.competition.id),
      participants: await store.listParticipants(context.competition.id),
      attempts: await store.listAttempts(context.competition.id),
      audit: await store.listAudit(context.competition.id, 100),
      session: await resolveParticipantSession(
        context,
        registered.value.sessionToken,
      ),
    })
    const before = await snapshot()
    const originalFetch = globalThis.fetch
    const calls: string[] = []
    const spy = vi
      .spyOn(globalThis, 'fetch')
      .mockImplementation((input, init) => {
        const url = new URL(
          input instanceof Request ? input.url : String(input),
        )
        calls.push(`${init?.method ?? 'GET'} ${url.pathname}`)
        return originalFetch(input, init)
      })
    try {
      const real = createPracticeHandlers(createPracticeRuntime)
      const response = await real.issue(
        request({}, '', {
          'x-forwarded-for': `test-${randomUUID()}`,
          cookie: `egresado_participant=${registered.value.sessionToken}`,
        }),
      )
      expect(response.status).toBe(200)
      expect(response.headers.get('set-cookie')).toBeNull()
      const { descriptor: practice } = (await response.json()) as {
        descriptor: RunDescriptor
      }
      expect(practice.seed).not.toBe(context.competition.runSeed)
      const completed = playCareer(practice)
      const verified = await real.verify(
        request({ actionLog: completed.serialized }, '/verify'),
      )
      expect(verified.status).toBe(200)
      expect(verified.headers.get('set-cookie')).toBeNull()
      expect(calls).toEqual([
        'POST /rest/v1/rpc/competition_bump_rate_limit',
        'POST /rest/v1/rpc/competition_bump_rate_limit',
      ])
    } finally {
      spy.mockRestore()
    }
    expect(await snapshot()).toEqual(before)
  }, 30_000)
})
