/**
 * Ruleset.
 *
 * A ruleset gathers the policies and configuration that decide how a run plays:
 * stage progression, scoring, difficulty, profile and narrative pacing. It is
 * versioned, and that version is recorded on every run so a result can always be
 * traced back to the rules that produced it.
 *
 * Only genuine game-design configuration belongs here. Engine constants that no
 * designer would ever tune stay in the modules that use them.
 *
 * A ruleset is *not* part of run state: it holds functions and is supplied as a
 * dependency, while the run stores only its version string.
 */

import type { ContentSetId, RulesetId } from '../core/branded'
import { err, ok, type Result } from '../core/result'
import type { EngineRejection } from '../core/errors'
import type { DifficultyPolicy } from '../difficulty/policy'
import type { ProfilePolicy } from '../profiles/policy'
import type { ScoringPolicy } from '../scoring/policy'
import {
  STAGE_ORDER,
  type StageConfig,
  type StageId,
} from '../progression/stages'

export interface NarrativePacing {
  /** Events that must pass before a storylet may repeat. */
  readonly cooldownEvents: number
  /** Whether a storylet may appear more than once in one run. */
  readonly allowRepeats: boolean
}

export interface Ruleset {
  readonly id: RulesetId
  readonly version: string
  readonly contentSetId: ContentSetId
  readonly contentVersion: string
  readonly stages: readonly StageConfig[]
  readonly scoring: ScoringPolicy
  readonly difficulty: DifficultyPolicy
  readonly profile: ProfilePolicy
  readonly narrative: NarrativePacing
  /**
   * True when this ruleset may produce official, ranked results.
   *
   * Building one requires every policy to be marked production, which is what
   * stops a development placeholder from ever scoring a real leaderboard.
   */
  readonly official: boolean
}

export function stageConfig(
  ruleset: Ruleset,
  stage: StageId,
): StageConfig | undefined {
  return ruleset.stages.find((config) => config.id === stage)
}

export function firstStage(ruleset: Ruleset): StageConfig | undefined {
  return ruleset.stages[0]
}

export function nextStageConfig(
  ruleset: Ruleset,
  stage: StageId,
): StageConfig | undefined {
  const index = ruleset.stages.findIndex((config) => config.id === stage)
  return index < 0 ? undefined : ruleset.stages[index + 1]
}

export interface RulesetInput {
  readonly id: RulesetId
  readonly version: string
  readonly contentSetId: ContentSetId
  readonly contentVersion: string
  readonly stages: readonly StageConfig[]
  readonly scoring: ScoringPolicy
  readonly difficulty: DifficultyPolicy
  readonly profile: ProfilePolicy
  readonly narrative: NarrativePacing
  /** Request an official ruleset; refused unless every policy is production. */
  readonly official?: boolean
}

/**
 * Validates and builds a ruleset.
 *
 * Requesting `official: true` with any development policy fails loudly. Open
 * questions 24 and 5 leave the official scoring and difficulty constants
 * undecided, so an official ruleset cannot be assembled yet — by design, rather
 * than by omission.
 */
export function createRuleset(
  input: RulesetInput,
): Result<Ruleset, EngineRejection> {
  if (input.stages.length === 0) {
    return err({
      kind: 'invalid-ruleset',
      detail: 'a ruleset needs at least one stage',
    })
  }

  const seen = new Set<StageId>()
  let previousIndex = -1

  for (const stage of input.stages) {
    if (seen.has(stage.id)) {
      return err({
        kind: 'invalid-ruleset',
        detail: `stage ${stage.id} is declared twice`,
      })
    }
    seen.add(stage.id)

    const canonicalIndex = STAGE_ORDER.indexOf(stage.id)
    if (canonicalIndex <= previousIndex) {
      return err({
        kind: 'invalid-ruleset',
        detail: `stage ${stage.id} breaks the canonical school order`,
      })
    }
    previousIndex = canonicalIndex

    if (stage.eventCount <= 0) {
      return err({
        kind: 'invalid-ruleset',
        detail: `stage ${stage.id} must play at least one event`,
      })
    }
    if (stage.categories.length === 0) {
      return err({
        kind: 'invalid-ruleset',
        detail: `stage ${stage.id} enables no mathematical categories`,
      })
    }
  }

  if (input.narrative.cooldownEvents < 0) {
    return err({
      kind: 'invalid-ruleset',
      detail: 'storylet cooldown cannot be negative',
    })
  }

  const official = input.official ?? false
  if (official) {
    const development = [
      input.scoring.production
        ? undefined
        : `scoring policy ${input.scoring.id}`,
      input.difficulty.production
        ? undefined
        : `difficulty policy ${input.difficulty.id}`,
      input.profile.production
        ? undefined
        : `profile policy ${input.profile.id}`,
    ].filter((entry): entry is string => entry !== undefined)

    if (development.length > 0) {
      return err({
        kind: 'invalid-ruleset',
        detail: `an official ruleset cannot use development policies: ${development.join(', ')}`,
      })
    }
  }

  return ok({
    id: input.id,
    version: input.version,
    contentSetId: input.contentSetId,
    contentVersion: input.contentVersion,
    stages: input.stages,
    scoring: input.scoring,
    difficulty: input.difficulty,
    profile: input.profile,
    narrative: input.narrative,
    official,
  })
}
