import { describe, expect, it } from 'vitest'
import {
  NEAR_PROFILE_DISTANCE,
  composeRun,
  createContentCatalog,
  toRunSeed,
  validateComposedPlan,
  type ChallengeDefinition,
} from '@/game'
import {
  createGrade3Catalog,
  grade3CatalogParts,
} from '@/content/grade-3/registry'
import {
  grade3ApprovedVariants,
  grade3CompositionPolicy,
} from '@/content/grade-3'

const STAGES = ['grade-7', 'year-1', 'year-2', 'year-3'] as const
const catalog = createGrade3Catalog()

function compose(seed: string, content = catalog) {
  return composeRun({
    seed: toRunSeed(seed),
    stages: [...STAGES],
    catalog: content,
    approvedVariants: grade3ApprovedVariants,
    policy: grade3CompositionPolicy,
  })
}

function yearThree(seed: string): readonly string[] {
  const composed = compose(seed)
  if (!composed.ok) throw new Error(`no compuso: ${composed.error.detail}`)
  expect(
    validateComposedPlan(composed.value, {
      catalog,
      approvedVariants: grade3ApprovedVariants,
      policy: grade3CompositionPolicy,
    }),
  ).toEqual([])
  return (
    composed.value.stages
      .find((stage) => stage.stageId === 'year-3')
      ?.beats.map((beat) => beat.variant.templateId as string) ?? []
  )
}

const distance = (left: ChallengeDefinition, right: ChallengeDefinition) =>
  Math.abs(left.cognitive.steps - right.cognitive.steps) +
  Math.abs(left.cognitive.constraints - right.cognitive.constraints) +
  Math.abs(left.cognitive.selection - right.cognitive.selection) +
  Math.abs(left.cognitive.optimization - right.cognitive.optimization) +
  Math.abs(left.cognitive.uncertainty - right.cognitive.uncertainty) +
  Math.abs(left.cognitive.construction - right.cognitive.construction)

const template = (id: string): ChallengeDefinition => {
  const found = grade3CatalogParts().challenges.find(
    (entry) => (entry.id as string) === id,
  )
  if (found === undefined) throw new Error(`falta ${id}`)
  return found
}

describe('3.º · composición', () => {
  it('compone una carrera parcial válida de cuatro años', () => {
    const composed = compose('grade-3-alpha')
    expect(composed.ok).toBe(true)
    if (!composed.ok) return
    expect(composed.value.stages.flatMap((stage) => stage.beats)).toHaveLength(
      8,
    )
    expect(
      validateComposedPlan(composed.value, {
        catalog,
        approvedVariants: grade3ApprovedVariants,
        policy: grade3CompositionPolicy,
      }),
    ).toEqual([])
  })

  it('la semana y el recorrido piden casi lo mismo, y por eso la preferencia existe', () => {
    const week = template('y3.week-planner')
    const route = template('y3.route-plan')
    const pass = template('y3.transport-pass')
    expect(distance(week, route)).toBeLessThan(NEAR_PROFILE_DISTANCE)
    expect(distance(pass, route)).toBeGreaterThanOrEqual(NEAR_PROFILE_DISTANCE)
  })

  it('con alternativas no los junta, y el año igual no se repite entre runs', () => {
    const seeds = Array.from(
      { length: 40 },
      (_, index) => `soft-${String(index)}`,
    )
    const pairs = seeds.map((seed) => yearThree(seed))
    const together = pairs.filter(
      (pair) =>
        pair.includes('y3.week-planner') && pair.includes('y3.route-plan'),
    )
    expect(pairs.every((pair) => pair.length === 2)).toBe(true)
    expect(together).toEqual([])
    // Y no al precio de fijar una sola pareja: el objetivo cuenta parejas
    // repetidas en vez de maximizar la distancia, así que entre las que quedan
    // sigue decidiendo el sorteo sembrado.
    expect(
      new Set(pairs.map((pair) => [...pair].sort().join(' + '))).size,
    ).toBeGreaterThanOrEqual(3)
  })

  it('y cuando esa pareja es la única legal, la carrera se compone igual', () => {
    // Sin las otras tres Templates de 3.º sólo queda `week-planner` con
    // `route-plan`. Una exclusión dura dejaría la carrera sin plan; una
    // preferencia blanda la ordena y sigue.
    const parts = grade3CatalogParts()
    const restricted = createContentCatalog(
      parts.families,
      parts.challenges.filter(
        (entry) =>
          ![
            'y3.friend-day',
            'y3.transport-pass',
            'y3.course-project-tech',
          ].includes(entry.id as string),
      ),
    )
    const composed = compose('only-legal-pair', restricted)
    expect(composed.ok).toBe(true)
    if (!composed.ok) return
    const beats =
      composed.value.stages
        .find((stage) => stage.stageId === 'year-3')
        ?.beats.map((beat) => beat.variant.templateId as string) ?? []
    expect(new Set(beats)).toEqual(
      new Set(['y3.week-planner', 'y3.route-plan']),
    )
    expect(
      validateComposedPlan(composed.value, {
        catalog: restricted,
        approvedVariants: grade3ApprovedVariants,
        policy: grade3CompositionPolicy,
      }),
    ).toEqual([])
  })

  it('es determinista: el mismo seed compone el mismo año', () => {
    expect(yearThree('repeat')).toEqual(yearThree('repeat'))
  })
})
