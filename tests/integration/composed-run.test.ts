import { describe, expect, it } from 'vitest'

import {
  activeChallengeView,
  appendAction,
  createRun,
  emptyActionLog,
  formatVariantAddress,
  isErr,
  isOk,
  parseActionLog,
  planFingerprint,
  replayRun,
  restoreSnapshot,
  serializeActionLog,
  serializeSnapshot,
  transition,
  validateComposedPlan,
  ACTION_LOG_VERSION,
  SNAPSHOT_SCHEMA_VERSION,
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
  createGrade7Dependencies,
  createGrade7RunDescriptor,
  grade7CompositionPolicy,
} from '@/content/grade-7'

/**
 * Una partida compuesta, de punta a punta.
 *
 * El compositor elige el contenido antes de que la run empiece; lo que se
 * prueba acá es que el motor lo **ejecute** — que no vuelva a sortear nada, que
 * reanudar y reproducir den el mismo año, y que un servidor pueda verificarlo
 * sin creerle nada al cliente.
 */

const dependencies = createGrade7ComposedDependencies()

function descriptorFor(seed: string): RunDescriptor {
  const descriptor = createGrade7ComposedRunDescriptor(seed)
  if (!isOk(descriptor)) {
    throw new Error(`no se pudo componer: ${descriptor.error.code}`)
  }
  return descriptor.value
}

