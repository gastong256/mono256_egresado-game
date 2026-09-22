import { describe, expect, it } from 'vitest'

import { loadPublicState, MAX_PUBLIC_RANK } from '@/server/competition/ranking'
import { InMemoryCompetitionStore } from '@/server/persistence/competition/memory-store'
import type {
  CompetitionRow,
  ParticipantRow,
} from '@/server/persistence/competition/rows'
import type { CompetitionStore } from '@/server/persistence/competition/store'
import { currentRelease } from '@/release'
import { competitionFixture } from '../helpers/competition'

/**
 * Las reglas de ranking y podio que el release congela.
 *
 * Cada caso de este archivo corresponde a una línea del manifiesto, y esa
 * correspondencia es deliberada: `competition.ranking` y `competition.podium`
 * son texto hasta que algo comprueba que el código hace eso. Lo que se fija acá
 * no es cómo está implementado el comparador —de eso se ocupa
 * `competition-ranking.test.ts`— sino el **contrato publicado**: qué intento
 * rankea, qué pasa cuando el mejor se cae, y hasta dónde llega el podio.
 *
 * Los intentos se insertan con puntajes elegidos a mano en lugar de jugarse.
 * Jugarlos daría los mismos números por caminos más lentos y sin decidir nada:
 * lo que estos casos afirman es qué fila gana, y para eso el puntaje es la
 * entrada, no el resultado.
 */

const ranking = currentRelease().competition.ranking
const podium = currentRelease().competition.podium

let counter = 0

async function scenario(): Promise<{
  store: CompetitionStore
  competition: CompetitionRow
}> {
  counter += 1
  const store = new InMemoryCompetitionStore()
  const competition = await store.insertCompetition(
    competitionFixture({ slug: `ranking-${String(counter)}` }),
  )
  return { store, competition }
}

async function addParticipant(
  store: CompetitionStore,
  competition: CompetitionRow,
  nickname: string,
): Promise<ParticipantRow> {
  counter += 1
  const created = await store.insertParticipant({
    competitionId: competition.id,
    publicNickname: nickname,
    nicknameKey: nickname.toLowerCase(),
    fullNamePrivate: 'Persona De Prueba',
    schoolYearPrivate: '3.º',
    divisionPrivate: undefined,
    identityHmac: counter.toString(16).padStart(64, '0'),
    dniLast4Private: '1234',
    privacyNoticeVersion: '1',
  })
  if (created.outcome !== 'created') throw new Error('no se creó')
  return created.participant
}

