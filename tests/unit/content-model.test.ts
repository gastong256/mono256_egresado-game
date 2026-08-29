import { describe, expect, it } from 'vitest'

import {
  createContentCatalog,
  defineChallenge,
  formatVariantAddress,
  isEligibleForStage,
  isOrdinaryBeatRole,
  isPlacementRole,
  ok,
  parseVariantAddress,
  planEntry,
  resolvePlanEntry,
  sameVariantAddress,
  validateRunPlan,
  validateStagePlan,
  DEFAULT_STAGE_BEAT_BUDGET,
  PLACEMENT_ROLES,
  toChallengeId,
  toScenarioFamilyId,
  toVariantId,
  type ChallengeDefinition,
  type InteractionAnswer,
  type ScenarioFamilyDefinition,
  type StageContentPlan,
} from '@/game'
import { metrics } from '@/game/challenges/evaluation'
import {
  createDevelopmentContentCatalog,
  materializeEveryVariant,
  materializeVariant,
} from '@/game/testing'
import { grade7Challenges, grade7Families } from '@/content/grade-7'

/**
 * The content model: scenario family → challenge template → challenge variant.
 *
 * These are the tests the three-level model exists for. They prove the two
 * shapes that a flat challenge registry could not express — several cognitive
 * structures inside one family, and several reproducible cases inside one
 * structure — and then prove that the catalog of available content and the plan
 * of selected content really are two different things.
 */

const grade7Catalog = createContentCatalog(grade7Families, grade7Challenges)
const devCatalog = createDevelopmentContentCatalog()

const BUS = toChallengeId('g7.bus-timing')
const BUS_FAMILY = toScenarioFamilyId('bus')
const MURAL = toChallengeId('g7.mural-paint')
const MURAL_FAMILY = toScenarioFamilyId('mural')
const MAY_25 = toChallengeId('g7.may-25-act')
const MAY_25_FAMILY = toScenarioFamilyId('may-25')
const NOTEBOOK = toChallengeId('g7.notebook-offer')
const NOTEBOOK_FAMILY = toScenarioFamilyId('notebook')

function template(catalog = grade7Catalog, id = BUS): ChallengeDefinition {
  const found = catalog.template(id)
  if (found === undefined) throw new Error(`sin plantilla ${id}`)
  return found
}

describe('scenario family', () => {
  it('groups several templates with different cognitive structures', () => {
    // `school-data` es el caso que una familia existe para expresar: leer un
    // gráfico y juzgar una muestra ocurren en el mismo lugar de la escuela y no
    // son la misma pregunta.
    const schoolData = devCatalog.templatesOfFamily(
      toScenarioFamilyId('school-data'),
    )

    expect(schoolData.map((entry) => entry.id)).toEqual([
      'dev.recycling-chart',
      'dev.survey-confidence',
    ])

    // Estructuras cognitivas distintas, no los mismos números movidos.
    expect(new Set(schoolData.map((entry) => entry.interaction)).size).toBe(2)
    expect(
      schoolData[0]?.categories.every((category) =>
        schoolData[1]?.categories.includes(category),
      ),
    ).toBe(false)
  })

  it('is not tied to one school year', () => {
    const bus = template(devCatalog, toChallengeId('dev.bus-departure'))
    expect(bus.stages.length).toBeGreaterThan(1)
  })

  it('refuses a template whose family the catalog does not know', () => {
    expect(() => createContentCatalog([], grade7Challenges)).toThrow(
      /unknown family/,
    )
  })

  it('refuses duplicate families', () => {
    const duplicated = [...grade7Families, grade7Families[0]].filter(
      (family): family is ScenarioFamilyDefinition => family !== undefined,
    )
    expect(() => createContentCatalog(duplicated, [])).toThrow(
      /duplicate scenario family/,
    )
  })
})

