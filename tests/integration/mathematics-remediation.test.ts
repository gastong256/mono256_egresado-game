/**
 * Evidencia de los contratos de remediación matemática que no tienen un test
 * propio de Template, y del inventario de feedback afirmativo.
 *
 * Contrato: `docs/04-quality/mathematics-remediation-spec.md`.
 */
import { describe, expect, it } from 'vitest'
import type { ApprovedVariantCatalog, EngineDependencies } from '@/game'
import { materializeVariant } from '@/game/testing'
import { createGrade7Dependencies } from '@/content/grade-7'
import { grade7VariantCatalogs } from '@/content/grade-7/variant-catalogs'
import {
  createGrade1Dependencies,
  grade1VariantCatalog,
} from '@/content/grade-1'
import {
  createGrade2Dependencies,
  grade2VariantCatalog,
} from '@/content/grade-2'
import {
  createGrade3Dependencies,
  grade3VariantCatalog,
} from '@/content/grade-3'
import {
  createGrade4Dependencies,
  grade4VariantCatalog,
} from '@/content/grade-4'
import {
  createGrade5Dependencies,
  grade5VariantCatalog,
} from '@/content/grade-5'
import {
  requiredCentilitres,
  smallestSufficientTin,
} from '@/content/grade-7/challenges/mural-paint.variants'
import { notebookOffer } from '@/content/grade-7/challenges/notebook-offer'
import {
  PROPOSALS,
  evaluateRepresent,
  fits,
  representSchema,
} from '@/content/grade-4/challenges/represent-class'
import {
  SCENARIOS,
  blockedBy,
  evaluateNextStep,
  fitsScenario,
  nextStepOptions,
  nextStepSchema,
} from '@/content/grade-5/challenges/next-step-options'
import {
  TASKS,
  finalPlans,
  finalSchema,
  readFinal,
} from '@/content/grade-5/challenges/course-project-final'
import {
  breakEvenTrips,
  evaluateReview as evaluateFixedVariableReview,
  reviewSchema as fixedVariableReviewSchema,
} from '@/content/grade-3/challenges/transport-pass'
import {
  evaluateMarginReview,
  marginReviewSchema,
  traysToBreakEven,
  courseProjectFundraiser,
} from '@/content/grade-4/challenges/course-project-fundraiser'
import {
  evaluateRateReview,
  fitsWhole,
  rateReviewSchema,
} from '@/content/grade-3/challenges/course-project-tech'
import {
  capacityReviewSchema,
  evaluateCapacityReview,
  seatsThatFit,
} from '@/content/grade-4/challenges/event-floor-plan'
import {
  evaluateProportionReview,
  pagesNeeded,
  proportionReviewSchema,
} from '@/content/grade-5/challenges/yearbook'
import {
  comparisonReviewSchema,
  evaluateComparisonReview,
  evaluateTrip,
  tripChoices,
  tripSchema,
  totalWithBus,
} from '@/content/grade-5/challenges/final-trip'
import {
  courtPlans,
  courtSchema,
  evaluateCourt,
} from '@/content/grade-2/challenges/court-zones'
import {
  evaluateFlow,
  flowPlans,
  flowSchema,
  usedHelpers,
} from '@/content/grade-4/challenges/school-event-flow'
import {
  evaluateScreen,
  project,
  screenSchema,
  tierOf as screenTierOf,
  WAYS,
} from '@/content/grade-5/challenges/stage-screen'
import { publishedParams } from '../helpers/published-params'

const grade5 = createGrade5Dependencies()
const published = <P>(
  templateId: string,
  parse: (params: unknown) => P,
  dependencies: EngineDependencies = grade5,
  catalog: ApprovedVariantCatalog = grade5VariantCatalog,
) => publishedParams(dependencies, catalog, templateId, parse)

