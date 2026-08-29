import { describe, expect, it } from 'vitest'

import { auditComposition } from '@/game'
import {
  createSyntheticSixStageCompositionCatalog,
  syntheticSixStageCompositionPolicy,
  SYNTHETIC_SIX_STAGE_IDS,
} from '@/game/testing'
import {
  createGrade7ComposedDependencies,
  grade7CompositionPolicy,
} from '@/content/grade-7'

describe('la auditoría reforzada de composición', () => {
  it('valida, serializa y recompone cada plan de 7.º', () => {
    const dependencies = createGrade7ComposedDependencies()
    const options = {
      runs: 120,
      seedPrefix: 'audit-test',
      stages: ['grade-7'] as const,
      catalog: dependencies.catalog,
      ...(dependencies.approvedVariants === undefined
        ? {}
        : { approvedVariants: dependencies.approvedVariants }),
      policy: grade7CompositionPolicy,
    }

    const first = auditComposition(options)
    const second = auditComposition(options)

    expect(second).toEqual(first)
    expect(first.composed).toBe(120)
    expect(first.verification).toMatchObject({
      validated: 120,
      invalidPlans: 0,
      roundTrips: 120,
      roundTripFailures: 0,
      recompositions: 120,
      recompositionMismatches: 0,
    })
    expect(first.total).toMatchObject({
      min: 250,
      median: 250,
      mean: 250,
      standardDeviation: 0,
      max: 250,
    })
    expect(first.counts.beats).toEqual({ 2: 120 })
    expect(first.contentStatus).toContainEqual({
      templateId: 'g7.mural-paint',
      selected: 0,
      status: 'not-hostable',
    })
    expect(first.dominantTemplates).toContainEqual({
      templateId: 'g7.may-25-act',
      runs: 120,
      runShare: 1,
    })
  })

  it('prueba una carrera sintética de las seis etapas jugables', () => {
    const report = auditComposition({
      runs: 512,
      seedPrefix: 'six-stage-test',
      stages: SYNTHETIC_SIX_STAGE_IDS,
      catalog: createSyntheticSixStageCompositionCatalog(),
      policy: syntheticSixStageCompositionPolicy,
    })

    expect(report.composed).toBe(512)
    expect(report.stages.map((stage) => stage.stageId)).toEqual([
      'grade-7',
      'year-1',
      'year-2',
      'year-3',
      'year-4',
      'year-5',
    ])
    expect(report.stages.map((stage) => stage.cost.mean)).toEqual([
      250, 300, 310, 360, 420, 420,
    ])
    expect(report.counts.beats).toEqual({ 12: 512 })
    expect(report.distinctPlans).toBeGreaterThan(100)
    expect(
      report.contentStatus.every((entry) => entry.status === 'selected'),
    ).toBe(true)
    expect(report.dominantTemplates).toEqual([])
    expect(report.issues).toEqual([])
    expect(report.verification).toMatchObject({
      invalidPlans: 0,
      roundTripFailures: 0,
      recompositionMismatches: 0,
    })
  })
})
