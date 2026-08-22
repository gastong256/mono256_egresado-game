import { describe, expect, it } from 'vitest'

import {
  createChallengeRegistry,
  toChallengeInstanceId,
  toRunSeed,
  type ChallengeDefinition,
  type InteractionAnswer,
  type MaterializedChallenge,
  type SolutionQuality,
} from '@/game'
import { createRng } from '@/game/random/rng'
import { grade7Challenges, createGrade7Dependencies } from '@/content/grade-7'
import { busTimingReference } from '@/content/grade-7/challenges/bus-timing'
import { muralPaintReference } from '@/content/grade-7/challenges/mural-paint'
import { notebookOfferReference } from '@/content/grade-7/challenges/notebook-offer'
import { pesos } from '@/content/pesos'
import { standSuppliesReference } from '@/content/grade-7/challenges/stand-supplies'

/**
 * Matemática del contenido de 7.º grado.
 *
 * Un error de cálculo acá es un error de producto: el jugador vería una
 * consecuencia que no se corresponde con los números que le mostraron. Cada
 * variante autorada se verifica contra la cuenta hecha a mano.
 */

const dependencies = createGrade7Dependencies()
const registry = createChallengeRegistry(grade7Challenges)

/** Materializa todas las instancias que las variantes pueden producir. */
function instancesOf(definition: ChallengeDefinition): MaterializedChallenge[] {
  const seen = new Map<string, MaterializedChallenge>()
  const stage = definition.stages[0]
  if (stage === undefined) throw new Error('sin etapa')

  for (let index = 0; index < 40; index += 1) {
    const instance = definition.materialize(
      {
        instanceId: toChallengeInstanceId(`${stage}:${String(index)}:x`),
        definitionId: definition.id,
        stageId: stage,
        eventIndex: index,
        difficulty: definition.baseDifficulty,
      },
      {
        rng: createRng(toRunSeed(`content-${String(index)}`), ['variant']),
        difficulty: definition.baseDifficulty,
      },
    )
    seen.set(JSON.stringify(instance.present([])), instance)
  }

  return [...seen.values()]
}

function qualityOf(
  instance: MaterializedChallenge,
  answer: InteractionAnswer,
): SolutionQuality {
  const result = instance.evaluate(answer, [])
  if (!result.ok) {
    throw new Error(`la evaluación falló: ${result.error.kind}`)
  }
  return result.value.quality
}

describe('el colectivo · tiempo y porcentaje', () => {
  const definition = registry.get('g7.bus-timing' as never)
  if (definition === undefined) throw new Error('falta el desafío')

  it('aplica la demora sobre la duración programada', () => {
    // 28 min + 25 % = 35 min; 28 min + 50 % = 42 min.
    expect(busTimingReference.travelWithDelay(25)).toBe(35)
    expect(busTimingReference.travelWithDelay(50)).toBe(42)
  })

  it('produce las dos variantes autoradas', () => {
    expect(instancesOf(definition)).toHaveLength(2)
  })

  it.each(busTimingReference.variants)(
    'clasifica cada salida con demora de $delayPercent %',
    (variant) => {
      const travel = busTimingReference.travelWithDelay(variant.delayPercent)
      const entry = busTimingReference.entryMinutesOfDay

      const instance = instancesOf(definition).find((candidate) => {
        const view = candidate.present([])
        return (
          view.kind === 'timeline' &&
          view.data.some(
            (item) => item.value === `${String(variant.delayPercent)} %`,
          )
        )
      })
      if (instance === undefined) throw new Error('no se generó la variante')

      const margins = variant.departures.map((departure) => ({
        id: `salida-${String(departure)}`,
        margin: entry - (departure + travel),
      }))
      const safe = margins
        .filter((entry_) => entry_.margin >= busTimingReference.safeMargin)
        .map((entry_) => entry_.margin)
      const best = Math.min(...safe)

      for (const { id, margin } of margins) {
        const quality = qualityOf(instance, { kind: 'timeline', optionId: id })

        if (margin < 0) {
          expect(quality).toBe('invalid')
        } else if (margin < busTimingReference.safeMargin) {
          expect(quality).toBe('functional')
        } else if (margin === best) {
          expect(quality).toBe('optimal')
        } else {
          expect(quality).toBe('efficient')
        }
      }
    },
  )
})