describe('challenge variant', () => {
  it('produces a different case per authored variant of one template', () => {
    const bus = template()
    expect(bus.variants).toEqual(['demora-25', 'demora-50'])

    const instances = materializeEveryVariant(bus, 'stage-02')
    const views = instances.map((instance) =>
      JSON.stringify(instance.present([])),
    )

    expect(new Set(views).size).toBe(bus.variants.length)
    for (const instance of instances) {
      expect(instance.verify()).toEqual([])
    }
  })

  it('reconstructs the same instance from the same address', () => {
    const bus = template()
    const first = materializeVariant(bus, {
      seed: 'repeat',
      variantId: toVariantId('demora-50'),
    })
    const second = materializeVariant(bus, {
      seed: 'repeat',
      variantId: toVariantId('demora-50'),
    })

    expect(JSON.stringify(first.present([]))).toBe(
      JSON.stringify(second.present([])),
    )
    expect(first.ref).toEqual(second.ref)
  })

  it('refuses an address the template does not declare', () => {
    expect(() =>
      materializeVariant(template(), {
        seed: 'x',
        variantId: toVariantId('no-existe'),
      }),
    ).toThrow(/does not accept variant/)
  })

  it('refuses a template that declares no variant or a repeated one', () => {
    const base = {
      family: BUS_FAMILY,
      placement: 'anchor' as const,
      interaction: 'decision-card' as const,
      categories: ['quantity' as const],
      stages: ['grade-7' as const],
      baseDifficulty: 1 as const,
      cognitive: {
        steps: 1 as const,
        constraints: 0 as const,
        selection: 0 as const,
        optimization: 0 as const,
        uncertainty: 0 as const,
        construction: 0 as const,
      },
      scoring: {
        math: 'discrete-quality' as const,
        team: 'none' as const,
        aura: 'none' as const,
        rationale:
          'Test fixture: a single fact, read once by the mathematical component.',
      },
      tools: [],
      variantSource: {
        authored: [{ id: 'a' }],
        validators: [],
        canonical: () => ({}),
      },
      generate: () => ({}),
      verify: () => [],
      narrate: () => ({ title: 't', setup: 's', goal: 'g' }),
      present: () => ({
        kind: 'decision-card' as const,
        data: [],
        options: [],
      }),
      evaluate: () =>
        ok({
          quality: 'optimal' as const,
          feedback: { outcomeKey: 'k', facts: [] },
          metrics: metrics({}),
          careerEffects: {},
          flagEffects: [],
        }),
    }

    expect(() =>
      defineChallenge({ ...base, id: toChallengeId('x.empty'), variants: [] }),
    ).toThrow(/at least one variant/)

    expect(() =>
      defineChallenge({
        ...base,
        id: toChallengeId('x.dupe'),
        variants: [toVariantId('a'), toVariantId('a')],
      }),
    ).toThrow(/duplicate variant/)
  })
})

describe('variant address', () => {
  const ref = {
    familyId: BUS_FAMILY,
    templateId: BUS,
    variantId: toVariantId('demora-25'),
  }

  it('round-trips through its flat form', () => {
    const flat = formatVariantAddress(ref)
    expect(flat).toBe('bus/g7.bus-timing/demora-25')

    const parsed = parseVariantAddress(flat)
    if (!parsed.ok) throw new Error('no parseó')
    expect(parsed.value).toEqual(ref)
    expect(sameVariantAddress(parsed.value, ref)).toBe(true)
  })

  it('rejects a malformed address instead of guessing', () => {
    for (const malformed of [
      'bus/g7.bus-timing',
      'a/b/c/d',
      'bus//x',
      'BUS/x/y',
    ]) {
      const parsed = parseVariantAddress(malformed)
      expect(parsed.ok).toBe(false)
    }
  })
})

describe('placement roles', () => {
  it('covers the four canonical roles and rejects anything else', () => {
    expect([...PLACEMENT_ROLES]).toEqual([
      'anchor',
      'checkpoint',
      'special',
      'recovery',
    ])
    for (const role of PLACEMENT_ROLES) {
      expect(isPlacementRole(role)).toBe(true)
    }
    for (const invalid of ['boss', 'ANCHOR', '', 'optimal', 'aura']) {
      expect(isPlacementRole(invalid)).toBe(false)
    }
  })

  it('counts every role except recovery against the ordinary budget', () => {
    expect(isOrdinaryBeatRole('anchor')).toBe(true)
    expect(isOrdinaryBeatRole('checkpoint')).toBe(true)
    expect(isOrdinaryBeatRole('special')).toBe(true)
    expect(isOrdinaryBeatRole('recovery')).toBe(false)
  })

  it('is placement metadata, not an outcome and not a career effect', () => {
    // Un rol nunca se confunde con una calidad de resolución ni con una
    // dimensión de carrera: los tres vocabularios son disjuntos.
    const outcomes = ['invalid', 'functional', 'efficient', 'optimal']
    const career = ['promedio', 'equipo', 'aura', 'estilo']
    for (const role of PLACEMENT_ROLES) {
      expect(outcomes).not.toContain(role)
      expect(career).not.toContain(role)
    }
    // Y el rol de una plantilla no dice nada de lo que el evento le hace a la
    // carrera: el acto es `special` y mueve Aura; el mural es `checkpoint` y
    // pone nota.
    expect(template(grade7Catalog, MAY_25).placement).toBe('special')
    expect(template(grade7Catalog, MURAL).placement).toBe('checkpoint')
  })
})

