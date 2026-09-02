import { describe, expect, it } from 'vitest'

import {
  createContentCatalog,
  targetsFor,
  toRunSeed,
  type CareerEffects,
  type ChallengeDefinition,
  type GridRoundSelection,
  type InteractionAnswer,
  type MaterializedChallenge,
  type PresentedGridRound,
  type SolutionQuality,
} from '@/game'
import {
  createGrade7Dependencies,
  grade7Challenges,
  grade7Families,
  grade7VariantCatalog,
} from '@/content/grade-7'
import {
  materializeEveryVariant,
  materializeVariant,
  synthesizeAnswer,
} from '@/game/testing'
import { createRng } from '@/game/random/rng'
import { busTimingReference } from '@/content/grade-7/challenges/bus-timing'
import { may25ActReference } from '@/content/grade-7/challenges/may-25-act'
import {
  ACT_RULES,
  CELLS_PER_ROUND,
  FUNCTIONAL_THRESHOLD,
  MAX_TOTAL_TARGETS,
  matchesActRule,
} from '@/content/grade-7/challenges/may-25-act.variants'
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
const catalog = createContentCatalog(grade7Families, grade7Challenges)

/**
 * Una instancia por variante autorada.
 *
 * Antes esto materializaba cuarenta seeds y esperaba que aparecieran todas las
 * variantes. Ahora las variantes tienen dirección propia, así que se recorren
 * de forma exhaustiva: si una variante nueva se agrega y rompe una invariante,
 * el test la ve siempre y no cuando el seed tiene suerte.
 */
