/**
 * Piezas compartidas por las pruebas de competencia.
 *
 * Dos cosas viven acá. Una fábrica de ediciones y participantes, para no
 * repetir doce campos en cada test, y una forma de **jugar una carrera real**
 * contra el motor: nueve beats, seis años, respuestas producidas por los
 * mismos witnesses de autoría que usa el resto de la suite.
 *
 * Que la carrera sea real importa. Un log sintético probaría que el servidor
 * acepta lo que el test inventó; una carrera jugada prueba que acepta lo que el
 * juego produce, que es la única afirmación que sirve para un ranking.
 */

import {
  activeChallengeView,
  appendAction,
  createRun,
  emptyActionLog,
  serializeActionLog,
  transition,
  type GameCommand,
  type RunActionLog,
  type RunDescriptor,
  type RunState,
  type SolutionQuality,
} from '@/game'
import {
  FULL_CAREER_EDITION,
  listEditions,
} from '@/server/competition/editions'
import { fixedClock, type Clock } from '@/server/competition/clock'
import { InMemoryCompetitionStore } from '@/server/persistence/competition/memory-store'
import type {
  CompetitionRow,
  ParticipantRow,
} from '@/server/persistence/competition/rows'
import type { CompetitionStore } from '@/server/persistence/competition/store'
import type { ParticipantServiceDependencies } from '@/server/competition/participants'
import { grade5Answer } from './grade-5-play'

export const TEST_IDENTITY_SECRET =
  'secreto-de-prueba-que-no-es-el-de-produccion-0123456789'

export const TEST_SCHOOL_YEARS = ['7.º', '1.º', '2.º', '3.º', '4.º', '5.º']

/** Una seed que compone un plan de carrera completa válido. */
export const TEST_COMPETITION_SEED = 'feria-de-prueba'

export function competitionFixture(
  overrides: Partial<CompetitionRow> = {},
): Omit<CompetitionRow, 'id'> {
  const descriptor = FULL_CAREER_EDITION.createDescriptor(
    TEST_COMPETITION_SEED,
    '00000000-0000-4000-8000-000000000000',
  )
  if (descriptor?.planFingerprint === undefined) {
    throw new Error('la seed de prueba no compone un plan')
  }

  return {
    slug: 'feria-de-prueba',
    name: 'Feria de prueba',
    status: 'OPEN',
    opensAt: undefined,
    closesAt: undefined,
    submissionGraceSeconds: 300,
    runSeed: TEST_COMPETITION_SEED,
    runPlanFingerprint: descriptor.planFingerprint,
    privacyNoticeVersion: '1',
    retentionDays: 120,
    resultsFrozenAt: undefined,
    ...FULL_CAREER_EDITION.versions,
    ...overrides,
  }
}

export async function seedCompetition(
  store: CompetitionStore,
  overrides: Partial<CompetitionRow> = {},
): Promise<CompetitionRow> {
  return store.insertCompetition(competitionFixture(overrides))
}

export interface TestContext {
  readonly store: CompetitionStore
  readonly clock: Clock
  readonly competition: CompetitionRow
  readonly participants: ParticipantServiceDependencies
}

/** Un contexto completo en memoria, con reloj fijo. */
export async function createTestContext(
  options: {
    readonly now?: string
    readonly store?: CompetitionStore
    readonly competition?: Partial<CompetitionRow>
  } = {},
): Promise<TestContext> {
  const store = options.store ?? new InMemoryCompetitionStore()
  const clock = fixedClock(options.now ?? '2026-10-03T15:00:00.000Z')
  const competition = await seedCompetition(store, options.competition ?? {})
  return {
    store,
    clock,
    competition,
    participants: {
      store,
      clock,
      identitySecret: TEST_IDENTITY_SECRET,
      schoolYears: TEST_SCHOOL_YEARS,
      schoolDivisions: [],
    },
  }
}

let identityCounter = 0

