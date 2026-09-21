import { describe, expect, it } from 'vitest'

import {
  canStartAttempt,
  canSubmitAttempt,
  startAttempt,
  submitAttempt,
} from '@/server/competition/attempts'
import {
  forgetParticipantSession,
  identifyParticipant,
  resolveParticipantSession,
} from '@/server/competition/participants'
import { loadPublicState } from '@/server/competition/ranking'
import { InMemoryCompetitionStore } from '@/server/persistence/competition/memory-store'
import type { ParticipantRow } from '@/server/persistence/competition/rows'
import {
  createTestContext,
  identityFixture,
  playCareer,
  type TestContext,
} from '../helpers/competition'

/**
 * El ciclo completo de una competencia, contra el motor real.
 *
 * Las carreras de este archivo se **juegan**: nueve beats en seis años, con las
 * respuestas que producen los witnesses de autoría. Un log inventado probaría
 * que el servidor acepta lo que el test escribió; una carrera jugada prueba que
 * acepta lo que el juego produce, que es la afirmación que sostiene un ranking.
 *
 * Todas las pruebas usan reloj inyectado. La hora que decide si una competencia
 * está abierta es la del servidor, y probarlo con el reloj de la máquina haría
 * que el test dependa de cuándo se corre.
 */

async function register(
  context: TestContext,
  overrides: Parameters<typeof identityFixture>[0] = {},
): Promise<{ participant: ParticipantRow; token: string }> {
  const result = await identifyParticipant(
    context.participants,
    context.competition,
    identityFixture(overrides),
  )
  if (!result.ok) {
    throw new Error(`no se pudo registrar: ${result.error.code}`)
  }
  return {
    participant: result.value.participant,
    token: result.value.sessionToken,
  }
}

async function playAndSubmit(
  context: TestContext,
  participant: ParticipantRow,
  quality?: Parameters<typeof playCareer>[1],
) {
  const issued = await startAttempt(context, context.competition, participant)
  if (!issued.ok) throw new Error(`no se emitió: ${issued.error.code}`)
  const played = playCareer(issued.value.descriptor, quality)
  const submitted = await submitAttempt(
    context,
    context.competition,
    participant,
    issued.value.attemptId,
    played.serialized,
  )
  return { issued: issued.value, played, submitted }
}

describe('identificación', () => {
  it('crea un participante y le da una sesión que lo reconoce', async () => {
    const context = await createTestContext()
    const { participant, token } = await register(context, {
      nickname: 'Sofi',
      fullName: 'Sofía Gómez',
      dni: '45123456',
    })

    expect(participant.publicNickname).toBe('Sofi')
    const session = await resolveParticipantSession(context, token)
    expect(session?.participant.id).toBe(participant.id)
  })

  it('no guarda el documento en ninguna parte de la fila', async () => {
    const context = await createTestContext()
    const { participant } = await register(context, { dni: '45.123.456' })
    const serialized = JSON.stringify(participant)
    expect(serialized).not.toContain('45123456')
    expect(serialized).not.toContain('45.123.456')
    expect(participant.dniLast4Private).toBe('3456')
    expect(participant.identityHmac).toMatch(/^[0-9a-f]{64}$/u)
  })

  it('reconoce a la misma persona desde otro teléfono y conserva su alias', async () => {
    const context = await createTestContext()
    const first = await register(context, {
      nickname: 'Tomi',
      fullName: 'Tomás Pérez',
      dni: '46111222',
    })

    const again = await identifyParticipant(
      context.participants,
      context.competition,
      {
        // Escribe el documento con puntos y el nombre sin tilde, como en un
        // teclado de teléfono. Es la misma persona.
        ...identityFixture({
          nickname: 'OtroAlias',
          fullName: 'Tomas Perez',
          dni: '46.111.222',
        }),
      },
    )
    if (!again.ok) throw new Error(again.error.code)

    expect(again.value.created).toBe(false)
    expect(again.value.participant.id).toBe(first.participant.id)
    // El alias no cambia: es la identidad pública que otros ya vieron en el
    // ranking, y dejarla cambiar sola en cada reingreso la volvería inestable.
    expect(again.value.participant.publicNickname).toBe('Tomi')
  })

  it('no crea un duplicado ni revela nada cuando el nombre no coincide', async () => {
    const context = await createTestContext()
    await register(context, { fullName: 'Ana Ruiz', dni: '47000111' })

    const impostor = await identifyParticipant(
      context.participants,
      context.competition,
      identityFixture({ fullName: 'Carlos Otro', dni: '47000111' }),
    )

    expect(impostor.ok).toBe(false)
    if (impostor.ok) throw new Error('debería haber fallado')
    expect(impostor.error.code).toBe('IDENTITY_MISMATCH')
    // El error no dice de quién es el documento. Decirlo convertiría el
    // formulario en un oráculo sobre quién se anotó.
    expect(JSON.stringify(impostor.error)).not.toContain('Ana')

    expect(
      await context.store.listParticipants(context.competition.id),
    ).toHaveLength(1)
  })

  it('rechaza un alias ya tomado por otra persona', async () => {
    const context = await createTestContext()
    await register(context, { nickname: 'Repetido', dni: '48000111' })
    const clash = await identifyParticipant(
      context.participants,
      context.competition,
      identityFixture({ nickname: 'repetido', dni: '48000222' }),
    )
    expect(clash.ok).toBe(false)
    if (!clash.ok) expect(clash.error.code).toBe('NICKNAME_TAKEN')
  })

  it('exige la versión vigente del aviso de privacidad', async () => {
    const context = await createTestContext()
    const stale = await identifyParticipant(
      context.participants,
      context.competition,
      { ...identityFixture(), privacyNoticeVersion: '0' },
    )
    expect(stale.ok).toBe(false)
    if (!stale.ok) expect(stale.error.code).toBe('PRIVACY_NOTICE_REQUIRED')
  })

  it('«no soy yo» revoca sólo la sesión de este navegador', async () => {
    const context = await createTestContext()
    const { participant, token } = await register(context)
    const second = await identifyParticipant(
      context.participants,
      context.competition,
      identityFixture({
        nickname: participant.publicNickname,
        fullName: participant.fullNamePrivate ?? '',
        dni: '49000111',
      }),
    )
    expect(second.ok).toBe(false)

    await forgetParticipantSession(context, token)
    expect(await resolveParticipantSession(context, token)).toBeUndefined()
  })
})

