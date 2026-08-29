import { describe, expect, it } from 'vitest'

import {
  activeChallengeView,
  appendAction,
  createRun,
  emptyActionLog,
  isErr,
  isOk,
  parseActionLog,
  scoreRun,
  scoredEventsOf,
  serializeActionLog,
  serializeScoreClaim,
  serializeSnapshot,
  restoreSnapshot,
  transition,
  verifyScoreClaim,
  candidateFairScorePolicy,
  ACTION_LOG_VERSION,
  SCORE_SCALE,
  type GameCommand,
  type InteractionAnswer,
  type PublicChallengeView,
  type RunDescriptor,
  type RunState,
} from '@/game'
import { validateSubmittedRun } from '@/server/game/validate-run'
import {
  createGrade7ComposedDependencies,
  createGrade7ComposedRunDescriptor,
  createGrade7CompetitiveDependencies,
  createGrade7CompetitiveRunDescriptor,
} from '@/content/grade-7'

/**
 * Una partida competitiva, de punta a punta.
 *
 * Lo que se prueba es la cadena entera: la run declara bajo qué calibración se
 * juega, el motor la comprueba, el historial autoritativo produce el score, y un
 * servidor que no le cree nada al cliente llega exactamente al mismo número.
 */

const dependencies = createGrade7CompetitiveDependencies()

function descriptorFor(seed: string): RunDescriptor {
  const descriptor = createGrade7CompetitiveRunDescriptor(seed)
  if (!isOk(descriptor)) {
    throw new Error(`no se pudo componer: ${descriptor.error.code}`)
  }
  return descriptor.value
}

function answerFor(
  view: PublicChallengeView,
  best: boolean,
): InteractionAnswer {
  const interaction = view.interaction

  switch (interaction.kind) {
    case 'timeline':
    case 'decision-card':
    case 'chart-interpretation':
    case 'information-request': {
      const options = interaction.options
      const option = best ? options[options.length - 1] : options[0]
      if (option === undefined) throw new Error('sin opciones')
      return { kind: interaction.kind, optionId: option.id }
    }
    case 'numeric-input':
      return { kind: 'numeric-input', value: best ? '45' : interaction.min }
    case 'number-grid':
      return {
        kind: 'number-grid',
        rounds: interaction.rounds.map((round) => ({
          roundId: round.id,
          numbers: best ? [...round.numbers] : round.numbers.slice(0, 1),
        })),
      }
    case 'assignment-board':
      return {
        kind: 'assignment-board',
        assignments: interaction.tasks.flatMap((task, index) => {
          const agent = interaction.agents[index]
          return agent === undefined
            ? []
            : [{ agentId: agent.id, taskId: task.id }]
        }),
      }
    case 'budget-builder':
      return {
        kind: 'budget-builder',
        lines: interaction.items.map((item) => ({
          itemId: item.id,
          quantity: 1,
        })),
      }
  }
}

interface Played {
  readonly state: RunState
  readonly commands: readonly GameCommand[]
}

function play(seed: string, best = true, deps = dependencies): Played {
  const created = createRun(descriptorFor(seed), deps)
  if (!created.ok) throw new Error(`no se pudo crear: ${created.error.kind}`)

  let state = created.value.state
  const commands: GameCommand[] = []

  for (let step = 0; step < 30 && state.status === 'active'; step += 1) {
    let command: GameCommand = { type: 'CONTINUE' }
    if (state.phase === 'challenge') {
      const view = activeChallengeView(state, deps)
      if (!view.ok || view.value === undefined) throw new Error('sin vista')
      command = {
        type: 'ANSWER',
        instanceId: view.value.ref.instanceId,
        answer: answerFor(view.value, best),
      }
    }
    const result = transition(state, command, deps)
    if (!result.ok) throw new Error(`rechazado: ${result.error.kind}`)
    state = result.value.state
    commands.push(command)
  }

  return { state, commands }
}

function logOf(played: Played) {
  let log = emptyActionLog(played.state.descriptor)
  for (const command of played.commands) {
    log = appendAction(log, command)
  }
  return log
}

const SEEDS = ['comp-a', 'comp-b', 'comp-c']

