// @vitest-environment jsdom

import { act, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { createGameController } from '@/components/game/controller'
import { RunView } from '@/components/game/run-view'
import {
  createFullCareerDependencies,
  createFullCareerRunDescriptor,
} from '@/content/full-career'
import { activeChallengeView, type SolutionQuality } from '@/game'
import { grade5Answer } from '../helpers/grade-5-play'

/**
 * El cierre de año y el botón semántico, en la pantalla real.
 *
 * Se juega una carrera de verdad con el controlador de la aplicación hasta el
 * borde de cada año y se mira lo que el jugador ve: un hito con el numeral del
 * año que cerró y un botón que dice a dónde va.
 */
const dependencies = createFullCareerDependencies()

function controllerFor(seed: string) {
  const built = createFullCareerRunDescriptor(seed)
  if (!built.ok) throw new Error('descriptor failed')
  return {
    controller: createGameController(built.value, dependencies),
    descriptor: built.value,
  }
}

/** Avanza hasta que `stop` sea verdadero, respondiendo con la calidad pedida. */
function playUntil(
  session: ReturnType<typeof controllerFor>,
  quality: (templateId: string) => SolutionQuality,
  stop: () => boolean,
) {
  const { controller, descriptor } = session
  for (let step = 0; step < 240; step += 1) {
    if (stop()) return
    const state = controller.getState().run
    if (state.status !== 'active') throw new Error('run ended early')
    if (state.phase === 'challenge') {
      const view = activeChallengeView(state, dependencies)
      if (!view.ok || view.value === undefined) throw new Error('no view')
      let answer
      try {
        answer = grade5Answer(
          view.value,
          dependencies,
          quality(view.value.ref.templateId),
          descriptor,
        )
      } catch {
        answer = grade5Answer(view.value, dependencies, 'optimal', descriptor)
      }
      act(() => {
        controller.dispatch({
          type: 'ANSWER',
          instanceId: view.value!.ref.instanceId,
          answer,
        })
      })
    } else {
      act(() => {
        controller.dispatch({ type: 'CONTINUE' })
      })
    }
  }
  throw new Error('never reached the requested screen')
}

const routed = new Set(
  Object.entries(dependencies.recoveryContent?.reviews ?? {})
    .filter(([, reviews]) => reviews.length > 0)
    .map(([templateId]) => templateId),
)

describe('el cierre de año en pantalla', () => {
  it('abre 7.º con un botón que lo nombra y sin hito', () => {
    const session = controllerFor('milestone-open')
    render(
      <RunView controller={session.controller} dependencies={dependencies} />,
    )

    expect(screen.getByTestId('continue')).toHaveTextContent('Empezar 7.º')
    expect(screen.queryByTestId('year-milestone')).not.toBeInTheDocument()
  })

  it('al cerrar 7.º muestra el hito y ofrece pasar a 1.º', () => {
    const session = controllerFor('milestone-open')
    render(
      <RunView controller={session.controller} dependencies={dependencies} />,
    )

    playUntil(
      session,
      () => 'optimal',
      () => screen.queryByTestId('year-milestone') !== null,
    )

    const run = session.controller.getState().run
    expect(run.stage).toBe('grade-7')
    expect(run.phase).toBe('feedback')

    const milestone = screen.getByTestId('year-milestone')
    expect(milestone).toHaveTextContent('Año completado')
    expect(
      screen.getByRole('heading', { name: '7.º completado' }),
    ).toBeInTheDocument()
    expect(milestone).toHaveTextContent('Ya sabés cómo funciona la escuela.')
    expect(milestone).not.toHaveAttribute('data-final')

    const button = screen.getByTestId('continue')
    expect(button).toHaveTextContent('Pasar a 1.º')
    expect(button).toHaveAttribute('data-intent', 'next-year')
    // Un solo primario: el hito no agrega un botón.
    expect(document.querySelectorAll('[data-primary]')).toHaveLength(1)

    act(() => {
      session.controller.dispatch({ type: 'CONTINUE' })
    })
    expect(session.controller.getState().run.stage).toBe('year-1')
    expect(screen.queryByTestId('year-milestone')).not.toBeInTheDocument()
    expect(screen.getByTestId('continue')).toHaveTextContent('Empezar 1.º')
  })

  it('cuando el año debe un Repaso, el botón lo dice y el hito espera', () => {
    const session = controllerFor('milestone-repaso')
    render(
      <RunView controller={session.controller} dependencies={dependencies} />,
    )

    playUntil(
      session,
      (id) => (routed.has(id) ? 'invalid' : 'optimal'),
      () =>
        screen.queryByTestId('continue')?.getAttribute('data-intent') ===
        'review',
    )
    expect(screen.getByTestId('continue')).toHaveTextContent('Ir al Repaso')
    expect(screen.queryByTestId('year-milestone')).not.toBeInTheDocument()

    act(() => {
      session.controller.dispatch({ type: 'CONTINUE' })
    })
    // El Repaso dice qué pasó y qué se hace ahora.
    expect(screen.getByTestId('review-notes')).toHaveTextContent(
      'Quedó algo dando vueltas este año',
    )

    playUntil(
      session,
      () => 'optimal',
      () => screen.queryByTestId('year-milestone') !== null,
    )
    expect(screen.getByTestId('year-milestone')).toHaveTextContent(
      'lo cerraste igual',
    )
    expect(screen.getByTestId('continue')).toHaveTextContent(/^Pasar a /u)
  })

  it('cerrar 5.º prepara el egreso en vez de pasar a otro año', () => {
    const session = controllerFor('milestone-open')
    render(
      <RunView controller={session.controller} dependencies={dependencies} />,
    )

    playUntil(
      session,
      () => 'optimal',
      () =>
        screen.queryByTestId('continue')?.getAttribute('data-intent') ===
        'finish',
    )
    const milestone = screen.getByTestId('year-milestone')
    expect(milestone).toHaveAttribute('data-final', 'true')
    expect(milestone).toHaveTextContent('Fin de la secundaria')
    expect(milestone).toHaveTextContent('Terminaste la secundaria.')
    expect(screen.getByTestId('continue')).toHaveTextContent('Ver mi egreso')
    expect(screen.queryByText(/Pasar a 6/u)).not.toBeInTheDocument()

    act(() => {
      session.controller.dispatch({ type: 'CONTINUE' })
    })
    expect(session.controller.getState().run.status).toBe('completed')
  })
})
