import { describe, expect, it } from 'vitest'

import type { RunDescriptor } from '@/game'
import { startAttempt, submitAttempt } from '@/server/competition/attempts'
import { identifyParticipant } from '@/server/competition/participants'
import { loadPublicState } from '@/server/competition/ranking'
import type { ParticipantRow } from '@/server/persistence/competition/rows'
import {
  createTestContext,
  identityFixture,
  playCareer,
  type TestContext,
} from '../helpers/competition'

/**
 * La matriz de ataque, contra el servicio real.
 *
 * Cada caso es un intento concreto de quedarse con un puesto que no se jugó.
 * La propiedad que todos comparten es la misma: el servidor **falla cerrado**.
 * O rechaza con un código tipado, o ignora la afirmación del cliente — nunca la
 * cree a medias, y nunca deja el ranking contaminado.
 *
 * La última comprobación de cada caso es deliberadamente la misma: mirar el
 * leaderboard. Un rechazo que igual publica algo no sirve de nada.
 */

async function participantWithAttempt(context: TestContext): Promise<{
  readonly participant: ParticipantRow
  readonly attemptId: string
  readonly descriptor: RunDescriptor
}> {
  const registered = await identifyParticipant(
    context.participants,
    context.competition,
    identityFixture(),
  )
  if (!registered.ok) throw new Error(registered.error.code)
  const issued = await startAttempt(
    context,
    context.competition,
    registered.value.participant,
  )
  if (!issued.ok) throw new Error(issued.error.code)
  return {
    participant: registered.value.participant,
    attemptId: issued.value.attemptId,
    descriptor: issued.value.descriptor,
  }
}

async function expectEmptyLeaderboard(context: TestContext) {
  const state = await loadPublicState(context, context.competition, undefined)
  expect(state.leaderboard).toHaveLength(0)
  expect(state.totalRanked).toBe(0)
}

describe('el cliente afirma su propio resultado', () => {
  it('un payload con score, graduación y Prestige inventados no los usa', async () => {
    const context = await createTestContext()
    const { participant, attemptId, descriptor } =
      await participantWithAttempt(context)
    const played = playCareer(descriptor, () => 'functional')

    const honest = JSON.parse(JSON.stringify(played.serialized)) as Record<
      string,
      unknown
    >
    const tampered = {
      ...honest,
      score: 999_999,
      fairScore: 10_000,
      officialScore: 10_000,
      prestige: 100,
      prestigeScore: 100,
      graduated: true,
      quality: 'optimal',
      variants: ['la-que-yo-quiera'],
    }

    const result = await submitAttempt(
      context,
      context.competition,
      participant,
      attemptId,
      tampered,
    )
    if (!result.ok) throw new Error(result.error.code)

    // No se rechaza: se ignora. No hay ningún punto del camino donde esos
    // campos se lean, que es una propiedad más fuerte que rechazarlos por
    // nombre — rechazar obligaría a enumerar los nombres que alguien invente.
    expect(result.value.status).toBe('VERIFIED')
    expect(result.value.fairScore).toBeLessThan(10_000)
    expect(result.value.prestigeScore).not.toBe(100)

    const state = await loadPublicState(
      context,
      context.competition,
      participant,
    )
    expect(state.leaderboard[0]?.fairScore).toBe(result.value.fairScore)
  }, 60_000)
})