describe('stage eligibility', () => {
  it('is permission, declared per template', () => {
    expect(isEligibleForStage(template(), 'grade-7')).toBe(true)
    expect(isEligibleForStage(template(), 'year-3')).toBe(false)
  })

  it('supports one stage, several stages and non-contiguous stages', () => {
    const single = template(grade7Catalog, BUS)
    expect(single.stages).toEqual(['grade-7'])

    const several = template(devCatalog, toChallengeId('dev.bus-departure'))
    expect(several.stages).toEqual(['grade-7', 'year-1', 'year-2'])

    // Hueco deliberado: 2.º, 3.º y 5.º, sin 4.º.
    const gapped = template(devCatalog, toChallengeId('dev.trip-budget'))
    expect(gapped.stages).toEqual(['year-2', 'year-3', 'year-5'])
    expect(isEligibleForStage(gapped, 'year-4')).toBe(false)
    expect(isEligibleForStage(gapped, 'year-5')).toBe(true)
  })

  it('lets templates of one family differ in eligibility', () => {
    const schoolData = devCatalog.templatesOfFamily(
      toScenarioFamilyId('school-data'),
    )
    const stageSets = schoolData.map((entry) => entry.stages.join(','))
    expect(new Set(stageSets).size).toBe(schoolData.length)
  })

  it('cannot be widened by a variant: eligibility lives on the template', () => {
    // Una variante es una dirección, no una declaración: no tiene dónde
    // declarar una etapa, y por eso no puede ampliar la de su plantilla.
    const bus = template()
    const entry = planEntry(BUS_FAMILY, BUS, toVariantId('demora-50'))
    expect(Object.keys(entry.variant).sort()).toEqual([
      'familyId',
      'templateId',
      'variantId',
    ])

    const issues = validateStagePlan(grade7Catalog, {
      stageId: 'year-3',
      entries: [entry],
    })
    expect(issues.map((issue) => issue.code)).toContain('plan.ineligible-stage')
    expect(bus.stages).toEqual(['grade-7'])
  })
})

describe('stage content plan', () => {
  const anchor = planEntry(BUS_FAMILY, BUS, toVariantId('demora-25'))
  const checkpoint = planEntry(MURAL_FAMILY, MURAL, toVariantId('pared-6x24'))
  const special = planEntry(MAY_25_FAMILY, MAY_25, toVariantId('coreografia-a'))
  const secondAnchor = planEntry(
    NOTEBOOK_FAMILY,
    NOTEBOOK,
    toVariantId('precio-alto'),
  )

  function check(entries: StageContentPlan['entries']) {
    return validateStagePlan(grade7Catalog, {
      stageId: 'grade-7',
      entries,
    }).map((issue) => issue.code)
  }

  it('declares a default budget of one to two ordinary beats', () => {
    expect(DEFAULT_STAGE_BEAT_BUDGET).toEqual({ min: 1, max: 2 })
  })

  it('accepts one anchor on its own', () => {
    expect(check([anchor])).toEqual([])
  })

  it('accepts an anchor plus a checkpoint', () => {
    expect(check([anchor, checkpoint])).toEqual([])
  })

  it('accepts an anchor plus a special', () => {
    expect(check([anchor, special])).toEqual([])
  })

  it('refuses three ordinary beats', () => {
    // La evaluación no es un beat extra: gasta uno de los dos del año, y por
    // eso anchor + checkpoint + special se pasa del presupuesto.
    expect(check([anchor, checkpoint, special])).toContain('plan.beat-budget')
  })

  it('refuses a year with no anchor and a year with two', () => {
    expect(check([checkpoint])).toContain('plan.anchor-count')
    expect(check([anchor, secondAnchor])).toContain('plan.anchor-count')
  })

  it('refuses an empty year', () => {
    expect(check([])).toEqual(
      expect.arrayContaining(['plan.beat-budget', 'plan.anchor-count']),
    )
  })

  it('refuses the same variant twice in one year', () => {
    expect(check([anchor, anchor])).toContain('plan.duplicate-entry')
  })

  it('refuses an entry whose family, template or variant does not resolve', () => {
    expect(
      check([planEntry(MURAL_FAMILY, BUS, toVariantId('demora-25'))]),
    ).toContain('plan.family-mismatch')
    expect(
      check([planEntry(BUS_FAMILY, BUS, toVariantId('inventada'))]),
    ).toContain('plan.unknown-variant')
    expect(
      check([
        planEntry(BUS_FAMILY, toChallengeId('g7.no-existe'), toVariantId('a')),
      ]),
    ).toContain('plan.unknown-template')
  })

  it('validates a whole run plan and refuses a repeated stage', () => {
    const valid = validateRunPlan(grade7Catalog, {
      stages: [{ stageId: 'grade-7', entries: [anchor, checkpoint] }],
    })
    expect(valid).toEqual([])

    const repeated = validateRunPlan(grade7Catalog, {
      stages: [
        { stageId: 'grade-7', entries: [anchor] },
        { stageId: 'grade-7', entries: [checkpoint] },
      ],
    })
    expect(repeated.map((issue) => issue.code)).toContain(
      'plan.duplicate-stage',
    )
  })
})

