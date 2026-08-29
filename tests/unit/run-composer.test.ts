import { describe, expect, it } from 'vitest'

import {
  composeRun,
  composeStage,
  createContentCatalog,
  isErr,
  isOk,
  formatVariantAddress,
  parseRunPlan,
  planFingerprint,
  serializeRunPlan,
  stageCompositionPolicy,
  toRunSeed,
  validateComposedPlan,
  validateStagePlan,
  toRunPlan,
  candidateDifficultyCostPolicy,
  costOf,
  toChallengeId,
  COMPOSITION_OBJECTIVES,
  DEFAULT_STAGE_BEAT_BUDGET,
  type ApprovedVariantLookup,
  type ComposedRunPlan,
  type CompositionPolicy,
} from '@/game'
import {
  createComposedDevelopmentDependencies,
  composedDevelopmentCompositionPolicy,
} from '@/game/testing'
import {
  grade7Challenges,
  grade7CompositionPolicy,
  grade7Families,
  grade7ApprovedVariants,
  createGrade7ComposedDependencies,
  GRADE_7_HOSTABLE_TEMPLATES,
} from '@/content/grade-7'

/**
 * El compositor de runs.
 *
 * El catálogo dice qué existe; el compositor dice qué juega una partida. Lo que
 * se prueba acá es que elija dentro de las reglas duras siempre, que sea el
 * mismo plan para el mismo seed, y que cuando no pueda cumplirlas falle en voz
 * alta en vez de aflojar una.
 */

const grade7 = createGrade7ComposedDependencies()
const grade7Catalog = createContentCatalog(grade7Families, grade7Challenges)

function composeGrade7(seed: string) {
  return composeRun({
    seed: toRunSeed(seed),
    stages: ['grade-7'],
    catalog: grade7Catalog,
    approvedVariants: grade7ApprovedVariants,
    policy: grade7CompositionPolicy,
  })
}

function planOf(seed: string): ComposedRunPlan {
  const composed = composeGrade7(seed)
  if (!isOk(composed)) {
    throw new Error(`no compuso: ${composed.error.code}`)
  }
  return composed.value
}

const SEEDS = Array.from({ length: 24 }, (_, index) => `compose-${index}`)