describe('la identidad de una run competitiva', () => {
  it('declara la calibración bajo la que se juega', () => {
    expect(descriptorFor('comp-a').scoreVersion).toBe(
      candidateFairScorePolicy.version,
    )
  })

  it('el motor rechaza una run que declara otra calibración', () => {
    const created = createRun(
      { ...descriptorFor('comp-a'), scoreVersion: '9.9.9' },
      dependencies,
    )
    if (!isErr(created)) throw new Error('debería haber sido rechazado')
    expect(created.error).toMatchObject({ field: 'scoreVersion' })
  })

  it('rechaza una calibración declarada donde no hay política', () => {
    const created = createRun(
      descriptorFor('comp-a'),
      createGrade7ComposedDependencies(),
    )
    expect(isErr(created)).toBe(true)
  })

  it('una partida sin política de score no declara ninguna', () => {
    const practice = createGrade7ComposedRunDescriptor('comp-a')
    if (!isOk(practice)) throw new Error('no compuso')
    expect(practice.value.scoreVersion).toBeUndefined()
  })

  it('la calibración sobrevive al log de acciones y al snapshot', () => {
    const played = play('comp-b')
    const parsed = parseActionLog(serializeActionLog(logOf(played)))
    if (!isOk(parsed)) throw new Error('el log no se pudo parsear')

    expect(parsed.value.version).toBe(ACTION_LOG_VERSION)
    expect(parsed.value.descriptor.scoreVersion).toBe(
      candidateFairScorePolicy.version,
    )

    const restored = restoreSnapshot(serializeSnapshot(played.state), {
      gameVersion: played.state.descriptor.gameVersion,
      rulesetVersion: played.state.descriptor.rulesetVersion,
      contentVersion: played.state.descriptor.contentVersion,
    })
    if (!isOk(restored)) throw new Error('no se pudo restaurar')
    expect(restored.value.descriptor.scoreVersion).toBe(
      candidateFairScorePolicy.version,
    )
  })
})

describe('el score sale del historial autoritativo', () => {
  it('puntúa cada run compuesta y se queda dentro de la escala', () => {
    for (const seed of SEEDS) {
      const played = play(seed)
      const result = scoreRun(
        scoredEventsOf(played.state.history),
        dependencies.catalog,
        candidateFairScorePolicy,
      )
      if (!isOk(result)) throw new Error(`no puntuó: ${result.error.code}`)

      expect(result.value.fairScore).toBeGreaterThanOrEqual(0)
      expect(result.value.fairScore).toBeLessThanOrEqual(SCORE_SCALE)
      expect(result.value.scoredBeats).toBe(
        played.state.history.filter((entry) => entry.challengeId !== undefined)
          .length,
      )
    }
  })

  it('jugar mejor puntúa más', () => {
    const strong = play('comp-c', true)
    const weak = play('comp-c', false)

    const scoreOf = (played: Played) => {
      const result = scoreRun(
        scoredEventsOf(played.state.history),
        dependencies.catalog,
        candidateFairScorePolicy,
      )
      if (!isOk(result)) throw new Error('no puntuó')
      return result.value.fairScore
    }

    expect(scoreOf(strong)).toBeGreaterThan(scoreOf(weak))
  })

  it('reproducir la run da exactamente el mismo score', () => {
    const played = play('comp-a')
    const events = scoredEventsOf(played.state.history)

    const first = scoreRun(
      events,
      dependencies.catalog,
      candidateFairScorePolicy,
    )
    const second = scoreRun(
      events,
      dependencies.catalog,
      candidateFairScorePolicy,
    )
    if (!isOk(first) || !isOk(second)) throw new Error('no puntuó')

    expect(second.value).toEqual(first.value)
  })

  it('el score no cambia nada del juego', () => {
    // Misma run, con y sin política de score en las dependencias: mismo
    // recorrido, mismas calidades, mismo score preview. Puntuar es observar.
    const competitive = play('comp-b')
    const composed = (() => {
      const deps = createGrade7ComposedDependencies()
      const descriptor = createGrade7ComposedRunDescriptor('comp-b')
      if (!isOk(descriptor)) throw new Error('no compuso')
      const created = createRun(descriptor.value, deps)
      if (!created.ok) throw new Error('no se pudo crear')

      let state = created.value.state
      for (let step = 0; step < 30 && state.status === 'active'; step += 1) {
        let command: GameCommand = { type: 'CONTINUE' }
        if (state.phase === 'challenge') {
          const view = activeChallengeView(state, deps)
          if (!view.ok || view.value === undefined) throw new Error('sin vista')
          command = {
            type: 'ANSWER',
            instanceId: view.value.ref.instanceId,
            answer: answerFor(view.value, true),
          }
        }
        const result = transition(state, command, deps)
        if (!result.ok) throw new Error('rechazado')
        state = result.value.state
      }
      return state
    })()

    expect(composed.history.map((entry) => entry.challengeId)).toEqual(
      competitive.state.history.map((entry) => entry.challengeId),
    )
    expect(composed.history.map((entry) => entry.quality)).toEqual(
      competitive.state.history.map((entry) => entry.quality),
    )
    expect(composed.scorePreview).toBe(competitive.state.scorePreview)
  })
})

