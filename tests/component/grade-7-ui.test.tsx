// @vitest-environment jsdom

import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { GameContainer } from '@/components/game/game-container'
import { NicknameForm } from '@/components/game/nickname-form'
import { YearResult } from '@/components/game/year-result'
import { createGrade7Dependencies } from '@/content/grade-7'
import { formatPromedio } from '@/components/game/format'
import {
  activeChallengeView,
  createRun,
  promedio,
  toRunId,
  toRunSeed,
  transition,
  ENGINE_VERSION,
  type GameCommand,
  type InteractionAnswer,
  type RunDescriptor,
  type RunState,
} from '@/game'

/**
 * Las pantallas del slice de 7.º grado.
 *
 * Se prueban contra el motor real, no contra un doble: lo que valida un test de
 * pantalla es que lo que el jugador ve corresponda al estado que el motor
 * produjo, y eso deja de tener sentido si el estado es inventado.
 */

const dependencies = createGrade7Dependencies()

function descriptorFor(seed: string): RunDescriptor {
  return {
    runId: toRunId(`run-${seed}`),
    seed: toRunSeed(seed),
    mode: 'practice',
    difficulty: 'adaptive',
    gameVersion: ENGINE_VERSION,
    rulesetVersion: dependencies.ruleset.version,
    contentVersion: dependencies.ruleset.contentVersion,
  }
}

/** Juega un año entero eligiendo siempre la primera opción disponible. */
function completedRun(seed: string): RunState {
  const created = createRun(descriptorFor(seed), dependencies)
  if (!created.ok) throw new Error('no se pudo crear la run')

  let state = created.value.state

  for (let step = 0; step < 40 && state.status === 'active'; step += 1) {
    let command: GameCommand = { type: 'CONTINUE' }

    if (state.phase === 'challenge') {
      const view = activeChallengeView(state, dependencies)
      if (!view.ok || view.value === undefined) throw new Error('sin vista')
      const interaction = view.value.interaction

      const answer: InteractionAnswer =
        interaction.kind === 'assignment-board'
          ? {
              kind: 'assignment-board',
              assignments: interaction.tasks.flatMap((task, index) => {
                const agent = interaction.agents[index]
                return agent === undefined
                  ? []
                  : [{ agentId: agent.id, taskId: task.id }]
              }),
            }
          : interaction.kind === 'budget-builder'
            ? {
                kind: 'budget-builder',
                lines: interaction.items.map((item) => ({
                  itemId: item.id,
                  quantity: 2,
                })),
              }
            : interaction.kind === 'numeric-input'
              ? { kind: 'numeric-input', value: interaction.min }
              : {
                  kind: interaction.kind,
                  optionId: interaction.options[0]?.id ?? '',
                }

      command = {
        type: 'ANSWER',
        instanceId: view.value.ref.instanceId,
        answer,
      }
    }

    const result = transition(state, command, dependencies)
    if (!result.ok) throw new Error(`rechazado: ${result.error.kind}`)
    state = result.value.state
  }

  if (state.status !== 'completed') throw new Error('el año no terminó')
  return state
}

describe('el formulario de nombre', () => {
  it('no deja empezar sin nombre y lo dice sin retar a nadie', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<NicknameForm onSubmit={onSubmit} stage="7.º grado" />)

    await user.click(screen.getByRole('button', { name: 'Empezar 7.º grado' }))

    const error = screen.getByRole('alert')
    expect(error.textContent).toContain('Escribí un nombre')
    expect(onSubmit).not.toHaveBeenCalled()
    // El error describe qué falta, no culpa al jugador.
    expect(error.textContent).not.toMatch(/error|inválido|mal/iu)
  })

  it('describe el campo con el mensaje de error mientras está visible', async () => {
    const user = userEvent.setup()
    render(<NicknameForm onSubmit={vi.fn()} stage="7.º grado" />)

    const field = screen.getByLabelText('¿Cómo te decimos?')
    expect(field).not.toHaveAttribute('aria-invalid')

    await user.click(screen.getByRole('button', { name: 'Empezar 7.º grado' }))

    expect(field).toHaveAttribute('aria-invalid', 'true')
    expect(field.getAttribute('aria-describedby')).toBe(
      screen.getByRole('alert').id,
    )
  })

  it('borra el error apenas el jugador vuelve a escribir', async () => {
    const user = userEvent.setup()
    render(<NicknameForm onSubmit={vi.fn()} stage="7.º grado" />)

    await user.click(screen.getByRole('button', { name: 'Empezar 7.º grado' }))
    expect(screen.queryByRole('alert')).not.toBeNull()

    await user.type(screen.getByLabelText('¿Cómo te decimos?'), 'S')
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('entrega el nombre normalizado, no lo que se pegó', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<NicknameForm onSubmit={onSubmit} stage="7.º grado" />)

    await user.type(
      screen.getByLabelText('¿Cómo te decimos?'),
      '  Juan   Cruz ',
    )
    await user.click(screen.getByRole('button', { name: 'Empezar 7.º grado' }))

    expect(onSubmit).toHaveBeenCalledWith('Juan Cruz')
  })

  it('no pide ningún dato más que el nombre', () => {
    render(<NicknameForm onSubmit={vi.fn()} stage="7.º grado" />)

    // Minimización de datos: un solo campo, y nada que huela a identidad real.
    expect(screen.getAllByRole('textbox')).toHaveLength(1)
    expect(
      screen.queryByRole('textbox', { name: /mail|edad|escuela/iu }),
    ).toBeNull()
    expect(document.querySelectorAll('input[type="email"]')).toHaveLength(0)
  })
})

