/**
 * A playable six-stage career, for proving progression is generic.
 *
 * Production content covers 7.º only, so the claim that a run converges to
 * graduation across a whole career cannot be made from real content — it has to
 * be made from a content set that actually has six years. This fixture is that
 * content set: synthetic templates cloned from the development ones, one
 * remediation template per year, and the storylets needed to play them.
 *
 * It exists so the progression rules can be exercised over exactly
 * `7.º · 1.º · 2.º · 3.º · 4.º · 5.º` without a single `if (stage === …)` in the
 * engine. If a later stage ever has to be special-cased to make a career
 * converge, this fixture is where that shows up first.
 *
 * The mathematics is deliberately **not** escalating. Teacher Gate 1 separated
 * the school year from the curricular prerequisite: a later year may hold more
 * structure, never more advanced formulas. The stage shapes vary in structural
 * load and nothing else.
 */

import { createContentCatalog } from '../../challenges/content-catalog'
import type { ChallengeDefinition } from '../../challenges/contracts'
import { toChallengeId, toStoryletId } from '../../core/branded'
import { EngineInvariantError } from '../../core/invariant'
import { toContentSetId, toRulesetId } from '../../core/branded'
import { bandOf, type CognitiveProfile } from '../../difficulty/cognitive'
import { candidateDifficultyCostPolicy } from '../../difficulty/cost-policy'
import { developmentDifficultyPolicy } from '../../difficulty/development-policy'
import { developmentProfilePolicy } from '../../profiles/development-policy'
import { developmentScoringPolicy } from '../../scoring/development-policy'
import {
  PUBLISHED_OBJECTIVES_V1,
  stageCompositionPolicy,
  type CompositionPolicy,
} from '../../plan/composition-policy'
import {
  developmentRecoveryPolicy,
  type RecoveryPolicy,
} from '../../progression/recovery'
import type { StageId } from '../../progression/stages'
import type { Storylet } from '../../narrative/storylet'
import { createRuleset, type Ruleset } from '../../ruleset/ruleset'
import type { EngineDependencies, RecoveryContent } from '../../runs/transition'
import { developmentChallenges } from './development-ruleset'
import { developmentFamilies } from './families'

export const SIX_STAGE_IDS: readonly StageId[] = [
  'grade-7',
  'year-1',
  'year-2',
  'year-3',
  'year-4',
  'year-5',
]

export const SIX_STAGE_RULESET_VERSION = '1.0.0-six-stage'

const LIGHT: CognitiveProfile = {
  steps: 1,
  constraints: 1,
  selection: 1,
  optimization: 0,
  uncertainty: 0,
  construction: 0,
}

const MIDDLE: CognitiveProfile = {
  steps: 2,
  constraints: 1,
  selection: 1,
  optimization: 1,
  uncertainty: 1,
  construction: 0,
}

/** Structural load per year. Not curricular level — the two are not the same. */
const STAGE_SHAPES: readonly {
  readonly stageId: StageId
  readonly anchor: CognitiveProfile
  readonly secondary: CognitiveProfile
}[] = SIX_STAGE_IDS.map((stageId, index) => ({
  stageId,
  anchor: index % 2 === 0 ? LIGHT : MIDDLE,
  secondary: index % 3 === 0 ? MIDDLE : LIGHT,
}))

function baseFor(
  placement: ChallengeDefinition['placement'],
): ChallengeDefinition {
  const base = developmentChallenges.find(
    (template) => template.placement === placement,
  )
  if (base === undefined) {
    throw new EngineInvariantError(
      `the development fixtures hold no ${placement} template to clone`,
    )
  }
  return base
}

function clone(
  base: ChallengeDefinition,
  id: string,
  stageId: StageId,
  cognitive: CognitiveProfile,
  placement: ChallengeDefinition['placement'],
): ChallengeDefinition {
  return {
    ...base,
    id: toChallengeId(id),
    stages: [stageId],
    placement,
    cognitive,
    band: bandOf(cognitive),
  }
}

const anchorBase = baseFor('anchor')
const secondaryBase = baseFor('checkpoint')

const templates: readonly ChallengeDefinition[] = STAGE_SHAPES.flatMap(
  (shape) => [
    clone(
      anchorBase,
      `test.career.${shape.stageId}.anchor`,
      shape.stageId,
      shape.anchor,
      'anchor',
    ),
    clone(
      secondaryBase,
      `test.career.${shape.stageId}.secondary`,
      shape.stageId,
      shape.secondary,
      'checkpoint',
    ),
    // One remediation template per year. Lighter than what it remediates, never
    // heavier: a recovery lowers the floor, it does not raise the ceiling.
    clone(
      anchorBase,
      `test.career.${shape.stageId}.review`,
      shape.stageId,
      LIGHT,
      'recovery',
    ),
  ],
)

const REVIEW_STORYLET = toStoryletId('test.career.review')

