/**
 * Competitive score policy.
 *
 * The per-event score in [`policy`](./policy.ts) answers «how did this beat go»
 * and feeds the run's visible preview. This is the other layer entirely, the one
 * `competitive-scoring-and-ranking.md` describes and the engine did not have:
 * what a whole run is worth when two people's runs are compared.
 *
 * ## Everything here is a candidate
 *
 * 80/15/5, the four quality steps, the difficulty rewards — every number is
 * `RECOMENDADA` and needs the Mathematics Department before a competition freeze
 * ([open question 24](../../../docs/07-reference/open-questions.md)). They live
 * in a versioned object with `official: false` so that recalibrating is a data
 * change and so that nothing can quietly become the official ruleset by being
 * the constant that happened to be deployed.
 *
 * ## Why the weights cannot be free
 *
 * `validateCompetitiveScorePolicy` refuses a policy where mathematics does not
 * dominate, where a component exceeds its cap, where the difficulty reward is
 * large enough to matter more than playing well, or where Estilo or Promedio
 * get a weight at all. Those are not preferences: they are the product
 * decisions D-010, D-012 and the double-counting rule, and a policy object is
 * configuration — which means it arrives from outside and gets checked.
 *
 * ## Why the difficulty reward is not the scheduling cost
 *
 * STAGE-05 prices a `stretch` beat at 2,10 so the composer can *balance* a run;
 * paying 2,1× for solving one would let the draw decide a ranking, which is the
 * exact failure the scheduling cost exists to prevent. The reward is a separate,
 * deliberately small number.
 */

import type { DifficultyBand } from '../difficulty/cognitive'
import { DIFFICULTY_BANDS } from '../difficulty/cognitive'
import type { SolutionQuality } from '../challenges/taxonomy'
import { SOLUTION_QUALITIES } from '../challenges/taxonomy'
import { PERFORMANCE_SCALE } from '../challenges/scoring-profile'
import { fromInteger, type Rational } from '../math/rational'

/** The scale of a normalised performance and of the final score: 0..10000. */
export const SCORE_SCALE = PERFORMANCE_SCALE

/** The three competitive components. Estilo and Promedio are deliberately absent. */
export const SCORE_COMPONENTS = ['math', 'team', 'aura'] as const

export type ScoreComponentKey = (typeof SCORE_COMPONENTS)[number]

/**
 * Component weights, in basis points, summing to 10000.
 *
 * Integers rather than 0.80/0.15/0.05 because a weighted sum of floats is a
 * weighted sum that two machines can disagree about, and a ranking is exactly
 * where that disagreement would show.
 */
export type ScoreWeights = Readonly<Record<ScoreComponentKey, number>>

export interface CompetitiveScorePolicy {
  /** Stable identity. Never `current` or `latest`. */
  readonly id: string
  readonly version: string
  /** False until a Teacher Gate approves the calibration. */
  readonly official: boolean
  readonly weights: ScoreWeights
  /**
   * What each quality step is worth, in basis points.
   *
   * The candidate mapping from the design document: 1,00 · 0,75 · 0,40 · 0,10.
   * A template whose evaluator measured something finer overrides this with its
   * own signal; this is for the ones whose honest resolution is four steps.
   */
  readonly discreteQuality: Readonly<Record<SolutionQuality, number>>
  /**
   * Difficulty reward per band, in basis points where 10000 is «no reward».
   *
   * Applied to both the achieved and the available side of the mathematical
   * ratio, so a harder plan cannot reach a higher maximum — only a differently
   * weighted one.
   */
  readonly difficultyReward: Readonly<Record<DifficultyBand, number>>
  /** Ceiling for each component's own normalised performance, in basis points. */
  readonly componentCaps: ScoreWeights
}

/** How far the difficulty reward may go before it starts deciding rankings. */
export const MAX_DIFFICULTY_REWARD = 15_000

/**
 * The candidate policy from `competitive-scoring-and-ranking.md`.
 *
 * 80/15/5, the four documented quality steps, and the 1,00 / 1,08 / 1,15
 * difficulty rewards of the reference policy example. Not official, and the
 * `id` says which calibration produced any score computed under it.
 */
