// @vitest-environment jsdom

import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { createGameController } from '@/components/game/controller'
import {
  InteractionControls,
  isDraftSubmittable,
} from '@/components/game/interaction-area'
import { RunView } from '@/components/game/run-view'
import { useControllerSelector } from '@/components/game/use-game-run'
import { YearResult } from '@/components/game/year-result'
import {
  createDevelopmentDependencies,
  developmentRunDescriptor,
} from '@/game/testing'
import { isRunComplete, type InteractionPresentation } from '@/game'

const dependencies = createDevelopmentDependencies()

function controllerFor(seed: string) {
  return createGameController(
    developmentRunDescriptor(seed, dependencies),
    dependencies,
  )
}

/**
 * El recorrido completo, como lo compone la aplicación.
 *
 * Mientras la run está activa se dibuja la vista de juego; cuando el motor la da
 * por terminada, el cierre del año. Qué mostrar lo decide el estado del motor,
 * que es exactamente lo que hace el contenedor real.
 */
function RunHarness({
  controller,
}: {
  readonly controller: ReturnType<typeof controllerFor>
}) {
  const run = useControllerSelector(controller, (state) => state.run)

  if (isRunComplete(run)) {
    return <YearResult state={run} onPlayAgain={() => undefined} />
  }

  return <RunView controller={controller} dependencies={dependencies} />
}

/**
 * Fills whatever interaction is currently on screen.
 *
 * Which challenge a seed presents is the engine's decision, so a UI test must
 * answer generically rather than assuming a particular control.
 */
async function provideAnswer(
  user: ReturnType<typeof userEvent.setup>,
): Promise<void> {
  const radios = screen.queryAllByRole('radio')
  if (radios.length > 0) {
    await user.click(radios[0] as HTMLElement)
    return
  }

  const spins = screen.queryAllByRole('spinbutton')
  for (const spin of spins) {
    await user.clear(spin)
    await user.type(spin, '2')
  }

  const selects = screen.queryAllByRole('combobox')
  for (const [index, select] of selects.entries()) {
    const values = within(select as HTMLSelectElement)
      .getAllByRole('option')
      .map((option) => (option as HTMLOptionElement).value)
      .filter((value) => value !== '')
    const chosen = values[index]
    if (chosen !== undefined) {
      await user.selectOptions(select, chosen)
    }
  }
}