describe('RS-MAT-006 · el mural reparte 2 L y 4 L en todo catálogo publicado', () => {
  const catalogs: [string, EngineDependencies, ApprovedVariantCatalog][] = [
    [
      'grade-7-dev-6',
      createGrade7Dependencies(),
      grade7VariantCatalogs['grade-7-dev-6']!,
    ],
    ['grade-1', createGrade1Dependencies(), grade1VariantCatalog],
    ['grade-2', createGrade2Dependencies(), grade2VariantCatalog],
    ['grade-3', createGrade3Dependencies(), grade3VariantCatalog],
    ['grade-4', createGrade4Dependencies(), grade4VariantCatalog],
    ['grade-5', grade5, grade5VariantCatalog],
  ]
  it.each(catalogs)('%s', (_, dependencies, catalog) => {
    const walls = publishedParams(
      dependencies,
      catalog,
      'g7.mural-paint',
      (params) => params as { width: string; height: string; coverage: number },
    )
    const tins = walls.map((wall) => smallestSufficientTin(wall))
    const two = tins.filter((tin) => tin === 2).length
    const four = tins.filter((tin) => tin === 4).length
    expect(two + four).toBe(walls.length)
    for (const count of [two, four]) {
      expect(count * 100).toBeGreaterThanOrEqual(walls.length * 45)
      expect(count * 100).toBeLessThanOrEqual(walls.length * 55)
    }
    // La lata de 1 L sigue sin alcanzar nunca: la promesa del mural no cambió.
    for (const wall of walls)
      expect(requiredCentilitres(wall)).toBeGreaterThan(100)
  })

  it('grade-7-dev-5 queda publicado tal como estaba', () => {
    expect(grade7VariantCatalogs['grade-7-dev-5']?.contentVersion).toBe(
      '0.9.0-grade-7',
    )
  })
})

describe('RS-NEW-002 · la notebook explica la comparación verdadera', () => {
  it('en toda variante publicada de 7.º, el texto de acierto nombra el descuento que de verdad era mayor', () => {
    const catalog = grade7VariantCatalogs['grade-7-dev-6']!
    const entries = catalog.entries.filter(
      (entry) => (entry.templateId as string) === 'g7.notebook-offer',
    )
    expect(entries.length).toBeGreaterThanOrEqual(24)
    let fixedWins = 0
    for (const entry of entries) {
      const instance = materializeVariant(notebookOffer, {
        variantId: entry.variantId,
        seed: 'notebook',
      })
      const view = instance.present([])
      if (view.kind !== 'decision-card') throw new Error('vista inesperada')
      const optimal = view.options
        .map((option) => ({
          option,
          result: instance.evaluate(
            { kind: 'decision-card', optionId: option.id },
            [],
          ),
        }))
        .find(({ result }) => result.ok && result.value.quality === 'optimal')
      if (optimal === undefined || !optimal.result.ok)
        throw new Error('sin óptima')
      const text = optimal.result.value.feedback.optimalComparison ?? ''
      if (optimal.option.id === 'oferta-fija') {
        fixedWins += 1
        expect(text).toContain('convenía el descuento fijo')
      } else expect(text).toContain('convenía el porcentaje')
      expect(text).not.toContain('aunque sonara al revés')
    }
    expect(fixedWins).toBeGreaterThan(0)
  })
})

describe('RS-MAT-007 · el consejo escolar', () => {
  const councils = published(
    'y4.represent-class',
    (params) => representSchema.parse(params),
    createGrade4Dependencies(),
    grade4VariantCatalog,
  )

  it('toda variante publicada tiene al menos dos propuestas viables', () => {
    expect(councils.length).toBeGreaterThanOrEqual(20)
    for (const p of councils)
      expect(
        PROPOSALS.filter((_, index) => fits(p, index)).length,
      ).toBeGreaterThanOrEqual(2)
  })

  it('no llevar nada nunca llega a efficient, y la consecuencia no narra una presentación', () => {
    for (const p of councils) {
      const result = evaluateRepresent(
        p,
        PROPOSALS.map((proposal) => ({
          statementId: proposal.id,
          labelId: 'no-entra',
        })),
        'del-curso',
      )
      if (!result.ok) throw new Error('rechazo inesperado')
      expect(result.value.quality).toBe('functional')
      expect(result.value.feedback.consequence).toContain(
        'no llevó ninguna propuesta',
      )
    }
  })
})

