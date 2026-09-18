import { describe, expect, it } from 'vitest'
import { bandOf, cognitiveLoad } from '@/game'
import { materializeVariant } from '@/game/testing'
import {
  PROPORTION_REVIEW_SPACE,
  SECTIONS,
  YEARBOOK_SPACE,
  bestCoverage,
  evaluateProportionReview,
  evaluateYearbook,
  generateProportionReview,
  generateYearbook,
  pagesForAll,
  pagesNeeded,
  proportionCapacityReview,
  proportionReviewGates,
  readYearbook,
  yearbook,
  yearbookGates,
  yearbookPlans,
  type YearbookParams,
} from '@/content/grade-5/challenges/yearbook'
import {
  CROPS,
  SCREEN_ROLES,
  SCREEN_SPACE,
  WAYS,
  cuts,
  evaluateScreen,
  generateScreen,
  keepsProtected,
  moreAirSide,
  overflow,
  reachesThreeQuarters,
  screenChoices,
  screenGates,
  screenRoleGates,
  screenRoleOf,
  screenSchema,
  screenShare,
  shapeOf,
  stageScreen,
  tierOf,
  validCrops,
  type ScreenParams,
} from '@/content/grade-5/challenges/stage-screen'
import {
  NEXT_STEP_SPACE,
  SCENARIOS,
  blockedBy,
  evaluateNextStep,
  fitsScenario,
  generateNextStep,
  nextStepGates,
  nextStepOptions,
  nextStepPlans,
  type NextStepParams,
} from '@/content/grade-5/challenges/next-step-options'

const yearbooks: readonly YearbookParams[] = Array.from(
  { length: YEARBOOK_SPACE },
  (_, index) => generateYearbook(index),
).filter((params) => yearbookGates(params).length === 0)
const screens: readonly ScreenParams[] = Array.from(
  { length: 600 },
  (_, index) => generateScreen(index),
).filter((params) => screenGates(params).length === 0)
const steps: readonly NextStepParams[] = Array.from(
  { length: 600 },
  (_, index) => generateNextStep(index),
).filter((params) => nextStepGates(params).length === 0)

// screenChoices comparte tierOf: sólo prueba agregación. El test RS-MAT-008
// deriva geometría aparte y sí comprueba la verdad (RS-RA-AUDIT-001.7).
describe('5.º · el anuario', () => {
  const sample = yearbooks[0]
  if (sample === undefined) throw new Error('sin variante aprobada')

  it('aprueba un catálogo suficiente y es STANDARD del cluster de egreso', () => {
    expect(yearbooks.length).toBeGreaterThanOrEqual(24)
    expect(yearbook.band).toBe('standard')
    expect(bandOf(yearbook.cognitive)).toBe('standard')
    expect(cognitiveLoad(yearbook.cognitive)).toBeLessThanOrEqual(7)
    expect(yearbook.composition).toMatchObject({
      interactionEngine: 'allocate-constrain',
      eventCluster: 'egreso',
    })
  })

  it('LOCKED: ni el reparto igualitario ni el proporcional son la respuesta', () => {
    for (const params of yearbooks.slice(0, 40)) {
      const equal = Math.floor(params.pages / SECTIONS.length)
      const equalLines = SECTIONS.map((entry, index) => ({
        itemId: entry.id,
        quantity:
          index === 0 ? params.pages - equal * (SECTIONS.length - 1) : equal,
      }))
      expect(readYearbook(params, equalLines).quality).not.toBe('optimal')
      // Y el material no entra entero: hay que decidir qué sección se completa.
      const needed = SECTIONS.reduce(
        (total, _, index) => total + pagesForAll(params, index),
        0,
      )
      expect(needed).toBeGreaterThan(params.pages)
      expect(bestCoverage(params)).toBeGreaterThanOrEqual(2)
    }
  })

  it('el total tiene que dar exacto y los mínimos se respetan', () => {
    const plans = yearbookPlans(sample)
    for (const plan of plans.filter((entry) => entry.quality !== 'invalid')) {
      const used = plan.lines.reduce((total, line) => total + line.quantity, 0)
      expect(used).toBe(sample.pages)
    }
    const short = SECTIONS.map((entry, index) => ({
      itemId: entry.id,
      quantity: index === 0 ? 0 : Math.floor(sample.pages / 3),
    }))
    expect(evaluateYearbook(sample, short).ok).toBe(true)
    const result = evaluateYearbook(sample, short)
    if (result.ok) expect(result.value.quality).toBe('invalid')
  })

  it('el Repaso sube al entero: lo que sobra también ocupa una página', () => {
    const reviews = Array.from(
      { length: PROPORTION_REVIEW_SPACE },
      (_, index) => generateProportionReview(index),
    ).filter((params) => proportionReviewGates(params).length === 0)
    expect(reviews.length).toBeGreaterThanOrEqual(12)
    const params = reviews[0]
    if (params === undefined) throw new Error('sin variante aprobada')
    const exact = pagesNeeded(params)
    expect((exact - 1) * params.perPage).toBeLessThan(params.items)
    const right = evaluateProportionReview(params, String(exact))
    expect(right.ok && right.value.quality).toBe('optimal')
    const down = evaluateProportionReview(params, String(exact - 1))
    expect(down.ok && down.value.quality).toBe('functional')
    expect(proportionCapacityReview.placement).toBe('recovery')
  })
})

