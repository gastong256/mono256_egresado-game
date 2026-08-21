/**
 * Storylet model.
 *
 * `narrative-system.md` describes a conditioned storylet pool rather than a
 * branching tree: each event declares when it may appear and how likely it is,
 * and the engine filters and then picks deterministically.
 */

import type { ChallengeId, StoryletId } from '../core/branded'
import type { StageId } from '../progression/stages'
import type { StoryletCondition } from './conditions'
import type { StoryletEffect } from './effects'

/** Storylet shapes from the narrative document. */
export type StoryletKind =
  'one-shot' | 'callback' | 'arc' | 'systemic' | 'finale'

export interface Storylet {
  readonly id: StoryletId
  readonly kind: StoryletKind
  /** Stages the storylet may appear in. */
  readonly stages: readonly StageId[]
  /** Relative selection weight; must be a positive integer. */
  readonly weight: number
  /**
   * Higher priority wins outright.
   *
   * Systemic and finale events use this so a threshold event is not left to
   * chance once its condition holds.
   */
  readonly priority: number
  /** Additional eligibility beyond stage membership. */
  readonly requires: StoryletCondition
  /** Thematic tags used by content tooling and analytics. */
  readonly tags: readonly string[]
  readonly title: string
  readonly text: string
  /**
   * Challenges this storylet may present.
   *
   * An empty pool marks a purely narrative beat, which the engine shows as a
   * card the player acknowledges before continuing.
   */
  readonly challengePool: readonly ChallengeId[]
  /** Effects applied when the storylet is selected. */
  readonly effects: readonly StoryletEffect[]
  /** Storylets this one makes eligible later, for authoring tools and validation. */
  readonly followUps: readonly StoryletId[]
}

export function isNarrativeOnly(storylet: Storylet): boolean {
  return storylet.challengePool.length === 0
}