describe('game shell', () => {
  it('renders the opening narrative beat and advances on continue', async () => {
    const user = userEvent.setup()
    const controller = controllerFor('component-shell')

    render(<RunHarness controller={controller} />)

    expect(screen.getByTestId('stage-label')).toHaveTextContent('7.º grado')
    expect(screen.getByTestId('narrative-card')).toBeInTheDocument()
    // La tira de carrera arranca ausente: ninguna dimensión se tocó todavía, y
    // `null` no es 0.
    expect(screen.queryByTestId('career-strip')).not.toBeInTheDocument()

    await user.click(screen.getByTestId('continue'))

    // The run has moved on to a challenge.
    expect(screen.queryByTestId('narrative-card')).not.toBeInTheDocument()
    expect(screen.getByTestId('submit-answer')).toBeInTheDocument()
  })

  it('keeps submit disabled until a structurally valid answer exists', async () => {
    const user = userEvent.setup()
    const controller = controllerFor('component-submit')

    render(<RunHarness controller={controller} />)
    await user.click(screen.getByTestId('continue'))

    const submit = screen.getByTestId('submit-answer')
    expect(submit).toBeDisabled()

    const options = screen.getAllByRole('radio')
    expect(options.length).toBeGreaterThan(0)
    await user.click(options[0] as HTMLElement)

    expect(submit).toBeEnabled()
  })

  it('shows structured feedback with the numbers that explain it', async () => {
    const user = userEvent.setup()
    const controller = controllerFor('component-feedback')

    render(<RunHarness controller={controller} />)
    await user.click(screen.getByTestId('continue'))
    await provideAnswer(user)
    await user.click(screen.getByTestId('submit-answer'))

    const heading = screen.getByTestId('feedback-heading')
    // Outcome is announced and spelled out, never colour-only.
    expect(heading).toHaveAttribute('role', 'alert')
    expect(heading.textContent).toBeTruthy()
    expect(heading).toHaveAttribute('data-quality')

    // The engine's facts are rendered, so the consequence is explained.
    const panel = heading.closest('section')
    expect(panel).not.toBeNull()
    if (panel === null) return
    expect(within(panel).getAllByRole('definition').length).toBeGreaterThan(0)

    // Al resolver, el bloque oscuro suelta el primario y reaparece uno solo al
    // final del shell. La invariante del sistema es que nunca haya dos.
    expect(within(panel).queryByTestId('continue')).toBeNull()
    expect(screen.getByTestId('continue')).toBeInTheDocument()
    expect(screen.queryAllByTestId('submit-answer')).toHaveLength(0)
  })

  it('surfaces an engine rejection instead of failing silently', () => {
    const controller = controllerFor('component-rejection')
    render(<RunHarness controller={controller} />)

    // The dispatch originates outside React, so the resulting re-render has to
    // be flushed with act() before the DOM is asserted on.
    let rejection: ReturnType<typeof controller.dispatch>
    act(() => {
      // CONTINUE is valid on a narrative beat; ANSWER is not.
      rejection = controller.dispatch({
        type: 'ANSWER',
        instanceId: 'not-a-real-instance' as never,
        answer: { kind: 'decision-card', optionId: 'x' },
      })
    })

    expect(rejection?.kind).toBe('invalid-transition')
    expect(screen.getByTestId('rejection')).toHaveTextContent(
      'invalid-transition',
    )
  })

  it('plays a whole run through the UI and reaches the completion card', async () => {
    const user = userEvent.setup()
    const controller = controllerFor('component-full-run')

    render(<RunHarness controller={controller} />)

    for (let step = 0; step < 60; step += 1) {
      if (screen.queryByTestId('milestone') !== null) {
        break
      }

      const continueButton = screen.queryByTestId('continue')
      if (continueButton !== null) {
        await user.click(continueButton)
        continue
      }

      const submit = screen.queryByTestId('submit-answer')
      if (submit === null) {
        break
      }

      await provideAnswer(user)

      const readySubmit = screen.getByTestId('submit-answer')
      if (!(readySubmit as HTMLButtonElement).disabled) {
        await user.click(readySubmit)
      } else {
        break
      }
    }

    expect(screen.getByTestId('milestone')).toBeInTheDocument()
    expect(screen.getByTestId('archetype').textContent).toBeTruthy()
  }, 40_000)
})

