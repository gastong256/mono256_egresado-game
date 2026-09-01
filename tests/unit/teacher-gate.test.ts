import { describe, expect, it } from 'vitest'

import {
  orderedTeacherGateCases,
  teacherGateCase,
  teacherGateCaseIssues,
  verifyTeacherGateCase,
  TEACHER_GATE_1_CASES,
  type TeacherGateCase,
} from '@/game/testing'
import {
  candidateDifficultyCostPolicy,
  candidateFairScorePolicy,
  createContentCatalog,
  isOk,
  metrics,
  scoreRun,
  type ScoredEvent,
} from '@/game'
import {
  createGrade7Dependencies,
  createGrade7RunDescriptor,
  grade7Challenges,
  grade7CompositionPolicy,
  grade7Families,
} from '@/content/grade-7'

/**
 * El pack del Teacher Gate 1.
 *
 * Una reunión que no reproduce no sirve: si el seed de un caso deja de mostrar
 * la situación que el pack promete, el facilitador tiene que enterarse acá y no
 * delante de los docentes. Estos tests son ese aviso.
 *
 * Lo que se afirma es semántico —qué plantilla aparece, qué nivel tiene— y
 * nunca el texto de una tarjeta: mejorar una consigna no debería reportar una
 * reunión como obsoleta.
 */

const dependencies = createGrade7Dependencies()
const catalog = createContentCatalog(grade7Families, grade7Challenges)

describe('el manifiesto de casos', () => {
  it('no tiene problemas estructurales', () => {
    expect(teacherGateCaseIssues()).toEqual([])
  })

  it('declara los cuatro casos que el pack documenta', () => {
    expect(TEACHER_GATE_1_CASES.map((entry) => entry.id)).toEqual([
      'TG1-A',
      'TG1-B',
      'TG1-C',
      'TG1-D',
    ])
  })

  it('los presenta en el orden en que la sesión los juega', () => {
    const order = orderedTeacherGateCases().map((entry) => entry.id)
    expect(order).toEqual(['TG1-A', 'TG1-B', 'TG1-C', 'TG1-D'])
  })

  it('entra en una sesión de quince minutos junto con la conversación', () => {
    const core = orderedTeacherGateCases().filter((entry) => entry.order <= 2)
    const total = core.reduce((sum, entry) => sum + entry.minutes, 0)
    // Apertura, niveles, puntaje y decisiones ocupan nueve; los casos centrales
    // tienen los seis que quedan.
    expect(total).toBeLessThanOrEqual(6)
  })

  it('cada caso pregunta algo concreto y dice qué observar', () => {
    for (const entry of TEACHER_GATE_1_CASES) {
      expect(entry.questions.length).toBeGreaterThan(0)
      expect(entry.observe.length).toBeGreaterThan(0)
      for (const question of entry.questions) {
        expect(question).toMatch(/\?$/u)
        expect(question.toLowerCase()).not.toBe('¿qué les parece?')
      }
    }
  })

  it('describe cada caso sin identificadores internos', () => {
    // Lo que el docente lee no debería contener nada que haya que explicarle.
    for (const entry of TEACHER_GATE_1_CASES) {
      for (const text of [
        entry.whatTheySee,
        entry.mathematics,
        entry.purpose,
      ]) {
        expect(text).not.toMatch(/g7\.|RunPlan|seed|catálogo|fingerprint/u)
      }
    }
  })

  it('rechaza un manifiesto con identificadores repetidos', () => {
    const first = TEACHER_GATE_1_CASES[0]
    if (first === undefined) throw new Error('sin casos')

    expect(teacherGateCaseIssues([first, first])).toContainEqual(
      expect.stringContaining('está declarado dos veces'),
    )
  })

  it('rechaza un seed que no es un identificador aceptable', () => {
    const first = TEACHER_GATE_1_CASES[0]
    if (first === undefined) throw new Error('sin casos')

    const broken: TeacherGateCase = { ...first, seed: 'a b/c' }
    expect(teacherGateCaseIssues([broken])).toContainEqual(
      expect.stringContaining('no es un identificador aceptable'),
    )
  })

  it('rechaza un caso que no entra en la sesión', () => {
    const first = TEACHER_GATE_1_CASES[0]
    if (first === undefined) throw new Error('sin casos')

    expect(teacherGateCaseIssues([{ ...first, minutes: 20 }])).toContainEqual(
      expect.stringContaining('no lo sostiene'),
    )
  })

  it('devuelve undefined para un caso que no existe', () => {
    expect(teacherGateCase('TG1-Z')).toBeUndefined()
  })
})

