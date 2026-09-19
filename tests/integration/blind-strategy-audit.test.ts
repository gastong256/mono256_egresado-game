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
}

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
      // Una excepción sólo vale si es **más** estricta que el techo global en
      // el eje que no sobrepasa: aflojar los dos sería borrar el contrato.
      expect(accepted.share).toBeLessThan(BLOCKING_SHARE)
      expect(rows.some((entry) => entry.templateId === templateId)).toBe(true)
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