describe('RS-MAT-009 · el año que viene', () => {
  const steps = published('y5.next-step-options', (params) =>
    nextStepSchema.parse(params),
  )

  it('cada escenario entra en al menos el 25 % y queda afuera en al menos el 25 %', () => {
    expect(steps.length).toBeGreaterThanOrEqual(20)
    SCENARIOS.forEach((_, index) => {
      const viable = steps.filter((p) => fitsScenario(p, index)).length
      expect(viable * 4).toBeGreaterThanOrEqual(steps.length)
      expect((steps.length - viable) * 4).toBeGreaterThanOrEqual(steps.length)
    })
  })

  it('MAT-AJ-NEW-007: alguna opción de estudio entra en al menos la mitad de las variantes', () => {
    const study = steps.filter((p) => fitsScenario(p, 0) || fitsScenario(p, 1))
    expect(study.length * 2).toBeGreaterThanOrEqual(steps.length)
  })

  it('MAT-AJ-NEW-007: lo que deja afuera a cada opción de estudio se reparte entre los tres datos', () => {
    for (const index of [0, 1]) {
      const reasons = steps
        .map((p) => blockedBy(p, index))
        .filter((reason) => reason !== undefined)
      for (const reason of ['horas', 'viaje', 'dia'] as const)
        expect(
          reasons.filter((entry) => entry === reason).length * 100,
        ).toBeLessThanOrEqual(reasons.length * 60)
    }
  })

  it('las horas incluyen el viaje, dicho en pantalla, y alcanzan para el viaje de cada día', () => {
    for (const p of steps)
      for (const scenario of p.scenarios)
        expect(scenario.hours * 60).toBeGreaterThanOrEqual(
          scenario.days.filter(Boolean).length * (scenario.travel + 60),
        )
    const entry = grade5VariantCatalog.entries.find(
      (candidate) =>
        (candidate.templateId as string) === 'y5.next-step-options',
    )!
    const view = materializeVariant(nextStepOptions, {
      variantId: entry.variantId,
      seed: 'horas',
    }).present([])
    if (view.kind !== 'classification') throw new Error('vista inesperada')
    expect(view.instructions).toContain('ya incluyen el viaje')
    for (const statement of view.statements)
      expect(statement.detail).toContain('con el viaje incluido')
    const text = JSON.stringify(view)
    expect(text).not.toMatch(/\bmie\b/u)
  })

  it('la preferencia sigue sin puntuar', () => {
    const p = steps[0]!
    const truth = SCENARIOS.map((scenario, index) => ({
      statementId: scenario.id,
      labelId: fitsScenario(p, index) ? 'entra' : 'no-entra',
    }))
    for (const preference of [...SCENARIOS.map((s) => s.id), 'sin-decidir']) {
      const result = evaluateNextStep(p, truth, preference)
      if (!result.ok) throw new Error('rechazo inesperado')
      expect(result.value.quality).toBe('optimal')
      expect(Object.keys(result.value.careerEffects)).toHaveLength(0)
    }
  })
})

