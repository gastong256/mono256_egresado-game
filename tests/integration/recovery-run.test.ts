import { describe, expect, it } from 'vitest'

import {
  activeChallengeView,
  appendAction,
  createRun,
  emptyActionLog,
  isErr,
  isOk,
  materializeChallenge,
  parseActionLog,
  qualityRank,
  replayRun,
  restoreSnapshot,
  scoreRun,
  scoredEventsOf,
  serializeActionLog,
  serializeSnapshot,
  targetsFor,
  transition,
  candidateFairScorePolicy,
  type EngineDependencies,
  type GameCommand,
  type InteractionAnswer,
  type PublicChallengeView,
  type RunState,
} from '@/game'
import { validateSubmittedRun } from '@/server/game/validate-run'
import {
  createGrade7CompetitiveDependencies,
  createGrade7CompetitiveRunDescriptor,
  createGrade7ComposedDependencies,
  createGrade7ComposedRunDescriptor,
} from '@/content/grade-7'

/**
 * La recuperación en el contenido real de 7.º, de punta a punta.
 *
 * La property test prueba que una carrera converge; esto prueba que el
 * contenido que existe hoy la atraviesa: una situación sale mal, el año pide un
 * repaso, el repaso lo cierra, la partida termina en egreso — y equivocarse no
 * paga.
 */

const dependencies = createGrade7ComposedDependencies()
const competitive = createGrade7CompetitiveDependencies()

/** Every answer worth trying for an interaction, so «best» and «worst» are real. */
function candidateAnswers(view: PublicChallengeView): InteractionAnswer[] {
  const interaction = view.interaction

  switch (interaction.kind) {
    case 'timeline':
    case 'decision-card':
    case 'chart-interpretation':
    case 'information-request':
      return interaction.options.map((option) => ({
        kind: interaction.kind,
        optionId: option.id,
      }))
    case 'numeric-input': {
      const low = Math.ceil(Number(interaction.min))
      const high = Math.floor(Number(interaction.max))
      const values: InteractionAnswer[] = []
      for (let value = low; value <= high; value += 1) {
        values.push({ kind: 'numeric-input', value: String(value) })
      }
      return values
    }
    case 'number-grid':
      return [
        // La clasificación correcta, que es la única forma de jugar bien el
        // acto: sin ella, «lo mejor disponible» sería igual un resultado
        // insuficiente y la prueba no distinguiría nada.
        {
          kind: 'number-grid',
          rounds: interaction.rounds.map((round) => ({
            roundId: round.id,
            numbers: [...targetsFor(round.rule, round.numbers)],
          })),
        },
        {
          kind: 'number-grid',
          rounds: interaction.rounds.map((round) => ({
            roundId: round.id,
            numbers: [...round.numbers],
          })),
        },
        {
          kind: 'number-grid',
          rounds: interaction.rounds.map((round) => ({
            roundId: round.id,
            numbers: round.numbers.slice(0, 1),
          })),
        },
      ]
    case 'assignment-board':
      return [
        {
          kind: 'assignment-board',
          assignments: interaction.tasks.flatMap((task, index) => {
            const agent = interaction.agents[index]
            return agent === undefined
              ? []
              : [{ agentId: agent.id, taskId: task.id }]
          }),
        },
      ]
    case 'budget-builder':
      return [
        {
          kind: 'budget-builder',
          lines: interaction.items.map((item) => ({
            itemId: item.id,
            quantity: 1,
          })),
        },
      ]
  }
}

/** The engine's own opinion of which answer is best or worst. */
function pick(
  state: RunState,
  view: PublicChallengeView,
  best: boolean,
  deps: EngineDependencies,
): InteractionAnswer {
  const materialized = materializeChallenge(state.descriptor, view.ref, deps)
  if (!materialized.ok) throw new Error('no se pudo materializar')

  const scored = candidateAnswers(view).flatMap((answer) => {
    const result = materialized.value.evaluate(answer, [])
    return result.ok
      ? [{ answer, rank: qualityRank(result.value.quality) }]
      : []
  })
  const sorted = [...scored].sort((left, right) => right.rank - left.rank)
  const chosen = best ? sorted[0] : sorted[sorted.length - 1]
  if (chosen === undefined) throw new Error('sin candidatas')
  return chosen.answer
}

interface Played {
  readonly state: RunState
  readonly commands: readonly GameCommand[]
  readonly states: readonly RunState[]
}

