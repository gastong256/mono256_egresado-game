/**
 * Scoring contract.
 *
 * `rules-scoring-and-progression.md` fixes the *shape* of the score —
 * `base × quality × difficulty + bonuses - penalties` — but open question 24
 * leaves the final constants and rounding policy undecided. This module
 * therefore defines the mechanism and leaves the numbers to a named policy, so
 * no anonymous constant can quietly become the official ruleset.
 *
 * ADR-004 makes the server authoritative. The same policy object runs in the
 * browser for a preview and on the server during replay, which is only sound
 * because scoring is a pure function of run evidence.
 *
 * Time deliberately does not appear in this contract. Open question 27 has not
 * settled which elapsed-time signal a server may trust, and the design rules
 * warn that speed-dominated scoring harms accessibility.
 */

import type { DifficultyLevel, SolutionQuality } from '../challenges/taxonomy'
import type { ReasoningMetrics } from '../challenges/contracts'

export interface ScoreEventInput {
  readonly quality: SolutionQuality
  readonly difficulty: DifficultyLevel
  readonly metrics: ReasoningMetrics
  /** Consecutive `optimal` results immediately before this event. */
  readonly optimalStreak: number
}

/** One named contribution, kept separate so the UI can explain the total. */
export interface ScoreComponent {
  readonly key: string
  readonly points: number
}

export interface ScoreBreakdown {
  readonly basePoints: number
  /** Exact factors rendered as decimal strings for display. */
  readonly qualityFactor: string
  readonly difficultyFactor: string
  readonly components: readonly ScoreComponent[]
  readonly bonusPoints: number
  readonly penaltyPoints: number
  /** Integer points awarded for the event. Never negative. */
  readonly totalPoints: number
}

export interface ScoringPolicy {
  /** Stable identity recorded with the ruleset. */
  readonly id: string
  /** True only for a policy approved as an official ruleset. */
  readonly production: boolean
  scoreEvent(input: ScoreEventInput): ScoreBreakdown
}

export function emptyBreakdown(): ScoreBreakdown {
  return {
    basePoints: 0,
    qualityFactor: '0.00',
    difficultyFactor: '0.00',
    components: [],
    bonusPoints: 0,
    penaltyPoints: 0,
    totalPoints: 0,
  }
}
