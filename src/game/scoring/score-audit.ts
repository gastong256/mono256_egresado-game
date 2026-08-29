/**
 * Statistical audit of what a competitive score policy actually does.
 *
 * The fairness claims of STAGE-06 are all claims about *populations* of runs:
 * that perfect play reaches the same maximum in every plan, that a two-beat year
 * is not worth more than a one-beat year, that a plan without collaboration
 * content does not cap the player below one that has it, that mathematics
 * dominates. None of those can be settled by an example; they are settled by
 * sweeping every plan the composer can produce and measuring.
 *
 * ## Why it injects performances instead of playing
 *
 * It audits the aggregation — weights, opportunity renormalisation, difficulty
 * reward, rounding — over **real composed plans**. Producing a target
 * mathematical performance by synthesising gameplay would mean the audit had to
 * know how each template's evaluator behaves, and a knob that reaches one
 * template's mathematics through another template's collaboration signal is not
 * a knob. So the plan shapes are real, the opportunities are the ones the
 * templates actually declare, and the performances are the variable.
 *
 * ## What a green report does not prove
 *
 * That the calibration is right. It proves the mechanism is fair in the ways it
 * was asked to be. Whether 80/15/5 is the correct answer for a mathematics fair
 * is Teacher Gate 1's question, and no sweep can answer it.
 */

import {
  contentError,
  contentWarning,
  type ValidationIssue,
} from '../core/issues'
import type { ContentCatalog } from '../challenges/content-catalog'
import { PERFORMANCE_SCALE } from '../challenges/scoring-profile'
import type { ComposedRunPlan } from '../plan/composer'
import {
  aggregate,
  type BeatEvidence,
  type FairScoreResult,
} from './fair-score'
import {
  competitiveScorePolicyIssues,
  SCORE_COMPONENTS,
  SCORE_SCALE,
  type CompetitiveScorePolicy,
  type ScoreComponentKey,
} from './competitive-policy'

/** A synthetic player, expressed as a target performance per component. */
export interface PerformanceProfile {
  readonly id: string
  readonly targets: Readonly<Record<ScoreComponentKey, number>>
}

/**
 * The profiles the stage contract asks to be audited.
 *
 * `perfect` is the one the fairness invariants are stated against; the two
 * lopsided ones are how the dominance of mathematics stops being an opinion.
 */
export const AUDIT_PROFILES: readonly PerformanceProfile[] = [
  { id: 'perfect', targets: { math: 10_000, team: 10_000, aura: 10_000 } },
  {
    id: 'strong-math-low-secondary',
    targets: { math: 9_000, team: 1_000, aura: 1_000 },
  },
  {
    id: 'weak-math-high-secondary',
    targets: { math: 2_000, team: 10_000, aura: 10_000 },
  },
  { id: 'mid', targets: { math: 5_000, team: 5_000, aura: 5_000 } },
  { id: 'floor', targets: { math: 0, team: 0, aura: 0 } },
]

export interface ScoreDistribution {
  readonly min: number
  readonly max: number
  readonly mean: number
  readonly spread: number
}

export interface ProfileAudit {
  readonly profileId: string
  readonly score: ScoreDistribution
  readonly math: ScoreDistribution
  readonly team: ScoreDistribution
  readonly aura: ScoreDistribution
  /** Plans where the component had at least one opportunity. */
  readonly opportunities: Readonly<Record<ScoreComponentKey, number>>
  /** Distinct final scores this profile produced across the sweep. */
  readonly distinctScores: number
}

export interface PlanShapeAudit {
  readonly beats: number
  readonly plans: number
  readonly perfectScore: ScoreDistribution
}

export interface ScoreAuditReport {
  readonly policyId: string
  readonly policyVersion: string
  readonly official: boolean
  readonly plans: number
  readonly profiles: readonly ProfileAudit[]
  readonly byBeatCount: readonly PlanShapeAudit[]
  /** Perfect score on plans with no team opportunity, and with one. */
  readonly perfectWithoutTeam: ScoreDistribution
  readonly perfectWithTeam: ScoreDistribution
  readonly perfectWithoutAura: ScoreDistribution
  readonly perfectWithAura: ScoreDistribution
  /** Scores that landed exactly on a half-unit before rounding. */
  readonly roundingTies: number
  readonly issues: readonly ValidationIssue[]
}

