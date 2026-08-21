/**
 * Deterministic storylet selection.
 *
 * The pipeline is: filter by stage, drop anything on cooldown or already used,
 * drop anything whose condition fails, keep only the highest priority tier that
 * survived, then pick by seeded weight.
 *
 * Selection never throws on an empty pool. Running out of eligible storylets is
 * a content problem that the engine reports as a typed outcome so the caller —
 * validation, simulation or the run itself — can react explicitly.
 */

import type { StoryletId } from '../core/branded'
import type { Rng } from '../random/rng'
import { evaluateCondition, type NarrativeContext } from './conditions'
import type { Storylet } from './storylet'

export interface SelectionState {
  /** Event index at which each storylet was last selected. */
  readonly lastSeenAt: Readonly<Record<string, number>>
}

export interface SelectionOptions {
  /** Events that must pass before a storylet may repeat. */
  readonly cooldownEvents: number
  /** When false a storylet is never selected twice in one run. */
  readonly allowRepeats: boolean
}

export type SelectionOutcome =
  | { readonly kind: 'selected'; readonly storylet: Storylet }
  | { readonly kind: 'empty-pool'; readonly stage: string }

export function eligibleStorylets(
  pool: readonly Storylet[],
  context: NarrativeContext,
  state: SelectionState,
  options: SelectionOptions,
): readonly Storylet[] {
  return pool.filter((storylet) => {
    if (!storylet.stages.includes(context.stage)) {
      return false
    }
    if (storylet.weight <= 0) {
      return false
    }

    const lastSeenAt = state.lastSeenAt[storylet.id]
    if (lastSeenAt !== undefined) {
      if (!options.allowRepeats) {
        return false
      }
      if (context.eventIndex - lastSeenAt < options.cooldownEvents) {
        return false
      }
    }

    return evaluateCondition(storylet.requires, context)
  })
}

/**
 * Picks one storylet.
 *
 * Candidates are sorted by id before the weighted draw so selection cannot
 * depend on the order a content set happened to be declared in.
 */
export function selectStorylet(
  pool: readonly Storylet[],
  context: NarrativeContext,
  state: SelectionState,
  options: SelectionOptions,
  rng: Rng,
): SelectionOutcome {
  const eligible = eligibleStorylets(pool, context, state, options)

  if (eligible.length === 0) {
    return { kind: 'empty-pool', stage: context.stage }
  }

  const highestPriority = eligible.reduce(
    (max, storylet) => Math.max(max, storylet.priority),
    Number.NEGATIVE_INFINITY,
  )
  const candidates = eligible
    .filter((storylet) => storylet.priority === highestPriority)
    .sort((left, right) =>
      left.id < right.id ? -1 : left.id > right.id ? 1 : 0,
    )

  const chosen = rng.weightedPick(
    candidates.map((storylet) => ({ item: storylet, weight: storylet.weight })),
  )

  return { kind: 'selected', storylet: chosen }
}

export function recordSelection(
  state: SelectionState,
  storyletId: StoryletId,
  eventIndex: number,
): SelectionState {
  return {
    lastSeenAt: { ...state.lastSeenAt, [storyletId]: eventIndex },
  }
}

export function emptySelectionState(): SelectionState {
  return { lastSeenAt: {} }
}