describe('componer un año normal de 7.º', () => {
  it('respeta el presupuesto de uno a dos beats ordinarios', () => {
    for (const seed of SEEDS) {
      const stage = planOf(seed).stages[0]
      if (stage === undefined) throw new Error('sin etapa')

      expect(stage.beats.length).toBeGreaterThanOrEqual(
        DEFAULT_STAGE_BEAT_BUDGET.min,
      )
      expect(stage.beats.length).toBeLessThanOrEqual(
        DEFAULT_STAGE_BEAT_BUDGET.max,
      )
    }
  })

  it('pone exactamente un anchor', () => {
    for (const seed of SEEDS) {
      const stage = planOf(seed).stages[0]
      expect(
        stage?.beats.filter((beat) => beat.role === 'anchor'),
      ).toHaveLength(1)
    }
  })

  it('no repite una plantilla dentro del mismo año', () => {
    for (const seed of SEEDS) {
      const templates = planOf(seed).stages[0]?.beats.map(
        (beat) => beat.variant.templateId,
      )
      expect(new Set(templates).size).toBe(templates?.length)
    }
  })

  it('elige sólo variantes aprobadas', () => {
    for (const seed of SEEDS) {
      for (const beat of planOf(seed).stages[0]?.beats ?? []) {
        expect(
          grade7ApprovedVariants
            .variantsFor(beat.variant.templateId)
            .includes(beat.variant.variantId),
        ).toBe(true)
      }
    }
  })

  it('produce planes que el validador estructural acepta', () => {
    for (const seed of SEEDS.slice(0, 6)) {
      const plan = planOf(seed)
      const stagePlan = toRunPlan(plan).stages[0]
      if (stagePlan === undefined) throw new Error('sin etapa')

      expect(
        validateStagePlan(grade7Catalog, stagePlan, {
          approvedVariants: grade7ApprovedVariants,
        }),
      ).toEqual([])
    }
  })

  it('queda dentro del sobre de dificultad configurado', () => {
    const policy = grade7CompositionPolicy.stages[0]
    if (policy === undefined) throw new Error('sin política')

    for (const seed of SEEDS) {
      const cost = planOf(seed).stages[0]?.difficultyCost ?? 0
      expect(Math.abs(cost - policy.difficulty.target)).toBeLessThanOrEqual(
        policy.difficulty.tolerance,
      )
    }
  })

  it('el costo declarado es la suma de sus beats', () => {
    for (const seed of SEEDS) {
      const stage = planOf(seed).stages[0]
      if (stage === undefined) throw new Error('sin etapa')
      expect(stage.difficultyCost).toBe(
        stage.beats.reduce((sum, beat) => sum + beat.cost, 0),
      )
    }
  })

  it('la duración del año sale del plan, no de la etapa', () => {
    for (const seed of SEEDS.slice(0, 6)) {
      const stage = planOf(seed).stages[0]
      if (stage === undefined) throw new Error('sin etapa')
      // Un beat de apertura más los compuestos. La etapa declara ocho eventos y
      // una run compuesta no los juega: ésa es la reconciliación.
      expect(stage.eventCount).toBe(stage.beats.length + 1)
      expect(stage.eventCount).toBeLessThan(8)
    }
  })

  it('distintos seeds alcanzan las dos plantillas del colectivo', () => {
    const anchors = new Set(
      SEEDS.map((seed) => planOf(seed).stages[0]?.beats[0]?.variant.templateId),
    )
    expect(anchors).toEqual(
      new Set(['g7.bus-timing', 'g7.bus-latest-departure']),
    )
  })

  it('distintos seeds producen planes distintos', () => {
    const plans = new Set(
      SEEDS.map((seed) =>
        planOf(seed)
          .stages[0]?.beats.map((beat) => formatVariantAddress(beat.variant))
          .join('+'),
      ),
    )
    expect(plans.size).toBeGreaterThan(4)
  })

  it('prueba explícitamente la política válida de un solo beat aunque exista un secundario', () => {
    const oneBeatPolicy: CompositionPolicy = {
      ...grade7CompositionPolicy,
      id: 'grade-7-one-beat-proof',
      version: '1.0.0-test',
      stages: [
        stageCompositionPolicy('grade-7', {
          ordinaryBeats: { min: 1, max: 1 },
          difficulty: { target: 150, tolerance: 0 },
          narrativeBeats: 1,
          hostableTemplates: [...GRADE_7_HOSTABLE_TEMPLATES],
        }),
      ],
    }
    expect(
      grade7ApprovedVariants.variantsFor(toChallengeId('g7.may-25-act')).length,
    ).toBeGreaterThan(0)

    for (const seed of SEEDS.slice(0, 8)) {
      const request = {
        seed: toRunSeed(`one-${seed}`),
        stages: ['grade-7'] as const,
        catalog: grade7Catalog,
        approvedVariants: grade7ApprovedVariants,
        policy: oneBeatPolicy,
      }
      const first = composeRun(request)
      const second = composeRun(request)
      if (!isOk(first) || !isOk(second)) throw new Error('no compuso')

      const stage = first.value.stages[0]
      expect(stage?.beats).toHaveLength(1)
      expect(stage?.beats[0]?.role).toBe('anchor')
      expect(stage?.eventCount).toBe(2)
      expect(
        validateComposedPlan(first.value, {
          catalog: grade7Catalog,
          policy: oneBeatPolicy,
          approvedVariants: grade7ApprovedVariants,
        }),
      ).toEqual([])
      const stagePlan = toRunPlan(first.value).stages[0]
      if (stagePlan === undefined) throw new Error('sin StagePlan')
      expect(
        validateStagePlan(grade7Catalog, stagePlan, {
          budget: { min: 1, max: 1 },
          approvedVariants: grade7ApprovedVariants,
        }),
      ).toEqual([])

      const parsed = parseRunPlan(
        JSON.parse(JSON.stringify(serializeRunPlan(first.value))) as unknown,
      )
      if (!isOk(parsed)) throw new Error('no serializó')
      expect(planFingerprint(parsed.value)).toBe(planFingerprint(first.value))
      expect(planFingerprint(second.value)).toBe(planFingerprint(first.value))
    }
  })

  it('la cardinalidad de variantes de una plantilla no amplifica su selección', () => {
    const sparse: ApprovedVariantLookup = {
      catalogVersion: 'cardinality-probe',
      variantsFor(templateId) {
        return grade7ApprovedVariants.variantsFor(templateId).slice(0, 1)
      },
    }
    const expanded: ApprovedVariantLookup = {
      catalogVersion: 'cardinality-probe',
      variantsFor(templateId) {
        const approved = grade7ApprovedVariants.variantsFor(templateId)
        return templateId === toChallengeId('g7.bus-timing')
          ? approved
          : approved.slice(0, 1)
      },
    }
    expect(
      expanded.variantsFor(toChallengeId('g7.bus-timing')).length,
    ).toBeGreaterThan(sparse.variantsFor(toChallengeId('g7.bus-timing')).length)

    const selectedAnchors = (approvedVariants: ApprovedVariantLookup) =>
      Array.from({ length: 1_000 }, (_, index) => {
        const composed = composeRun({
          seed: toRunSeed(`cardinality-${String(index)}`),
          stages: ['grade-7'],
          catalog: grade7Catalog,
          approvedVariants,
          policy: grade7CompositionPolicy,
        })
        if (!isOk(composed)) throw new Error('no compuso')
        return composed.value.stages[0]?.beats[0]?.variant.templateId
      })

    const sparseSelection = selectedAnchors(sparse)
    const expandedSelection = selectedAnchors(expanded)
    expect(expandedSelection).toEqual(sparseSelection)
    expect(
      expandedSelection.filter(
        (templateId) => templateId === toChallengeId('g7.bus-timing'),
      ),
    ).toHaveLength(
      sparseSelection.filter(
        (templateId) => templateId === toChallengeId('g7.bus-timing'),
      ).length,
    )
  })
})

