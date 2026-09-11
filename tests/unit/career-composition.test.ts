import { describe, expect, it } from 'vitest'
import fc from 'fast-check'
import {
  bandOf,
  composeRun,
  createContentCatalog,
  fullCareerV1Constraints,
  validateComposedPlan,
  stageCompositionPolicy,
  candidateDifficultyCostPolicy,
  toChallengeId,
  toRunSeed,
  type ChallengeDefinition,
  type CompositionMetadata,
  type CompositionPolicy,
  type CognitiveProfile,
  type StageId,
} from '@/game'
import { mobileData } from '@/content/grade-1/challenges/mobile-data'

// Artificial catalog for algorithm contracts, not playable Grades 2–5 or a post-G1 audit.
const stageIds = fullCareerV1Constraints.requiredStages
const core: CognitiveProfile = {
  steps: 1,
  constraints: 2,
  selection: 0,
  optimization: 0,
  uncertainty: 0,
  construction: 1,
}
const standard: CognitiveProfile = { ...core, steps: 2 }
const stretch: CognitiveProfile = { ...standard, constraints: 3, selection: 2 }
function template(
  id: string,
  stage: StageId,
  placement: 'anchor' | 'checkpoint',
  cognitive: CognitiveProfile,
  composition: CompositionMetadata,
): ChallengeDefinition {
  return {
    ...mobileData,
    id: toChallengeId(id),
    stages: [stage],
    placement,
    cognitive,
    band: bandOf(cognitive),
    composition,
  }
}
const profiles = [
  core,
  standard,
  standard,
  stretch,
  standard,
  standard,
] as const
const secondaryProfiles = [
  core,
  standard,
  core,
  core,
  stretch,
  standard,
] as const
const reasoning = [
  'TEMPORAL',
  'ALLOCATION',
  'DATA_UNCERTAINTY',
  'SPATIAL',
  'LOGIC_CLASSIFICATION',
  'SYSTEMS_OPTIMIZATION',
] as const
const engines = [
  'timeline-schedule',
  'allocate-constrain',
  'choice-compare',
  'spatial-graph',
  'grid-select-classify',
  'allocate-constrain',
] as const
const templates = stageIds.flatMap((stage, i) => {
  const p = profiles[i] ?? core,
    secondary = secondaryProfiles[i] ?? core
  const pacing = (profile: CognitiveProfile) =>
    bandOf(profile) === 'core'
      ? ('QUICK' as const)
      : bandOf(profile) === 'stretch'
        ? ('DEEP' as const)
        : ('MEDIUM' as const)
  return [
    template(`fixture.anchor-${i}`, stage, 'anchor', p, {
      primaryReasoningFamily: reasoning[i] ?? 'TEMPORAL',
      interactionEngine: engines[i] ?? 'choice-compare',
      pacingClass: pacing(p),
      ...(i === 1 ? { recurringArc: 'PROJECT' as const } : {}),
    }),
    template(`fixture.secondary-${i}`, stage, 'checkpoint', secondary, {
      primaryReasoningFamily:
        i % 2 === 0 ? 'ECONOMIC_PROPORTIONAL' : 'ALLOCATION',
      interactionEngine: 'allocate-constrain',
      pacingClass: pacing(secondary),
    }),
  ]
})
const catalogOf = (values: readonly ChallengeDefinition[]) =>
  createContentCatalog(
    [
      {
        id: mobileData.family,
        labelKey: 'fixture',
        summary: 'Algorithm-only fixtures',
      },
    ],
    values,
  )
const policy: CompositionPolicy = {
  id: 'global-fixture',
  version: '1-test',
  official: false,
  costPolicy: candidateDifficultyCostPolicy,
  objectives: ['difficulty-fit', 'family-variety'],
  stages: stageIds.map((id) =>
    stageCompositionPolicy(id, { difficulty: { target: 250, tolerance: 300 } }),
  ),
  career: fullCareerV1Constraints,
}
const catalog = catalogOf(templates)

