/**
 * The approved variant catalog.
 *
 * This is **not** the `ContentCatalog`. That one answers "which families and
 * templates exist"; this one answers "which concrete variants passed validation
 * and may be deployed under a given catalog version". A template can exist in
 * the content catalog and contribute nothing to an approved catalog, and that is
 * a meaningful, visible state rather than a bug.
 *
 * ## What is stored, and what is not
 *
 * An entry stores an **address** and a **fingerprint**, never parameters. A
 * variant's parameters are a pure function of its address — that is the whole
 * point of the variant substream — so storing them would duplicate a derivable
 * fact and create a second thing that can go stale. The fingerprint is what
 * turns that into a checkable claim: recompute it from the code and compare.
 *
 * ## Fingerprint contents
 *
 * `sha256(canonical({ familyId, templateId, content }))`, where `content` is the
 * template's own canonical view of its parameters. Deliberately **excluded**:
 * the variant id, the generator version, the catalog version, and anything with
 * a clock in it. Two addresses that produce the same problem must collide — that
 * is how a duplicate is found — and an authored variant that happens to equal a
 * generated one is genuinely the same problem.
 */

import { canonicalize } from '../runs/replay'
import {
  createVariantRng,
  formatVariantAddress,
  type ChallengeVariantRef,
} from '../challenges/content-model'
import type { ContentCatalog } from '../challenges/content-catalog'
import { z } from 'zod'

import {
  IDENTIFIER_PATTERN,
  toChallengeId,
  toScenarioFamilyId,
  toVariantId,
  type ChallengeId,
  type ScenarioFamilyId,
  type VariantId,
} from '../core/branded'
import type { EngineRejection } from '../core/errors'
import { err, ok, type Result } from '../core/result'
import type { ApprovedVariantLookup } from '../challenges/variant-source'
import { contentError, type ValidationIssue } from './issues'
import { sha256Hex } from './hash'

/** How a variant came to exist. */
export type VariantSourceKind = 'authored' | 'generated'

/** One approved variant: its address, where it came from, and its identity. */
export interface ApprovedVariant {
  readonly familyId: ScenarioFamilyId
  readonly templateId: ChallengeId
  readonly variantId: VariantId
  readonly source: VariantSourceKind
  /** SHA-256 of the canonical semantic content. */
  readonly fingerprint: string
}

/** The generator a template used, recorded so a stale artifact is detectable. */
export interface CatalogGeneratorRecord {
  readonly templateId: ChallengeId
  readonly generatorId: string
  readonly generatorVersion: string
  readonly candidateSpace: number
}

export interface ApprovedVariantCatalog {
  /** Stable identity of this approved set. Never `latest`. */
  readonly catalogVersion: string
  /** The content version the approvals were computed against. */
  readonly contentVersion: string
  readonly generators: readonly CatalogGeneratorRecord[]
  readonly entries: readonly ApprovedVariant[]
}

/**
 * The fingerprint of the variant at an address.
 *
 * Derived from the template's own canonical view, so a challenge decides what
 * makes two of its variants the same problem.
 */
export function variantFingerprint(
  catalog: ContentCatalog,
  ref: ChallengeVariantRef,
): string | undefined {
  const template = catalog.template(ref.templateId)
  if (template === undefined || template.family !== ref.familyId) {
    return undefined
  }
  if (!template.variantSource.accepts(ref.variantId)) {
    return undefined
  }

  const content = template.variantSource.canonicalFor(
    ref.variantId,
    createVariantRng(ref),
  )

  return sha256Hex(
    canonicalize({
      familyId: ref.familyId,
      templateId: ref.templateId,
      content,
    }),
  )
}

function addressOf(entry: ApprovedVariant): string {
  return formatVariantAddress(entry)
}

/** Canonical order: by address, so the artifact never depends on build order. */
function sortEntries(
  entries: readonly ApprovedVariant[],
): readonly ApprovedVariant[] {
  return [...entries].sort((left, right) => {
    const a = addressOf(left)
    const b = addressOf(right)
    return a < b ? -1 : a > b ? 1 : 0
  })
}

function sortGenerators(
  generators: readonly CatalogGeneratorRecord[],
): readonly CatalogGeneratorRecord[] {
  return [...generators].sort((left, right) =>
    left.templateId < right.templateId
      ? -1
      : left.templateId > right.templateId
        ? 1
        : 0,
  )
}

/**
 * The catalog in canonical form.
 *
 * Every collection sorted by a stable semantic key, every object with its keys
 * in a fixed order. Two builds of the same inputs produce the same object, and
 * therefore the same bytes.
 */
