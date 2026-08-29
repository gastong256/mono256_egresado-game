import fc from 'fast-check'
import { describe, expect, it } from 'vitest'

import {
  composeRun,
  createContentCatalog,
  isOk,
  planFingerprint,
  toRunSeed,
  validateComposedPlan,
  DEFAULT_STAGE_BEAT_BUDGET,
} from '@/game'
import {
  createComposedDevelopmentDependencies,
  composedDevelopmentCompositionPolicy,
} from '@/game/testing'
import {
  grade7ApprovedVariants,
  grade7Challenges,
  grade7CompositionPolicy,
  grade7Families,
} from '@/content/grade-7'

/**
 * Invariantes del compositor sobre seeds arbitrarios.
 *
 * Los tests de unidad prueban veinticuatro seeds elegidos; esto prueba los que
 * a nadie se le ocurrieron. Un compositor que respeta el presupuesto en los
 * casos que alguien escribió y lo rompe en el resto no sirve para una
 * competencia.
 */

const catalog = createContentCatalog(grade7Families, grade7Challenges)

/** Seeds con la forma que el motor acepta. */
const seedArbitrary = fc
  .stringMatching(/^[A-Za-z0-9][A-Za-z0-9.:-]{0,23}$/u)
  .filter((value) => value.length > 0)

function compose(seed: string) {
  return composeRun({
    seed: toRunSeed(seed),
    stages: ['grade-7'],
    catalog,
    approvedVariants: grade7ApprovedVariants,
    policy: grade7CompositionPolicy,
  })
}

describe('el compositor sobre seeds arbitrarios', () => {
  it('siempre compone un plan válido', () => {
    fc.assert(
      fc.property(seedArbitrary, (seed) => {
        const composed = compose(seed)
        expect(isOk(composed)).toBe(true)
        if (!isOk(composed)) return

        expect(
          validateComposedPlan(composed.value, {
            catalog,
            policy: grade7CompositionPolicy,
            approvedVariants: grade7ApprovedVariants,
          }),
        ).toEqual([])
      }),
      { numRuns: 200 },
    )
  })

  it('siempre respeta el presupuesto y el anchor único', () => {
    fc.assert(
      fc.property(seedArbitrary, (seed) => {
        const composed = compose(seed)
        if (!isOk(composed)) return

        for (const stage of composed.value.stages) {
          expect(stage.beats.length).toBeGreaterThanOrEqual(
            DEFAULT_STAGE_BEAT_BUDGET.min,
          )
          expect(stage.beats.length).toBeLessThanOrEqual(
            DEFAULT_STAGE_BEAT_BUDGET.max,
          )
          expect(
            stage.beats.filter((beat) => beat.role === 'anchor'),
          ).toHaveLength(1)
        }
      }),
      { numRuns: 200 },
    )
  })

  it('siempre elige contenido aprobado', () => {
    fc.assert(
      fc.property(seedArbitrary, (seed) => {
        const composed = compose(seed)
        if (!isOk(composed)) return

        for (const stage of composed.value.stages) {
          for (const beat of stage.beats) {
            expect(
              grade7ApprovedVariants
                .variantsFor(beat.variant.templateId)
                .includes(beat.variant.variantId),
            ).toBe(true)
          }
        }
      }),
      { numRuns: 200 },
    )
  })

  it('es una función del seed: componer dos veces da lo mismo', () => {
    fc.assert(
      fc.property(seedArbitrary, (seed) => {
        const first = compose(seed)
        const second = compose(seed)
        if (!isOk(first) || !isOk(second)) return

        expect(planFingerprint(second.value)).toBe(planFingerprint(first.value))
      }),
      { numRuns: 150 },
    )
  })

  it('la carga de una carrera entera se queda dentro del sobre', () => {
    const development = createComposedDevelopmentDependencies()
    const stages = development.ruleset.stages.map((stage) => stage.id)

    fc.assert(
      fc.property(seedArbitrary, (seed) => {
        const composed = composeRun({
          seed: toRunSeed(seed),
          stages,
          catalog: development.catalog,
          policy: composedDevelopmentCompositionPolicy,
        })
        if (!isOk(composed)) return

        for (const stage of composed.value.stages) {
          const policy = composedDevelopmentCompositionPolicy.stages.find(
            (entry) => entry.stageId === stage.stageId,
          )
          if (policy === undefined) throw new Error('sin política')

          // `abs(Σ difficultyCost − target) <= tolerance`, el invariante que el
          // contrato de la etapa pide probado.
          expect(
            Math.abs(stage.difficultyCost - policy.difficulty.target),
          ).toBeLessThanOrEqual(policy.difficulty.tolerance)
        }
      }),
      { numRuns: 100 },
    )
  })
})
