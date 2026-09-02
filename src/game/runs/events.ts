/**
 * Domain events and effect requests.
 *
 * These are two different things and the engine keeps them apart:
 *
 * - a **domain event** is a fact that happened inside the deterministic model,
 *   such as `challenge.evaluated`. It is derived purely from the transition and
 *   is stable enough for future analytics mapping — but analytics naming never
 *   dictates the vocabulary here.
 * - an **effect request** is an instruction for the imperative shell, such as
 *   persisting a checkpoint. The pure engine describes effects; it never runs
 *   them. No analytics SDK, storage call or network request exists in this
 *   layer.
 */

import type {
  ChallengeId,
  ChallengeInstanceId,
  RunId,
  StoryletId,
} from '../core/branded'
import type { SolutionQuality } from '../challenges/taxonomy'
import type { ToolId } from '../challenges/interactions'
import type { FlagValue } from '../narrative/conditions'
import type { ProfileId } from '../profiles/policy'
import type { StageId } from '../progression/stages'
import type { EstiloAxis } from '../progression/career'
import type { RunState } from './state'

export type DomainEvent =
  | { readonly type: 'run.started'; readonly runId: RunId }
  | { readonly type: 'stage.started'; readonly stage: StageId }
  | {
      readonly type: 'storylet.selected'
      readonly storyletId: StoryletId
      readonly stage: StageId
      readonly eventIndex: number
    }
  | {
      readonly type: 'challenge.generated'
      readonly challengeId: ChallengeId
      readonly instanceId: ChallengeInstanceId
      readonly difficulty: number
    }
  | {
      readonly type: 'challenge.presented'
      readonly instanceId: ChallengeInstanceId
    }
  | {
      readonly type: 'information.requested'
      readonly instanceId: ChallengeInstanceId
      readonly key: string
    }
  | {
      readonly type: 'tool.used'
      readonly instanceId: ChallengeInstanceId
      readonly tool: ToolId
    }
  | {
      readonly type: 'challenge.answered'
      readonly instanceId: ChallengeInstanceId
    }
  | {
      readonly type: 'challenge.evaluated'
      readonly instanceId: ChallengeInstanceId
      readonly quality: SolutionQuality
    }
  | {
      readonly type: 'feedback.created'
      readonly instanceId: ChallengeInstanceId
      readonly outcomeKey: string
    }
  | {
      readonly type: 'score.awarded'
      readonly instanceId: ChallengeInstanceId
      readonly points: number
    }
  | {
      /**
       * A visible career dimension moved.
       *
       * `from` is `null` the first time a dimension appears, which is what makes
       * the progressive reveal of the HUD a fact of the domain rather than a
       * guess the UI has to make.
       */
      readonly type: 'career.changed'
      readonly dimension: 'promedio' | 'equipo'
      readonly from: number | null
      readonly to: number
    }
  | {
      /** Aura is reported as a signed delta *and* a running total. */
      readonly type: 'aura.changed'
      readonly delta: number
      readonly total: number
    }
  | { readonly type: 'estilo.nudged'; readonly axis: EstiloAxis }
  | {
      readonly type: 'flag.set'
      readonly flag: string
      readonly value: FlagValue
    }
  | { readonly type: 'flag.cleared'; readonly flag: string }
  | {
      readonly type: 'difficulty.changed'
      readonly from: number
      readonly to: number
    }
  | { readonly type: 'stage.completed'; readonly stage: StageId }
  | {
      readonly type: 'run.completed'
      readonly totalScore: number
      readonly profile: ProfileId
    }
  | { readonly type: 'run.abandoned' }
  | {
      /** An ordinary result left the year something to close before it can end. */
      readonly type: 'recovery.required'
      readonly stage: StageId
    }
  | {
      /** The year closed what it owed. It closes either way; this says it did. */
      readonly type: 'recovery.resolved'
      readonly stage: StageId
    }
  | {
      /** Content ran out of eligible storylets; surfaced, never silently ignored. */
      readonly type: 'narrative.exhausted'
      readonly stage: StageId
    }

export type EffectRequest =
  | {
      readonly type: 'persist-snapshot'
      readonly reason: 'event-resolved' | 'run-completed'
    }
  | { readonly type: 'track'; readonly event: DomainEvent }

export interface TransitionResult {
  readonly state: RunState
  readonly events: readonly DomainEvent[]
  readonly effects: readonly EffectRequest[]
}
