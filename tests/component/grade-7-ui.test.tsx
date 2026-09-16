// @vitest-environment jsdom

import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { createGameController } from '@/components/game/controller'
import { GameContainer } from '@/components/game/game-container'
import { NicknameForm } from '@/components/game/nickname-form'
import { RunView } from '@/components/game/run-view'
import { YearResult } from '@/components/game/year-result'
import {
  createGrade7Dependencies,
  createGrade7RunDescriptor,
} from '@/content/grade-7'
import { formatPromedio } from '@/components/game/format'
import {
  activeChallengeView,
  createRun,
  promedio,
  targetsFor,
  transition,
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
  return createGrade7RunDescriptor(seed)
}

/**
 * Juega un año entero eligiendo siempre la primera opción disponible.
 *
 * La única excepción es la grilla del acto del 25 de Mayo, donde el jugador
 * aplica la regla: es el evento que establece Aura, y con una respuesta al azar
 * el resumen del año no podría afirmar nada sobre esa dimensión.
 */
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
        interaction.kind === 'number-grid'
          ? {
              kind: 'number-grid',
              rounds: interaction.rounds.map((round) => ({
                roundId: round.id,
                numbers: [...targetsFor(round.rule, round.numbers)],
              })),
            }
          : interaction.kind === 'assignment-board'
            ? {
                kind: 'assignment-board',
                assignments: interaction.tasks.flatMap((task, index) => {
                  const agent = interaction.agents[index]
                  return agent === undefined
                    ? []
                    : [{ agentId: agent.id, taskId: task.id }]
                }),
              }
            : interaction.kind === 'budget-builder' ||
                interaction.kind === 'quantity-builder'
              ? {
                  kind: interaction.kind,
                  lines: interaction.items.map((item) => ({
                    itemId: item.id,
                    quantity: 2,
                  })),
                }
              : interaction.kind === 'schedule-builder' ||
                  interaction.kind === 'spatial-layout'
                ? { kind: interaction.kind, placements: [] }
                : interaction.kind === 'route-builder'
                  ? { kind: 'route-builder', stops: [] }
                  : interaction.kind === 'numeric-input'
                    ? { kind: 'numeric-input', value: interaction.min }
                    : interaction.kind === 'classification'
                      ? {
                          kind: 'classification',
                          entries: interaction.statements.map((statement) => ({
                            statementId: statement.id,
                            labelId: interaction.labels[0]?.id ?? '',
                          })),
                          ...(interaction.stance === undefined
                            ? {}
                            : {
                                stance: interaction.stance.options[0]?.id ?? '',
                              }),
                        }
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

    // El acto del 25 de Mayo establece Aura durante el año, así que el cierre la
    // muestra. Si alguna vez dejara de establecerla, el bloque negro tiene que
    // desaparecer en lugar de dibujar un `+0`.
    if (state.career.aura === null) {
      expect(screen.queryByTestId('aura-block')).not.toBeInTheDocument()
    } else {
      expect(screen.getByTestId('aura-block')).toBeInTheDocument()
    }
  })

  it('muestra el Aura que el acto del 25 de Mayo dejó', () => {
    // Este año se juega aplicando la regla de la grilla, así que el acto sale
    // bien y Aura queda establecida y positiva.
    expect(state.career.aura).not.toBeNull()
    expect(state.career.aura ?? 0).toBeGreaterThan(0)

    render(<YearResult state={state} onPlayAgain={vi.fn()} />)

    // Con signo explícito: subir y bajar no dependen de distinguir verde de rojo.
    expect(screen.getByTestId('aura-block').textContent).toContain('+')
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

  // El slot del colectivo tiene dos plantillas y el seed elige cuál sale, así
  // que el helper no puede asumir la interacción: responde la que aparezca.
  const radios = screen.queryAllByRole('radio')
  const numeric = screen.queryByRole('spinbutton')
  if (radios[0] !== undefined) {
    await user.click(radios[0])
  } else if (numeric !== null) {
    await user.type(numeric, '45')
  }

  await user.click(screen.getByRole('button', { name: 'Confirmar' }))
}

/**
 * Las dos plantillas del colectivo, en pantalla.
 *
 * El slot de la segunda semana tiene dos plantillas y el seed elige cuál sale,
 * así que ninguna de las dos tiene cobertura garantizada en una partida con
 * seed aleatorio. Estos seeds están elegidos para que la tenga cada una: son
 * los mismos que el motor resuelve en el test de selección, y lo que se prueba
 * acá es que la interacción que le toca a cada plantilla funciona con el dedo
 * de una persona.
 */
describe('la familia colectivo en pantalla', () => {
  function renderRun(seed: string) {
    const controller = createGameController(descriptorFor(seed), dependencies)
    render(<RunView controller={controller} dependencies={dependencies} />)
    return controller
  }

  it('la salida más tarde se responde escribiendo el número', async () => {
    const user = userEvent.setup()
    renderRun('ui-1')

    await user.click(await screen.findByRole('button', { name: 'Seguir' }))
    expect(screen.getByText('La pregunta del grupo')).toBeDefined()

    const field = screen.getByRole('spinbutton')
    // Sin respuesta no se confirma: la pantalla no manda un cero por omisión.
    expect(
      screen
        .getByRole('button', { name: 'Confirmar' })
        .hasAttribute('disabled'),
    ).toBe(true)

    await user.type(field, '45')
    const submit = screen.getByRole('button', { name: 'Confirmar' })
    expect(submit.hasAttribute('disabled')).toBe(false)
    await user.click(submit)

    // El resultado del motor, no un cartel de la pantalla.
    expect(await screen.findByText(/Viaje de hoy/u)).toBeDefined()
  })

  it('los más y menos mueven la respuesta de a un minuto', async () => {
    const user = userEvent.setup()
    renderRun('ui-2')

    await user.click(await screen.findByRole('button', { name: 'Seguir' }))
    const field = screen.getByRole<HTMLInputElement>('spinbutton')

    await user.type(field, '40')
    await user.click(screen.getByRole('button', { name: /^Sumar 1/u }))
    expect(field.value).toBe('41')
    await user.click(screen.getByRole('button', { name: /^Restar 1/u }))
    expect(field.value).toBe('40')
  })

  it('la comparación de salidas se sigue respondiendo eligiendo', async () => {
    const user = userEvent.setup()
    renderRun('ui-0')

    await user.click(await screen.findByRole('button', { name: 'Seguir' }))
    const options = screen.getAllByRole('radio')
    expect(options.length).toBeGreaterThan(1)

    const first = options[0]
    if (first === undefined) throw new Error('sin opciones')
    await user.click(first)
    await user.click(screen.getByRole('button', { name: 'Confirmar' }))

    expect(await screen.findByRole('button', { name: 'Seguir' })).toBeDefined()
  })
})

/**
 * La ruta de revisión del Teacher Gate.
 *
 * El pack promete que dos personas, en dos días distintos, ven la misma
 * situación. Eso descansa en que la partida arranque con el sorteo que se le
 * pide, y ésta es la prueba de que lo hace.
 */
describe('la partida con sorteo fijo', () => {
  it('muestra la misma situación cada vez que se juega el mismo caso', async () => {
    const titles: string[] = []

    for (const attempt of [0, 1]) {
      const user = userEvent.setup()
      globalThis.localStorage.clear()
      const { unmount } = render(<GameContainer initialSeed="tg1-aa" />)

      await user.type(
        await screen.findByLabelText('¿Cómo te decimos?'),
        `Docente ${String(attempt)}`,
      )
      await user.click(
        screen.getByRole('button', { name: 'Empezar 7.º grado' }),
      )
      await user.click(await screen.findByRole('button', { name: 'Seguir' }))

      titles.push(screen.getByRole('heading', { level: 2 }).textContent ?? '')
      unmount()
    }

    expect(titles[0]).toBe(titles[1])
    // El caso TG1-A existe para mostrar la versión del colectivo que se
    // resuelve eligiendo entre salidas.
    expect(titles[0]).toBe('El colectivo de siempre')
  })

  it('otro caso muestra otra situación', async () => {
    const user = userEvent.setup()
    globalThis.localStorage.clear()
    render(<GameContainer initialSeed="tg1-ac" />)

    await user.type(
      await screen.findByLabelText('¿Cómo te decimos?'),
      'Docente',
    )
    await user.click(screen.getByRole('button', { name: 'Empezar 7.º grado' }))
    await user.click(await screen.findByRole('button', { name: 'Seguir' }))

    // TG1-B: la misma familia, la pregunta dada vuelta.
    expect(screen.getByRole('heading', { level: 2 }).textContent).toBe(
      'La pregunta del grupo',
    )
  })
})

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