describe('componer es determinista', () => {
  it('el mismo seed da el mismo plan, huella incluida', () => {
    for (const seed of SEEDS.slice(0, 8)) {
      expect(planFingerprint(planOf(seed))).toBe(planFingerprint(planOf(seed)))
    }
  })

  it('seeds distintos casi siempre dan huellas distintas', () => {
    const fingerprints = new Set(
      SEEDS.map((seed) => planFingerprint(planOf(seed))),
    )
    expect(fingerprints.size).toBeGreaterThan(4)
  })

  it('la huella cambia si cambia la calibración', () => {
    const plan = planOf('compose-0')
    const recalibrated: CompositionPolicy = {
      ...grade7CompositionPolicy,
      costPolicy: {
        ...candidateDifficultyCostPolicy,
        version: '2.0.0-candidate',
        costs: { core: 100, standard: 160, stretch: 210 },
      },
      stages: [
        stageCompositionPolicy('grade-7', {
          difficulty: { target: 260, tolerance: 110 },
          narrativeBeats: 1,
          hostableTemplates: [...GRADE_7_HOSTABLE_TEMPLATES],
        }),
      ],
    }

    const other = composeRun({
      seed: toRunSeed('compose-0'),
      stages: ['grade-7'],
      catalog: grade7Catalog,
      approvedVariants: grade7ApprovedVariants,
      policy: recalibrated,
    })
    if (!isOk(other)) throw new Error('no compuso')

    // Mismo seed, misma dirección de contenido, otra política: es otro plan, y
    // la huella tiene que decirlo o una recalibración cambiaría partidas en
    // silencio.
    expect(planFingerprint(other.value)).not.toBe(planFingerprint(plan))
  })
})

