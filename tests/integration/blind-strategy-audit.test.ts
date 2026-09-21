/**
 * Auditoría permanente de estrategia ciega (WP-AUDIT).
 *
 * Mide, con el evaluador real y sobre el catálogo aprobado vigente de carrera
 * completa, cuánto rinde no mirar los números: R (azar), K (mejor respuesta
 * constante) y S (mayor proporción de variantes con la misma respuesta óptima).
 * Los techos son los de la sección 3 de
 * `docs/04-quality/mathematics-remediation-spec.md`, por Template: no hay un
 * umbral universal.
 *
 * Desde la ronda 2 el espacio de respuesta se clasifica por **capacidad** y no
 * por nombre de motor (RS-RA-AUDIT-001): toda Template del catálogo recibe una
 * fila con su modo, y donde existe un vector constante comparable que entra en el
 * presupuesto se enumera **entero**. Eso es lo que hace visibles los atajos de
 * las Templates de construcción, que la ronda 1 no medía.
 *
 * `pnpm game:blind-audit` imprime la tabla completa sin afirmar nada;
 * `-- --coverage` agrega la matriz de cobertura.
 */
import { beforeAll, describe, expect, it } from 'vitest'
import { createFullCareerDependencies } from '@/content/full-career'
import { grade5VariantCatalog } from '@/content/grade-5'
import {
  auditBlindStrategies,
  COVERAGE_DEPTHS,
  EVALUATION_BUDGET,
  STRATEGY_FAMILIES,
  type BlindStrategyRow,
} from '../helpers/blind-strategy'
import {
  createGrade4Dependencies,
  grade4VariantCatalog,
} from '@/content/grade-4'
import { fundraiserSchema } from '@/content/grade-4/challenges/course-project-fundraiser'
import { publishedParams } from '../helpers/published-params'

/** El techo probado de `y5.stage-screen`: 78 × 25 variantes (D-S08-116). */
const SCREEN_K_NUMERATOR = 1950

let rows: readonly BlindStrategyRow[] = []
const row = (templateId: string) => {
  const found = rows.find((entry) => entry.templateId === templateId)
  if (found === undefined) throw new Error(`falta ${templateId} en el catálogo`)
  if (found.mode !== 'AUDITED_EXHAUSTIVELY')
    throw new Error(`${templateId} no se enumeró: ${found.reason ?? ''}`)
  return found
}

beforeAll(() => {
  rows = auditBlindStrategies(
    createFullCareerDependencies(),
    grade5VariantCatalog,
  )
})

describe('RS-RA-AUDIT-001 · cobertura por capacidad', () => {
  it('toda Template del catálogo recibe un modo de auditoría declarado', () => {
    expect(new Set(rows.map((entry) => entry.templateId))).toEqual(
      new Set(grade5VariantCatalog.entries.map((entry) => entry.templateId)),
    )
    expect(rows).toHaveLength(
      new Set(grade5VariantCatalog.entries.map((entry) => entry.templateId))
        .size,
    )
    for (const entry of rows) {
      expect(['A', 'B', 'C', 'D']).toContain(entry.category)
      expect([
        'AUDITED_EXHAUSTIVELY',
        'AUDITED_BY_POLICIES',
        'NOT_APPLICABLE_WITH_REASON',
        'BLOCKED_BY_SPACE_WITH_REASON',
      ]).toContain(entry.mode)
      // Nunca «no enumerable» sin razón: si no se enumeró, dice por qué.
      if (entry.mode !== 'AUDITED_EXHAUSTIVELY')
        expect(entry.reason ?? '').not.toBe('')
    }
  })

  it('ninguna Template queda sin soporte de medición', () => {
    const unsupported = rows.filter(
      (entry) => entry.mode === 'BLOCKED_BY_SPACE_WITH_REASON',
    )
    expect(unsupported.map((entry) => entry.templateId)).toEqual([])
  })

  it('las Templates de construcción con vector constante estable se enumeran enteras', () => {
    // Las cuatro que el contrato nombra: su cardinal es tratable y la ronda 1
    // las reportaba como «no enumerable» por el nombre de su motor.
    for (const templateId of [
      'g7.stand-supplies',
      'y3.course-project-tech',
      'y4.course-project-fundraiser',
      'y4.school-event-flow',
    ]) {
      const entry = row(templateId)
      expect(entry.mode).toBe('AUDITED_EXHAUSTIVELY')
      expect(entry.cardinality ?? 0).toBeGreaterThan(0)
      expect(entry.evaluations ?? 0).toBeLessThanOrEqual(EVALUATION_BUDGET)
    }
  })

  it('las Templates sin vector constante comparable se miden con políticas', () => {
    for (const entry of rows.filter(
      (candidate) => candidate.mode === 'AUDITED_BY_POLICIES',
    ))
      expect(entry.policies.length).toBeGreaterThan(0)
  })

  it('el presupuesto de evaluaciones se respeta en toda enumeración exhaustiva', () => {
    for (const entry of rows.filter(
      (candidate) => candidate.mode === 'AUDITED_EXHAUSTIVELY',
    ))
      expect(entry.evaluations ?? 0).toBeLessThanOrEqual(EVALUATION_BUDGET)
  })
})

