import { describe, expect, it } from 'vitest'

import {
  aggregate,
  auditScorePolicy,
  bandOf,
  competitiveScorePolicyIssues,
  composeRun,
  createContentCatalog,
  evidenceForProfile,
  f1FromMetrics,
  isErr,
  isOk,
  metrics,
  parseScoreClaim,
  performanceFromRatio,
  scoreRun,
  scoredEventsOf,
  scoringProfileIssues,
  secondaryInfluence,
  serializeScoreClaim,
  toRunSeed,
  verifyScoreClaim,
  candidateFairScorePolicy,
  AUDIT_PROFILES,
  MAX_DIFFICULTY_REWARD,
  PERFORMANCE_SCALE,
  SCORE_COMPONENTS,
  SCORE_SCALE,
  type AuditedPlan,
  type CompetitiveScorePolicy,
  type ScoredEvent,
} from '@/game'
import {
  createComposedDevelopmentDependencies,
  composedDevelopmentCompositionPolicy,
  createDevelopmentContentCatalog,
  developmentChallenges,
} from '@/game/testing'
import {
  createGrade7ComposedDependencies,
  grade7Challenges,
  grade7CompositionPolicy,
  grade7Families,
  GRADE_7_HOSTABLE_TEMPLATES,
} from '@/content/grade-7'

/**
 * El score competitivo.
 *
 * Lo que se prueba no es que los pesos sean los correctos —eso lo decide el
 * Teacher Gate— sino que el mecanismo cumpla lo que promete: que la matemática
 * mande, que lo que un jugador no tuvo la oportunidad de hacer no le cueste
 * puntos, que el desglose cierre exactamente, y que nadie pueda declarar su
 * propio score.
 */

const catalog = createContentCatalog(grade7Families, grade7Challenges)
const policy = candidateFairScorePolicy

function event(
  templateId: string,
  quality: ScoredEvent['quality'],
  overrides: Partial<{ precision: number; efficiency: number }> = {},
): ScoredEvent {
  return {
    templateId: templateId as ScoredEvent['templateId'],
    quality,
    metrics: metrics({
      precision: overrides.precision ?? 1,
      efficiency: overrides.efficiency ?? 1,
      risk: 0,
    }),
  }
}

function scoreOf(events: readonly ScoredEvent[], use = policy): number {
  const result = scoreRun(events, catalog, use)
  if (!isOk(result)) throw new Error(`no se pudo puntuar: ${result.error.code}`)
  return result.value.fairScore
}

describe('la política candidata', () => {
  it('es candidata y lo dice', () => {
    expect(policy.official).toBe(false)
    expect(policy.id).toBe('fair-score-dev-1')
    expect(policy.id).not.toBe('current')
    expect(policy.id).not.toBe('latest')
  })

  it('lleva los pesos 80/15/5 del documento de diseño', () => {
    expect(policy.weights).toEqual({ math: 8_000, team: 1_500, aura: 500 })
    expect(
      SCORE_COMPONENTS.reduce((sum, key) => sum + policy.weights[key], 0),
    ).toBe(SCORE_SCALE)
  })

  it('no le da peso a Estilo ni a Promedio', () => {
    // No están en la unión de componentes: no es que valgan cero, es que no
    // existen como componente. Un peso cero se puede subir editando un número.
    expect(SCORE_COMPONENTS).toEqual(['math', 'team', 'aura'])
    expect(Object.keys(policy.weights).sort()).toEqual(['aura', 'math', 'team'])
  })

  it('mapea las cuatro calidades como el documento las declara', () => {
    expect(policy.discreteQuality).toEqual({
      optimal: 10_000,
      efficient: 7_500,
      functional: 4_000,
      invalid: 1_000,
    })
  })

  it('recompensa la dificultad con factores chicos, no con el costo de scheduling', () => {
    // El compositor cobra 210 centésimas por un `stretch` para poder equilibrar
    // una run. Pagar 2,1× por resolverlo dejaría que el sorteo decidiera un
    // ranking, que es justo lo que ese costo existe para evitar.
    expect(policy.difficultyReward).toEqual({
      core: 10_000,
      standard: 10_800,
      stretch: 11_500,
    })
    for (const reward of Object.values(policy.difficultyReward)) {
      expect(reward).toBeLessThanOrEqual(MAX_DIFFICULTY_REWARD)
    }
  })

  it('la valida sin problemas', () => {
    expect(competitiveScorePolicyIssues(policy)).toEqual([])
  })
})