async function addAttempt(
  store: CompetitionStore,
  competition: CompetitionRow,
  participant: ParticipantRow,
  attemptNumber: number,
  outcome:
    | {
        readonly status: 'VERIFIED'
        readonly fair: number
        readonly prestige?: number
      }
    | { readonly status: 'REJECTED' },
): Promise<string> {
  counter += 1
  const inserted = await store.insertAttempt({
    competitionId: competition.id,
    participantId: participant.id,
    attemptNumber,
    runId: `run-${String(counter)}`,
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

  await store.finalizeAttempt(inserted.attempt.id, ['STARTED'], {
    status: outcome.status,
    submittedAt: '2026-10-03T16:00:00.000Z',
    verifiedAt:
      outcome.status === 'VERIFIED' ? '2026-10-03T16:00:00.000Z' : undefined,
    actionLog: { version: 7, actions: [] },
    submissionDigest: counter.toString(16).padStart(64, '0'),
    verifiedFairScore: outcome.status === 'VERIFIED' ? outcome.fair : undefined,
    verifiedPrestigeScore:
      outcome.status === 'VERIFIED' ? (outcome.prestige ?? 0) : undefined,
    verifiedSummary: { graduated: outcome.status === 'VERIFIED' },
    rejectionCode: outcome.status === 'REJECTED' ? 'not-graduated' : undefined,
  })
  return inserted.attempt.id
}

describe('el intento que rankea', () => {
  it('el manifiesto declara el mejor intento verificado por participante elegible', () => {
    expect(ranking.scope).toBe('best-verified-attempt-per-eligible-participant')
    expect(ranking.order).toEqual(['fairScore:desc', 'prestigeScore:desc'])
    expect(ranking.tertiaryCriterion).toBeNull()
    expect(ranking.ties).toBe('shared-rank')
  })

  it('un intento posterior peor no desplaza al mejor', async () => {
    const { store, competition } = await scenario()
    const player = await addParticipant(store, competition, 'Ana')
    await addAttempt(store, competition, player, 1, {
      status: 'VERIFIED',
      fair: 8_400,
    })
    await addAttempt(store, competition, player, 2, {
      status: 'VERIFIED',
      fair: 5_100,
    })

    const state = await loadPublicState({ store }, competition, player)
    expect(state.you?.bestFairScore).toBe(8_400)
    expect(state.you?.attempts).toBe(2)
  })

  it('un intento posterior mejor sí desplaza al anterior', async () => {
    const { store, competition } = await scenario()
    const player = await addParticipant(store, competition, 'Bruno')
    await addAttempt(store, competition, player, 1, {
      status: 'VERIFIED',
      fair: 5_100,
    })
    await addAttempt(store, competition, player, 2, {
      status: 'VERIFIED',
      fair: 9_200,
    })

    const state = await loadPublicState({ store }, competition, player)
    expect(state.you?.bestFairScore).toBe(9_200)
  })

  it('un intento rechazado no entra, por alto que fuera el número que reclamaba', async () => {
    const { store, competition } = await scenario()
    const player = await addParticipant(store, competition, 'Carla')
    await addAttempt(store, competition, player, 1, {
      status: 'VERIFIED',
      fair: 6_000,
    })
    await addAttempt(store, competition, player, 2, { status: 'REJECTED' })

    const state = await loadPublicState({ store }, competition, player)
    expect(state.you?.bestFairScore).toBe(6_000)
  })

  it('si el mejor se invalida, el siguiente pasa a ser el efectivo', async () => {
    const { store, competition } = await scenario()
    const player = await addParticipant(store, competition, 'Dina')
    const best = await addAttempt(store, competition, player, 1, {
      status: 'VERIFIED',
      fair: 9_900,
    })
    await addAttempt(store, competition, player, 2, {
      status: 'VERIFIED',
      fair: 7_300,
    })

    await store.invalidateAttempt(best, '2026-10-03T17:00:00.000Z', 'observado')

    const state = await loadPublicState({ store }, competition, player)
    expect(state.you?.bestFairScore).toBe(7_300)

    // Y restaurarlo lo devuelve al ranking: invalidar no borra evidencia.
    await store.restoreAttempt(best)
    const restored = await loadPublicState({ store }, competition, player)
    expect(restored.you?.bestFairScore).toBe(9_900)
  })

  it('un participante descalificado desaparece del ranking sin perder sus filas', async () => {
    const { store, competition } = await scenario()
    const player = await addParticipant(store, competition, 'Elio')
    await addAttempt(store, competition, player, 1, {
      status: 'VERIFIED',
      fair: 9_100,
    })

    await store.updateParticipant(player.id, {
      status: 'DISQUALIFIED',
      statusReason: 'reglamento',
    })

    expect(await store.bestVerifiedAttempts(competition.id)).toHaveLength(0)
    expect(await store.listAttemptsForParticipant(player.id)).toHaveLength(1)
  })

  it('cada persona ocupa exactamente una fila', async () => {
    const { store, competition } = await scenario()
    for (const name of ['Uno', 'Dos', 'Tres']) {
      const player = await addParticipant(store, competition, name)
      for (let attempt = 1; attempt <= 4; attempt += 1) {
        await addAttempt(store, competition, player, attempt, {
          status: 'VERIFIED',
          fair: 3_000 + attempt * 500,
        })
      }
    }

    const best = await store.bestVerifiedAttempts(competition.id)
    expect(best).toHaveLength(3)
    expect(new Set(best.map((row) => row.participantId)).size).toBe(3)
    expect(best.every((row) => row.verifiedFairScore === 5_000)).toBe(true)
  })
})

describe('el podio se corta por puesto', () => {
  it('el manifiesto declara tres puestos y el empate entero adentro', () => {
    expect(podium.places).toBe(MAX_PUBLIC_RANK)
    expect(podium.tieHandling).toBe('whole-tie-group-enters')
  })

  it('un empate en el tercer puesto entra completo, aunque sean cinco filas', async () => {
    const { store, competition } = await scenario()
    const scores = [9_000, 8_000, 7_000, 7_000, 7_000, 6_000]
    for (const [index, fair] of scores.entries()) {
      const player = await addParticipant(
        store,
        competition,
        `Jugador${String(index)}`,
      )
      await addAttempt(store, competition, player, 1, {
        status: 'VERIFIED',
        fair,
      })
    }

    const state = await loadPublicState({ store }, competition, undefined)
    expect(state.totalRanked).toBe(6)
    // Tres puestos, cinco personas: 1.º, 2.º y tres empatadas en 3.º.
    expect(state.leaderboard).toHaveLength(5)
    expect(state.leaderboard.map((entry) => entry.rank)).toEqual([
      1, 2, 3, 3, 3,
    ])
  })

  it('un empate en el primer puesto no inventa un segundo', async () => {
    const { store, competition } = await scenario()
    for (const [index, fair] of [9_000, 9_000, 8_000, 7_000].entries()) {
      const player = await addParticipant(
        store,
        competition,
        `Empate${String(index)}`,
      )
      await addAttempt(store, competition, player, 1, {
        status: 'VERIFIED',
        fair,
      })
    }

    const state = await loadPublicState({ store }, competition, undefined)
    // El cuarto queda fuera del podio: el corte es por puesto, y el 4.º no es
    // uno de los tres primeros aunque haya sólo tres personas por delante.
    expect(state.leaderboard.map((entry) => entry.rank)).toEqual([1, 1, 3])
  })
})

describe('Prestige bajo la política de v1', () => {
  it('el release lo declara desempate y con techo ofrecido cero', () => {
    const prestige = currentRelease().prestige
    expect(prestige.rankingRole).toBe('tiebreaker')
    expect(prestige.offeredCeiling).toBe(0)
    expect(prestige.publiclyDisplayed).toBe(false)
  })

  it('el servidor lo sigue ordenando, para cuando una edición futura lo ofrezca', async () => {
    const { store, competition } = await scenario()
    const sin = await addParticipant(store, competition, 'SinPrestigio')
    const con = await addParticipant(store, competition, 'ConPrestigio')
    await addAttempt(store, competition, sin, 1, {
      status: 'VERIFIED',
      fair: 8_000,
    })
    await addAttempt(store, competition, con, 1, {
      status: 'VERIFIED',
      fair: 8_000,
      prestige: 12,
    })

    const state = await loadPublicState({ store }, competition, undefined)
    expect(state.leaderboard[0]?.nickname).toBe('ConPrestigio')
    expect(state.leaderboard.map((entry) => entry.rank)).toEqual([1, 2])
  })

  it('no se suma a FairScore: 9.999 con 100 nunca supera a 10.000 con 0', async () => {
    const { store, competition } = await scenario()
    const perfecto = await addParticipant(store, competition, 'Perfecta')
    const casi = await addParticipant(store, competition, 'Casi')
    await addAttempt(store, competition, perfecto, 1, {
      status: 'VERIFIED',
      fair: 10_000,
    })
    await addAttempt(store, competition, casi, 1, {
      status: 'VERIFIED',
      fair: 9_999,
      prestige: 100,
    })

    const state = await loadPublicState({ store }, competition, undefined)
    expect(state.leaderboard[0]?.nickname).toBe('Perfecta')
  })

  it('el leaderboard público no publica una columna de Prestige', async () => {
    const { store, competition } = await scenario()
    const player = await addParticipant(store, competition, 'Alguien')
    await addAttempt(store, competition, player, 1, {
      status: 'VERIFIED',
      fair: 8_000,
      prestige: 7,
    })

    const state = await loadPublicState({ store }, competition, undefined)
    const entry = state.leaderboard[0]
    expect(entry).toBeDefined()
    expect(Object.keys(entry ?? {})).not.toContain('prestigeScore')
    expect(JSON.stringify(state.leaderboard)).not.toContain('prestige')
  })
})