describe('RS-RA-002 · y3.course-project-tech resiste la respuesta constante', () => {
  it('K ≤ 65 y S ≤ 35 % sobre el espacio constante entero', () => {
    const tech = row('y3.course-project-tech')
    expect(tech.mode).toBe('AUDITED_EXHAUSTIVELY')
    expect(tech.K).toBeLessThanOrEqual(65)
    expect(tech.S).toBeLessThanOrEqual(0.35)
  })

  it('al menos cinco vectores distintos son óptimos en el catálogo', () => {
    expect(
      row('y3.course-project-tech').optimalSignatures,
    ).toBeGreaterThanOrEqual(5)
  })

  it('un plan óptimo sigue existiendo en toda variante', () => {
    const tech = row('y3.course-project-tech')
    expect(tech.reachable.optimal).toBe(tech.variants)
  })
})

describe('RS-RA-003 · y4.course-project-fundraiser resiste la respuesta constante', () => {
  it('K ≤ 65 y S ≤ 35 % sobre el espacio constante entero', () => {
    const pena = row('y4.course-project-fundraiser')
    expect(pena.mode).toBe('AUDITED_EXHAUSTIVELY')
    expect(pena.K).toBeLessThanOrEqual(65)
    expect(pena.S).toBeLessThanOrEqual(0.35)
  })

  it('al menos cinco vectores distintos son óptimos en el catálogo', () => {
    expect(
      row('y4.course-project-fundraiser').optimalSignatures,
    ).toBeGreaterThanOrEqual(5)
  })

  it('un plan óptimo sigue existiendo en toda variante', () => {
    const pena = row('y4.course-project-fundraiser')
    expect(pena.reachable.optimal).toBe(pena.variants)
  })
})

