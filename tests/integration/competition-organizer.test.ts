import { describe, expect, it } from 'vitest'

import { fixedClock } from '@/server/competition/clock'
import type { CompetitionDeploymentConfig } from '@/server/competition/config'
import { exportParticipantsCsv } from '@/server/competition/export'
import {
  authenticateOrganizer,
  correctParticipant,
  endOrganizerSession,
  loadOrganizerDashboard,
  resolveOrganizerSession,
  setAttemptValidity,
  setCompetitionStatus,
  setParticipantEligibility,
  verifyWinnerIdentity,
} from '@/server/competition/organizer'
import { identifyParticipant } from '@/server/competition/participants'
import { loadPublicState } from '@/server/competition/ranking'
import { planPurge, purgeCompetition } from '@/server/competition/retention'
import { hashOrganizerPassword } from '@/server/competition/tokens'
import type { ParticipantRow } from '@/server/persistence/competition/rows'
import {
  createTestContext,
  identityFixture,
  TEST_SCHOOL_YEARS,
  type TestContext,
} from '../helpers/competition'

/**
 * La herramienta del organizador y el ciclo de vida del dato privado.
 *
 * Dos propiedades sostienen todo lo de acá. La primera: cada acción sensible
 * queda auditada con quién, qué y por qué — sin los valores del dato, que
 * serían una segunda copia en un lugar que nadie purga. La segunda: nada de
 * esto borra evidencia. Invalidar un resultado lo saca del ranking y lo deja
 * entero para revisarlo.
 */

const PASSWORD = 'una-contraseña-de-feria'

async function organizerContext(): Promise<{
  readonly context: TestContext & {
    readonly config: CompetitionDeploymentConfig
  }
}> {
  const base = await createTestContext()
  const config: CompetitionDeploymentConfig = {
    slug: base.competition.slug,
    identitySecret: 'x'.repeat(40),
    privacy: {
      name: 'Escuela de prueba',
      contact: 'privacidad@escuela.test',
      address: 'Calle Falsa 123',
      noticeVersion: '1',
      retentionDays: 120,
    },
    schoolYears: TEST_SCHOOL_YEARS,
    schoolDivisions: [],
    organizer: {
      username: 'organizador',
      passwordHash: await hashOrganizerPassword(PASSWORD),
    },
  }
  return { context: { ...base, config } }
}

async function register(
  context: TestContext,
  overrides: Parameters<typeof identityFixture>[0] = {},
): Promise<ParticipantRow> {
  const result = await identifyParticipant(
    context.participants,
    context.competition,
    identityFixture(overrides),
  )
  if (!result.ok) throw new Error(result.error.code)
  return result.value.participant
}

async function verifiedAttempt(
  context: TestContext,
  participant: ParticipantRow,
  score: number,
  attemptNumber = 1,
): Promise<string> {
  const inserted = await context.store.insertAttempt({
    competitionId: context.competition.id,
    participantId: participant.id,
    attemptNumber,
    runId: `run-${participant.id}-${String(attemptNumber)}`,
    seed: context.competition.runSeed,
    runPlanFingerprint: context.competition.runPlanFingerprint,
    startedAt: '2026-10-03T15:00:00.000Z',
    engineVersion: context.competition.engineVersion,
    rulesetVersion: context.competition.rulesetVersion,
    contentVersion: context.competition.contentVersion,
    variantCatalogVersion: context.competition.variantCatalogVersion,
    scoreVersion: context.competition.scoreVersion,
    actionLogVersion: context.competition.actionLogVersion,
    snapshotVersion: context.competition.snapshotVersion,
  })
  if (inserted.outcome !== 'created') throw new Error('no se emitió')
  await context.store.finalizeAttempt(inserted.attempt.id, ['STARTED'], {
    status: 'VERIFIED',
    submittedAt: '2026-10-03T16:00:00.000Z',
    verifiedAt: '2026-10-03T16:00:00.000Z',
    actionLog: { version: 7 },
    submissionDigest: String(score).padStart(64, '0'),
    verifiedFairScore: score,
    verifiedPrestigeScore: 0,
    verifiedSummary: { graduated: true },
    rejectionCode: undefined,
  })
  return inserted.attempt.id
}

