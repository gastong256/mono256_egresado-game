import { describe, expect, it } from 'vitest'

import { startAttempt, submitAttempt } from '@/server/competition/attempts'
import { identifyParticipant } from '@/server/competition/participants'
import {
  canOpenCompetition,
  frozenCompetitionFields,
  operationalCompetitionFields,
  releaseBindingIssues,
} from '@/server/competition/freeze'
import { setCompetitionStatus } from '@/server/competition/organizer'
import {
  FULL_CAREER_EDITION,
  FULL_CAREER_TG1_CANDIDATE_EDITION,
  listEditions,
  resolveEdition,
} from '@/server/competition/editions'
import { InMemoryCompetitionStore } from '@/server/persistence/competition/memory-store'
import type {
  CompetitionRow,
  ParticipantRow,
} from '@/server/persistence/competition/rows'
import { currentRelease } from '@/release'
import { candidateFairScorePolicy, officialFairScorePolicy } from '@/game'
import {
  competitionFixture,
  createTestContext,
  identityFixture,
  playCareer,
  TEST_COMPETITION_SEED,
  TEST_SCHOOL_YEARS,
  TEST_IDENTITY_SECRET,
  type TestContext,
} from '../helpers/competition'

/**
 * El congelamiento, probado en el borde del dominio y no en la interfaz.
 *
 * Dos afirmaciones distintas viven acá y conviene no confundirlas.
 *
 * La primera es que **los campos competitivos no se pueden mover**. No hace
 * falta un estado `FROZEN` para eso: no existe una operación que los mueva. El
 * puerto de persistencia acepta cuatro columnas y ninguna es la seed, la tupla
 * ni la versión del aviso. Esa es una garantía de tipo, y lo que se prueba acá
 * es que sigue siéndolo — un `updateCompetition` que mañana acepte un campo más
 * tiene que romper un test, no pasar inadvertido.
 *
 * La segunda es que **abrir exige corresponder al release**. Una edición creada
 * antes del FREEZE tiene campos perfectamente inmutables que sencillamente no
 * son los de Fair Edition v1, y ponerla a recibir partidas dejaría a los chicos
 * jugando una competencia que el release no describe.
 */

async function register(context: TestContext): Promise<ParticipantRow> {
  const result = await identifyParticipant(
    context.participants,
    context.competition,
    identityFixture(),
  )
  if (!result.ok) throw new Error(`no se registró: ${result.error.code}`)
  return result.value.participant
}

