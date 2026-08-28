import fc from 'fast-check'
import { describe, expect, it } from 'vitest'

import {
  candidateVariantId,
  createContentCatalog,
  createVariantRng,
  evaluateVariant,
  toChallengeId,
  variantFingerprint,
  type ChallengeDefinition,
  type InteractionAnswer,
} from '@/game'
import { materializeVariant } from '@/game/testing'
import { grade7Challenges, grade7Families } from '@/content/grade-7'
import {
  marginsOf,
  travelMinutesOf,
  SAFE_MARGIN,
  type BusParams,
} from '@/content/grade-7/challenges/bus-timing.variants'
import {
  requiredCentilitres,
  TIN_LITRES,
  type MuralParams,
} from '@/content/grade-7/challenges/mural-paint.variants'
import {
  fixedTotalOf,
  percentTotalOf,
  type NotebookParams,
} from '@/content/grade-7/challenges/notebook-offer.variants'
import {
  minimumCostByEnumeration,
  type StandParams,
} from '@/content/grade-7/challenges/stand-supplies.variants'
import {
  matchesActRule,
  isPrimeByTrialDivision,
  ACT_RULES,
  CELLS_PER_ROUND,
  MAX_TARGETS,
  MIN_TARGETS,
  type May25Params,
} from '@/content/grade-7/challenges/may-25-act.variants'
import {
  bestFeasibleAffinity,
  type GroupParams,
} from '@/content/grade-7/challenges/group-tasks.variants'

/**
 * Propiedades de los generadores.
 *
 * Cada plantilla generada promete una forma matemática, y la promesa se prueba
 * sobre una muestra grande de direcciones, no sobre dos ejemplos elegidos a
 * mano. Los oráculos son deliberadamente independientes: recalculan desde los
 * parámetros crudos en vez de preguntarle al desafío si está contento.
 */

const catalog = createContentCatalog(grade7Families, grade7Challenges)

function template(id: string): ChallengeDefinition {
  const found = catalog.template(toChallengeId(id))
  if (found === undefined) throw new Error(`sin plantilla ${id}`)
  return found
}

/** Cuántas direcciones recorre cada propiedad. */
const SAMPLE = 400

const arbIndex = fc.nat({ max: 19_999 })

function paramsOf<TParams>(
  definition: ChallengeDefinition,
  index: number,
): TParams {
  const address = {
    familyId: definition.family,
    templateId: definition.id,
    variantId: candidateVariantId(index),
  }
  return definition.variantSource.canonicalFor(
    address.variantId,
    createVariantRng(address),
  ) as TParams
}

describe('every generated candidate is approvable', () => {
  it.each([
    ['g7.bus-timing'],
    ['g7.mural-paint'],
    ['g7.notebook-offer'],
    ['g7.stand-supplies'],
    ['g7.may-25-act'],
  ])('%s produces only valid variants', (id) => {
    const definition = template(id)
    fc.assert(
      fc.property(arbIndex, (index) => {
        const evaluated = evaluateVariant(
          catalog,
          definition,
          candidateVariantId(index),
        )
        expect(evaluated.diagnostics).toEqual([])
        expect(evaluated.fingerprint).toBeDefined()
      }),
      { numRuns: SAMPLE },
    )
  })
})

