import { describe, expect, it } from 'vitest'

import {
  createFullCareerDependencies,
  createFullCareerRunDescriptor,
} from '@/content/full-career'
import { GRADE_BY_QUALITY, gradeFor, isGraded } from '@/content/grades'
import {
  activeChallengeView,
  createRun,
  promedio,
  transition,
  type GameCommand,
  type RunState,
  type SolutionQuality,
} from '@/game'
import { grade5Answer } from '../helpers/grade-5-play'

/**
 * La nota de cada situación.
 *
 * Toda Template ordinaria pone la nota de su calidad (10 / 8 / 6 / 4) y
 * ningún Repaso pone ninguna. Se prueba por construcción —qué Templates están
 * envueltas— y jugando carreras reales con el motor, que es lo único que
 * demuestra que el legajo tiene una nota por situación ordinaria y que el
 * Promedio dice cómo salió la carrera.
 */

const dependencies = createFullCareerDependencies()

function reviewIds(): ReadonlySet<string> {
  return new Set(
    Object.values(dependencies.recoveryContent?.reviews ?? {})
      .flat()
      .map(String),
  )
}

function play(seed: string, quality: SolutionQuality): RunState {
  const built = createFullCareerRunDescriptor(seed)
  if (!built.ok) throw new Error('descriptor')
  const created = createRun(built.value, dependencies)
  if (!created.ok) throw new Error('create')
  let state = created.value.state
  for (let step = 0; step < 240 && state.status === 'active'; step++) {
    let command: GameCommand = { type: 'CONTINUE' }
    if (state.phase === 'challenge') {
      const view = activeChallengeView(state, dependencies)
      if (!view.ok || view.value === undefined) throw new Error('view')
      let answer
      try {
        answer = grade5Answer(view.value, dependencies, quality, built.value)
      } catch {
        answer = grade5Answer(view.value, dependencies, 'optimal', built.value)
      }
      command = {
        type: 'ANSWER',
        instanceId: view.value.ref.instanceId,
        answer,
      }
    }
    const next = transition(state, command, dependencies)
    if (!next.ok) throw new Error(JSON.stringify(next.error))
    state = next.value.state
  }
  if (state.status !== 'completed') throw new Error('la carrera no terminó')
  return state
}

describe('la escala de notas', () => {
  it('es la de un boletín: 10, 8, 6 y 4', () => {
    expect(GRADE_BY_QUALITY).toEqual({
      optimal: 10,
      efficient: 8,
      functional: 6,
      invalid: 4,
    })
    expect(gradeFor('invalid')).toBe(4)
  })

  it('cubre toda Template ordinaria de la carrera y ningún Repaso', () => {
    const reviews = reviewIds()
    expect(reviews.size).toBeGreaterThan(0)
    for (const template of dependencies.catalog.templates) {
      const id = String(template.id)
      expect(isGraded(id), id).toBe(!reviews.has(id))
    }
  })
})

describe('el legajo de una carrera', () => {
  it.each(['content-grades', 'rc3-discovery-0', 'browser-career'])(
    'tiene una nota por situación ordinaria y ninguna por Repaso (%s)',
    (seed) => {
      // Insuficiente a propósito: es la política que agenda Repasos, y el
      // legajo tiene que ignorarlos aunque se resuelvan.
      const state = play(seed, 'invalid')
      const ordinary = state.history.filter(
        (entry) => entry.challengeId !== undefined && entry.recovery !== true,
      )
      const reviews = state.history.filter((entry) => entry.recovery === true)
      expect(reviews.length).toBeGreaterThan(0)
      expect(state.career.grades).toEqual(
        ordinary.map((entry) => {
          if (entry.quality === undefined) throw new Error('sin calidad')
          return GRADE_BY_QUALITY[entry.quality]
        }),
      )
      expect(promedio(state.career)).not.toBeNull()
    },
  )

  it('todo Óptimo egresa con 10,0', () => {
    const state = play('content-grades', 'optimal')
    expect(state.completion?.graduated).toBe(true)
    expect(promedio(state.career)).toBe(10)
  })

  it('resolver mal baja el Promedio hasta el aplazo, y se egresa igual', () => {
    const state = play('content-grades', 'invalid')
    expect(state.completion?.graduated).toBe(true)
    const average = promedio(state.career)
    if (average === null) throw new Error('sin Promedio')
    // El oráculo cae a Óptimo en las situaciones que no admiten Insuficiente,
    // así que el piso exacto depende del plan; lo que no depende es que un
    // legajo lleno de aplazos quede muy por debajo del aprobado.
    expect(average).toBeLessThan(6)
    expect(average).toBeGreaterThanOrEqual(4)
  })
})
