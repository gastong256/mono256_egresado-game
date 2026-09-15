/**
 * Synthetic player.
 *
 * Drives a run without a browser so integration tests, replay checks and mass
 * simulation can all exercise the same code path a person would.
 *
 * The agent is itself deterministic: it draws from a seeded substream, so a
 * simulated run is as reproducible as a played one. It answers from the *public*
 * view only — it never sees a model or an evaluator — which is what makes it a
 * fair proxy for a real client.
 */

import { assertNever } from '../core/exhaustive'
import { isErr, type Result } from '../core/result'
import type { EngineRejection } from '../core/errors'
import type {
  InteractionAnswer,
  InteractionPresentation,
} from '../challenges/interactions'
import { createRng, type Rng } from '../random/rng'
import {
  appendAction,
  emptyActionLog,
  type RunActionLog,
} from '../runs/action-log'
import type { GameCommand } from '../runs/commands'
import type { DomainEvent } from '../runs/events'
import type { RunDescriptor, RunState } from '../runs/state'
import {
  activeChallengeView,
  createRun,
  transition,
  type EngineDependencies,
} from '../runs/transition'

export interface AgentOptions {
  /** Probability, in percent, of consulting each offered optional datum. */
  readonly informationChancePercent: number
  /** Hard stop protecting the harness from a content loop. */
  readonly maxCommands: number
}

export const DEFAULT_AGENT_OPTIONS: AgentOptions = {
  informationChancePercent: 50,
  maxCommands: 200,
}

/** Produces a structurally valid answer for any contracted interaction. */
export function synthesizeAnswer(
  presentation: InteractionPresentation,
  rng: Rng,
): InteractionAnswer {
  switch (presentation.kind) {
    case 'schedule-builder':
      return {
        kind: 'schedule-builder',
        placements: presentation.activities.map((activity) => ({
          activityId: activity.id,
          startMinute: rng.pick(activity.startMinutes),
        })),
      }
    case 'spatial-layout':
      return {
        kind: 'spatial-layout',
        placements: presentation.objects.map((object) => ({
          objectId: object.id,
          x: rng.nextInt(0, presentation.width - 1),
          y: rng.nextInt(0, presentation.height - 1),
          rotation: object.rotatable && rng.chance(1, 2) ? 90 : 0,
        })),
      }
    case 'decision-card':
      return {
        kind: 'decision-card',
        optionId: rng.pick(presentation.options).id,
      }
    case 'timeline':
      return { kind: 'timeline', optionId: rng.pick(presentation.options).id }
    case 'chart-interpretation':
      return {
        kind: 'chart-interpretation',
        optionId: rng.pick(presentation.options).id,
      }
    case 'information-request':
      return {
        kind: 'information-request',
        optionId: rng.pick(presentation.options).id,
      }
    case 'numeric-input': {
      const min = Number(presentation.min)
      const max = Number(presentation.max)
      const low = Number.isFinite(min) ? Math.ceil(min) : 0
      const high = Number.isFinite(max) ? Math.floor(max) : low + 100
      return {
        kind: 'numeric-input',
        value: String(rng.nextInt(low, Math.max(low, high))),
      }
    }
    case 'quantity-builder':
    case 'budget-builder':
      return {
        kind: presentation.kind,
        lines: presentation.items.map((item) => ({
          itemId: item.id,
          quantity: rng.nextInt(0, Math.min(item.maxQuantity, 6)),
        })),
      }
    case 'number-grid':
      // Marks each cell on a coin flip. The agent answers from the public view
      // only, so it does not apply the rule: what it exercises is that any
      // structurally valid selection — including none and all of them — is
      // evaluated without breaking the run.
      return {
        kind: 'number-grid',
        rounds: presentation.rounds.map((round) => {
          const roundRng = rng.derive('round', round.id)
          return {
            roundId: round.id,
            numbers: round.numbers.filter(() => roundRng.chance(1, 2)),
          }
        }),
      }
    case 'assignment-board': {
      // Assign distinct members to tasks so the answer is at least structurally
      // plausible; feasibility is still the engine's decision.
      const shuffled = rng.shuffle(presentation.agents)
      return {
        kind: 'assignment-board',
        assignments: presentation.tasks.flatMap((task, index) => {
          const agent = shuffled[index]
          return agent === undefined
            ? []
            : [{ agentId: agent.id, taskId: task.id }]
        }),
      }
    }
    case 'classification':
      // Label every statement and, when the Template asks for a public stance,
      // pick one too: an incomplete classification is not a legal answer.
      return {
        kind: 'classification',
        entries: presentation.statements.map((statement) => ({
          statementId: statement.id,
          labelId: rng.pick(presentation.labels).id,
        })),
        ...(presentation.stance === undefined
          ? {}
          : { stance: rng.pick(presentation.stance.options).id }),
      }
    default:
      return assertNever(presentation)
  }
}

