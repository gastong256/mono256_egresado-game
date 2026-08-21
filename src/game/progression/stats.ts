/**
 * Visible career statistics.
 *
 * The GDD defines four visible stats. They exist to steer narrative, not to
 * replace the mathematical score, so their deltas are small and always bounded.
 * The bounds are enforced here rather than trusted to each caller.
 */

import { assertNever } from '../core/exhaustive'

export const VISIBLE_STATS = [
  'knowledge',
  'team',
  'initiative',
  'energy',
] as const

export type VisibleStat = (typeof VISIBLE_STATS)[number]

export interface PlayerStats {
  readonly knowledge: number
  readonly team: number
  readonly initiative: number
  readonly energy: number
}

export interface StatEffect {
  readonly stat: VisibleStat
  readonly delta: number
}

/** Inclusive bounds every stat is clamped to. */
export const STAT_MINIMUM = 0
export const STAT_MAXIMUM = 100

export function isVisibleStat(value: string): value is VisibleStat {
  return (VISIBLE_STATS as readonly string[]).includes(value)
}

export function clampStat(value: number): number {
  if (!Number.isFinite(value)) {
    return STAT_MINIMUM
  }
  if (value < STAT_MINIMUM) {
    return STAT_MINIMUM
  }
  if (value > STAT_MAXIMUM) {
    return STAT_MAXIMUM
  }
  return Math.round(value)
}

export function readStat(stats: PlayerStats, stat: VisibleStat): number {
  switch (stat) {
    case 'knowledge':
      return stats.knowledge
    case 'team':
      return stats.team
    case 'initiative':
      return stats.initiative
    case 'energy':
      return stats.energy
    default:
      return assertNever(stat)
  }
}

function writeStat(
  stats: PlayerStats,
  stat: VisibleStat,
  value: number,
): PlayerStats {
  const clamped = clampStat(value)

  switch (stat) {
    case 'knowledge':
      return { ...stats, knowledge: clamped }
    case 'team':
      return { ...stats, team: clamped }
    case 'initiative':
      return { ...stats, initiative: clamped }
    case 'energy':
      return { ...stats, energy: clamped }
    default:
      return assertNever(stat)
  }
}

/** Applies one delta, clamped into range. Returns a new object. */
export function applyStatEffect(
  stats: PlayerStats,
  effect: StatEffect,
): PlayerStats {
  return writeStat(
    stats,
    effect.stat,
    readStat(stats, effect.stat) + effect.delta,
  )
}

export function applyStatEffects(
  stats: PlayerStats,
  effects: readonly StatEffect[],
): PlayerStats {
  return effects.reduce(applyStatEffect, stats)
}

/**
 * Stats a run starts from.
 *
 * Mid-scale so both directions of movement are visible from the first event.
 */
export function initialStats(): PlayerStats {
  return { knowledge: 50, team: 50, initiative: 50, energy: 70 }
}