describe('los casos siguen reproduciendo lo que el pack promete', () => {
  it.each(TEACHER_GATE_1_CASES)(
    '$id llega a la situación esperada',
    (entry) => {
      const report = verifyTeacherGateCase(
        entry,
        createGrade7RunDescriptor(entry.seed),
        dependencies,
      )

      expect(report.reproduces).toBe(true)
      expect(report.trace).toContain(entry.expectedTemplate)
      expect(report.band).toBe(entry.expectedBand)
    },
  )

  it('los dos casos centrales muestran plantillas distintas de la misma familia', () => {
    // La variación cognitiva es lo que la sesión existe para mostrar. Si los
    // dos casos cayeran en la misma plantilla, la reunión perdería su contraste.
    const [caseA, caseB] = orderedTeacherGateCases()
    if (caseA === undefined || caseB === undefined)
      throw new Error('faltan casos')

    expect(caseA.expectedTemplate).not.toBe(caseB.expectedTemplate)

    const templateA = catalog.template(caseA.expectedTemplate)
    const templateB = catalog.template(caseB.expectedTemplate)
    expect(templateA?.family).toBe(templateB?.family)
    // Y con interacciones distintas: elegir entre opciones contra producir el
    // número es exactamente la diferencia que se quiere discutir.
    expect(templateA?.interaction).not.toBe(templateB?.interaction)
  })

  it('avisa cuando un caso deja de reproducir', () => {
    const stale: TeacherGateCase = {
      ...(TEACHER_GATE_1_CASES[0] as TeacherGateCase),
      expectedTemplate: 'g7.no-existe' as TeacherGateCase['expectedTemplate'],
    }
    const report = verifyTeacherGateCase(
      stale,
      createGrade7RunDescriptor(stale.seed),
      dependencies,
    )

    expect(report.reproduces).toBe(false)
    expect(report.detail).toContain('nunca llegó a')
  })

  it('avisa cuando el nivel declarado ya no es el del motor', () => {
    const first = TEACHER_GATE_1_CASES[0]
    if (first === undefined) throw new Error('sin casos')

    const report = verifyTeacherGateCase(
      { ...first, expectedBand: 'stretch' },
      createGrade7RunDescriptor(first.seed),
      dependencies,
    )

    expect(report.reproduces).toBe(false)
    expect(report.detail).toContain('nivel')
  })
})

describe('el contexto que el pack declara', () => {
  it('ninguna calibración está aprobada', () => {
    // Si alguna se declarara oficial, el pack estaría presentando como cerrado
    // algo que la reunión existe para decidir.
    expect(candidateFairScorePolicy.official).toBe(false)
    expect(candidateDifficultyCostPolicy.official).toBe(false)
    expect(grade7CompositionPolicy.official).toBe(false)
  })

  it('los niveles que el pack documenta son los que el motor declara', () => {
    const bands = Object.fromEntries(
      grade7Challenges.map((template) => [template.id, template.band]),
    )

    // La tabla de 04-dificultad.md. Si el motor reclasifica una situación, el
    // documento que los docentes leen queda desactualizado y este test lo dice.
    expect(bands).toEqual({
      'g7.may-25-act': 'core',
      'g7.bus-timing': 'standard',
      'g7.bus-latest-departure': 'standard',
      'g7.mural-paint': 'standard',
      'g7.notebook-offer': 'standard',
      'g7.stand-supplies': 'stretch',
      'g7.group-tasks': 'stretch',
    })
  })
})

describe('los ejemplos de puntaje que el pack imprime', () => {
  const event = (
    templateId: string,
    quality: ScoredEvent['quality'],
    precision = 1,
    efficiency = 1,
  ): ScoredEvent => ({
    templateId: templateId as ScoredEvent['templateId'],
    quality,
    metrics: metrics({ precision, efficiency, risk: 0 }),
  })

  function fairScore(events: readonly ScoredEvent[]): number {
    const result = scoreRun(events, catalog, candidateFairScorePolicy)
    if (!isOk(result)) throw new Error(`no puntuó: ${result.error.code}`)
    return result.value.fairScore
  }

  /*
   * Los cuatro números de 05-puntaje.md, fijados.
   *
   * Son lo que los docentes van a mirar para decidir la ponderación. Si el
   * motor los cambia y el documento no, la reunión discutiría sobre números que
   * ya no existen.
   */
  it('reproduce los cuatro ejemplos del documento', () => {
    expect(
      fairScore([
        event('g7.bus-timing', 'optimal'),
        event('g7.may-25-act', 'optimal'),
      ]),
    ).toBe(10_000)
    expect(fairScore([event('g7.bus-latest-departure', 'optimal')])).toBe(
      10_000,
    )
    expect(
      fairScore([
        event('g7.bus-timing', 'optimal'),
        event('g7.group-tasks', 'efficient', 1, 0.2),
      ]),
    ).toBe(7_651)
    expect(
      fairScore([
        event('g7.bus-timing', 'functional'),
        event('g7.group-tasks', 'invalid', 1, 1),
      ]),
    ).toBe(3_645)
  })

  it('la comparación de ponderaciones da los números de la tabla', () => {
    const events = [
      event('g7.bus-timing', 'optimal'),
      event('g7.group-tasks', 'efficient', 1, 0.2),
    ]
    const under = (math: number, team: number, aura: number): number => {
      const result = scoreRun(events, catalog, {
        ...candidateFairScorePolicy,
        id: 'comparación',
        weights: { math, team, aura },
      })
      if (!isOk(result)) throw new Error('no puntuó')
      return result.value.fairScore
    }

    expect(under(8_000, 1_500, 500)).toBe(7_651)
    expect(under(8_500, 1_000, 500)).toBe(8_005)
    expect(under(9_000, 1_000, 0)).toBe(8_040)
  })
})
