import fc from 'fast-check'
import { describe, expect, it } from 'vitest'

import {
  activeChallengeView,
  createRun,
  runStateIssues,
  toRunId,
  toRunSeed,
  transition,
  ENGINE_VERSION,
  type EngineDependencies,
  type GameCommand,
  type InteractionAnswer,
  type PublicChallengeView,
  type RunState,
} from '@/game'
import {
  createSixStageDependencies,
  SIX_STAGE_IDS,
  SIX_STAGE_RULESET_VERSION,
} from '@/game/testing'

/**
 * La convergencia de la progresión, sobre carreras enteras.
 *
 * Ésta es la etapa donde una property test no es un lujo: la promesa es que
 * **toda run válida completada llega al egreso**, y una promesa sobre todas las
 * partidas no se prueba con las partidas que a alguien se le ocurrieron. Lo que
 * se genera acá son formas de jugar —bien, mal, alternando, siempre pésimo— y
 * lo que se afirma es que ninguna de ellas encuentra una salida distinta.
 *
 * Corre sobre seis etapas sintéticas y no sobre 7.º: una carrera de un solo año
 * no puede mostrar que el sistema converge en seis.
 */

const dependencies: EngineDependencies = createSixStageDependencies()

/** How a synthetic player answers: the same intention on every beat. */
type Style = 'best' | 'worst' | 'alternating'

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
      return {
        kind: 'numeric-input',
        value: best ? interaction.max : interaction.min,
      }
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
          quantity: best ? 2 : 0,
        })),
      }
  }
}

interface Played {
  readonly state: RunState
  readonly steps: number
  readonly ordinary: number
  readonly recoveries: number
  readonly issues: readonly string[]
}

/** Plays a whole career, capped hard so a non-converging run fails loudly. */
function play(seed: string, style: Style, cap = 200): Played {
  const created = createRun(
    {
      runId: toRunId(`career-${seed}`),
      seed: toRunSeed(seed),
      mode: 'practice',
      difficulty: 'adaptive',
      gameVersion: ENGINE_VERSION,
      rulesetVersion: SIX_STAGE_RULESET_VERSION,
      contentVersion: '1.0.0-test',
    },
    dependencies,
  )
  if (!created.ok) throw new Error(`no se pudo crear: ${created.error.kind}`)

  let state = created.value.state
  const issues: string[] = []
  let steps = 0

  while (state.status === 'active' && steps < cap) {
    let command: GameCommand = { type: 'CONTINUE' }

    if (state.phase === 'challenge') {
      const view = activeChallengeView(state, dependencies)
      if (!view.ok || view.value === undefined) throw new Error('sin vista')
      const best =
        style === 'best'
          ? true
          : style === 'worst'
            ? false
            : state.history.length % 2 === 0
      command = {
        type: 'ANSWER',
        instanceId: view.value.ref.instanceId,
        answer: answerFor(view.value, best),
      }
    }

    const result = transition(state, command, dependencies)
    if (!result.ok) throw new Error(`rechazado: ${result.error.kind}`)
    state = result.value.state
    steps += 1
    issues.push(...runStateIssues(state))
  }

  return {
    state,
    steps,
    ordinary: state.history.filter(
      (entry) => entry.challengeId !== undefined && entry.recovery !== true,
    ).length,
    recoveries: state.history.filter((entry) => entry.recovery === true).length,
    issues,
  }
}

const seedArbitrary = fc
  .stringMatching(/^[A-Za-z0-9][A-Za-z0-9.:-]{0,15}$/u)
  .filter((value) => value.length > 0)

const styleArbitrary = fc.constantFrom<Style>('best', 'worst', 'alternating')