describe('auditoría de estrategia ciega sobre el catálogo de carrera completa', () => {
  it('mide todas las Templates de tarjeta, clasificación y entrada numérica', () => {
    const enumerable = rows.filter(
      (entry) => entry.mode === 'AUDITED_EXHAUSTIVELY',
    )
    expect(enumerable.length).toBeGreaterThanOrEqual(18)
    for (const entry of enumerable) {
      expect(entry.R).toBeGreaterThanOrEqual(10)
      expect(entry.K).toBeLessThanOrEqual(100)
      // El óptimo existe en toda variante.
      expect(entry.reachable.optimal).toBe(entry.variants)
    }
  })

  it('la postura pública nunca cambia la calidad matemática de una clasificación', () => {
    for (const entry of rows.filter(
      (candidate) => candidate.mode === 'AUDITED_EXHAUSTIVELY',
    ))
      expect(entry.stanceLeaks).toBe(0)
  })

  it('y3.transport-pass: K ≤ R + 10, S ≤ 40 % y cada opción óptima en al menos 3 variantes', () => {
    const transport = row('y3.transport-pass')
    expect(transport.K).toBeLessThanOrEqual(transport.R + 10)
    expect(transport.S).toBeLessThanOrEqual(0.4)
    for (const option of ['suelto', 'recargable', 'combo', 'abono']) {
      const qualities = transport.constantById.get(option) ?? []
      expect(
        qualities.filter((q) => q === 'optimal').length,
      ).toBeGreaterThanOrEqual(3)
    }
  })

  it('y2.data-claim-review: K ≤ 75 y S ≤ 60 %', () => {
    const review = row('y2.data-claim-review')
    expect(review.K).toBeLessThanOrEqual(75)
    expect(review.S).toBeLessThanOrEqual(0.6)
  })

  it('y2.course-project-survey: K ≤ 60 y S ≤ 35 %', () => {
    const survey = row('y2.course-project-survey')
    expect(survey.K).toBeLessThanOrEqual(60)
    expect(survey.S).toBeLessThanOrEqual(0.35)
  })

  it('y2.standings-claim: K ≤ 65 y S ≤ 35 %', () => {
    const standings = row('y2.standings-claim')
    expect(standings.K).toBeLessThanOrEqual(65)
    expect(standings.S).toBeLessThanOrEqual(0.35)
  })

  // RS-MAT-008: el techo de esta Template es 78, no 70, y es el mínimo
  // demostrado, no una relajación. «Entera» no recorta nada, así que es válida
  // en toda variante y, donde algún recorte vale, la escalera la deja en
  // `efficient`: K = 75 + 25·w. Con la óptima repartida (punto 7) y la
  // heurística de lado acotada (punto 9), w ≥ 1/10 y el piso entero sobre 25
  // variantes es 78 (D-S08-116).
  it('y5.stage-screen: K ≤ 78 —el mínimo factible— y S ≤ 40 %', () => {
    const screen = row('y5.stage-screen')
    // En enteros: el puntaje total de la mejor respuesta constante sobre las 25
    // variantes no pasa de 1950 centésimos de escalera.
    expect(Math.round(screen.K * screen.variants)).toBeLessThanOrEqual(
      SCREEN_K_NUMERATOR,
    )
    expect(screen.S).toBeLessThanOrEqual(0.4)
  })

  it('y5.course-project-final: K ≤ 65 y S ≤ 35 %', () => {
    const final = row('y5.course-project-final')
    expect(final.K).toBeLessThanOrEqual(65)
    expect(final.S).toBeLessThanOrEqual(0.35)
  })

  it('y5.next-step-options: K ≤ 65 y S ≤ 35 %', () => {
    const next = row('y5.next-step-options')
    expect(next.K).toBeLessThanOrEqual(65)
    expect(next.S).toBeLessThanOrEqual(0.35)
  })

  it('y4.represent-class: marcar todo «No entra» nunca llega a efficient', () => {
    const council = row('y4.represent-class')
    // `constantById` indexa por el texto legible de la clasificación, que sólo
    // existe cuando los ids de enunciado y etiqueta son los mismos en todas las
    // variantes. Es el caso del consejo, y es lo que hace legible la aserción.
    const allOut = [...council.constantById.entries()].find(([key]) =>
      key.split(',').every((part) => part.endsWith('=no-entra')),
    )
    expect(allOut).toBeDefined()
    for (const quality of allOut?.[1] ?? [])
      expect(['functional', 'invalid']).toContain(quality)
  })

  it('g7.mural-paint: K reportado dentro de lo esperado (≤ 73)', () => {
    expect(row('g7.mural-paint').K).toBeLessThanOrEqual(73)
  })
})

