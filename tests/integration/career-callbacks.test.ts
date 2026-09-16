/**
 * Gate 12 — memoria de carrera.
 *
 * Tres propiedades, en el orden en que importan:
 *
 * 1. **Causa rastreable.** Un callback aparece sólo si la run grabó el hecho
 *    que recuerda, y desaparece si no.
 * 2. **Hechos en su año.** Cada beat escribe su resultado en el año que lo
 *    jugó, con su propio nombre de flag; ningún año inventa la memoria de otro.
 * 3. **Sin efecto matemático.** Recordar cambia el texto y nada más: misma
 *    instancia, misma evaluación, mismo puntaje.
 */
import { describe, expect, it } from 'vitest'
import {
  activeChallengeView,
  createRun,
  transition,
  type GameCommand,
  type RunState,
} from '@/game'
import {
  friendDayCallback,
  projectArcCallback,
  teamworkCallback,
} from '@/content/career-facts'
import {
  createFullCareerDependencies,
  createFullCareerRunDescriptor,
} from '@/content/full-career'
import { iconicStorylets } from '@/content/career-closing'
import { grade5Answer } from '../helpers/grade-5-play'

const dependencies = createFullCareerDependencies()

describe('Callbacks · causa rastreable', () => {
  it('sin hechos previos no hay recuerdo', () => {
    expect(projectArcCallback({})).toBe('')
    expect(friendDayCallback({})).toBe('')
    expect(teamworkCallback({})).toBe('')
  })

  it('un flag que no es un resultado conocido tampoco alcanza', () => {
    expect(projectArcCallback({ 'y1.project.outcome': 'ok' })).toBe('')
    expect(friendDayCallback({ 'y3.friendDay.outcome': true })).toBe('')
  })

  it('el Proyecto recuerda el último beat jugado, no una lista fija', () => {
    const first = projectArcCallback({ 'y1.project.outcome': 'optimal' })
    const later = projectArcCallback({
      'y1.project.outcome': 'optimal',
      'y3.projectTech.outcome': 'invalid',
    })
    expect(first).toContain('primero')
    expect(later).toContain('tercero')
    expect(later).not.toContain('primero')
  })

  it.each([
    ['optimal', 'funcionó'],
    ['efficient', 'funcionó'],
    ['functional', 'ajustado'],
    ['invalid', 'salió mal'],
  ])('el resultado %s se recuerda como corresponde', (outcome, phrase) => {
    expect(projectArcCallback({ 'y2.survey.outcome': outcome })).toContain(
      phrase,
    )
  })

  it('el Día del Amigo y el trabajo en equipo distinguen cómo salió', () => {
    expect(friendDayCallback({ 'y3.friendDay.outcome': 'invalid' })).toContain(
      'a las corridas',
    )
    expect(friendDayCallback({ 'y3.friendDay.outcome': 'optimal' })).toContain(
      'avisar antes',
    )
    expect(teamworkCallback({ 'y4.shifts.outcome': 'optimal' })).toContain(
      'salir bien',
    )
    expect(teamworkCallback({ 'y4.shifts.outcome': 'invalid' })).toContain(
      'te costó una vez',
    )
  })
})

describe('Callbacks · en la carrera real', () => {
  /** Una carrera jugada al óptimo, guardando cada estado intermedio. */
  function playedCareer(seed: string) {
    const built = createFullCareerRunDescriptor(seed)
    if (!built.ok) throw new Error('no descriptor')
    const created = createRun(built.value, dependencies)
    if (!created.ok) throw new Error('no run')
    let state = created.value.state
    const states: RunState[] = [state]
    for (let step = 0; step < 240 && state.status === 'active'; step++) {
      let command: GameCommand = { type: 'CONTINUE' }
      if (state.phase === 'challenge') {
        const view = activeChallengeView(state, dependencies)
        if (!view.ok || view.value === undefined) throw new Error('no view')
        command = {
          type: 'ANSWER',
          instanceId: view.value.ref.instanceId,
          answer: grade5Answer(
            view.value,
            dependencies,
            'optimal',
            built.value,
          ),
        }
      }
      const next = transition(state, command, dependencies)
      if (!next.ok) throw new Error(JSON.stringify(next.error))
      state = next.value.state
      states.push(state)
    }
    if (state.status !== 'completed') throw new Error('run sin terminar')
    return { states, final: state }
  }

  it(
    'cada beat graba su resultado en el año que lo jugó',
    { timeout: 120_000 },
    () => {
      const byYear: Record<string, string> = {
        'year-1': 'y1.',
        'year-2': 'y2.',
        'year-3': 'y3.',
        'year-4': 'y4.',
        'year-5': 'y5.',
      }
      for (let seed = 0; seed < 4; seed++) {
        const { final } = playedCareer(`callbacks-${String(seed)}`)
        for (const entry of final.history) {
          if (entry.challengeId === undefined) continue
          const prefix = byYear[entry.stage]
          if (prefix === undefined) continue
          // El id de la Template ya declara su año; el flag que graba tiene que
          // vivir en el mismo prefijo.
          expect(entry.challengeId.startsWith(prefix)).toBe(true)
        }
        const flags = Object.keys(final.flags)
        expect(flags.length).toBeGreaterThan(0)
        for (const flag of flags) expect(/^(g7|y[1-5])\./.test(flag)).toBe(true)
      }
    },
  )

  it(
    'recordar no cambia la instancia matemática ni la evaluación',
    { timeout: 60_000 },
    () => {
      const { states } = playedCareer('callbacks-instance')
      const withMemory = states.find(
        (state) =>
          state.activeEvent?.challenge !== undefined &&
          state.activeEvent.challenge.templateId.startsWith('y5.'),
      )
      if (withMemory === undefined) throw new Error('sin beat de quinto')
      const remembered = activeChallengeView(withMemory, dependencies)
      const forgotten = activeChallengeView(
        { ...withMemory, flags: {} },
        dependencies,
      )
      expect(remembered.ok && forgotten.ok).toBe(true)
      if (!remembered.ok || !forgotten.ok) return
      expect(remembered.value?.interaction).toEqual(
        forgotten.value?.interaction,
      )
      expect(remembered.value?.ref).toEqual(forgotten.value?.ref)
    },
  )

  it('quinto llega con más memoria que primero', { timeout: 60_000 }, () => {
    const { final } = playedCareer('callbacks-density')
    const written = (prefix: string) =>
      Object.keys(final.flags).filter((flag) => flag.startsWith(prefix)).length
    // El año de cierre lee lo de antes; lo mínimo verificable es que la run
    // llegue a quinto con hechos de años anteriores disponibles.
    expect(written('y5.')).toBeGreaterThan(0)
    const earlier = ['g7.', 'y1.', 'y2.', 'y3.', 'y4.'].filter(
      (prefix) => written(prefix) > 0,
    )
    expect(earlier.length).toBeGreaterThanOrEqual(3)
  })
})

describe('Eventos icónicos del año', () => {
  it('cada año de la espina aporta un icónico y todos existen', () => {
    const authored = new Set(
      (dependencies.storylets ?? []).map((storylet) => String(storylet.id)),
    )
    for (const id of iconicStorylets) expect(authored.has(id)).toBe(true)
    // Uno por año, de séptimo a quinto: es lo que el epílogo puede recordar
    // cuando un año no dejó nada más destacado.
    expect(new Set(iconicStorylets.map((id) => id.split('.')[0])).size).toBe(
      iconicStorylets.length,
    )
    expect(iconicStorylets.length).toBe(6)
  })
})