export function canonicalCatalog(
  catalog: ApprovedVariantCatalog,
): ApprovedVariantCatalog {
  return {
    catalogVersion: catalog.catalogVersion,
    contentVersion: catalog.contentVersion,
    generators: sortGenerators(catalog.generators).map((generator) => ({
      templateId: generator.templateId,
      generatorId: generator.generatorId,
      generatorVersion: generator.generatorVersion,
      candidateSpace: generator.candidateSpace,
    })),
    entries: sortEntries(catalog.entries).map((entry) => ({
      familyId: entry.familyId,
      templateId: entry.templateId,
      variantId: entry.variantId,
      source: entry.source,
      fingerprint: entry.fingerprint,
    })),
  }
}

/**
 * The catalog as the committed artifact.
 *
 * Two-space JSON with a trailing newline: the exact shape Prettier writes, so a
 * generated artifact can live in the repository without fighting the formatter.
 * Nothing volatile goes in — no timestamp, no path, no machine name — because a
 * rebuild has to produce byte-identical output.
 */
export function serializeCatalog(catalog: ApprovedVariantCatalog): string {
  return `${JSON.stringify(canonicalCatalog(catalog), null, 2)}\n`
}

const approvedVariantSchema = z.object({
  familyId: z.string().regex(IDENTIFIER_PATTERN),
  templateId: z.string().regex(IDENTIFIER_PATTERN),
  variantId: z.string().regex(IDENTIFIER_PATTERN),
  source: z.enum(['authored', 'generated']),
  fingerprint: z.string().regex(/^[0-9a-f]{64}$/u),
})

const catalogSchema = z.object({
  catalogVersion: z.string().min(1),
  contentVersion: z.string().min(1),
  generators: z.array(
    z.object({
      templateId: z.string().regex(IDENTIFIER_PATTERN),
      generatorId: z.string().min(1),
      generatorVersion: z.string().min(1),
      candidateSpace: z.number().int().min(0),
    }),
  ),
  entries: z.array(approvedVariantSchema),
})

/**
 * Parses a catalog artifact read from disk.
 *
 * A committed catalog is a file, and a file is a boundary: it gets parsed like
 * any other untrusted input rather than asserted into the right type. A corrupt
 * artifact fails here, loudly, with the field that broke — instead of surfacing
 * later as a variant address that resolves to nothing.
 */
export function parseApprovedVariantCatalog(
  value: unknown,
): Result<ApprovedVariantCatalog, EngineRejection> {
  const parsed = catalogSchema.safeParse(value)
  if (!parsed.success) {
    return err({
      kind: 'invalid-content',
      issues: parsed.error.issues.map(
        (issue) => `${issue.path.join('.')}: ${issue.message}`,
      ),
    })
  }

  const data = parsed.data
  return ok({
    catalogVersion: data.catalogVersion,
    contentVersion: data.contentVersion,
    generators: data.generators.map((record) => ({
      templateId: toChallengeId(record.templateId),
      generatorId: record.generatorId,
      generatorVersion: record.generatorVersion,
      candidateSpace: record.candidateSpace,
    })),
    entries: data.entries.map((entry) => ({
      familyId: toScenarioFamilyId(entry.familyId),
      templateId: toChallengeId(entry.templateId),
      variantId: toVariantId(entry.variantId),
      source: entry.source,
      fingerprint: entry.fingerprint,
    })),
  })
}

/**
 * The engine-facing view of an approved catalog.
 *
 * The adapter for the port the transition depends on: it turns a catalog
 * artifact into the two things a run needs — which set it is, and which variants
 * of a template were approved.
 */
export function approvedVariantLookup(
  catalog: ApprovedVariantCatalog,
): ApprovedVariantLookup {
  const byTemplate = new Map<string, VariantId[]>()
  for (const entry of catalog.entries) {
    const bucket = byTemplate.get(entry.templateId)
    if (bucket === undefined) {
      byTemplate.set(entry.templateId, [entry.variantId])
      continue
    }
    bucket.push(entry.variantId)
  }

  return {
    catalogVersion: catalog.catalogVersion,
    variantsFor: (templateId) => byTemplate.get(templateId) ?? [],
  }
}

/** Approved variants of one template, in canonical order. */
export function approvedVariantsFor(
  catalog: ApprovedVariantCatalog,
  templateId: ChallengeId,
): readonly ApprovedVariant[] {
  return catalog.entries.filter((entry) => entry.templateId === templateId)
}

