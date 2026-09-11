import { describe, expect, it } from 'vitest'
import fc from 'fast-check'
import { parseCommand, type SpatialPlacement } from '@/game'
import {
  classroomLayout,
  evaluateLayout,
  layoutGates,
  layoutOracle,
  layoutSchema,
  layoutSearch,
  scaleFitReview,
  type LayoutParams,
} from '@/content/grade-1/challenges/classroom-layout'
import { approvedParams } from '../helpers/grade-1-approved'

const evaluate = (p: LayoutParams, placements: readonly SpatialPlacement[]) => {
  const result = evaluateLayout(p, placements)
  if (!result.ok) throw new Error(result.error.kind)
  return result.value
}

describe.each([
  { template: classroomLayout, minimum: 16, shapes: 4 },
  { template: scaleFitReview, minimum: 8, shapes: 1 },
])('$template.id', ({ template, minimum, shapes }) => {
  const approved = approvedParams(template, (value) =>
    layoutSchema.parse(value),
  )
  const review = template.placement === 'recovery'

  it('aprueba su catálogo con gates limpios, banda y pacing del diseño', () => {
    expect(approved.length).toBeGreaterThanOrEqual(minimum)
    expect(
      new Set(approved.map(({ params }) => params.shape)).size,
    ).toBeGreaterThanOrEqual(shapes)
    expect(
      new Set(approved.map(({ params }) => params.cellCm)).size,
    ).toBeGreaterThan(1)
    for (const { params } of approved) expect(layoutGates(params)).toEqual([])
    expect(template.band).toBe(review ? 'core' : 'stretch')
    expect(template.composition?.pacingClass).toBe(review ? 'QUICK' : 'DEEP')
    expect(template.composition?.interactionEngine).toBe('spatial-graph')
  })

  it.each(
    approved.map(({ variantId, params }) => [variantId, params] as const),
  )(
    '%s: la búsqueda acotada prueba cada nivel y el evaluador coincide con el oráculo',
    (_, p) => {
      const search = layoutSearch(p)
      expect(search.exhausted).toBe(false)
      expect(search.witnesses.optimal.length).toBeGreaterThanOrEqual(2)
      for (const tier of ['optimal', 'efficient', 'functional'] as const)
        for (const witness of search.witnesses[tier]) {
          expect(layoutOracle(p, witness)).toBe(tier)
          const result = evaluate(p, witness)
          expect(result.quality).toBe(tier)
          expect(evaluate(p, [...witness].reverse())).toEqual(result)
        }
    },
  )

  it('rechaza superposición, salida del plano y celdas reservadas', () => {
    for (const { params: p } of approved) {
      const witness = layoutSearch(p).witnesses.optimal[0]!
      expect(
        evaluate(
          p,
          witness.map((entry) => ({ ...entry, x: 0, y: 0 })),
        ).quality,
      ).toBe('invalid')
      expect(
        evaluate(
          p,
          witness.map((entry) => ({
            ...entry,
            x: p.width - 1,
            y: p.height - 1,
          })),
        ).quality,
      ).toBe('invalid')
      const reserved = [...p.aisle, ...p.doors, ...p.blocked][0]
      if (reserved !== undefined) {
        const small = p.objects.find(
          (object) =>
            object.widthCm === p.cellCm && object.depthCm === p.cellCm,
        )
        if (small !== undefined)
          expect(
            evaluate(p, [
              ...witness.filter((entry) => entry.objectId !== small.id),
              { objectId: small.id, x: reserved.x, y: reserved.y, rotation: 0 },
            ]).quality,
          ).toBe('invalid')
      }
    }
  })

  it('propiedad: geometría y conectividad coinciden con la matriz independiente', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: approved.length - 1 }),
        fc.array(
          fc.tuple(
            fc.integer({ min: 0, max: 11 }),
            fc.integer({ min: 0, max: 7 }),
            fc.boolean(),
            fc.boolean(),
          ),
          { minLength: 5, maxLength: 5 },
        ),
        (index, values) => {
          const p = approved[index]!.params
          const placements = p.objects.flatMap((object, i) => {
            const [x, y, turned, included] = values[i] ?? [0, 0, false, false]
            return included
              ? [
                  {
                    objectId: object.id,
                    x,
                    y,
                    rotation:
                      object.rotatable && turned ? (90 as const) : (0 as const),
                  },
                ]
              : []
          })
          expect(evaluate(p, placements).quality).toBe(
            layoutOracle(p, placements),
          )
          expect(
            parseCommand({
              type: 'ANSWER',
              instanceId: 'test',
              answer: { kind: 'spatial-layout', placements },
            }).ok,
          ).toBe(true)
        },
      ),
      { numRuns: 800 },
    )
  })

  it('rechaza coordenadas de píxel o fraccionarias, giros arbitrarios, IDs desconocidos y duplicados', () => {
    const p = approved[0]!.params
    const first = layoutSearch(p).witnesses.optimal[0]![0]!
    for (const placements of [
      [first, first],
      [{ ...first, objectId: 'fake' }],
      [{ ...first, x: 0.5 }],
      [{ ...first, x: 480 }],
    ])
      expect(evaluateLayout(p, placements).ok).toBe(false)
    const fixed = p.objects.find((object) => !object.rotatable)!
    expect(
      evaluateLayout(p, [{ objectId: fixed.id, x: 0, y: 0, rotation: 90 }]).ok,
    ).toBe(false)
    expect(
      parseCommand({
        type: 'ANSWER',
        instanceId: 'test',
        answer: {
          kind: 'spatial-layout',
          placements: [{ ...first, rotation: 45 }],
        },
      }).ok,
    ).toBe(false)
  })
})

it('aula: el área total no basta — la capacidad, los pasos y la puerta deciden', () => {
  for (const { params: p } of approvedParams(classroomLayout, (value) =>
    layoutSchema.parse(value),
  )) {
    const search = layoutSearch(p)
    const optimal = search.witnesses.optimal[0]!
    const seated = optimal.filter(
      (entry) => entry.objectId === 'stage' || entry.objectId === 'table-a',
    )
    const result = evaluate(p, seated)
    expect(result.quality).toBe('invalid')
    expect(result.feedback.violatedConstraint).toMatch(/lugares/u)
    const stageOnly = p.objects.find((object) => object.id === 'stage')!
    expect(stageOnly.heightCm).toBeGreaterThan(0)
    expect(p.targetSeats).toBeGreaterThan(p.requiredSeats)
  }
})

it('repaso: las tres cosas con espacio entre ellas no entran; hay que convertir y encastrar', () => {
  for (const { params: p } of approvedParams(scaleFitReview, (value) =>
    layoutSchema.parse(value),
  )) {
    let x = 0
    const gapped = p.objects.map((object) => {
      const placed = { objectId: object.id, x, y: 0, rotation: 0 as const }
      x += object.widthCm / p.cellCm + 1
      return placed
    })
    expect(evaluate(p, gapped).quality).toBe('invalid')
    expect(p.height).toBe(1)
    expect(p.objects).toHaveLength(3)
  }
})