/* -------------------------------------------------------------------------
 * Cierre de STAGE-08: resistencia a atajos de baja complejidad.
 * ---------------------------------------------------------------------- */

/**
 * El techo del sprint de cierre para Templates puntuables.
 *
 * Un atajo reutilizable que promedie 85 o más, o que rinda `optimal` en el 80 %
 * del catálogo, bloquea: con eso un jugador saca puntaje competitivo alto sin
 * hacer la matemática que la Template existe para medir. No es una ley
 * educativa universal: es el criterio finito con el que este sprint cierra.
 */
const BLOCKING_MEAN = 85
const BLOCKING_SHARE = 0.8

/**
 * Políticas que **son** el razonamiento buscado, no un atajo.
 *
 * La regla del sprint es explícita: una política de alto rendimiento sólo se
 * acepta si la razón está escrita y si la política es genuinamente parte del
 * constructo. Cada entrada de acá dice cuál es ese constructo.
 */
interface AcceptedExposure {
  /** Por qué la política no es un bypass del constructo. */
  readonly reason: string
  /** Cota propia, por encima de la cual vuelve a bloquear. */
  readonly mean: number
  readonly share: number
  /**
   * El piso estructural medido que explica la excepción.
   *
   * Obligatorio cuando la exposición supera **los dos** ejes del techo global:
   * ahí no alcanza con escribir una razón, porque aflojar los dos ejes sin
   * evidencia sería borrar el contrato. El piso dice qué rinde acertar
   * cualquier respuesta que entre, la auditoría lo vuelve a medir sola, y la
   * cota aceptada tiene que quedar pegada a él.
   */
  readonly floor?: { readonly mean: number; readonly share: number }
}

/** Cuánto puede despegarse una excepción de su propio piso antes de bloquear. */
const FLOOR_MEAN_MARGIN = 10
const FLOOR_SHARE_MARGIN = 0.2

/**
 * Exposición aceptada con razón escrita, y con su propio techo.
 *
 * No es relajar el techo del sprint: es declarar dónde la medición sobrepasa la
 * media de 85 sin que exista un bypass, y dejar una cota más ajustada que la
 * global para que cualquier empeoramiento vuelva a fallar.
 */
const ACCEPTED_EXPOSURE: Readonly<Record<string, AcceptedExposure>> = {
  // 1.º, banda CORE, `optimization: 0`: la Template pide **construir** un plan
  // que entre en los datos, no optimizarlo. Su escalera da `efficient` a toda
  // producción que respete la capacidad y use alguna cosa opcional, así que 75
  // es el piso de haber hecho bien la cuenta, no el premio de saltearla:
  // medido sobre los 8.125 planes del catálogo, **cualquier** plan válido
  // promedia 78,63 y es óptimo en el 19,9 %, mientras que responder al azar
  // promedia 15,52. La política llena el presupuesto —que es exactamente la
  // relación consumo/capacidad que el año enseña— y **no** resuelve el pedido
  // que separa `optimal` de `efficient`: falla en 14 de 25 variantes. Queda
  // anotada para la revisión humana y para el pacing con jugadores reales.
  'y1.mobile-data': {
    reason:
      'la política hace la cuenta de consumo contra capacidad, que es el constructo de la banda CORE; el piso de 75 es de la escalera, no del atajo',
    mean: 87,
    share: 0.5,
  },
  // 7.º, `assignment-board`. La auditoría final de cierre midió estas dos
  // políticas de forma independiente —90,00 · 83,3 % emparejando por horas y
  // 85,00 · 83,3 % por estrellas— y las adjudicó **no bloqueantes** con su
  // análisis de constructo: de las 24 permutaciones sólo entran 1 o 2 por
  // equipo, así que acertar **cualquier** reparto factible ya promedia 82,00 y
  // es óptimo en el 70 %. Emparejar por horas hace la mitad que discrimina —el
  // filtro de capacidad— y queda 8 puntos sobre ese piso; la de estrellas se
  // saltea las horas y queda 3, y cae en `invalid` en cuanto diverge. No hay
  // constructo que saltear porque el espacio factible es casi un punto: eso es
  // MAT-FC-003, que queda abierto para la revisión humana. Las cotas de acá
  // están pegadas al piso medido, así que cualquier empeoramiento vuelve a
  // fallar, y la auditoría re-mide ese piso sola en cada corrida.
  'g7.group-tasks': {
    reason:
      'el espacio factible tiene 1 o 2 repartos de 24, así que el piso de acertar cualquiera ya es 82,00 · 70 %: la política hace el filtro de capacidad, no saltea un constructo que apenas existe (MAT-FC-003, revisión humana)',
    mean: 91,
    share: 0.88,
    floor: { mean: 82, share: 0.7 },
  },
}