describe('una carrera entera se compone de una sola pasada', () => {
  const development = createComposedDevelopmentDependencies()

  function career(seed: string) {
    const composed = composeRun({
      seed: toRunSeed(seed),
      stages: development.ruleset.stages.map((stage) => stage.id),
      catalog: development.catalog,
      policy: composedDevelopmentCompositionPolicy,
    })
    if (!isOk(composed)) throw new Error(`no compuso: ${composed.error.code}`)
    return composed.value
  }

  it('compone las cinco etapas en orden escolar', () => {
    expect(career('carrera').stages.map((stage) => stage.stageId)).toEqual([
      'grade-7',
      'year-1',
      'year-2',
      'year-3',
      'year-4',
    ])
  })

  it('cada etapa cumple su propio presupuesto y su propio sobre', () => {
    const plan = career('carrera')

    for (const stage of plan.stages) {
      const policy = composedDevelopmentCompositionPolicy.stages.find(
        (entry) => entry.stageId === stage.stageId,
      )
      if (policy === undefined) throw new Error('sin política')

      expect(stage.beats.length).toBeGreaterThanOrEqual(
        policy.ordinaryBeats.min,
      )
      expect(stage.beats.length).toBeLessThanOrEqual(policy.ordinaryBeats.max)
      expect(
        Math.abs(stage.difficultyCost - policy.difficulty.target),
      ).toBeLessThanOrEqual(policy.difficulty.tolerance)
    }
  })

  it('un año sin secundario disponible compone un solo beat', () => {
    // Con las plantillas ya jugadas fuera de juego, lo único que le queda a 3.º
    // es un anchor. El presupuesto no hay que gastarlo para respetarlo, y el
    // compositor no inventa un secundario que no existe.
    const year3 = career('carrera').stages.find(
      (stage) => stage.stageId === 'year-3',
    )
    expect(year3?.beats).toHaveLength(1)
    expect(year3?.beats[0]?.role).toBe('anchor')
  })

  it('nunca repite una plantilla a lo largo de la carrera', () => {
    const templates = career('carrera')
      .stages.flatMap((stage) => stage.beats)
      .map((beat) => beat.variant.templateId)

    // No repetir es una restricción **dura** acá, no una preferencia: el
    // storylet que aloja una plantilla suele ser de una sola vez, así que
    // agendarla dos veces deja al segundo beat sin dónde ocurrir.
    expect(new Set(templates).size).toBe(templates.length)
  })

  it('la dificultad puede crecer a lo largo de la carrera', () => {
    const plan = career('carrera')
    const costOfStage = (stageId: string) =>
      plan.stages.find((stage) => stage.stageId === stageId)?.difficultyCost ??
      0

    // La política pide 250 en 7.º y 310 en 3.º, y el compositor lo entrega sin
    // saber qué es un año escolar: la progresión es configuración.
    expect(costOfStage('year-2')).toBeGreaterThan(costOfStage('grade-7'))
  })

  it('runs distintas cargan un total comparable', () => {
    const totals = ['s1', 's2', 's3', 's4', 's5'].map(
      (seed) => career(seed).difficultyCost,
    )
    const min = Math.min(...totals)
    const max = Math.max(...totals)

    // El sobre por etapa es lo que hace comparables los totales. Comparable no
    // es idéntico y no es equivalencia psicométrica: es carga estructural
    // parecida, que es lo único que esta etapa puede afirmar.
    expect(max - min).toBeLessThanOrEqual(
      composedDevelopmentCompositionPolicy.stages.reduce(
        (sum, stage) => sum + stage.difficulty.tolerance,
        0,
      ),
    )
  })

  it('agregar un año es configuración, no un algoritmo nuevo', () => {
    // La prueba de que STAGE-08 no va a tener que reescribir el compositor: se
    // compone una carrera más corta con la misma política y el mismo código.
    const shorter = composeRun({
      seed: toRunSeed('corta'),
      stages: ['grade-7', 'year-1'],
      catalog: development.catalog,
      policy: composedDevelopmentCompositionPolicy,
    })
    expect(isOk(shorter)).toBe(true)
  })
})

