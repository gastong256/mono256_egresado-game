/**
 * Recovery: what happens when an ordinary beat goes badly.
 *
 * The product rule Teacher Gate 1 accepted is short and absolute: **every valid
 * completed run reaches graduation**. The player is not finding out *whether*
 * they graduate. They are finding out *how*.
 *
 * That rule only means something if a poor result still costs something, so this
 * module is the other half: a low-quality ordinary beat creates an **obligation**
 * — something the year has to close before it can end — and closing it is a
 * remediation beat, not a retry.
 *
 * ## Why it cannot loop
 *
 * Two structural facts, neither of them configurable:
 *
 * 1. **Only ordinary beats create obligations.** A remediation beat is not
 *    ordinary, so it cannot create one. There is no rule to get wrong and no
 *    flag to set incorrectly: the recursion is unrepresentable.
 * 2. **A remediation beat always resolves the obligations it addresses**,
 *    however it goes. How well it went changes the career and the story — a
 *    year closed *con lo justo* leaves a `previa`, which later content can call
 *    back to — but never whether the year closes.
 *
 * So the worst case is one remediation beat per stage, and a run can never need
 * a second one to fix the first. That bound is what makes «every valid run
 * graduates» a fact about the state machine rather than a hope about the player.
 *
 * ## What it is not
 *
 * Not lives, not hearts, not three strikes, not retry-until-correct. A mistake
 * buys *more* game, not less, and the consequence travels with the player
 * instead of ending them.
 */

import type { ChallengeVariantRef } from '../challenges/content-model'
import { formatVariantAddress } from '../challenges/content-model'
import type { SolutionQuality } from '../challenges/taxonomy'
import { SOLUTION_QUALITIES } from '../challenges/taxonomy'
import type { StageId } from './stages'
import { stageIndex } from './stages'

/**
 * Why a beat left something to close.
 *
 * Coarse on purpose. A finer taxonomy would need evidence the evaluators do not
 * produce, and inventing it would make the remediation *look* diagnostic without
 * being it.
 */
export const RECOVERY_REASONS = [
  /** The answer did not satisfy the situation's own constraints. */
  'unresolved',
  /** It worked, but far enough from the intent that the concept is worth revisiting. */
  'partial',
] as const

export type RecoveryReason = (typeof RECOVERY_REASONS)[number]

/**
 * Structural recovery bound.
 *
 * This is deliberately not policy calibration: one compressed remediation beat
 * closes every obligation a stage owes. Making the bound configurable would
 * contradict the state-machine proof that a stage can recover at most once.
 */
export const MAX_RECOVERIES_PER_STAGE = 1 as const

/**
 * Something a year has to close before it can end.
 *
 * Addressed semantically — stage, the beat that produced it, the content it came
 * from — and never by position in an array. A replay rebuilds obligations in the
 * same order because the order is a property of the run, not of how a list
 * happened to be appended to.
 */
export interface RecoveryObligation {
  /** `stage/eventIndex/family/template/variant`. Stable across replays. */
  readonly id: string
  readonly stageId: StageId
  /** Global event index of the ordinary beat that produced it. */
  readonly sourceEventIndex: number
  readonly source: ChallengeVariantRef
  readonly reason: RecoveryReason
  /** The result that triggered it. Kept so history can explain itself. */
  readonly quality: SolutionQuality
}

/** How a year's obligations were closed, and how well. */
export interface RecoveryRecord {
  readonly stageId: StageId
  /** Every obligation this remediation beat closed, in canonical order. */
  readonly resolved: readonly string[]
  /** Content the remediation played, when it played any. */
  readonly content: ChallengeVariantRef | undefined
  readonly quality: SolutionQuality
  /**
   * True when the remediation itself went badly.
   *
   * The year still closes — that is the whole point — but it closes owing
   * something, and that is what later content can call back to. It is hidden
   * career history, never a fifth bar in the HUD.
   */
  readonly previa: boolean
}

/**
 * Everything progression needs to know beyond where the run is standing.
 *
 * `pending` never survives its own stage: a year cannot end while it still owes
 * something, so by the time the next year opens the list is empty again. That is
 * the invariant graduation rests on, and it is enforced by the transition rather
 * than trusted.
 */
export interface ProgressionState {
  readonly pending: readonly RecoveryObligation[]
  readonly history: readonly RecoveryRecord[]
  /**
   * True once the final stage closed with nothing pending.
   *
   * Terminal. No command moves a run out of it.
   */
  readonly graduated: boolean
}