describe('el cliente cambia la emisión', () => {
  it('rechaza un log con otra seed', async () => {
    const context = await createTestContext()
    const { participant, attemptId, descriptor } =
      await participantWithAttempt(context)

    const otherSeed: RunDescriptor = {
      ...descriptor,
      seed: 'otra-seed' as never,
    }
    let played
    try {
      played = playCareer(otherSeed)
    } catch {
      // Cambiar la seed sin recomponer el plan ya no crea una run: el motor se
      // niega antes. Es el fail-closed más temprano posible, y vale como
      // resultado del ataque.
      await expectEmptyLeaderboard(context)
      return
    }

    const result = await submitAttempt(
      context,
      context.competition,
      participant,
      attemptId,
      played.serialized,
    )
    expect(result.ok).toBe(false)
    await expectEmptyLeaderboard(context)
  }, 60_000)

  it('rechaza un log con otra huella de plan', async () => {
    const context = await createTestContext()
    const { participant, attemptId, descriptor } =
      await participantWithAttempt(context)
    const played = playCareer(descriptor)

    const tampered = JSON.parse(JSON.stringify(played.serialized)) as {
      descriptor: Record<string, unknown>
    }
    tampered.descriptor['planFingerprint'] = 'f'.repeat(64)

    const result = await submitAttempt(
      context,
      context.competition,
      participant,
      attemptId,
      tampered,
    )
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error.code).toBe('RUN_VALIDATION_FAILED')
    await expectEmptyLeaderboard(context)
  }, 60_000)

  it('rechaza un log con otro runId', async () => {
    const context = await createTestContext()
    const { participant, attemptId, descriptor } =
      await participantWithAttempt(context)
    const played = playCareer(descriptor)

    const tampered = JSON.parse(JSON.stringify(played.serialized)) as {
      descriptor: Record<string, unknown>
    }
    tampered.descriptor['runId'] = 'un-run-que-nadie-emitio'

    const result = await submitAttempt(
      context,
      context.competition,
      participant,
      attemptId,
      tampered,
    )
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error.code).toBe('RUN_VALIDATION_FAILED')
    await expectEmptyLeaderboard(context)
  }, 60_000)

  it('rechaza una partida jugada en modo práctica', async () => {
    const context = await createTestContext()
    const { participant, attemptId, descriptor } =
      await participantWithAttempt(context)
    const played = playCareer(descriptor)

    const tampered = JSON.parse(JSON.stringify(played.serialized)) as {
      descriptor: Record<string, unknown>
    }
    tampered.descriptor['mode'] = 'practice'

    const result = await submitAttempt(
      context,
      context.competition,
      participant,
      attemptId,
      tampered,
    )
    expect(result.ok).toBe(false)
    await expectEmptyLeaderboard(context)
  }, 60_000)
})

describe('el cliente cambia las versiones', () => {
  const fields = [
    ['gameVersion', '99.0.0'],
    ['rulesetVersion', '9.9.9-inventada'],
    ['contentVersion', '9.9.9-inventada'],
    ['variantCatalogVersion', 'catalogo-que-no-existe'],
    ['scoreVersion', '9.9.9-mi-calibracion'],
  ] as const

  for (const [field, value] of fields) {
    it(`rechaza un log con ${field} distinta de la emitida`, async () => {
      const context = await createTestContext()
      const { participant, attemptId, descriptor } =
        await participantWithAttempt(context)
      const played = playCareer(descriptor)

      const tampered = JSON.parse(JSON.stringify(played.serialized)) as {
        descriptor: Record<string, unknown>
      }
      tampered.descriptor[field] = value

      const result = await submitAttempt(
        context,
        context.competition,
        participant,
        attemptId,
        tampered,
      )
      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect([
          'ATTEMPT_VERSION_UNSUPPORTED',
          'RUN_VALIDATION_FAILED',
        ]).toContain(result.error.code)
      }
      await expectEmptyLeaderboard(context)
    }, 60_000)
  }

  it('no acepta un intento emitido bajo versiones que el servidor ya no tiene', async () => {
    const context = await createTestContext({
      competition: { rulesetVersion: '0.0.1-retirada' },
    })
    const registered = await identifyParticipant(
      context.participants,
      context.competition,
      identityFixture(),
    )
    if (!registered.ok) throw new Error(registered.error.code)

    const issued = await startAttempt(
      context,
      context.competition,
      registered.value.participant,
    )
    expect(issued.ok).toBe(false)
    if (!issued.ok) {
      expect(issued.error.code).toBe('ATTEMPT_VERSION_UNSUPPORTED')
    }
  }, 30_000)
})