function play(
  seed: string,
  best: boolean | ((templateId: string) => boolean),
  deps = dependencies,
  descriptorFor = createGrade7ComposedRunDescriptor,
): Played {
  const wants = (templateId: string): boolean =>
    typeof best === 'boolean' ? best : best(templateId)

  const descriptor = descriptorFor(seed)
  if (!isOk(descriptor)) throw new Error('no compuso')

  const created = createRun(descriptor.value, deps)
  if (!created.ok) throw new Error(`no se pudo crear: ${created.error.kind}`)

  let state = created.value.state
  const commands: GameCommand[] = []
  const states: RunState[] = [state]

  for (let step = 0; step < 40 && state.status === 'active'; step += 1) {
    let command: GameCommand = { type: 'CONTINUE' }
    if (state.phase === 'challenge') {
      const view = activeChallengeView(state, deps)
      if (!view.ok || view.value === undefined) throw new Error('sin vista')
      command = {
        type: 'ANSWER',
        instanceId: view.value.ref.instanceId,
        answer: pick(
          state,
          view.value,
          wants(String(view.value.ref.templateId)),
          deps,
        ),
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

const SEEDS = ['rec-a', 'rec-b', 'rec-c', 'rec-d']

describe('el año que sale mal pide un repaso, y sigue', () => {
  it('una situación sin resolver deja algo por cerrar', () => {
    const played = play('rec-a', false)

    expect(played.state.progression.history.length).toBeGreaterThan(0)
    expect(played.state.progression.history[0]?.stageId).toBe('grade-7')
  })

  it('el repaso es contenido de recuperación, no una situación ordinaria', () => {
    const played = play('rec-a', false)
    const recovery = played.state.history.filter(
      (entry) => entry.recovery === true,
    )

    expect(recovery).toHaveLength(1)
    expect(recovery[0]?.challengeId).toBe('g7.bus-travel-review')

    const template = dependencies.catalog.template(
      'g7.bus-travel-review' as never,
    )
    expect(template?.placement).toBe('recovery')
  })

  it('no gasta ninguno de los beats que el año había compuesto', () => {
    for (const seed of SEEDS) {
      const played = play(seed, false)
      const ordinary = played.state.history.filter(
        (entry) => entry.challengeId !== undefined && entry.recovery !== true,
      )
      const planned = played.state.plan?.stages[0]?.beats.length ?? 0

      // El repaso vive afuera del presupuesto. Si lo gastara, equivocarse le
      // costaría al jugador una de las decisiones que el año iba a darle.
      expect(ordinary).toHaveLength(planned)
    }
  })

  it('la partida termina en egreso igual', () => {
    for (const seed of SEEDS) {
      for (const best of [true, false]) {
        const played = play(seed, best)
        expect(played.state.status).toBe('completed')
        expect(played.state.completion?.graduated).toBe(true)
        expect(played.state.progression.pending).toHaveLength(0)
      }
    }
  })

  it('jugando bien no aparece ningún repaso', () => {
    const played = play('rec-b', true)
    expect(
      played.state.history.filter((e) => e.recovery === true),
    ).toHaveLength(0)
    expect(played.state.completion?.recoveries).toBe(0)
    expect(played.state.completion?.graduated).toBe(true)
  })

  it('una plantilla sin repaso declarado no deja nada por cerrar', () => {
    // El acto del 25 de Mayo no tiene repaso, y es una decisión escrita: ocurre
    // una vez y en público. Que salga mal tiene consecuencia —nota, score,
    // Aura— y no deuda.
    const played = play('rec-a', (templateId) => !templateId.includes('may-25'))
    const act = played.state.history.filter((entry) =>
      String(entry.challengeId).includes('may-25'),
    )

    expect(act.length).toBeGreaterThan(0)
    expect(act.every((entry) => entry.quality === 'invalid')).toBe(true)
    expect(played.state.progression.pending).toHaveLength(0)
    expect(played.state.completion?.recoveries).toBe(0)
    expect(played.state.completion?.graduated).toBe(true)
  })

  it('el repaso que aparece es el de la situación que salió mal', () => {
    // Nunca el de otra: fallar el acto y que el juego devuelva una cuenta de
    // colectivos sería un disparate con forma de remediación.
    const played = play('rec-a', false)
    const owed = played.state.progression.history[0]
    const ordinary = played.state.history.filter(
      (entry) => entry.recovery !== true && entry.quality === 'invalid',
    )

    expect(owed?.content?.familyId).toBe('bus')
    expect(
      ordinary.some((entry) => String(entry.challengeId).startsWith('g7.bus')),
    ).toBe(true)
  })

  it('un repaso que también sale mal cierra el año y deja una previa', () => {
    const played = play('rec-a', false)
    const record = played.state.progression.history[0]

    expect(record?.previa).toBe(true)
    expect(played.state.completion?.previas).toBe(1)
    // Y no abre otro: la partida terminó.
    expect(played.state.progression.pending).toHaveLength(0)
  })

  it('el repaso no repite la variante que el jugador acaba de ver', () => {
    const played = play('rec-a', false)
    const recovery = played.state.progression.history[0]?.content
    const ordinary = played.state.history.filter(
      (entry) => entry.recovery !== true && entry.challengeId !== undefined,
    )

    // Vuelve sobre el mismo concepto —misma familia— con otra plantilla: no es
    // la misma pregunta otra vez, que sería un reintento.
    expect(recovery?.familyId).toBe('bus')
    expect(
      ordinary.every((entry) => entry.challengeId !== recovery?.templateId),
    ).toBe(true)
  })
})

describe('equivocarse no paga', () => {
  it('el repaso no suma evidencia competitiva', () => {
    const played = play('rec-a', false)
    const scored = scoredEventsOf(played.state.history)
    const result = scoreRun(
      scored,
      dependencies.catalog,
      candidateFairScorePolicy,
    )
    if (!isOk(result)) throw new Error(`no puntuó: ${result.error.code}`)

    const ordinary = played.state.history.filter(
      (entry) => entry.challengeId !== undefined && entry.recovery !== true,
    ).length

    // El scorer recibe también el beat de repaso y lo descarta por su rol.
    expect(scored.length).toBeGreaterThan(ordinary)
    expect(result.value.scoredBeats).toBe(ordinary)
  })

  it('fallar y recuperarse perfecto nunca supera a jugar bien de entrada', () => {
    /*
     * La prueba adversaria de la etapa.
     *
     * Si el repaso puntuara, equivocarse a propósito sería una forma de
     * comprarse una oportunidad extra, y toda la comparabilidad que el
     * compositor construye se caería por esa puerta.
     */
    for (const seed of SEEDS) {
      const clean = play(seed, true)
      const messy = play(seed, false)

      const scoreOf = (played: Played): number => {
        const result = scoreRun(
          scoredEventsOf(played.state.history),
          dependencies.catalog,
          candidateFairScorePolicy,
        )
        if (!isOk(result)) throw new Error('no puntuó')
        return result.value.fairScore
      }

      expect(
        messy.state.history.filter((e) => e.recovery === true).length,
      ).toBeGreaterThan(0)
      expect(scoreOf(messy)).toBeLessThan(scoreOf(clean))
    }
  })

  it('el repaso tampoco agranda el denominador', () => {
    const clean = play('rec-c', true)
    const messy = play('rec-c', false)

    const maxOf = (played: Played): number => {
      const result = scoreRun(
        scoredEventsOf(played.state.history),
        dependencies.catalog,
        candidateFairScorePolicy,
      )
      if (!isOk(result)) throw new Error('no puntuó')
      return result.value.mathMax
    }

    // Mismo plan, mismas oportunidades. El repaso no aparece en ninguno de los
    // dos lados de la razón.
    expect(maxOf(messy)).toBe(maxOf(clean))
  })

  it('el resultado original sigue en la historia después del repaso', () => {
    const played = play('rec-a', false)
    const original = played.state.history.filter(
      (entry) => entry.recovery !== true && entry.quality === 'invalid',
    )

    // Recuperarse no borra lo que pasó. La consecuencia sigue siendo parte de
    // cómo egresó ese jugador.
    expect(original.length).toBeGreaterThan(0)
  })
})

describe('el repaso sobrevive a reanudar y a reproducir', () => {
  it('reanudar en medio de un repaso juega el mismo repaso', () => {
    const played = play('rec-a', false)
    const midRecovery = played.states.find(
      (state) =>
        state.phase === 'challenge' && state.activeEvent?.recovery === true,
    )
    if (midRecovery === undefined)
      throw new Error('la run no llegó a un repaso')

    const restored = restoreSnapshot(serializeSnapshot(midRecovery), {
      gameVersion: midRecovery.descriptor.gameVersion,
      rulesetVersion: midRecovery.descriptor.rulesetVersion,
      contentVersion: midRecovery.descriptor.contentVersion,
    })
    if (!isOk(restored)) throw new Error('no se pudo restaurar')

    expect(restored.value.activeEvent?.recovery).toBe(true)
    expect(restored.value.activeEvent?.challenge).toEqual(
      midRecovery.activeEvent?.challenge,
    )
    expect(restored.value.progression).toEqual(midRecovery.progression)
  })

  it('reproducir el log llega al mismo egreso', () => {
    const played = play('rec-d', false)
    let log = emptyActionLog(played.state.descriptor)
    for (const command of played.commands) {
      log = appendAction(log, command)
    }

    const parsed = parseActionLog(serializeActionLog(log))
    if (!isOk(parsed)) throw new Error('el log no se pudo parsear')

    const replayed = replayRun(parsed.value, dependencies)
    if (!isOk(replayed)) throw new Error('la reproducción falló')

    expect(replayed.value.state.progression).toEqual(played.state.progression)
    expect(replayed.value.state.completion?.graduated).toBe(true)
    expect(
      replayed.value.state.history.map((entry) => entry.challengeId),
    ).toEqual(played.state.history.map((entry) => entry.challengeId))
  })
})

describe('el servidor decide si alguien egresó', () => {
  it('lo calcula reproduciendo, no leyéndolo', () => {
    const played = play(
      'rec-a',
      false,
      competitive,
      createGrade7CompetitiveRunDescriptor,
    )
    let log = emptyActionLog(played.state.descriptor)
    for (const command of played.commands) {
      log = appendAction(log, command)
    }

    const result = validateSubmittedRun(serializeActionLog(log), competitive)
    if (!isOk(result))
      throw new Error(`el servidor rechazó: ${result.error.kind}`)

    expect(result.value.graduated).toBe(true)
    expect(result.value.recoveries).toBe(
      played.state.progression.history.length,
    )
    expect(result.value.previas).toBe(played.state.completion?.previas)
  })

  it('un reclamo de egreso adjunto a la submission no cambia nada', () => {
    const played = play(
      'rec-b',
      false,
      competitive,
      createGrade7CompetitiveRunDescriptor,
    )
    let log = emptyActionLog(played.state.descriptor)
    for (const command of played.commands) {
      log = appendAction(log, command)
    }

    const tampered = {
      ...(serializeActionLog(log) as Record<string, unknown>),
      graduated: true,
      progression: { graduated: true, pending: [], history: [] },
      recoveries: 0,
    }

    const honest = validateSubmittedRun(serializeActionLog(log), competitive)
    const claimed = validateSubmittedRun(tampered, competitive)
    if (!isOk(honest) || !isOk(claimed))
      throw new Error('rechazó una run válida')

    expect(claimed.value.graduated).toBe(honest.value.graduated)
    expect(claimed.value.recoveries).toBe(honest.value.recoveries)
  })

  it('una run que no terminó no egresa', () => {
    const played = play(
      'rec-c',
      false,
      competitive,
      createGrade7CompetitiveRunDescriptor,
    )
    let log = emptyActionLog(played.state.descriptor)
    // Un log truncado: la partida quedó sin terminar.
    for (const command of played.commands.slice(0, 2)) {
      log = appendAction(log, command)
    }

    const result = validateSubmittedRun(serializeActionLog(log), competitive)
    // El servidor no devuelve resultado oficial de una run inconclusa.
    expect(isErr(result)).toBe(true)
  })

  it('egresar y puntuar bajo son compatibles', () => {
    const played = play(
      'rec-a',
      false,
      competitive,
      createGrade7CompetitiveRunDescriptor,
    )
    let log = emptyActionLog(played.state.descriptor)
    for (const command of played.commands) {
      log = appendAction(log, command)
    }

    const result = validateSubmittedRun(serializeActionLog(log), competitive)
    if (!isOk(result)) throw new Error('rechazó la run')

    // Se egresa por haber recorrido la carrera, no por haber puntuado alto.
    expect(result.value.graduated).toBe(true)
    expect(result.value.competitiveScore?.fairScore).toBeLessThan(10_000)
  })
})
