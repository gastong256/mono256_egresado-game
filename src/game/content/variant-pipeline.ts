/**
 * The variant pipeline.
 *
 * ```text
 * source            authored records, or a candidate address space
 *   ↓ resolve       parameters, from the address alone
 *   ↓ materialise   the instance a player would actually see
 *   ↓ validate      generic checks, then the template's own mathematics
 *   ↓ canonicalise  the template's semantic view of its parameters
 *   ↓ fingerprint   SHA-256 of that view
 *   ↓ deduplicate   two addresses, one problem → one entry
 *   ↓ approve       into a versioned catalog
 * ```
 *
 * Two properties matter more than anything else here.
 *
 * **Generating is not approving.** A candidate that a generator produced is a
 * proposal. Only a candidate that survived every check reaches the catalog, and
 * a rejected one goes to the report rather than into the artifact with a flag
 * saying not to use it.
 *
 * **The build is reproducible.** Candidates are visited in address order, the
 * output is sorted by address, and nothing volatile is recorded — so the same
 * code and the same configuration produce the same bytes.
 */

import {
  createVariantRng,
  formatVariantAddress,
  type ChallengeVariantRef,
} from '../challenges/content-model'
import type { ContentCatalog } from '../challenges/content-catalog'
import { variantRefOf, type ChallengeDefinition } from '../challenges/contracts'
import { toRunSeed, type ChallengeId, type VariantId } from '../core/branded'
import { createRng } from '../random/rng'
import { instanceRefFor } from '../challenges/instance-address'
import {
  candidateVariantId,
  type ErasedVariantSource,
} from '../challenges/variant-source'
import {
  countByCode,
  isApprovable,
  variantDiagnostic,
  type VariantDiagnostic,
} from '../challenges/variant-validation'
import {
  canonicalCatalog,
  variantFingerprint,
  type ApprovedVariant,
  type ApprovedVariantCatalog,
  type CatalogGeneratorRecord,
  type VariantSourceKind,
} from './variant-catalog'

/** What happened to one candidate address. */
export type CandidateOutcome =
  | { readonly kind: 'approved'; readonly fingerprint: string }
  | {
      readonly kind: 'rejected'
      readonly diagnostics: readonly VariantDiagnostic[]
    }
  | {
      readonly kind: 'duplicate'
      readonly fingerprint: string
      readonly of: string
    }

export interface CandidateResult {
  readonly ref: ChallengeVariantRef
  readonly source: VariantSourceKind
  readonly outcome: CandidateOutcome
}

export interface TemplatePipelineReport {
  readonly templateId: ChallengeId
  readonly source: 'authored' | 'generated'
  readonly generatorId: string | undefined
  readonly generatorVersion: string | undefined
  readonly attempted: number
  readonly approved: number
  readonly rejected: number
  readonly duplicates: number
  readonly rejectionsByCode: Readonly<Record<string, number>>
  /** A few real diagnostics, so a failing build says what actually broke. */
  readonly samples: readonly VariantDiagnostic[]
}

export interface PipelineReport {
  readonly attempted: number
  readonly approved: number
  readonly rejected: number
  readonly duplicates: number
  readonly templates: readonly TemplatePipelineReport[]
  readonly results: readonly CandidateResult[]
}

export interface BuildCatalogOptions {
  readonly catalogVersion: string
  readonly contentVersion: string
  /**
   * How many candidate addresses to visit per generated template.
   *
   * Visiting is not approving: the sweep stops at `approvalTarget` approvals or
   * at this many attempts, whichever comes first.
   */
  readonly candidatesPerTemplate: number
  /** How many generated variants to approve per template. */
  readonly approvalTarget: number
  /** Keeps every candidate result, for auditing rather than for building. */
  readonly keepResults?: boolean
}

export interface BuildCatalogOutput {
  readonly catalog: ApprovedVariantCatalog
  readonly report: PipelineReport
}

const MAX_SAMPLES = 3

/**
 * Materialises a variant as if a run at `stage index` had scheduled it.
 *
 * The two arbitrary run seeds are the point: they stand in for two different
 * players, and a variant that answers differently to them is not a variant.
 */