/** Una respuesta razonable para cualquier interacción, sin mirar el modelo. */
function answerFor(view: PublicChallengeView): InteractionAnswer {
  const interaction = view.interaction

  switch (interaction.kind) {
    case 'timeline':
    case 'decision-card':
    case 'chart-interpretation':
    case 'information-request': {
      const option = interaction.options[0]
      if (option === undefined) throw new Error('sin opciones')
      return { kind: interaction.kind, optionId: option.id }
    }
    case 'numeric-input':
      return { kind: 'numeric-input', value: interaction.min }
    case 'route-builder':
      // Ninguna Template de 7.º arma un recorrido; la rama existe para que el
      // día que alguna lo haga esto no compile en silencio.
      return {
        kind: 'route-builder',
        stops: interaction.points.map((point) => point.id),
      }
    case 'classification':
      return {
        kind: 'classification',
        entries: interaction.statements.map((statement) => ({
          statementId: statement.id,
          labelId: interaction.labels[0]?.id ?? '',
        })),
        ...(interaction.stance === undefined
          ? {}
          : { stance: interaction.stance.options[0]?.id ?? '' }),
      }
    case 'number-grid':
      return {
        kind: 'number-grid',
        rounds: interaction.rounds.map((round) => ({
          roundId: round.id,
          numbers: round.numbers.slice(0, 1),
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
    case 'schedule-builder':
    case 'spatial-layout':
      return { kind: interaction.kind, placements: [] }
    case 'quantity-builder':
    case 'budget-builder':
      return {
        kind: interaction.kind,
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
  readonly states: readonly RunState[]
}

function play(seed: string, deps = dependencies): Played {
  const created = createRun(descriptorFor(seed), deps)
  if (!created.ok) throw new Error(`no se pudo crear: ${created.error.kind}`)

  let state = created.value.state
  const commands: GameCommand[] = []
  const states: RunState[] = [state]

  for (let step = 0; step < 30 && state.status === 'active'; step += 1) {
    let command: GameCommand = { type: 'CONTINUE' }

    if (state.phase === 'challenge') {
      const view = activeChallengeView(state, deps)
      if (!view.ok || view.value === undefined) throw new Error('sin vista')
      command = {
        type: 'ANSWER',
        instanceId: view.value.ref.instanceId,
        answer: answerFor(view.value),
      }
    }

    const result = transition(state, command, deps)
    if (!result.ok) throw new Error(`rechazado: ${result.error.kind}`)
    state = result.value.state
    commands.push(command)
    states.push(state)
  }

  return { state, commands, states }
}

const SEEDS = ['normal-a', 'normal-b', 'normal-c', 'normal-d']

describe('el motor ejecuta el plan, no lo vuelve a componer', () => {
  it('presenta exactamente los beats que el plan pinchó, en orden', () => {
    for (const seed of SEEDS) {
      const played = play(seed)
      const plan = played.state.plan
      if (plan === undefined) throw new Error('la run no quedó compuesta')

      const planned = plan.stages
        .flatMap((stage) => stage.beats)
        .map((beat) => formatVariantAddress(beat.variant))
      const actual = played.state.history
        .filter(
          (entry) => entry.challengeId !== undefined && entry.recovery !== true,
        )
        .map((entry) => entry.challengeId)

      expect(actual).toEqual(planned.map((address) => address.split('/')[1]))
    }
  })

  it('juega el año que el plan dura, no el que la etapa declara', () => {
    const played = play('normal-a')
    const stage = played.state.plan?.stages[0]
    if (stage === undefined) throw new Error('sin etapa')

    // Los eventos ordinarios son los que el plan dura. Un repaso, si el año lo
    // debió, se suma afuera de esa cuenta: es contenido condicional.
    expect(
      played.state.history.filter((entry) => entry.recovery !== true),
    ).toHaveLength(stage.eventCount)
    // La demo declara ocho eventos para el mismo año. Una partida normal juega
    // tres, y ésa es la reconciliación con el presupuesto de ADR-019.
    expect(stage.eventCount).toBe(3)
    expect(createGrade7Dependencies().ruleset.stages[0]?.eventCount).toBe(8)
  })

  it('termina el año y produce un resultado', () => {
    for (const seed of SEEDS) {
      const played = play(seed)
      expect(played.state.status).toBe('completed')
      expect(played.state.completion).toBeDefined()
    }
  })

  it('respeta el presupuesto de uno a dos beats ordinarios', () => {
    for (const seed of SEEDS) {
      const answered = play(seed).state.history.filter(
        (entry) => entry.challengeId !== undefined && entry.recovery !== true,
      )
      expect(answered.length).toBeGreaterThanOrEqual(1)
      expect(answered.length).toBeLessThanOrEqual(2)
    }
  })

  it('el plan que jugó pasa el validador independiente', () => {
    for (const seed of SEEDS) {
      const plan = play(seed).state.plan
      if (plan === undefined) throw new Error('sin plan')

      expect(
        validateComposedPlan(plan, {
          catalog: dependencies.catalog,
          policy: grade7CompositionPolicy,
          ...(dependencies.approvedVariants === undefined
            ? {}
            : { approvedVariants: dependencies.approvedVariants }),
        }),
      ).toEqual([])
    }
  })
})

describe('el plan sobrevive a reanudar y a reproducir', () => {
  it('el snapshot lleva el plan concreto, no la forma de recalcularlo', () => {
    const played = play('normal-a')
    const snapshot = serializeSnapshot(
      played.states[1] ?? played.state,
    ) as unknown as {
      readonly schemaVersion: number
      readonly state: { readonly plan: unknown }
    }

    expect(snapshot.schemaVersion).toBe(SNAPSHOT_SCHEMA_VERSION)
    expect(snapshot.state.plan).not.toBeNull()
  })

  it('reanudar devuelve el mismo plan', () => {
    const played = play('normal-b')
    const mid = played.states[1]
    if (mid === undefined) throw new Error('sin estado intermedio')

    const restored = restoreSnapshot(serializeSnapshot(mid), {
      gameVersion: mid.descriptor.gameVersion,
      rulesetVersion: mid.descriptor.rulesetVersion,
      contentVersion: mid.descriptor.contentVersion,
    })
    if (!isOk(restored)) throw new Error('no se pudo restaurar')

    expect(restored.value.plan).toEqual(mid.plan)
    if (mid.plan === undefined) throw new Error('sin plan')
    expect(planFingerprint(restored.value.plan!)).toBe(
      planFingerprint(mid.plan),
    )
  })

  it('la reanudación sigue jugando los beats que faltaban', () => {
    const played = play('normal-c')
    const mid = played.states[1]
    if (mid === undefined) throw new Error('sin estado intermedio')

    const restored = restoreSnapshot(serializeSnapshot(mid), {
      gameVersion: mid.descriptor.gameVersion,
      rulesetVersion: mid.descriptor.rulesetVersion,
      contentVersion: mid.descriptor.contentVersion,
    })
    if (!isOk(restored)) throw new Error('no se pudo restaurar')

    let state = restored.value
    for (let step = 0; step < 30 && state.status === 'active'; step += 1) {
      let command: GameCommand = { type: 'CONTINUE' }
      if (state.phase === 'challenge') {
        const view = activeChallengeView(state, dependencies)
        if (!view.ok || view.value === undefined) throw new Error('sin vista')
        command = {
          type: 'ANSWER',
          instanceId: view.value.ref.instanceId,
          answer: answerFor(view.value),
        }
      }
      const result = transition(state, command, dependencies)
      if (!result.ok) throw new Error(`rechazado: ${result.error.kind}`)
      state = result.value.state
    }

    expect(state.history.map((entry) => entry.challengeId)).toEqual(
      played.state.history.map((entry) => entry.challengeId),
    )
  })

  it('el log de acciones lleva la huella del plan', () => {
    const played = play('normal-d')
    let log = emptyActionLog(played.state.descriptor)
    for (const command of played.commands) {
      log = appendAction(log, command)
    }

    const parsed = parseActionLog(serializeActionLog(log))
    if (!isOk(parsed)) throw new Error('el log no se pudo parsear')

    expect(parsed.value.version).toBe(ACTION_LOG_VERSION)
    expect(parsed.value.descriptor.planFingerprint).toBe(
      played.state.plan === undefined
        ? undefined
        : planFingerprint(played.state.plan),
    )

    const replayed = replayRun(parsed.value, dependencies)
    if (!isOk(replayed)) throw new Error('la reproducción falló')
    expect(
      replayed.value.state.history.map((entry) => entry.challengeId),
    ).toEqual(played.state.history.map((entry) => entry.challengeId))
  })
})

describe('el motor rechaza un plan que no compuso', () => {
  it('rechaza un descriptor cuya huella no es la del plan compuesto', () => {
    const descriptor = {
      ...descriptorFor('normal-a'),
      planFingerprint: 'a'.repeat(64),
    }

    const created = createRun(descriptor, dependencies)
    if (!isErr(created)) throw new Error('debería haber sido rechazado')
    expect(created.error).toMatchObject({ field: 'planFingerprint' })
  })

  it('rechaza una huella de plan en una run que no se compone', () => {
    const uncomposed = createGrade7Dependencies()
    const created = createRun(
      {
        ...descriptorFor('normal-a'),
        rulesetVersion: uncomposed.ruleset.version,
      },
      uncomposed,
    )
    expect(isErr(created)).toBe(true)
  })
})

describe('el servidor puede verificar una run compuesta', () => {
  it('recompone el plan, lo valida y devuelve su carga', () => {
    const played = play('normal-a')
    let log = emptyActionLog(played.state.descriptor)
    for (const command of played.commands) {
      log = appendAction(log, command)
    }

    const result = validateSubmittedRun(serializeActionLog(log), dependencies)
    if (!isOk(result)) {
      throw new Error(`el servidor rechazó la run: ${result.error.kind}`)
    }

    expect(result.value.planFingerprint).toBe(
      played.state.plan === undefined
        ? undefined
        : planFingerprint(played.state.plan),
    )
    expect(result.value.difficultyCost).toBe(played.state.plan?.difficultyCost)
    // El score sigue saliendo de reproducir, nunca de lo que el cliente diga.
    expect(result.value.officialScore).toBe(played.state.completion?.totalScore)
  })

  it('rechaza una submission que declara otra huella de plan', () => {
    const played = play('normal-b')
    let log = emptyActionLog({
      ...played.state.descriptor,
      planFingerprint: 'b'.repeat(64),
    })
    for (const command of played.commands) {
      log = appendAction(log, command)
    }

    const result = validateSubmittedRun(serializeActionLog(log), dependencies)
    expect(isErr(result)).toBe(true)
  })
})

describe('la demo amplia sigue jugándose igual', () => {
  it('un content set sin política de composición no compone nada', () => {
    const demo = createGrade7Dependencies()
    expect(demo.ruleset.composition).toBeUndefined()

    const created = createRun(createGrade7RunDescriptor('demo'), demo)
    if (!created.ok) throw new Error(`no se pudo crear: ${created.error.kind}`)

    // Ni plan, ni huella, ni cambio de comportamiento: componer es una
    // capacidad que un content set adopta, no una que se le impone.
    expect(created.value.state.plan).toBeUndefined()
    expect(created.value.state.descriptor.planFingerprint).toBeUndefined()
  })

  it('sigue jugando su arco completo de ocho eventos', () => {
    const demo = createGrade7Dependencies()
    let state = (() => {
      const created = createRun(createGrade7RunDescriptor('demo'), demo)
      if (!created.ok) throw new Error('no se pudo crear')
      return created.value.state
    })()

    for (let step = 0; step < 40 && state.status === 'active'; step += 1) {
      let command: GameCommand = { type: 'CONTINUE' }
      if (state.phase === 'challenge') {
        const view = activeChallengeView(state, demo)
        if (!view.ok || view.value === undefined) throw new Error('sin vista')
        command = {
          type: 'ANSWER',
          instanceId: view.value.ref.instanceId,
          answer: answerFor(view.value),
        }
      }
      const result = transition(state, command, demo)
      if (!result.ok) throw new Error(`rechazado: ${result.error.kind}`)
      state = result.value.state
    }

    expect(
      state.history.filter((entry) => entry.recovery !== true),
    ).toHaveLength(8)
    expect(
      state.history.filter(
        (entry) => entry.challengeId !== undefined && entry.recovery !== true,
      ),
    ).toHaveLength(6)
  })
})
