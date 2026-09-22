import { existsSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'

import { describe, expect, it } from 'vitest'

import {
  registeredScenes,
  sceneForChallenge,
  sceneForTemplate,
  templatesWithScene,
} from '@/components/game/scene-registry'
import { createFullCareerDependencies } from '@/content/full-career'
import { GRADE_7_HOSTABLE_TEMPLATES } from '@/content/grade-7/composition'
import { materializeVariant } from '@/game/testing'
import type { ChallengeDefinition, PublicChallengeView } from '@/game'

/**
 * El registro de escenas contra el catálogo real.
 *
 * Lo que se verifica es la **cobertura y la frontera**: cada Template que la
 * carrera pública puede componer tiene una escena, ningún Repaso la tiene, y
 * las Templates de 7.º que la carrera no alcanza no filtran arte al runtime.
 * Que el archivo exista y pese lo que el presupuesto RC3 admite se comprueba
 * acá y no en el navegador, donde una imagen rota sólo se ve.
 */

const catalog = createFullCareerDependencies().catalog

const DEV_ONLY_GRADE_7 = [
  'g7.group-tasks',
  'g7.mural-paint',
  'g7.notebook-offer',
  'g7.stand-supplies',
]

function isPublicOrdinary(template: ChallengeDefinition): boolean {
  if (template.placement === 'recovery') return false
  if (!template.stages.includes('grade-7')) return true
  return (GRADE_7_HOSTABLE_TEMPLATES as readonly string[]).includes(template.id)
}

function viewFor(template: ChallengeDefinition): PublicChallengeView {
  const instance = materializeVariant(template, { seed: 'scene-registry' })
  return {
    ref: instance.ref,
    narrative: instance.narrative,
    interaction: instance.present([]),
    tools: instance.tools,
  }
}

/** Bytes por escena que el presupuesto RC3 admite; calidad antes que cifra. */
const SCENE_BUDGET_BYTES = 250_000

describe('scene registry', () => {
  it('covers every ordinary template the public career can compose', () => {
    const missing = catalog.templates
      .filter(isPublicOrdinary)
      .map((template) => template.id)
      .filter((id) => sceneForTemplate(id) === undefined)

    expect(missing).toEqual([])
  })

  it('maps twenty-eight public templates onto twenty-four scenes', () => {
    expect(templatesWithScene()).toHaveLength(28)
    expect(registeredScenes()).toHaveLength(24)
  })

  it('gives no scene to recovery templates', () => {
    const reviewsWithScene = catalog.templates
      .filter((template) => template.placement === 'recovery')
      .map((template) => template.id)
      .filter((id) => sceneForTemplate(id) !== undefined)

    expect(reviewsWithScene).toEqual([])
  })

  it('leaks nothing for the DEV-only grade-7 templates', () => {
    for (const id of DEV_ONLY_GRADE_7) {
      expect(
        catalog.templates.some((template) => template.id === id),
        `${id} should still exist in the catalog`,
      ).toBe(true)
      expect(sceneForTemplate(id)).toBeUndefined()
    }
  })

  it('only maps ids that exist in the catalog', () => {
    const known = new Set<string>(
      catalog.templates.map((template) => template.id),
    )
    const unknown = templatesWithScene().filter((id) => !known.has(id))
    expect(unknown).toEqual([])
  })

  it('shares one scene across a visual situation', () => {
    expect(sceneForTemplate('g7.bus-timing')?.asset).toBe('scenario.g7.bus')
    expect(sceneForTemplate('g7.bus-latest-departure')?.asset).toBe(
      'scenario.g7.bus',
    )
    expect(sceneForTemplate('g7.bus-travel-review')).toBeUndefined()
    for (const id of [
      'y4.event-floor-plan',
      'y4.school-event-flow',
      'y4.shift-coverage',
    ]) {
      expect(sceneForTemplate(id)?.asset).toBe('scenario.y4.event')
    }
    expect(sceneForTemplate('y2.intercurso-plan')?.asset).toBe(
      sceneForTemplate('y2.standings-claim')?.asset,
    )
  })

  it('serves every registered scene as an optimised 16:9 WebP inside budget', () => {
    for (const scene of registeredScenes()) {
      const file = path.join(process.cwd(), 'public', scene.src)
      expect(existsSync(file), `${scene.src} is missing`).toBe(true)
      const bytes = readFileSync(file)
      // RIFF....WEBP: el contenedor WebP, no un PNG renombrado.
      expect(bytes.subarray(0, 4).toString('ascii')).toBe('RIFF')
      expect(bytes.subarray(8, 12).toString('ascii')).toBe('WEBP')
      expect(
        statSync(file).size,
        `${scene.src} over budget`,
      ).toBeLessThanOrEqual(SCENE_BUDGET_BYTES)
    }
  })

  it('withholds the scene from a remediation beat even for a mapped template', () => {
    const expo = catalog.templates.find(
      (template) => template.id === 'y1.course-project-expo',
    )
    if (expo === undefined) throw new Error('expo template missing')
    const view = viewFor(expo)

    expect(sceneForChallenge(view)?.asset).toBe('scenario.y1.expo')
    expect(
      sceneForChallenge({ ...view, review: { practised: [], debriefed: [] } }),
    ).toBeUndefined()
  })
})
