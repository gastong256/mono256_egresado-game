/**
 * Content validation.
 *
 * `content-validation.md` describes a pipeline that must catch a broken
 * challenge or an unreachable storylet before anyone plays it. This module
 * implements the two stages that can run without a human:
 *
 * - **static**: identifiers, references, weights, condition and effect trees,
 *   and whether every stage can actually fill its event budget;
 * - **procedural**: generate each challenge across many seeds and run its own
 *   invariants, collecting the distributions the document asks for.
 *
 * Editorial and playtest review remain human stages and are out of scope here.
 */

import { toRunSeed, type ChallengeId, type StoryletId } from '../core/branded'
import type { ChallengeRegistry } from '../challenges/registry'
import type { DifficultyLevel } from '../challenges/taxonomy'
import { validateCondition } from '../narrative/conditions'
import { validateEffect } from '../narrative/effects'
import type { Storylet } from '../narrative/storylet'
import { createRng } from '../random/rng'
import type { Ruleset } from '../ruleset/ruleset'
import { toChallengeInstanceId } from '../core/branded'

export type ValidationSeverity = 'error' | 'warning'

export interface ValidationIssue {
  readonly severity: ValidationSeverity
  /** Stable machine-readable code, useful for suppressions and tooling. */
  readonly code: string
  readonly subject: string
  readonly message: string
}

export interface ChallengeGenerationStats {
  readonly challengeId: ChallengeId
  readonly seedsChecked: number
  readonly failures: number
  /** Distinct presentations produced, a proxy for parameter variety. */
  readonly distinctPresentations: number
  /** Distribution of the option index a decision-style answer would pick. */
  readonly optionCounts: Readonly<Record<string, number>>
}

export interface ContentValidationReport {
  readonly issues: readonly ValidationIssue[]
  readonly generation: readonly ChallengeGenerationStats[]
  readonly ok: boolean
}

export interface ContentValidationInput {
  readonly ruleset: Ruleset
  readonly challenges: ChallengeRegistry
  readonly storylets: readonly Storylet[]
  /** Seeds generated per challenge definition per difficulty. */
  readonly seedsPerChallenge?: number
}

function error(
  code: string,
  subject: string,
  message: string,
): ValidationIssue {
  return { severity: 'error', code, subject, message }
}

function warning(
  code: string,
  subject: string,
  message: string,
): ValidationIssue {
  return { severity: 'warning', code, subject, message }
}

function validateStorylets(
  input: ContentValidationInput,
): readonly ValidationIssue[] {
  const issues: ValidationIssue[] = []
  const seen = new Set<StoryletId>()
  const knownIds = new Set(input.storylets.map((storylet) => storylet.id))
  const rulesetStages = new Set(input.ruleset.stages.map((stage) => stage.id))

  for (const storylet of input.storylets) {
    if (seen.has(storylet.id)) {
      issues.push(
        error('storylet.duplicate-id', storylet.id, 'duplicate storylet id'),
      )
    }
    seen.add(storylet.id)

    if (!Number.isSafeInteger(storylet.weight) || storylet.weight <= 0) {
      issues.push(
        error(
          'storylet.invalid-weight',
          storylet.id,
          `weight must be a positive integer, found ${String(storylet.weight)}`,
        ),
      )
    }

    if (storylet.stages.length === 0) {
      issues.push(
        error('storylet.no-stage', storylet.id, 'storylet declares no stage'),
      )
    }

    for (const stage of storylet.stages) {
      if (!rulesetStages.has(stage)) {
        issues.push(
          error(
            'storylet.unknown-stage',
            storylet.id,
            `stage ${stage} is not part of the ruleset`,
          ),
        )
      }
    }

    for (const challengeId of storylet.challengePool) {
      const definition = input.challenges.get(challengeId)
      if (definition === undefined) {
        issues.push(
          error(
            'storylet.unknown-challenge',
            storylet.id,
            `references unregistered challenge ${challengeId}`,
          ),
        )
        continue
      }

      // A challenge must be playable in every stage the storylet can appear in,
      // otherwise a run could present a 5.º año problem in 7.º grado.
      for (const stage of storylet.stages) {
        if (!definition.stages.includes(stage)) {
          issues.push(
            error(
              'storylet.challenge-stage-mismatch',
              storylet.id,
              `challenge ${challengeId} is not declared for stage ${stage}`,
            ),
          )
        }
      }
    }

    for (const followUp of storylet.followUps) {
      if (!knownIds.has(followUp)) {
        issues.push(
          error(
            'storylet.unknown-follow-up',
            storylet.id,
            `follow-up ${followUp} does not exist`,
          ),
        )
      }
    }

    issues.push(
      ...validateCondition(storylet.requires, `${storylet.id}.requires`).map(
        (message) => error('storylet.invalid-condition', storylet.id, message),
      ),
    )

    for (const [index, effect] of storylet.effects.entries()) {
      issues.push(
        ...validateEffect(
          effect,
          `${storylet.id}.effects[${String(index)}]`,
        ).map((message) =>
          error('storylet.invalid-effect', storylet.id, message),
        ),
      )
    }
  }

  return issues
}

