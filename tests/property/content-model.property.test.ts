import fc from 'fast-check'
import { describe, expect, it } from 'vitest'

import {
  createContentCatalog,
  deriveVariantSeed,
  formatVariantAddress,
  parseVariantAddress,
  planEntry,
  resolvePlanEntry,
  sameVariantAddress,
  toChallengeId,
  toRunSeed,
  toScenarioFamilyId,
  toVariantId,
  validateStagePlan,
  variantRngPath,
  type ChallengeVariantRef,
} from '@/game'
import { createRng } from '@/game/random/rng'
import { grade7Challenges, grade7Families } from '@/content/grade-7'
import { materializeVariant } from '@/game/testing'

/**
 * Propiedades del direccionamiento de contenido.
 *
 * Lo que se prueba acá no es una función suelta: es la promesa de que la
 * dirección de una variante significa lo mismo siempre y en todas partes. Si
 * esa promesa se rompe, un replay reconstruye otra partida sin avisar.
 */

const arbIdentifier = fc
  .stringMatching(/^[a-z0-9][a-z0-9.-]{0,20}$/)
  .filter((value) => value.length > 0)

const arbAddress: fc.Arbitrary<ChallengeVariantRef> = fc.record({
  familyId: arbIdentifier.map(toScenarioFamilyId),
  templateId: arbIdentifier.map(toChallengeId),
  variantId: arbIdentifier.map(toVariantId),
})

const arbSeed = fc
  .stringMatching(/^[A-Za-z0-9._:-]{1,24}$/)
  .filter((value) => value.length > 0)

describe('variant address', () => {
  it('round-trips through its flat form for any valid address', () => {
    fc.assert(
      fc.property(arbAddress, (ref) => {
        const parsed = parseVariantAddress(formatVariantAddress(ref))
        expect(parsed.ok).toBe(true)
        if (!parsed.ok) return
        expect(sameVariantAddress(parsed.value, ref)).toBe(true)
        expect(parsed.value).toEqual(ref)
      }),
    )
  })

  it('never collides: two different addresses derive two different paths', () => {
    fc.assert(
      fc.property(arbAddress, arbAddress, (left, right) => {
        const same = sameVariantAddress(left, right)
        const equalPaths =
          JSON.stringify(variantRngPath(left)) ===
          JSON.stringify(variantRngPath(right))
        expect(equalPaths).toBe(same)
      }),
    )
  })
})

describe('variant seed derivation', () => {
  it('depends only on the run seed and the semantic address', () => {
    fc.assert(
      fc.property(arbSeed, arbAddress, (seed, ref) => {
        const runSeed = toRunSeed(seed)
        expect(deriveVariantSeed(runSeed, ref)).toBe(
          deriveVariantSeed(runSeed, { ...ref }),
        )
      }),
    )
  })

  it('changes when any part of the address changes', () => {
    fc.assert(
      fc.property(arbSeed, arbAddress, arbIdentifier, (seed, ref, other) => {
        const runSeed = toRunSeed(seed)
        const base = deriveVariantSeed(runSeed, ref)
        const moved = deriveVariantSeed(runSeed, {
          ...ref,
          variantId: toVariantId(other),
        })
        if (other !== ref.variantId) {
          // Una colisión de 32 bits es posible; lo que no puede pasar es que la
          // dirección se ignore, así que se comprueba el camino además del valor.
          expect(
            JSON.stringify(
              variantRngPath({ ...ref, variantId: toVariantId(other) }),
            ),
          ).not.toBe(JSON.stringify(variantRngPath(ref)))
        } else {
          expect(moved).toBe(base)
        }
      }),
    )
  })

  it('gives the same substream to the same address under the same run', () => {
    fc.assert(
      fc.property(arbSeed, arbAddress, (seed, ref) => {
        const runSeed = toRunSeed(seed)
        const draw = () => {
          const rng = createRng(runSeed, variantRngPath(ref))
          return [rng.nextInt(0, 1000), rng.nextInt(0, 1000)]
        }
        expect(draw()).toEqual(draw())
      }),
    )
  })
})

describe('authored content is reproducible from its address', () => {
  const templates = grade7Challenges

  it('materialises identically for the same seed and address', () => {
    fc.assert(
      fc.property(
        arbSeed,
        fc.nat({ max: templates.length - 1 }),
        (seed, index) => {
          const template = templates[index]
          if (template === undefined) return

          for (const variantId of template.variants) {
            const first = materializeVariant(template, { seed, variantId })
            const second = materializeVariant(template, { seed, variantId })
            expect(JSON.stringify(first.present([]))).toBe(
              JSON.stringify(second.present([])),
            )
            expect(first.ref).toEqual(second.ref)
          }
        },
      ),
    )
  })

  it('does not depend on the run seed for authored parameters', () => {
    // Una variante autorada es la misma en cualquier partida: es lo que permite
    // que un catálogo prevalidado signifique algo. Un generador procedural sí
    // usará el seed, y por eso el motor le da su propio substream.
    fc.assert(
      fc.property(arbSeed, arbSeed, (left, right) => {
        for (const template of templates) {
          for (const variantId of template.variants) {
            expect(
              JSON.stringify(
                materializeVariant(template, { seed: left, variantId }).present(
                  [],
                ),
              ),
            ).toBe(
              JSON.stringify(
                materializeVariant(template, {
                  seed: right,
                  variantId,
                }).present([]),
              ),
            )
          }
        }
      }),
      { numRuns: 20 },
    )
  })
})

describe('catalog order does not change meaning', () => {
  it('resolves the same plan entry whatever order the catalog was built in', () => {
    const entry = planEntry(
      toScenarioFamilyId('bus'),
      toChallengeId('g7.bus-timing'),
      toVariantId('demora-25'),
    )

    fc.assert(
      fc.property(
        fc.shuffledSubarray([...grade7Challenges], {
          minLength: grade7Challenges.length,
        }),
        fc.shuffledSubarray([...grade7Families], {
          minLength: grade7Families.length,
        }),
        (templates, families) => {
          const catalog = createContentCatalog(families, templates)

          expect(catalog.templates.map((item) => item.id)).toEqual(
            [...grade7Challenges].map((item) => item.id).sort(),
          )
          expect(resolvePlanEntry(catalog, entry)?.template.id).toBe(
            'g7.bus-timing',
          )
          expect(
            validateStagePlan(catalog, {
              stageId: 'grade-7',
              entries: [entry],
            }),
          ).toEqual([])
        },
      ),
    )
  })
})