describe('el cliente altera el log de acciones', () => {
  it('rechaza un log truncado a la mitad', async () => {
    const context = await createTestContext()
    const { participant, attemptId, descriptor } =
      await participantWithAttempt(context)
    const played = playCareer(descriptor)

    const tampered = JSON.parse(JSON.stringify(played.serialized)) as {
      actions: unknown[]
    }
    tampered.actions = tampered.actions.slice(0, 5)

    const result = await submitAttempt(
      context,
      context.competition,
      participant,
      attemptId,
      tampered,
    )
    // Una carrera sin terminar no egresa, así que no compite. Queda registrada
    // como rechazada para que el organizador la pueda ver.
    if (result.ok) {
      expect(result.value.status).toBe('REJECTED')
    }
    await expectEmptyLeaderboard(context)
  }, 60_000)

  it('rechaza un comando extra después del egreso', async () => {
    const context = await createTestContext()
    const { participant, attemptId, descriptor } =
      await participantWithAttempt(context)
    const played = playCareer(descriptor)

    const tampered = JSON.parse(JSON.stringify(played.serialized)) as {
      actions: { sequence?: number }[]
    }
    const last = tampered.actions[tampered.actions.length - 1]
    tampered.actions.push({
      ...last,
      sequence: (last?.sequence ?? tampered.actions.length) + 1,
    })

    const result = await submitAttempt(
      context,
      context.competition,
      participant,
      attemptId,
      tampered,
    )
    if (result.ok) {
      expect(result.value.status).toBe('REJECTED')
    } else {
      expect(result.error.code).toBe('RUN_VALIDATION_FAILED')
    }
    await expectEmptyLeaderboard(context)
  }, 60_000)

  it('rechaza una transición imposible', async () => {
    const context = await createTestContext()
    const { participant, attemptId, descriptor } =
      await participantWithAttempt(context)
    const played = playCareer(descriptor)

    const tampered = JSON.parse(JSON.stringify(played.serialized)) as {
      actions: Record<string, unknown>[]
    }
    // Responder un desafío que no está activo: el motor no produce ese estado
    // y por lo tanto tampoco lo acepta al reproducirlo.
    tampered.actions[2] = {
      ...tampered.actions[2],
      command: {
        type: 'ANSWER',
        instanceId: 'inexistente',
        answer: { kind: 'choice', optionId: 'x' },
      },
    }

    const result = await submitAttempt(
      context,
      context.competition,
      participant,
      attemptId,
      tampered,
    )
    if (result.ok) {
      expect(result.value.status).toBe('REJECTED')
    } else {
      expect(result.error.code).toBe('RUN_VALIDATION_FAILED')
    }
    await expectEmptyLeaderboard(context)
  }, 60_000)

  it('rechaza basura que no es un log', async () => {
    const context = await createTestContext()
    const { participant, attemptId } = await participantWithAttempt(context)

    for (const payload of [
      null,
      42,
      'hola',
      {},
      { actions: 'no-es-una-lista' },
    ]) {
      const result = await submitAttempt(
        context,
        context.competition,
        participant,
        attemptId,
        payload,
      )
      expect(result.ok).toBe(false)
    }
    await expectEmptyLeaderboard(context)
  }, 30_000)
})

