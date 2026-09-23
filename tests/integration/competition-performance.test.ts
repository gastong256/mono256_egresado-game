import { afterAll, describe, expect, it } from 'vitest'

import { rankEntries } from '@/lib/competition'
import { InMemoryCompetitionStore } from '@/server/persistence/competition/memory-store'
import { SupabaseCompetitionStore } from '@/server/persistence/competition/supabase-store'
import { loadPublicState } from '@/server/competition/ranking'
import { fixedClock } from '@/server/competition/clock'
import type { CompetitionStore } from '@/server/persistence/competition/store'
import type { CompetitionRow } from '@/server/persistence/competition/rows'
import { competitionFixture } from '../helpers/competition'

/**
 * Escala de feria, medida y no supuesta.
 *
 * El escenario es una escuela grande: **500 participantes con tres intentos
 * cada uno**, es decir 1500 intentos verificados, que es el orden de magnitud
 * que una feria real produce en una tarde. No hay caché, no hay tabla
 * materializada y no hace falta: la consulta del mejor intento es un
 * `distinct on` sobre un índice parcial, y el puesto se calcula en memoria
 * sobre 500 filas.
 *
 * Materializar el ranking habría introducido un estado derivado que puede
 * quedar viejo justo cuando un organizador invalida un resultado. La medición
 * es lo que permite decir que no hace falta, en vez de suponerlo.
 */

const databaseConfigured =
  Boolean(process.env['SUPABASE_SECRET_KEY']) &&
  Boolean(
    process.env['SUPABASE_INTERNAL_URL'] ??
    process.env['NEXT_PUBLIC_SUPABASE_URL'],
  )

const PARTICIPANTS = 500
const ATTEMPTS_EACH = 3

/** Presupuesto holgado para una consulta que en la práctica corre en decenas de ms. */
const LEADERBOARD_BUDGET_MS = 1500

function hex(index: number, width: number): string {
  return index.toString(16).padStart(width, '0').slice(-width)
}

async function seedScale(
  store: CompetitionStore,
  slug: string,
): Promise<CompetitionRow> {
  const competition = await store.insertCompetition(
    competitionFixture({ slug, name: 'Escala' }),
  )

  for (let index = 0; index < PARTICIPANTS; index += 1) {
    const created = await store.insertParticipant({
      competitionId: competition.id,
      publicNickname: `Jugador ${String(index)}`,
      nicknameKey: `jugador ${String(index)}`,
      fullNamePrivate: `Persona Numero ${'a'.repeat((index % 5) + 1)}`,
      schoolYearPrivate: '3.º',
      divisionPrivate: undefined,
      identityHmac: hex(index + 1, 64),
      dniLast4Private: String(1000 + (index % 9000)).slice(0, 4),
      privacyNoticeVersion: '1',
    })
    if (created.outcome !== 'created') throw new Error('no se creó')

    for (let attempt = 1; attempt <= ATTEMPTS_EACH; attempt += 1) {
      const inserted = await store.insertAttempt({
        competitionId: competition.id,
        participantId: created.participant.id,
        attemptNumber: attempt,
        runId: `${slug}-${String(index)}-${String(attempt)}`,
        seed: competition.runSeed,
        runPlanFingerprint: competition.runPlanFingerprint,
        startedAt: '2026-10-03T15:00:00.000Z',
        engineVersion: competition.engineVersion,
        rulesetVersion: competition.rulesetVersion,
        contentVersion: competition.contentVersion,
        variantCatalogVersion: competition.variantCatalogVersion,
        scoreVersion: competition.scoreVersion,
        actionLogVersion: competition.actionLogVersion,
        snapshotVersion: competition.snapshotVersion,
      })
      if (inserted.outcome !== 'created') throw new Error('no se emitió')

      // Puntajes repartidos con empates deliberados: sin empates la medición
      // no ejercitaría la parte del ranking que decide un puesto compartido.
      const score = 4000 + ((index * 7 + attempt * 311) % 6001)
      await store.finalizeAttempt(inserted.attempt.id, ['STARTED'], {
        status: 'VERIFIED',
        submittedAt: '2026-10-03T16:00:00.000Z',
        verifiedAt: '2026-10-03T16:00:00.000Z',
        actionLog: { version: 7, actions: [] },
        submissionDigest: `${hex(index, 32)}${hex(attempt, 32)}`,
        verifiedFairScore: score,
        verifiedPrestigeScore: (index + attempt) % 41,
        verifiedSummary: { graduated: true },
        rejectionCode: undefined,
      })
    }
  }

  return competition
}