describe('emisión de intentos', () => {
  it('emite la seed de la edición, no una propia', async () => {
    const context = await createTestContext()
    const { participant } = await register(context)
    const issued = await startAttempt(context, context.competition, participant)
    if (!issued.ok) throw new Error(issued.error.code)

    expect(issued.value.descriptor.seed).toBe(context.competition.runSeed)
    expect(issued.value.descriptor.planFingerprint).toBe(
      context.competition.runPlanFingerprint,
    )
    expect(issued.value.descriptor.mode).toBe('fair')
    expect(issued.value.descriptor.difficulty).toBe('fixed')
  }, 30_000)

  it('da a dos participantes el mismo juego y distinto runId', async () => {
    const context = await createTestContext()
    const first = await register(context)
    const second = await register(context)

    const a = await startAttempt(
      context,
      context.competition,
      first.participant,
    )
    const b = await startAttempt(
      context,
      context.competition,
      second.participant,
    )
    if (!a.ok || !b.ok) throw new Error('no se emitió')

    // Competition Seed compartida: el mismo plan para todos es lo que hace
    // comparable el ranking. El runId es lo único propio del intento.
    expect(a.value.descriptor.seed).toBe(b.value.descriptor.seed)
    expect(a.value.descriptor.planFingerprint).toBe(
      b.value.descriptor.planFingerprint,
    )
    expect(a.value.descriptor.runId).not.toBe(b.value.descriptor.runId)
  }, 30_000)

  it('devuelve la partida en curso en vez de abrir otra en paralelo', async () => {
    const context = await createTestContext()
    const { participant } = await register(context)

    const first = await startAttempt(context, context.competition, participant)
    const second = await startAttempt(context, context.competition, participant)
    if (!first.ok || !second.ok) throw new Error('no se emitió')

    expect(second.value.resumed).toBe(true)
    expect(second.value.attemptId).toBe(first.value.attemptId)
    expect(await context.store.countAttempts(participant.id)).toBe(1)
  }, 30_000)

  it('numera los intentos sin límite', async () => {
    const context = await createTestContext()
    const { participant } = await register(context)

    for (let round = 1; round <= 3; round += 1) {
      const issued = await startAttempt(
        context,
        context.competition,
        participant,
      )
      if (!issued.ok) throw new Error(issued.error.code)
      expect(issued.value.attemptNumber).toBe(round)
      await context.store.abandonAttempt(issued.value.attemptId)
    }
    // Cada emisión recompone el plan de nueve beats desde la seed, así que tres
    // emisiones no entran en el presupuesto por defecto cuando la suite entera
    // corre en paralelo.
  }, 30_000)

  it('no emite a un participante descalificado', async () => {
    const context = await createTestContext()
    const { participant } = await register(context)
    await context.store.updateParticipant(participant.id, {
      status: 'DISQUALIFIED',
      statusReason: 'prueba',
    })
    const current = await context.store.findParticipantById(participant.id)
    const issued = await startAttempt(
      context,
      context.competition,
      current ?? participant,
    )
    expect(issued.ok).toBe(false)
    if (!issued.ok) expect(issued.error.code).toBe('PARTICIPANT_DISQUALIFIED')
  }, 30_000)
})