describe('catalog and run plan are different things', () => {
  const plan: StageContentPlan = {
    stageId: 'grade-7',
    entries: [planEntry(BUS_FAMILY, BUS, toVariantId('demora-25'))],
  }

  it('does not add catalog content to an existing plan', () => {
    const before = grade7Catalog.templates.length
    const extraFamily: ScenarioFamilyDefinition = {
      id: toScenarioFamilyId('kiosco'),
      labelKey: 'family.kiosco',
      summary: 'Nueva familia de prueba.',
    }
    const wider = createContentCatalog(
      [...grade7Families, extraFamily],
      grade7Challenges,
    )

    expect(wider.families.length).toBe(grade7Catalog.families.length + 1)
    expect(wider.templates.length).toBe(before)
    // El plan es el mismo objeto y sigue significando lo mismo.
    expect(plan.entries).toHaveLength(1)
    expect(validateStagePlan(wider, plan)).toEqual([])
  })

  it('resolves plan entries by identity, not by catalog position', () => {
    const reordered = createContentCatalog(
      [...grade7Families].reverse(),
      [...grade7Challenges].reverse(),
    )

    const original = resolvePlanEntry(grade7Catalog, plan.entries[0]!)
    const shuffled = resolvePlanEntry(reordered, plan.entries[0]!)

    expect(original?.template.id).toBe(BUS)
    expect(shuffled?.template.id).toBe(BUS)
    expect(shuffled?.role).toBe(original?.role)
    expect(validateStagePlan(reordered, plan)).toEqual([])
  })

  it('keeps the catalog ordered by identity whatever the input order', () => {
    const reordered = createContentCatalog(
      [...grade7Families].reverse(),
      [...grade7Challenges].reverse(),
    )
    expect(reordered.templates.map((entry) => entry.id)).toEqual(
      grade7Catalog.templates.map((entry) => entry.id),
    )
  })
})