describe('colectivo', () => {
  const bus = template('g7.bus-timing')

  it('always has exactly one best safe departure and at least one that is late', () => {
    fc.assert(
      fc.property(arbIndex, (index) => {
        const params = paramsOf<BusParams>(bus, index)
        const travel = travelMinutesOf(params)
        const margins = marginsOf(params)

        // El viaje con demora tiene que dar minutos enteros: es la cuenta que
        // el jugador hace, no una que arrastra decimales.
        expect(Number.isInteger(travel)).toBe(true)
        expect(travel).toBeGreaterThan(params.scheduledMinutes)
        expect(new Set(margins).size).toBe(margins.length)
        expect(margins.some((margin) => margin < 0)).toBe(true)

        const safe = margins.filter((margin) => margin >= SAFE_MARGIN)
        expect(safe.length).toBeGreaterThan(0)
        const best = Math.min(...safe)
        expect(safe.filter((margin) => margin === best)).toHaveLength(1)
      }),
      { numRuns: SAMPLE },
    )
  })

  it('agrees with the challenge about which option is optimal', () => {
    fc.assert(
      fc.property(arbIndex, (index) => {
        const variantId = candidateVariantId(index)
        const params = paramsOf<BusParams>(bus, index)
        const instance = materializeVariant(bus, { seed: 'prop', variantId })
        const view = instance.present([])
        if (view.kind !== 'timeline') return

        const margins = marginsOf(params)
        const safe = margins.filter((margin) => margin >= SAFE_MARGIN)
        const bestMargin = Math.min(...safe)
        const expectedIndex = margins.indexOf(bestMargin)

        const qualities = view.options.map((option) => {
          const result = instance.evaluate(
            {
              kind: 'timeline',
              optionId: option.id,
            } satisfies InteractionAnswer,
            [],
          )
          return result.ok ? result.value.quality : 'invalid'
        })

        expect(qualities[expectedIndex]).toBe('optimal')
        expect(
          qualities.filter((quality) => quality === 'optimal'),
        ).toHaveLength(1)
      }),
      { numRuns: SAMPLE },
    )
  })
})

describe('mural', () => {
  const mural = template('g7.mural-paint')

  it('always has a tin that is enough and one that is not', () => {
    fc.assert(
      fc.property(arbIndex, (index) => {
        const params = paramsOf<MuralParams>(mural, index)
        const required = requiredCentilitres(params)
        const sufficient = TIN_LITRES.filter(
          (litres) => litres * 100 >= required,
        )

        expect(sufficient.length).toBeGreaterThan(0)
        expect(sufficient.length).toBeLessThan(TIN_LITRES.length)
        // El 1 L nunca puede ser la respuesta: si alcanzara, alcanzarían todos.
        expect(required).toBeGreaterThan(100)
      }),
      { numRuns: SAMPLE },
    )
  })

  it('keeps the wall a wall', () => {
    fc.assert(
      fc.property(arbIndex, (index) => {
        const params = paramsOf<MuralParams>(mural, index)
        expect(Number(params.width)).toBeGreaterThanOrEqual(2)
        expect(Number(params.width)).toBeLessThanOrEqual(12)
        expect(Number(params.height)).toBeGreaterThanOrEqual(2)
        expect(Number(params.height)).toBeLessThanOrEqual(4)
        // Un decimal como mucho, para que el área se calcule a mano.
        expect(params.width).toMatch(/^\d+(\.\d)?$/)
        expect(params.height).toMatch(/^\d+(\.\d)?$/)
      }),
      { numRuns: SAMPLE },
    )
  })
})

describe('cuaderno', () => {
  const notebook = template('g7.notebook-offer')

  it('always leaves the two offers distinguishable and both real', () => {
    fc.assert(
      fc.property(arbIndex, (index) => {
        const params = paramsOf<NotebookParams>(notebook, index)
        const percentTotal = percentTotalOf(params)
        const fixedTotal = fixedTotalOf(params)

        expect(percentTotal).toBeGreaterThan(0)
        expect(fixedTotal).toBeGreaterThan(0)
        expect(percentTotal).not.toBe(fixedTotal)
        expect(params.fixedOffMinor).toBeGreaterThan(0)
        expect(params.fixedOffMinor).toBeLessThan(params.listPriceMinor)
        // Pesos enteros de punta a punta: ni el descuento ni los totales
        // pueden aparecer con centavos sueltos.
        expect(percentTotal % 100).toBe(0)
        expect(fixedTotal % 100).toBe(0)
      }),
      { numRuns: SAMPLE },
    )
  })

  it('lets exactly one offer fit the budget', () => {
    fc.assert(
      fc.property(arbIndex, (index) => {
        const variantId = candidateVariantId(index)
        const instance = materializeVariant(notebook, {
          seed: 'prop',
          variantId,
        })
        const view = instance.present([])
        if (view.kind !== 'decision-card') return

        const qualities = view.options.map((option) => {
          const result = instance.evaluate(
            {
              kind: 'decision-card',
              optionId: option.id,
            } satisfies InteractionAnswer,
            [],
          )
          return result.ok ? result.value.quality : 'invalid'
        })
        expect(
          qualities.filter((quality) => quality === 'optimal'),
        ).toHaveLength(1)
      }),
      { numRuns: SAMPLE },
    )
  })
})