describe('composición global acotada e independiente del runtime de futuros años', () => {
  it('construye nueve beats, respeta cuotas globales y pasa un validador que no compone', () => {
    const result = composeRun({
      seed: toRunSeed('global'),
      stages: stageIds,
      catalog,
      policy,
    })
    expect(result.ok).toBe(true)
    if (!result.ok) throw new Error(result.error.detail)
    expect(result.value.stages.flatMap((s) => s.beats)).toHaveLength(9)
    expect(validateComposedPlan(result.value, { catalog, policy })).toEqual([])
    const truncated = {
      ...result.value,
      stages: result.value.stages.slice(0, 5),
    }
    expect(
      validateComposedPlan(truncated, { catalog, policy }).some(
        (i) => i.code === 'plan.career-stages',
      ),
    ).toBe(true)
    const zeroClusters = catalogOf(
      templates.map((t) => ({
        ...t,
        composition: { ...t.composition!, eventCluster: 'same-event' },
      })),
    )
    expect(
      validateComposedPlan(result.value, {
        catalog: zeroClusters,
        policy,
      }).some((i) => i.code === 'plan.career-cluster'),
    ).toBe(true)
    const allProjects = catalogOf(
      templates.map((t) => ({
        ...t,
        composition: { ...t.composition!, recurringArc: 'PROJECT' },
      })),
    )
    expect(
      validateComposedPlan(result.value, { catalog: allProjects, policy }).some(
        (i) => i.code === 'plan.career-quota' && i.message.includes('Project'),
      ),
    ).toBe(true)
  })

  it('no acepta parcial como full-career ni degrada silenciosamente una búsqueda agotada', () => {
    expect(
      composeRun({
        seed: toRunSeed('short'),
        stages: ['grade-7', 'year-1'],
        catalog,
        policy,
      }).ok,
    ).toBe(false)
    const limited = composeRun({
      seed: toRunSeed('budget'),
      stages: stageIds,
      catalog,
      policy: {
        ...policy,
        career: { ...fullCareerV1Constraints, maxSearchNodes: 1 },
      },
    })
    expect(!limited.ok && limited.error.code).toBe('search-budget-exceeded')
    const noEngines = composeRun({
      seed: toRunSeed('impossible'),
      stages: stageIds,
      catalog,
      policy: {
        ...policy,
        career: { ...fullCareerV1Constraints, minInteractionEngines: 6 },
      },
    })
    expect(!noEngines.ok && noEngines.error.code).toBe('career-unsatisfiable')
  })

  it('propiedad: seed estable y orden de catálogo irrelevante; todas las carreras pasan las cuotas', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 100000 }), (seed) => {
        const request = {
          seed: toRunSeed(`global-${seed}`),
          stages: stageIds,
          catalog,
          policy,
        }
        const result = composeRun(request)
        expect(result.ok).toBe(true)
        if (!result.ok) throw new Error(result.error.detail)
        expect(composeRun(request)).toEqual(result)
        expect(
          composeRun({
            ...request,
            catalog: catalogOf([...templates].reverse()),
          }),
        ).toEqual(result)
        expect(validateComposedPlan(result.value, { catalog, policy })).toEqual(
          [],
        )
      }),
      { numRuns: 100 },
    )
  })

  it('retrocede sobre una decisión local tentadora cuando impediría completar la carrera', () => {
    const meta: CompositionMetadata = {
      primaryReasoningFamily: 'ECONOMIC_PROPORTIONAL',
      interactionEngine: 'allocate-constrain',
      pacingClass: 'QUICK',
    }
    const content = catalogOf([
      template('fixture.tempting', 'grade-7', 'anchor', core, meta),
      template('fixture.necessary', 'grade-7', 'anchor', standard, {
        ...meta,
        primaryReasoningFamily: 'TEMPORAL',
      }),
      template('fixture.fixed', 'year-1', 'anchor', core, meta),
    ])
    const partial: CompositionPolicy = {
      ...policy,
      stages: ['grade-7', 'year-1'].map((id) =>
        stageCompositionPolicy(id as StageId, {
          ordinaryBeats: { min: 1, max: 1 },
          difficulty: { target: 100, tolerance: 300 },
        }),
      ),
      career: {
        ...fullCareerV1Constraints,
        scope: 'partial-development',
        requiredStages: ['grade-7', 'year-1'],
        ordinaryBeats: { min: 2, max: 2 },
        bands: {
          core: { min: 0, max: 2 },
          standard: { min: 0, max: 2 },
          stretch: { min: 0, max: 2 },
        },
        pacing: {
          QUICK: { min: 0, max: 2 },
          MEDIUM: { min: 0, max: 2 },
          DEEP: { min: 0, max: 2 },
        },
        minReasoningFamilies: 1,
        minInteractionEngines: 1,
        minDataOrLogic: 0,
        maxByReasoning: { ECONOMIC_PROPORTIONAL: 1 },
      },
    }
    const result = composeRun({
      seed: toRunSeed('non-greedy'),
      stages: ['grade-7', 'year-1'],
      catalog: content,
      policy: partial,
    })
    expect(
      result.ok && result.value.stages[0]?.beats[0]?.variant.templateId,
    ).toBe('fixture.necessary')
    if (result.ok)
      expect(
        validateComposedPlan(result.value, {
          catalog: content,
          policy: partial,
        }),
      ).toEqual([])
  })
})