function distribution(values: readonly number[]): ScoreDistribution {
  if (values.length === 0) {
    return { min: 0, max: 0, mean: 0, spread: 0 }
  }
  const min = Math.min(...values)
  const max = Math.max(...values)
  return {
    min,
    max,
    mean: Math.round(
      values.reduce((sum, value) => sum + value, 0) / values.length,
    ),
    spread: max - min,
  }
}

/**
 * Builds the evidence a profile would produce on a plan.
 *
 * Opportunity comes from what the templates declare, so a plan whose content
 * offers no collaboration evidence produces none here either — which is the
 * whole point of the sweep.
 */
export function evidenceForProfile(
  plan: ComposedRunPlan,
  catalog: ContentCatalog,
  policy: CompetitiveScorePolicy,
  profile: PerformanceProfile,
): readonly BeatEvidence[] {
  return plan.stages.flatMap((stage) =>
    stage.beats.flatMap((beat) => {
      const template = catalog.template(beat.variant.templateId)
      if (template === undefined) {
        return []
      }
      const reward = policy.difficultyReward[template.band]
      const offers = (component: ScoreComponentKey): boolean =>
        component === 'math' || template.scoring[component] !== 'none'

      const flat = (component: ScoreComponentKey) =>
        offers(component)
          ? {
              achieved: profile.targets[component],
              available: PERFORMANCE_SCALE,
            }
          : { achieved: 0, available: 0 }

      return [
        {
          templateId: template.id,
          band: template.band,
          difficultyReward: reward,
          math: {
            achieved: profile.targets.math * reward,
            available: PERFORMANCE_SCALE * reward,
          },
          team: flat('team'),
          aura: flat('aura'),
        },
      ]
    }),
  )
}

/**
 * One plan and the catalog it was composed from.
 *
 * Paired because a meaningful sweep mixes populations — real Grade-7 years,
 * synthetic careers, the teacher demo — and those do not share a catalog. A
 * sweep over a single population would only ever measure that population's
 * shape.
 */
export interface AuditedPlan {
  readonly plan: ComposedRunPlan
  readonly catalog: ContentCatalog
  /** Where this plan came from. Reported so a finding can be traced back. */
  readonly population: string
}

export interface ScoreAuditOptions {
  readonly plans: readonly AuditedPlan[]
  readonly policy: CompetitiveScorePolicy
  readonly profiles?: readonly PerformanceProfile[]
}

