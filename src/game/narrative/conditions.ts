/**
 * Storylet eligibility conditions.
 *
 * Conditions are a declarative tree, never a callback embedded in content.
 * That is a deliberate security and tooling decision: content is data, so it can
 * be validated ahead of time, serialized, diffed, authored outside the codebase
 * and replayed on the server without ever evaluating arbitrary code.
 */

import { assertNever } from '../core/exhaustive'
import type { StoryletId } from '../core/branded'
import type { SolutionQuality } from '../challenges/taxonomy'
import { qualityRank } from '../challenges/evaluation'
import type { StageId } from '../progression/stages'
import {
  readStat,
  type PlayerStats,
  type VisibleStat,
} from '../progression/stats'

export type FlagValue = boolean | number | string
export type FlagMap = Readonly<Record<string, FlagValue>>

/** Everything a condition may inspect. */
export interface NarrativeContext {
  readonly stage: StageId
  readonly eventIndex: number
  readonly stats: PlayerStats
  readonly flags: FlagMap
  readonly seenStorylets: readonly StoryletId[]
  /** Qualities of resolved challenges, oldest first. */
  readonly qualityHistory: readonly SolutionQuality[]
}

export type StoryletCondition =
  | { readonly kind: 'always' }
  | { readonly kind: 'stage-in'; readonly stages: readonly StageId[] }
  | {
      readonly kind: 'stat-at-least'
      readonly stat: VisibleStat
      readonly value: number
    }
  | {
      readonly kind: 'stat-at-most'
      readonly stat: VisibleStat
      readonly value: number
    }
  | { readonly kind: 'flag-set'; readonly flag: string }
  | { readonly kind: 'flag-not-set'; readonly flag: string }
  | {
      readonly kind: 'flag-equals'
      readonly flag: string
      readonly value: FlagValue
    }
  | { readonly kind: 'storylet-seen'; readonly storyletId: StoryletId }
  | { readonly kind: 'storylet-not-seen'; readonly storyletId: StoryletId }
  | {
      /** At least `count` of the last `withinLast` answers reached `quality`. */
      readonly kind: 'recent-quality-at-least'
      readonly quality: SolutionQuality
      readonly withinLast: number
      readonly count: number
    }
  | { readonly kind: 'all'; readonly conditions: readonly StoryletCondition[] }
  | { readonly kind: 'any'; readonly conditions: readonly StoryletCondition[] }
  | { readonly kind: 'not'; readonly condition: StoryletCondition }

export function evaluateCondition(
  condition: StoryletCondition,
  context: NarrativeContext,
): boolean {
  switch (condition.kind) {
    case 'always':
      return true
    case 'stage-in':
      return condition.stages.includes(context.stage)
    case 'stat-at-least':
      return readStat(context.stats, condition.stat) >= condition.value
    case 'stat-at-most':
      return readStat(context.stats, condition.stat) <= condition.value
    case 'flag-set':
      return Object.hasOwn(context.flags, condition.flag)
    case 'flag-not-set':
      return !Object.hasOwn(context.flags, condition.flag)
    case 'flag-equals':
      return context.flags[condition.flag] === condition.value
    case 'storylet-seen':
      return context.seenStorylets.includes(condition.storyletId)
    case 'storylet-not-seen':
      return !context.seenStorylets.includes(condition.storyletId)
    case 'recent-quality-at-least': {
      const recent =
        condition.withinLast <= 0
          ? context.qualityHistory
          : context.qualityHistory.slice(-condition.withinLast)
      const threshold = qualityRank(condition.quality)
      const matching = recent.filter(
        (quality) => qualityRank(quality) >= threshold,
      ).length
      return matching >= condition.count
    }
    case 'all':
      return condition.conditions.every((child) =>
        evaluateCondition(child, context),
      )
    case 'any':
      return condition.conditions.some((child) =>
        evaluateCondition(child, context),
      )
    case 'not':
      return !evaluateCondition(condition.condition, context)
    default:
      return assertNever(condition)
  }
}

/**
 * Static problems in a condition tree, reported by content validation.
 *
 * Catching an empty `any` at authoring time is much cheaper than discovering a
 * storylet that can never fire during a fair.
 */
export function validateCondition(
  condition: StoryletCondition,
  path = 'condition',
): readonly string[] {
  switch (condition.kind) {
    case 'always':
    case 'flag-set':
    case 'flag-not-set':
    case 'flag-equals':
    case 'storylet-seen':
    case 'storylet-not-seen':
      return []
    case 'stage-in':
      return condition.stages.length === 0
        ? [`${path}: stage-in lists no stages, so it can never match`]
        : []
    case 'stat-at-least':
    case 'stat-at-most':
      return Number.isFinite(condition.value)
        ? []
        : [`${path}: stat threshold must be a finite number`]
    case 'recent-quality-at-least':
      return condition.count <= 0
        ? [`${path}: recent-quality-at-least needs a positive count`]
        : []
    case 'all':
    case 'any': {
      if (condition.conditions.length === 0) {
        return [`${path}: ${condition.kind} has no children`]
      }
      return condition.conditions.flatMap((child, index) =>
        validateCondition(child, `${path}.${condition.kind}[${String(index)}]`),
      )
    }
    case 'not':
      return validateCondition(condition.condition, `${path}.not`)
    default:
      return assertNever(condition)
  }
}