/**
 * Resolves an approved variant by address.
 *
 * Lookup is by semantic identity, never by position: an entry keeps meaning the
 * same thing when the artifact grows or is reordered.
 */
export function findApprovedVariant(
  catalog: ApprovedVariantCatalog,
  ref: ChallengeVariantRef,
): ApprovedVariant | undefined {
  return catalog.entries.find(
    (entry) =>
      entry.familyId === ref.familyId &&
      entry.templateId === ref.templateId &&
      entry.variantId === ref.variantId,
  )
}

export interface CatalogIntegrityOptions {
  /** The content version the catalog must have been built against. */
  readonly contentVersion: string
}

/**
 * Re-derives everything the catalog claims and reports every disagreement.
 *
 * This is the check that makes a committed artifact worth committing: it fails
 * when a generator changed without a version bump, when a template disappeared,
 * when an address stopped being valid, and when two entries turn out to be the
 * same problem.
 */
export function verifyCatalogIntegrity(
  contentCatalog: ContentCatalog,
  catalog: ApprovedVariantCatalog,
  options: CatalogIntegrityOptions,
): readonly ValidationIssue[] {
  const issues: ValidationIssue[] = []

  if (catalog.contentVersion !== options.contentVersion) {
    issues.push(
      contentError(
        'catalog.content-version',
        catalog.catalogVersion,
        `catalog was built for content ${catalog.contentVersion} but the content set is ${options.contentVersion}`,
      ),
    )
  }

  if (catalog.catalogVersion.trim().length === 0) {
    issues.push(
      contentError(
        'catalog.missing-version',
        'catalog',
        'a catalog must declare a stable version',
      ),
    )
  }

  for (const record of catalog.generators) {
    const template = contentCatalog.template(record.templateId)
    if (template === undefined) {
      issues.push(
        contentError(
          'catalog.unknown-template',
          record.templateId,
          'the catalog records a generator for a template that no longer exists',
        ),
      )
      continue
    }

    const source = template.variantSource
    if (
      source.generatorId !== record.generatorId ||
      source.generatorVersion !== record.generatorVersion ||
      source.candidateSpace !== record.candidateSpace
    ) {
      issues.push(
        contentError(
          'catalog.generator-drift',
          record.templateId,
          `catalog records ${record.generatorId}@${record.generatorVersion} over ${String(record.candidateSpace)} candidates; the code declares ${String(source.generatorId)}@${String(source.generatorVersion)} over ${String(source.candidateSpace)}`,
        ),
      )
    }
  }

  const seenAddresses = new Set<string>()
  const fingerprintOwners = new Map<string, string>()

  for (const entry of catalog.entries) {
    const address = addressOf(entry)

    if (seenAddresses.has(address)) {
      issues.push(
        contentError('catalog.duplicate-address', address, 'listed twice'),
      )
      continue
    }
    seenAddresses.add(address)

    const template = contentCatalog.template(entry.templateId)
    if (template === undefined) {
      issues.push(
        contentError(
          'catalog.unknown-template',
          address,
          `no template ${entry.templateId} in the content catalog`,
        ),
      )
      continue
    }
    if (template.family !== entry.familyId) {
      issues.push(
        contentError(
          'catalog.family-mismatch',
          address,
          `template belongs to ${template.family}`,
        ),
      )
      continue
    }
    if (!template.variantSource.accepts(entry.variantId)) {
      issues.push(
        contentError(
          'catalog.address-not-accepted',
          address,
          'the template no longer accepts this variant address',
        ),
      )
      continue
    }

    const expectedSource: VariantSourceKind =
      template.variantSource.authoredIds.includes(entry.variantId)
        ? 'authored'
        : 'generated'
    if (entry.source !== expectedSource) {
      issues.push(
        contentError(
          'catalog.source-mismatch',
          address,
          `recorded as ${entry.source} but the address is ${expectedSource}`,
        ),
      )
    }

    const recomputed = variantFingerprint(contentCatalog, entry)
    if (recomputed !== entry.fingerprint) {
      issues.push(
        contentError(
          'catalog.fingerprint-mismatch',
          address,
          `recorded ${entry.fingerprint.slice(0, 16)}… but the content now hashes to ${String(recomputed).slice(0, 16)}…`,
        ),
      )
      continue
    }

    const owner = fingerprintOwners.get(entry.fingerprint)
    if (owner !== undefined) {
      issues.push(
        contentError(
          'catalog.duplicate-fingerprint',
          address,
          `is the same problem as ${owner}`,
        ),
      )
      continue
    }
    fingerprintOwners.set(entry.fingerprint, address)
  }

  return issues
}