describe('stand', () => {
  const stand = template('g7.stand-supplies')

  it('always has an affordable optimum, confirmed by exhaustive search', () => {
    fc.assert(
      fc.property(arbIndex, (index) => {
        const params = paramsOf<StandParams>(stand, index)
        const optimal = minimumCostByEnumeration(params.servingsNeeded)

        expect(Number.isFinite(optimal)).toBe(true)
        expect(optimal).toBeLessThanOrEqual(params.budgetMinor)
        // Comprar todo suelto nunca puede ser ya lo óptimo: si lo fuera, no
        // habría nada que optimizar.
        expect(params.servingsNeeded * 90_000).toBeGreaterThan(optimal)
      }),
      { numRuns: 120 },
    )
  })
})

describe('acto del 25 de Mayo', () => {
  const act = template('g7.may-25-act')

  it('always builds three grids that can be classified by hand', () => {
    fc.assert(
      fc.property(arbIndex, (index) => {
        const params = paramsOf<May25Params>(act, index)
        expect(params.rounds).toHaveLength(ACT_RULES.length)

        for (const [round, numbers] of params.rounds.entries()) {
          const rule = ACT_RULES[round]
          if (rule === undefined) return

          expect(numbers).toHaveLength(CELLS_PER_ROUND)
          expect(new Set(numbers).size).toBe(numbers.length)
          for (const value of numbers) {
            expect(Number.isSafeInteger(value)).toBe(true)
            expect(value).toBeGreaterThanOrEqual(1)
            expect(value).toBeLessThanOrEqual(30)
          }

          const targets = numbers.filter((value) => matchesActRule(rule, value))
          expect(targets.length).toBeGreaterThanOrEqual(MIN_TARGETS)
          expect(targets.length).toBeLessThanOrEqual(MAX_TARGETS)
        }
      }),
      { numRuns: SAMPLE },
    )
  })

  it('classifies primes the same way as an independent sieve', () => {
    const sieve = new Set<number>()
    for (let value = 2; value <= 30; value += 1) {
      let prime = true
      for (const known of sieve) {
        if (value % known === 0) {
          prime = false
          break
        }
      }
      if (prime) sieve.add(value)
    }

    for (let value = 0; value <= 30; value += 1) {
      expect(isPrimeByTrialDivision(value)).toBe(sieve.has(value))
    }
  })
})

describe('trabajo grupal', () => {
  const group = template('g7.group-tasks')

  it('has a feasible assignment in every authored roster', () => {
    for (const variantId of group.variantSource.authoredIds) {
      const params = group.variantSource.canonicalFor(
        variantId,
        createVariantRng({
          familyId: group.family,
          templateId: group.id,
          variantId,
        }),
      ) as GroupParams

      expect(bestFeasibleAffinity(params)).toBeGreaterThanOrEqual(0)
    }
  })
})

describe('fingerprints across the population', () => {
  it('collide only when the problem really is the same', () => {
    const bus = template('g7.bus-timing')
    const seen = new Map<string, string>()
    let collisions = 0

    for (let index = 0; index < 600; index += 1) {
      const address = {
        familyId: bus.family,
        templateId: bus.id,
        variantId: candidateVariantId(index),
      }
      const fingerprint = variantFingerprint(catalog, address)
      if (fingerprint === undefined) continue

      const previous = seen.get(fingerprint)
      if (previous !== undefined) {
        collisions += 1
        // Una colisión sólo es legítima si el contenido canónico coincide.
        expect(
          JSON.stringify(
            bus.variantSource.canonicalFor(
              address.variantId,
              createVariantRng(address),
            ),
          ),
        ).toBe(previous)
        continue
      }
      seen.set(
        fingerprint,
        JSON.stringify(
          bus.variantSource.canonicalFor(
            address.variantId,
            createVariantRng(address),
          ),
        ),
      )
    }

    expect(seen.size).toBeGreaterThan(500)
    expect(collisions).toBeLessThan(100)
  })
})