describe('la validación de políticas rechaza lo indefendible', () => {
  const broken = (
    overrides: Partial<CompetitiveScorePolicy>,
  ): readonly string[] =>
    competitiveScorePolicyIssues({ ...policy, ...overrides })

  it('rechaza pesos que no suman la escala', () => {
    expect(
      broken({ weights: { math: 8_000, team: 1_500, aura: 1_500 } }),
    ).toContainEqual(expect.stringContaining('must sum to'))
  })

  it('rechaza que la matemática no domine', () => {
    expect(
      broken({ weights: { math: 4_000, team: 3_000, aura: 3_000 } }),
    ).toContainEqual(expect.stringContaining('mathematics must dominate'))
  })

  it('rechaza el empate exacto entre matemática y el resto', () => {
    expect(
      broken({ weights: { math: 5_000, team: 3_000, aura: 2_000 } }),
    ).toContainEqual(expect.stringContaining('mathematics must dominate'))
  })

  it('rechaza un mapeo de calidad no monótono', () => {
    expect(
      broken({
        discreteQuality: {
          optimal: 10_000,
          efficient: 7_500,
          functional: 8_000,
          invalid: 1_000,
        },
      }),
    ).toContainEqual(expect.stringContaining('not monotonic'))
  })

  it('rechaza una recompensa de dificultad que decide rankings', () => {
    expect(
      broken({
        difficultyReward: { core: 10_000, standard: 15_000, stretch: 21_000 },
      }),
    ).toContainEqual(expect.stringContaining('lets the draw decide a ranking'))
  })

  it('rechaza una recompensa que castiga la dificultad', () => {
    expect(
      broken({
        difficultyReward: { core: 10_000, standard: 9_000, stretch: 11_500 },
      }),
    ).toContainEqual(expect.stringContaining('below the'))
  })

  it('rechaza una identidad que no nombra una calibración', () => {
    expect(broken({ id: 'latest' })).toContainEqual(
      expect.stringContaining('name a calibration'),
    )
  })

  it('el motor se niega a puntuar con una política inválida', () => {
    const result = scoreRun([event('g7.bus-timing', 'optimal')], catalog, {
      ...policy,
      weights: { math: 1_000, team: 5_000, aura: 4_000 },
    })
    if (!isErr(result)) throw new Error('debería haber sido rechazado')
    expect(result.error.code).toBe('invalid-score-policy')
  })
})

