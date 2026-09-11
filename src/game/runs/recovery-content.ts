/**
 * Recovery content: what a content set declares so a year can close what it
 * owes.
 *
 * The engine knows no content id (ADR-024 §8). A content set routes each
 * ordinary template to the reviews that isolate its concept — or leaves it out,
 * which is the written decision `none` — frames the remediation beat with a
 * storylet and, whenever a year may owe concepts that one review cannot
 * practise together, authors the debrief that single review shows for the rest
 * (ADR-025).
 *
 * Everything here is pure over declared data. It is checked before a run starts
 * and again at the edge of the beat, so a gap in the declaration is refused
 * explicitly instead of closing a year with a concept nobody explained.
 */

import { err, ok, type Result } from '../core/result'
import {
  toChallengeId,
  type ChallengeId,
  type StoryletId,
} from '../core/branded'
import type { ContentCatalog } from '../challenges/content-catalog'
import type { ChallengeDefinition, RecoveryNote } from '../challenges/contracts'
import {
  isEligibleForStage,
  isOrdinaryBeatRole,
} from '../challenges/content-model'
import type { ApprovedVariantLookup } from '../challenges/variant-source'
import type { Storylet } from '../narrative/storylet'
import {
  recoveryCoverage,
  type RecoveryObligation,
} from '../progression/recovery'
import type { StageId } from '../progression/stages'

/** Authored explanation of one concept a year can owe. */
export interface RecoveryDebrief {
  readonly title: string
  readonly text: string
}

/** How a content set answers a year that owes something. */
export interface RecoveryContent {
  /** Storylet used to frame the remediation beat. */
  readonly storyletId: StoryletId
  /** A year with its own words for the beat. Falls back to `storyletId`. */
  readonly storyletByStage?: Readonly<Partial<Record<StageId, StoryletId>>>
  /**
   * Debriefs, keyed by the ordinary template whose failure they explain.
   *
   * Once a content set declares them, every recovery-capable template needs
   * one: the single review names what it practises and explains what it does
   * not. A content set without them is declaring that, in every year, one
   * review always practises everything the year can owe — and that claim is
   * checked, not trusted.
   */
  readonly debriefs?: Readonly<Record<string, RecoveryDebrief>>
  /**
   * Which template reviews which, in authored preference order.
   *
   * Keyed by the **ordinary** template whose failure is being remediated, so
   * `none` is a real per-template decision: a template absent from this map
   * leaves nothing to close, and its bad result simply stands. That is the
   * honest answer for a template with no isolable intermediate step — handing
   * the player a review of some *other* situation would be worse content than
   * no review at all.
   *
   * Every value must carry the `recovery` placement role: remediation content
   * is never part of ordinary selection and never spends an ordinary slot.
   */
  readonly reviews: Readonly<Record<string, readonly ChallengeId[]>>
}

/**
 * The recovery templates a content set declares for one ordinary template.
 *
 * An empty list is the answer for a template whose author decided it has no
 * honest review, and it is what keeps `none` a real decision rather than a
 * silent fallback to whatever else the year happens to carry.
 */
export function reviewsFor(
  config: RecoveryContent,
  templateId: string,
): readonly ChallengeId[] {
  return config.reviews[templateId] ?? []
}

/** The storylet that frames a stage's remediation beat. */
export function recoveryFrameFor(
  config: RecoveryContent,
  stageId: StageId,
): StoryletId {
  return config.storyletByStage?.[stageId] ?? config.storyletId
}

/**
 * The review a failed template gets in a given stage: the first declared one
 * that really is recovery content and may be played there.
 */
export function reviewTemplateFor(
  config: RecoveryContent,
  catalog: ContentCatalog,
  sourceTemplateId: string,
  stageId: StageId,
): ChallengeDefinition | undefined {
  return reviewsFor(config, sourceTemplateId)
    .map((templateId) => catalog.template(templateId))
    .find(
      (template) =>
        template !== undefined &&
        template.placement === 'recovery' &&
        isEligibleForStage(template, stageId),
    )
}

/** What the single remediation beat says about each obligation it closes. */
export interface RecoveryNotes {
  /** Practised by the review being played. Never empty while it is played. */
  readonly practised: readonly RecoveryNote[]
  /** Closed by the same beat with authored text, not practised elsewhere. */
  readonly debriefed: readonly RecoveryNote[]
}

/**
 * The notes a remediation beat presents, derived from what the year owes.
 *
 * `undefined` when the content set authored no debriefs and needs none. The
 * error lists the obligations that would close without practice and without
 * explanation, which the transition refuses rather than hides.
 */