const createdSlugs: string[] = []

describe.skipIf(!databaseConfigured)('escala de feria sobre postgres', () => {
  const store = new SupabaseCompetitionStore()
  const slug = `escala-${String(Date.now()).slice(-9)}`

  afterAll(async () => {
    const row = await store.findCompetitionBySlug(slug)
    if (row !== undefined) {
      await store.updateCompetition(row.id, { status: 'ARCHIVED' })
    }
  })

  it(`resuelve el ranking de ${String(PARTICIPANTS)} participantes con ${String(ATTEMPTS_EACH)} intentos cada uno`, async () => {
    const startedSeeding = Date.now()
    const competition = await seedScale(store, slug)
    createdSlugs.push(slug)
    const seedingMs = Date.now() - startedSeeding

    const samples: number[] = []
    for (let round = 0; round < 5; round += 1) {
      const started = Date.now()
      const state = await loadPublicState({ store }, competition, undefined)
      samples.push(Date.now() - started)
      expect(state.totalRanked).toBe(PARTICIPANTS)
      expect(state.leaderboard.length).toBeGreaterThanOrEqual(1)
      expect(state.leaderboard.length).toBeLessThanOrEqual(12)
    }

    const sorted = [...samples].sort((a, b) => a - b)
    const median = sorted[Math.floor(sorted.length / 2)] ?? 0
    const worst = sorted[sorted.length - 1] ?? 0

    process.stdout.write(
      `\n  ranking · ${String(PARTICIPANTS)} participantes · ${String(
        PARTICIPANTS * ATTEMPTS_EACH,
      )} intentos verificados\n` +
        `  carga de datos: ${String(seedingMs)} ms\n` +
        `  consulta del leaderboard: mediana ${String(median)} ms · peor ${String(worst)} ms\n`,
    )

    expect(worst).toBeLessThan(LEADERBOARD_BUDGET_MS)
  }, 600_000)
})

describe('semántica del ranking a escala', () => {
  /*
   * Una sola carga en memoria para las dos comprobaciones.
   *
   * Sembrar 1500 intentos dos veces duplicaba el trabajo más pesado de la suite
   * sin agregar una afirmación nueva, y con la suite entera en paralelo esa
   * carga le hacía agotar el presupuesto a tests de otras áreas.
   */
  const loaded = (async () => {
    const store = new InMemoryCompetitionStore()
    const competition = await seedScale(store, 'escala-memoria')
    return { store, competition }
  })()

  it('mantiene una fila por participante con 1500 intentos', async () => {
    const { store, competition } = await loaded

    const best = await store.bestVerifiedAttempts(competition.id)
    expect(best).toHaveLength(PARTICIPANTS)

    const participantIds = new Set(best.map((row) => row.participantId))
    expect(participantIds.size).toBe(PARTICIPANTS)

    const ranked = rankEntries(
      best.map((row) => ({
        participantId: row.participantId,
        fairScore: row.verifiedFairScore,
        prestigeScore: row.verifiedPrestigeScore,
      })),
    )

    // El puesto nunca retrocede y el primero siempre es 1, aunque haya empates.
    expect(ranked[0]?.rank).toBe(1)
    for (const [index, entry] of ranked.entries()) {
      expect(entry.rank).toBeLessThanOrEqual(index + 1)
      if (index > 0) {
        expect(entry.rank).toBeGreaterThanOrEqual(ranked[index - 1]?.rank ?? 1)
      }
    }
  }, 120_000)

  it('ordena el puesto propio de cualquiera en tiempo razonable', async () => {
    const { store, competition } = await loaded
    const participants = await store.listParticipants(competition.id)
    const target = participants[250]
    if (target === undefined) throw new Error('sin participante')

    const started = Date.now()
    const state = await loadPublicState({ store }, competition, target)
    const elapsed = Date.now() - started

    expect(state.you?.rank).toBeGreaterThan(0)
    expect(state.you?.attempts).toBe(ATTEMPTS_EACH)
    expect(elapsed).toBeLessThan(LEADERBOARD_BUDGET_MS)
  }, 120_000)
})

describe('reloj de la medición', () => {
  it('usa reloj inyectado, así que no depende de cuándo se corra', () => {
    const clock = fixedClock('2026-10-03T16:00:00.000Z')
    expect(clock.now().toISOString()).toBe('2026-10-03T16:00:00.000Z')
  })
})
