import { describe, expect, it } from 'vitest'

import {
  promedio,
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
  targetsFor,
  serializeSnapshot,
  transition,
  type EngineDependencies,
  type GameCommand,
  type InteractionAnswer,
  type PresentedGridRound,
  type PublicChallengeView,
  type RunDescriptor,
  type RunState,
} from '@/game'
import {
  createGrade7Dependencies,
  createGrade7RunDescriptor,
  grade7StoryletIds,
} from '@/content/grade-7'

/**
 * La run completa de 7.º grado, sin React.
 *
 * Prueba que el juego funciona antes de que exista una pantalla: el año se
 * recorre entero, la bifurcación narrativa responde a cómo se jugó, y el
 * resultado se puede reproducir desde el log de acciones.
 */

const dependencies = createGrade7Dependencies()

function descriptorFor(seed: string): RunDescriptor {
  return createGrade7RunDescriptor(seed)
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
    case 'numeric-input': {
      /*
       * Un barrido entero del rango que la pantalla ofrece.
       *
       * La respuesta no está entre opciones: el jugador la produce. Para que el
       * test pueda jugar bien y jugar mal de verdad, enumera todos los valores
       * posibles y deja que el evaluador diga cuál es cuál — que es exactamente
       * lo que hace con las demás interacciones.
       */
      const low = Math.ceil(Number(interaction.min))
      const high = Math.floor(Number(interaction.max))
      const step = Math.max(1, Math.round(Number(interaction.step)))
      const values: InteractionAnswer[] = []
      for (let value = low; value <= high; value += step) {
        values.push({ kind: 'numeric-input' as const, value: String(value) })
      }
      return values
    }
    case 'number-grid': {
      /*
       * Cuatro respuestas que cubren el espectro del minijuego: la clasificación
       * exacta, marcar todo, no marcar nada y el atajo de marcar una sola celda.
       * Las tres últimas existen para que la estrategia «débil» tenga con qué
       * jugar mal, y para que la comparación entre jugar bien y jugar mal sea
       * real y no un empate.
       *
       * La regla viene en la vista pública porque el jugador la lee en pantalla;
       * quién acierta lo sigue decidiendo el evaluador del motor.
       */
      const perRound = (
        pick: (round: PresentedGridRound) => readonly number[],
      ): InteractionAnswer => ({
        kind: 'number-grid' as const,
        rounds: interaction.rounds.map((round) => ({
          roundId: round.id,
          numbers: [...pick(round)],
        })),
      })

      return [
        perRound((round) => targetsFor(round.rule, round.numbers)),
        perRound((round) => round.numbers),
        perRound(() => []),
        perRound((round) => targetsFor(round.rule, round.numbers).slice(0, 1)),
      ]
    }
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
  /** El estado después de cada comando, para poder mirar el año por dentro. */
  readonly states: readonly RunState[]
}

/** Juega la run entera con una estrategia dada. */
function play(seed: string, strategy: Strategy): PlayedRun {
  const descriptor = descriptorFor(seed)
  const created = createRun(descriptor, dependencies)
  if (!created.ok) throw new Error('no se pudo crear la run')

  let state = created.value.state
  let log = emptyActionLog(descriptor)
  const commands: GameCommand[] = []
  const states: RunState[] = []
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
    states.push(state)
  }

  return { state, log, commands, states }
}

/** El estado justo antes de que se resolviera un storylet dado. */
function beforeResolving(played: PlayedRun, storyletId: string): RunState {
  const found = played.states.find((state) =>
    state.history.some((entry) => entry.storyletId === storyletId),
  )
  if (found === undefined) {
    throw new Error(`el año nunca llegó a ${storyletId}`)
  }
  const index = played.states.indexOf(found)
  const previous = played.states[index - 1]
  if (previous === undefined) {
    throw new Error(`${storyletId} fue el primer evento del año`)
  }
  return previous
}