describe('cuando no se puede componer, falla en voz alta', () => {
  it('rechaza una etapa que la política no configura', () => {
    const composed = composeRun({
      seed: toRunSeed('x'),
      stages: ['grade-7', 'year-1'],
      catalog: grade7Catalog,
      approvedVariants: grade7ApprovedVariants,
      policy: grade7CompositionPolicy,
    })

    if (!isErr(composed)) throw new Error('debería haber fallado')
    expect(composed.error.code).toBe('stage-not-configured')
    expect(composed.error.stageId).toBe('year-1')
  })

  it('rechaza una etapa sin contenido elegible, y dice cuánto había', () => {
    const composed = composeRun({
      seed: toRunSeed('x'),
      stages: ['graduation'],
      catalog: grade7Catalog,
      approvedVariants: grade7ApprovedVariants,
      policy: {
        ...grade7CompositionPolicy,
        stages: [stageCompositionPolicy('graduation')],
      },
    })

    if (!isErr(composed)) throw new Error('debería haber fallado')
    expect(composed.error.code).toBe('no-eligible-content')
    expect(composed.error.counts?.eligible).toBe(0)
  })

  it('rechaza un sobre de dificultad inalcanzable, y dice qué totales había', () => {
    const composed = composeRun({
      seed: toRunSeed('x'),
      stages: ['grade-7'],
      catalog: grade7Catalog,
      approvedVariants: grade7ApprovedVariants,
      policy: {
        ...grade7CompositionPolicy,
        stages: [
          stageCompositionPolicy('grade-7', {
            difficulty: { target: 900, tolerance: 10 },
            hostableTemplates: [...GRADE_7_HOSTABLE_TEMPLATES],
          }),
        ],
      },
    })

    if (!isErr(composed)) throw new Error('debería haber fallado')
    expect(composed.error.code).toBe('difficulty-unsatisfiable')
    expect(composed.error.detail).toContain('250')
  })

  it('rechaza una política que se sale del presupuesto de beats', () => {
    const composed = composeRun({
      seed: toRunSeed('x'),
      stages: ['grade-7'],
      catalog: grade7Catalog,
      approvedVariants: grade7ApprovedVariants,
      policy: {
        ...grade7CompositionPolicy,
        stages: [
          stageCompositionPolicy('grade-7', {
            ordinaryBeats: { min: 1, max: 5 },
          }),
        ],
      },
    })

    if (!isErr(composed)) throw new Error('debería haber fallado')
    expect(composed.error.code).toBe('invalid-policy')
  })

  it('rechaza una política que quiere dos anchors', () => {
    const composed = composeRun({
      seed: toRunSeed('x'),
      stages: ['grade-7'],
      catalog: grade7Catalog,
      policy: {
        ...grade7CompositionPolicy,
        stages: [
          stageCompositionPolicy('grade-7', { secondaryRoles: ['anchor'] }),
        ],
      },
    })

    if (!isErr(composed)) throw new Error('debería haber fallado')
    expect(composed.error.detail).toContain('anchor')
  })

  it('rechaza una política que quiere recuperación dentro del presupuesto', () => {
    const composed = composeRun({
      seed: toRunSeed('x'),
      stages: ['grade-7'],
      catalog: grade7Catalog,
      policy: {
        ...grade7CompositionPolicy,
        stages: [
          stageCompositionPolicy('grade-7', { secondaryRoles: ['recovery'] }),
        ],
      },
    })

    if (!isErr(composed)) throw new Error('debería haber fallado')
    expect(composed.error.detail).toContain('recovery')
  })

  it('sin catálogo aprobado, una plantilla sin variantes curadas no compone', () => {
    // `composeStage` es el mismo camino, y esto comprueba que también reporta.
    const composed = composeStage(
      {
        seed: toRunSeed('x'),
        stages: ['grade-7'],
        catalog: createContentCatalog(grade7Families, []),
        policy: grade7CompositionPolicy,
      },
      'grade-7',
    )
    expect(isErr(composed)).toBe(true)
  })
})

describe('el plan viaja como JSON', () => {
  it('sobrevive un round-trip sin cambiar de identidad', () => {
    const plan = planOf('compose-3')
    const parsed = parseRunPlan(
      JSON.parse(JSON.stringify(serializeRunPlan(plan))) as unknown,
    )

    if (!isOk(parsed)) throw new Error('no se pudo parsear')
    expect(planFingerprint(parsed.value)).toBe(planFingerprint(plan))
    expect(parsed.value).toEqual(plan)
  })

  it('rechaza un plan con forma inválida en vez de castearlo', () => {
    expect(isErr(parseRunPlan({ stages: 'no' }))).toBe(true)
    expect(isErr(parseRunPlan(null))).toBe(true)
    expect(
      isErr(
        parseRunPlan({
          ...(serializeRunPlan(planOf('compose-3')) as Record<string, unknown>),
          stages: [],
        }),
      ),
    ).toBe(true)
  })
})