export function auditScorePolicy(options: ScoreAuditOptions): ScoreAuditReport {
  const { policy } = options
  const profiles = options.profiles ?? AUDIT_PROFILES
  const issues: ValidationIssue[] = []

  for (const problem of competitiveScorePolicyIssues(policy)) {
    issues.push(contentError('score.invalid-policy', policy.id, problem))
  }

  const profileAudits: ProfileAudit[] = []
  const perfectByBeats = new Map<number, number[]>()
  const perfect = profiles.find((entry) => entry.id === 'perfect')
  const perfectWithoutTeam: number[] = []
  const perfectWithTeam: number[] = []
  const perfectWithoutAura: number[] = []
  const perfectWithAura: number[] = []
  let roundingTies = 0

  for (const profile of profiles) {
    const scores: number[] = []
    const components: Record<ScoreComponentKey, number[]> = {
      math: [],
      team: [],
      aura: [],
    }
    const opportunities: Record<ScoreComponentKey, number> = {
      math: 0,
      team: 0,
      aura: 0,
    }
    const distinct = new Set<number>()

    for (const audited of options.plans) {
      const evidence = evidenceForProfile(
        audited.plan,
        audited.catalog,
        policy,
        profile,
      )
      const scored: ReturnType<typeof aggregate> = aggregate(evidence, policy)
      if (!scored.ok) {
        issues.push(
          contentError(
            'score.unscorable-plan',
            profile.id,
            `${scored.error.code}: ${scored.error.detail}`,
          ),
        )
        continue
      }

      const result: FairScoreResult = scored.value
      scores.push(result.fairScore)
      distinct.add(result.fairScore)

      const beats = evidence.length
      for (const component of SCORE_COMPONENTS) {
        const entry = result.components.find(
          (candidate) => candidate.component === component,
        )
        if (entry === undefined) {
          continue
        }
        components[component].push(entry.contribution)
        if (entry.opportunities > 0) {
          opportunities[component] += 1
        }
      }

      if (profile.id === perfect?.id) {
        const bucket = perfectByBeats.get(beats) ?? []
        bucket.push(result.fairScore)
        perfectByBeats.set(beats, bucket)

        const hasTeam = evidence.some((beat) => beat.team.available > 0)
        const hasAura = evidence.some((beat) => beat.aura.available > 0)
        ;(hasTeam ? perfectWithTeam : perfectWithoutTeam).push(result.fairScore)
        ;(hasAura ? perfectWithAura : perfectWithoutAura).push(result.fairScore)
      }

      // A contribution that lands on an exact half before rounding is where two
      // players could swap places over a rule nobody reads. Counting them says
      // how often the rounding rule is load-bearing.
      const reconstructed = result.components.reduce(
        (sum, entry) => sum + entry.contribution,
        0,
      )
      if (reconstructed !== result.fairScore) {
        issues.push(
          contentError(
            'score.breakdown-mismatch',
            profile.id,
            `components sum to ${String(reconstructed)} and the score is ${String(result.fairScore)}`,
          ),
        )
      }
      if (result.fairScore % 1 !== 0) {
        roundingTies += 1
      }
    }

    profileAudits.push({
      profileId: profile.id,
      score: distribution(scores),
      math: distribution(components.math),
      team: distribution(components.team),
      aura: distribution(components.aura),
      opportunities,
      distinctScores: distinct.size,
    })
  }

  const perfectAudit = profileAudits.find(
    (entry) => entry.profileId === perfect?.id,
  )
  if (perfectAudit !== undefined && perfectAudit.score.spread !== 0) {
    issues.push(
      contentError(
        'score.perfect-spread',
        policy.id,
        `perfect play scores between ${String(perfectAudit.score.min)} and ${String(perfectAudit.score.max)}; a plan a player did not choose is changing what perfect is worth`,
      ),
    )
  }
  if (perfectAudit !== undefined && perfectAudit.score.max !== SCORE_SCALE) {
    issues.push(
      contentError(
        'score.perfect-maximum',
        policy.id,
        `perfect play reaches ${String(perfectAudit.score.max)} instead of the ${String(SCORE_SCALE)} the scale defines`,
      ),
    )
  }

  const strong = profileAudits.find(
    (entry) => entry.profileId === 'strong-math-low-secondary',
  )
  const weak = profileAudits.find(
    (entry) => entry.profileId === 'weak-math-high-secondary',
  )
  if (
    strong !== undefined &&
    weak !== undefined &&
    weak.score.max >= strong.score.min
  ) {
    issues.push(
      contentError(
        'score.math-dominance',
        policy.id,
        `a run with weak mathematics and perfect secondaries reaches ${String(weak.score.max)}, at or above the ${String(strong.score.min)} of one with strong mathematics`,
      ),
    )
  }

  const byBeatCount: PlanShapeAudit[] = [...perfectByBeats.entries()]
    .sort(([left], [right]) => left - right)
    .map(([beats, scores]) => ({
      beats,
      plans: scores.length,
      perfectScore: distribution(scores),
    }))

  if (byBeatCount.length > 1) {
    const maxima = byBeatCount.map((entry) => entry.perfectScore.max)
    if (Math.max(...maxima) !== Math.min(...maxima)) {
      issues.push(
        contentError(
          'score.beat-count-advantage',
          policy.id,
          'plans with more beats reach a different maximum than plans with fewer',
        ),
      )
    }
  }

  if (profileAudits.every((entry) => entry.distinctScores <= 1)) {
    issues.push(
      contentWarning(
        'score.no-resolution',
        policy.id,
        'every profile produced a single score across the whole sweep; the audit is not distinguishing anything',
      ),
    )
  }

  return {
    policyId: policy.id,
    policyVersion: policy.version,
    official: policy.official,
    plans: options.plans.length,
    profiles: profileAudits,
    byBeatCount,
    perfectWithoutTeam: distribution(perfectWithoutTeam),
    perfectWithTeam: distribution(perfectWithTeam),
    perfectWithoutAura: distribution(perfectWithoutAura),
    perfectWithAura: distribution(perfectWithAura),
    roundingTies,
    issues,
  }
}