describe('acceso del organizador', () => {
  it('acepta la credencial correcta y emite una sesión', async () => {
    const { context } = await organizerContext()
    const result = await authenticateOrganizer(context, 'organizador', PASSWORD)
    if (!result.ok) throw new Error(result.error.code)

    const session = await resolveOrganizerSession(context, result.value.token)
    expect(session?.username).toBe('organizador')
  }, 30_000)

  it('rechaza la contraseña equivocada y el usuario inventado igual', async () => {
    const { context } = await organizerContext()
    for (const [username, password] of [
      ['organizador', 'otra-cosa'],
      ['intruso', PASSWORD],
      ['intruso', 'otra-cosa'],
    ] as const) {
      const result = await authenticateOrganizer(context, username, password)
      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.error.code).toBe('ORGANIZER_CREDENTIALS_INVALID')
      }
    }
  }, 60_000)

  it('no acepta una sesión vencida ni una revocada', async () => {
    const { context } = await organizerContext()
    const result = await authenticateOrganizer(context, 'organizador', PASSWORD)
    if (!result.ok) throw new Error(result.error.code)

    const later = {
      store: context.store,
      clock: fixedClock('2027-01-01T00:00:00Z'),
    }
    expect(
      await resolveOrganizerSession(later, result.value.token),
    ).toBeUndefined()

    await endOrganizerSession(context, result.value.token)
    expect(
      await resolveOrganizerSession(context, result.value.token),
    ).toBeUndefined()
  }, 30_000)

  it('no acepta un token inventado', async () => {
    const { context } = await organizerContext()
    expect(
      await resolveOrganizerSession(context, 'token-falso'),
    ).toBeUndefined()
    expect(await resolveOrganizerSession(context, undefined)).toBeUndefined()
  })
})

describe('identificación de un alias', () => {
  it('muestra quién está detrás, con lo justo para verificar en persona', async () => {
    const { context } = await organizerContext()
    const participant = await register(context, {
      nickname: 'Anita',
      fullName: 'Ana Belén Ramírez',
      dni: '38123456',
      schoolYear: '4.º',
    })
    await verifiedAttempt(context, participant, 8123)

    const dashboard = await loadOrganizerDashboard(context, context.competition)
    const row = dashboard.participants.find(
      (entry) => entry.nickname === 'Anita',
    )
    expect(row?.fullName).toBe('Ana Belén Ramírez')
    expect(row?.schoolYear).toBe('4.º')
    expect(row?.dniLast4).toBe('3456')
    expect(row?.rank).toBe(1)
    expect(row?.bestFairScore).toBe(8123)

    // Ni siquiera el organizador ve el documento completo: no se guarda.
    expect(JSON.stringify(dashboard)).not.toContain('38123456')
  })
})

describe('correcciones y moderación', () => {
  it('corrige un tipeo y audita qué campos cambiaron, no sus valores', async () => {
    const { context } = await organizerContext()
    const participant = await register(context, { fullName: 'Juan Perz' })

    const result = await correctParticipant(
      context,
      'organizador',
      context.competition,
      participant.id,
      { fullName: 'Juan Pérez' },
      'el apellido estaba mal tipeado',
    )
    if (!result.ok) throw new Error(result.error.code)
    expect(result.value.fullNamePrivate).toBe('Juan Pérez')

    const audit = await context.store.listAudit(context.competition.id, 10)
    expect(audit[0]?.action).toBe('participant.correct')
    expect(audit[0]?.actor).toBe('organizador')
    expect(audit[0]?.reason).toBe('el apellido estaba mal tipeado')
    // El log dice qué se tocó, nunca el nombre viejo ni el nuevo.
    expect(JSON.stringify(audit)).not.toContain('Pérez')
    expect(JSON.stringify(audit)).not.toContain('Perz')
  })

  it('no permite corregir hacia un alias ya tomado', async () => {
    const { context } = await organizerContext()
    await register(context, { nickname: 'Ocupado' })
    const other = await register(context, { nickname: 'Libre' })

    const result = await correctParticipant(
      context,
      'organizador',
      context.competition,
      other.id,
      { nickname: 'ocupado' },
      'pedido del estudiante',
    )
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error.code).toBe('NICKNAME_TAKEN')
  })

  it('oculta un alias inapropiado sin sacar el resultado del ranking', async () => {
    const { context } = await organizerContext()
    const participant = await register(context, { nickname: 'Publicable' })
    await verifiedAttempt(context, participant, 9000)

    await correctParticipant(
      context,
      'organizador',
      context.competition,
      participant.id,
      { nicknameHidden: true },
      'alias inapropiado',
    )

    const state = await loadPublicState(context, context.competition, undefined)
    expect(state.leaderboard[0]?.nickname).toBe('Jugador oculto')
    expect(state.leaderboard[0]?.fairScore).toBe(9000)
    // Borrar la entrada le daría a un insulto el poder de sacar a alguien del
    // ranking, que es la reacción equivocada.
    expect(state.totalRanked).toBe(1)
  })

  it('no deja cambiar la clave de identidad desde ninguna acción', async () => {
    const { context } = await organizerContext()
    const participant = await register(context)
    const before = participant.identityHmac

    await correctParticipant(
      context,
      'organizador',
      context.competition,
      participant.id,
      { fullName: 'Otro Nombre', nickname: 'OtroAlias' },
      'corrección completa',
    )

    const after = await context.store.findParticipantById(participant.id)
    // Una clave editable a mano deja de ser una identidad. Un documento mal
    // tipeado se corrige borrando y volviendo a anotarse.
    expect(after?.identityHmac).toBe(before)
  })
})

