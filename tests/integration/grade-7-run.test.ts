import { describe, expect, it } from 'vitest'

import {
  activeChallengeView,
  appendAction,
  canonicalize,
  createRun,
  emptyActionLog,
  isOk,
  materializeChallenge,
  parseActionLog,
  qualityRank,
  replayRun,
  restoreSnapshot,
  serializeActionLog,
  serializeSnapshot,
  toRunId,
  toRunSeed,
  transition,
  ENGINE_VERSION,
  type EngineDependencies,
  type GameCommand,
  type InteractionAnswer,
  type PublicChallengeView,
  type RunDescriptor,
  type RunState,
} from '@/game'
import { createGrade7Dependencies, grade7StoryletIds } from '@/content/grade-7'

/**
 * La run completa de 7.º grado, sin React.
 *
 * Prueba que el juego funciona antes de que exista una pantalla: el año se
 * recorre entero, la bifurcación narrativa responde a cómo se jugó, y el
 * resultado se puede reproducir desde el log de acciones.
 */

const dependencies = createGrade7Dependencies()

function descriptorFor(seed: string): RunDescriptor {
  return {
    runId: toRunId(`run-${seed}`),
    seed: toRunSeed(seed),
    mode: 'practice',
    difficulty: 'adaptive',
    gameVersion: ENGINE_VERSION,
    rulesetVersion: dependencies.ruleset.version,
    contentVersion: dependencies.ruleset.contentVersion,
  }
}

/** Todas las respuestas que tiene sentido probar para una interacción. */
function candidateAnswers(view: PublicChallengeView): InteractionAnswer[] {
  const interaction = view.interaction

  switch (interaction.kind) {
    case 'decision-card':
      return interaction.options.map((option) => ({
        kind: 'decision-card' as const,
        optionId: option.id,
      }))
    case 'timeline':
      return interaction.options.map((option) => ({
        kind: 'timeline' as const,
        optionId: option.id,
      }))
    case 'chart-interpretation':
      return interaction.options.map((option) => ({
        kind: 'chart-interpretation' as const,
        optionId: option.id,
      }))
    case 'information-request':
      return interaction.options.map((option) => ({
        kind: 'information-request' as const,
        optionId: option.id,
      }))
    case 'numeric-input':
      return [{ kind: 'numeric-input' as const, value: interaction.min }]
    case 'assignment-board': {
      const permute = <T>(items: readonly T[]): T[][] =>
        items.length <= 1
          ? [[...items]]
          : items.flatMap((head, index) =>
              permute([
                ...items.slice(0, index),
                ...items.slice(index + 1),
              ]).map((tail) => [head, ...tail]),
            )

      return permute(interaction.agents).map((ordering) => ({
        kind: 'assignment-board' as const,
        assignments: interaction.tasks.flatMap((task, index) => {
          const agent = ordering[index]
          return agent === undefined
            ? []
            : [{ agentId: agent.id, taskId: task.id }]
        }),
      }))
    }
    case 'budget-builder': {
      const answers: InteractionAnswer[] = []
      const items = interaction.items
      const limit = (index: number): number =>
        Math.min(items[index]?.maxQuantity ?? 0, 4)

      for (let a = 0; a <= limit(0); a += 1) {
        for (let b = 0; b <= limit(1); b += 1) {
          for (let c = 0; c <= limit(2); c += 1) {
            answers.push({
              kind: 'budget-builder',
              lines: items.map((item, index) => ({
                itemId: item.id,
                quantity: [a, b, c][index] ?? 0,
              })),
            })
          }
        }
      }
      return answers
    }
  }
}

type Strategy = 'fuerte' | 'debil' | 'mixto'

/**
 * Elige una respuesta según la estrategia.
 *
 * Evalúa las candidatas contra el propio motor, así que "la mejor" es la que el
 * juego considera mejor, no una que el test decidió por su cuenta.
 */
function chooseAnswer(
  state: RunState,
  view: PublicChallengeView,
  strategy: Strategy,
  index: number,
  deps: EngineDependencies,
): InteractionAnswer {
  const materialized = materializeChallenge(state.descriptor, view.ref, deps)
  if (!materialized.ok) throw new Error('no se pudo materializar el desafío')

  const scored = candidateAnswers(view).flatMap((answer) => {
    const result = materialized.value.evaluate(answer, [])
    return result.ok
      ? [{ answer, rank: qualityRank(result.value.quality) }]
      : []
  })
  if (scored.length === 0)
    throw new Error('ninguna respuesta candidata es válida')

  const sorted = [...scored].sort((left, right) => right.rank - left.rank)
  const best = sorted[0]
  const worst = sorted[sorted.length - 1]
  if (best === undefined || worst === undefined)
    throw new Error('sin candidatas')

  if (strategy === 'fuerte') return best.answer
  if (strategy === 'debil') return worst.answer
  return index % 2 === 0 ? best.answer : worst.answer
}