describe('el resumen del año', () => {
  const state = completedRun('resumen-7')

  it('cuenta lo que el motor registró, no lo que la pantalla supone', () => {
    render(<YearResult state={state} onPlayAgain={vi.fn()} />)

    const record = screen.getByTestId('year-record')
    expect(record.textContent).toContain(
      String(state.completion?.eventsPlayed ?? state.history.length),
    )

    // Promedio y Equipo salen del estado de carrera, y una dimensión que la run
    // nunca tocó se dibuja como «—», nunca como 0.
    const average = promedio(state.career)
    expect(record.textContent).toContain(
      average === null ? '—' : formatPromedio(average),
    )
  })

  it('no inventa ninguna dimensión que la run no haya establecido', () => {
    render(<YearResult state={state} onPlayAgain={vi.fn()} />)

    if (state.career.aura === null) {
      // Aura sólo la mueve un momento socialmente memorable, y el contenido
      // autorado de 7.º todavía no tiene ninguno.
      expect(screen.queryByTestId('aura-block')).not.toBeInTheDocument()
    }
  })

  it('cierra séptimo sin prometer un perfil de egresado', () => {
    render(<YearResult state={state} onPlayAgain={vi.fn()} />)

    expect(screen.getByRole('heading', { name: '7.º' })).toBeDefined()
    // «Vas camino a», no «sos»: el perfil definitivo pertenece a la carrera
    // completa y no se cierra en el primer año.
    expect(screen.getByTestId('archetype')).toHaveTextContent(/Vas camino a/u)
    expect(document.body.textContent).not.toMatch(/perfil (final )?de egres/iu)
    expect(document.body.textContent).not.toMatch(/game over/iu)
    expect(document.body.textContent).toContain('están en construcción')
  })

  it('ofrece volver a jugar', async () => {
    const user = userEvent.setup()
    const onPlayAgain = vi.fn()
    render(<YearResult state={state} onPlayAgain={onPlayAgain} />)

    await user.click(screen.getByRole('button', { name: 'Jugar de nuevo' }))
    expect(onPlayAgain).toHaveBeenCalledTimes(1)
  })
})

/**
 * Avanza hasta dejar una situación resuelta.
 *
 * El motor sólo pide guardar el checkpoint cuando un evento se resuelve, así
 * que pasar la apertura no alcanza: hay que responder.
 */
async function resolveFirstChallenge(
  user: ReturnType<typeof userEvent.setup>,
): Promise<void> {
  await user.click(await screen.findByRole('button', { name: 'Seguir' }))

  const radios = screen.queryAllByRole('radio')
  if (radios[0] !== undefined) {
    await user.click(radios[0])
  }

  await user.click(screen.getByRole('button', { name: 'Confirmar' }))
}

describe('el juego completo en pantalla', () => {
  beforeEach(() => {
    globalThis.localStorage.clear()
  })

  afterEach(() => {
    globalThis.localStorage.clear()
  })

  it('arranca pidiendo el nombre y entra al año', async () => {
    const user = userEvent.setup()
    render(<GameContainer />)

    await user.type(await screen.findByLabelText('¿Cómo te decimos?'), 'Sofi')
    await user.click(screen.getByRole('button', { name: 'Empezar 7.º grado' }))

    expect(
      await screen.findByRole('heading', { name: 'Arranca séptimo' }),
    ).toBeDefined()
  })

  it('guarda el avance para poder retomarlo', async () => {
    const user = userEvent.setup()
    const { unmount } = render(<GameContainer />)

    await user.type(await screen.findByLabelText('¿Cómo te decimos?'), 'Ivo')
    await user.click(screen.getByRole('button', { name: 'Empezar 7.º grado' }))
    await resolveFirstChallenge(user)

    await waitFor(() => {
      expect(
        globalThis.localStorage.getItem('egresado.checkpoint.v1'),
      ).not.toBeNull()
    })

    unmount()
    render(<GameContainer />)

    expect(
      await screen.findByRole('heading', {
        name: 'Volvés a séptimo',
      }),
    ).toBeDefined()
    expect(screen.getByText(/Ivo/u)).toBeDefined()

    await user.click(screen.getByRole('button', { name: 'Seguir jugando' }))
    // Retoma donde estaba: la apertura del año ya pasó.
    expect(
      screen.queryByRole('heading', { name: 'Arranca séptimo' }),
    ).toBeNull()
  })

  it('descartar la partida guardada devuelve a elegir nombre', async () => {
    const user = userEvent.setup()
    const { unmount } = render(<GameContainer />)

    await user.type(await screen.findByLabelText('¿Cómo te decimos?'), 'Cami')
    await user.click(screen.getByRole('button', { name: 'Empezar 7.º grado' }))
    await resolveFirstChallenge(user)
    await waitFor(() => {
      expect(
        globalThis.localStorage.getItem('egresado.checkpoint.v1'),
      ).not.toBeNull()
    })

    unmount()
    render(<GameContainer />)

    await user.click(
      await screen.findByRole('button', { name: 'Empezar de nuevo' }),
    )

    expect(screen.getByLabelText('¿Cómo te decimos?')).toBeDefined()
    expect(globalThis.localStorage.getItem('egresado.checkpoint.v1')).toBeNull()
  })

  it('ignora un checkpoint corrupto en lugar de romperse', async () => {
    globalThis.localStorage.setItem('egresado.checkpoint.v1', '{no es json')

    render(<GameContainer />)

    expect(await screen.findByLabelText('¿Cómo te decimos?')).toBeDefined()
  })
})
