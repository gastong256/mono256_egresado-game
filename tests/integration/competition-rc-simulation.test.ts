import { afterAll, describe, expect, it } from 'vitest'

import { startAttempt, submitAttempt } from '@/server/competition/attempts'
import { identifyParticipant } from '@/server/competition/participants'
import {
  loadOrganizerDashboard,
  setAttemptValidity,
  setCompetitionStatus,
  setParticipantEligibility,
} from '@/server/competition/organizer'
import { exportParticipantsCsv } from '@/server/competition/export'
import { loadPublicState, MAX_PUBLIC_RANK } from '@/server/competition/ranking'
import { planPurge, purgeCompetition } from '@/server/competition/retention'
import {
  clientFingerprint,
  createRateLimiter,
  RATE_LIMITS,
} from '@/server/competition/rate-limit'
import { fixedClock } from '@/server/competition/clock'
import { SupabaseCompetitionStore } from '@/server/persistence/competition/supabase-store'
import { InMemoryCompetitionStore } from '@/server/persistence/competition/memory-store'
import type {
  CompetitionRow,
  ParticipantRow,
} from '@/server/persistence/competition/rows'
import type { CompetitionStore } from '@/server/persistence/competition/store'
import { rankEntries } from '@/lib/competition'
import {
  competitionFixture,
  identityFixture,
  playCareer,
  TEST_IDENTITY_SECRET,
  TEST_SCHOOL_YEARS,
} from '../helpers/competition'

/**
 * El ensayo de feria, de punta a punta, con los servicios reales.
 *
 * Es el test que responde «¿esto se puede abrir el sábado?», y por eso no
 * prueba una capa: recorre la jornada entera. Se abre la edición contra el
 * release congelado, se anota gente desde una sola IP —que es lo que hace una
 * escuela detrás de su NAT—, se juegan carreras de verdad contra el motor, se
 * envían, se rechaza una partida trucada, un organizador invalida un resultado
 * y descalifica a alguien, se cierra, se lee el podio, se exporta el CSV y se
 * purgan los datos privados.
 *
 * Las carreras se **juegan**, no se inventan: nueve beats, seis años, con las
 * respuestas que producen los witnesses de autoría. Un log sintético probaría
 * que el servidor acepta lo que el test escribió.
 *
 * El número de carreras jugadas es chico a propósito —cada una cuesta cientos
 * de milisegundos de motor— y la escala vive en
 * `competition-performance.test.ts`, que mide el ranking con 500 participantes
 * y 1500 intentos. Mezclar las dos cosas habría dado un test de veinte minutos
 * que nadie corre.
 */

const databaseConfigured =
  Boolean(process.env['SUPABASE_SECRET_KEY']) &&
  Boolean(
    process.env['SUPABASE_INTERNAL_URL'] ??
    process.env['NEXT_PUBLIC_SUPABASE_URL'],
  )

const CLOCK = fixedClock('2026-10-03T15:00:00.000Z')
const AFTER_CLOSE = fixedClock('2027-04-01T12:00:00.000Z')

/** Cuánta gente juega de verdad en el ensayo. */
const PLAYERS = 6

interface Measurement {
  readonly label: string
  readonly samples: number
  readonly medianMs: number
  readonly worstMs: number
}

const measurements: Measurement[] = []

function record(label: string, durations: readonly number[]): void {
  const sorted = [...durations].sort((left, right) => left - right)
  measurements.push({
    label,
    samples: sorted.length,
    medianMs: sorted[Math.floor(sorted.length / 2)] ?? 0,
    worstMs: sorted.at(-1) ?? 0,
  })
}

async function timed<T>(
  durations: number[],
  operation: () => Promise<T>,
): Promise<T> {
  const started = Date.now()
  const value = await operation()
  durations.push(Date.now() - started)
  return value
}

function organizerDependencies(store: CompetitionStore) {
  return {
    store,
    clock: CLOCK,
    config: {
      slug: 'rc',
      identitySecret: TEST_IDENTITY_SECRET,
      privacy: {
        name: 'Escuela de ensayo',
        contact: 'privacidad@ensayo.test',
        address: 'Calle 1',
        noticeVersion: '1',
        retentionDays: 120,
      },
      schoolYears: TEST_SCHOOL_YEARS,
      schoolDivisions: [],
      organizer: { username: 'docente', passwordHash: 'scrypt:1:1:1:aa:bb' },
    },
  }
}