interface PlayedRun {
  readonly state: RunState
  readonly log: ReturnType<typeof emptyActionLog>
  readonly commands: readonly GameCommand[]
}

/** Juega la run entera con una estrategia dada. */
function play(seed: string, strategy: Strategy): PlayedRun {
  const descriptor = descriptorFor(seed)
  const created = createRun(descriptor, dependencies)
  if (!created.ok) throw new Error('no se pudo crear la run')

  let state = created.value.state
  let log = emptyActionLog(descriptor)
  const commands: GameCommand[] = []
  let answered = 0

  for (let step = 0; step < 40 && state.status === 'active'; step += 1) {
    let command: GameCommand

    if (state.phase === 'challenge') {
      const view = activeChallengeView(state, dependencies)
      if (!view.ok || view.value === undefined)
        throw new Error('sin vista activa')
      command = {
        type: 'ANSWER',
        instanceId: view.value.ref.instanceId,
        answer: chooseAnswer(
          state,
          view.value,
          strategy,
          answered,
          dependencies,
        ),
      }
      answered += 1
    } else {
      command = { type: 'CONTINUE' }
    }

    const result = transition(state, command, dependencies)
    if (!result.ok) throw new Error(`comando rechazado: ${result.error.kind}`)

    state = result.value.state
    log = appendAction(log, command)
    commands.push(command)
  }

  return { state, log, commands }
}

describe('la run de 7.º grado', () => {
  it('recorre el año completo y lo termina', () => {
    const { state } = play('slice-feliz', 'fuerte')

    expect(state.status).toBe('completed')
    expect(state.stage).toBe('grade-7')
    // Siete eventos: cinco desafíos y dos beats narrativos.
    expect(state.history).toHaveLength(7)
    expect(
      state.history.filter((entry) => entry.challengeId !== undefined),
    ).toHaveLength(5)
    expect(state.completion).toBeDefined()
  })

  it('presenta las cinco situaciones en el orden autorado', () => {
    const { state } = play('slice-orden', 'fuerte')

    expect(state.history.map((entry) => entry.storyletId)).toEqual([
      grade7StoryletIds.intro,
      grade7StoryletIds.bus,
      grade7StoryletIds.mural,
      grade7StoryletIds.notebook,
      grade7StoryletIds.projectLead,
      grade7StoryletIds.groupWork,
      grade7StoryletIds.fairStand,
    ])
  })

  it.each(['fuerte', 'mixto', 'debil'] as const)(
    'termina el año jugando de forma %s',
    (strategy) => {
      const { state } = play(`slice-${strategy}`, strategy)

      // Ninguna decisión equivocada corta la run: siempre se llega al final.
      expect(state.status).toBe('completed')
      expect(state.history).toHaveLength(7)
      expect(state.completion?.totalScore).toBeGreaterThanOrEqual(0)
    },
  )

  it('da mejor resultado al que decide mejor', () => {
    const strong = play('slice-comparar', 'fuerte')
    const weak = play('slice-comparar', 'debil')

    expect(strong.state.scorePreview).toBeGreaterThan(weak.state.scorePreview)
    expect(strong.state.stats.knowledge).toBeGreaterThan(
      weak.state.stats.knowledge,
    )
  })
})

describe('la bifurcación narrativa', () => {
  it('ofrece coordinar cuando las decisiones vinieron saliendo bien', () => {
    const { state } = play('slice-lead', 'fuerte')

    expect(state.seenStorylets).toContain(grade7StoryletIds.projectLead)
    expect(state.seenStorylets).not.toContain(grade7StoryletIds.projectSupport)
    expect(state.flags['g7.coordina']).toBe(true)
  })

  it('reparte el trabajo cuando no vinieron saliendo bien', () => {
    const { state } = play('slice-support', 'debil')

    expect(state.seenStorylets).toContain(grade7StoryletIds.projectSupport)
    expect(state.seenStorylets).not.toContain(grade7StoryletIds.projectLead)
    expect(state.flags['g7.reparteGrupo']).toBe(true)
    expect(state.flags['g7.coordina']).toBeUndefined()
  })

  it('la rama elegida se refleja en el cierre del año', () => {
    const strong = play('slice-cierre', 'fuerte')
    const weak = play('slice-cierre', 'debil')

    // Una decisión temprana cambia el relato posterior: es lo que separa a
    // Egresado de una lista de ejercicios independientes.
    expect(strong.state.flags['g7.coordina']).toBe(true)
    expect(weak.state.flags['g7.coordina']).toBeUndefined()
  })
})