describe('5.º · la pantalla del acto', () => {
  const sample = screens[0]
  if (sample === undefined) throw new Error('sin variante aprobada')
  const optimalOf = (p: ScreenParams) =>
    screenChoices(p).find((choice) => choice.quality === 'optimal')?.wayId

  it('aprueba un catálogo suficiente y es el STRETCH rápido del año', () => {
    expect(screens.length).toBeGreaterThanOrEqual(24)
    expect(SCREEN_SPACE).toBeGreaterThan(600)
    expect(stageScreen.band).toBe('stretch')
    expect(bandOf(stageScreen.cognitive)).toBe('stretch')
    expect(cognitiveLoad(stageScreen.cognitive)).toBeGreaterThan(7)
    expect(stageScreen.composition).toMatchObject({
      primaryReasoningFamily: 'SPATIAL',
      pacingClass: 'QUICK',
      eventCluster: 'egreso',
    })
    expect(WAYS).toHaveLength(6)
  })

  it('RS-MAT-008: la validez se decide con enteros, en el borde exacto del aire', () => {
    // Construida a mano: al llenar el ancho sobran 20 cm de imagen, así que el
    // recorte de un lado pide 20 cm de aire y el del medio, 10 de cada lado.
    const base = {
      shape: 'aire-parejo' as const,
      screenWidth: 300,
      screenHeight: 200,
      imageWidth: 150,
      imageHeight: 120,
      banner: 10,
      date: 8,
    }
    expect(
      overflow(screenSchema.parse({ ...base, bannerAir: 10, dateAir: 10 })),
    ).toBe(120 * 300 - 200 * 150)
    const at = (bannerAir: number, dateAir: number) =>
      screenSchema.parse({ ...base, bannerAir, dateAir })
    // Justo: 10 cm de cada lado alcanzan para el recorte del medio.
    expect(keepsProtected(at(10, 10), 'ancho-centro')).toBe(true)
    // Un centímetro menos y ya no: el borde decide, sin tolerancias.
    expect(keepsProtected(at(9, 10), 'ancho-centro')).toBe(false)
    expect(keepsProtected(at(10, 9), 'ancho-centro')).toBe(false)
    // Recortar todo de un lado pide el doble de aire de ese lado.
    expect(keepsProtected(at(20, 1), 'ancho-arriba')).toBe(true)
    expect(keepsProtected(at(19, 1), 'ancho-arriba')).toBe(false)
    expect(keepsProtected(at(1, 20), 'ancho-abajo')).toBe(true)
    // Estirar nunca es válida, y las que no recortan nunca tocan nada.
    expect(keepsProtected(at(1, 1), 'estirar')).toBe(false)
    expect(keepsProtected(at(1, 1), 'entera')).toBe(true)
    expect(keepsProtected(at(1, 1), 'sin-agrandar')).toBe(true)
    expect(cuts(at(10, 10), 'ancho-arriba').bottom).toBe(0)
    expect(cuts(at(10, 10), 'ancho-abajo').top).toBe(0)
  })

  it('RS-MAT-008: los tres recortes usan la misma pantalla, así que la óptima es única', () => {
    for (const params of screens.slice(0, 60)) {
      const shares = CROPS.map((way) => screenShare(params, way))
      for (const share of shares)
        expect(share.num * shares[0]!.den).toBe(shares[0]!.num * share.den)
      expect(
        screenChoices(params).filter((choice) => choice.quality === 'optimal'),
      ).toHaveLength(1)
      // Y por eso ninguna variante aprobada puede tener dos recortes válidos.
      expect(validCrops(params).length).toBeLessThanOrEqual(1)
    }
  })

  it('RS-MAT-008: la escalera coincide con un oráculo independiente', () => {
    for (const params of screens.slice(0, 60))
      for (const way of WAYS) {
        // Oráculo escrito de nuevo acá: válida es no deformar y no pasarse del
        // aire de cada lado; entre las válidas manda cuánta pantalla usan.
        const valid = WAYS.filter((entry) => keepsProtected(params, entry.id))
        const best = valid.reduce(
          (current, entry) =>
            screenShare(params, entry.id).num * current.den >
            current.num * screenShare(params, entry.id).den
              ? screenShare(params, entry.id)
              : current,
          { num: 0, den: 1 },
        )
        const share = screenShare(params, way.id)
        const expected = !keepsProtected(params, way.id)
          ? 'invalid'
          : share.num * best.den === best.num * share.den
            ? 'optimal'
            : reachesThreeQuarters(share)
              ? 'efficient'
              : 'functional'
        expect(tierOf(params, way.id), `${params.shape}/${way.id}`).toBe(
          expected,
        )
        const result = evaluateScreen(params, way.id)
        expect(result.ok).toBe(true)
        if (result.ok) expect(result.value.quality).toBe(expected)
      }
    expect(evaluateScreen(sample, 'girarla').ok).toBe(false)
  })

  it('RS-MAT-008 · IM-1: mover ±15 % el aire cambia la validez de algún recorte', () => {
    for (const params of screens.slice(0, 60)) {
      const base = CROPS.map((way) => keepsProtected(params, way)).join('')
      const moved = [115, 85].map((factor) =>
        CROPS.map((way) => {
          const cut = cuts(params, way)
          return (
            cut.top * 100 <=
              2 * params.bannerAir * factor * params.screenWidth &&
            cut.bottom * 100 <= 2 * params.dateAir * factor * params.screenWidth
          )
        }).join(''),
      )
      expect(
        moved.some((entry) => entry !== base),
        params.shape,
      ).toBe(true)
    }
  })

  it('RS-MAT-008 · punto 10: «entera» nunca queda pegada al 75 % de la pantalla', () => {
    for (const params of screens.slice(0, 60)) {
      const share = screenShare(params, 'entera')
      const low = share.num * 20 <= share.den * 14
      const high = share.num * 5 >= share.den * 4
      expect(low || high, params.shape).toBe(true)
    }
  })

  it('RS-MAT-008 · D-S08-114: «entera» nunca baja de efficient, y por eso el techo es 78', () => {
    // El piso de estrategia ciega de esta Template: «entera» no recorta nada,
    // así que siempre es válida, y donde algún recorte vale la escalera la deja
    // en efficient. Sobre todo el espacio de direcciones aprobables.
    for (const params of screens) {
      const tier = tierOf(params, 'entera')
      expect(['optimal', 'efficient']).toContain(tier)
      expect(tier === 'optimal').toBe(validCrops(params).length === 0)
    }
  })

  it('RS-MAT-008: el witness estricto sólo se relaja donde ningún recorte es válido', () => {
    let exempt = 0
    for (const params of screens) {
      const tiers = new Set(
        screenChoices(params).map((choice) => choice.quality),
      )
      expect(tiers.has('optimal')).toBe(true)
      expect(tiers.has('invalid')).toBe(true)
      if (validCrops(params).length > 0) {
        // Con un recorte válido, los tres niveles no inválidos siguen estando.
        expect(tiers.has('efficient')).toBe(true)
        expect(tiers.has('functional')).toBe(true)
      } else {
        // Sin recorte válido falta uno solo de los dos del medio, nunca los dos.
        expect(tiers.has('efficient') || tiers.has('functional')).toBe(true)
        exempt += 1
      }
    }
    expect(exempt).toBeGreaterThan(0)
  })

  it('el papel de cada dirección reparte la óptima como pide el techo', () => {
    expect(SCREEN_ROLES).toHaveLength(25)
    for (let index = 0; index < SCREEN_ROLES.length; index++) {
      const params = generateScreen(index)
      expect(screenGates(params), String(index)).toEqual([])
      expect(screenRoleGates(params, index), String(index)).toEqual([])
      const role = screenRoleOf(index)
      expect(shapeOf(params)).toBe(
        role === 'sin-aire-grande' ? 'sin-aire' : role,
      )
    }
    // Las veinticinco direcciones del ciclo son variantes distintas.
    const tuples = new Set(
      Array.from({ length: SCREEN_ROLES.length }, (_, index) =>
        JSON.stringify(generateScreen(index)),
      ),
    )
    expect(tuples.size).toBe(SCREEN_ROLES.length)
  })

  it('la respuesta correcta cambia según dónde alcanza el aire', () => {
    const winners = new Set(screens.slice(0, 60).map(optimalOf))
    expect(winners.size).toBeGreaterThanOrEqual(3)
    expect(winners.has('estirar')).toBe(false)
    expect(winners.has('sin-agrandar')).toBe(false)
  })

  it('LOCKED: toda la geometría está dada y no hay jerga audiovisual', () => {
    const instance = materializeVariant(stageScreen, {
      variantId: stageScreen.variants[0]!,
      seed: 'pantalla',
    })
    const view = instance.present([])
    if (view.kind !== 'decision-card') throw new Error('vista inesperada')
    expect(view.options).toHaveLength(6)
    const all = JSON.stringify([instance.narrative, view]).toLowerCase()
    for (const forbidden of [
      '16:9',
      '4:3',
      'aspect',
      'relación de aspecto',
      'letterbox',
    ])
      expect(all).not.toContain(forbidden)
    // La consigna dice el objetivo completo (punto 5).
    expect(instance.narrative.goal).toContain('lo más grande posible')
    expect(instance.narrative.goal).toContain('sin deformarla')
    expect(instance.narrative.goal).toContain(
      'sin cortar el cartel ni la fecha',
    )
    // El detalle de cada opción dice el tamaño que queda y nada más: ni cuánto
    // recorta, ni si el cartel o la fecha sobreviven (punto 11).
    const details = view.options
      .map((option) => option.detail ?? '')
      .join(' | ')
    for (const forbidden of ['recorta', 'cartel', 'fecha', 'entero'])
      expect(details.toLowerCase()).not.toContain(forbidden)
    expect(moreAirSide(sample)).toBeDefined()
  })
})