export function emptyProgression(): ProgressionState {
  return { pending: [], history: [], graduated: false }
}

export interface RecoveryPolicy {
  readonly id: string
  readonly version: string
  /** False until a Teacher Gate approves the wording and the triggers. */
  readonly official: boolean
  /**
   * Results that leave something to close.
   *
   * Configuration rather than a condition scattered through challenge code, so
   * that «which results need review» is one decision in one place, and a Gate
   * can move it without anybody editing the engine.
   */
  readonly triggers: Readonly<Record<SolutionQuality, RecoveryReason | 'none'>>
  /**
   * Remediation beats a single stage may play.
   *
   * One. A year closes its own obligations in one compressed beat, which is what
   * keeps a six-year career from doubling in length because somebody had a bad
   * day. The field exists so the number is inspectable and testable, not so it
   * can grow.
   */
  readonly maxRecoveriesPerStage: typeof MAX_RECOVERIES_PER_STAGE
}

/**
 * The development recovery policy.
 *
 * `invalid` leaves something to close: the situation was not resolved, and
 * moving on as if it had been is what a fail-forward design is accused of.
 * `functional` does not: it worked, and the design already charges for it in
 * the score and the career. Both are candidates — TG1-14 accepted guaranteed
 * graduation but supplied no vocabulary and no trigger rule, so the wording and
 * the thresholds stay open.
 */
export const developmentRecoveryPolicy: RecoveryPolicy = {
  id: 'recovery-dev-1',
  version: '1.0.0-candidate',
  official: false,
  triggers: {
    invalid: 'unresolved',
    functional: 'none',
    efficient: 'none',
    optimal: 'none',
  },
  maxRecoveriesPerStage: 1,
}

/** Structural problems that would let a run stop converging. */
export function recoveryPolicyIssues(
  policy: RecoveryPolicy,
): readonly string[] {
  const issues: string[] = []

  if (policy.id.trim() === '' || policy.version.trim() === '') {
    issues.push('a recovery policy must be identified and versioned')
  }
  if (policy.maxRecoveriesPerStage !== MAX_RECOVERIES_PER_STAGE) {
    issues.push(
      `a recovery policy must declare exactly one remediation beat per stage; received ${String(policy.maxRecoveriesPerStage)}`,
    )
  }
  if (
    SOLUTION_QUALITIES.every((quality) => policy.triggers[quality] === 'none')
  ) {
    issues.push(
      'no result triggers remediation; the policy would make recovery unreachable',
    )
  }
  // If the best possible result needed remediation, remediation would not be
  // remediation.
  if (policy.triggers.optimal !== 'none') {
    issues.push('an optimal result cannot require remediation')
  }

  return issues
}

/** Semantic identity of an obligation. Never a position in a list. */
export function obligationId(
  stageId: StageId,
  eventIndex: number,
  source: ChallengeVariantRef,
): string {
  return `${stageId}/${String(eventIndex)}/${formatVariantAddress(source)}`
}

/**
 * What an ordinary result leaves to close, if anything.
 *
 * Takes the result, not the challenge: progression asks «what does this outcome
 * mean for the year», and a rule that had to know which template produced it
 * would be a rule every future template had to be added to.
 */
export function obligationFor(
  policy: RecoveryPolicy,
  stageId: StageId,
  eventIndex: number,
  source: ChallengeVariantRef,
  quality: SolutionQuality,
): RecoveryObligation | undefined {
  const reason = policy.triggers[quality]
  if (reason === 'none') {
    return undefined
  }

  return {
    id: obligationId(stageId, eventIndex, source),
    stageId,
    sourceEventIndex: eventIndex,
    source,
    reason,
    quality,
  }
}

/**
 * Canonical order of pending obligations.
 *
 * School order, then the order the beats were played, then the address. Three
 * total keys, so two obligations can never tie and the queue never depends on
 * the order a map happened to be built in.
 */
export function orderObligations(
  obligations: readonly RecoveryObligation[],
): readonly RecoveryObligation[] {
  return [...obligations].sort((left, right) => {
    const byStage = stageIndex(left.stageId) - stageIndex(right.stageId)
    if (byStage !== 0) {
      return byStage
    }
    const byEvent = left.sourceEventIndex - right.sourceEventIndex
    if (byEvent !== 0) {
      return byEvent
    }
    return left.id < right.id ? -1 : left.id > right.id ? 1 : 0
  })
}

