/**
 * Why a run could not be composed.
 *
 * A composer that cannot satisfy its hard constraints has exactly two honest
 * options: fail, or break a rule. Breaking a rule quietly is how a competition
 * ends up with two players who did not play the same game, so this module
 * exists to make the first option informative enough that nobody reaches for
 * the second.
 *
 * Every failure names the stage, the constraint and the candidate counts that
 * led to it, because «composition failed» is not something a content author can
 * act on.
 */

import type { ChallengePlacementRole } from '../challenges/content-model'
import type { StageId } from '../progression/stages'

export const COMPOSITION_FAILURE_CODES = [
  /** The policy says nothing about a stage the run was asked to include. */
  'stage-not-configured',
  /** No template is eligible for the stage under the catalog. */
  'no-eligible-content',
  /** Nothing eligible carries the anchor role. */
  'no-eligible-anchor',
  /** Eligible templates exist, but none has an approved variant to play. */
  'no-approved-variant',
  /** The stage needs a second ordinary beat and nothing can fill it. */
  'no-valid-secondary',
  /** Every structurally valid plan misses the difficulty envelope. */
  'difficulty-unsatisfiable',
  /** The policy itself is malformed. */
  'invalid-policy',
  'career-unsatisfiable',
  'search-budget-exceeded',
  'missing-composition-metadata',
] as const

export type CompositionFailureCode = (typeof COMPOSITION_FAILURE_CODES)[number]

/** What the composer had to work with when it gave up. */
export interface CompositionCandidateCounts {
  readonly eligible: number
  readonly approved: number
  readonly anchors: number
  readonly secondaries: number
  readonly feasiblePlans: number
}

export interface CompositionFailure {
  readonly code: CompositionFailureCode
  readonly stageId: StageId | undefined
  readonly detail: string
  readonly counts?: CompositionCandidateCounts
  /** Roles the stage would have accepted, when the failure is about a role. */
  readonly roles?: readonly ChallengePlacementRole[]
}

export function compositionFailure(
  code: CompositionFailureCode,
  stageId: StageId | undefined,
  detail: string,
  extra: Omit<CompositionFailure, 'code' | 'stageId' | 'detail'> = {},
): CompositionFailure {
  return { code, stageId, detail, ...extra }
}

export function describeCompositionFailure(
  failure: CompositionFailure,
): string {
  const where = failure.stageId === undefined ? 'run' : failure.stageId
  return `${where}: ${failure.code} — ${failure.detail}`
}