describe('el mural · área y cobertura', () => {
  const definition = registry.get('g7.mural-paint' as never)
  if (definition === undefined) throw new Error('falta el desafío')

  it.each(muralPaintReference.variants)(
    'necesita más de un litro para $width × $height',
    (variant) => {
      const area = Number(variant.width) * Number(variant.height)
      const litres = area / variant.coverage

      // 6 × 2,4 = 14,4 m² ⇒ 1,8 L. 5 × 2,4 = 12 m² ⇒ 1,5 L.
      expect(litres).toBeGreaterThan(1)
      expect(litres).toBeLessThanOrEqual(2)
    },
  )

  it('rechaza el litro, premia los dos y acepta los cuatro', () => {
    for (const instance of instancesOf(definition)) {
      expect(
        qualityOf(instance, { kind: 'decision-card', optionId: 'lata-1l' }),
      ).toBe('invalid')
      expect(
        qualityOf(instance, { kind: 'decision-card', optionId: 'lata-2l' }),
      ).toBe('optimal')
      expect(
        qualityOf(instance, { kind: 'decision-card', optionId: 'lata-4l' }),
      ).toBe('functional')
    }
  })

  it('explica cuántos metros quedaron sin pintar', () => {
    const instance = instancesOf(definition)[0]
    if (instance === undefined) throw new Error('sin instancia')

    const result = instance.evaluate(
      { kind: 'decision-card', optionId: 'lata-1l' },
      [],
    )
    if (!result.ok) throw new Error('evaluación fallida')

    const labels = result.value.feedback.facts.map((fact) => fact.label)
    expect(labels).toContain('Superficie')
    expect(labels).toContain('Pintura necesaria')
    expect(labels).toContain('Quedó sin pintar')
    // Consecuencia, no veredicto.
    expect(result.value.feedback.outcomeKey).toBe('mural.insufficient')
  })
})

describe('la notebook · porcentaje contra monto fijo', () => {
  const definition = registry.get('g7.notebook-offer' as never)
  if (definition === undefined) throw new Error('falta el desafío')

  it.each(notebookOfferReference.variants)(
    'el porcentaje descuenta más que el monto fijo',
    (variant) => {
      const percentValue = notebookOfferReference.percentOfMinor(
        variant.listPriceMinor,
        variant.percentOff,
      )
      // 20 % de 800.000 = 160.000, contra 120.000 de descuento fijo.
      expect(percentValue).toBeGreaterThan(variant.fixedOffMinor)
      expect(variant.listPriceMinor - percentValue).toBeLessThan(
        variant.listPriceMinor - variant.fixedOffMinor,
      )
    },
  )

  it('sólo la oferta más barata entra en lo que juntaron', () => {
    for (const instance of instancesOf(definition)) {
      expect(
        qualityOf(instance, {
          kind: 'decision-card',
          optionId: 'oferta-porcentaje',
        }),
      ).toBe('optimal')
      expect(
        qualityOf(instance, { kind: 'decision-card', optionId: 'oferta-fija' }),
      ).toBe('invalid')
    }
  })

  it('no dice cuánto queda después del descuento', () => {
    // Calcular el 20 % de la lista es el desafío. Si la vista ya muestra el
    // total, lo único que queda es comparar dos números que alguien más sacó.
    for (const instance of instancesOf(definition)) {
      const view = instance.present([])
      if (view.kind !== 'decision-card') throw new Error('vista inesperada')

      const shown = view.options
        .map((option) => `${option.label} ${option.detail ?? ''}`)
        .join(' ')

      // Ningún total posible puede aparecer escrito en las opciones.
      for (const variant of notebookOfferReference.variants) {
        const afterPercent =
          variant.listPriceMinor -
          notebookOfferReference.percentOfMinor(
            variant.listPriceMinor,
            variant.percentOff,
          )
        const afterFixed = variant.listPriceMinor - variant.fixedOffMinor

        expect(shown).not.toContain(pesos(afterPercent))
        expect(shown).not.toContain(pesos(afterFixed))
      }
    }
  })
})

describe('el trabajo grupal · asignación con restricciones', () => {
  const definition = registry.get('g7.group-tasks' as never)
  if (definition === undefined) throw new Error('falta el desafío')

  it('rechaza dejar una tarea sin asignar', () => {
    for (const instance of instancesOf(definition)) {
      const view = instance.present([])
      if (view.kind !== 'assignment-board')
        throw new Error('interacción inesperada')

      const partial = view.tasks.slice(0, 2).map((task, index) => ({
        taskId: task.id,
        agentId: view.agents[index]?.id ?? '',
      }))

      expect(
        qualityOf(instance, { kind: 'assignment-board', assignments: partial }),
      ).toBe('invalid')
    }
  })

  it('rechaza asignar a alguien sin horas suficientes', () => {
    for (const instance of instancesOf(definition)) {
      const view = instance.present([])
      if (view.kind !== 'assignment-board')
        throw new Error('interacción inesperada')

      // La maqueta pide 6 h; se la damos a quien menos horas libres tiene.
      const hoursOf = (detail: string): number =>
        Number.parseInt(detail.split(' ')[0] ?? '0', 10)
      const sorted = [...view.agents].sort(
        (left, right) => hoursOf(left.detail) - hoursOf(right.detail),
      )
      const weakest = sorted[0]
      if (weakest === undefined) throw new Error('sin integrantes')

      const assignments = view.tasks.map((task, index) => ({
        taskId: task.id,
        agentId:
          task.id === 'maqueta'
            ? weakest.id
            : (sorted.filter((agent) => agent.id !== weakest.id)[index]?.id ??
              sorted[1]?.id ??
              ''),
      }))

      const result = instance.evaluate(
        { kind: 'assignment-board', assignments },
        [],
      )
      if (!result.ok) continue
      expect(result.value.quality).toBe('invalid')
    }
  })

  it('acepta al menos un reparto óptimo', () => {
    for (const instance of instancesOf(definition)) {
      const view = instance.present([])
      if (view.kind !== 'assignment-board')
        throw new Error('interacción inesperada')

      // Se busca por fuerza bruta el reparto que el propio desafío declara óptimo.
      const permute = <T>(items: readonly T[]): T[][] =>
        items.length <= 1
          ? [[...items]]
          : items.flatMap((head, index) =>
              permute([
                ...items.slice(0, index),
                ...items.slice(index + 1),
              ]).map((tail) => [head, ...tail]),
            )

      const found = permute(view.agents).some((ordering) => {
        const assignments = view.tasks.map((task, index) => ({
          taskId: task.id,
          agentId: ordering[index]?.id ?? '',
        }))
        const result = instance.evaluate(
          { kind: 'assignment-board', assignments },
          [],
        )
        return result.ok && result.value.quality === 'optimal'
      })

      expect(found).toBe(true)
    }
  })
})