describe('RS-NEW-001 · la muestra final', () => {
  const finals = published('y5.course-project-final', (params) =>
    finalSchema.parse(params),
  )
  const shareAll = TASKS.map((task) => ({
    statementId: task.id,
    labelId: 'repartir',
  }))

  it('repartir todo es óptimo en a lo sumo el 30 % del catálogo', () => {
    expect(finals.length).toBeGreaterThanOrEqual(20)
    const optimal = finals.filter(
      (p) => readFinal(p, shareAll).quality === 'optimal',
    )
    expect(optimal.length * 100).toBeLessThanOrEqual(finals.length * 30)
  })

  it('en la mayoría de las variantes repartir parejo le da a alguien más horas de las que tiene', () => {
    const overloaded = finals.filter((p) => {
      const read = readFinal(p, shareAll)
      return read.loads.some((load, index) => load > (p.available[index] ?? 0))
    })
    expect(overloaded.length * 2).toBeGreaterThan(finals.length)
  })

  it('entre los planes óptimos aparecen mantener y repartir, y recortar aparece entre los válidos', () => {
    const optimal = new Set<string>()
    const valid = new Set<string>()
    for (const p of finals)
      for (const plan of finalPlans(p)) {
        if (plan.quality === 'invalid') continue
        for (const entry of plan.entries) valid.add(entry.labelId)
        if (plan.quality === 'optimal')
          for (const entry of plan.entries) optimal.add(entry.labelId)
      }
    expect(optimal).toEqual(new Set(['mantener', 'repartir']))
    expect(valid).toEqual(new Set(['mantener', 'repartir', 'recortar']))
  })

  it('STOP RS-NEW-001 criterio 3: la escalera hace imposible un plan óptimo que recorte', () => {
    // Óptimo es «sobrevive todo lo no esencial» y recortar algo esencial es
    // inválido: un plan con «recortar» nunca es óptimo, en ninguna variante.
    for (const p of finals)
      for (const plan of finalPlans(p))
        if (plan.entries.some((entry) => entry.labelId === 'recortar'))
          expect(plan.quality).not.toBe('optimal')
  })

  it.todo(
    'RS-NEW-001 criterio 3: las tres disposiciones entre los planes óptimos — BLOQUEADO por STOP',
  )

  it('el witness de Math óptima con los tres acuerdos del grupo sigue en toda variante', () => {
    for (const p of finals)
      expect(
        finalPlans(p).some(
          (plan) => plan.quality === 'optimal' && plan.team === 3,
        ),
      ).toBe(true)
  })
})

describe('RS-NEW-003 · los Repasos numéricos dicen hacia dónde fue el error', () => {
  const direction = (answered: number, exact: number) =>
    answered < exact ? 'debajo' : 'encima'

  function sweep<P>(
    templateId: string,
    parse: (params: unknown) => P,
    exactOf: (p: P) => number,
    evaluate: (p: P, value: string) => ReturnType<typeof evaluateMarginReview>,
    below: string,
    above: string,
    dependencies: EngineDependencies,
    catalog: ApprovedVariantCatalog,
  ) {
    const reviews = publishedParams(dependencies, catalog, templateId, parse)
    expect(reviews.length).toBeGreaterThanOrEqual(12)
    let checked = 0
    for (const p of reviews) {
      const exact = exactOf(p)
      for (let answered = 0; answered <= Math.max(99, exact * 3); answered++) {
        if (answered === exact) continue
        const result = evaluate(p, String(answered))
        if (!result.ok) continue
        const text = result.value.feedback.consequence ?? ''
        if (direction(answered, exact) === 'debajo') {
          expect(text).toContain(below)
          expect(text).not.toContain(above)
        } else {
          expect(text).toContain(above)
          expect(text).not.toContain(below)
        }
        checked += 1
      }
    }
    expect(checked).toBeGreaterThan(reviews.length * 10)
  }

  it('y3.fixed-variable-review', () => {
    sweep(
      'y3.fixed-variable-review',
      (x) => fixedVariableReviewSchema.parse(x),
      breakEvenTrips,
      evaluateFixedVariableReview,
      'más adelante de lo que dijiste',
      'desde antes de lo que dijiste',
      createGrade3Dependencies(),
      grade3VariantCatalog,
    )
  })

  it('y4.margin-review', () => {
    sweep(
      'y4.margin-review',
      (x) => marginReviewSchema.parse(x),
      traysToBreakEven,
      evaluateMarginReview,
      'cree que ya cubrió',
      'se cubría con menos bandejas',
      createGrade4Dependencies(),
      grade4VariantCatalog,
    )
  })

  it('y3.rate-capacity-review', () => {
    sweep(
      'y3.rate-capacity-review',
      (x) => rateReviewSchema.parse(x),
      fitsWhole,
      evaluateRateReview,
      'Entra más de lo que contaste',
      'Contar de más',
      createGrade3Dependencies(),
      grade3VariantCatalog,
    )
  })

  it('y4.spatial-capacity-review', () => {
    sweep(
      'y4.spatial-capacity-review',
      (x) => capacityReviewSchema.parse(x),
      seatsThatFit,
      evaluateCapacityReview,
      'Entra más gente de la que contaste',
      'Contar de más',
      createGrade4Dependencies(),
      grade4VariantCatalog,
    )
  })

  it('y5.proportion-capacity-review', () => {
    sweep(
      'y5.proportion-capacity-review',
      (x) => proportionReviewSchema.parse(x),
      pagesNeeded,
      evaluateProportionReview,
      'páginas de menos',
      'se pidieron de más',
      grade5,
      grade5VariantCatalog,
    )
  })

  it('y5.multi-option-comparison-review, alrededor del total exacto y del error de sumar el micro una vez', () => {
    const reviews = published('y5.multi-option-comparison-review', (x) =>
      comparisonReviewSchema.parse(x),
    )
    for (const p of reviews) {
      const exact = totalWithBus(p)
      for (const answered of [
        exact - p.perPerson * 2,
        exact - 1,
        p.packagePrice + p.perPerson,
        exact + 1,
        exact + p.perPerson * 2,
      ]) {
        const result = evaluateComparisonReview(p, String(answered))
        if (!result.ok) throw new Error('rechazo inesperado')
        const text = result.value.feedback.consequence ?? ''
        expect(text).toContain(
          answered < exact ? 'deja afuera parte del micro' : 'suma de más',
        )
      }
    }
  })
})

