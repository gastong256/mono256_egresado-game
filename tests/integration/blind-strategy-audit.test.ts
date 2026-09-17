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
 * `pnpm game:blind-audit` imprime la tabla completa sin afirmar nada.
 */
import { beforeAll, describe, expect, it } from 'vitest'
import { createFullCareerDependencies } from '@/content/full-career'
import { grade5VariantCatalog } from '@/content/grade-5'
import {
  auditBlindStrategies,
  type BlindStrategyRow,
} from '../helpers/blind-strategy'

let rows: readonly BlindStrategyRow[] = []
const row = (templateId: string) => {
  const found = rows.find((entry) => entry.templateId === templateId)
  if (found === undefined) throw new Error(`falta ${templateId} en el catálogo`)
  if (!found.enumerable) throw new Error(`${templateId} no es enumerable`)
  return found
}

beforeAll(() => {
  rows = auditBlindStrategies(
    createFullCareerDependencies(),
    grade5VariantCatalog,
  )
})

describe('auditoría de estrategia ciega sobre el catálogo de carrera completa', () => {
  it('mide todas las Templates de tarjeta, clasificación y entrada numérica', () => {
    const enumerable = rows.filter((entry) => entry.enumerable)
    expect(enumerable.length).toBeGreaterThanOrEqual(18)
    for (const entry of enumerable) {
      expect(entry.R).toBeGreaterThanOrEqual(10)
      expect(entry.K).toBeLessThanOrEqual(100)
      // El óptimo existe en toda variante.
      expect(entry.reachable.optimal).toBe(entry.variants)
    }
  })

  it('la postura pública nunca cambia la calidad matemática de una clasificación', () => {
    for (const entry of rows.filter((candidate) => candidate.enumerable))
      expect(entry.stanceLeaks).toBe(0)
  })

  it('y3.transport-pass: K ≤ R + 10, S ≤ 40 % y cada opción óptima en al menos 3 variantes', () => {
    const transport = row('y3.transport-pass')
    expect(transport.K).toBeLessThanOrEqual(transport.R + 10)
    expect(transport.S).toBeLessThanOrEqual(0.4)
    for (const option of ['suelto', 'recargable', 'combo', 'abono']) {
      const qualities = transport.constant.get(option) ?? []
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

  // RS-MAT-008 sigue detenido. La adjudicación de conflictos de contrato
  // (D-S08-114) probó que la excepción de witness autorizada resuelve la
  // contradicción original pero no el techo: «entera» es siempre válida y nunca
  // baja de efficient donde algún recorte vale, así que K = 75 + 25·w, con piso
  // demostrado de 78 contra un techo de 70. El techo no se relaja acá: se decide
  // en la pregunta abierta 66.
  it.todo(
    'y5.stage-screen: K ≤ 70 y S ≤ 40 % — BLOQUEADO: techo inalcanzable, pregunta abierta 66',
  )

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
    const allOut = [...council.constant.entries()].find(([key]) =>
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