describe('interaction renderers', () => {
  const cases: readonly [string, InteractionPresentation][] = [
    [
      'decision-card',
      {
        kind: 'decision-card',
        data: [{ label: 'Pared', value: '6 m' }],
        options: [
          { id: 'a', label: 'Opción A', detail: '$100' },
          { id: 'b', label: 'Opción B' },
        ],
      },
    ],
    [
      'timeline',
      {
        kind: 'timeline',
        data: [{ label: 'Necesitás', value: '60 min' }],
        unitLabel: 'minutos',
        options: [{ id: 'w1', label: 'Lunes', detail: '90 min' }],
      },
    ],
    [
      'chart-interpretation',
      {
        kind: 'chart-interpretation',
        axisLabel: 'kg',
        series: [
          { label: '2.º A', value: 120, display: '120 kg' },
          { label: '3.º B', value: 60, display: '60 kg' },
        ],
        options: [{ id: 'c0', label: '2.º A' }],
      },
    ],
    [
      'information-request',
      {
        kind: 'information-request',
        data: [{ label: 'Encuesta', value: '52 %' }],
        available: [{ key: 'sample-a', label: '¿Cuántos respondieron?' }],
        revealed: [],
        options: [{ id: 'survey-a', label: 'Confiar' }],
      },
    ],
    [
      'numeric-input',
      {
        kind: 'numeric-input',
        data: [{ label: 'Viaje', value: '28 min' }],
        unitLabel: 'minutos',
        min: '0',
        max: '180',
        step: '1',
      },
    ],
    [
      'budget-builder',
      {
        kind: 'budget-builder',
        data: [{ label: 'Viandas', value: '20' }],
        budgetLabel: '$1000',
        items: [
          {
            id: 'pack-1',
            label: 'Combo x1',
            unitPrice: '$100',
            maxQuantity: 5,
          },
        ],
      },
    ],
    [
      'assignment-board',
      {
        kind: 'assignment-board',
        agents: [{ id: 'm0', label: 'Sofi', detail: '5 h' }],
        tasks: [{ id: 't0', label: 'Investigación', detail: '3 h' }],
      },
    ],
    [
      'number-grid',
      {
        kind: 'number-grid',
        data: [],
        columns: 4,
        rounds: [
          {
            id: 'paso-1',
            cue: 'Pañuelo blanco',
            ruleLabel: 'Números pares',
            rule: 'even',
            numbers: [7, 12, 15, 8],
          },
        ],
      },
    ],
  ]

  it.each(cases)(
    'renders the %s interaction accessibly',
    (_kind, presentation) => {
      const onDraftChange = vi.fn()

      render(
        <InteractionControls
          presentation={presentation}
          draft={undefined}
          disabled={false}
          onDraftChange={onDraftChange}
          onRequestInformation={vi.fn()}
          instanceId="test-instance"
        />,
      )

      // Every renderer must expose a labelled, operable control.
      const controls = [
        ...screen.queryAllByRole('radio'),
        ...screen.queryAllByRole('checkbox'),
        ...screen.queryAllByRole('spinbutton'),
        ...screen.queryAllByRole('combobox'),
        ...screen.queryAllByRole('slider'),
        ...screen.queryAllByRole('button'),
      ]
      expect(controls.length).toBeGreaterThan(0)
      // At least one control must be operable. Some are legitimately disabled by
      // their own state — a budget decrement at quantity zero, for instance —
      // which is a constraint being communicated, not an inaccessible control.
      expect(
        controls.some((control) => !(control as HTMLButtonElement).disabled),
      ).toBe(true)
    },
  )

  it('no corrige la grilla cuando el borrador se perdió al reanudar', () => {
    // El checkpoint se escribe con la pantalla de resultado a la vista, pero el
    // borrador vive en la vista y no en el snapshot. Sin él, corregir afirmaría
    // que no se marcó nada, que es una mentira sobre lo que el jugador hizo.
    const { container } = render(
      <InteractionControls
        presentation={{
          kind: 'number-grid',
          data: [],
          columns: 4,
          rounds: [
            {
              id: 'paso-1',
              cue: 'Pañuelo blanco',
              ruleLabel: 'Números pares',
              rule: 'even',
              numbers: [7, 12],
            },
          ],
        }}
        draft={undefined}
        disabled
        resolution={{ chosenId: undefined, tone: 'optimal' }}
        onDraftChange={vi.fn()}
        onRequestInformation={vi.fn()}
        instanceId="resumed"
      />,
    )

    for (const cell of container.querySelectorAll('[data-resolution]')) {
      expect(cell.getAttribute('data-resolution')).toBe('pending')
    }
    expect(screen.queryByText(/Los punteados cumplían/u)).toBeNull()
  })

  it('corrige la grilla cuando el borrador sigue en la vista', () => {
    const { container } = render(
      <InteractionControls
        presentation={{
          kind: 'number-grid',
          data: [],
          columns: 4,
          rounds: [
            {
              id: 'paso-1',
              cue: 'Pañuelo blanco',
              ruleLabel: 'Números pares',
              rule: 'even',
              numbers: [7, 12],
            },
          ],
        }}
        draft={{
          kind: 'number-grid',
          rounds: [{ roundId: 'paso-1', numbers: [7] }],
        }}
        disabled
        resolution={{ chosenId: undefined, tone: 'insufficient' }}
        onDraftChange={vi.fn()}
        onRequestInformation={vi.fn()}
        instanceId="resolved"
      />,
    )

    expect(
      container
        .querySelector('[data-value="7"]')
        ?.getAttribute('data-resolution'),
    ).toBe('extra')
    expect(
      container
        .querySelector('[data-value="12"]')
        ?.getAttribute('data-resolution'),
    ).toBe('missed')
  })

  it('reports a draft to the parent without evaluating it', async () => {
    const user = userEvent.setup()
    const onDraftChange = vi.fn()
    const presentation = cases[0]?.[1]
    if (presentation === undefined) throw new Error('missing case')

    render(
      <InteractionControls
        presentation={presentation}
        draft={undefined}
        disabled={false}
        onDraftChange={onDraftChange}
        onRequestInformation={vi.fn()}
        instanceId="test-instance"
      />,
    )

    await user.click(screen.getAllByRole('radio')[0] as HTMLElement)
    expect(onDraftChange).toHaveBeenCalledWith({
      kind: 'decision-card',
      optionId: 'a',
    })
  })

  it('requests information through the callback rather than revealing it locally', async () => {
    const user = userEvent.setup()
    const onRequestInformation = vi.fn()
    const presentation = cases[3]?.[1]
    if (presentation === undefined) throw new Error('missing case')

    render(
      <InteractionControls
        presentation={presentation}
        draft={undefined}
        disabled={false}
        onDraftChange={vi.fn()}
        onRequestInformation={onRequestInformation}
        instanceId="test-instance"
      />,
    )

    await user.click(
      screen.getByRole('button', { name: '¿Cuántos respondieron?' }),
    )
    expect(onRequestInformation).toHaveBeenCalledWith('sample-a')
  })

  it('disables every control when the interaction is locked', () => {
    const presentation = cases[0]?.[1]
    if (presentation === undefined) throw new Error('missing case')

    render(
      <InteractionControls
        presentation={presentation}
        draft={undefined}
        disabled
        onDraftChange={vi.fn()}
        onRequestInformation={vi.fn()}
        instanceId="locked"
      />,
    )

    for (const radio of screen.getAllByRole('radio')) {
      expect(radio).toBeDisabled()
    }
  })
})