export interface SimulatedRun {
  readonly state: RunState
  readonly log: RunActionLog
  readonly events: readonly DomainEvent[]
  readonly commands: number
}

/**
 * Plays a full run to completion.
 *
 * Returns a rejection instead of throwing when the engine refuses a command:
 * during a sweep that is a finding to report, not a crash.
 */
export function simulateRun(
  descriptor: RunDescriptor,
  dependencies: EngineDependencies,
  options: AgentOptions = DEFAULT_AGENT_OPTIONS,
): Result<SimulatedRun, EngineRejection> {
  const created = createRun(descriptor, dependencies)
  if (isErr(created)) {
    return created
  }

  let state = created.value.state
  let log = emptyActionLog(descriptor)
  const events: DomainEvent[] = [...created.value.events]
  let commands = 0

  const apply = (command: GameCommand): EngineRejection | undefined => {
    const result = transition(state, command, dependencies)
    if (isErr(result)) {
      return result.error
    }
    state = result.value.state
    log = appendAction(log, command)
    events.push(...result.value.events)
    commands += 1
    return undefined
  }

  while (state.status === 'active' && commands < options.maxCommands) {
    const rng = createRng(descriptor.seed, [
      'agent',
      'event',
      state.eventIndex,
      'decision',
    ])

    if (state.phase === 'narrative' || state.phase === 'feedback') {
      const failure = apply({ type: 'CONTINUE' })
      if (failure !== undefined) {
        return { ok: false, error: failure }
      }
      continue
    }

    if (state.phase === 'challenge') {
      const view = activeChallengeView(state, dependencies)
      if (isErr(view)) {
        return view
      }
      const current = view.value
      if (current === undefined) {
        return {
          ok: false,
          error: {
            kind: 'invalid-transition',
            phase: state.phase,
            command: 'ANSWER',
          },
        }
      }

      const instanceId = current.ref.instanceId

      // Optionally consult the offered data before deciding, which exercises
      // REQUEST_INFO and moves the information-use metric.
      if (current.interaction.kind === 'information-request') {
        for (const entry of current.interaction.available) {
          if (rng.chance(options.informationChancePercent, 100)) {
            const failure = apply({
              type: 'REQUEST_INFO',
              instanceId,
              key: entry.key,
            })
            if (failure !== undefined) {
              return { ok: false, error: failure }
            }
          }
        }
      }

      // The presentation may have changed once data was revealed.
      const refreshed = activeChallengeView(state, dependencies)
      if (isErr(refreshed)) {
        return refreshed
      }
      const presentation = refreshed.value?.interaction ?? current.interaction

      const failure = apply({
        type: 'ANSWER',
        instanceId,
        answer: synthesizeAnswer(presentation, rng.derive('answer')),
      })
      if (failure !== undefined) {
        return { ok: false, error: failure }
      }
      continue
    }

    break
  }

  return { ok: true, value: { state, log, events, commands } }
}