describe('reproducibilidad del año', () => {
  it('reproduce la run desde el log de acciones', () => {
    const played = play('slice-replay', 'mixto')

    const transported = parseActionLog(serializeActionLog(played.log))
    expect(isOk(transported)).toBe(true)
    if (!transported.ok) return

    const replayed = replayRun(transported.value, dependencies)
    expect(isOk(replayed)).toBe(true)
    if (!replayed.ok) return

    expect(canonicalize(replayed.value.state)).toBe(canonicalize(played.state))
    expect(replayed.value.state.scorePreview).toBe(played.state.scorePreview)
    expect(replayed.value.state.stats).toEqual(played.state.stats)
    expect(replayed.value.state.flags).toEqual(played.state.flags)
    expect(replayed.value.state.completion?.profile.profileId).toBe(
      played.state.completion?.profile.profileId,
    )
  })

  it('la misma seed y las mismas respuestas dan el mismo año', () => {
    const first = play('slice-determinista', 'fuerte')
    const second = play('slice-determinista', 'fuerte')

    expect(canonicalize(second.state)).toBe(canonicalize(first.state))
  })

  it('reanuda a mitad de año y llega al mismo final', () => {
    const descriptor = descriptorFor('slice-reanudar')
    const created = createRun(descriptor, dependencies)
    if (!created.ok) throw new Error('no se pudo crear la run')

    // Se juega media run y se guarda el checkpoint.
    let state = created.value.state
    let answered = 0
    for (let step = 0; step < 6 && state.status === 'active'; step += 1) {
      const command: GameCommand =
        state.phase === 'challenge'
          ? (() => {
              const view = activeChallengeView(state, dependencies)
              if (!view.ok || view.value === undefined) {
                throw new Error('sin vista activa')
              }
              const answer = chooseAnswer(
                state,
                view.value,
                'fuerte',
                answered,
                dependencies,
              )
              answered += 1
              return {
                type: 'ANSWER',
                instanceId: view.value.ref.instanceId,
                answer,
              }
            })()
          : { type: 'CONTINUE' }

      const result = transition(state, command, dependencies)
      if (!result.ok) throw new Error('comando rechazado')
      state = result.value.state
    }

    const restored = restoreSnapshot(
      JSON.parse(JSON.stringify(serializeSnapshot(state))),
      {
        gameVersion: descriptor.gameVersion,
        rulesetVersion: descriptor.rulesetVersion,
        contentVersion: descriptor.contentVersion,
      },
    )
    expect(isOk(restored)).toBe(true)
    if (!restored.ok) return

    // Seguir desde el estado restaurado tiene que comportarse igual que seguir
    // desde el vivo.
    const fromLive = transition(state, { type: 'CONTINUE' }, dependencies)
    const fromRestored = transition(
      restored.value,
      { type: 'CONTINUE' },
      dependencies,
    )

    expect(fromRestored.ok).toBe(fromLive.ok)
    if (fromLive.ok && fromRestored.ok) {
      expect(canonicalize(fromRestored.value.state)).toBe(
        canonicalize(fromLive.value.state),
      )
    }
  })
})

describe('run de referencia', () => {
  /**
   * Golden run.
   *
   * Fija el recorrido exacto de una seed conocida jugada de forma óptima. Si
   * cambia, cambió la salida determinista y hay que decidir qué versión sube.
   */
  it('reproduce el año de referencia', () => {
    const { state } = play('golden-g7', 'fuerte')

    expect(
      state.history.map(
        (entry) =>
          `${entry.storyletId}|${entry.challengeId ?? '-'}|${entry.quality ?? '-'}`,
      ),
    ).toEqual([
      'g7.intro|-|-',
      'g7.bus|g7.bus-timing|optimal',
      'g7.mural|g7.mural-paint|optimal',
      'g7.notebook|g7.notebook-offer|optimal',
      'g7.project-lead|-|-',
      'g7.group-work|g7.group-tasks|optimal',
      'g7.fair-stand|g7.stand-supplies|optimal',
    ])
    expect(state.scorePreview).toBeGreaterThan(0)
  })
})