describe('los objetivos blandos', () => {
  it('están declarados en la política, no escondidos en el algoritmo', () => {
    expect(grade7CompositionPolicy.objectives).toEqual([
      ...COMPOSITION_OBJECTIVES,
    ])
    expect(grade7CompositionPolicy.objectives[0]).toBe('difficulty-fit')
  })

  it('prefieren no repetir familia entre años cuando hay alternativa', () => {
    const development = createComposedDevelopmentDependencies()
    const composed = composeRun({
      seed: toRunSeed('variedad'),
      stages: development.ruleset.stages.map((stage) => stage.id),
      catalog: development.catalog,
      policy: composedDevelopmentCompositionPolicy,
    })
    if (!isOk(composed)) throw new Error('no compuso')

    const anchors = composed.value.stages.map(
      (stage) => stage.beats[0]?.variant.templateId,
    )

    // Con la no repetición como restricción dura, cada año trae un anchor que
    // la carrera no había jugado.
    expect(new Set(anchors).size).toBe(anchors.length)
  })

  it('prefiere dos familias en un año que tiene alternativa, y acepta una cuando no la tiene', () => {
    const development = createComposedDevelopmentDependencies()
    const composed = composeRun({
      seed: toRunSeed('familias'),
      stages: development.ruleset.stages.map((stage) => stage.id),
      catalog: development.catalog,
      policy: composedDevelopmentCompositionPolicy,
    })
    if (!isOk(composed)) throw new Error('no compuso')

    const familiesOf = (stageId: string) =>
      new Set(
        composed.value.stages
          .find((stage) => stage.stageId === stageId)
          ?.beats.map((beat) => beat.variant.familyId) ?? [],
      )

    // 7.º tiene de dónde elegir y elige dos familias distintas.
    expect(familiesOf('grade-7').size).toBe(2)

    /*
     * 4.º no tiene alternativa: lo único elegible ahí son dos plantillas de
     * `school-data`, y el sobre de dificultad exige las dos. Que el compositor
     * componga igual es correcto — la variedad es un objetivo blando, y
     * convertirla en prohibición dejaría un año sin plan.
     */
    expect(familiesOf('year-4').size).toBe(1)
  })
})