describe('el desglose cierra', () => {
  it('las contribuciones suman exactamente el score', () => {
    const cases: ScoredEvent[][] = [
      [event('g7.bus-timing', 'optimal')],
      [
        event('g7.bus-timing', 'functional'),
        event('g7.may-25-act', 'efficient', {
          precision: 0.7,
          efficiency: 0.6,
        }),
      ],
      [
        event('g7.group-tasks', 'efficient', { efficiency: 0.37 }),
        event('g7.mural-paint', 'invalid'),
        event('g7.stand-supplies', 'functional'),
      ],
    ]

    for (const events of cases) {
      const result = scoreRun(events, catalog, policy)
      if (!isOk(result)) throw new Error('no se pudo puntuar')
      const sum = result.value.components.reduce(
        (total, component) => total + component.contribution,
        0,
      )
      expect(sum).toBe(result.value.fairScore)
    }
  })

  it('dice qué política lo produjo', () => {
    const result = scoreRun(
      [event('g7.bus-timing', 'optimal')],
      catalog,
      policy,
    )
    if (!isOk(result)) throw new Error('no se pudo puntuar')
    expect(result.value.scorePolicyId).toBe('fair-score-dev-1')
    expect(result.value.scorePolicyVersion).toBe('1.0.0-candidate')
    expect(result.value.official).toBe(false)
  })

  it('expone los totales matemáticos que hay detrás de la normalización', () => {
    const result = scoreRun(
      [event('g7.bus-timing', 'optimal'), event('g7.group-tasks', 'invalid')],
      catalog,
      policy,
    )
    if (!isOk(result)) throw new Error('no se pudo puntuar')

    // 10000 y 1000 puntos base, los dos con recompensa `standard`/`stretch`.
    expect(result.value.mathMax).toBeGreaterThan(result.value.mathRaw)
    expect(result.value.components[0]?.performance).toBe(
      Math.round((10_000 * result.value.mathRaw) / result.value.mathMax),
    )
  })
})

describe('la matemática manda', () => {
  it('el techo de lo no matemático es el que la política declara', () => {
    expect(secondaryInfluence(policy)).toBe(2_000)
    expect(policy.weights.math).toBeGreaterThan(secondaryInfluence(policy))
  })

  it('equipo y aura perfectos no rescatan una run matemáticamente pobre', () => {
    // El acto y el colectivo no ofrecen ni equipo ni aura, así que el caso se
    // arma con contenido que sí: el trabajo grupal.
    const weakMath = scoreOf([
      event('g7.group-tasks', 'invalid', { efficiency: 1 }),
    ])
    const strongMath = scoreOf([event('g7.bus-timing', 'efficient')])

    expect(weakMath).toBeLessThan(strongMath)
  })

  it('la ventaja que equipo y aura pueden dar está acotada por los pesos', () => {
    const withSecondary = aggregate(
      [
        {
          templateId: 'x' as never,
          band: 'core',
          difficultyReward: 10_000,
          math: { achieved: 5_000 * 10_000, available: 10_000 * 10_000 },
          team: { achieved: 10_000, available: 10_000 },
          aura: { achieved: 10_000, available: 10_000 },
        },
      ],
      policy,
    )
    const mathOnly = aggregate(
      [
        {
          templateId: 'x' as never,
          band: 'core',
          difficultyReward: 10_000,
          math: { achieved: 5_000 * 10_000, available: 10_000 * 10_000 },
          team: { achieved: 0, available: 0 },
          aura: { achieved: 0, available: 0 },
        },
      ],
      policy,
    )
    if (!isOk(withSecondary) || !isOk(mathOnly)) throw new Error('no puntuó')

    // Con la mitad de la matemática, tener equipo y aura perfectos mueve el
    // score exactamente lo que los pesos permiten: 20 % × (10000 − 5000).
    expect(withSecondary.value.fairScore - mathOnly.value.fairScore).toBe(
      Math.round((secondaryInfluence(policy) * 5_000) / SCORE_SCALE),
    )
  })
})

describe('la carrera no se filtra al score', () => {
  it('el score sólo mira evidencia de desempeño, no el estado de carrera', () => {
    // `scoreRun` no recibe carrera. La prueba de que Promedio, Equipo, Aura y
    // Estilo no pueden filtrarse es que no hay por dónde: la firma no los toma.
    const events = [event('g7.bus-timing', 'efficient')]
    expect(scoreOf(events)).toBe(scoreOf(events))
    expect(scoreRun.length).toBe(3)
  })

  it('el mismo desempeño puntúa igual venga de donde venga la run', () => {
    const fromComposed = scoreOf([
      event('g7.bus-timing', 'optimal'),
      event('g7.may-25-act', 'optimal'),
    ])
    const fromDemo = scoreOf([
      event('g7.bus-timing', 'optimal'),
      event('g7.may-25-act', 'optimal'),
    ])
    expect(fromComposed).toBe(fromDemo)
  })
})