describe('ventana de la competencia, medida por el servidor', () => {
  const opens = '2026-10-03T13:00:00.000Z'
  const closes = '2026-10-03T18:00:00.000Z'

  it('no deja empezar antes de la apertura', () => {
    const competition = {
      opensAt: opens,
      closesAt: closes,
      status: 'OPEN' as const,
    }
    const error = canStartAttempt(
      { ...baseCompetition(), ...competition },
      new Date('2026-10-03T12:59:59.999Z'),
    )
    expect(error?.code).toBe('COMPETITION_NOT_OPEN')
  })

  it('deja empezar exactamente en la apertura', () => {
    expect(
      canStartAttempt(
        { ...baseCompetition(), opensAt: opens, closesAt: closes },
        new Date(opens),
      ),
    ).toBeUndefined()
  })

  it('no deja empezar en el instante del cierre', () => {
    expect(
      canStartAttempt(
        { ...baseCompetition(), opensAt: opens, closesAt: closes },
        new Date(closes),
      )?.code,
    ).toBe('COMPETITION_CLOSED')
  })

  it('acepta un envío dentro de la tolerancia y lo rechaza después', () => {
    const competition = {
      ...baseCompetition(),
      closesAt: closes,
      submissionGraceSeconds: 300,
    }
    // Quien empezó a las 17:52 una carrera de doce minutos no hizo nada mal.
    expect(
      canSubmitAttempt(competition, new Date('2026-10-03T18:04:59.000Z')),
    ).toBeUndefined()
    expect(
      canSubmitAttempt(competition, new Date('2026-10-03T18:05:01.000Z'))?.code,
    ).toBe('SUBMISSION_TOO_LATE')
  })

  it('ignora lo que diga el reloj del cliente', async () => {
    const store = new InMemoryCompetitionStore()
    const context = await createTestContext({
      store,
      now: '2026-10-03T19:00:00.000Z',
      competition: { opensAt: opens, closesAt: closes },
    })
    const { participant } = await register(context)

    // El servicio nunca lee una hora del payload: sólo existe `clock`.
    const issued = await startAttempt(context, context.competition, participant)
    expect(issued.ok).toBe(false)
    if (!issued.ok) expect(issued.error.code).toBe('COMPETITION_CLOSED')
  }, 30_000)
})

function baseCompetition() {
  return {
    id: 'c1',
    slug: 's',
    name: 'n',
    status: 'OPEN' as const,
    opensAt: undefined,
    closesAt: undefined,
    submissionGraceSeconds: 300,
    runSeed: 'seed',
    runPlanFingerprint: 'fp',
    engineVersion: '10.0.0',
    rulesetVersion: 'r',
    contentVersion: 'c',
    variantCatalogVersion: 'v',
    scoreVersion: 's',
    actionLogVersion: 7,
    snapshotVersion: 8,
    privacyNoticeVersion: '1',
    retentionDays: 120,
    resultsFrozenAt: undefined,
  }
}

