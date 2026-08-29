/**
 * Statistical and integrity audit of what a composition policy produces.
 *
 * Every composed plan is independently validated, serialized and parsed, then
 * recomposed from the same seed. The measurements below are structural
 * scheduling evidence, never psychometric evidence.
 */

import {
  contentError,
  contentWarning,
  type ValidationIssue,
} from '../core/issues'
import { toRunSeed } from '../core/branded'
import type { ContentCatalog } from '../challenges/content-catalog'
import type { ApprovedVariantLookup } from '../challenges/variant-source'
import {
  formatVariantAddress,
  isEligibleForStage,
  isOrdinaryBeatRole,
  type ChallengePlacementRole,
} from '../challenges/content-model'
import type { ChallengeDefinition, MathCategory } from '../challenges/contracts'
import type { InteractionKind } from '../challenges/interactions'
import type { DifficultyBand } from '../difficulty/cognitive'
import type { StageId } from '../progression/stages'
import { composeRun } from './composer'
import { stagePolicyFor, type CompositionPolicy } from './composition-policy'
import type { CompositionFailureCode } from './composition-failure'
import { parseRunPlan, serializeRunPlan } from './plan-codec'
import { planFingerprint } from './plan-fingerprint'
import { validateComposedPlan } from './plan-validator'

export interface CompositionAuditOptions {
  readonly runs: number
  readonly seedPrefix?: string
  readonly stages: readonly StageId[]
  readonly catalog: ContentCatalog
  readonly approvedVariants?: ApprovedVariantLookup
  readonly policy: CompositionPolicy
}

export interface CostDistribution {
  /** All values are scheduling-cost hundredths. */
  readonly min: number
  readonly max: number
  readonly mean: number
  readonly median: number
  readonly standardDeviation: number
  readonly p10: number
  readonly p25: number
  readonly p75: number
  readonly p90: number
  readonly spread: number
}

export interface AuditCounts {
  readonly beats: Readonly<Record<string, number>>
  readonly templates: Readonly<Record<string, number>>
  readonly families: Readonly<Record<string, number>>
  readonly roles: Readonly<Record<string, number>>
  readonly interactions: Readonly<Record<string, number>>
  readonly domains: Readonly<Record<string, number>>
  readonly variants: Readonly<Record<string, number>>
  readonly bands: Readonly<Record<string, number>>
}

export interface StageAudit {
  readonly stageId: StageId
  readonly cost: CostDistribution
  readonly counts: AuditCounts
  readonly outsideEnvelope: number
}

export interface CompositionVerificationAudit {
  readonly validated: number
  readonly invalidPlans: number
  readonly validationIssueCounts: Readonly<Record<string, number>>
  readonly roundTrips: number
  readonly roundTripFailures: number
  readonly recompositions: number
  readonly recompositionMismatches: number
}

export type AuditContentSelectionStatus =
  | 'selected'
  | 'eligible-never-selected'
  | 'ineligible'
  | 'non-ordinary'
  | 'not-hostable'
  | 'role-not-allowed'
  | 'no-approved-variant'

export interface AuditContentStatus {
  readonly templateId: string
  readonly selected: number
  readonly status: AuditContentSelectionStatus
}

export interface VariantCoverageAudit {
  readonly templateId: string
  readonly available: number
  readonly selected: number
  readonly selectedDistinct: number
}

export interface DominantTemplateAudit {
  readonly templateId: string
  readonly runs: number
  /** Fraction of composed runs containing the template. */
  readonly runShare: number
}

export interface CompositionAuditReport {
  readonly runs: number
  readonly composed: number
  readonly failures: Readonly<Record<string, number>>
  readonly verification: CompositionVerificationAudit
  readonly total: CostDistribution
  readonly counts: AuditCounts
  readonly stages: readonly StageAudit[]
  /** How many distinct concrete plan fingerprints the sweep produced. */
  readonly distinctPlans: number
  readonly duplicatePlans: number
  readonly distinctPlanRatio: number
  readonly contentStatus: readonly AuditContentStatus[]
  readonly variantCoverage: readonly VariantCoverageAudit[]
  readonly dominantTemplates: readonly DominantTemplateAudit[]
  readonly issues: readonly ValidationIssue[]
}