describe('el cliente usa el intento de otro', () => {
  it('no deja enviar el intento de otra persona', async () => {
    const context = await createTestContext()
    const victim = await participantWithAttempt(context)

    const attacker = await identifyParticipant(
      context.participants,
      context.competition,
      identityFixture(),
    )
    if (!attacker.ok) throw new Error(attacker.error.code)

    const played = playCareer(victim.descriptor)
    const result = await submitAttempt(
      context,
      context.competition,
      attacker.value.participant,
      victim.attemptId,
      played.serialized,
    )

    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error.code).toBe('ATTEMPT_NOT_OWNED')
    await expectEmptyLeaderboard(context)
  }, 60_000)

  it('no deja enviar un intento que no existe', async () => {
    const context = await createTestContext()
    const { participant } = await participantWithAttempt(context)
    const result = await submitAttempt(
      context,
      context.competition,
      participant,
      '00000000-0000-4000-8000-000000000999',
      {},
    )
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error.code).toBe('ATTEMPT_NOT_FOUND')
  }, 30_000)

  it('no deja reusar una partida buena bajo otro intento propio', async () => {
    const context = await createTestContext()
    const first = await participantWithAttempt(context)
    const played = playCareer(first.descriptor)

    const submitted = await submitAttempt(
      context,
      context.competition,
      first.participant,
      first.attemptId,
      played.serialized,
    )
    if (!submitted.ok) throw new Error('el primero falló')

    // Segundo intento del mismo participante: el runId es otro, así que el log
    // de la primera partida ya no corresponde a esta emisión.
    const second = await startAttempt(
      context,
      context.competition,
      first.participant,
    )
    if (!second.ok) throw new Error(second.error.code)

    const replayed = await submitAttempt(
      context,
      context.competition,
      first.participant,
      second.value.attemptId,
      played.serialized,
    )
    expect(replayed.ok).toBe(false)
    if (!replayed.ok) expect(replayed.error.code).toBe('RUN_VALIDATION_FAILED')

    const state = await loadPublicState(
      context,
      context.competition,
      first.participant,
    )
    expect(state.you?.attempts).toBe(2)
    expect(state.totalRanked).toBe(1)
  }, 90_000)
})

describe('el cliente juega fuera de hora', () => {
  it('rechaza un envío después de la tolerancia', async () => {
    const context = await createTestContext({
      now: '2026-10-03T15:00:00.000Z',
      competition: {
        opensAt: '2026-10-03T13:00:00.000Z',
        closesAt: '2026-10-03T18:00:00.000Z',
        submissionGraceSeconds: 300,
      },
    })
    const { participant, attemptId, descriptor } =
      await participantWithAttempt(context)
    const played = playCareer(descriptor)

    const late = await createTestContext({
      store: context.store,
      now: '2026-10-03T18:10:00.000Z',
      competition: { slug: 'otra-edicion' },
    })

    const result = await submitAttempt(
      { store: context.store, clock: late.clock },
      context.competition,
      participant,
      attemptId,
      played.serialized,
    )
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error.code).toBe('SUBMISSION_TOO_LATE')
    await expectEmptyLeaderboard(context)
  }, 60_000)

  it('no deja empezar una partida con la competencia cerrada', async () => {
    const context = await createTestContext({
      competition: { status: 'CLOSED' },
    })
    const registered = await identifyParticipant(
      context.participants,
      context.competition,
      identityFixture(),
    )
    if (!registered.ok) throw new Error(registered.error.code)

    const issued = await startAttempt(
      context,
      context.competition,
      registered.value.participant,
    )
    expect(issued.ok).toBe(false)
    if (!issued.ok) expect(issued.error.code).toBe('COMPETITION_CLOSED')
  }, 30_000)
})

describe('el resultado rechazado nunca se publica', () => {
  it('un intento rechazado queda registrado y fuera del ranking', async () => {
    const context = await createTestContext()
    const { participant, attemptId, descriptor } =
      await participantWithAttempt(context)
    const played = playCareer(descriptor)

    const tampered = JSON.parse(JSON.stringify(played.serialized)) as {
      actions: unknown[]
    }
    tampered.actions = tampered.actions.slice(0, 4)

    await submitAttempt(
      context,
      context.competition,
      participant,
      attemptId,
      tampered,
    )

    const stored = await context.store.findAttemptById(attemptId)
    expect(stored?.status).toBe('REJECTED')
    expect(stored?.rejectionCode).toBeDefined()
    // La evidencia se conserva para que el organizador la pueda revisar.
    expect(stored?.actionLog).toBeDefined()
    await expectEmptyLeaderboard(context)
  }, 60_000)
})