const INTENDED_REASONING: Readonly<Record<string, readonly string[]>> = {
  // La peña se decide por el margen de contribución por minuto de cocina: es
  // la cuenta del año, la que la ficha de 4.º declara LOCKED y la que el
  // Repaso `y4.margin-review` repara. Que resuelva el catálogo es el objetivo
  // del beat, no una fuga: el señuelo —precio sin restar el costo— rinde muy
  // por debajo, y el techo constante sigue en K ≤ 65.
  'y4.course-project-fundraiser': [
    'llenar «Cocina» por mayor $ #2 − #1 por min de «Cocina»',
  ],
}

describe('RS-CLO-AUDIT-001 · taxonomía finita de atajos', () => {
  it('toda Template declara qué familias canónicas se le evaluaron', () => {
    for (const entry of rows) {
      expect(entry.families.length).toBeGreaterThan(0)
      for (const family of entry.families)
        expect(STRATEGY_FAMILIES).toContain(family)
      // Una fila «cubierta» sin políticas ni enumeración no es cobertura.
      expect(
        entry.policies.length > 0 || entry.mode === 'AUDITED_EXHAUSTIVELY',
      ).toBe(true)
    }
  })

  it('las familias relativas a la pantalla se evalúan donde la pantalla las permite', () => {
    // Las dos Templates que la ronda 2 no pudo defender son justamente las que
    // necesitan familias relativas: si desaparecieran, el punto ciego vuelve.
    for (const templateId of [
      'y3.course-project-tech',
      'y4.course-project-fundraiser',
    ]) {
      const entry = rows.find(
        (candidate) => candidate.templateId === templateId,
      )
      expect(entry).toBeDefined()
      for (const family of [
        'VISIBLE_COPY',
        'TARGET_RELATIVE',
        'RESOURCE_RELATIVE',
        'FIXED_PRIORITY',
        'SIMPLE_GREEDY',
      ])
        expect(entry?.families).toContain(family)
    }
  })

  it('la enumeración constante y las políticas conviven en las Templates de categoría A', () => {
    for (const entry of rows.filter(
      (candidate) => candidate.mode === 'AUDITED_EXHAUSTIVELY',
    )) {
      expect(entry.families).toContain('CONSTANT')
      expect(entry.policies.length).toBeGreaterThan(0)
    }
  })
})