/** Datos de una persona de prueba. El documento es distinto en cada llamada. */
export function identityFixture(
  overrides: {
    readonly nickname?: string
    readonly fullName?: string
    readonly dni?: string
    readonly schoolYear?: string
  } = {},
) {
  identityCounter += 1
  const suffix = String(identityCounter).padStart(4, '0')
  // El apellido se compone con letras porque el validador de nombres no acepta
  // dígitos — un nombre con números no es un nombre, y el fixture tiene que
  // parecerse a lo que un chico escribe.
  const letters = [...suffix]
    .map((digit) => 'abcdefghij'[Number(digit)] ?? 'a')
    .join('')
  return {
    nickname: overrides.nickname ?? `Jugadora${suffix}`,
    fullName: overrides.fullName ?? `Ana Prueba${letters}`,
    dni: overrides.dni ?? `4${suffix}1234`,
    schoolYear: overrides.schoolYear ?? '3.º',
    privacyNoticeVersion: '1',
  }
}

export interface PlayedCareer {
  readonly descriptor: RunDescriptor
  readonly final: RunState
  readonly log: RunActionLog
  readonly serialized: unknown
}

/**
 * Juega una carrera completa contra el motor real.
 *
 * `quality` decide qué tan bien se responde cada Template, así que el mismo
 * helper produce una partida perfecta y una mediocre sin cambiar nada más: es
 * lo que permite probar que el mejor intento verificado es el que rankea.
 */
export function playCareer(
  descriptor: RunDescriptor,
  quality: (templateId: string) => SolutionQuality = () => 'optimal',
): PlayedCareer {
  // Las dependencias salen de la edición que el descriptor declara, no de la
  // vigente. Una partida emitida antes del congelamiento lleva la calibración
  // candidata, y jugarla con la oficial la rechazaría por versión — que es
  // exactamente lo que el servidor haría, y no lo que el test quiere probar.
  const edition =
    listEditions().find(
      (entry) => entry.versions.scoreVersion === descriptor.scoreVersion,
    ) ?? FULL_CAREER_EDITION
  const dependencies = edition.createDependencies()
  const created = createRun(descriptor, dependencies)
  if (!created.ok) {
    throw new Error(`no se pudo crear la run: ${created.error.kind}`)
  }

  let state = created.value.state
  let log = emptyActionLog(descriptor)

  for (let step = 0; step < 400 && state.status === 'active'; step += 1) {
    let command: GameCommand = { type: 'CONTINUE' }
    if (state.phase === 'challenge') {
      const view = activeChallengeView(state, dependencies)
      if (!view.ok || view.value === undefined) {
        throw new Error('no hay vista del desafío activo')
      }
      let answer
      try {
        answer = grade5Answer(
          view.value,
          dependencies,
          quality(view.value.ref.templateId),
          descriptor,
        )
      } catch {
        // No toda Template ofrece witness para toda calidad. Cuando falta, se
        // responde óptimo: lo que el test necesita es una carrera terminada.
        answer = grade5Answer(view.value, dependencies, 'optimal', descriptor)
      }
      command = {
        type: 'ANSWER',
        instanceId: view.value.ref.instanceId,
        answer,
      }
    }

    const next = transition(state, command, dependencies)
    if (!next.ok) {
      throw new Error(`el motor rechazó un comando: ${next.error.kind}`)
    }
    state = next.value.state
    log = appendAction(log, command)
  }

  if (state.status !== 'completed') {
    throw new Error(`la carrera quedó ${state.status}`)
  }

  return {
    descriptor,
    final: state,
    log,
    serialized: serializeActionLog(log),
  }
}

/** Emite un intento y juega su carrera, que es lo que un participante hace. */
export function playAttempt(
  seed: string,
  runId: string,
  quality?: (templateId: string) => SolutionQuality,
): PlayedCareer {
  const descriptor = FULL_CAREER_EDITION.createDescriptor(seed, runId)
  if (descriptor === undefined) {
    throw new Error('la seed no compone un plan')
  }
  return playCareer(descriptor, quality)
}

export function participantOf(row: ParticipantRow): ParticipantRow {
  return row
}