describe('la run de 7.º grado', () => {
  it('recorre el año completo y lo termina', () => {
    const { state } = play('slice-feliz', 'fuerte')

    expect(state.status).toBe('completed')
    expect(state.stage).toBe('grade-7')
    // Ocho eventos: seis desafíos y dos beats narrativos.
    expect(state.history).toHaveLength(8)
    expect(
      state.history.filter((entry) => entry.challengeId !== undefined),
    ).toHaveLength(6)
    expect(state.completion).toBeDefined()
  })

  it('presenta las seis situaciones en el orden autorado', () => {
    const { state } = play('slice-orden', 'fuerte')

    expect(state.history.map((entry) => entry.storyletId)).toEqual([
      grade7StoryletIds.intro,
      grade7StoryletIds.bus,
      grade7StoryletIds.may25,
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
      expect(state.history).toHaveLength(8)
      expect(state.completion?.totalScore).toBeGreaterThanOrEqual(0)
    },
  )

  it('da mejor resultado al que decide mejor', () => {
    const strong = play('slice-comparar', 'fuerte')
    const weak = play('slice-comparar', 'debil')

    expect(strong.state.scorePreview).toBeGreaterThan(weak.state.scorePreview)

    // El mural es el único evento académico del año, así que el Promedio es la
    // dimensión que separa a las dos partidas.
    const strongAverage = promedio(strong.state.career)
    const weakAverage = promedio(weak.state.career)
    expect(strongAverage).not.toBeNull()
    expect(weakAverage).not.toBeNull()
    expect(strongAverage ?? 0).toBeGreaterThan(weakAverage ?? 0)
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

describe('Aura', () => {
  /**
   * La dimensión que este año existía y nunca aparecía.
   *
   * Aura es capital narrativo y sólo la mueve un momento público. El acto del 25
   * de Mayo es ese momento, y estos tests son lo que separa «la dimensión está
   * implementada» de «la dimensión se juega».
   */

  it('no está establecida antes del acto', () => {
    const played = play('slice-aura-antes', 'fuerte')
    const before = beforeResolving(played, grade7StoryletIds.may25)

    // `null` no es 0: la tira de carrera no dibuja nada, en lugar de dibujar
    // «Aura 0» sobre una dimensión que la run todavía no tocó.
    expect(before.career.aura).toBeNull()
    expect(
      before.history.every(
        (entry) => entry.storyletId !== grade7StoryletIds.may25,
      ),
    ).toBe(true)
  })

  it('la establece un acto que sale bien, y queda positiva', () => {
    const played = play('slice-aura-bien', 'fuerte')

    expect(played.state.career.aura).not.toBeNull()
    expect(played.state.career.aura ?? 0).toBeGreaterThan(0)
  })

  it('la establece en negativo un acto que se cae', () => {
    const played = play('slice-aura-mal', 'debil')

    expect(played.state.career.aura).not.toBeNull()
    expect(played.state.career.aura ?? 0).toBeLessThan(0)
  })

  it('el acto es el único evento del año que la mueve', () => {
    const played = play('slice-aura-unico', 'fuerte')

    // Antes del acto no existe; después no vuelve a cambiar, porque ninguna otra
    // situación de 7.º es socialmente memorable.
    const afterAct = played.states.find((state) =>
      state.history.some(
        (entry) => entry.storyletId === grade7StoryletIds.may25,
      ),
    )
    expect(afterAct?.career.aura).toBeDefined()
    expect(played.state.career.aura).toBe(afterAct?.career.aura)
  })

  it('el acto no pone nota ni mueve Equipo', () => {
    const played = play('slice-aura-limites', 'fuerte')
    const before = beforeResolving(played, grade7StoryletIds.may25)
    const after = played.states.find((state) =>
      state.history.some(
        (entry) => entry.storyletId === grade7StoryletIds.may25,
      ),
    )
    if (after === undefined) throw new Error('el año nunca llegó al acto')

    // El legajo de notas y la conducta hacia el grupo quedan donde estaban:
    // tener números no vuelve académico a un evento, y bailar solo no es
    // trabajar en equipo.
    expect(after.career.grades).toEqual(before.career.grades)
    expect(after.career.equipo).toBe(before.career.equipo)
  })

  it('deja evidencia de Estilo sin volver superior a ningún eje', () => {
    const strong = play('slice-aura-estilo', 'fuerte')
    const weak = play('slice-aura-estilo', 'debil')

    // Las dos partidas empujan el triángulo, en direcciones distintas: el acto
    // impecable es Aplicado y el que se cae sigue siendo Improvisador. Ninguno
    // de los dos gana nada por serlo; los dos siguen jugando el año.
    expect(strong.state.career.estiloEvidence).toBeGreaterThan(0)
    expect(weak.state.career.estiloEvidence).toBeGreaterThan(0)
    expect(strong.state.status).toBe('completed')
    expect(weak.state.status).toBe('completed')
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
    expect(replayed.value.state.career).toEqual(played.state.career)
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
   *
   * El segundo evento dice `g7.bus-latest-departure` desde que la familia
   * colectivo tiene dos plantillas: esta seed cae en la que pregunta con cuánto
   * tiempo salir en vez de en la que ofrece cuatro horarios. Es el cambio de
   * contenido que la etapa buscaba, y por eso la versión de contenido subió.
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
      'g7.bus|g7.bus-latest-departure|optimal',
      'g7.may-25|g7.may-25-act|optimal',
      'g7.mural|g7.mural-paint|optimal',
      'g7.notebook|g7.notebook-offer|optimal',
      'g7.project-lead|-|-',
      'g7.group-work|g7.group-tasks|optimal',
      'g7.fair-stand|g7.stand-supplies|optimal',
    ])
    expect(state.scorePreview).toBeGreaterThan(0)
  })
})