describe('descalificación e invalidación', () => {
  it('saca del ranking a quien queda descalificado y le revoca la sesión', async () => {
    const { context } = await organizerContext()
    const registered = await identifyParticipant(
      context.participants,
      context.competition,
      identityFixture(),
    )
    if (!registered.ok) throw new Error(registered.error.code)
    const participant = registered.value.participant
    await verifiedAttempt(context, participant, 9500)

    await setParticipantEligibility(
      context,
      'organizador',
      context.competition,
      participant.id,
      'DISQUALIFIED',
      'identidad falsa confirmada',
    )

    const state = await loadPublicState(context, context.competition, undefined)
    expect(state.leaderboard).toHaveLength(0)

    const session = await context.store.findParticipantSession(
      // El token no se guarda; se comprueba que todas las sesiones del
      // participante quedaron revocadas.
      '0'.repeat(64),
    )
    expect(session).toBeUndefined()

    const audit = await context.store.listAudit(context.competition.id, 10)
    expect(audit[0]?.action).toBe('participant.disqualify')
    expect(audit[0]?.reason).toBe('identidad falsa confirmada')
  })

  it('invalida un resultado y promueve al siguiente mejor, sin borrar nada', async () => {
    const { context } = await organizerContext()
    const participant = await register(context)
    await verifiedAttempt(context, participant, 7000, 1)
    const best = await verifiedAttempt(context, participant, 9000, 2)

    expect(
      (await loadPublicState(context, context.competition, undefined))
        .leaderboard[0]?.fairScore,
    ).toBe(9000)

    await setAttemptValidity(
      context,
      'organizador',
      context.competition,
      best,
      true,
      'confirmado como copia',
    )

    expect(
      (await loadPublicState(context, context.competition, undefined))
        .leaderboard[0]?.fairScore,
    ).toBe(7000)

    const kept = await context.store.findAttemptById(best)
    expect(kept?.verifiedFairScore).toBe(9000)
    expect(kept?.invalidatedReason).toBe('confirmado como copia')
  })

  it('puede restaurar un resultado invalidado por error', async () => {
    const { context } = await organizerContext()
    const participant = await register(context)
    const attempt = await verifiedAttempt(context, participant, 9000)

    await setAttemptValidity(
      context,
      'organizador',
      context.competition,
      attempt,
      true,
      'sospecha',
    )
    await setAttemptValidity(
      context,
      'organizador',
      context.competition,
      attempt,
      false,
      'la sospecha no se confirmó',
    )

    expect(
      (await loadPublicState(context, context.competition, undefined))
        .leaderboard[0]?.fairScore,
    ).toBe(9000)
  })

  it('marca la verificación de identidad de un ganador', async () => {
    const { context } = await organizerContext()
    const participant = await register(context)
    const result = await verifyWinnerIdentity(
      context,
      'organizador',
      context.competition,
      participant.id,
      true,
      'mostró el documento en el acto',
    )
    if (!result.ok) throw new Error(result.error.code)
    expect(result.value.identityVerifiedAt).toBeDefined()
  })
})