function instancesOf(definition: ChallengeDefinition): MaterializedChallenge[] {
  return [...materializeEveryVariant(definition, 'content')]
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
  const definition = catalog.template('g7.bus-timing' as never)
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
  const definition = catalog.template('g7.mural-paint' as never)
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
  const definition = catalog.template('g7.notebook-offer' as never)
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
  const definition = catalog.template('g7.group-tasks' as never)
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
  const definition = catalog.template('g7.stand-supplies' as never)
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

describe('el acto del 25 de Mayo · clasificación y Aura', () => {
  const definition = catalog.template('g7.may-25-act' as never)
  if (definition === undefined) throw new Error('falta el desafío')

  /** Las rondas presentadas por una instancia. */
  function roundsOf(
    instance: MaterializedChallenge,
  ): readonly PresentedGridRound[] {
    const view = instance.present([])
    if (view.kind !== 'number-grid') throw new Error('no es una grilla')
    return view.rounds
  }

  /** Arma una respuesta aplicando `pick` a cada ronda. */
  function answerWith(
    instance: MaterializedChallenge,
    pick: (round: PresentedGridRound) => readonly number[],
  ): InteractionAnswer {
    const rounds: GridRoundSelection[] = roundsOf(instance).map((round) => ({
      roundId: round.id,
      numbers: [...pick(round)],
    }))
    return { kind: 'number-grid', rounds }
  }

  const perfect = (instance: MaterializedChallenge): InteractionAnswer =>
    answerWith(instance, (round) => targetsFor(round.rule, round.numbers))

  function effectsOf(
    instance: MaterializedChallenge,
    answer: InteractionAnswer,
  ): CareerEffects {
    const result = instance.evaluate(answer, [])
    if (!result.ok) throw new Error(`la evaluación falló: ${result.error.kind}`)
    return result.value.careerEffects
  }

  it('produce las tres variantes autoradas', () => {
    expect(instancesOf(definition)).toHaveLength(
      may25ActReference.variants.length,
    )
  })

  it('cada paso tiene una regla escrita y una grilla clasificable', () => {
    for (const instance of instancesOf(definition)) {
      const rounds = roundsOf(instance)
      expect(rounds).toHaveLength(3)

      for (const round of rounds) {
        // La regla siempre está en texto: la consigna nunca puede depender de un
        // color ni de una convención visual.
        expect(round.ruleLabel.length).toBeGreaterThan(0)
        expect(round.cue.length).toBeGreaterThan(0)
        expect(round.numbers).toHaveLength(may25ActReference.columns * 2)
        expect(new Set(round.numbers).size).toBe(round.numbers.length)

        const targets = targetsFor(round.rule, round.numbers)
        // Ni marcar una sola celda ni marcarlas todas puede parecerse a jugar.
        expect(targets.length).toBeGreaterThanOrEqual(2)
        expect(targets.length).toBeLessThanOrEqual(round.numbers.length - 2)
      }

      // Las tres reglas del año aparecen una vez cada una.
      expect(new Set(rounds.map((round) => round.rule))).toEqual(
        new Set(['even', 'multiple-of-three', 'prime']),
      )
    }
  })

  it('las variantes autoradas usan números que se clasifican de memoria', () => {
    for (const variant of may25ActReference.variants) {
      for (const round of variant.rounds) {
        for (const value of round) {
          expect(Number.isSafeInteger(value)).toBe(true)
          expect(value).toBeGreaterThanOrEqual(0)
          expect(value).toBeLessThanOrEqual(30)
        }
      }
    }
  })

  it('la coreografía exacta es óptima y deja Aura positiva', () => {
    for (const instance of instancesOf(definition)) {
      const answer = perfect(instance)
      expect(qualityOf(instance, answer)).toBe('optimal')

      const effects = effectsOf(instance, answer)
      expect(effects.aura ?? 0).toBeGreaterThan(0)
      expect(effects.estilo?.axis).toBe('aplicado')
    }
  })

  it('marcar la grilla entera no alcanza', () => {
    for (const instance of instancesOf(definition)) {
      const answer = answerWith(instance, (round) => round.numbers)
      expect(qualityOf(instance, answer)).toBe('invalid')
      expect(effectsOf(instance, answer).aura ?? 0).toBeLessThan(0)
    }
  })

  it('marcar una sola celda correcta tampoco', () => {
    for (const instance of instancesOf(definition)) {
      const answer = answerWith(instance, (round) =>
        targetsFor(round.rule, round.numbers).slice(0, 1),
      )
      expect(qualityOf(instance, answer)).toBe('invalid')
    }
  })

  it('no marcar nada se evalúa sin romperse', () => {
    for (const instance of instancesOf(definition)) {
      expect(
        qualityOf(
          instance,
          answerWith(instance, () => []),
        ),
      ).toBe('invalid')
      // Y una respuesta sin ninguna ronda equivale a no haber marcado nada.
      expect(qualityOf(instance, { kind: 'number-grid', rounds: [] })).toBe(
        'invalid',
      )
    }
  })

  it('un solo error deja el acto en Resuelto y la Aura positiva', () => {
    for (const instance of instancesOf(definition)) {
      const rounds = roundsOf(instance)
      const first = rounds[0]
      if (first === undefined) throw new Error('sin rondas')

      // Se saltea un objetivo del primer paso y nada más.
      const answer = answerWith(instance, (round) => {
        const targets = targetsFor(round.rule, round.numbers)
        return round.id === first.id ? targets.slice(1) : targets
      })

      expect(qualityOf(instance, answer)).toBe('efficient')
      const effects = effectsOf(instance, answer)
      expect(effects.aura ?? 0).toBeGreaterThan(0)
      expect(effects.estilo?.axis).toBe('estratega')
    }
  })

  it('perder un paso en cada ronda todavía se puede zafar improvisando', () => {
    for (const instance of instancesOf(definition)) {
      // Se pierde un objetivo en cada uno de los tres pasos: 7 de 10 acertados y
      // ninguna marca de más deja el F1 en 14/17 ≈ 0,82, dentro de Parcial.
      const answer = answerWith(instance, (round) =>
        targetsFor(round.rule, round.numbers).slice(1),
      )

      expect(qualityOf(instance, answer)).toBe('functional')
      const effects = effectsOf(instance, answer)
      expect(effects.aura ?? 0).toBeGreaterThan(0)
      expect(effects.estilo?.axis).toBe('improvisador')
    }
  })

  it('el ledger informa objetivos, aciertos, de más y sin marcar', () => {
    const instance = instancesOf(definition)[0]
    if (instance === undefined) throw new Error('sin instancia')

    const rounds = roundsOf(instance)
    const result = instance.evaluate(perfect(instance), [])
    if (!result.ok) throw new Error('la evaluación falló')

    const targetTotal = rounds.reduce(
      (total, round) => total + targetsFor(round.rule, round.numbers).length,
      0,
    )
    const facts = Object.fromEntries(
      result.value.feedback.facts.map((fact) => [fact.label, fact.value]),
    )

    expect(facts['Pasos en la ayudamemoria']).toBe(String(targetTotal))
    expect(facts['Acertaste']).toBe(String(targetTotal))
    expect(facts['De más']).toBe('0')
    expect(facts['Sin marcar']).toBe('0')
    expect(facts['Coreografía']).toBe('100 %')
  })

  it('ningún resultado pone nota ni toca Equipo', () => {
    for (const instance of instancesOf(definition)) {
      const answers: InteractionAnswer[] = [
        perfect(instance),
        answerWith(instance, (round) => round.numbers),
        answerWith(instance, () => []),
        answerWith(instance, (round) =>
          targetsFor(round.rule, round.numbers).slice(1),
        ),
      ]

      for (const answer of answers) {
        const effects = effectsOf(instance, answer)
        // Un acto escolar no es una evaluación de matemática y no se baila en
        // grupo: mueve Aura y Estilo, y nada más.
        expect(effects.grade).toBeUndefined()
        expect(effects.equipo).toBeUndefined()
        expect(effects.aura).toBeDefined()
        expect(effects.estilo).toBeDefined()
      }
    }
  })

  it('cualquier respuesta continúa la partida', () => {
    for (const instance of instancesOf(definition)) {
      for (const answer of [
        perfect(instance),
        answerWith(instance, (round) => round.numbers),
        answerWith(instance, () => []),
      ]) {
        // Nunca hay game over: incluso el peor acto devuelve un resultado.
        expect(instance.evaluate(answer, []).ok).toBe(true)
      }
    }
  })

  it('rechaza un paso que no existe en lugar de ignorarlo', () => {
    const instance = instancesOf(definition)[0]
    if (instance === undefined) throw new Error('sin instancia')

    const result = instance.evaluate(
      { kind: 'number-grid', rounds: [{ roundId: 'paso-99', numbers: [2] }] },
      [],
    )
    expect(result.ok).toBe(false)
  })

  it('rechaza una respuesta de otra familia', () => {
    const instance = instancesOf(definition)[0]
    if (instance === undefined) throw new Error('sin instancia')

    expect(
      instance.evaluate({ kind: 'decision-card', optionId: 'x' }, []).ok,
    ).toBe(false)
  })
})

describe('el acto · marcar todo nunca alcanza', () => {
  const definition = catalog.template('g7.may-25-act' as never)
  if (definition === undefined) throw new Error('falta el desafío')

  it('el umbral del validador es el mismo que el del desafío', () => {
    // El validador de variantes no puede importar el desafío —sería un ciclo—,
    // así que lleva el umbral escrito. Si alguien mueve uno y no el otro, el
    // generador dejaría de proteger la propiedad que cree proteger.
    expect(FUNCTIONAL_THRESHOLD.numerator).toBe(
      may25ActReference.thresholds.functional.n,
    )
    expect(FUNCTIONAL_THRESHOLD.denominator).toBe(
      may25ActReference.thresholds.functional.d,
    )
  })

  /**
   * Las variantes que el catálogo aprobó, no sólo las tres curadas.
   *
   * La propiedad se defiende en el pipeline, que rechaza una coreografía donde
   * marcar todo zafe. Comprobarla acá sobre la población entera es lo que
   * convierte esa defensa en algo verificado y no en algo declarado.
   */
  const approvedActs = grade7VariantCatalog.entries
    .filter((entry) => (entry.templateId as string) === 'g7.may-25-act')
    .map((entry) =>
      materializeVariant(definition, {
        seed: 'content',
        variantId: entry.variantId,
      }),
    )

  it('el catálogo aprobó más coreografías que las tres curadas', () => {
    expect(approvedActs.length).toBeGreaterThan(3)
  })

  it('marcar la grilla entera cae en Insuficiente en toda variante aprobada', () => {
    for (const instance of approvedActs) {
      const presentation = instance.present([])
      if (presentation.kind !== 'number-grid')
        throw new Error('otra interacción')

      const everything: InteractionAnswer = {
        kind: 'number-grid',
        rounds: presentation.rounds.map((round) => ({
          roundId: round.id,
          numbers: [...round.numbers],
        })),
      }

      expect(qualityOf(instance, everything)).toBe('invalid')
    }
  })

  it('ninguna coreografía pasa de doce objetivos', () => {
    for (const instance of approvedActs) {
      const presentation = instance.present([])
      if (presentation.kind !== 'number-grid')
        throw new Error('otra interacción')

      const total = presentation.rounds.reduce(
        (sum, round, index) =>
          sum +
          round.numbers.filter((value) =>
            matchesActRule(ACT_RULES[index] ?? 'even', value),
          ).length,
        0,
      )

      expect(total).toBeLessThanOrEqual(MAX_TOTAL_TARGETS)
      expect(presentation.rounds).toHaveLength(ACT_RULES.length)
      for (const round of presentation.rounds) {
        expect(round.numbers).toHaveLength(CELLS_PER_ROUND)
      }
    }
  })
})

describe('el content set', () => {
  it('declara ocho plantillas y diez storylets', () => {
    // Siete ordinarias más una de recuperación; nueve storylets del arco más el
    // marco del repaso, que la narrativa nunca elige por su cuenta.
    expect(grade7Challenges).toHaveLength(8)
    expect(dependencies.storylets).toHaveLength(10)
  })

  it('sólo una plantilla lleva el rol de recuperación', () => {
    const recovery = grade7Challenges.filter(
      (template) => template.placement === 'recovery',
    )
    expect(recovery.map((template) => template.id)).toEqual([
      'g7.bus-travel-review',
    ])
  })

  it('ejercita seis tipos de interacción distintos', () => {
    const kinds = new Set(
      grade7Challenges.map((definition) => definition.interaction),
    )
    expect(kinds).toEqual(
      new Set([
        'timeline',
        'numeric-input',
        'decision-card',
        'assignment-board',
        'budget-builder',
        'number-grid',
      ]),
    )
  })

  it('no puede declararse oficial mientras las políticas sean de desarrollo', () => {
    expect(dependencies.ruleset.official).toBe(false)
    expect(dependencies.ruleset.scoring.production).toBe(false)
  })

  /*
   * El sello del feedback va rotado y no se encoge, así que a 360 px —el ancho
   * más chico que el sistema sostiene— una palabra de más empuja la hoja fuera
   * de la pantalla. Trece o catorce caracteres entran; diecisiete no, y eso lo
   * descubrió un E2E que sólo fallaba cuando el seed elegía cierta plantilla.
   *
   * El barrido responde con el jugador sintético para llegar a las cuatro
   * bandas de cada desafío, no sólo a la que un test eligió escribir.
   */
  it('ningún sello de resultado desborda la hoja de 360 px', () => {
    const MAX_STAMP = 14
    const stamps = new Set<string>()

    for (const definition of grade7Challenges) {
      for (const instance of instancesOf(definition)) {
        const rng = createRng(toRunSeed('sellos'), [
          'stamp-sweep',
          definition.id,
        ])
        for (let draw = 0; draw < 200; draw += 1) {
          const result = instance.evaluate(
            synthesizeAnswer(instance.present([]), rng),
            [],
          )
          if (result.ok && result.value.feedback.stamp !== undefined) {
            stamps.add(result.value.feedback.stamp)
          }
        }
      }
    }

    // Si el barrido dejara de alcanzar las bandas, el test pasaría sin mirar
    // nada; el piso lo convierte en una falla.
    expect(stamps.size).toBeGreaterThanOrEqual(14)
    for (const stamp of stamps) {
      expect({ stamp, length: stamp.length }).toEqual({
        stamp,
        length: Math.min(stamp.length, MAX_STAMP),
      })
    }
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