describe('la oportunidad ausente no cuesta puntos', () => {
  it('el juego perfecto llega a la escala completa con o sin equipo', () => {
    const withTeam = scoreOf([
      event('g7.group-tasks', 'optimal', { efficiency: 1 }),
    ])
    const withoutTeam = scoreOf([event('g7.bus-timing', 'optimal')])

    expect(withTeam).toBe(SCORE_SCALE)
    expect(withoutTeam).toBe(SCORE_SCALE)
  })

  it('el peso de una componente ausente se reparte, no se pierde', () => {
    const result = scoreRun(
      [event('g7.bus-timing', 'optimal')],
      catalog,
      policy,
    )
    if (!isOk(result)) throw new Error('no se pudo puntuar')

    const math = result.value.components.find((c) => c.component === 'math')
    expect(math?.declaredWeight).toBe(8_000)
    // Sin equipo ni aura en el plan, la matemática se lleva la escala entera.
    expect(math?.effectiveWeight).toBe(SCORE_SCALE)
  })

  it('agregar una oportunidad de equipo no sube el techo', () => {
    expect(
      scoreOf([
        event('g7.bus-timing', 'optimal'),
        event('g7.group-tasks', 'optimal', { efficiency: 1 }),
      ]),
    ).toBe(SCORE_SCALE)
  })
})

describe('más beats no es más score', () => {
  it('un beat y seis beats tienen el mismo máximo', () => {
    const oneBeat = scoreOf([event('g7.bus-timing', 'optimal')])
    const sixBeats = scoreOf([
      event('g7.bus-timing', 'optimal'),
      event('g7.may-25-act', 'optimal'),
      event('g7.mural-paint', 'optimal'),
      event('g7.notebook-offer', 'optimal'),
      event('g7.group-tasks', 'optimal'),
      event('g7.stand-supplies', 'optimal'),
    ])
    expect(oneBeat).toBe(sixBeats)
  })

  it('un plan más difícil tampoco tiene un techo más alto', () => {
    const core = scoreOf([event('g7.may-25-act', 'optimal')])
    const stretch = scoreOf([event('g7.group-tasks', 'optimal')])
    expect(core).toBe(stretch)
  })

  it('la recompensa de dificultad pondera, no infla', () => {
    // Resolver bien lo difícil y mal lo fácil puntúa más que al revés, y las
    // dos siguen dentro de la misma escala.
    const hardWell = scoreOf([
      event('g7.group-tasks', 'optimal'),
      event('g7.may-25-act', 'invalid', { precision: 0.1, efficiency: 0.1 }),
    ])
    const easyWell = scoreOf([
      event('g7.group-tasks', 'invalid'),
      event('g7.may-25-act', 'optimal'),
    ])
    expect(hardWell).toBeGreaterThan(easyWell)
    expect(hardWell).toBeLessThan(SCORE_SCALE)
  })
})