describe('envío y verificación autoritativa', () => {
  it('recompone el puntaje de una carrera real y la publica', async () => {
    const context = await createTestContext()
    const { participant } = await register(context, { nickname: 'Campeona' })
    const { submitted, played } = await playAndSubmit(context, participant)

    if (!submitted.ok) throw new Error(submitted.error.code)
    expect(submitted.value.status).toBe('VERIFIED')
    expect(submitted.value.graduated).toBe(true)
    expect(submitted.value.fairScore).toBeGreaterThan(0)
    expect(submitted.value.personalBest).toBe(true)
    expect(played.final.progression.graduated).toBe(true)

    const state = await loadPublicState(
      context,
      context.competition,
      participant,
    )
    expect(state.leaderboard[0]?.nickname).toBe('Campeona')
    expect(state.leaderboard[0]?.rank).toBe(1)
    expect(state.you?.rank).toBe(1)
  }, 60_000)

  it('la partida perfecta vale exactamente 10.000', async () => {
    const context = await createTestContext()
    const { participant } = await register(context)
    const { submitted } = await playAndSubmit(
      context,
      participant,
      () => 'optimal',
    )
    if (!submitted.ok) throw new Error(submitted.error.code)
    expect(submitted.value.fairScore).toBe(10000)
  }, 60_000)

  it('el mejor intento manda, sin importar el orden', async () => {
    const context = await createTestContext()
    const { participant } = await register(context)

    const weak = await playAndSubmit(context, participant, () => 'functional')
    if (!weak.submitted.ok) throw new Error('falló el primero')
    const weakScore = weak.submitted.value.fairScore ?? 0

    const strong = await playAndSubmit(context, participant, () => 'optimal')
    if (!strong.submitted.ok) throw new Error('falló el segundo')
    expect(strong.submitted.value.fairScore).toBeGreaterThan(weakScore)
    expect(strong.submitted.value.personalBest).toBe(true)

    // Y ahora al revés: una partida peor después no reemplaza a la mejor.
    const worse = await playAndSubmit(context, participant, () => 'functional')
    if (!worse.submitted.ok) throw new Error('falló el tercero')
    expect(worse.submitted.value.personalBest).toBe(false)

    const state = await loadPublicState(
      context,
      context.competition,
      participant,
    )
    expect(state.you?.bestFairScore).toBe(strong.submitted.value.fairScore)
    // Tres intentos, una sola fila en el ranking.
    expect(state.totalRanked).toBe(1)
    expect(state.you?.attempts).toBe(3)
  }, 180_000)

  it('un reenvío byte a byte devuelve el mismo resultado', async () => {
    const context = await createTestContext()
    const { participant } = await register(context)
    const issued = await startAttempt(context, context.competition, participant)
    if (!issued.ok) throw new Error(issued.error.code)
    const played = playCareer(issued.value.descriptor)

    const first = await submitAttempt(
      context,
      context.competition,
      participant,
      issued.value.attemptId,
      played.serialized,
    )
    const second = await submitAttempt(
      context,
      context.competition,
      participant,
      issued.value.attemptId,
      played.serialized,
    )

    if (!first.ok || !second.ok) throw new Error('un envío falló')
    expect(second.value.fairScore).toBe(first.value.fairScore)
    expect(second.value.attemptId).toBe(first.value.attemptId)
    expect(await context.store.countAttempts(participant.id)).toBe(1)
  }, 60_000)

  it('dos envíos simultáneos producen un solo resultado', async () => {
    const context = await createTestContext()
    const { participant } = await register(context)
    const issued = await startAttempt(context, context.competition, participant)
    if (!issued.ok) throw new Error(issued.error.code)
    const played = playCareer(issued.value.descriptor)

    const [a, b] = await Promise.all([
      submitAttempt(
        context,
        context.competition,
        participant,
        issued.value.attemptId,
        played.serialized,
      ),
      submitAttempt(
        context,
        context.competition,
        participant,
        issued.value.attemptId,
        played.serialized,
      ),
    ])

    expect(a.ok && b.ok).toBe(true)
    if (a.ok && b.ok) expect(a.value.fairScore).toBe(b.value.fairScore)

    const state = await loadPublicState(
      context,
      context.competition,
      participant,
    )
    expect(state.totalRanked).toBe(1)
  }, 60_000)

  it('un segundo envío distinto no reemplaza el resultado guardado', async () => {
    const context = await createTestContext()
    const { participant } = await register(context)
    const issued = await startAttempt(context, context.competition, participant)
    if (!issued.ok) throw new Error(issued.error.code)

    const good = playCareer(issued.value.descriptor, () => 'functional')
    const first = await submitAttempt(
      context,
      context.competition,
      participant,
      issued.value.attemptId,
      good.serialized,
    )
    if (!first.ok) throw new Error('el primero falló')

    const better = playCareer(issued.value.descriptor, () => 'optimal')
    const second = await submitAttempt(
      context,
      context.competition,
      participant,
      issued.value.attemptId,
      better.serialized,
    )

    expect(second.ok).toBe(false)
    if (!second.ok) expect(second.error.code).toBe('ATTEMPT_ALREADY_FINALIZED')

    const stored = await context.store.findAttemptById(issued.value.attemptId)
    expect(stored?.verifiedFairScore).toBe(first.value.fairScore)
  }, 120_000)
})