function participantDependencies(store: CompetitionStore) {
  return {
    store,
    clock: CLOCK,
    identitySecret: TEST_IDENTITY_SECRET,
    schoolYears: TEST_SCHOOL_YEARS,
    schoolDivisions: [] as readonly string[],
  }
}

const slug = `rc-${String(Date.now()).slice(-9)}`
const store: CompetitionStore = databaseConfigured
  ? new SupabaseCompetitionStore()
  : new InMemoryCompetitionStore()

describe('ensayo de feria sobre la configuración del release', () => {
  let competition: CompetitionRow
  const players: ParticipantRow[] = []

  afterAll(() => {
    if (measurements.length === 0) return
    process.stdout.write(
      [
        '',
        `  ENSAYO RC · ${databaseConfigured ? 'postgres' : 'memoria'} · edición ${slug}`,
        ...measurements.map(
          (entry) =>
            `    ${entry.label.padEnd(28)} ${String(entry.samples).padStart(4)} muestras · mediana ${String(entry.medianMs).padStart(5)} ms · peor ${String(entry.worstMs).padStart(5)} ms`,
        ),
        '',
      ].join('\n'),
    )
  })

  it('abre la edición, que nace con la tupla del release', async () => {
    competition = await store.insertCompetition(
      competitionFixture({
        slug,
        name: 'Ensayo de release candidate',
        status: 'DRAFT',
        closesAt: '2026-10-03T18:00:00.000Z',
      }),
    )

    const opened = await setCompetitionStatus(
      organizerDependencies(store),
      'docente',
      competition,
      'OPEN',
      'apertura del ensayo',
    )
    if (!opened.ok) throw new Error(`no abrió: ${opened.error.code}`)
    competition = opened.value
    expect(competition.status).toBe('OPEN')
  }, 120_000)

  it('anota a toda la clase desde una sola IP', async () => {
    // El caso que STAGE-09 calibró: un edificio entero comparte una dirección.
    // Un límite estrecho por IP no frena a quien puede cambiar de red y sí deja
    // afuera a media clase, que es el peor error posible el día de la feria.
    const limiter = createRateLimiter(store, CLOCK)
    const school = clientFingerprint(TEST_IDENTITY_SECRET, '190.51.12.7')
    const durations: number[] = []

    for (let index = 0; index < PLAYERS * 4; index += 1) {
      const allowed = await limiter.allow('register', `${school}-${slug}`)
      expect(allowed).toBe(true)
    }

    for (let index = 0; index < PLAYERS; index += 1) {
      const registered = await timed(durations, () =>
        identifyParticipant(
          participantDependencies(store),
          competition,
          identityFixture({
            nickname: `Ensayo${slug.slice(-4)}${String(index)}`,
          }),
        ),
      )
      if (!registered.ok) {
        throw new Error(`no se registró: ${registered.error.code}`)
      }
      players.push(registered.value.participant)
    }

    record('registro', durations)
    expect(players).toHaveLength(PLAYERS)
  }, 300_000)

  it('corta a un cliente que abusa, sin tocar al resto de la escuela', async () => {
    const limiter = createRateLimiter(store, CLOCK)
    const abusive = clientFingerprint(TEST_IDENTITY_SECRET, '203.0.113.99')
    const bucket = `${abusive}-${slug}`

    let allowed = 0
    for (let index = 0; index < RATE_LIMITS.register.limit + 10; index += 1) {
      if (await limiter.allow('register', bucket)) allowed += 1
    }
    expect(allowed).toBe(RATE_LIMITS.register.limit)

    // Y la escuela, en su propio balde, sigue entrando.
    const school = clientFingerprint(TEST_IDENTITY_SECRET, '190.51.12.7')
    expect(await limiter.allow('register', `${school}-${slug}-otra`)).toBe(true)
  }, 120_000)

  it('juega, envía y verifica una carrera real por participante', async () => {
    const issueDurations: number[] = []
    const verifyDurations: number[] = []

    for (const [index, participant] of players.entries()) {
      const issued = await timed(issueDurations, () =>
        startAttempt({ store, clock: CLOCK }, competition, participant),
      )
      if (!issued.ok) throw new Error(`no emitió: ${issued.error.code}`)

      // Dos personas empatan a propósito: el podio tiene que compartir puesto.
      const quality = index < 2 ? () => 'optimal' as const : undefined
      const played = playCareer(issued.value.descriptor, quality)

      const verified = await timed(verifyDurations, () =>
        submitAttempt(
          { store, clock: CLOCK },
          competition,
          participant,
          issued.value.attemptId,
          played.serialized,
        ),
      )
      if (!verified.ok) throw new Error(`no verificó: ${verified.error.code}`)
      expect(verified.value.status).toBe('VERIFIED')
      expect(verified.value.fairScore).toBeGreaterThan(0)
    }

    record('emisión de intento', issueDurations)
    record('verificación por replay', verifyDurations)
  }, 600_000)

  it('acepta un segundo intento y rankea el mejor, no el último', async () => {
    const player = players[2]
    if (player === undefined) throw new Error('sin participante')

    const before = await loadPublicState({ store }, competition, player)
    const best = before.you?.bestFairScore ?? 0

    const issued = await startAttempt(
      { store, clock: CLOCK },
      competition,
      player,
    )
    if (!issued.ok) throw new Error(`no emitió: ${issued.error.code}`)

    // Una partida deliberadamente peor. No puede desplazar a la anterior.
    const played = playCareer(issued.value.descriptor, () => 'functional')
    const verified = await submitAttempt(
      { store, clock: CLOCK },
      competition,
      player,
      issued.value.attemptId,
      played.serialized,
    )
    if (!verified.ok) throw new Error(`no verificó: ${verified.error.code}`)
    expect(verified.value.personalBest).toBe(false)

    const after = await loadPublicState({ store }, competition, player)
    expect(after.you?.bestFairScore).toBe(best)
    expect(after.you?.attempts).toBe(2)
  }, 300_000)

  it('rechaza una partida trucada y la deja fuera del ranking', async () => {
    const player = players[3]
    if (player === undefined) throw new Error('sin participante')

    const issued = await startAttempt(
      { store, clock: CLOCK },
      competition,
      player,
    )
    if (!issued.ok) throw new Error(`no emitió: ${issued.error.code}`)

    const played = playCareer(issued.value.descriptor)
    const tampered = JSON.parse(JSON.stringify(played.serialized)) as {
      actions: unknown[]
      fairScore?: number
      graduated?: boolean
    }
    // Se trunca el log —la carrera no egresa— y se le agregan campos que un
    // cliente podría inventar. Los campos se ignoran; el truncamiento no.
    tampered.actions = tampered.actions.slice(0, 2)
    tampered.fairScore = 10_000
    tampered.graduated = true

    const rejected = await submitAttempt(
      { store, clock: CLOCK },
      competition,
      player,
      issued.value.attemptId,
      tampered,
    )
    if (!rejected.ok)
      throw new Error(`error inesperado: ${rejected.error.code}`)
    expect(rejected.value.status).toBe('REJECTED')
    expect(rejected.value.fairScore).toBeUndefined()

    const state = await loadPublicState({ store }, competition, player)
    // El mejor intento del participante sigue siendo el verificado de antes.
    expect(state.you?.bestFairScore).toBeGreaterThan(0)
  }, 300_000)

  it('deja al organizador invalidar un resultado y descalificar a alguien', async () => {
    const dependencies = organizerDependencies(store)
    const invalidated = players[4]
    const disqualified = players[5]
    if (invalidated === undefined || disqualified === undefined) {
      throw new Error('sin participantes')
    }

    const attempts = await store.listAttemptsForParticipant(invalidated.id)
    const verified = attempts.find((attempt) => attempt.status === 'VERIFIED')
    if (verified === undefined) throw new Error('sin intento verificado')

    const result = await setAttemptValidity(
      dependencies,
      'docente',
      competition,
      verified.id,
      true,
      'resultado observado por el jurado',
    )
    expect(result.ok).toBe(true)

    const eligibility = await setParticipantEligibility(
      dependencies,
      'docente',
      competition,
      disqualified.id,
      'DISQUALIFIED',
      'reglamento del evento',
    )
    expect(eligibility.ok).toBe(true)

    const best = await store.bestVerifiedAttempts(competition.id)
    const ranked = best.map((row) => row.participantId)
    expect(ranked).not.toContain(disqualified.id)
    expect(ranked).not.toContain(invalidated.id)

    const audit = await store.listAudit(competition.id, 50)
    expect(audit.map((entry) => entry.action)).toEqual(
      expect.arrayContaining([
        'competition.status',
        'attempt.invalidate',
        'participant.disqualify',
      ]),
    )
    // La auditoría guarda qué pasó, nunca el dato que cambió.
    expect(JSON.stringify(audit)).not.toContain(invalidated.publicNickname)
  }, 300_000)

  it('publica el podio por puesto, con el empate entero adentro', async () => {
    const durations: number[] = []
    const state = await timed(durations, () =>
      loadPublicState({ store }, competition, undefined),
    )
    record('estado público', durations)

    expect(
      state.leaderboard.every((entry) => entry.rank <= MAX_PUBLIC_RANK),
    ).toBe(true)
    expect(state.totalRanked).toBeGreaterThan(0)

    const best = await store.bestVerifiedAttempts(competition.id)
    const ranked = rankEntries(
      best.map((row) => ({
        participantId: row.participantId,
        fairScore: row.verifiedFairScore,
        prestigeScore: row.verifiedPrestigeScore,
      })),
    )
    // El corte es por puesto y no por cantidad de filas: si hay tres personas
    // en el tercer puesto, las tres salen.
    const expected = ranked.filter((entry) => entry.rank <= MAX_PUBLIC_RANK)
    expect(state.leaderboard).toHaveLength(expected.length)

    // Prestige v1: el techo ofrecido es 0, así que nadie lo usa para desempatar.
    expect(best.every((row) => row.verifiedPrestigeScore === 0)).toBe(true)
  }, 120_000)

  it('exporta el CSV que el organizador usa para entregar premios', async () => {
    const durations: number[] = []
    const dashboard = await timed(durations, () =>
      loadOrganizerDashboard(organizerDependencies(store), competition),
    )
    const csv = exportParticipantsCsv(dashboard)
    record('exportación', durations)

    const lines = csv.trim().split('\r\n')
    expect(lines).toHaveLength(dashboard.participants.length + 1)
    expect(lines[0]).toContain('"nombre_y_apellido"')
    expect(lines[0]).toContain('"dni_ultimos_4"')
    // Lo que el CSV nunca lleva.
    expect(csv).not.toContain('identity')
    expect(csv).not.toContain('token')
    expect(csv).not.toContain('actionLog')
  }, 120_000)

  it('cierra la edición y el ranking sigue siendo legible', async () => {
    const closed = await setCompetitionStatus(
      organizerDependencies(store),
      'docente',
      competition,
      'CLOSED',
      'fin de la jornada',
    )
    if (!closed.ok) throw new Error(`no cerró: ${closed.error.code}`)
    competition = closed.value

    const state = await loadPublicState({ store }, competition, undefined)
    expect(state.competition.status).toBe('closed')
    expect(state.totalRanked).toBeGreaterThan(0)

    // Y no se puede empezar una partida nueva.
    const player = players[0]
    if (player === undefined) throw new Error('sin participante')
    const blocked = await startAttempt(
      { store, clock: CLOCK },
      competition,
      player,
    )
    expect(blocked.ok).toBe(false)
  }, 120_000)

  it('purga los datos privados cuando la retención vence, y conserva el ranking', async () => {
    const plan = await planPurge({ store, clock: CLOCK }, competition)
    expect(plan.eligible).toBe(false)

    const due = await planPurge({ store, clock: AFTER_CLOSE }, competition)
    expect(due.eligible).toBe(true)

    const result = await purgeCompetition(
      { store, clock: AFTER_CLOSE },
      competition,
      { actor: 'docente' },
    )
    expect(result.anonymized).toBe(players.length)

    const participants = await store.listParticipants(competition.id)
    for (const participant of participants) {
      expect(participant.fullNamePrivate).toBeUndefined()
      expect(participant.dniLast4Private).toBeUndefined()
      expect(participant.schoolYearPrivate).toBeUndefined()
      expect(participant.anonymizedAt).toBeDefined()
      // Lo público sobrevive: el ranking del año pasado tiene que seguir
      // siendo legible, y un alias no identifica a nadie.
      expect(participant.publicNickname.length).toBeGreaterThan(0)
    }

    const state = await loadPublicState({ store }, competition, undefined)
    expect(state.totalRanked).toBeGreaterThan(0)
  }, 300_000)

  it('archiva la edición del ensayo', async () => {
    const archived = await setCompetitionStatus(
      organizerDependencies(store),
      'docente',
      competition,
      'ARCHIVED',
      'ensayo terminado',
    )
    expect(archived.ok).toBe(true)
  }, 120_000)
})
