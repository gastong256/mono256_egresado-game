/**
 * Storylet effects.
 *
 * Like conditions, effects are declarative data applied by tested domain
 * functions. Content can move a career dimension or raise a flag; it can never
 * run code.
 */

import { assertNever } from '../core/exhaustive'
import {
  applyCareerEffects,
  validateCareerEffects,
  type CareerChange,
  type CareerEffects,
  type CareerState,
} from '../progression/career'
import type { FlagMap, FlagValue } from './conditions'

export type StoryletEffect =
  | {
      /**
       * Moves the career.
       *
       * Only the dimensions this beat can genuinely touch are declared. An
       * absent key is not a zero: the UI renders one chip per key present, so
       * omitting `aura` means the beat produced no Aura at all, not `Aura +0`.
       */
      readonly kind: 'career'
      readonly effects: CareerEffects
    }
  | {
      readonly kind: 'flag-set'
      readonly flag: string
      readonly value: FlagValue
    }
  | { readonly kind: 'flag-clear'; readonly flag: string }

export interface NarrativeSlice {
  readonly career: CareerState
  readonly flags: FlagMap
}

export interface NarrativeApplication {
  readonly slice: NarrativeSlice
  /** What moved, merged across every effect in the list. */
  readonly change: CareerChange
}

/** Merges two change reports, keeping the later `to`/`total` values. */
function mergeChange(left: CareerChange, right: CareerChange): CareerChange {
  return {
    ...left,
    ...right,
    ...(left.promedio !== undefined && right.promedio !== undefined
      ? { promedio: { from: left.promedio.from, to: right.promedio.to } }
      : {}),
    ...(left.equipo !== undefined && right.equipo !== undefined
      ? {
          equipo: {
            from: left.equipo.from,
            to: right.equipo.to,
            delta: left.equipo.delta + right.equipo.delta,
          },
        }
      : {}),
    ...(left.aura !== undefined && right.aura !== undefined
      ? {
          aura: {
            delta: left.aura.delta + right.aura.delta,
            total: right.aura.total,
          },
        }
      : {}),
  }
}

/** Applies one effect, returning new immutable values. */
function applyEffect(
  application: NarrativeApplication,
  effect: StoryletEffect,
): NarrativeApplication {
  const { slice, change } = application

  switch (effect.kind) {
    case 'career': {
      const applied = applyCareerEffects(slice.career, effect.effects)
      return {
        slice: { ...slice, career: applied.career },
        change: mergeChange(change, applied.change),
      }
    }
    case 'flag-set':
      return {
        ...application,
        slice: {
          ...slice,
          flags: { ...slice.flags, [effect.flag]: effect.value },
        },
      }
    case 'flag-clear': {
      if (!Object.hasOwn(slice.flags, effect.flag)) {
        return application
      }
      const next: Record<string, FlagValue> = { ...slice.flags }
      // Reflect.deleteProperty keeps the operation explicit on a copy; the
      // original map is never mutated.
      Reflect.deleteProperty(next, effect.flag)
      return { ...application, slice: { ...slice, flags: next } }
    }
    default:
      return assertNever(effect)
  }
}

export function applyEffects(
  slice: NarrativeSlice,
  effects: readonly StoryletEffect[],
): NarrativeApplication {
  return effects.reduce(applyEffect, { slice, change: {} })
}

export function validateEffect(
  effect: StoryletEffect,
  path = 'effect',
): readonly string[] {
  switch (effect.kind) {
    case 'career':
      return validateCareerEffects(effect.effects, path)
    case 'flag-set':
    case 'flag-clear':
      return effect.flag.length === 0 ? [`${path}: flag name is empty`] : []
    default:
      return assertNever(effect)
  }
}