describe('RS-CLO-001 · ninguna Template puntuable cae ante un atajo de baja complejidad', () => {
  it('ninguna política reusable promedia 85 ni rinde óptimo en el 80 % del catálogo', () => {
    // Se listan todas las infracciones antes de fallar: un techo que se rompe
    // en varias Templates a la vez tiene que verse entero, no de a una.
    const blocking = rows
      .filter((entry) => entry.scoreBearing)
      .flatMap((entry) => {
        const intended = INTENDED_REASONING[entry.templateId] ?? []
        const accepted = ACCEPTED_EXPOSURE[entry.templateId]
        const meanCeiling = accepted?.mean ?? BLOCKING_MEAN
        const shareCeiling = accepted?.share ?? BLOCKING_SHARE
        return entry.policies
          .filter(
            (policy) =>
              !intended.includes(policy.name) &&
              (policy.mean >= meanCeiling ||
                policy.optimal / entry.variants >= shareCeiling),
          )
          .map(
            (policy) =>
              `${entry.templateId}: «${policy.name}» [${policy.family}] media ${policy.mean.toFixed(2)} · óptima ${String(policy.optimal)}/${String(entry.variants)}`,
          )
      })
    expect(blocking).toEqual([])
  })

  it('toda exposición aceptada trae su razón escrita', () => {
    for (const [templateId, accepted] of Object.entries(ACCEPTED_EXPOSURE)) {
      expect(accepted.reason.length).toBeGreaterThan(40)
      const entry = rows.find((row) => row.templateId === templateId)
      expect(entry).toBeDefined()

      // Una excepción tiene que ser **más** estricta que el techo global en
      // todo eje que no sobrepase: aflojar los dos sin evidencia sería borrar
      // el contrato.
      const overMean = accepted.mean > BLOCKING_MEAN
      const overShare = accepted.share > BLOCKING_SHARE
      if (!overMean) expect(accepted.mean).toBeLessThan(BLOCKING_MEAN)
      if (!overShare) expect(accepted.share).toBeLessThan(BLOCKING_SHARE)

      // Y si sobrepasa los dos, la razón escrita no alcanza: tiene que declarar
      // el piso estructural que la explica, la auditoría tiene que volver a
      // medir al menos ese piso por su cuenta, y la cota tiene que quedar
      // pegada a él.
      if (overMean && overShare) {
        const floor = accepted.floor
        expect(floor).toBeDefined()
        if (floor === undefined) continue
        expect(entry?.viable).toBeDefined()
        expect(entry?.viable?.floorMean ?? 0).toBeGreaterThanOrEqual(floor.mean)
        expect(entry?.viable?.floorShare ?? 0).toBeGreaterThanOrEqual(
          floor.share,
        )
        expect(accepted.mean).toBeLessThanOrEqual(
          floor.mean + FLOOR_MEAN_MARGIN,
        )
        expect(accepted.share).toBeLessThanOrEqual(
          floor.share + FLOOR_SHARE_MARGIN,
        )
      }
    }
  })

  it('la constante enumerada tampoco llega al techo del sprint', () => {
    for (const entry of rows.filter(
      (candidate) =>
        candidate.scoreBearing && candidate.mode === 'AUDITED_EXHAUSTIVELY',
    )) {
      expect(entry.K).toBeLessThan(BLOCKING_MEAN)
      expect(entry.S).toBeLessThan(BLOCKING_SHARE)
    }
  })
})

describe('RS-CLO-002 · los dos atajos de la ronda 2 quedaron cerrados', () => {
  it('y3.course-project-tech: copiar la pantalla nunca llega a óptimo', () => {
    const tech = row('y3.course-project-tech')
    for (const policy of tech.policies.filter(
      (entry) => entry.family === 'VISIBLE_COPY',
    ))
      expect(policy.optimal).toBe(0)
  })

  it('y4.course-project-fundraiser: «menos minutos primero» ya no domina', () => {
    const pena = row('y4.course-project-fundraiser')
    const byMinutes = pena.policies.find(
      (entry) => entry.name === 'llenar «Cocina» por menor min',
    )
    expect(byMinutes).toBeDefined()
    expect(byMinutes?.mean ?? 0).toBeLessThan(BLOCKING_MEAN)
    expect((byMinutes?.optimal ?? 0) / pena.variants).toBeLessThan(0.5)
  })

  it('y4.course-project-fundraiser: el catálogo tiene economías distintas, no etiquetas rotadas', () => {
    // Seis economías `(margen, minutos)` distintas, no una sola permutada.
    const economies = new Set(
      publishedParams(
        createGrade4Dependencies(),
        grade4VariantCatalog,
        'y4.course-project-fundraiser',
        (params) => fundraiserSchema.parse(params),
      ).map((params) =>
        JSON.stringify(
          params.items
            .map((item) => [item.price - item.cost, item.minutes])
            .sort(
              (left, right) =>
                (left[0] ?? 0) - (right[0] ?? 0) ||
                (left[1] ?? 0) - (right[1] ?? 0),
            ),
        ),
      ),
    )
    expect(economies.size).toBeGreaterThanOrEqual(5)
  })
})

