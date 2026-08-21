/**
 * Storylet effects.
 *
 * Like conditions, effects are declarative data applied by tested domain
 * functions. Content can change a stat or raise a flag; it can never run code.
 */

import { assertNever } from '../core/exhaustive'
import {
  applyStatEffect,
  type PlayerStats,
  type VisibleStat,
} from '../progression/stats'
import type { FlagMap, FlagValue } from './conditions'

export type StoryletEffect =
  | {
      readonly kind: 'stat-add'
      readonly stat: VisibleStat
      readonly delta: number
    }
  | {
      readonly kind: 'flag-set'
      readonly flag: string
      readonly value: FlagValue
    }
  | { readonly kind: 'flag-clear'; readonly flag: string }

export interface NarrativeSlice {
  readonly stats: PlayerStats
  readonly flags: FlagMap
}

/** Applies one effect, returning new immutable values. */
function applyEffect(
  slice: NarrativeSlice,
  effect: StoryletEffect,
): NarrativeSlice {
  switch (effect.kind) {
    case 'stat-add':
      return {
        ...slice,
        stats: applyStatEffect(slice.stats, {
          stat: effect.stat,
          delta: effect.delta,
        }),
      }
    case 'flag-set':
      return {
        ...slice,
        flags: { ...slice.flags, [effect.flag]: effect.value },
      }
    case 'flag-clear': {
      if (!Object.hasOwn(slice.flags, effect.flag)) {
        return slice
      }
      const next: Record<string, FlagValue> = { ...slice.flags }
      // Reflect.deleteProperty keeps the operation explicit on a copy; the
      // original map is never mutated.
      Reflect.deleteProperty(next, effect.flag)
      return { ...slice, flags: next }
    }
    default:
      return assertNever(effect)
  }
}

export function applyEffects(
  slice: NarrativeSlice,
  effects: readonly StoryletEffect[],
): NarrativeSlice {
  return effects.reduce(applyEffect, slice)
}

export function validateEffect(
  effect: StoryletEffect,
  path = 'effect',
): readonly string[] {
  switch (effect.kind) {
    case 'stat-add':
      if (!Number.isFinite(effect.delta)) {
        return [`${path}: stat delta must be finite`]
      }
      // The rules ask for small bounded deltas so narrative never eclipses the
      // mathematical score.
      return Math.abs(effect.delta) > 15
        ? [`${path}: stat delta ${String(effect.delta)} exceeds the ±15 budget`]
        : []
    case 'flag-set':
    case 'flag-clear':
      return effect.flag.length === 0 ? [`${path}: flag name is empty`] : []
    default:
      return assertNever(effect)
  }
}
