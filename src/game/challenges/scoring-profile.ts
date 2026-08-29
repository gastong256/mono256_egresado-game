/**
 * How a template turns its own result into competitive evidence.
 *
 * `competitive-scoring-and-ranking.md` separates three layers that are related
 * and not interchangeable: what happened in the challenge, what it did to the
 * career, and what it is worth in a competition. This file is the third one's
 * entry point, and it lives beside the templates on purpose — the aggregation
 * that consumes it must never learn a challenge id.
 *
 * ## Why a template declares this instead of the scorer deriving it
 *
 * Because the evaluators do not measure the same thing. The bus asks whether
 * you chose the departure that arrives on time; the act computes an F1 over
 * twenty-four classifications; the group task answers two separate questions —
 * whether the split was feasible and how well it played to each person's
 * strengths. Flattening all of that into one metric would either throw away the
 * precise evidence that already exists or invent evidence that does not.
 *
 * ## Every component is declared, including the ones that are absent
 *
 * `'none'` is a decision an author has to write, not a default they can fall
 * into. A template that silently contributed nothing to a component would be
 * indistinguishable from one nobody had thought about.
 */

import type { ReasoningMetrics } from './contracts'
import type { SolutionQuality } from './taxonomy'

/**
 * Normalised competitive performance, in basis points.
 *
 * Ten thousand is the scale the design document uses for every normalised
 * performance figure, and integers are what keeps two machines agreeing about a
 * ranking.
 */
export const PERFORMANCE_SCALE = 10_000

/**
 * What a scoring profile may read.
 *
 * Only what the authoritative history already carries. That is what makes a
 * score recomputable from an action log months later, and what stops a client
 * from being able to assert its own performance.
 */
export interface ScoringEvidenceInput {
  readonly quality: SolutionQuality
  readonly metrics: ReasoningMetrics
}

/**
 * A component's evidence: a measure, or a written decision not to have one.
 *
 * `'discrete-quality'` defers to the policy's four-step mapping of
 * `SolutionQuality`, which is the right answer whenever the evaluator's honest
 * resolution really is four steps. A function is for evaluators that measured
 * something finer.
 */
export type ScoringSignal =
  'none' | 'discrete-quality' | ((input: ScoringEvidenceInput) => number)

export interface ChallengeScoringProfile {
  /**
   * Mathematical performance. Never `'none'`: a challenge with no mathematical
   * content has no business being an ordinary beat.
   */
  readonly math: Exclude<ScoringSignal, 'none'>
  /** Collaboration performance, when the evaluator measured one. */
  readonly team: ScoringSignal
  /** Public-performance evidence, when the evaluator measured one. */
  readonly aura: ScoringSignal
  /**
   * Why each component reads what it reads.
   *
   * Required, and it is the double-counting audit written down where the
   * decision was made. The question it has to answer is not «what does this
   * template measure» but «why is this a *different* fact from the one another
   * component already read».
   */
  readonly rationale: string
}

/** Turns a 0..1 ratio into basis points, clamped and rounded half-up. */
export function performanceFromRatio(ratio: number): number {
  if (!Number.isFinite(ratio)) {
    return 0
  }
  const scaled = Math.round(ratio * PERFORMANCE_SCALE)
  return Math.min(PERFORMANCE_SCALE, Math.max(0, scaled))
}

/**
 * The harmonic mean of precision and coverage, in basis points.
 *
 * The act already computes both and judges itself by their F1; re-deriving it
 * here keeps the competitive layer reading the evaluator's own measure instead
 * of a coarser echo of it.
 */
export function f1FromMetrics(precision: number, coverage: number): number {
  const sum = precision + coverage
  if (sum <= 0) {
    return 0
  }
  return performanceFromRatio((2 * precision * coverage) / sum)
}

/** Structural problems in a profile, checked where content is validated. */
export function scoringProfileIssues(
  profile: ChallengeScoringProfile,
): readonly string[] {
  const issues: string[] = []

  if (profile.rationale.trim().length < 20) {
    issues.push(
      'a scoring profile must explain why each component reads what it reads',
    )
  }
  // The type already forbids `math: 'none'`, so the only way to reach it is a
  // profile that crossed a boundary untyped. Content validation is exactly the
  // place that has to survive that.
  if ((profile.math as ScoringSignal) === 'none') {
    issues.push('a scored template must contribute mathematical performance')
  }

  return issues
}