export function recoveryNotes(
  config: RecoveryContent,
  pending: readonly RecoveryObligation[],
  reviewTemplateId: string,
): Result<RecoveryNotes | undefined, readonly string[]> {
  const coverage = recoveryCoverage(pending, reviewTemplateId, (id) =>
    reviewsFor(config, id),
  )
  const debriefs = config.debriefs
  if (debriefs === undefined) {
    return coverage.debriefed.length === 0
      ? ok(undefined)
      : err(coverage.debriefed.map((obligation) => obligation.id))
  }

  const notes: RecoveryNote[] = []
  const missing: string[] = []
  for (const obligation of [...coverage.practised, ...coverage.debriefed]) {
    const debrief = debriefs[obligation.source.templateId]
    if (debrief === undefined) {
      missing.push(obligation.id)
      continue
    }
    notes.push({
      obligationId: obligation.id,
      sourceTemplateId: obligation.source.templateId,
      title: debrief.title,
      text: debrief.text,
    })
  }
  if (missing.length > 0) {
    return err(missing)
  }

  const practisedIds = new Set(coverage.practised.map((entry) => entry.id))
  return ok({
    practised: notes.filter((note) => practisedIds.has(note.obligationId)),
    debriefed: notes.filter((note) => !practisedIds.has(note.obligationId)),
  })
}

export interface RecoveryContentCheck {
  readonly recoveryContent: RecoveryContent
  readonly catalog: ContentCatalog
  readonly storylets: readonly Storylet[]
  /** Stages the ruleset actually plays. */
  readonly stages: readonly StageId[]
  readonly approvedVariants?: ApprovedVariantLookup
}

/**
 * Everything that would make a year owe something it cannot close.
 *
 * Checked before a run starts, so the approved-only rule and the debrief rule
 * fail at creation instead of in the middle of a year. The transition keeps its
 * own check at the edge of the beat as the second line.
 */
export function recoveryContentIssues(
  input: RecoveryContentCheck,
): readonly string[] {
  const issues = new Set<string>()
  const { recoveryContent: config, catalog } = input

  for (const [sourceId, reviewIds] of Object.entries(config.reviews)) {
    const source = catalog.template(toChallengeId(sourceId))
    if (source === undefined) {
      issues.add(`recovery source ${sourceId} is not in the catalog`)
      continue
    }
    if (!isOrdinaryBeatRole(source.placement)) {
      issues.add(`recovery source ${sourceId} is not ordinary content`)
    }
    if (reviewIds.length === 0) {
      issues.add(`${sourceId} declares an empty review list; omit it for none`)
    }
    for (const reviewId of reviewIds) {
      const review = catalog.template(reviewId)
      if (review === undefined) {
        issues.add(`review ${reviewId} for ${sourceId} is not in the catalog`)
      } else if (review.placement !== 'recovery') {
        issues.add(`review ${reviewId} does not carry the recovery role`)
      }
    }
  }

  for (const stageId of input.stages) {
    const sources = Object.keys(config.reviews)
      .map((id) => catalog.template(toChallengeId(id)))
      .filter(
        (template): template is ChallengeDefinition =>
          template !== undefined && isEligibleForStage(template, stageId),
      )
    if (sources.length === 0) {
      continue
    }

    const frameId = recoveryFrameFor(config, stageId)
    const frame = input.storylets.find((storylet) => storylet.id === frameId)
    if (frame === undefined || !frame.stages.includes(stageId)) {
      issues.add(`${stageId} can owe a review and has no frame storylet`)
    }

    const routes = new Set<string>()
    for (const source of sources) {
      const review = reviewTemplateFor(config, catalog, source.id, stageId)
      if (review === undefined) {
        issues.add(
          `${source.id} can leave ${stageId} owing and no declared review is eligible there`,
        )
        continue
      }
      routes.add(review.id)
      if (
        input.approvedVariants !== undefined &&
        input.approvedVariants.variantsFor(review.id).length === 0
      ) {
        issues.add(`no approved variants for review ${review.id}`)
      }
      if (config.debriefs !== undefined && !(source.id in config.debriefs)) {
        issues.add(`missing debrief for ${source.id}`)
      }
    }
    if (routes.size > 1 && config.debriefs === undefined) {
      issues.add(
        `${stageId} can owe concepts practised by different reviews and no debrief explains the ones a single review leaves out`,
      )
    }
  }

  return [...issues]
}
