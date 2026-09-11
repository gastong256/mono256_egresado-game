import { describe, expect, it } from 'vitest'
import {
  toVariantId,
  verifyCatalogIntegrity,
  type PublicChallengeView,
} from '@/game'
import { materializeVariant } from '@/game/testing'
import {
  createGrade1Catalog,
  createGrade1Dependencies,
  grade1VariantCatalog,
  GRADE_1_CONTENT_VERSION,
  GRADE_1_VARIANT_CATALOG_VERSION,
} from '@/content/grade-1'
import { grade1Answer } from '../helpers/grade-1-play'

const deps = createGrade1Dependencies(true)
/** Recommended production targets of the authoring guide (normal 12, high risk 16, recovery 8). */
const TARGETS: Readonly<Record<string, number>> = {
  'y1.student-day-challenge-wheel': 16,
  'y1.course-project-expo': 12,
  'y1.mobile-data': 12,
  'y1.rehearsal-schedule': 12,
  'y1.classroom-layout': 16,
  'y1.schedule-review': 8,
  'y1.scale-fit-review': 8,
}
const entries = grade1VariantCatalog.entries.filter((entry) =>
  entry.templateId.startsWith('y1.'),
)

describe('catálogo aprobado de 1.º', () => {
  it('se reconstruye byte a byte bajo su versión y cada entrada revalida', () => {
    expect(grade1VariantCatalog.catalogVersion).toBe(
      GRADE_1_VARIANT_CATALOG_VERSION,
    )
    expect(grade1VariantCatalog.contentVersion).toBe(GRADE_1_CONTENT_VERSION)
    expect(
      verifyCatalogIntegrity(createGrade1Catalog(), grade1VariantCatalog, {
        contentVersion: GRADE_1_CONTENT_VERSION,
      }),
    ).toEqual([])
  })

  it('cada Template de 1.º alcanza el objetivo recomendado y no repite problemas', () => {
    for (const [templateId, minimum] of Object.entries(TARGETS)) {
      const own = entries.filter((entry) => entry.templateId === templateId)
      expect(own.length, templateId).toBeGreaterThanOrEqual(minimum)
    }
    expect(new Set(entries.map((entry) => entry.fingerprint)).size).toBe(
      entries.length,
    )
    expect(new Set(entries.map((entry) => entry.templateId))).toEqual(
      new Set(Object.keys(TARGETS)),
    )
  })

  it.each(
    entries.map(
      (entry) => [`${entry.templateId}/${entry.variantId}`, entry] as const,
    ),
  )(
    '%s: materializa, verifica y admite su máximo declarado (perfect witness)',
    (_, entry) => {
      const template = deps.catalog.template(entry.templateId)
      if (template === undefined) throw new Error('missing template')
      const instance = materializeVariant(template, {
        variantId: toVariantId(String(entry.variantId)),
        seed: 'witness',
      })
      expect(instance.verify()).toEqual([])
      const view: PublicChallengeView = {
        ref: instance.ref,
        narrative: instance.narrative,
        interaction: instance.present([]),
        tools: instance.tools,
      }
      const result = instance.evaluate(grade1Answer(view, deps, 'optimal'), [])
      expect(result.ok).toBe(true)
      if (!result.ok) return
      expect(result.value.quality).toBe('optimal')
      // Where Team is available, its maximum is reachable together with Math's.
      if (template.scoring.team !== 'none')
        expect(result.value.metrics.efficiency).toBe(1)
      const failed = instance.evaluate(grade1Answer(view, deps, 'invalid'), [])
      expect(failed.ok && failed.value.quality).toBe('invalid')
    },
  )
})