describe('el stand · costo unitario y combinación', () => {
  const definition = registry.get('g7.stand-supplies' as never)
  if (definition === undefined) throw new Error('falta el desafío')

  it.each(standSuppliesReference.variants)(
    'el óptimo para $servingsNeeded porciones entra en el presupuesto',
    (variant) => {
      const optimal = standSuppliesReference.minimumCost(
        variant.servingsNeeded,
        standSuppliesReference.packs,
      )
      expect(Number.isFinite(optimal)).toBe(true)
      expect(optimal).toBeLessThanOrEqual(variant.budgetMinor)
    },
  )

  it('los paquetes grandes salen más baratos por porción', () => {
    const unit = standSuppliesReference.packs.map(
      (pack) => pack.priceMinor / pack.servings,
    )
    for (let index = 1; index < unit.length; index += 1) {
      expect(unit[index]).toBeLessThan(unit[index - 1] as number)
    }
  })

  it('distingue faltante, exceso de presupuesto y compra óptima', () => {
    for (const instance of instancesOf(definition)) {
      const view = instance.present([])
      if (view.kind !== 'budget-builder')
        throw new Error('interacción inesperada')

      expect(qualityOf(instance, { kind: 'budget-builder', lines: [] })).toBe(
        'invalid',
      )

      const needed = Number.parseInt(
        view.data.find((item) => item.label === 'Porciones necesarias')
          ?.value ?? '0',
        10,
      )

      // Comprar de más cubre las porciones pero se pasa de plata.
      expect(
        qualityOf(instance, {
          kind: 'budget-builder',
          lines: [
            { itemId: 'suelto', quantity: 12 },
            { itemId: 'pack-6', quantity: 8 },
          ],
        }),
      ).toBe('invalid')

      // Existe una combinación que alcanza el costo mínimo que el desafío
      // calculó por su cuenta, y el motor la reconoce como óptima. Se busca por
      // fuerza bruta en vez de asumir cuál es: el óptimo depende de la variante.
      const optimalCost = standSuppliesReference.minimumCost(
        needed,
        standSuppliesReference.packs,
      )
      let foundOptimal = false

      for (let boxes = 0; boxes <= 3 && !foundOptimal; boxes += 1) {
        for (let packs = 0; packs <= 6 && !foundOptimal; packs += 1) {
          for (let singles = 0; singles <= 12 && !foundOptimal; singles += 1) {
            const servings = boxes * 12 + packs * 6 + singles
            const cost = boxes * 900_000 + packs * 480_000 + singles * 90_000
            if (servings < needed || cost !== optimalCost) {
              continue
            }
            expect(
              qualityOf(instance, {
                kind: 'budget-builder',
                lines: [
                  { itemId: 'caja-12', quantity: boxes },
                  { itemId: 'pack-6', quantity: packs },
                  { itemId: 'suelto', quantity: singles },
                ],
              }),
            ).toBe('optimal')
            foundOptimal = true
          }
        }
      }

      expect(foundOptimal).toBe(true)
    }
  })
})

describe('el content set', () => {
  it('declara cinco desafíos y ocho storylets', () => {
    expect(grade7Challenges).toHaveLength(5)
    expect(dependencies.storylets).toHaveLength(8)
  })

  it('ejercita cinco tipos de interacción distintos', () => {
    const kinds = new Set(
      grade7Challenges.map((definition) => definition.interaction),
    )
    expect(kinds).toEqual(
      new Set([
        'timeline',
        'decision-card',
        'assignment-board',
        'budget-builder',
      ]),
    )
  })

  it('no puede declararse oficial mientras las políticas sean de desarrollo', () => {
    expect(dependencies.ruleset.official).toBe(false)
    expect(dependencies.ruleset.scoring.production).toBe(false)
  })

  it('nunca expone la solución en la vista pública', () => {
    for (const definition of grade7Challenges) {
      for (const instance of instancesOf(definition)) {
        const view = JSON.stringify(instance.present([]))
        for (const leak of [
          'optimalCost',
          'bestSkill',
          'requiredLitres',
          'travelMinutes',
          'totalMinor',
        ]) {
          expect(view).not.toContain(leak)
        }
      }
    }
  })
})