/**
 * Checks the storylet pool can actually fill every stage's event budget.
 *
 * A per-stage count is not enough. When repeats are disabled and storylets span
 * several stages, an early stage can consume the only content a later stage had.
 * The exact criterion is Hall's condition on the bipartite graph of stage-slots
 * against storylets: for **every** subset of stages, the events those stages
 * play must not exceed the number of distinct storylets able to appear in them.
 *
 * Only unconditional storylets count towards the guarantee, because a
 * conditional one may legitimately never become eligible. Conditional coverage
 * is reported as a warning instead.
 *
 * The subset sweep is exponential, so it is applied only to rulesets small
 * enough for it to be free; larger ones fall back to the per-stage check.
 */
function validateStageCoverage(
  input: ContentValidationInput,
): readonly ValidationIssue[] {
  const issues: ValidationIssue[] = []
  const stages = input.ruleset.stages

  const guaranteed = input.storylets.filter(
    (storylet) => storylet.requires.kind === 'always',
  )

  for (const stage of stages) {
    const inStage = input.storylets.filter((storylet) =>
      storylet.stages.includes(stage.id),
    )
    if (inStage.length < stage.eventCount) {
      issues.push(
        error(
          'stage.insufficient-storylets',
          stage.id,
          `stage plays ${String(stage.eventCount)} events but only ${String(inStage.length)} storylets can appear`,
        ),
      )
    }
  }

  if (input.ruleset.narrative.allowRepeats) {
    // With repeats allowed a single storylet can cover a whole stage, so the
    // per-stage check above is already sufficient.
    return issues
  }

  if (stages.length > 12) {
    return issues
  }

  for (let mask = 1; mask < 1 << stages.length; mask += 1) {
    const subset = stages.filter((_, index) => (mask & (1 << index)) !== 0)
    const subsetIds = new Set(subset.map((stage) => stage.id))
    const required = subset.reduce(
      (total, stage) => total + stage.eventCount,
      0,
    )

    const availableAll = input.storylets.filter((storylet) =>
      storylet.stages.some((stage) => subsetIds.has(stage)),
    ).length
    const availableGuaranteed = guaranteed.filter((storylet) =>
      storylet.stages.some((stage) => subsetIds.has(stage)),
    ).length

    const label = subset.map((stage) => stage.id).join('+')

    if (availableAll < required) {
      issues.push(
        error(
          'stage.pool-exhausted',
          label,
          `stages ${label} need ${String(required)} events but share only ${String(availableAll)} storylets`,
        ),
      )
      continue
    }

    if (availableGuaranteed < required) {
      // A conditional storylet may never become eligible, so relying on one to
      // fill a slot is a real dead-end risk rather than a style problem.
      issues.push(
        error(
          'stage.unguaranteed-coverage',
          label,
          `stages ${label} need ${String(required)} events but only ${String(availableGuaranteed)} unconditional storylets can cover them`,
        ),
      )
    }
  }

  // Hall's condition proves a valid assignment *exists*. Selection, however, is
  // greedy: it picks one eligible storylet per event with no lookahead, so an
  // early stage can still consume the only content a later stage had. The
  // guarantee that no seed dead-ends therefore needs a stronger, sufficient
  // criterion: every stage must be able to fill its budget from storylets that
  // no earlier stage could possibly have taken.
  for (const [index, stage] of stages.entries()) {
    const earlier = new Set(
      stages.slice(0, index).map((previous) => previous.id),
    )
    const exclusive = guaranteed.filter(
      (storylet) =>
        storylet.stages.includes(stage.id) &&
        !storylet.stages.some((candidate) => earlier.has(candidate)),
    )

    if (exclusive.length < stage.eventCount) {
      issues.push(
        error(
          'stage.greedy-unreachable',
          stage.id,
          `stage plays ${String(stage.eventCount)} events but only ${String(exclusive.length)} unconditional storylets are unreachable by earlier stages, so a run can exhaust the pool`,
        ),
      )
    }
  }

  return issues
}