/** Obligations a given stage still owes, in canonical order. */
export function pendingForStage(
  progression: ProgressionState,
  stageId: StageId,
): readonly RecoveryObligation[] {
  return orderObligations(
    progression.pending.filter((entry) => entry.stageId === stageId),
  )
}

/** How many remediation beats a stage has already played. */
export function recoveriesPlayedInStage(
  progression: ProgressionState,
  stageId: StageId,
): number {
  return progression.history.filter((entry) => entry.stageId === stageId).length
}

/**
 * Does this stage owe a remediation beat right now?
 *
 * Both halves matter. Without the first the year would never close what it owes;
 * without the second a year could remediate forever, which is the failure this
 * whole module is shaped to make impossible.
 */
export function owesRecovery(
  progression: ProgressionState,
  stageId: StageId,
): boolean {
  return (
    pendingForStage(progression, stageId).length > 0 &&
    recoveriesPlayedInStage(progression, stageId) < MAX_RECOVERIES_PER_STAGE
  )
}

/** Records an obligation, ignoring one that is already pending. */
export function withObligation(
  progression: ProgressionState,
  obligation: RecoveryObligation,
): ProgressionState {
  if (progression.pending.some((entry) => entry.id === obligation.id)) {
    return progression
  }
  return {
    ...progression,
    pending: orderObligations([...progression.pending, obligation]),
  }
}

/**
 * Closes every obligation a stage owed, with the remediation's own result.
 *
 * All of them, in one beat. Closing them one at a time would make a bad year
 * cost as many extra beats as it had mistakes, and a career is six years long.
 */
export function withRecovery(
  progression: ProgressionState,
  stageId: StageId,
  content: ChallengeVariantRef | undefined,
  quality: SolutionQuality,
  policy: RecoveryPolicy,
): ProgressionState {
  const closing = pendingForStage(progression, stageId)
  if (closing.length === 0) {
    return progression
  }

  const record: RecoveryRecord = {
    stageId,
    resolved: closing.map((entry) => entry.id),
    content,
    quality,
    // The year closes either way. Closing it badly is what leaves a `previa`:
    // hidden history a later year can call back to, never a blocker.
    previa: policy.triggers[quality] !== 'none',
  }

  return {
    ...progression,
    pending: progression.pending.filter((entry) => entry.stageId !== stageId),
    history: [...progression.history, record],
  }
}

/** Marks the run graduated. Terminal, and refused if anything is still owed. */
export function withGraduation(
  progression: ProgressionState,
): ProgressionState {
  if (progression.graduated || progression.pending.length > 0) {
    return progression
  }
  return { ...progression, graduated: true }
}

/** Years the run closed owing something. Hidden career history. */
export function previasOf(progression: ProgressionState): number {
  return progression.history.filter((entry) => entry.previa).length
}

/**
 * Structural problems in a progression state.
 *
 * Checked where a state crosses a boundary, because the states that must not
 * exist — graduated while still owing, a year remediating twice — are exactly
 * the ones a corrupted snapshot would present as ordinary.
 */
export function progressionIssues(
  progression: ProgressionState,
): readonly string[] {
  const issues: string[] = []

  if (progression.graduated && progression.pending.length > 0) {
    issues.push(
      `the run is graduated with ${String(progression.pending.length)} obligations still open`,
    )
  }

  const seen = new Set<string>()
  for (const obligation of progression.pending) {
    if (seen.has(obligation.id)) {
      issues.push(`obligation ${obligation.id} is pending twice`)
    }
    seen.add(obligation.id)
  }

  const closed = new Set<string>()
  const perStage = new Map<StageId, number>()
  for (const record of progression.history) {
    perStage.set(record.stageId, (perStage.get(record.stageId) ?? 0) + 1)
    for (const id of record.resolved) {
      if (closed.has(id)) {
        issues.push(`obligation ${id} was resolved twice`)
      }
      closed.add(id)
      if (seen.has(id)) {
        issues.push(`obligation ${id} is both pending and resolved`)
      }
    }
    if (record.resolved.length === 0) {
      issues.push(
        `a remediation beat in ${record.stageId} resolved nothing, so it had no reason to be played`,
      )
    }
  }

  for (const [stageId, count] of perStage) {
    if (count > MAX_RECOVERIES_PER_STAGE) {
      issues.push(
        `${stageId} played ${String(count)} remediation beats and the structural bound allows ${String(MAX_RECOVERIES_PER_STAGE)}`,
      )
    }
  }

  return issues
}