describe('draft validation guard', () => {
  it('accepts only a draft matching the presented interaction', () => {
    const presentation: InteractionPresentation = {
      kind: 'numeric-input',
      data: [],
      unitLabel: 'minutos',
      min: '0',
      max: '90',
      step: '1',
    }

    expect(isDraftSubmittable(presentation, undefined)).toBe(false)
    expect(
      isDraftSubmittable(presentation, {
        kind: 'decision-card',
        optionId: 'a',
      }),
    ).toBe(false)
    expect(
      isDraftSubmittable(presentation, { kind: 'numeric-input', value: '' }),
    ).toBe(false)
    expect(
      isDraftSubmittable(presentation, { kind: 'numeric-input', value: 'abc' }),
    ).toBe(false)
    expect(
      isDraftSubmittable(presentation, { kind: 'numeric-input', value: '35' }),
    ).toBe(true)
  })

  it('requires every task to be assigned before submitting a board', () => {
    const presentation: InteractionPresentation = {
      kind: 'assignment-board',
      agents: [
        { id: 'm0', label: 'Sofi', detail: '5 h' },
        { id: 'm1', label: 'Ivo', detail: '4 h' },
      ],
      tasks: [
        { id: 't0', label: 'A', detail: '3 h' },
        { id: 't1', label: 'B', detail: '2 h' },
      ],
    }

    expect(
      isDraftSubmittable(presentation, {
        kind: 'assignment-board',
        assignments: [{ agentId: 'm0', taskId: 't0' }],
      }),
    ).toBe(false)
    expect(
      isDraftSubmittable(presentation, {
        kind: 'assignment-board',
        assignments: [
          { agentId: 'm0', taskId: 't0' },
          { agentId: 'm1', taskId: 't1' },
        ],
      }),
    ).toBe(true)
  })
})