describe('RS-CLO-003 · los atajos hallados dentro del sprint quedaron cerrados', () => {
  it('g7.group-tasks: ningún reparto constante rinde el máximo en todo el catálogo', () => {
    const group = row('g7.group-tasks')
    expect(group.variants).toBeGreaterThanOrEqual(6)
    expect(group.K).toBeLessThan(BLOCKING_MEAN)
    expect(group.S).toBeLessThan(BLOCKING_SHARE)
  })

  it('y5.final-trip-or-event: elegir por lugares ya no elige siempre el mejor paquete', () => {
    const trip = row('y5.final-trip-or-event')
    const byPlaces = trip.policies.find((entry) =>
      entry.name.includes('lugares'),
    )
    expect(byPlaces).toBeDefined()
    expect(byPlaces?.mean ?? 0).toBeLessThan(BLOCKING_MEAN)
    expect((byPlaces?.optimal ?? 0) / trip.variants).toBeLessThan(
      BLOCKING_SHARE,
    )
  })
})

describe('MAT-FC-002 · la cobertura declara su profundidad y no la exagera', () => {
  it('cada fila declara una profundidad canónica', () => {
    for (const entry of rows) expect(COVERAGE_DEPTHS).toContain(entry.depth)
  })

  it('ninguna fila se declara profunda sin haber corrido políticas de atributo', () => {
    for (const entry of rows) {
      const attribute = entry.policies.some(
        (policy) => policy.derivation === 'attribute',
      )
      if (
        entry.depth === 'ATTRIBUTE_POLICIES' ||
        entry.depth === 'EXHAUSTIVE_AND_ATTRIBUTE'
      )
        expect(attribute).toBe(true)
      // Y al revés: si corrieron, la fila no puede reportarse como sólo
      // posicional. La etiqueta sigue a la medición, nunca al revés.
      if (attribute) expect(entry.depth).not.toBe('POSITIONAL_POLICIES_ONLY')
      if (entry.mode === 'AUDITED_EXHAUSTIVELY')
        expect(entry.depth.startsWith('EXHAUSTIVE')).toBe(true)
    }
  })

  it('una fila cubierta sólo por políticas trae políticas de verdad', () => {
    for (const entry of rows.filter(
      (candidate) => candidate.mode === 'AUDITED_BY_POLICIES',
    )) {
      expect(entry.policies.length).toBeGreaterThan(0)
      // Declarar el límite es válido; fingir profundidad no.
      if (entry.policies.length < 3)
        expect(entry.depth).toBe('LIMITED_POLICY_COVERAGE')
    }
  })

  it('los tableros de asignación ya se miden por lo que imprimen, no sólo por posición', () => {
    // El motor que la auditoría de cierre encontró ciego a las políticas de
    // atributo. Donde la pantalla imprime una cifra por persona y por tarea,
    // tienen que existir y haberse medido.
    const group = row('g7.group-tasks')
    const attribute = group.policies.filter(
      (policy) => policy.derivation === 'attribute',
    )
    expect(attribute.length).toBeGreaterThan(0)
    expect(attribute.some((policy) => policy.name.includes('cifra'))).toBe(true)
    expect(
      attribute.some((policy) => policy.name.includes('quien mejor la hace')),
    ).toBe(true)
    expect(group.depth).toBe('EXHAUSTIVE_AND_ATTRIBUTE')
  })

  it('donde la pantalla no imprime atributos comparables, se dice y no se inventa', () => {
    // `y2.intercurso-plan` y `y4.shift-coverage` no imprimen una cifra por
    // tarea: fingir una política de atributo ahí sería inventar cobertura.
    for (const templateId of ['y2.intercurso-plan', 'y4.shift-coverage']) {
      const entry = rows.find(
        (candidate) => candidate.templateId === templateId,
      )
      expect(entry).toBeDefined()
      expect(entry?.policies.length ?? 0).toBeGreaterThan(0)
      expect(['POSITIONAL_POLICIES_ONLY', 'LIMITED_POLICY_COVERAGE']).toContain(
        entry?.depth,
      )
    }
  })

  it('el piso estructural se mide donde el espacio se enumeró entero', () => {
    for (const entry of rows.filter(
      (candidate) => candidate.mode === 'AUDITED_EXHAUSTIVELY',
    )) {
      expect(entry.viable).toBeDefined()
      expect(entry.viable?.min ?? -1).toBeGreaterThanOrEqual(0)
      expect(entry.viable?.max ?? -1).toBeGreaterThanOrEqual(
        entry.viable?.min ?? 0,
      )
    }
    // El caso que motivó la métrica: un espacio factible de uno o dos repartos
    // regala el piso a cualquier política que aterrice adentro (MAT-FC-003).
    const group = row('g7.group-tasks')
    expect(group.viable?.min ?? 99).toBeLessThanOrEqual(2)
    expect(group.viable?.floorMean ?? 0).toBeGreaterThan(70)
  })
})