describe('cada plantilla de producción declara cómo puntúa', () => {
  it('ninguna llega a la capa competitiva sin decidirlo', () => {
    for (const template of grade7Challenges) {
      expect(scoringProfileIssues(template.scoring)).toEqual([])
      expect(template.scoring.rationale.length).toBeGreaterThan(20)
    }
  })

  /*
   * La tabla de cobertura, fijada.
   *
   * Su valor no es que cada plantilla puntúe algo, sino el registro de qué
   * hecho lee cada componente. `none` es una decisión escrita: el stand mueve
   * Equipo en la carrera y aun así no aporta equipo competitivo, porque su
   * eficiencia *es* el óptimo de costo que la matemática ya cobró.
   */
  it('lee cada hecho una sola vez', () => {
    const coverage = Object.fromEntries(
      grade7Challenges.map((template) => [
        template.id,
        SCORE_COMPONENTS.map((component) =>
          template.scoring[component] === 'none' ? '-' : component[0],
        ).join(''),
      ]),
    )

    expect(coverage).toEqual({
      'g7.bus-timing': 'm--',
      'g7.bus-latest-departure': 'm--',
      'g7.mural-paint': 'm--',
      'g7.notebook-offer': 'm--',
      'g7.stand-supplies': 'm--',
      'g7.group-tasks': 'mt-',
      'g7.may-25-act': 'm--',
    })
  })

  it('el acto usa su F1 y no la banda que lo resume', () => {
    const exact = scoreOf([
      event('g7.may-25-act', 'efficient', { precision: 1, efficiency: 1 }),
    ])
    const half = scoreOf([
      event('g7.may-25-act', 'efficient', { precision: 0.5, efficiency: 0.5 }),
    ])

    // Misma calidad discreta, distinto F1: si la plantilla usara las cuatro
    // cajas, los dos scores serían iguales.
    expect(exact).not.toBe(half)
    expect(exact).toBe(SCORE_SCALE)
    expect(half).toBe(5_000)
  })

  it('el trabajo grupal separa factibilidad de afinidad', () => {
    const feasibleAndApt = scoreRun(
      [event('g7.group-tasks', 'optimal', { efficiency: 1 })],
      catalog,
      policy,
    )
    const feasibleAndClumsy = scoreRun(
      [event('g7.group-tasks', 'optimal', { efficiency: 0 })],
      catalog,
      policy,
    )
    if (!isOk(feasibleAndApt) || !isOk(feasibleAndClumsy)) {
      throw new Error('no se pudo puntuar')
    }

    // La matemática es la misma —el reparto es óptimo en los dos— y el equipo
    // no: ése es exactamente el segundo hecho que la componente lee.
    const mathOf = (r: typeof feasibleAndApt) =>
      r.value.components.find((c) => c.component === 'math')?.performance
    expect(mathOf(feasibleAndApt)).toBe(mathOf(feasibleAndClumsy))
    expect(feasibleAndApt.value.fairScore).toBeGreaterThan(
      feasibleAndClumsy.value.fairScore,
    )
  })

  it('los eventos narrativos no aportan ni cambian denominadores', () => {
    const withNarrative = scoredEventsOf([
      { challengeId: undefined, quality: undefined, metrics: undefined },
      {
        challengeId: 'g7.bus-timing' as never,
        quality: 'optimal',
        metrics: metrics({ precision: 1, efficiency: 1 }),
      },
    ])
    expect(withNarrative).toHaveLength(1)
    expect(scoreOf(withNarrative)).toBe(SCORE_SCALE)
  })
})