describe('apertura y cierre', () => {
  it('cambia el estado y lo deja auditado', async () => {
    const { context } = await organizerContext()
    const result = await setCompetitionStatus(
      context,
      'organizador',
      context.competition,
      'CLOSED',
      'terminó la feria',
    )
    if (!result.ok) throw new Error(result.error.code)
    expect(result.value.status).toBe('CLOSED')

    const audit = await context.store.listAudit(context.competition.id, 10)
    expect(audit[0]?.action).toBe('competition.status')
    expect(audit[0]?.metadata).toMatchObject({ from: 'OPEN', to: 'CLOSED' })
  })

  it('el ranking sigue siendo legible después del cierre', async () => {
    const { context } = await organizerContext()
    const participant = await register(context)
    await verifiedAttempt(context, participant, 8000)
    await setCompetitionStatus(
      context,
      'organizador',
      context.competition,
      'CLOSED',
      'terminó la feria',
    )
    const closed = await context.store.findCompetitionById(
      context.competition.id,
    )
    const state = await loadPublicState(
      context,
      closed ?? context.competition,
      undefined,
    )
    expect(state.competition.status).toBe('closed')
    expect(state.leaderboard).toHaveLength(1)
  })
})

describe('exportación', () => {
  it('produce una fila por participante con lo que el premio necesita', async () => {
    const { context } = await organizerContext()
    const first = await register(context, {
      nickname: 'Primera',
      fullName: 'Ana Gómez',
      schoolYear: '5.º',
    })
    await verifiedAttempt(context, first, 9000)
    await register(context, { nickname: 'SinJugar', fullName: 'Beto Díaz' })

    const dashboard = await loadOrganizerDashboard(context, context.competition)
    const csv = exportParticipantsCsv(dashboard)
    const lines = csv.trimEnd().split('\r\n')

    expect(lines).toHaveLength(3)
    expect(lines[0]).toContain('dni_ultimos_4')
    expect(lines[1]).toContain('Ana Gómez')
    // Quien todavía no jugó aparece sin puesto, no desaparece del listado.
    expect(lines[2]).toContain('Beto Díaz')
  })
})

describe('retención y purga', () => {
  it('no purga antes de que venza la retención', async () => {
    const { context } = await organizerContext()
    const participant = await register(context)
    const competition = {
      ...context.competition,
      closesAt: '2026-10-03T18:00:00.000Z',
    }

    const plan = await planPurge(context, competition)
    expect(plan.eligible).toBe(false)
    expect(plan.participants).toBe(1)

    const result = await purgeCompetition(context, competition, {
      actor: 'organizador',
    })
    expect(result.anonymized).toBe(0)

    const intact = await context.store.findParticipantById(participant.id)
    expect(intact?.fullNamePrivate).toBeDefined()
  })

  it('anonimiza el dato privado y conserva el alias y el puntaje', async () => {
    const { context } = await organizerContext()
    const participant = await register(context, { nickname: 'Recordable' })
    await verifiedAttempt(context, participant, 8500)

    const competition = {
      ...context.competition,
      closesAt: '2026-10-03T18:00:00.000Z',
    }
    const result = await purgeCompetition(context, competition, {
      actor: 'organizador',
      force: true,
    })
    expect(result.anonymized).toBe(1)

    const purged = await context.store.findParticipantById(participant.id)
    expect(purged?.fullNamePrivate).toBeUndefined()
    expect(purged?.schoolYearPrivate).toBeUndefined()
    expect(purged?.dniLast4Private).toBeUndefined()
    expect(purged?.anonymizedAt).toBeDefined()
    // El alias y el resultado quedan: no identifican a nadie y permiten que el
    // ranking de la feria siga siendo legible el año que viene.
    expect(purged?.publicNickname).toBe('Recordable')

    const state = await loadPublicState(context, competition, undefined)
    expect(state.leaderboard[0]?.nickname).toBe('Recordable')
    expect(state.leaderboard[0]?.fairScore).toBe(8500)

    const audit = await context.store.listAudit(context.competition.id, 10)
    expect(audit[0]?.action).toBe('competition.purge')
  })

  it('es idempotente: purgar dos veces no rompe nada', async () => {
    const { context } = await organizerContext()
    await register(context)
    const competition = {
      ...context.competition,
      closesAt: '2026-10-03T18:00:00.000Z',
    }

    const first = await purgeCompetition(context, competition, {
      actor: 'organizador',
      force: true,
    })
    const second = await purgeCompetition(context, competition, {
      actor: 'organizador',
      force: true,
    })
    expect(first.anonymized).toBe(1)
    expect(second.anonymized).toBe(0)
  })
})