interface MutableCounts {
  readonly beats: Record<string, number>
  readonly templates: Record<string, number>
  readonly families: Record<string, number>
  readonly roles: Record<string, number>
  readonly interactions: Record<string, number>
  readonly domains: Record<string, number>
  readonly variants: Record<string, number>
  readonly bands: Record<string, number>
}

function emptyCounts(): MutableCounts {
  return {
    beats: {},
    templates: {},
    families: {},
    roles: {},
    interactions: {},
    domains: {},
    variants: {},
    bands: { core: 0, standard: 0, stretch: 0 },
  }
}

function increment(counts: Record<string, number>, key: string): void {
  counts[key] = (counts[key] ?? 0) + 1
}

function round(value: number, digits = 2): number {
  const scale = 10 ** digits
  return Math.round((value + Number.EPSILON) * scale) / scale
}

function quantile(sorted: readonly number[], percentile: number): number {
  if (sorted.length === 0) return 0
  const position = (sorted.length - 1) * percentile
  const lowerIndex = Math.floor(position)
  const upperIndex = Math.ceil(position)
  const lower = sorted[lowerIndex] ?? 0
  const upper = sorted[upperIndex] ?? lower
  return round(lower + (upper - lower) * (position - lowerIndex))
}

function distribution(values: readonly number[]): CostDistribution {
  if (values.length === 0) {
    return {
      min: 0,
      max: 0,
      mean: 0,
      median: 0,
      standardDeviation: 0,
      p10: 0,
      p25: 0,
      p75: 0,
      p90: 0,
      spread: 0,
    }
  }

  const sorted = [...values].sort((left, right) => left - right)
  const min = sorted[0] ?? 0
  const max = sorted.at(-1) ?? 0
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length
  const variance =
    values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length

  return {
    min,
    max,
    mean: round(mean),
    median: quantile(sorted, 0.5),
    standardDeviation: round(Math.sqrt(variance)),
    p10: quantile(sorted, 0.1),
    p25: quantile(sorted, 0.25),
    p75: quantile(sorted, 0.75),
    p90: quantile(sorted, 0.9),
    spread: max - min,
  }
}

function allowedSpread(policy: CompositionPolicy): number {
  return policy.stages.reduce(
    (sum, stage) => sum + stage.difficulty.tolerance * 2,
    0,
  )
}

function variantsFor(
  template: ChallengeDefinition,
  approved: ApprovedVariantLookup | undefined,
) {
  return approved === undefined
    ? template.variants
    : approved.variantsFor(template.id)
}

function selectableStatus(
  template: ChallengeDefinition,
  options: CompositionAuditOptions,
  selected: number,
): AuditContentSelectionStatus {
  const eligibleStages = options.stages.filter((stageId) =>
    isEligibleForStage(template, stageId),
  )
  if (eligibleStages.length === 0) return 'ineligible'
  if (!isOrdinaryBeatRole(template.placement)) return 'non-ordinary'
  if (variantsFor(template, options.approvedVariants).length === 0) {
    return 'no-approved-variant'
  }

  let roleAllowed = false
  let hostable = false
  for (const stageId of eligibleStages) {
    const policy = stagePolicyFor(options.policy, stageId)
    if (policy === undefined) continue
    const allowed =
      template.placement === 'anchor' ||
      policy.secondaryRoles.includes(template.placement)
    roleAllowed ||= allowed
    if (
      allowed &&
      (policy.hostableTemplates === undefined ||
        policy.hostableTemplates.includes(template.id))
    ) {
      hostable = true
    }
  }

  if (!roleAllowed) return 'role-not-allowed'
  if (!hostable) return 'not-hostable'
  return selected > 0 ? 'selected' : 'eligible-never-selected'
}