describe('el score se puede recomponer y verificar', () => {
  const events = [
    event('g7.bus-timing', 'efficient'),
    event('g7.may-25-act', 'functional', { precision: 0.6, efficiency: 0.5 }),
  ]

  it('sobrevive un round-trip JSON sin cambiar', () => {
    const result = scoreRun(events, catalog, policy)
    if (!isOk(result)) throw new Error('no se pudo puntuar')

    const parsed = parseScoreClaim(
      JSON.parse(JSON.stringify(serializeScoreClaim(result.value))) as unknown,
    )
    if (!isOk(parsed)) throw new Error('no se pudo parsear')
    expect(parsed.value).toEqual(serializeScoreClaim(result.value))
  })

  it('acepta un reclamo honesto', () => {
    const result = scoreRun(events, catalog, policy)
    if (!isOk(result)) throw new Error('no se pudo puntuar')

    const verified = verifyScoreClaim(
      serializeScoreClaim(result.value),
      events,
      catalog,
      policy,
    )
    if (!isOk(verified)) throw new Error('no verificó')
    expect(verified.value.issues).toEqual([])
    expect(verified.value.canonical.fairScore).toBe(result.value.fairScore)
  })

  it.each([
    [
      'el total',
      (c: ReturnType<typeof serializeScoreClaim>) => ({
        ...c,
        fairScore: 10_000,
      }),
    ],
    [
      'la contribución matemática',
      (c: ReturnType<typeof serializeScoreClaim>) => ({
        ...c,
        components: c.components.map((component) =>
          component.component === 'math'
            ? { ...component, contribution: 10_000 }
            : component,
        ),
      }),
    ],
    [
      'el desempeño de equipo',
      (c: ReturnType<typeof serializeScoreClaim>) => ({
        ...c,
        components: c.components.map((component) =>
          component.component === 'team'
            ? { ...component, performance: 10_000 }
            : component,
        ),
      }),
    ],
    [
      'los totales matemáticos',
      (c: ReturnType<typeof serializeScoreClaim>) => ({ ...c, mathMax: 1 }),
    ],
    [
      'la madurez de la política',
      (c: ReturnType<typeof serializeScoreClaim>) => ({ ...c, official: true }),
    ],
    [
      'la cantidad de beats',
      (c: ReturnType<typeof serializeScoreClaim>) => ({
        ...c,
        scoredBeats: 99,
      }),
    ],
  ])('rechaza un reclamo que falsea %s', (_label, tamper) => {
    const result = scoreRun(events, catalog, policy)
    if (!isOk(result)) throw new Error('no se pudo puntuar')

    const verified = verifyScoreClaim(
      tamper(serializeScoreClaim(result.value)),
      events,
      catalog,
      policy,
    )
    if (!isOk(verified)) throw new Error('no verificó')
    expect(verified.value.issues.length).toBeGreaterThan(0)
    // Y devuelve igual el score canónico: rechazar un reclamo no es no poder
    // puntuar la run.
    expect(verified.value.canonical.fairScore).toBe(result.value.fairScore)
  })

  it('rechaza un reclamo bajo otra política', () => {
    const result = scoreRun(events, catalog, policy)
    if (!isOk(result)) throw new Error('no se pudo puntuar')

    const verified = verifyScoreClaim(
      { ...serializeScoreClaim(result.value), scorePolicyVersion: '9.9.9' },
      events,
      catalog,
      policy,
    )
    if (!isOk(verified)) throw new Error('no verificó')
    expect(verified.value.issues[0]?.code).toBe('unknown-score-policy')
  })

  it('rechaza un reclamo con forma inválida en vez de castearlo', () => {
    expect(isErr(parseScoreClaim({ fairScore: 99_999 }))).toBe(true)
    expect(isErr(parseScoreClaim(null))).toBe(true)
    expect(
      isErr(
        parseScoreClaim({
          ...serializeScoreClaim({
            scorePolicyId: 'x',
            scorePolicyVersion: 'y',
            official: false,
            fairScore: 0,
            components: [],
            mathRaw: 0,
            mathMax: 0,
            scoredBeats: 0,
            optimalCount: 0,
            evidence: [],
          }),
        }),
      ),
    ).toBe(true)
  })
})

