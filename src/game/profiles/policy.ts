/**
 * Graduation profile contract.
 *
 * The GDD lists eight profiles and requires the assignment to be deterministic
 * from run metrics with a documented tie-break. It also forbids clinical or
 * diagnostic language: a profile is a playful summary of how someone played,
 * never an assessment of who they are.
 *
 * The thresholds themselves are unresolved product design, so this module
 * defines the dimensions and the classification mechanism only.
 */

import type { PlayerStats } from '../progression/stats'

export const PROFILE_IDS = [
  'strategist',
  'improviser',
  'scientist',
  'leader',
  'entrepreneur',
  'competitor',
  'balanced',
  'survivor',
] as const

export type ProfileId = (typeof PROFILE_IDS)[number]

/**
 * Normalized run features, each 0..1.
 *
 * These are the hidden educational dimensions from the GDD, kept separate from
 * the visible career stats.
 */
export interface ProfileDimensions {
  readonly efficiency: number
  readonly precision: number
  readonly risk: number
  readonly collaboration: number
  readonly initiative: number
  readonly informationUse: number
  /** Consistency of quality across stages, 1 meaning very steady. */
  readonly stability: number
}

export interface ProfileEvidenceEntry {
  readonly key: string
  /** Rendered value, so the UI never re-derives the number. */
  readonly value: string
}

export interface ProfileResult {
  readonly profileId: ProfileId
  /** The dimensions that most influenced the outcome. */
  readonly evidence: readonly ProfileEvidenceEntry[]
  /** Second-placed profile, useful for tuning and for the final card. */
  readonly runnerUpId: ProfileId | undefined
}

export interface ProfilePolicy {
  readonly id: string
  readonly production: boolean
  classify(dimensions: ProfileDimensions, stats: PlayerStats): ProfileResult
}

export function emptyDimensions(): ProfileDimensions {
  return {
    efficiency: 0,
    precision: 0,
    risk: 0,
    collaboration: 0,
    initiative: 0,
    informationUse: 0,
    stability: 0,
  }
}
