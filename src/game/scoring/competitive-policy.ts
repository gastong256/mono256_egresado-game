/**
 * Competitive score policy.
 *
 * The per-event score in [`policy`](./policy.ts) answers «how did this beat go»
 * and feeds the run's visible preview. This is the other layer entirely, the one
 * `competitive-scoring-and-ranking.md` describes and the engine did not have:
 * what a whole run is worth when two people's runs are compared.
 *
 * ## Versioned calibrations, and one official one
 *
 * Teacher Gate 1 accepted 85/10/5, the four quality steps, opportunity
 * normalisation, and the principle of a small difficulty reward. Every
 * calibration lives in its own object: recalibrating is a versioned data
 * change, never an in-place rewrite of historical results.
 *
 * Two of them are development candidates and carry `official: false`. The
 * third, `fairScoreV1Policy`, is the Fair Edition v1 freeze — the same numbers
 * as the second candidate under a stable identity that says so. Promotion
 * copies; it never edits, and never touches a published version.
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
import { err, ok, type Result } from '../core/result'
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

export const FAIR_SCORE_DEV_1_VERSION = '1.0.0-candidate'
export const FAIR_SCORE_DEV_2_VERSION = '2.0.0-post-tg1-candidate'

/** Historical pre-Teacher-Gate-1 calibration. Never edit in place. */
export const fairScoreDev1Policy: CompetitiveScorePolicy = {
  id: 'fair-score-dev-1',
  version: FAIR_SCORE_DEV_1_VERSION,
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

/** Teacher-informed post-TG1 development candidate. It is not competition-final. */
export const fairScoreDev2Policy: CompetitiveScorePolicy = {
  id: 'fair-score-dev-2',
  version: FAIR_SCORE_DEV_2_VERSION,
  official: false,
  weights: { math: 8_500, team: 1_000, aura: 500 },
  discreteQuality: {
    optimal: 10_000,
    efficient: 7_500,
    functional: 4_000,
    invalid: 1_000,
  },
  difficultyReward: { core: 10_000, standard: 10_800, stretch: 11_500 },
  componentCaps: { math: 10_000, team: 10_000, aura: 10_000 },
}

export const FAIR_SCORE_V1_VERSION = '1.0.0-fair-edition-v1'

/**
 * The official calibration of Egresado Fair Edition v1.
 *
 * Every number below is copied from `fairScoreDev2Policy`, and that is the
 * whole point: officialisation is an act of **identity**, not of calibration.
 * The weights Teacher Gate 1 accepted, the four quality steps, the difficulty
 * reward and the component caps are the ones a year of audits converged on, and
 * a release that changed any of them while promoting the policy would be
 * publishing a different competition under the name of the reviewed one.
 *
 * `scorePolicyDifferences` below proves the copy is exact field by field, and
 * `tests/unit/fair-score-officialisation.test.ts` re-derives a deterministic
 * corpus of scored runs under both identities, so the equivalence is checked by
 * arithmetic and not only by comparing configuration.
 *
 * `official: true` is what separates it from the two candidates. It is the flag
 * a run's score claim carries, so a ranked result can be read back years later
 * and say, by itself, whether it was produced under a competition-final
 * calibration or under a development one.
 *
 * The two candidates stay in the registry, unedited. A historical replay of an
 * attempt issued under `fair-score-dev-2` has to resolve `fair-score-dev-2`, and
 * deleting it to tidy the registry would turn stored evidence into garbage.
 */
export const fairScoreV1Policy: CompetitiveScorePolicy = {
  id: 'fair-score-v1',
  version: FAIR_SCORE_V1_VERSION,
  official: true,
  weights: { math: 8_500, team: 1_000, aura: 500 },
  discreteQuality: {
    optimal: 10_000,
    efficient: 7_500,
    functional: 4_000,
    invalid: 1_000,
  },
  difficultyReward: { core: 10_000, standard: 10_800, stretch: 11_500 },
  componentCaps: { math: 10_000, team: 10_000, aura: 10_000 },
}

/** Version written by new competitive run descriptors. */
export const SCORE_POLICY_VERSION = FAIR_SCORE_V1_VERSION

/** Backwards-compatible name for the current development candidate. */
export const candidateFairScorePolicy = fairScoreDev2Policy

/** The calibration a Fair Edition v1 competition ranks with. */
export const officialFairScorePolicy = fairScoreV1Policy

export const competitiveScorePolicies: readonly CompetitiveScorePolicy[] = [
  fairScoreDev1Policy,
  fairScoreDev2Policy,
  fairScoreV1Policy,
]

/**
 * Everything that decides a score, flattened.
 *
 * Identity is excluded on purpose: two policies are *behaviourally* the same
 * when every number they apply is the same, and that is the claim promotion has
 * to support. Comparing the objects whole would only ever prove that two names
 * differ.
 */
export function scoringShapeOf(
  policy: CompetitiveScorePolicy,
): Readonly<Record<string, number>> {
  const shape: Record<string, number> = {}
  for (const component of SCORE_COMPONENTS) {
    shape[`weight.${component}`] = policy.weights[component]
    shape[`cap.${component}`] = policy.componentCaps[component]
  }
  for (const quality of SOLUTION_QUALITIES) {
    shape[`quality.${quality}`] = policy.discreteQuality[quality]
  }
  for (const band of DIFFICULTY_BANDS) {
    shape[`difficulty.${band}`] = policy.difficultyReward[band]
  }
  return shape
}

/**
 * Which numbers differ between two calibrations, if any.
 *
 * Used by the release verification and by the equivalence test. An empty list
 * is the proof that promoting `fair-score-dev-2` to `fair-score-v1` moved no
 * mathematics — which is the one thing a freeze is not allowed to do quietly.
 */
export function scorePolicyDifferences(
  left: CompetitiveScorePolicy,
  right: CompetitiveScorePolicy,
): readonly string[] {
  const leftShape = scoringShapeOf(left)
  const rightShape = scoringShapeOf(right)
  const keys = [
    ...new Set([...Object.keys(leftShape), ...Object.keys(rightShape)]),
  ].sort()
  return keys.flatMap((key) => {
    const a = leftShape[key]
    const b = rightShape[key]
    return a === b ? [] : [`${key}: ${String(a ?? '-')} vs ${String(b ?? '-')}`]
  })
}

/** The promotion this release performs: candidate identity → official identity. */
export const FAIR_SCORE_V1_PROMOTED_FROM = fairScoreDev2Policy

export interface ScorePolicyResolutionFailure {
  readonly code: 'unknown-score-policy'
  readonly requested: string
  readonly knownIds: readonly string[]
  readonly knownVersions: readonly string[]
}

/** Resolves only an exact immutable id or version. There is no `latest` fallback. */
export function resolveCompetitiveScorePolicy(
  reference: string,
): Result<CompetitiveScorePolicy, ScorePolicyResolutionFailure> {
  const policy = competitiveScorePolicies.find(
    (entry) => entry.id === reference || entry.version === reference,
  )
  if (policy !== undefined) {
    return ok(policy)
  }
  return err({
    code: 'unknown-score-policy',
    requested: reference,
    knownIds: competitiveScorePolicies.map((entry) => entry.id),
    knownVersions: competitiveScorePolicies.map((entry) => entry.version),
  })
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