function organizerDependencies(context: TestContext) {
  return {
    store: context.store,
    clock: context.clock,
    config: {
      slug: context.competition.slug,
      identitySecret: TEST_IDENTITY_SECRET,
      privacy: {
        name: 'Escuela de prueba',
        contact: 'privacidad@escuela.test',
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

describe('los campos competitivos no se pueden mover', () => {
  it('el puerto de persistencia sólo acepta las columnas operativas', async () => {
    const store = new InMemoryCompetitionStore()
    const competition = await store.insertCompetition(competitionFixture())

    // El objeto que se pasa está tipado: agregarle `runSeed` no compila. Lo que
    // este test comprueba es lo que un `as` podría ocultar — que la
    // implementación tampoco lo copiaría si llegara.
    const updated = await store.updateCompetition(competition.id, {
      status: 'CLOSED',
      opensAt: '2026-10-03T13:00:00.000Z',
      closesAt: '2026-10-03T18:00:00.000Z',
      resultsFrozenAt: '2026-10-03T19:00:00.000Z',
      ...({
        runSeed: 'otra-seed',
        scoreVersion: 'inventada',
        privacyNoticeVersion: '99',
        variantCatalogVersion: 'otro-catalogo',
      } as unknown as Record<string, never>),
    })

    expect(updated?.status).toBe('CLOSED')
    expect(updated?.runSeed).toBe(competition.runSeed)
    expect(updated?.scoreVersion).toBe(competition.scoreVersion)
    expect(updated?.privacyNoticeVersion).toBe(competition.privacyNoticeVersion)
    expect(updated?.variantCatalogVersion).toBe(
      competition.variantCatalogVersion,
    )
    expect(updated?.runPlanFingerprint).toBe(competition.runPlanFingerprint)
  })

  it('el manifiesto lista exactamente los campos que están congelados', () => {
    const frozen = frozenCompetitionFields()
    for (const field of [
      'runSeed',
      'runPlanFingerprint',
      'engineVersion',
      'rulesetVersion',
      'contentVersion',
      'variantCatalogVersion',
      'scoreVersion',
      'actionLogVersion',
      'snapshotVersion',
      'privacyNoticeVersion',
    ]) {
      expect(frozen).toContain(field)
    }
    // Y los operativos son justamente los que el puerto acepta.
    expect([...operationalCompetitionFields()].sort()).toEqual([
      'closesAt',
      'opensAt',
      'resultsFrozenAt',
      'status',
    ])
    for (const field of operationalCompetitionFields()) {
      expect(frozen).not.toContain(field)
    }
  })
})

describe('abrir exige corresponder al release congelado', () => {
  it('una edición de Fair Edition v1 se puede abrir', async () => {
    const context = await createTestContext({
      competition: { status: 'DRAFT' },
    })
    expect(releaseBindingIssues(context.competition)).toEqual([])

    const result = await setCompetitionStatus(
      organizerDependencies(context),
      'docente',
      context.competition,
      'OPEN',
      'apertura de la feria',
    )
    expect(result.ok && result.value.status).toBe('OPEN')
  })

  it.each([
    ['scoreVersion', { scoreVersion: candidateFairScorePolicy.version }],
    ['contentVersion', { contentVersion: '4.4.0-grade-4' }],
    ['variantCatalogVersion', { variantCatalogVersion: 'grade-4-dev-5' }],
    ['rulesetVersion', { rulesetVersion: '0.9.0-otra' }],
    ['engineVersion', { engineVersion: '9.0.0' }],
    ['actionLogVersion', { actionLogVersion: 6 }],
    ['snapshotVersion', { snapshotVersion: 7 }],
  ])(
    'una edición cuyo %s no es el del release no se puede abrir',
    async (field, override) => {
      const context = await createTestContext({
        competition: {
          status: 'DRAFT',
          ...(override as Partial<CompetitionRow>),
        },
      })

      const issues = releaseBindingIssues(context.competition)
      expect(issues.map((issue) => issue.field)).toContain(field)

      const blocked = canOpenCompetition(context.competition)
      expect(blocked?.code).toBe('COMPETITION_NOT_CONFIGURED')

      const result = await setCompetitionStatus(
        organizerDependencies(context),
        'docente',
        context.competition,
        'OPEN',
        'apertura de la feria',
      )
      expect(result.ok).toBe(false)

      // Y la fila no se movió: un rechazo no deja la competencia a medias.
      const stored = await context.store.findCompetitionById(
        context.competition.id,
      )
      expect(stored?.status).toBe('DRAFT')
    },
  )

  it('cerrar y archivar una edición vieja sigue siendo posible', async () => {
    // Negarse a **abrir** es la garantía; negarse a cerrar dejaría a un
    // organizador sin forma de sacar de circulación una edición equivocada.
    const context = await createTestContext({
      competition: {
        status: 'OPEN',
        scoreVersion: candidateFairScorePolicy.version,
      },
    })
    for (const status of ['CLOSED', 'ARCHIVED'] as const) {
      const result = await setCompetitionStatus(
        organizerDependencies(context),
        'docente',
        { ...context.competition, status: 'OPEN' },
        status,
        'edición previa al congelamiento',
      )
      expect(result.ok).toBe(true)
    }
  })

  it('una edición sin seed o sin huella de plan no se puede abrir', async () => {
    for (const override of [
      { runSeed: '' },
      { runPlanFingerprint: '' },
      { privacyNoticeVersion: '' },
    ]) {
      const context = await createTestContext({
        competition: { status: 'DRAFT', ...override },
      })
      expect(canOpenCompetition(context.competition)).toBeDefined()
    }
  })
})

describe('el registro de ediciones', () => {
  it('resuelve por identidad exacta y nunca por aproximación', () => {
    expect(resolveEdition(FULL_CAREER_EDITION.versions)?.id).toBe(
      'full-career-v1',
    )
    expect(
      resolveEdition({
        ...FULL_CAREER_EDITION.versions,
        scoreVersion: 'inventada',
      }),
    ).toBeUndefined()
  })

  it('la edición de v1 fija la política oficial y el release la nombra', () => {
    expect(FULL_CAREER_EDITION.versions.scoreVersion).toBe(
      officialFairScorePolicy.version,
    )
    expect(FULL_CAREER_EDITION.versions.scoreVersion).toBe(
      currentRelease().score.policyVersion,
    )
  })

  it('dos ediciones nunca declaran la misma tupla', () => {
    const tuples = listEditions().map((edition) =>
      JSON.stringify(edition.versions),
    )
    expect(new Set(tuples).size).toBe(tuples.length)
  })
})

describe('la migración desde una competencia de STAGE-09', () => {
  /**
   * El caso real del upgrade: una edición creada antes del FREEZE, con
   * `fair-score-dev-2` congelado en su fila y partidas ya jugadas.
   */
  async function stage09Context(): Promise<TestContext> {
    return createTestContext({
      competition: {
        status: 'OPEN',
        scoreVersion: candidateFairScorePolicy.version,
      },
    })
  }

  it('sigue resolviendo su edición, así que sus intentos se pueden verificar', async () => {
    const context = await stage09Context()
    const edition = resolveEdition({
      engineVersion: context.competition.engineVersion,
      rulesetVersion: context.competition.rulesetVersion,
      contentVersion: context.competition.contentVersion,
      variantCatalogVersion: context.competition.variantCatalogVersion,
      scoreVersion: context.competition.scoreVersion,
      actionLogVersion: context.competition.actionLogVersion,
      snapshotVersion: context.competition.snapshotVersion,
    })
    expect(edition?.id).toBe(FULL_CAREER_TG1_CANDIDATE_EDITION.id)
  })

  it('una partida emitida bajo la candidata todavía se verifica y puntúa', async () => {
    const context = await stage09Context()
    const participant = await register(context)

    const issued = await startAttempt(context, context.competition, participant)
    if (!issued.ok) throw new Error(`no emitió: ${issued.error.code}`)
    expect(issued.value.descriptor.scoreVersion).toBe(
      candidateFairScorePolicy.version,
    )

    const played = playCareer(issued.value.descriptor)
    const submitted = await submitAttempt(
      context,
      context.competition,
      participant,
      issued.value.attemptId,
      played.serialized,
    )
    if (!submitted.ok) throw new Error(`no verificó: ${submitted.error.code}`)
    expect(submitted.value.status).toBe('VERIFIED')
    expect(submitted.value.fairScore).toBeGreaterThan(0)
  })

  it('pero no se puede reabrir bajo el release congelado', async () => {
    const context = await stage09Context()
    const blocked = canOpenCompetition(context.competition)
    expect(blocked?.code).toBe('COMPETITION_NOT_CONFIGURED')
    expect(blocked?.detail).toContain('scoreVersion')
  })

  it('una edición nueva nace con la tupla oficial', async () => {
    const store = new InMemoryCompetitionStore()
    const competition = await store.insertCompetition(
      competitionFixture({ slug: 'feria-2026', status: 'DRAFT' }),
    )
    expect(competition.scoreVersion).toBe(officialFairScorePolicy.version)
    expect(competition.runSeed).toBe(TEST_COMPETITION_SEED)
    expect(releaseBindingIssues(competition)).toEqual([])
  })
})