function recordBeat(
  counts: MutableCounts,
  template: ChallengeDefinition,
  role: ChallengePlacementRole,
  band: DifficultyBand,
  address: string,
): void {
  increment(counts.templates, template.id)
  increment(counts.families, template.family)
  increment(counts.roles, role)
  increment(counts.interactions, template.interaction as InteractionKind)
  increment(counts.variants, address)
  increment(counts.bands, band)
  for (const domain of template.categories) {
    increment(counts.domains, domain as MathCategory)
  }
}

export function auditComposition(
  options: CompositionAuditOptions,
): CompositionAuditReport {
  const prefix = options.seedPrefix ?? 'audit'
  const totals: number[] = []
  const failures: Record<string, number> = {}
  const plans = new Set<string>()
  const counts = emptyCounts()
  const templateRunCounts: Record<string, number> = {}
  const selectedVariants = new Map<string, Set<string>>()
  const validationIssueCounts: Record<string, number> = {}
  let invalidPlans = 0
  let roundTripFailures = 0
  let recompositionMismatches = 0

  const perStage = new Map<
    StageId,
    { costs: number[]; counts: MutableCounts; outside: number }
  >()
  for (const stageId of options.stages) {
    perStage.set(stageId, { costs: [], counts: emptyCounts(), outside: 0 })
  }

  for (let index = 0; index < options.runs; index += 1) {
    const seed = toRunSeed(`${prefix}-${String(index)}`)
    const request = {
      seed,
      stages: options.stages,
      catalog: options.catalog,
      ...(options.approvedVariants === undefined
        ? {}
        : { approvedVariants: options.approvedVariants }),
      policy: options.policy,
    }
    const composed = composeRun(request)

    if (!composed.ok) {
      const code: CompositionFailureCode = composed.error.code
      increment(failures, code)
      continue
    }

    const plan = composed.value
    const fingerprint = planFingerprint(plan)
    totals.push(plan.difficultyCost)
    plans.add(fingerprint)
    increment(
      counts.beats,
      String(plan.stages.reduce((sum, stage) => sum + stage.beats.length, 0)),
    )

    const validationIssues = validateComposedPlan(plan, {
      catalog: options.catalog,
      policy: options.policy,
      ...(options.approvedVariants === undefined
        ? {}
        : { approvedVariants: options.approvedVariants }),
    }).filter((issue) => issue.severity === 'error')
    if (validationIssues.length > 0) {
      invalidPlans += 1
      for (const issue of validationIssues) {
        increment(validationIssueCounts, issue.code)
      }
    }

    const parsed = parseRunPlan(
      JSON.parse(JSON.stringify(serializeRunPlan(plan))) as unknown,
    )
    if (!parsed.ok || planFingerprint(parsed.value) !== fingerprint) {
      roundTripFailures += 1
    }

    const recomposed = composeRun(request)
    if (!recomposed.ok || planFingerprint(recomposed.value) !== fingerprint) {
      recompositionMismatches += 1
    }

    const templatesSeenInRun = new Set<string>()
    for (const stage of plan.stages) {
      const bucket = perStage.get(stage.stageId)
      if (bucket === undefined) continue

      bucket.costs.push(stage.difficultyCost)
      increment(bucket.counts.beats, String(stage.beats.length))
      const policy = stagePolicyFor(options.policy, stage.stageId)
      if (
        policy !== undefined &&
        Math.abs(stage.difficultyCost - policy.difficulty.target) >
          policy.difficulty.tolerance
      ) {
        bucket.outside += 1
      }

      for (const beat of stage.beats) {
        const template = options.catalog.template(beat.variant.templateId)
        if (template === undefined) continue
        const address = formatVariantAddress(beat.variant)
        recordBeat(counts, template, beat.role, beat.band, address)
        recordBeat(bucket.counts, template, beat.role, beat.band, address)
        templatesSeenInRun.add(template.id)
        const selected = selectedVariants.get(template.id) ?? new Set<string>()
        selected.add(beat.variant.variantId)
        selectedVariants.set(template.id, selected)
      }
    }
    for (const templateId of templatesSeenInRun) {
      increment(templateRunCounts, templateId)
    }
  }

  const issues: ValidationIssue[] = []
  const composedRuns = totals.length
  if (composedRuns === 0) {
    issues.push(
      contentError(
        'audit.nothing-composed',
        options.policy.id,
        'no seed produced a plan',
      ),
    )
  } else if (composedRuns < options.runs) {
    issues.push(
      contentError(
        'audit.composition-failures',
        options.policy.id,
        `${String(options.runs - composedRuns)} of ${String(options.runs)} seeds failed to compose`,
      ),
    )
  }
  if (invalidPlans > 0) {
    issues.push(
      contentError(
        'audit.invalid-plans',
        options.policy.id,
        `${String(invalidPlans)} composed plans failed independent validation`,
      ),
    )
  }
  if (roundTripFailures > 0) {
    issues.push(
      contentError(
        'audit.round-trip-failures',
        options.policy.id,
        `${String(roundTripFailures)} plans changed or failed during JSON round-trip`,
      ),
    )
  }
  if (recompositionMismatches > 0) {
    issues.push(
      contentError(
        'audit.recomposition-mismatch',
        options.policy.id,
        `${String(recompositionMismatches)} seeds did not reproduce their original plan`,
      ),
    )
  }

  const total = distribution(totals)
  const limit = allowedSpread(options.policy)
  if (composedRuns > 0 && total.spread > limit) {
    issues.push(
      contentError(
        'audit.load-spread',
        options.policy.id,
        `run load spans ${String(total.spread)} hundredths, wider than the ${String(limit)} the per-stage tolerances allow`,
      ),
    )
  }

  const stages: StageAudit[] = options.stages.flatMap((stageId) => {
    const bucket = perStage.get(stageId)
    if (bucket === undefined) return []
    if (bucket.outside > 0) {
      issues.push(
        contentError(
          'audit.outside-envelope',
          stageId,
          `${String(bucket.outside)} plans fell outside the stage's difficulty envelope`,
        ),
      )
    }
    return [
      {
        stageId,
        cost: distribution(bucket.costs),
        counts: bucket.counts,
        outsideEnvelope: bucket.outside,
      },
    ]
  })

  if (composedRuns > 1 && plans.size === 1) {
    issues.push(
      contentWarning(
        'audit.single-plan',
        options.policy.id,
        'every seed composed the same plan; the catalog offers no real choice under this policy',
      ),
    )
  }

  const contentStatus = options.catalog.templates.map((template) => {
    const selected = counts.templates[template.id] ?? 0
    return {
      templateId: template.id,
      selected,
      status: selectableStatus(template, options, selected),
    }
  })
  const variantCoverage = options.catalog.templates.map((template) => ({
    templateId: template.id,
    available: variantsFor(template, options.approvedVariants).length,
    selected: counts.templates[template.id] ?? 0,
    selectedDistinct: selectedVariants.get(template.id)?.size ?? 0,
  }))
  const dominantTemplates = Object.entries(templateRunCounts)
    .flatMap(([templateId, runCount]) => {
      const runShare = composedRuns === 0 ? 0 : runCount / composedRuns
      return runShare >= 0.8
        ? [{ templateId, runs: runCount, runShare: round(runShare, 4) }]
        : []
    })
    .sort((left, right) =>
      right.runShare === left.runShare
        ? left.templateId < right.templateId
          ? -1
          : left.templateId > right.templateId
            ? 1
            : 0
        : right.runShare - left.runShare,
    )

  return {
    runs: options.runs,
    composed: composedRuns,
    failures,
    verification: {
      validated: composedRuns,
      invalidPlans,
      validationIssueCounts,
      roundTrips: composedRuns,
      roundTripFailures,
      recompositions: composedRuns,
      recompositionMismatches,
    },
    total,
    counts,
    stages,
    distinctPlans: plans.size,
    duplicatePlans: composedRuns - plans.size,
    distinctPlanRatio:
      composedRuns === 0 ? 0 : round(plans.size / composedRuns, 4),
    contentStatus,
    variantCoverage,
    dominantTemplates,
    issues,
  }
}