export const candidateFairScorePolicy: CompetitiveScorePolicy = {
  id: 'fair-score-dev-1',
  version: '1.0.0-candidate',
  official: false,
  weights: { math: 8_000, team: 1_500, aura: 500 },
  discreteQuality: {
    optimal: 10_000,
    efficient: 7_500,
    functional: 4_000,
    invalid: 1_000,
  },
  difficultyReward: { core: 10_000, standard: 10_800, stretch: 11_500 },
  componentCaps: { math: 10_000, team: 10_000, aura: 10_000 },
}

/**
 * Structural problems that would make a policy unfit to rank anyone.
 *
 * Returns every one it finds rather than the first: a policy is configuration
 * and whoever is fixing it wants the list.
 */
export function competitiveScorePolicyIssues(
  policy: CompetitiveScorePolicy,
): readonly string[] {
  const issues: string[] = []

  if (policy.id.trim() === '' || policy.version.trim() === '') {
    issues.push('a competitive score policy must be identified and versioned')
  }
  if (policy.id === 'current' || policy.id === 'latest') {
    issues.push(
      'a score policy identity has to name a calibration, not whatever is deployed',
    )
  }

  let weightTotal = 0
  for (const component of SCORE_COMPONENTS) {
    const weight = policy.weights[component]
    if (!Number.isSafeInteger(weight) || weight < 0) {
      issues.push(`weight for ${component} is not a non-negative integer`)
      continue
    }
    weightTotal += weight
  }
  if (weightTotal !== SCORE_SCALE) {
    issues.push(
      `weights sum to ${String(weightTotal)} basis points, they must sum to ${String(SCORE_SCALE)}`,
    )
  }

  // D-011 as an executable rule. A policy where the secondary signals could
  // outweigh the mathematics is not a mathematics competition, whatever else it
  // is, and no amount of good intent in a comment prevents it.
  const secondary = policy.weights.team + policy.weights.aura
  if (policy.weights.math <= secondary) {
    issues.push(
      `mathematics must dominate: math is ${String(policy.weights.math)} against ${String(secondary)} for team and aura together`,
    )
  }

  for (const component of SCORE_COMPONENTS) {
    const cap = policy.componentCaps[component]
    if (!Number.isSafeInteger(cap) || cap <= 0 || cap > SCORE_SCALE) {
      issues.push(`cap for ${component} is outside 1..${String(SCORE_SCALE)}`)
    }
  }

  for (const quality of SOLUTION_QUALITIES) {
    const value = policy.discreteQuality[quality]
    if (!Number.isSafeInteger(value) || value < 0 || value > SCORE_SCALE) {
      issues.push(`quality ${quality} maps outside 0..${String(SCORE_SCALE)}`)
    }
  }

  // Monotonic in the documented order: a better result can never be worth less.
  const ordered = [...SOLUTION_QUALITIES]
  for (let index = 1; index < ordered.length; index += 1) {
    const previous = ordered[index - 1]
    const current = ordered[index]
    if (previous === undefined || current === undefined) {
      continue
    }
    if (policy.discreteQuality[current] <= policy.discreteQuality[previous]) {
      issues.push(
        `quality mapping is not monotonic: ${current} is not worth more than ${previous}`,
      )
    }
  }

  let previousReward = 0
  for (const band of DIFFICULTY_BANDS) {
    const reward = policy.difficultyReward[band]
    if (!Number.isSafeInteger(reward) || reward < SCORE_SCALE) {
      issues.push(
        `difficulty reward for ${band} is below the ${String(SCORE_SCALE)} basis-point neutral point`,
      )
      continue
    }
    if (reward > MAX_DIFFICULTY_REWARD) {
      issues.push(
        `difficulty reward for ${band} is ${String(reward)}, above the ${String(MAX_DIFFICULTY_REWARD)} ceiling; a reward that large lets the draw decide a ranking`,
      )
    }
    if (reward < previousReward) {
      issues.push(`difficulty reward is not monotonic at ${band}`)
    }
    previousReward = reward
  }

  return issues
}

/** The weight of a component as an exact rational fraction of the whole. */
export function weightOf(
  policy: CompetitiveScorePolicy,
  component: ScoreComponentKey,
): Rational {
  return fromInteger(policy.weights[component])
}

/**
 * The largest share of a score the non-mathematical components can reach.
 *
 * Reported rather than derived at each call site, because «how much can Team and
 * Aura move a result» is the first question anyone asks of a scoring policy.
 */
export function secondaryInfluence(policy: CompetitiveScorePolicy): number {
  return policy.weights.team + policy.weights.aura
}