describe('MAT-FC-001 · la corrección semántica se ve en la medición', () => {
  it('y3.course-project-tech: el llenado respeta los tres topes reales', () => {
    const tech = row('y3.course-project-tech')
    const fills = tech.policies.filter((policy) =>
      policy.name.startsWith('llenar sin pasarse de ningún límite'),
    )
    expect(fills.length).toBeGreaterThan(0)

    // Antes del arreglo, el tope espurio de 8 minutos cortaba todo llenado y
    // la mejor de estas políticas promediaba 41,40 sin llegar nunca a óptimo.
    // La auditoría final de cierre midió 79,40 · 40 % por su cuenta.
    const best = fills.reduce((top, policy) =>
      policy.mean > top.mean ? policy : top,
    )
    expect(best.mean).toBeGreaterThan(70)
    expect(best.optimal / tech.variants).toBeGreaterThan(0.3)

    // Y el techo del cierre sigue en pie con la medición corregida.
    expect(best.mean).toBeLessThan(BLOCKING_MEAN)
    expect(best.optimal / tech.variants).toBeLessThan(BLOCKING_SHARE)
  })

  it('y3.course-project-tech: el rato de laboratorio se lee como tope de MB', () => {
    const tech = row('y3.course-project-tech')
    const names = tech.policies.map((policy) => policy.name)
    // La dependencia encadenada del beat sí tiene que modelarse: el rato de
    // laboratorio, por lo que sube la conexión, es un tope en MB.
    expect(names.some((name) => name.includes('Laboratorio a mb'))).toBe(true)
    // Lo que no puede existir es ese mismo rato como tope de los minutos de
    // notebook, que son otra magnitud.
    expect(names.some((name) => name.startsWith('llenar «Laboratorio»'))).toBe(
      false,
    )
  })

  it('el catálogo declara una sola magnitud por unidad donde la pantalla lo dice', () => {
    // Ninguna otra Template imprime un recurso junto a la unidad, así que la
    // corrección no pudo mover sus cifras: esto lo fija.
    const fundraiser = row('y4.course-project-fundraiser')
    const intended = fundraiser.policies.find((policy) =>
      policy.name.includes('$ #2 − #1 por min de «Cocina»'),
    )
    expect(intended).toBeDefined()
    expect(intended?.mean).toBe(100)
  })
})