describe('el servidor calcula el score, no lo acepta', () => {
  it('devuelve su propio score competitivo tras reproducir la run', () => {
    const played = play('comp-a')
    const result = validateSubmittedRun(
      serializeActionLog(logOf(played)),
      dependencies,
    )
    if (!isOk(result))
      throw new Error(`el servidor rechazó: ${result.error.kind}`)

    const expected = scoreRun(
      scoredEventsOf(played.state.history),
      dependencies.catalog,
      candidateFairScorePolicy,
    )
    if (!isOk(expected)) throw new Error('no puntuó')

    expect(result.value.competitiveScore?.fairScore).toBe(
      expected.value.fairScore,
    )
    expect(result.value.competitiveScore?.official).toBe(false)
  })

  it('no puntúa competitivamente una run que no lo declara', () => {
    const deps = createGrade7ComposedDependencies()
    const descriptor = createGrade7ComposedRunDescriptor('comp-a')
    if (!isOk(descriptor)) throw new Error('no compuso')

    const created = createRun(descriptor.value, deps)
    if (!created.ok) throw new Error('no se pudo crear')

    let state = created.value.state
    let log = emptyActionLog(descriptor.value)
    for (let step = 0; step < 30 && state.status === 'active'; step += 1) {
      let command: GameCommand = { type: 'CONTINUE' }
      if (state.phase === 'challenge') {
        const view = activeChallengeView(state, deps)
        if (!view.ok || view.value === undefined) throw new Error('sin vista')
        command = {
          type: 'ANSWER',
          instanceId: view.value.ref.instanceId,
          answer: answerFor(view.value, true),
        }
      }
      const result = transition(state, command, deps)
      if (!result.ok) throw new Error('rechazado')
      state = result.value.state
      log = appendAction(log, command)
    }

    const result = validateSubmittedRun(serializeActionLog(log), deps)
    if (!isOk(result)) throw new Error('el servidor rechazó la run')
    expect(result.value.competitiveScore).toBeUndefined()
  })

  it('un reclamo de score adjunto a la submission no cambia nada', () => {
    const played = play('comp-b')
    const honest = validateSubmittedRun(
      serializeActionLog(logOf(played)),
      dependencies,
    )
    if (!isOk(honest)) throw new Error('rechazó la run honesta')

    // El log serializado no tiene dónde llevar un score, y agregarlo tampoco
    // sirve: el parser lo ignora y el servidor puntúa reproduciendo.
    const tampered = {
      ...(serializeActionLog(logOf(played)) as Record<string, unknown>),
      fairScore: SCORE_SCALE,
      competitiveScore: { fairScore: SCORE_SCALE },
    }
    const result = validateSubmittedRun(tampered, dependencies)
    if (!isOk(result)) throw new Error('rechazó la run manipulada')

    expect(result.value.competitiveScore?.fairScore).toBe(
      honest.value.competitiveScore?.fairScore,
    )
    expect(result.value.competitiveScore?.fairScore).not.toBe(SCORE_SCALE)
  })

  it('verifica un reclamo contra el historial y no contra sí mismo', () => {
    const played = play('comp-c')
    const events = scoredEventsOf(played.state.history)
    const canonical = scoreRun(
      events,
      dependencies.catalog,
      candidateFairScorePolicy,
    )
    if (!isOk(canonical)) throw new Error('no puntuó')

    const inflated = {
      ...serializeScoreClaim(canonical.value),
      fairScore: SCORE_SCALE,
    }
    const verified = verifyScoreClaim(
      inflated,
      events,
      dependencies.catalog,
      candidateFairScorePolicy,
    )
    if (!isOk(verified)) throw new Error('no verificó')

    expect(verified.value.issues.map((issue) => issue.code)).toContain(
      'fair-score-mismatch',
    )
    expect(verified.value.canonical.fairScore).toBe(canonical.value.fairScore)
  })
})
