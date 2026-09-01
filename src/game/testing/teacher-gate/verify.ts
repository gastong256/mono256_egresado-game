/**
 * Does a curated case still show what it promises?
 *
 * A meeting that reproduces is the whole point of curating seeds, so this is
 * the piece that has to be run before the room fills up. It plays the case the
 * way the session will, and reports whether the template the case exists to
 * discuss actually appears.
 *
 * It answers a semantic question — «did this seed reach `g7.bus-timing`» — and
 * deliberately not a cosmetic one. Asserting the words on a card would break
 * every time someone improved the copy, and the meeting would be reported stale
 * for a reason that does not matter.
 */

import type { ChallengeId } from '../../core/branded'
import { variantRefOf } from '../../challenges/contracts'
import { formatVariantAddress } from '../../challenges/content-model'
import type { DifficultyBand } from '../../difficulty/cognitive'
import type { GameCommand } from '../../runs/commands'
import type { RunDescriptor, RunState } from '../../runs/state'
import {
  activeChallengeView,
  createRun,
  transition,
  type EngineDependencies,
} from '../../runs/transition'
import { synthesizeAnswer } from '../agent'
import { createRng } from '../../random/rng'
import type { TeacherGateCase } from './cases'

export interface TeacherGateCaseReport {
  readonly caseId: string
  readonly seed: string
  /** True when the case reached the template it exists to show. */
  readonly reproduces: boolean
  /** Full content address of the instance, for the facilitator's record. */
  readonly address: string | undefined
  readonly band: DifficultyBand | undefined
  /** How many events the run played before reaching it. */
  readonly reachedAtEvent: number | undefined
  /** Every template the run presented, in order. */
  readonly trace: readonly ChallengeId[]
  readonly detail: string
}

/**
 * Plays the case and reports where its template turned up.
 *
 * Answers are synthesised from the public view alone, on a fixed substream, so
 * the walk is deterministic and never depends on anything a person would do.
 * The point is reaching the situation, not scoring it.
 */
export function verifyTeacherGateCase(
  entry: TeacherGateCase,
  descriptor: RunDescriptor,
  dependencies: EngineDependencies,
  maxEvents = 40,
): TeacherGateCaseReport {
  const created = createRun(descriptor, dependencies)
  if (!created.ok) {
    return {
      caseId: entry.id,
      seed: entry.seed,
      reproduces: false,
      address: undefined,
      band: undefined,
      reachedAtEvent: undefined,
      trace: [],
      detail: `la partida no se pudo crear: ${created.error.kind}`,
    }
  }

  let state: RunState = created.value.state
  const trace: ChallengeId[] = []
  const rng = createRng(descriptor.seed, ['teacher-gate', entry.id])

  for (let step = 0; step < maxEvents && state.status === 'active'; step += 1) {
    let command: GameCommand = { type: 'CONTINUE' }

    if (state.phase === 'challenge') {
      const view = activeChallengeView(state, dependencies)
      if (!view.ok || view.value === undefined) {
        break
      }
      const ref = view.value.ref
      trace.push(ref.templateId)

      if (ref.templateId === entry.expectedTemplate) {
        const template = dependencies.catalog.template(ref.templateId)
        return {
          caseId: entry.id,
          seed: entry.seed,
          reproduces: template?.band === entry.expectedBand,
          address: formatVariantAddress(variantRefOf(ref)),
          band: template?.band,
          reachedAtEvent: state.history.length + 1,
          trace,
          detail:
            template?.band === entry.expectedBand
              ? 'el caso reproduce la situación que el pack promete'
              : `la situación aparece pero su nivel es ${String(template?.band)} y el pack declara ${entry.expectedBand}`,
        }
      }

      command = {
        type: 'ANSWER',
        instanceId: ref.instanceId,
        answer: synthesizeAnswer(view.value.interaction, rng),
      }
    }

    const next = transition(state, command, dependencies)
    if (!next.ok) {
      break
    }
    state = next.value.state
  }

  return {
    caseId: entry.id,
    seed: entry.seed,
    reproduces: false,
    address: undefined,
    band: undefined,
    reachedAtEvent: undefined,
    trace,
    detail: `la partida nunca llegó a ${entry.expectedTemplate}; presentó ${trace.join(', ') || 'ninguna situación'}`,
  }
}
