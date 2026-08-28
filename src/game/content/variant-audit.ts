/**
 * Statistical audit of a variant population.
 *
 * Validation answers "is this variant correct". The audit answers a question no
 * single variant can: **is this population any good**. A template can produce
 * ten thousand individually valid variants and still be broken — because the
 * right answer is always in the same place, because nine in ten candidates
 * collapse to the same problem, or because the generator rejects almost
 * everything it makes.
 *
 * The audit is deliberately opinionated. A report that always says OK is
 * decoration, so every finding here corresponds to a way content has actually
 * gone wrong in assessment systems, and each threshold says why it is where it
 * is.
 *
 * What this is **not**: a difficulty model. Whether a variant is hard is a
 * separate question with its own stage; the audit only reports distributions it
 * can measure without one.
 */

import type { ContentCatalog } from '../challenges/content-catalog'
import type { ChallengeDefinition } from '../challenges/contracts'
import type { ChallengeId } from '../core/branded'
import { instanceRefFor } from '../challenges/instance-address'
import { createVariantRng } from '../challenges/content-model'
import { variantRefOf } from '../challenges/contracts'
import { createRng } from '../random/rng'
import { toRunSeed } from '../core/branded'
import { contentError, contentWarning, type ValidationIssue } from './issues'
import type { PipelineReport } from './variant-pipeline'
import type { ApprovedVariantCatalog } from './variant-catalog'

/**
 * Thresholds, and why each one sits where it does.
 *
 * They are review triggers, not laws: crossing one means a human should look,
 * and the error levels mark the cases where deploying anyway would be
 * indefensible.
 */
export const AUDIT_THRESHOLDS = {
  /**
   * A generator that wastes more than half its candidates is usually building
   * parameters and hoping, rather than constructing them. Above nine in ten it
   * is not really a generator at all.
   */
  rejectionWarn: 0.5,
  rejectionError: 0.9,
  /**
   * Duplicates say the candidate space is narrower than the sweep, which is
   * information rather than a defect: the pipeline drops them and the catalog
   * stays correct either way. It is a warning, and the condition that actually
   * blocks is `minDistinctProblems` below — a space too small to fill a
   * catalog is a real problem; a space that folds after two thousand draws is
   * just a space.
   */
  duplicateWarn: 0.25,
  /**
   * Answer-position skew. With three or more positions, chance alone rarely
   * puts seven in ten optima in the same slot, and a player notices that long
   * before a statistician does.
   */
  positionSkew: 0.7,
  /** Below this many samples, position skew is noise rather than a finding. */
  positionMinSamples: 20,
  /** A generated template offering fewer distinct problems than this is not varying. */
  minDistinctProblems: 4,
} as const

export interface OptionPositionStats {
  /** How many audited variants had a determinable optimal option. */
  readonly samples: number
  /** How often the optimal answer sat at each option index. */
  readonly byIndex: Readonly<Record<string, number>>
  /** Distinct optimal option labels seen. */
  readonly distinctAnswers: number
}

export interface TemplateAudit {
  readonly templateId: ChallengeId
  readonly source: 'authored' | 'generated'
  readonly attempted: number
  readonly approved: number
  readonly rejected: number
  readonly duplicates: number
  readonly rejectionRate: number
  readonly duplicateRate: number
  readonly distinctProblems: number
  readonly rejectionsByCode: Readonly<Record<string, number>>
  readonly optionPositions: OptionPositionStats | undefined
}

export interface VariantAuditReport {
  readonly attempted: number
  readonly approved: number
  readonly rejected: number
  readonly duplicates: number
  readonly templates: readonly TemplateAudit[]
  readonly findings: readonly ValidationIssue[]
}

/**
 * Where the optimal answer sits, for the interactions that have options.
 *
 * Only choice-shaped views are measurable this way, which is exactly where the
 * "the answer is always B" failure lives. Builder, assignment and grid
 * interactions have no option index to skew, so they are reported as absent
 * rather than as zero.
 */
function optionPositions(
  template: ChallengeDefinition,
  variantIds: readonly string[],
): OptionPositionStats | undefined {
  const byIndex: Record<string, number> = {}
  const answers = new Set<string>()
  let samples = 0
  let measurable = false

  for (const variantId of variantIds) {
    const ref = instanceRefFor(template, { variantId: variantId as never })
    const instance = template.materialize(ref, {
      rng: createRng(toRunSeed('audit'), ['audit', template.id, variantId]),
      difficulty: ref.difficulty,
      variantId: ref.variantId,
      variantRng: createVariantRng(variantRefOf(ref)),
    })

    const view = instance.present([])
    if (view.kind !== 'decision-card' && view.kind !== 'timeline') continue
    measurable = true

    const optimalAt = view.options.findIndex((option) => {
      const result = instance.evaluate(
        { kind: view.kind, optionId: option.id },
        [],
      )
      return result.ok && result.value.quality === 'optimal'
    })

    if (optimalAt < 0) continue
    samples += 1
    const key = String(optimalAt)
    byIndex[key] = (byIndex[key] ?? 0) + 1
    answers.add(view.options[optimalAt]?.label ?? '')
  }

  return measurable
    ? { samples, byIndex, distinctAnswers: answers.size }
    : undefined
}