/**
 * Two beat slots and one opener per year, plus one shared remediation frame.
 *
 * Each slot hosts every ordinary template of its own year, so composition is
 * free to pick either and the narrative can host whatever it picked. The
 * remediation frame is `never`-eligible: progression schedules it, so the
 * selector must not be able to reach it.
 */
const storylets: readonly Storylet[] = [
  ...STAGE_SHAPES.flatMap((shape): readonly Storylet[] => {
    const ordinary = [
      toChallengeId(`test.career.${shape.stageId}.anchor`),
      toChallengeId(`test.career.${shape.stageId}.secondary`),
    ]
    const slot = (index: number): Storylet => ({
      id: toStoryletId(`test.career.${shape.stageId}.slot-${String(index)}`),
      kind: 'systemic',
      stages: [shape.stageId],
      weight: 10,
      priority: 50,
      requires: { kind: 'always' },
      tags: ['test'],
      eyebrow: 'Año',
      title: `Situación ${String(index)}`,
      text: 'Una situación del año.',
      challengePool: ordinary,
      effects: [],
      followUps: [],
    })

    return [
      {
        id: toStoryletId(`test.career.${shape.stageId}.open`),
        kind: 'one-shot',
        stages: [shape.stageId],
        weight: 10,
        priority: 90,
        requires: { kind: 'always' },
        tags: ['test'],
        eyebrow: 'Apertura',
        title: 'Arranca el año',
        text: 'Empieza otro año.',
        challengePool: [],
        effects: [],
        followUps: [],
      },
      slot(1),
      slot(2),
    ]
  }),
  {
    id: REVIEW_STORYLET,
    kind: 'callback',
    stages: [...SIX_STAGE_IDS],
    weight: 1,
    priority: 0,
    requires: { kind: 'never' },
    tags: ['test', 'repaso'],
    eyebrow: 'Antes de cerrar',
    title: 'Quedó algo pendiente',
    text: 'Se repasa lo que quedó y el año cierra.',
    challengePool: [],
    effects: [],
    followUps: [],
  },
]

export const sixStageCompositionPolicy: CompositionPolicy = {
  id: 'six-stage-career',
  version: '1.0.0-test',
  official: false,
  costPolicy: candidateDifficultyCostPolicy,
  objectives: [...PUBLISHED_OBJECTIVES_V1],
  stages: STAGE_SHAPES.map((shape) =>
    stageCompositionPolicy(shape.stageId, {
      ordinaryBeats: { min: 2, max: 2 },
      // Every template belongs to exactly one year, so repeating across years
      // is impossible by construction and the knob would not change anything.
      allowTemplateRepeats: true,
      difficulty: { target: 10_000, tolerance: 10_000 },
      narrativeBeats: 1,
    }),
  ),
}

export const sixStageRecoveryPolicy: RecoveryPolicy = developmentRecoveryPolicy

/**
 * What reviews what, per year.
 *
 * Both ordinary templates of a year route to that year's review, so the worst
 * possible career still tops out at one remediation per year — which is the
 * bound the exhaustive audit and the twenty-thousand-career sweep check.
 */
export const sixStageRecoveryContent: RecoveryContent = {
  storyletId: REVIEW_STORYLET,
  reviews: Object.fromEntries(
    SIX_STAGE_IDS.flatMap((stageId) => {
      const review = [toChallengeId(`test.career.${stageId}.review`)]
      return [
        [`test.career.${stageId}.anchor`, review],
        [`test.career.${stageId}.secondary`, review],
      ]
    }),
  ),
}

export function createSixStageRuleset(): Ruleset {
  const result = createRuleset({
    id: toRulesetId('six-stage-career'),
    version: SIX_STAGE_RULESET_VERSION,
    contentSetId: toContentSetId('six-stage-career'),
    contentVersion: '1.0.0-test',
    stages: STAGE_SHAPES.map((shape) => ({
      id: shape.stageId,
      labelKey: `stage.${shape.stageId}`,
      eventCount: 3,
      targetDifficulty: 2 as const,
      categories: ['quantity' as const],
    })),
    scoring: developmentScoringPolicy,
    difficulty: developmentDifficultyPolicy,
    profile: developmentProfilePolicy,
    narrative: { cooldownEvents: 0, allowRepeats: false },
    composition: sixStageCompositionPolicy,
    recovery: sixStageRecoveryPolicy,
  })

  if (!result.ok) {
    throw new EngineInvariantError(
      `the six-stage career ruleset is invalid: ${result.error.kind}`,
    )
  }

  return result.value
}

/** Everything `transition` needs to play a full synthetic career. */
export function createSixStageDependencies(): EngineDependencies {
  return {
    ruleset: createSixStageRuleset(),
    catalog: createContentCatalog(developmentFamilies, templates),
    storylets,
    composition: sixStageCompositionPolicy,
    recoveryContent: sixStageRecoveryContent,
  }
}
