/**
 * Statistical audit of what a composition policy actually produces.
 *
 * A budget that is never measured is a claim. This sweeps thousands of seeds,
 * composes a run for each, and reports the distribution of what came out — total
 * load, load per stage, how often each template and each band is scheduled, and
 * how many seeds failed to compose at all.
 *
 * It answers the question the stage exit gate asks: are many different runs
 * comparably difficult? And it answers it with numbers, not with the assertion
 * that the code intends to make them so.
 *
 * ## What a passing report does not prove
 *
 * That the runs are *equally hard for a person*. The load is engineered
 * structural comparability under a calibration nobody has validated against
 * students yet. Teacher Gate and real play data are what turn it into a claim
 * about difficulty; until then it is a claim about scheduling.
 */

import {
  contentError,
  contentWarning,
  type ValidationIssue,
} from '../core/issues'
import { toRunSeed } from '../core/branded'
import type { ContentCatalog } from '../challenges/content-catalog'
import type { ApprovedVariantLookup } from '../challenges/variant-source'
import { formatVariantAddress } from '../challenges/content-model'
import type { DifficultyBand } from '../difficulty/cognitive'
import type { DifficultyCost } from '../difficulty/cost-policy'
import type { StageId } from '../progression/stages'
import { composeRun } from './composer'
import type { CompositionPolicy } from './composition-policy'
import type { CompositionFailureCode } from './composition-failure'

export interface CompositionAuditOptions {
  readonly runs: number
  readonly seedPrefix?: string
  readonly stages: readonly StageId[]
  readonly catalog: ContentCatalog
  readonly approvedVariants?: ApprovedVariantLookup
  readonly policy: CompositionPolicy
}

export interface CostDistribution {
  readonly min: DifficultyCost
  readonly max: DifficultyCost
  /** Mean in hundredths, rounded. Reporting only. */
  readonly mean: DifficultyCost
  readonly spread: DifficultyCost
}

export interface StageAudit {
  readonly stageId: StageId
  readonly cost: CostDistribution
  readonly beatCounts: Readonly<Record<string, number>>
  readonly templateCounts: Readonly<Record<string, number>>
  readonly bandCounts: Readonly<Record<DifficultyBand, number>>
  readonly outsideEnvelope: number
}

export interface CompositionAuditReport {
  readonly runs: number
  readonly composed: number
  readonly failures: Readonly<Record<string, number>>
  readonly total: CostDistribution
  readonly stages: readonly StageAudit[]
  /** How many distinct plans the sweep produced. Variety, measured. */
  readonly distinctPlans: number
  readonly issues: readonly ValidationIssue[]
}

function distribution(values: readonly number[]): CostDistribution {
  if (values.length === 0) {
    return { min: 0, max: 0, mean: 0, spread: 0 }
  }
  const min = Math.min(...values)
  const max = Math.max(...values)
  const mean = Math.round(
    values.reduce((sum, value) => sum + value, 0) / values.length,
  )
  return { min, max, mean, spread: max - min }
}

/**
 * How far a run's total load may spread before the budget stops meaning much.
 *
 * The sum of every stage's tolerance: if each year is allowed to miss its target
 * by that much, a run cannot legitimately miss by more. Exceeding it means the
 * policy's per-stage envelopes do not add up to a comparable career.
 */
function allowedSpread(policy: CompositionPolicy): number {
  return policy.stages.reduce(
    (sum, stage) => sum + stage.difficulty.tolerance * 2,
    0,
  )
}

export function auditComposition(
  options: CompositionAuditOptions,
): CompositionAuditReport {
  const prefix = options.seedPrefix ?? 'audit'
  const totals: number[] = []
  const failures: Record<string, number> = {}
  const plans = new Set<string>()
  const perStage = new Map<
    StageId,
    {
      costs: number[]
      beats: Record<string, number>
      templates: Record<string, number>
      bands: Record<DifficultyBand, number>
      outside: number
    }
  >()

  for (const stageId of options.stages) {
    perStage.set(stageId, {
      costs: [],
      beats: {},
      templates: {},
      bands: { core: 0, standard: 0, stretch: 0 },
      outside: 0,
    })
  }

  for (let index = 0; index < options.runs; index += 1) {
    const composed = composeRun({
      seed: toRunSeed(`${prefix}-${String(index)}`),
      stages: options.stages,
      catalog: options.catalog,
      ...(options.approvedVariants === undefined
        ? {}
        : { approvedVariants: options.approvedVariants }),
      policy: options.policy,
    })

    if (!composed.ok) {
      const code: CompositionFailureCode = composed.error.code
      failures[code] = (failures[code] ?? 0) + 1
      continue
    }

    totals.push(composed.value.difficultyCost)
    plans.add(
      composed.value.stages
        .flatMap((stage) =>
          stage.beats.map((beat) => formatVariantAddress(beat.variant)),
        )
        .join('|'),
    )

    for (const stage of composed.value.stages) {
      const bucket = perStage.get(stage.stageId)
      if (bucket === undefined) {
        continue
      }
      bucket.costs.push(stage.difficultyCost)
      const beats = String(stage.beats.length)
      bucket.beats[beats] = (bucket.beats[beats] ?? 0) + 1

      const policy = options.policy.stages.find(
        (entry) => entry.stageId === stage.stageId,
      )
      if (
        policy !== undefined &&
        Math.abs(stage.difficultyCost - policy.difficulty.target) >
          policy.difficulty.tolerance
      ) {
        bucket.outside += 1
      }

      for (const beat of stage.beats) {
        const id = beat.variant.templateId
        bucket.templates[id] = (bucket.templates[id] ?? 0) + 1
        bucket.bands[beat.band] += 1
      }
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
    if (bucket === undefined) {
      return []
    }
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
        beatCounts: bucket.beats,
        templateCounts: bucket.templates,
        bandCounts: bucket.bands,
        outsideEnvelope: bucket.outside,
      },
    ]
  })

  // A composer that always answers the same thing is deterministic and useless:
  // the second run is the first one again. Advisory, because a content set small
  // enough to have one legal plan is a content problem, not a composer defect.
  if (composedRuns > 1 && plans.size === 1) {
    issues.push(
      contentWarning(
        'audit.single-plan',
        options.policy.id,
        'every seed composed the same plan; the catalog offers no real choice under this policy',
      ),
    )
  }

  return {
    runs: options.runs,
    composed: composedRuns,
    failures,
    total,
    stages,
    distinctPlans: plans.size,
    issues,
  }
}
