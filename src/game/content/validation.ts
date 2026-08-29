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
import type { ContentCatalog } from '../challenges/content-catalog'
import type { DifficultyLevel } from '../challenges/taxonomy'
import {
  validateCondition,
  type StoryletCondition,
} from '../narrative/conditions'
import { validateEffect } from '../narrative/effects'
import type { Storylet } from '../narrative/storylet'
import { createRng } from '../random/rng'
import { createVariantRng } from '../challenges/content-model'
import { variantRefOf } from '../challenges/contracts'
import type { StageConfig, StageId } from '../progression/stages'
import type { Ruleset } from '../ruleset/ruleset'
import { toChallengeInstanceId } from '../core/branded'
import {
  contentError,
  contentWarning,
  hasNoErrors,
  type ValidationIssue,
} from '../core/issues'

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
  readonly catalog: ContentCatalog
  readonly storylets: readonly Storylet[]
  /** Seeds generated per challenge definition per difficulty. */
  readonly seedsPerChallenge?: number
}

const error = contentError
const warning = contentWarning

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
      const definition = input.catalog.template(challengeId)
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

    // A stage that offers challenges but no primary beat cannot form a valid
    // plan later. It is a warning rather than an error because a purely
    // narrative stage legitimately offers nothing at all.
    const eligible = input.catalog.forStage(stage.id)
    if (
      eligible.length > 0 &&
      !eligible.some((template) => template.placement === 'anchor')
    ) {
      issues.push(
        warning(
          'stage.no-anchor',
          stage.id,
          'stage has eligible templates but none can act as its anchor beat',
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
  }

  // Hall's condition proves a valid assignment *exists*. Selection, however, is
  // greedy: it picks one eligible storylet per event with no lookahead. Whether
  // that can dead-end is answered by walking the stage forward.
  issues.push(...walkStageReachability(input, stages))

  return issues
}

/**
 * Three-valued condition evaluation.
 *
 * Content validation knows the stage and which storylets have been seen, but
 * not the stats, flags or answer qualities a particular playthrough will
 * produce. A condition that depends on those is genuinely undecidable here, and
 * saying so is more useful than guessing.
 */
type Decision = true | false | 'unknown'

function decide(
  condition: StoryletCondition,
  stage: StageId,
  seen: ReadonlySet<string>,
): Decision {
  switch (condition.kind) {
    case 'always':
      return true
    case 'stage-in':
      return condition.stages.includes(stage)
    case 'storylet-seen':
      return seen.has(condition.storyletId)
    case 'storylet-not-seen':
      return !seen.has(condition.storyletId)
    case 'all': {
      let result: Decision = true
      for (const child of condition.conditions) {
        const value = decide(child, stage, seen)
        if (value === false) {
          return false
        }
        if (value === 'unknown') {
          result = 'unknown'
        }
      }
      return result
    }
    case 'any': {
      let result: Decision = false
      for (const child of condition.conditions) {
        const value = decide(child, stage, seen)
        if (value === true) {
          return true
        }
        if (value === 'unknown') {
          result = 'unknown'
        }
      }
      return result
    }
    case 'not': {
      const value = decide(condition.condition, stage, seen)
      return value === 'unknown' ? 'unknown' : !value
    }
    default:
      // Stats, flags and recent quality depend on how the run was played.
      return 'unknown'
  }
}

/** Caps the branch search so a large content set cannot make validation blow up. */
const MAX_REACHABILITY_BRANCHES = 64

/**
 * Walks each stage forward and proves it can always serve another event.
 *
 * The safety requirement is that at every step at least one storylet is
 * *decidably* eligible — eligible no matter how the run has gone so far. A
 * storylet whose condition depends on performance may or may not fire, so it can
 * never be the thing that guarantees the stage keeps going.
 *
 * Where such a storylet *might* fire, the walk follows both outcomes: taking it
 * and not taking it lead to different seen-sets, and both have to stay safe.
 * That is what lets an authored arc branch on how well the player did while
 * still being provably dead-end free.
 */
function walkStageReachability(
  input: ContentValidationInput,
  stages: readonly StageConfig[],
): readonly ValidationIssue[] {
  const issues: ValidationIssue[] = []
  const { allowRepeats, cooldownEvents } = input.ruleset.narrative

  for (const [stageIndex, stage] of stages.entries()) {
    // Worst case, every storylet an earlier stage could have used is gone.
    const earlier = new Set(
      stages.slice(0, stageIndex).map((previous) => previous.id),
    )
    const consumedByEarlierStages = allowRepeats
      ? []
      : input.storylets
          .filter((storylet) =>
            storylet.stages.some((candidate) => earlier.has(candidate)),
          )
          .map((storylet) => storylet.id)

    let frontier: ReadonlySet<string>[] = [
      new Set<string>(consumedByEarlierStages),
    ]

    for (let event = 0; event < stage.eventCount; event += 1) {
      const next: ReadonlySet<string>[] = []

      for (const seen of frontier) {
        const available = input.storylets.filter(
          (storylet) =>
            storylet.stages.includes(stage.id) &&
            storylet.weight > 0 &&
            (allowRepeats ? cooldownEvents <= event : !seen.has(storylet.id)),
        )

        const decisions = available.map((storylet) => ({
          storylet,
          decision: decide(storylet.requires, stage.id, seen),
        }))
        const guaranteed = decisions.filter((entry) => entry.decision === true)

        if (guaranteed.length === 0) {
          issues.push(
            error(
              'stage.greedy-unreachable',
              stage.id,
              `at event ${String(event)} no storylet is eligible regardless of how the run was played, so a run can exhaust the pool`,
            ),
          )
          frontier = []
          break
        }

        // The engine takes the highest priority tier among everything eligible,
        // so a conditional storylet above the guaranteed one is a real branch.
        const guaranteedTop = Math.max(
          ...guaranteed.map((entry) => entry.storylet.priority),
        )
        const candidates = decisions.filter(
          (entry) =>
            entry.decision !== false &&
            entry.storylet.priority >= guaranteedTop,
        )

        for (const candidate of candidates) {
          const advanced = new Set(seen)
          advanced.add(candidate.storylet.id)
          next.push(advanced)
        }
      }

      if (frontier.length === 0) {
        break
      }

      if (next.length > MAX_REACHABILITY_BRANCHES) {
        issues.push(
          warning(
            'stage.reachability-truncated',
            stage.id,
            `the branch search exceeded ${String(MAX_REACHABILITY_BRANCHES)} states at event ${String(event)}; reachability was only checked up to that point`,
          ),
        )
        frontier = next.slice(0, MAX_REACHABILITY_BRANCHES)
        continue
      }

      frontier = next
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

  for (const definition of input.catalog.templates) {
    let failures = 0
    const presentations = new Set<string>()
    const optionCounts: Record<string, number> = {}
    let checked = 0

    for (const stage of definition.stages) {
      for (const variantId of definition.variants) {
        for (let index = 0; index < seeds; index += 1) {
          const seed = toRunSeed(
            `validate-${definition.id}-${stage}-${variantId}-${String(index)}`,
          )
          const difficulty: DifficultyLevel = definition.baseDifficulty
          const ref = {
            instanceId: toChallengeInstanceId(
              `${stage}:${String(index)}:${definition.id}`,
            ),
            familyId: definition.family,
            templateId: definition.id,
            variantId,
            stageId: stage,
            eventIndex: index,
            difficulty,
          }
          const materialized = definition.materialize(ref, {
            rng: createRng(seed, ['validate']),
            difficulty,
            variantId,
            variantRng: createVariantRng(variantRefOf(ref)),
          })

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
    }

    // A template must produce at least as many distinct instances as it
    // declares variants. Fewer means two variants render identically, which is
    // a defect: the address says they are different cases and the player sees
    // the same screen. Authored content legitimately stops there; a procedural
    // template will produce many more.
    if (checked > 1 && presentations.size < definition.variants.length) {
      issues.push(
        error(
          'challenge.variant-collision',
          definition.id,
          `declares ${String(definition.variants.length)} variants but produced ${String(presentations.size)} distinct instances across ${String(checked)} generations`,
        ),
      )
    }

    if (checked > 1 && presentations.size < 2) {
      issues.push(
        warning(
          'challenge.no-variety',
          definition.id,
          `every seed produces the same instance across ${String(checked)} generations`,
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
    ok: hasNoErrors(issues),
  }
}