/** Presentation fingerprint, used to measure generated variety. */
function presentationKey(presentation: unknown): string {
  return JSON.stringify(presentation)
}

function runGeneration(input: ContentValidationInput): {
  readonly issues: readonly ValidationIssue[]
  readonly generation: readonly ChallengeGenerationStats[]
} {
  const seeds = input.seedsPerChallenge ?? 200
  const issues: ValidationIssue[] = []
  const generation: ChallengeGenerationStats[] = []

  for (const definition of input.challenges.definitions) {
    let failures = 0
    const presentations = new Set<string>()
    const optionCounts: Record<string, number> = {}
    let checked = 0

    for (const stage of definition.stages) {
      for (let index = 0; index < seeds; index += 1) {
        const seed = toRunSeed(
          `validate-${definition.id}-${stage}-${String(index)}`,
        )
        const difficulty: DifficultyLevel = definition.baseDifficulty
        const materialized = definition.materialize(
          {
            instanceId: toChallengeInstanceId(
              `${stage}:${String(index)}:${definition.id}`,
            ),
            definitionId: definition.id,
            stageId: stage,
            eventIndex: index,
            difficulty,
          },
          { rng: createRng(seed, ['validate']), difficulty },
        )

        checked += 1
        const problems = materialized.verify()

        if (problems.length > 0) {
          failures += 1
          // Only the first few are reported: a broken generator would otherwise
          // bury every other finding.
          if (failures <= 3) {
            issues.push(
              error(
                'challenge.invariant-violation',
                definition.id,
                `seed ${String(index)} in ${stage}: ${problems.join('; ')}`,
              ),
            )
          }
        }

        const presentation = materialized.present([])
        presentations.add(presentationKey(presentation))

        // Track which position an "obvious" answer would occupy so a content
        // set cannot systematically put the right answer first.
        if ('options' in presentation && presentation.options.length > 0) {
          const first = presentation.options[0]
          if (first !== undefined) {
            optionCounts[first.id] = (optionCounts[first.id] ?? 0) + 1
          }
        }
      }
    }

    if (checked > 0 && presentations.size < Math.max(2, checked / 20)) {
      issues.push(
        warning(
          'challenge.low-variety',
          definition.id,
          `only ${String(presentations.size)} distinct presentations across ${String(checked)} seeds`,
        ),
      )
    }

    generation.push({
      challengeId: definition.id,
      seedsChecked: checked,
      failures,
      distinctPresentations: presentations.size,
      optionCounts,
    })
  }

  return { issues, generation }
}

/** Runs the automated content pipeline. */
export function validateContent(
  input: ContentValidationInput,
): ContentValidationReport {
  const staticIssues = [
    ...validateStorylets(input),
    ...validateStageCoverage(input),
  ]
  const generated = runGeneration(input)
  const issues = [...staticIssues, ...generated.issues]

  return {
    issues,
    generation: generated.generation,
    ok: issues.every((issue) => issue.severity !== 'error'),
  }
}