describe('una plantilla futura puntúa sin tocar el agregador', () => {
  it('acepta contenido que el scorer nunca vio', () => {
    // La prueba abierta-cerrada de esta etapa: una plantilla nueva declara su
    // perfil y el agregador la puntúa sin conocer su id.
    const synthetic = {
      ...(developmentChallenges[0] as (typeof developmentChallenges)[number]),
      id: 'future.unknown-template' as never,
      scoring: {
        math: 'discrete-quality' as const,
        team: ({ metrics: m }: { metrics: { efficiency: number } }) =>
          performanceFromRatio(m.efficiency),
        aura: 'none' as const,
        rationale:
          'Synthetic template proving the aggregation needs no knowledge of concrete content.',
      },
    }

    const extended = createContentCatalog(
      [...grade7Families],
      [...grade7Challenges, synthetic as never],
    )
    const result = scoreRun(
      [event('future.unknown-template', 'optimal', { efficiency: 0.5 })],
      extended,
      policy,
    )
    if (!isOk(result)) throw new Error('no se pudo puntuar')
    expect(result.value.fairScore).toBeGreaterThan(0)
  })

  it('rechaza una plantilla que el catálogo no tiene', () => {
    const result = scoreRun([event('no.existe', 'optimal')], catalog, policy)
    if (!isErr(result)) throw new Error('debería haber fallado')
    expect(result.error.code).toBe('unknown-template')
  })

  it('rechaza un perfil que devuelve algo fuera de escala', () => {
    const broken = {
      ...(grade7Challenges[0] as (typeof grade7Challenges)[number]),
      id: 'broken.out-of-range' as never,
      scoring: {
        math: () => PERFORMANCE_SCALE * 3,
        team: 'none' as const,
        aura: 'none' as const,
        rationale: 'Deliberately broken profile used to prove the range check.',
      },
    }
    const extended = createContentCatalog(
      [...grade7Families],
      [...grade7Challenges, broken as never],
    )
    const result = scoreRun(
      [event('broken.out-of-range', 'optimal')],
      extended,
      policy,
    )
    if (!isErr(result)) throw new Error('debería haber fallado')
    expect(result.error.code).toBe('performance-out-of-range')
  })

  it('rechaza una run sin evidencia puntuable', () => {
    const result = scoreRun([], catalog, policy)
    if (!isErr(result)) throw new Error('debería haber fallado')
    expect(result.error.code).toBe('no-scorable-evidence')
  })
})

describe('la auditoría sobre planes compuestos reales', () => {
  const grade7 = createGrade7ComposedDependencies()
  const development = createComposedDevelopmentDependencies()

  function plansFrom(count: number): AuditedPlan[] {
    const collected: AuditedPlan[] = []

    for (let index = 0; index < count; index += 1) {
      const composed = composeRun({
        seed: toRunSeed(`score-test-${String(index)}`),
        stages: ['grade-7'],
        catalog: grade7.catalog,
        ...(grade7.approvedVariants === undefined
          ? {}
          : { approvedVariants: grade7.approvedVariants }),
        policy: grade7CompositionPolicy,
      })
      if (composed.ok) {
        collected.push({
          plan: composed.value,
          catalog: grade7.catalog,
          population: 'grade-7',
        })
      }
    }

    for (let index = 0; index < count; index += 1) {
      const composed = composeRun({
        seed: toRunSeed(`score-dev-${String(index)}`),
        stages: development.ruleset.stages.map((stage) => stage.id),
        catalog: development.catalog,
        policy: composedDevelopmentCompositionPolicy,
      })
      if (composed.ok) {
        collected.push({
          plan: composed.value,
          catalog: development.catalog,
          population: 'development',
        })
      }
    }

    // Un plan de un solo beat, para probar que menos eventos no es menos techo.
    const oneBeat = composeRun({
      seed: toRunSeed('score-one-beat'),
      stages: ['grade-7'],
      catalog: grade7.catalog,
      ...(grade7.approvedVariants === undefined
        ? {}
        : { approvedVariants: grade7.approvedVariants }),
      policy: {
        ...grade7CompositionPolicy,
        stages: grade7CompositionPolicy.stages.map((stage) => ({
          ...stage,
          ordinaryBeats: { min: 1, max: 1 },
          difficulty: { target: 150, tolerance: 110 },
          hostableTemplates: [...GRADE_7_HOSTABLE_TEMPLATES],
        })),
      },
    })
    if (oneBeat.ok) {
      collected.push({
        plan: oneBeat.value,
        catalog: grade7.catalog,
        population: 'one-beat',
      })
    }

    return collected
  }

  const audit = auditScorePolicy({
    plans: plansFrom(120),
    policy,
    profiles: AUDIT_PROFILES,
  })

  it('no encuentra ningún problema', () => {
    expect(audit.issues.filter((issue) => issue.severity === 'error')).toEqual(
      [],
    )
  })

  it('el juego perfecto vale lo mismo en todos los planes', () => {
    const perfect = audit.profiles.find(
      (entry) => entry.profileId === 'perfect',
    )
    expect(perfect?.score.spread).toBe(0)
    expect(perfect?.score.max).toBe(SCORE_SCALE)
  })

  it('planes de distinta cantidad de beats tienen el mismo techo', () => {
    const maxima = audit.byBeatCount.map((entry) => entry.perfectScore.max)
    expect(audit.byBeatCount.length).toBeGreaterThan(1)
    expect(new Set(maxima).size).toBe(1)
  })

  it('el plan sin equipo no vale menos que el que lo tiene', () => {
    expect(audit.perfectWithoutTeam.max).toBe(audit.perfectWithTeam.max)
  })

  it('el plan sin aura no vale menos que el que la tiene', () => {
    expect(audit.perfectWithoutAura.max).toBe(audit.perfectWithAura.max)
  })

  it('una run floja en matemática nunca alcanza a una fuerte', () => {
    const strong = audit.profiles.find(
      (entry) => entry.profileId === 'strong-math-low-secondary',
    )
    const weak = audit.profiles.find(
      (entry) => entry.profileId === 'weak-math-high-secondary',
    )
    expect(weak?.score.max).toBeLessThan(strong?.score.min ?? 0)
  })
})

