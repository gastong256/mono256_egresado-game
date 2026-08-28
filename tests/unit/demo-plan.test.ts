import { describe, expect, it } from 'vitest'

import {
  createContentCatalog,
  demoAsStagePlan,
  formatVariantAddress,
  isValidStagePlan,
  validateDemoPlan,
  validateStagePlan,
  DEFAULT_STAGE_BEAT_BUDGET,
  type DemoPlan,
} from '@/game'
import {
  grade7Challenges,
  grade7Families,
  grade7TeacherDemoPlan,
  grade7VariantCatalog,
} from '@/content/grade-7'

/**
 * El demo docente.
 *
 * Lo que se prueba no es que el demo sea largo, sino que sea **otra cosa** que
 * una partida: si alguien pudiera obtener el demo aflojando el presupuesto de
 * beats de una run, el techo de uno o dos beats habría dejado de ser una regla.
 */

const catalog = createContentCatalog(grade7Families, grade7Challenges)

const errors = (issues: readonly { severity: string; code: string }[]) =>
  issues
    .filter((issue) => issue.severity === 'error')
    .map((issue) => issue.code)

describe('el demo docente de 7.º grado', () => {
  it('es un demo válido', () => {
    expect(errors(validateDemoPlan(catalog, grade7TeacherDemoPlan))).toEqual([])
  })

  it('no deja ninguna plantilla del año sin mostrar', () => {
    expect(
      validateDemoPlan(catalog, grade7TeacherDemoPlan).map(
        (issue) => issue.code,
      ),
    ).not.toContain('demo.template-not-shown')
  })

  it('muestra una familia haciendo dos preguntas distintas', () => {
    const bus = grade7TeacherDemoPlan.entries.filter(
      (entry) => (entry.variant.familyId as string) === 'bus',
    )

    expect(bus).toHaveLength(2)
    expect(new Set(bus.map((entry) => entry.variant.templateId))).toEqual(
      new Set(['g7.bus-timing', 'g7.bus-latest-departure']),
    )

    const interactions = bus.map(
      (entry) => catalog.template(entry.variant.templateId)?.interaction,
    )
    // Distintas de verdad: una se resuelve eligiendo, la otra produciendo el
    // número. Si las dos plantillas compartieran interacción el contraste
    // cognitivo sería una afirmación sin evidencia.
    expect(new Set(interactions).size).toBe(2)
  })

  it('cubre las seis interacciones del año', () => {
    const interactions = new Set(
      grade7TeacherDemoPlan.entries.map(
        (entry) => catalog.template(entry.variant.templateId)?.interaction,
      ),
    )
    expect(interactions.size).toBe(6)
  })

  it('cada beat dice qué demuestra', () => {
    for (const entry of grade7TeacherDemoPlan.entries) {
      expect(entry.showcases.length).toBeGreaterThan(20)
    }
  })

  it('muestra sólo contenido que está en el catálogo aprobado', () => {
    const approved = new Set(
      grade7VariantCatalog.entries.map((entry) => formatVariantAddress(entry)),
    )

    for (const entry of grade7TeacherDemoPlan.entries) {
      expect(approved.has(formatVariantAddress(entry.variant))).toBe(true)
    }
  })
})

describe('un demo no es una partida', () => {
  it('no es un stage plan válido', () => {
    expect(isValidStagePlan(catalog, grade7TeacherDemoPlan)).toBe(false)
  })

  it('lo rechaza el presupuesto de beats de una run, sin excepciones', () => {
    const codes = errors(
      validateStagePlan(catalog, demoAsStagePlan(grade7TeacherDemoPlan)),
    )

    // Las dos razones son independientes: son demasiados beats ordinarios y
    // además hay más de un anchor. Un demo viola la forma de un año por partida
    // doble, que es exactamente lo que se quiere.
    expect(codes).toContain('plan.beat-budget')
    expect(codes).toContain('plan.anchor-count')
  })

  it('el presupuesto de una run sigue siendo uno o dos beats', () => {
    expect(DEFAULT_STAGE_BEAT_BUDGET).toEqual({ min: 1, max: 2 })
  })

  it('rechaza un demo que cabría dentro de una partida', () => {
    const short: DemoPlan = {
      ...grade7TeacherDemoPlan,
      entries: grade7TeacherDemoPlan.entries.slice(0, 2),
    }

    expect(errors(validateDemoPlan(catalog, short))).toContain(
      'demo.indistinct-from-run',
    )
  })
})

describe('la validación del demo encuentra problemas', () => {
  it('rechaza un beat sin propósito', () => {
    const [first, ...rest] = grade7TeacherDemoPlan.entries
    if (first === undefined) throw new Error('el demo está vacío')

    const mute: DemoPlan = {
      ...grade7TeacherDemoPlan,
      entries: [{ ...first, showcases: '  ' }, ...rest],
    }

    expect(errors(validateDemoPlan(catalog, mute))).toContain(
      'demo.missing-purpose',
    )
  })

  it('rechaza una dirección que no resuelve', () => {
    const [first, ...rest] = grade7TeacherDemoPlan.entries
    if (first === undefined) throw new Error('el demo está vacío')

    const broken: DemoPlan = {
      ...grade7TeacherDemoPlan,
      entries: [
        {
          ...first,
          variant: { ...first.variant, variantId: 'no-existe' as never },
        },
        ...rest,
      ],
    }

    expect(errors(validateDemoPlan(catalog, broken))).toContain(
      'demo.unresolved-entry',
    )
  })

  it('rechaza un demo que muestra el mismo beat dos veces', () => {
    const [first] = grade7TeacherDemoPlan.entries
    if (first === undefined) throw new Error('el demo está vacío')

    const repeated: DemoPlan = {
      ...grade7TeacherDemoPlan,
      entries: [...grade7TeacherDemoPlan.entries, first],
    }

    expect(errors(validateDemoPlan(catalog, repeated))).toContain(
      'demo.duplicate-entry',
    )
  })

  it('rechaza un demo sin contraste dentro de una familia', () => {
    const flat: DemoPlan = {
      ...grade7TeacherDemoPlan,
      entries: grade7TeacherDemoPlan.entries.filter(
        (entry) => (entry.variant.templateId as string) !== 'g7.bus-timing',
      ),
    }

    expect(errors(validateDemoPlan(catalog, flat))).toContain(
      'demo.family-contrast',
    )
  })
})
