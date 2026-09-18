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
  type BlindStrategyRow,
} from '../helpers/blind-strategy'

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