describe('los ayudantes de perfil', () => {
  it('convierten razones a puntos básicos con topes', () => {
    expect(performanceFromRatio(0)).toBe(0)
    expect(performanceFromRatio(1)).toBe(PERFORMANCE_SCALE)
    expect(performanceFromRatio(0.5)).toBe(5_000)
    expect(performanceFromRatio(-3)).toBe(0)
    expect(performanceFromRatio(7)).toBe(PERFORMANCE_SCALE)
    expect(performanceFromRatio(Number.NaN)).toBe(0)
  })

  it('calculan el F1 que el acto ya usa para juzgarse', () => {
    expect(f1FromMetrics(1, 1)).toBe(PERFORMANCE_SCALE)
    expect(f1FromMetrics(0, 0)).toBe(0)
    expect(f1FromMetrics(1, 0.5)).toBe(performanceFromRatio(2 / 3))
  })

  it('la banda de una plantilla es la que el compositor agenda', () => {
    for (const template of grade7Challenges) {
      expect(template.band).toBe(bandOf(template.cognitive))
    }
  })

  it('el catálogo de desarrollo también declara perfiles completos', () => {
    for (const template of createDevelopmentContentCatalog().templates) {
      expect(scoringProfileIssues(template.scoring)).toEqual([])
    }
  })

  it('evidenceForProfile respeta las oportunidades que el contenido declara', () => {
    const grade7 = createGrade7ComposedDependencies()
    const composed = composeRun({
      seed: toRunSeed('evidence'),
      stages: ['grade-7'],
      catalog: grade7.catalog,
      ...(grade7.approvedVariants === undefined
        ? {}
        : { approvedVariants: grade7.approvedVariants }),
      policy: grade7CompositionPolicy,
    })
    if (!isOk(composed)) throw new Error('no compuso')

    const evidence = evidenceForProfile(
      composed.value,
      grade7.catalog,
      policy,
      AUDIT_PROFILES[0] ?? { id: 'x', targets: { math: 0, team: 0, aura: 0 } },
    )
    // 7.º compuesto no tiene contenido de equipo ni de aura: la evidencia lo
    // refleja en vez de inventar una oportunidad.
    expect(evidence.every((beat) => beat.team.available === 0)).toBe(true)
    expect(evidence.every((beat) => beat.math.available > 0)).toBe(true)
  })
})