describe('toda carrera válida termina en egreso', () => {
  it('converge para cualquier seed y cualquier forma de jugar', () => {
    fc.assert(
      fc.property(seedArbitrary, styleArbitrary, (seed, style) => {
        const played = play(seed, style)

        expect(played.state.status).toBe('completed')
        expect(played.state.completion?.graduated).toBe(true)
        expect(played.state.progression.graduated).toBe(true)
      }),
      { numRuns: 300 },
    )
  })

  it('nunca queda debiendo nada al terminar', () => {
    fc.assert(
      fc.property(seedArbitrary, styleArbitrary, (seed, style) => {
        expect(play(seed, style).state.progression.pending).toHaveLength(0)
      }),
      { numRuns: 300 },
    )
  })

  it('nunca pasa por un estado estructuralmente inválido', () => {
    fc.assert(
      fc.property(seedArbitrary, styleArbitrary, (seed, style) => {
        expect(play(seed, style).issues).toEqual([])
      }),
      { numRuns: 200 },
    )
  })

  it('termina en una cantidad acotada de eventos, no «eventualmente»', () => {
    fc.assert(
      fc.property(seedArbitrary, styleArbitrary, (seed, style) => {
        const played = play(seed, style)
        // Seis años de tres eventos, más un repaso por año como mucho: 24
        // eventos y sus continuaciones. El tope duro del bucle es 200, así que
        // si esto se cumple no fue por haberse quedado sin intentos.
        expect(played.steps).toBeLessThan(120)
        expect(played.ordinary).toBe(SIX_STAGE_IDS.length * 2)
      }),
      { numRuns: 200 },
    )
  })
})

describe('la recuperación está acotada por construcción', () => {
  it('un año juega como mucho un repaso, jugando lo peor posible', () => {
    fc.assert(
      fc.property(seedArbitrary, (seed) => {
        const played = play(seed, 'worst')

        // Uno por año como techo, y la política es quien lo dice.
        expect(played.recoveries).toBeLessThanOrEqual(SIX_STAGE_IDS.length)
        for (const stageId of SIX_STAGE_IDS) {
          expect(
            played.state.progression.history.filter(
              (entry) => entry.stageId === stageId,
            ),
          ).toHaveLength(
            played.state.progression.history.some(
              (entry) => entry.stageId === stageId,
            )
              ? 1
              : 0,
          )
        }
      }),
      { numRuns: 150 },
    )
  })

  it('jugar impecable no gasta ningún repaso', () => {
    fc.assert(
      fc.property(seedArbitrary, (seed) => {
        const played = play(seed, 'best')
        expect(played.recoveries).toBe(0)
        expect(played.state.completion?.previas).toBe(0)
        expect(played.state.completion?.graduated).toBe(true)
      }),
      { numRuns: 150 },
    )
  })

  it('un repaso nunca genera otro repaso', () => {
    fc.assert(
      fc.property(seedArbitrary, (seed) => {
        const played = play(seed, 'worst')

        // Cada registro cierra obligaciones y ninguna obligación nace de un
        // beat de repaso: la recursión no existe porque no tiene dónde
        // escribirse, y esto lo comprueba sobre la historia real.
        const fromRecovery = played.state.history.filter(
          (entry) => entry.recovery === true,
        )
        expect(fromRecovery.length).toBe(played.recoveries)
        expect(played.state.progression.pending).toHaveLength(0)
      }),
      { numRuns: 150 },
    )
  })

  it('el peor jugador posible juega más, y termina igual', () => {
    fc.assert(
      fc.property(seedArbitrary, (seed) => {
        const clean = play(seed, 'best')
        const messy = play(seed, 'worst')

        expect(clean.state.completion?.graduated).toBe(true)
        expect(messy.state.completion?.graduated).toBe(true)
        // Equivocarse compra más juego, no menos. Ésa es la diferencia entre
        // fail-forward y un sistema de vidas.
        expect(messy.ordinary).toBe(clean.ordinary)
        expect(messy.recoveries).toBeGreaterThanOrEqual(clean.recoveries)
      }),
      { numRuns: 150 },
    )
  })
})