describe('validar un plan es otro programa', () => {
  it('acepta lo que el compositor produce', () => {
    for (const seed of SEEDS.slice(0, 8)) {
      expect(
        validateComposedPlan(planOf(seed), {
          catalog: grade7Catalog,
          policy: grade7CompositionPolicy,
          approvedVariants: grade7ApprovedVariants,
        }),
      ).toEqual([])
    }
  })

  it('rechaza un plan que miente sobre el costo de un beat', () => {
    const plan = planOf('compose-1')
    const stage = plan.stages[0]
    const beat = stage?.beats[0]
    if (stage === undefined || beat === undefined) throw new Error('sin beat')

    const tampered: ComposedRunPlan = {
      ...plan,
      stages: [
        { ...stage, beats: [{ ...beat, cost: 100 }, ...stage.beats.slice(1)] },
      ],
    }

    const codes = validateComposedPlan(tampered, {
      catalog: grade7Catalog,
      policy: grade7CompositionPolicy,
      approvedVariants: grade7ApprovedVariants,
    }).map((issue) => issue.code)

    expect(codes).toContain('plan.cost-mismatch')
  })

  it('rechaza un plan que miente sobre la banda de un beat', () => {
    const plan = planOf('compose-1')
    const stage = plan.stages[0]
    const beat = stage?.beats[0]
    if (stage === undefined || beat === undefined) throw new Error('sin beat')

    const codes = validateComposedPlan(
      {
        ...plan,
        stages: [
          {
            ...stage,
            beats: [{ ...beat, band: 'core' }, ...stage.beats.slice(1)],
          },
        ],
      },
      {
        catalog: grade7Catalog,
        policy: grade7CompositionPolicy,
        approvedVariants: grade7ApprovedVariants,
      },
    ).map((issue) => issue.code)

    expect(codes).toContain('plan.band-mismatch')
  })

  it('rechaza un plan con una variante que el catálogo no aprobó', () => {
    const plan = planOf('compose-1')
    const stage = plan.stages[0]
    const beat = stage?.beats[0]
    if (stage === undefined || beat === undefined) throw new Error('sin beat')

    const codes = validateComposedPlan(
      {
        ...plan,
        stages: [
          {
            ...stage,
            beats: [
              {
                ...beat,
                variant: {
                  ...beat.variant,
                  variantId: 'c99999' as typeof beat.variant.variantId,
                },
              },
              ...stage.beats.slice(1),
            ],
          },
        ],
      },
      {
        catalog: grade7Catalog,
        policy: grade7CompositionPolicy,
        approvedVariants: grade7ApprovedVariants,
      },
    ).map((issue) => issue.code)

    expect(codes).toContain('plan.unapproved-variant')
  })

  it('rechaza un plan compuesto por otra política', () => {
    const codes = validateComposedPlan(
      { ...planOf('compose-1'), compositionPolicyVersion: '9.9.9' },
      {
        catalog: grade7Catalog,
        policy: grade7CompositionPolicy,
        approvedVariants: grade7ApprovedVariants,
      },
    ).map((issue) => issue.code)

    expect(codes).toContain('plan.policy-mismatch')
  })

  it('rechaza un plan que declara otro catálogo aprobado', () => {
    const codes = validateComposedPlan(
      { ...planOf('compose-1'), variantCatalogVersion: 'grade-7-dev-1' },
      {
        catalog: grade7Catalog,
        policy: grade7CompositionPolicy,
        approvedVariants: grade7ApprovedVariants,
      },
    ).map((issue) => issue.code)

    expect(codes).toContain('plan.catalog-mismatch')
  })

  it('rechaza un plan con dos anchors', () => {
    const plan = planOf('compose-1')
    const stage = plan.stages[0]
    const anchor = stage?.beats[0]
    if (stage === undefined || anchor === undefined) throw new Error('sin beat')

    const codes = validateComposedPlan(
      {
        ...plan,
        stages: [
          {
            ...stage,
            beats: [anchor, anchor],
            difficultyCost: anchor.cost * 2,
          },
        ],
      },
      {
        catalog: grade7Catalog,
        policy: grade7CompositionPolicy,
        approvedVariants: grade7ApprovedVariants,
      },
    ).map((issue) => issue.code)

    expect(codes).toContain('plan.anchor-count')
    expect(codes).toContain('plan.duplicate-template')
  })

  it('rechaza un plan con las etapas fuera de orden escolar', () => {
    const development = createComposedDevelopmentDependencies()
    const composed = composeRun({
      seed: toRunSeed('orden'),
      stages: development.ruleset.stages.map((stage) => stage.id),
      catalog: development.catalog,
      policy: composedDevelopmentCompositionPolicy,
    })
    if (!isOk(composed)) throw new Error('no compuso')

    const codes = validateComposedPlan(
      { ...composed.value, stages: [...composed.value.stages].reverse() },
      {
        catalog: development.catalog,
        policy: composedDevelopmentCompositionPolicy,
      },
    ).map((issue) => issue.code)

    expect(codes).toContain('plan.stage-order')
  })

  it('rechaza una plantilla que la narrativa de la etapa no puede alojar', () => {
    const plan = planOf('compose-1')
    const stage = plan.stages[0]
    const anchor = stage?.beats.find((beat) => beat.role === 'anchor')
    const unhostable = grade7Catalog.template(toChallengeId('g7.mural-paint'))
    const variantId = grade7ApprovedVariants.variantsFor(
      toChallengeId('g7.mural-paint'),
    )[0]
    if (
      stage === undefined ||
      anchor === undefined ||
      unhostable === undefined ||
      unhostable.placement === 'recovery' ||
      variantId === undefined
    ) {
      throw new Error('fixture incompleta')
    }

    const cost = costOf(candidateDifficultyCostPolicy, unhostable.band)
    const replacement = {
      variant: {
        familyId: unhostable.family,
        templateId: unhostable.id,
        variantId,
      },
      role: unhostable.placement,
      band: unhostable.band,
      cost,
    } as const
    const difficultyCost = anchor.cost + cost
    const tampered: ComposedRunPlan = {
      ...plan,
      difficultyCost,
      stages: [
        {
          ...stage,
          beats: [anchor, replacement],
          difficultyCost,
        },
      ],
    }

    const codes = validateComposedPlan(tampered, {
      catalog: grade7Catalog,
      policy: grade7CompositionPolicy,
      approvedVariants: grade7ApprovedVariants,
    }).map((issue) => issue.code)

    expect(codes).toContain('plan.template-not-hostable')
  })

  it('rechaza repetir una plantilla entre etapas cuando la política lo prohíbe', () => {
    const development = createComposedDevelopmentDependencies()
    const composed = composeRun({
      seed: toRunSeed('repetida'),
      stages: development.ruleset.stages.map((stage) => stage.id),
      catalog: development.catalog,
      policy: composedDevelopmentCompositionPolicy,
    })
    if (!isOk(composed)) throw new Error('no compuso')

    const grade7Stage = composed.value.stages[0]
    const year1Stage = composed.value.stages[1]
    const repeatedAnchor = grade7Stage?.beats.find(
      (beat) => beat.role === 'anchor',
    )
    const year1Anchor = year1Stage?.beats.find((beat) => beat.role === 'anchor')
    if (
      grade7Stage === undefined ||
      year1Stage === undefined ||
      repeatedAnchor === undefined ||
      year1Anchor === undefined
    ) {
      throw new Error('fixture incompleta')
    }

    const beats = year1Stage.beats.map((beat) =>
      beat === year1Anchor ? repeatedAnchor : beat,
    )
    const difficultyCost = beats.reduce((sum, beat) => sum + beat.cost, 0)
    const stages = composed.value.stages.map((stage) =>
      stage === year1Stage ? { ...stage, beats, difficultyCost } : stage,
    )
    const tampered: ComposedRunPlan = {
      ...composed.value,
      stages,
      difficultyCost: stages.reduce(
        (sum, stage) => sum + stage.difficultyCost,
        0,
      ),
    }

    const codes = validateComposedPlan(tampered, {
      catalog: development.catalog,
      policy: composedDevelopmentCompositionPolicy,
    }).map((issue) => issue.code)

    expect(codes).toContain('plan.repeated-template')
  })

  it('no valida re-componiendo: acepta un plan legal que no es el elegido', () => {
    /*
     * La diferencia entre un validador y una tautología.
     *
     * Este plan no es el que el compositor habría elegido para este seed —lleva
     * la otra plantilla del colectivo—, y es perfectamente legal. Un validador
     * que comparara contra el resultado del compositor lo rechazaría, y con él
     * rechazaría a cualquier cliente que compusiera distinto siendo válido.
     */
    const mine = planOf('compose-0')
    const other = SEEDS.map((seed) => planOf(seed)).find(
      (plan) =>
        plan.stages[0]?.beats[0]?.variant.templateId !==
        mine.stages[0]?.beats[0]?.variant.templateId,
    )
    if (other === undefined) throw new Error('no hay plan alternativo')

    expect(planFingerprint(other)).not.toBe(planFingerprint(mine))
    expect(
      validateComposedPlan(other, {
        catalog: grade7Catalog,
        policy: grade7CompositionPolicy,
        approvedVariants: grade7ApprovedVariants,
      }),
    ).toEqual([])
  })
})

describe('el ruleset conoce su política de composición', () => {
  it('la lleva declarada, porque decide qué es una run', () => {
    expect(grade7.ruleset.composition?.id).toBe('grade-7-composed')
  })

  it('no puede declararse oficial con una calibración de desarrollo', () => {
    expect(grade7.ruleset.official).toBe(false)
    expect(grade7CompositionPolicy.official).toBe(false)
    expect(grade7CompositionPolicy.costPolicy.official).toBe(false)
  })
})