describe('5.º · el año que viene', () => {
  const sample = steps[0]
  if (sample === undefined) throw new Error('sin variante aprobada')

  it('aprueba un catálogo suficiente y es el CORE del año', () => {
    expect(steps.length).toBeGreaterThanOrEqual(24)
    expect(NEXT_STEP_SPACE).toBeGreaterThan(600)
    expect(nextStepOptions.band).toBe('core')
    expect(bandOf(nextStepOptions.cognitive)).toBe('core')
    expect(cognitiveLoad(nextStepOptions.cognitive)).toBeLessThanOrEqual(4)
  })

  it('LOCKED: sólo se evalúa viabilidad; la preferencia no puntúa nunca', () => {
    expect(nextStepOptions.scoring?.team).toBe('none')
    expect(nextStepOptions.scoring?.aura).toBe('none')
    const truth = SCENARIOS.map((entry, index) => ({
      statementId: entry.id,
      labelId: fitsScenario(sample, index) ? 'entra' : 'no-entra',
    }))
    const preferences = [...SCENARIOS.map((entry) => entry.id), 'sin-decidir']
    const results = preferences.map((preference) => {
      const result = evaluateNextStep(sample, truth, preference)
      if (!result.ok) throw new Error('evaluación rechazada')
      return result.value
    })
    // Ninguna preferencia cambia la calidad, ni mueve carrera de ninguna forma.
    expect(new Set(results.map((entry) => entry.quality))).toEqual(
      new Set(['optimal']),
    )
    for (const result of results) {
      expect(result.careerEffects.aura).toBeUndefined()
      expect(result.careerEffects.equipo).toBeUndefined()
      expect(result.careerEffects.estilo).toBeUndefined()
      expect(Object.keys(result.careerEffects)).toHaveLength(0)
    }
    // Y queda registrada, que es lo único que hace.
    expect(
      results[0]?.flagEffects.some(
        (effect) => effect.flag === 'y5.nextStep.preference',
      ),
    ).toBe(true)
  })

  it('compara escenarios ya escritos: no hay nada que construir', () => {
    for (const params of steps.slice(0, 40)) {
      const viable = SCENARIOS.filter((_, index) =>
        fitsScenario(params, index),
      ).length
      expect(viable).toBeGreaterThanOrEqual(2)
      expect(viable).toBeLessThan(SCENARIOS.length)
      const reasons = new Set(
        SCENARIOS.map((_, index) => blockedBy(params, index)).filter(
          (reason) => reason !== undefined,
        ),
      )
      expect(reasons.size).toBeGreaterThanOrEqual(2)
    }
  })

  it('marcar como viable algo que no entra es el error que invalida', () => {
    const impossible = SCENARIOS.findIndex(
      (_, index) => !fitsScenario(sample, index),
    )
    const entries = SCENARIOS.map((entry, index) => ({
      statementId: entry.id,
      labelId:
        index === impossible
          ? 'entra'
          : fitsScenario(sample, index)
            ? 'entra'
            : 'no-entra',
    }))
    const result = evaluateNextStep(sample, entries, 'sin-decidir')
    expect(result.ok && result.value.quality).toBe('invalid')
    expect(
      nextStepPlans(sample).some((plan) => plan.quality === 'optimal'),
    ).toBe(true)
    expect(evaluateNextStep(sample, entries, 'irme-de-viaje').ok).toBe(false)
  })
})