function auditTemplate(
  template: ChallengeDefinition,
  report: PipelineReport,
  catalog: ApprovedVariantCatalog,
): TemplateAudit {
  const templateReport = report.templates.find(
    (entry) => entry.templateId === template.id,
  )
  const approvedEntries = catalog.entries.filter(
    (entry) => entry.templateId === template.id,
  )

  const attempted = templateReport?.attempted ?? 0
  const approved = approvedEntries.length
  const rejected = templateReport?.rejected ?? 0
  const duplicates = templateReport?.duplicates ?? 0

  return {
    templateId: template.id,
    source: template.variantSource.kind,
    attempted,
    approved,
    rejected,
    duplicates,
    rejectionRate: attempted === 0 ? 0 : rejected / attempted,
    duplicateRate: attempted === 0 ? 0 : duplicates / attempted,
    distinctProblems: new Set(approvedEntries.map((entry) => entry.fingerprint))
      .size,
    rejectionsByCode: templateReport?.rejectionsByCode ?? {},
    optionPositions: optionPositions(
      template,
      approvedEntries.map((entry) => entry.variantId),
    ),
  }
}

function findingsFor(audit: TemplateAudit): readonly ValidationIssue[] {
  const findings: ValidationIssue[] = []
  const subject = audit.templateId

  if (audit.approved === 0) {
    findings.push(
      contentError(
        'audit.zero-approved',
        subject,
        `${String(audit.attempted)} candidates and not one approved variant`,
      ),
    )
  }

  if (audit.rejectionRate >= AUDIT_THRESHOLDS.rejectionError) {
    findings.push(
      contentError(
        'audit.rejection-rate',
        subject,
        `${(audit.rejectionRate * 100).toFixed(1)} % of candidates rejected: the generator is not constructing valid parameters`,
      ),
    )
  } else if (audit.rejectionRate >= AUDIT_THRESHOLDS.rejectionWarn) {
    findings.push(
      contentWarning(
        'audit.rejection-rate',
        subject,
        `${(audit.rejectionRate * 100).toFixed(1)} % of candidates rejected`,
      ),
    )
  }

  if (audit.duplicateRate >= AUDIT_THRESHOLDS.duplicateWarn) {
    findings.push(
      contentWarning(
        'audit.duplicate-rate',
        subject,
        `${(audit.duplicateRate * 100).toFixed(1)} % duplicate candidates`,
      ),
    )
  }

  if (
    audit.source === 'generated' &&
    audit.approved > 0 &&
    audit.distinctProblems < AUDIT_THRESHOLDS.minDistinctProblems
  ) {
    findings.push(
      contentError(
        'audit.no-variety',
        subject,
        `only ${String(audit.distinctProblems)} distinct problems across ${String(audit.approved)} approved variants`,
      ),
    )
  }

  const positions = audit.optionPositions
  if (positions !== undefined && positions.samples > 0) {
    if (positions.distinctAnswers <= 1 && positions.samples > 1) {
      findings.push(
        contentError(
          'audit.constant-answer',
          subject,
          `every audited variant has the same correct answer, so it can be memorised`,
        ),
      )
    }

    if (positions.samples >= AUDIT_THRESHOLDS.positionMinSamples) {
      const counts = Object.values(positions.byIndex)
      const top = Math.max(...counts, 0)
      const share = top / positions.samples
      if (counts.length >= 3 && share >= AUDIT_THRESHOLDS.positionSkew) {
        findings.push(
          contentWarning(
            'audit.answer-position-skew',
            subject,
            `${(share * 100).toFixed(1)} % of correct answers share one position`,
          ),
        )
      }
    }
  }

  return findings
}

/** Audits a built catalog against the pipeline report that produced it. */
export function auditVariantCatalog(
  contentCatalog: ContentCatalog,
  catalog: ApprovedVariantCatalog,
  report: PipelineReport,
): VariantAuditReport {
  const templates = contentCatalog.templates.map((template) =>
    auditTemplate(template, report, catalog),
  )

  return {
    attempted: report.attempted,
    approved: report.approved,
    rejected: report.rejected,
    duplicates: report.duplicates,
    templates,
    findings: templates.flatMap(findingsFor),
  }
}