function materializeAt(
  template: ChallengeDefinition,
  variantId: VariantId,
  runSeed: string,
  eventIndex: number,
) {
  const ref = instanceRefFor(template, { variantId, eventIndex })
  return template.materialize(ref, {
    rng: createRng(toRunSeed(runSeed), [
      'stage',
      ref.stageId,
      'event',
      ref.eventIndex,
      'challenge',
      ref.templateId,
      'difficulty',
      ref.difficulty,
    ]),
    difficulty: ref.difficulty,
    variantId,
    variantRng: createVariantRng(variantRefOf(ref)),
  })
}

/** Evaluates one address end to end, without deciding whether to keep it. */
export function evaluateVariant(
  contentCatalog: ContentCatalog,
  template: ChallengeDefinition,
  variantId: VariantId,
): {
  readonly ref: ChallengeVariantRef
  readonly diagnostics: readonly VariantDiagnostic[]
  readonly fingerprint: string | undefined
} {
  const ref: ChallengeVariantRef = {
    familyId: template.family,
    templateId: template.id,
    variantId,
  }

  if (!template.variantSource.accepts(variantId)) {
    return {
      ref,
      fingerprint: undefined,
      diagnostics: [
        variantDiagnostic(
          'address-not-accepted',
          ref,
          `${template.id} does not accept ${variantId}`,
        ),
      ],
    }
  }

  const variantRng = createVariantRng(ref)

  let diagnostics: readonly VariantDiagnostic[]
  try {
    // Materialised twice, at two different places in two different runs. A
    // variant's content has to come from its address and nothing else — that is
    // the promise a pre-validated catalog makes — so if the run seed or the slot
    // leaks into the problem, the two views differ and the candidate is refused.
    const here = materializeAt(template, variantId, 'catalog-a', 0)
    const elsewhere = materializeAt(template, variantId, 'catalog-b', 4)

    if (
      JSON.stringify(here.present([])) !== JSON.stringify(elsewhere.present([]))
    ) {
      return {
        ref,
        fingerprint: undefined,
        diagnostics: [
          variantDiagnostic(
            'address-not-deterministic',
            ref,
            'the same variant address produced two different problems, so its content depends on the run rather than on its identity',
          ),
        ],
      }
    }

    diagnostics = template.variantSource.validate({
      ref,
      instance: here,
      variantRng,
    })
  } catch (error) {
    // A generator that cannot build a valid instance is a rejected candidate,
    // not a crashed build: the sweep has to keep going and count it.
    return {
      ref,
      fingerprint: undefined,
      diagnostics: [
        variantDiagnostic(
          'generation-failed',
          ref,
          error instanceof Error ? error.message : String(error),
        ),
      ],
    }
  }

  return {
    ref,
    diagnostics,
    fingerprint: isApprovable(diagnostics)
      ? variantFingerprint(contentCatalog, ref)
      : undefined,
  }
}

interface TemplateSweep {
  readonly report: TemplatePipelineReport
  readonly approved: readonly ApprovedVariant[]
  readonly results: readonly CandidateResult[]
}

function addressesToVisit(
  source: ErasedVariantSource,
  options: BuildCatalogOptions,
): readonly {
  readonly variantId: VariantId
  readonly kind: VariantSourceKind
}[] {
  const authored = source.authoredIds.map((variantId) => ({
    variantId,
    kind: 'authored' as const,
  }))

  if (source.kind === 'authored') return authored

  const budget = Math.min(options.candidatesPerTemplate, source.candidateSpace)
  const generated = Array.from({ length: budget }, (_, index) => ({
    variantId: candidateVariantId(index),
    kind: 'generated' as const,
  }))

  return [...authored, ...generated]
}

