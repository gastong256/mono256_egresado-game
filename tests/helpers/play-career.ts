import {
  activeChallengeView,
  appendAction,
  createRun,
  emptyActionLog,
  serializeActionLog,
  transition,
  type GameCommand,
  type RunDescriptor,
  type RunState,
  type SolutionQuality,
} from '@/game'
import { createFullCareerDependencies } from '@/content/full-career'
import { grade5Answer } from './grade-5-play'

/** Plays the actual engine from an issued descriptor; no application backdoor. */
export function playCareer(
  descriptor: RunDescriptor,
  quality: SolutionQuality,
  stopAfterAnswers?: number,
): { state: RunState; log: unknown } {
  const dependencies = createFullCareerDependencies()
  const created = createRun(descriptor, dependencies)
  if (!created.ok) throw new Error('no se pudo crear la run')

  let state = created.value.state
  let log = emptyActionLog(descriptor)
  let answered = 0

  for (let step = 0; step < 400 && state.status === 'active'; step += 1) {
    let command: GameCommand = { type: 'CONTINUE' }
    if (state.phase === 'challenge') {
      if (stopAfterAnswers !== undefined && answered >= stopAfterAnswers) {
        // Se corta **en** una situación sin responderla: es el estado que el
        // jugador ve al volver, y el que el checkpoint tiene que restaurar.
        return { state, log: serializeActionLog(log) }
      }
      answered += 1
      const view = activeChallengeView(state, dependencies)
      if (!view.ok || view.value === undefined) throw new Error('sin vista')
      let answer
      try {
        answer = grade5Answer(view.value, dependencies, quality, descriptor)
      } catch {
        answer = grade5Answer(view.value, dependencies, 'optimal', descriptor)
      }
      command = {
        type: 'ANSWER',
        instanceId: view.value.ref.instanceId,
        answer,
      }
    }
    const next = transition(state, command, dependencies)
    if (!next.ok) throw new Error('el motor rechazó un comando')
    state = next.value.state
    log = appendAction(log, command)
  }

  if (stopAfterAnswers === undefined && state.status !== 'completed') {
    throw new Error('la carrera no terminó')
  }
  return { state, log: serializeActionLog(log) }
}