describe('RS-MAT-011 · la consigna de la peña', () => {
  it('nombra las tres condiciones en orden, el punto de equilibrio con su significado y el supuesto de venta', () => {
    const entry = grade4VariantCatalog.entries.find(
      (candidate) =>
        (candidate.templateId as string) === 'y4.course-project-fundraiser',
    )!
    const instance = materializeVariant(courseProjectFundraiser, {
      variantId: entry.variantId,
      seed: 'consigna',
    })
    const goal = instance.narrative.goal
    const first = goal.indexOf('no perder plata')
    const second = goal.indexOf('llegar al objetivo')
    const third = goal.indexOf('llegar con el colchón')
    expect(first).toBeGreaterThanOrEqual(0)
    expect(second).toBeGreaterThan(first)
    expect(third).toBeGreaterThan(second)
    const view = instance.present([])
    if (view.kind !== 'quantity-builder') throw new Error('vista inesperada')
    expect(view.instructions).toContain('todo lo que se prepara se vende')
    expect(view.instructions).toContain('punto de equilibrio')
    expect(view.instructions).toContain(
      'lo que dejan las bandejas vendidas alcance para pagar el costo fijo',
    )
    expect(view.instructions).not.toContain('se venda o no')
  })
})

describe('inventario de feedback afirmativo · correcciones en el mismo alcance', () => {
  it('y2.court-zones: el óptimo no dice «lo más separadas que permite la cancha»', () => {
    const courts = published(
      'y2.court-zones',
      (x) => courtSchema.parse(x),
      createGrade2Dependencies(),
      grade2VariantCatalog,
    )
    for (const p of courts) {
      const optimal = courtPlans(p).find((plan) => plan.quality === 'optimal')!
      const result = evaluateCourt(p, optimal.placements)
      if (!result.ok) throw new Error('rechazo inesperado')
      expect(optimal.spread).toBeGreaterThanOrEqual(p.apart + 2)
      expect(result.value.feedback.consequence).toContain(
        'dos celdas o más de separación sobre lo pedido',
      )
    }
  }, 60_000)

  it('y4.school-event-flow: el inválido no afirma que no entra nadie y distingue ayudantes que no hay', () => {
    const flows = published(
      'y4.school-event-flow',
      (x) => flowSchema.parse(x),
      createGrade4Dependencies(),
      grade4VariantCatalog,
    )
    for (const p of flows) {
      for (const plan of flowPlans(p).filter((x) => x.quality === 'invalid')) {
        const result = evaluateFlow(p, plan.lines)
        if (!result.ok) throw new Error('rechazo inesperado')
        const text = result.value.feedback.consequence ?? ''
        if (usedHelpers(plan.lines) > p.helpers)
          expect(text).toContain('ayudantes que no hay')
        else expect(text).toContain('no todas las')
      }
    }
  })

  it('y5.final-trip-or-event: la consecuencia funcional nombra todo lo que falta', () => {
    const trips = published('y5.final-trip-or-event', (x) =>
      tripSchema.parse(x),
    )
    for (const p of trips)
      tripChoices(p).forEach((choice, index) => {
        if (choice.quality !== 'functional') return
        const offer = p.offers[index]!
        const result = evaluateTrip(p, choice.packageId)
        if (!result.ok) throw new Error('rechazo inesperado')
        const text = result.value.feedback.consequence ?? ''
        if (!offer.micro) expect(text).toContain('el micro')
        if (!offer.comidas) expect(text).toContain('las comidas')
      })
  })

  it('y5.stage-screen: la restricción violada nombra el lado donde está el cartel', () => {
    const screens = published('y5.stage-screen', (x) => screenSchema.parse(x))
    for (const p of screens)
      for (const way of WAYS) {
        if (way.id === 'estirar' || screenTierOf(p, way.id) !== 'invalid')
          continue
        const result = evaluateScreen(p, way.id)
        if (!result.ok) throw new Error('rechazo inesperado')
        expect(result.value.feedback.violatedConstraint).toBe(
          `El recorte de ${p.bannerAt} se come el cartel del curso.`,
        )
      }
  })

  it('y5.stage-screen: «bandas al costado» y «media pantalla vacía» son ciertos donde se muestran', () => {
    const screens = published('y5.stage-screen', (x) => screenSchema.parse(x))
    for (const p of screens)
      for (const way of WAYS) {
        const quality = screenTierOf(p, way.id)
        if (quality !== 'efficient' && quality !== 'functional') continue
        const shown = project(p, way.id)
        const used = shown.shownWidth * shown.shownHeight
        const screen = p.screenWidth * p.screenHeight
        if (quality === 'efficient') {
          // Bandas a los costados y ninguna arriba o abajo.
          expect(shown.shownWidth).toBeLessThan(p.screenWidth)
          expect(shown.shownHeight).toBe(p.screenHeight)
        } else expect(used * 2).toBeLessThanOrEqual(screen)
      }
  })

  it('g7.bus-timing: llegar justo dice el margen real, no que cualquier demora dejaba afuera', () => {
    const dependencies = createGrade7Dependencies()
    const template = dependencies.catalog.template('g7.bus-timing' as never)!
    const catalog = grade7VariantCatalogs['grade-7-dev-6']!
    let checked = 0
    for (const entry of catalog.entries.filter(
      (candidate) => (candidate.templateId as string) === 'g7.bus-timing',
    )) {
      const instance = materializeVariant(template, {
        variantId: entry.variantId,
        seed: 'margen',
      })
      const view = instance.present([])
      if (view.kind !== 'timeline') throw new Error('vista inesperada')
      for (const option of view.options) {
        const result = instance.evaluate(
          { kind: 'timeline', optionId: option.id },
          [],
        )
        if (!result.ok || result.value.quality !== 'functional') continue
        const margin = Number.parseInt(
          result.value.feedback.facts.find((fact) => fact.label === 'Margen')
            ?.value ?? '',
          10,
        )
        const text = result.value.feedback.optimalComparison ?? ''
        if (margin === 0) expect(text).toContain('cualquier demora')
        else {
          expect(text).not.toContain('cualquier demora')
          expect(text).toContain(`más de ${String(margin)} min`)
        }
        checked += 1
      }
    }
    expect(checked).toBeGreaterThan(0)
  })
})