function sweepTemplate(
  contentCatalog: ContentCatalog,
  template: ChallengeDefinition,
  options: BuildCatalogOptions,
  fingerprintOwners: Map<string, string>,
): TemplateSweep {
  const approved: ApprovedVariant[] = []
  const results: CandidateResult[] = []
  const samples: VariantDiagnostic[] = []
  const rejections: VariantDiagnostic[] = []

  let attempted = 0
  let duplicates = 0
  let generatedApproved = 0

  for (const address of addressesToVisit(template.variantSource, options)) {
    if (
      address.kind === 'generated' &&
      generatedApproved >= options.approvalTarget
    ) {
      break
    }

    attempted += 1
    const evaluated = evaluateVariant(
      contentCatalog,
      template,
      address.variantId,
    )

    if (
      !isApprovable(evaluated.diagnostics) ||
      evaluated.fingerprint === undefined
    ) {
      rejections.push(...evaluated.diagnostics)
      if (
        samples.length < MAX_SAMPLES &&
        evaluated.diagnostics[0] !== undefined
      ) {
        samples.push(evaluated.diagnostics[0])
      }
      if (options.keepResults === true) {
        results.push({
          ref: evaluated.ref,
          source: address.kind,
          outcome: { kind: 'rejected', diagnostics: evaluated.diagnostics },
        })
      }
      continue
    }

    const owner = fingerprintOwners.get(evaluated.fingerprint)
    if (owner !== undefined) {
      duplicates += 1
      if (options.keepResults === true) {
        results.push({
          ref: evaluated.ref,
          source: address.kind,
          outcome: {
            kind: 'duplicate',
            fingerprint: evaluated.fingerprint,
            of: owner,
          },
        })
      }
      continue
    }

    fingerprintOwners.set(
      evaluated.fingerprint,
      formatVariantAddress(evaluated.ref),
    )
    approved.push({
      familyId: evaluated.ref.familyId,
      templateId: evaluated.ref.templateId,
      variantId: evaluated.ref.variantId,
      source: address.kind,
      fingerprint: evaluated.fingerprint,
    })
    if (address.kind === 'generated') generatedApproved += 1

    if (options.keepResults === true) {
      results.push({
        ref: evaluated.ref,
        source: address.kind,
        outcome: { kind: 'approved', fingerprint: evaluated.fingerprint },
      })
    }
  }

  return {
    approved,
    results,
    report: {
      templateId: template.id,
      source: template.variantSource.kind,
      generatorId: template.variantSource.generatorId,
      generatorVersion: template.variantSource.generatorVersion,
      attempted,
      approved: approved.length,
      rejected: attempted - approved.length - duplicates,
      duplicates,
      rejectionsByCode: countByCode(rejections),
      samples,
    },
  }
}

/**
 * Builds an approved catalog from a content catalog.
 *
 * Templates are visited in the content catalog's canonical order and candidates
 * in address order, so the result does not depend on how anything was
 * registered. Duplicate detection is global: the same problem reached from two
 * templates is still one problem.
 */
export function buildVariantCatalog(
  contentCatalog: ContentCatalog,
  options: BuildCatalogOptions,
): BuildCatalogOutput {
  const fingerprintOwners = new Map<string, string>()
  const entries: ApprovedVariant[] = []
  const generators: CatalogGeneratorRecord[] = []
  const templates: TemplatePipelineReport[] = []
  const results: CandidateResult[] = []

  for (const template of contentCatalog.templates) {
    const sweep = sweepTemplate(
      contentCatalog,
      template,
      options,
      fingerprintOwners,
    )
    entries.push(...sweep.approved)
    templates.push(sweep.report)
    results.push(...sweep.results)

    const source = template.variantSource
    if (
      source.generatorId !== undefined &&
      source.generatorVersion !== undefined
    ) {
      generators.push({
        templateId: template.id,
        generatorId: source.generatorId,
        generatorVersion: source.generatorVersion,
        candidateSpace: source.candidateSpace,
      })
    }
  }

  const attempted = templates.reduce(
    (total, report) => total + report.attempted,
    0,
  )
  const duplicates = templates.reduce(
    (total, report) => total + report.duplicates,
    0,
  )

  return {
    catalog: canonicalCatalog({
      catalogVersion: options.catalogVersion,
      contentVersion: options.contentVersion,
      generators,
      entries,
    }),
    report: {
      attempted,
      approved: entries.length,
      rejected: attempted - entries.length - duplicates,
      duplicates,
      templates,
      results,
    },
  }
}