describe('new content needs no core engine change', () => {
  /**
   * Una familia, una plantilla y una variante que el motor nunca vio.
   *
   * Nada de esto toca `transition`, ni el códec de snapshot, ni un `switch` por
   * id de contenido: se declara, se registra y el motor ya sabe ejecutarlo. Ése
   * es el criterio de aceptación que hace que 1.º a 5.º sea contenido y no otra
   * migración de motor.
   */
  const KIOSCO = toScenarioFamilyId('kiosco')
  const RECREO = toChallengeId('test.recreo')
  const RECOVERY = toChallengeId('test.recuperatorio')

  const family: ScenarioFamilyDefinition = {
    id: KIOSCO,
    labelKey: 'family.kiosco',
    summary: 'La cola del kiosco en el recreo.',
  }

  function stub(
    id: ReturnType<typeof toChallengeId>,
    placement: 'anchor' | 'recovery',
    variants: readonly string[],
  ): ChallengeDefinition {
    return defineChallenge<
      { readonly precio: number; readonly propina: number },
      { readonly id: string }
    >({
      id,
      family: KIOSCO,
      placement,
      variants: variants.map(toVariantId),
      variantSource: {
        authored: variants.map((id) => ({ id })),
        validators: [],
        canonical: () => ({}),
      },
      interaction: 'decision-card',
      categories: ['quantity'],
      stages: ['grade-7', 'year-2'],
      baseDifficulty: 2,
      cognitive: {
        steps: 1,
        constraints: 0,
        selection: 0,
        optimization: 0,
        uncertainty: 0,
        construction: 0,
      },
      scoring: {
        math: 'discrete-quality' as const,
        team: 'none' as const,
        aura: 'none' as const,
        rationale:
          'Test fixture: a single fact, read once by the mathematical component.',
      },
      tools: [],
      // `variantRng` está direccionado sólo por la identidad de la variante:
      // una plantilla que genera sus propios números saca los mismos la juegue
      // el año que la juegue. `precio` es autorado; `propina` sale de ahí.
      generate: ({ variantId, variantRng }) => ({
        precio: variantId === 'caro' ? 900 : 300,
        propina: variantRng.nextInt(1, 1_000_000),
      }),
      verify: (model) => (model.precio > 0 ? [] : ['precio no positivo']),
      narrate: () => ({ title: 'Kiosco', setup: 'Hay cola.', goal: 'Elegí.' }),
      present: (model) => ({
        kind: 'decision-card',
        data: [
          { label: 'Precio', value: String(model.precio) },
          { label: 'Propina', value: String(model.propina) },
        ],
        options: [{ id: 'si', label: 'Comprar' }],
      }),
      evaluate: (model, answer: InteractionAnswer) =>
        answer.kind === 'decision-card'
          ? ok({
              quality:
                model.precio < 500
                  ? ('optimal' as const)
                  : ('functional' as const),
              feedback: { outcomeKey: 'kiosco', facts: [] },
              metrics: metrics({}),
              careerEffects: {},
              flagEffects: [],
            })
          : ok({
              quality: 'invalid' as const,
              feedback: { outcomeKey: 'kiosco', facts: [] },
              metrics: metrics({}),
              careerEffects: {},
              flagEffects: [],
            }),
    })
  }

  const recreo = stub(RECREO, 'anchor', ['barato', 'caro'])
  const recuperatorio = stub(RECOVERY, 'recovery', ['unica'])
  const catalog = createContentCatalog(
    [...grade7Families, family],
    [...grade7Challenges, recreo, recuperatorio],
  )

  it('registers and materialises without touching the engine', () => {
    expect(catalog.templatesOfFamily(KIOSCO).map((entry) => entry.id)).toEqual([
      RECREO,
      RECOVERY,
    ])

    const instances = materializeEveryVariant(recreo, 'kiosco')
    expect(instances).toHaveLength(2)
    expect(
      new Set(instances.map((i) => JSON.stringify(i.present([])))).size,
    ).toBe(2)
    for (const instance of instances) {
      expect(instance.verify()).toEqual([])
      expect(instance.ref.familyId).toBe(KIOSCO)
    }
  })

  it('is schedulable in every stage it declares and nowhere else', () => {
    expect(catalog.forStage('year-2').map((entry) => entry.id)).toContain(
      RECREO,
    )
    expect(catalog.forStage('year-4').map((entry) => entry.id)).not.toContain(
      RECREO,
    )
  })

  it('gives a variant the same numbers wherever a run schedules it', () => {
    // El substream de la variante no depende de la etapa ni del índice de
    // evento: es la propiedad de la que va a depender un catálogo pregenerado.
    const enSeptimo = materializeVariant(recreo, {
      seed: 'run-1',
      variantId: toVariantId('caro'),
      stage: 'grade-7',
      eventIndex: 0,
    })
    const enSegundo = materializeVariant(recreo, {
      seed: 'run-1',
      variantId: toVariantId('caro'),
      stage: 'year-2',
      eventIndex: 5,
    })

    expect(JSON.stringify(enSeptimo.present([]))).toBe(
      JSON.stringify(enSegundo.present([])),
    )

    // Y sí depende de la variante: la otra produce otro caso.
    const otraVariante = materializeVariant(recreo, {
      seed: 'run-1',
      variantId: toVariantId('barato'),
    })
    expect(JSON.stringify(otraVariante.present([]))).not.toBe(
      JSON.stringify(enSeptimo.present([])),
    )
  })

  it('keeps recovery outside the ordinary budget', () => {
    const anchorEntry = planEntry(KIOSCO, RECREO, toVariantId('barato'))
    const recoveryEntry = planEntry(KIOSCO, RECOVERY, toVariantId('unica'))

    // Un año con su beat normal más una recuperación condicional sigue siendo
    // válido: la recuperación no gasta presupuesto.
    expect(
      validateStagePlan(catalog, {
        stageId: 'year-2',
        entries: [anchorEntry, recoveryEntry],
      }),
    ).toEqual([])

    // Y una recuperación sola no reemplaza al beat normal del año.
    expect(
      validateStagePlan(catalog, {
        stageId: 'year-2',
        entries: [recoveryEntry],
      }).map((issue) => issue.code),
    ).toEqual(expect.arrayContaining(['plan.beat-budget', 'plan.anchor-count']))
  })
})
