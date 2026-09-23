// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { CompetitionExperience } from '@/components/competition/competition-experience'
import { IdentityForm } from '@/components/competition/identity-form'
import { Leaderboard } from '@/components/competition/leaderboard'
import { OrganizerConsole } from '@/components/competition/organizer-console'
import { PrivacyPolicy } from '@/components/competition/privacy-policy'
import { VerificationPanel } from '@/components/competition/verification-panel'
import { AttemptRun } from '@/components/competition/attempt-run'
import { serializeSnapshot } from '@/game'
import { FULL_CAREER_EDITION } from '@/server/competition/editions'
import { playCareer, TEST_COMPETITION_SEED } from '../helpers/competition'
import type {
  IdentityFormConfig,
  PrivacyNotice,
  PublicCompetitionState,
} from '@/lib/competition'

/**
 * La interfaz de la competencia, probada donde se ve.
 *
 * Lo que estos tests defienden no es que los componentes rendericen: es que el
 * ranking dibuje el puesto como número —porque un empate lo comparte y sin el
 * número la segunda fila parecería un segundo lugar—, que el formulario no
 * responda por el estudiante, que el error quede asociado al campo, y que el
 * número grande del resultado **no aparezca** antes de que el servidor lo
 * confirme.
 */

const notice: PrivacyNotice = {
  version: '1',
  summary: [
    'En el ranking público se muestra únicamente tu alias.',
    'Tu nombre, tu año y tu documento los usan sólo los organizadores.',
    'No guardamos tu número de documento completo.',
  ],
  acknowledgement: 'Leí para qué se piden estos datos y quién los usa.',
  sections: [
    {
      heading: 'Quién responde por los datos',
      body: ['Responsable de los datos: Escuela de prueba.'],
    },
  ],
}

const formConfig: IdentityFormConfig = {
  schoolYears: ['7.º', '1.º', '2.º'],
  schoolDivisions: [],
  privacyNotice: notice,
}

function stateFixture(
  overrides: Partial<PublicCompetitionState> = {},
): PublicCompetitionState {
  return {
    competition: {
      name: 'Feria 2026',
      status: 'open',
      opensAt: undefined,
      closesAt: undefined,
    },
    leaderboard: [],
    totalRanked: 0,
    you: undefined,
    ...overrides,
  }
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('ranking', () => {
  it('dice que el primer puesto está libre cuando no hay nada', () => {
    render(<Leaderboard entries={[]} you={undefined} total={0} />)
    expect(
      screen.getByText(/Nadie tiene todavía una partida verificada/u),
    ).toBeInTheDocument()
  })

  it('es una lista ordenada con el puesto dibujado como número', () => {
    render(
      <Leaderboard
        entries={[
          {
            rank: 1,
            nickname: 'Ana',
            fairScore: 9000,
            isYou: false,
          },
          {
            rank: 1,
            nickname: 'Beto',
            fairScore: 9000,
            isYou: false,
          },
          {
            rank: 3,
            nickname: 'Caro',
            fairScore: 8000,
            isYou: false,
          },
        ]}
        you={undefined}
        total={3}
      />,
    )

    const items = screen.getAllByTestId('leaderboard-entry')
    expect(items).toHaveLength(3)
    // Dos filas dicen «1»: el empate comparte puesto y el número lo hace legible.
    expect(within(items[0] as HTMLElement).getByText('1')).toBeInTheDocument()
    expect(within(items[1] as HTMLElement).getByText('1')).toBeInTheDocument()
    expect(within(items[2] as HTMLElement).getByText('3')).toBeInTheDocument()
    expect(
      screen.getByRole('list', { name: 'Podio por puesto' }),
    ).toBeInTheDocument()
  })

  it('marca la fila propia y muestra el puesto propio fuera del podio', () => {
    render(
      <Leaderboard
        entries={[
          {
            rank: 1,
            nickname: 'Ana',
            fairScore: 9000,
            isYou: false,
          },
        ]}
        you={{
          nickname: 'Zoe',
          bestFairScore: 5000,
          bestPrestigeScore: 0,
          rank: 12,
          attempts: 2,
          activeAttempt: undefined,
        }}
        total={12}
      />,
    )
    expect(screen.getByText(/Tu puesto:/u)).toHaveTextContent('12')
  })

  it('no dibuja la línea de puesto propio cuando ya está en el podio', () => {
    render(
      <Leaderboard
        entries={[
          {
            rank: 1,
            nickname: 'Zoe',
            fairScore: 9000,
            isYou: true,
          },
        ]}
        you={{
          nickname: 'Zoe',
          bestFairScore: 9000,
          bestPrestigeScore: 0,
          rank: 1,
          attempts: 1,
          activeAttempt: undefined,
        }}
        total={1}
      />,
    )
    expect(screen.queryByText(/Tu puesto:/u)).not.toBeInTheDocument()
    expect(screen.getByText('(vos)')).toBeInTheDocument()
  })
})

describe('aviso de privacidad', () => {
  it('muestra la capa corta sin que haya que abrir nada', () => {
    render(<PrivacyPolicy notice={notice} />)
    expect(screen.getByText(/únicamente tu alias/u)).toBeVisible()
  })

  it('muestra el texto completo y su versión sin desplegables', () => {
    render(<PrivacyPolicy notice={notice} />)
    expect(screen.getByText(/Responsable de los datos/u)).toBeInTheDocument()
    expect(screen.getByText(/Versión del aviso: 1/u)).toBeInTheDocument()
  })
})

describe('resultado verificado', () => {
  const handlers = {
    onRetry: () => undefined,
    onPlayAgain: () => undefined,
    onBackToRanking: () => undefined,
  }

  it('no muestra ningún número mientras verifica', () => {
    render(<VerificationPanel phase="verifying" {...handlers} />)
    expect(screen.getByTestId('verification-pending')).toBeInTheDocument()
    expect(screen.queryByTestId('verified-fair-score')).not.toBeInTheDocument()
  })

  it('muestra el puntaje recomputado y si es el mejor propio', () => {
    render(
      <VerificationPanel
        phase="verified"
        result={{
          attemptId: 'a1',
          status: 'VERIFIED',
          fairScore: 8123,
          prestigeScore: 0,
          graduated: true,
          rejectionCode: undefined,
          personalBest: true,
        }}
        {...handlers}
      />,
    )
    expect(screen.getByTestId('verified-fair-score')).toHaveTextContent('8.123')
    expect(screen.getByTestId('personal-best')).toHaveTextContent(
      'Es tu mejor partida',
    )
  })

  it('dice que la anterior sigue contando cuando ésta no es la mejor', () => {
    render(
      <VerificationPanel
        phase="verified"
        result={{
          attemptId: 'a1',
          status: 'VERIFIED',
          fairScore: 5000,
          prestigeScore: 7,
          graduated: true,
          rejectionCode: undefined,
          personalBest: false,
        }}
        {...handlers}
      />,
    )
    expect(screen.getByTestId('personal-best')).toHaveTextContent(
      'sigue contando la anterior',
    )
    expect(screen.getByText(/Prestige: 7/u)).toBeInTheDocument()
  })

  it('ofrece reintentar cuando no se pudo verificar, sin acusar a nadie', async () => {
    const onRetry = vi.fn()
    const user = userEvent.setup()
    render(
      <VerificationPanel
        phase="failed"
        message="No pudimos conectarnos."
        {...handlers}
        onRetry={onRetry}
      />,
    )
    await user.click(screen.getByRole('button', { name: 'Reintentar' }))
    expect(onRetry).toHaveBeenCalledOnce()
  })

  it('un intento rechazado no inventa un puntaje', () => {
    render(
      <VerificationPanel
        phase="verified"
        result={{
          attemptId: 'a1',
          status: 'REJECTED',
          fairScore: undefined,
          prestigeScore: undefined,
          graduated: false,
          rejectionCode: 'replay-mismatch',
          personalBest: false,
        }}
        {...handlers}
      />,
    )
    expect(screen.getByTestId('verification-rejected')).toBeInTheDocument()
    expect(screen.queryByTestId('verified-fair-score')).not.toBeInTheDocument()
    // Y no se le muestra al jugador el código interno del rechazo.
    expect(screen.queryByText(/replay-mismatch/u)).not.toBeInTheDocument()
  })
})

describe('formulario de identificación', () => {
  it('no elige un año por el estudiante', () => {
    render(
      <IdentityForm
        config={formConfig}
        pending={false}
        serverError={undefined}
        onSubmit={() => undefined}
      />,
    )
    expect(screen.getByLabelText('Año o curso')).toHaveValue('')
  })

  it('no regaña antes de que el campo se haya usado', () => {
    render(
      <IdentityForm
        config={formConfig}
        pending={false}
        serverError={undefined}
        onSubmit={() => undefined}
      />,
    )
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('asocia el error al campo al salir de él', async () => {
    const user = userEvent.setup()
    render(
      <IdentityForm
        config={formConfig}
        pending={false}
        serverError={undefined}
        onSubmit={() => undefined}
      />,
    )

    const dni = screen.getByLabelText('DNI')
    await user.type(dni, '12')
    await user.tab()

    await waitFor(() => {
      expect(dni).toHaveAttribute('aria-invalid', 'true')
    })
    const describedBy = dni.getAttribute('aria-describedby')
    expect(describedBy).not.toBeNull()
    expect(document.getElementById(String(describedBy))).toHaveAttribute(
      'role',
      'alert',
    )
  })

  it('pide el documento con teclado numérico y sin autocompletado', () => {
    render(
      <IdentityForm
        config={formConfig}
        pending={false}
        serverError={undefined}
        onSubmit={() => undefined}
      />,
    )
    const dni = screen.getByLabelText('DNI')
    // `type="number"` cambiaría el valor con la rueda del mouse y comería los
    // ceros a la izquierda; lo que se quiere es sólo el teclado.
    expect(dni).toHaveAttribute('type', 'text')
    expect(dni).toHaveAttribute('inputmode', 'numeric')
    expect(dni).toHaveAttribute('autocomplete', 'off')
  })

  it('sólo acepta al enviar: leer la política o completar campos no registra aceptación', async () => {
    const onSubmit = vi.fn()
    const user = userEvent.setup()
    render(
      <IdentityForm
        config={formConfig}
        pending={false}
        serverError={undefined}
        onSubmit={onSubmit}
      />,
    )

    await user.type(screen.getByLabelText('Alias'), 'Sofi')
    await user.type(screen.getByLabelText('Nombre y apellido'), 'Sofía Gómez')
    await user.type(screen.getByLabelText('DNI'), '45123456')
    await user.selectOptions(screen.getByLabelText('Año o curso'), '2.º')
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument()
    const link = screen.getByRole('link', { name: /Política de Privacidad/u })
    expect(link).toHaveAttribute('href', '/privacidad')
    expect(link).toHaveAttribute('target', '_blank')
    await user.click(link)
    expect(onSubmit).not.toHaveBeenCalled()
    expect(screen.getByLabelText('DNI')).toHaveValue('45123456')
    const button = screen.getByRole('button', { name: 'Aceptar y jugar' })
    expect(button).toHaveAccessibleDescription(
      /leíste y aceptás el tratamiento/u,
    )
    await user.click(button)

    expect(onSubmit).toHaveBeenCalledOnce()
  })

  it('envía exactamente lo que se pidió, y nada más', async () => {
    const onSubmit = vi.fn()
    const user = userEvent.setup()
    render(
      <IdentityForm
        config={formConfig}
        pending={false}
        serverError={undefined}
        onSubmit={onSubmit}
      />,
    )

    await user.type(screen.getByLabelText('Alias'), 'Sofi')
    await user.type(screen.getByLabelText('Nombre y apellido'), 'Sofía Gómez')
    await user.type(screen.getByLabelText('DNI'), '45.123.456')
    await user.selectOptions(screen.getByLabelText('Año o curso'), '2.º')
    await user.click(screen.getByTestId('identity-submit'))

    expect(onSubmit).toHaveBeenCalledWith({
      nickname: 'Sofi',
      fullName: 'Sofía Gómez',
      dni: '45.123.456',
      schoolYear: '2.º',
    })
  })

  it('pide división sólo cuando la escuela la configura', async () => {
    const onSubmit = vi.fn()
    const user = userEvent.setup()
    render(
      <IdentityForm
        config={{ ...formConfig, schoolDivisions: ['A', 'B'] }}
        pending={false}
        serverError={undefined}
        onSubmit={onSubmit}
      />,
    )

    expect(screen.getByLabelText('División')).toBeInTheDocument()
    await user.type(screen.getByLabelText('Alias'), 'Sofi')
    await user.type(screen.getByLabelText('Nombre y apellido'), 'Sofía Gómez')
    await user.type(screen.getByLabelText('DNI'), '45123456')
    await user.selectOptions(screen.getByLabelText('Año o curso'), '2.º')
    await user.selectOptions(screen.getByLabelText('División'), 'B')
    await user.click(screen.getByTestId('identity-submit'))

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ division: 'B' }),
    )
  })

  it('muestra el error del servidor sin traducirlo a un código', () => {
    render(
      <IdentityForm
        config={formConfig}
        pending={false}
        serverError="Ese alias ya está en uso. Probá con otro."
        onSubmit={() => undefined}
      />,
    )
    expect(screen.getByText(/Ese alias ya está en uso/u)).toBeInTheDocument()
  })
})

describe('portada de la competencia', () => {
  function stubFetch(responses: Record<string, unknown>) {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input)
      const key = Object.keys(responses).find((candidate) =>
        url.includes(candidate),
      )
      return {
        ok: key !== undefined,
        status: key === undefined ? 404 : 200,
        json: async () => (key === undefined ? {} : responses[key]),
      } as Response
    })
    vi.stubGlobal('fetch', fetchMock)
    return fetchMock
  }

  beforeEach(() => {
    vi.useRealTimers()
  })

  it('invita a jugar cuando la competencia está abierta', () => {
    render(
      <CompetitionExperience
        initialState={stateFixture()}
        formConfig={formConfig}
      />,
    )
    expect(screen.getByText(/Feria 2026 está abierta/u)).toBeInTheDocument()
    expect(screen.getByTestId('play')).toBeInTheDocument()
  })

  it('no ofrece jugar cuando todavía no abrió', () => {
    render(
      <CompetitionExperience
        initialState={stateFixture({
          competition: {
            name: 'Feria 2026',
            status: 'upcoming',
            opensAt: '2026-10-03T13:00:00.000Z',
            closesAt: undefined,
          },
        })}
        formConfig={formConfig}
      />,
    )
    expect(screen.getByText(/todavía no empezó/u)).toBeInTheDocument()
    expect(screen.queryByTestId('play')).not.toBeInTheDocument()
    // Practicar es lo único jugable: toma el lugar del primario, y es el único.
    const practice = screen.getByRole('link', { name: 'Probar sin competir' })
    expect(practice).toHaveAttribute('data-primary', 'true')
    expect(document.querySelectorAll('[data-primary]')).toHaveLength(1)
  })

  it('deja el ranking legible después del cierre', () => {
    render(
      <CompetitionExperience
        initialState={stateFixture({
          competition: {
            name: 'Feria 2026',
            status: 'closed',
            opensAt: undefined,
            closesAt: undefined,
          },
          leaderboard: [
            {
              rank: 1,
              nickname: 'Ana',
              fairScore: 9000,
              isYou: false,
            },
          ],
          totalRanked: 1,
        })}
        formConfig={formConfig}
      />,
    )
    expect(screen.getByText(/Feria 2026 cerró/u)).toBeInTheDocument()
    expect(screen.queryByTestId('play')).not.toBeInTheDocument()
    expect(screen.getByTestId('leaderboard')).toHaveTextContent('Ana')
  })

  it('avisa al organizador cuando no hay competencia configurada', () => {
    render(
      <CompetitionExperience
        initialState={stateFixture({
          competition: {
            name: 'Egresado',
            status: 'not-configured',
            opensAt: undefined,
            closesAt: undefined,
          },
        })}
        formConfig={undefined}
      />,
    )
    expect(
      screen.getByText(/Todavía no hay una competencia/u),
    ).toBeInTheDocument()
  })

  it('saluda a quien vuelve y le ofrece jugar de nuevo', () => {
    render(
      <CompetitionExperience
        initialState={stateFixture({
          you: {
            nickname: 'Tomi',
            bestFairScore: 8123,
            bestPrestigeScore: 0,
            rank: 4,
            attempts: 2,
            activeAttempt: undefined,
          },
        })}
        formConfig={formConfig}
      />,
    )
    expect(screen.getByTestId('greeting')).toHaveTextContent('Hola, Tomi')
    expect(screen.getByText(/Tu mejor puntaje: 8.123/u)).toBeInTheDocument()
    expect(screen.getByTestId('play')).toHaveTextContent('Jugar de nuevo')
    expect(screen.getByTestId('not-me')).toBeInTheDocument()
  })

  it('abre el formulario al tocar Jugar sin sesión, y se puede volver', async () => {
    const user = userEvent.setup()
    render(
      <CompetitionExperience
        initialState={stateFixture()}
        formConfig={formConfig}
      />,
    )

    await user.click(screen.getByTestId('play'))
    expect(screen.getByLabelText('Alias')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Volver' }))
    expect(screen.queryByLabelText('Alias')).not.toBeInTheDocument()
  })

  it('traduce el rechazo del servidor a una frase, no a un código', async () => {
    stubFetch({})
    const user = userEvent.setup()
    render(
      <CompetitionExperience
        initialState={stateFixture({
          you: {
            nickname: 'Tomi',
            bestFairScore: undefined,
            bestPrestigeScore: undefined,
            rank: undefined,
            attempts: 0,
            activeAttempt: undefined,
          },
        })}
        formConfig={formConfig}
      />,
    )

    await user.click(screen.getByTestId('play'))
    await waitFor(() => {
      expect(screen.getByText(/No pudimos continuar/u)).toBeInTheDocument()
    })
  })

  it('«no soy yo» limpia el saludo', async () => {
    stubFetch({ '/api/competition/state': stateFixture() })
    const user = userEvent.setup()
    render(
      <CompetitionExperience
        initialState={stateFixture({
          you: {
            nickname: 'Tomi',
            bestFairScore: undefined,
            bestPrestigeScore: undefined,
            rank: undefined,
            attempts: 0,
            activeAttempt: undefined,
          },
        })}
        formConfig={formConfig}
      />,
    )

    await user.click(screen.getByTestId('not-me'))
    await waitFor(() => {
      expect(screen.queryByTestId('greeting')).not.toBeInTheDocument()
    })
  })
})

describe('consola del organizador', () => {
  const dashboard = {
    competition: {
      name: 'Feria 2026',
      slug: 'feria-2026',
      status: 'OPEN',
      closesAt: undefined,
      retentionDays: 120,
      runSeed: 'feria-abc',
    },
    participants: [
      {
        id: '11111111-1111-4111-8111-111111111111',
        nickname: 'Anita',
        nicknameHidden: false,
        fullName: 'Ana Belén Ramírez',
        schoolYear: '4.º',
        division: undefined,
        dniLast4: '3456',
        status: 'ELIGIBLE' as const,
        identityVerifiedAt: undefined,
        rank: 1,
        attempts: 3,
        verifiedAttempts: 2,
        bestFairScore: 8123,
        attemptDetail: [
          {
            id: '22222222-2222-4222-8222-222222222222',
            attemptNumber: 2,
            status: 'VERIFIED',
            fairScore: 8123,
            prestigeScore: 0,
            rejectionCode: undefined,
            invalidatedAt: undefined,
          },
        ],
      },
    ],
  }

  it('pide credenciales cuando no hay sesión', () => {
    render(
      <OrganizerConsole
        initialAuthenticated={false}
        initialDashboard={undefined}
      />,
    )
    expect(screen.getByLabelText('Usuario')).toBeInTheDocument()
    expect(screen.getByLabelText('Contraseña')).toHaveAttribute(
      'type',
      'password',
    )
  })

  it('muestra quién está detrás de un alias, con lo justo para verificar', () => {
    render(
      <OrganizerConsole initialAuthenticated initialDashboard={dashboard} />,
    )
    const row = screen.getByTestId('organizer-participant')
    expect(row).toHaveTextContent('Anita')
    expect(row).toHaveTextContent('Ana Belén Ramírez')
    expect(row).toHaveTextContent('3456')
    expect(row).toHaveTextContent('4.º')
  })

  it('exige un motivo antes de descalificar', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    vi.stubGlobal('prompt', vi.fn().mockReturnValue(''))
    const user = userEvent.setup()

    render(
      <OrganizerConsole initialAuthenticated initialDashboard={dashboard} />,
    )
    await user.click(screen.getByRole('button', { name: 'Descalificar' }))

    // Sin motivo no se llama al servidor: el rastro auditado es la razón por la
    // que la acción existe.
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('manda la acción con su motivo cuando se lo dan', async () => {
    const fetchMock = vi.fn(
      async () =>
        ({ ok: true, status: 200, json: async () => dashboard }) as Response,
    )
    vi.stubGlobal('fetch', fetchMock)
    vi.stubGlobal('prompt', vi.fn().mockReturnValue('identidad falsa'))
    const user = userEvent.setup()

    render(
      <OrganizerConsole initialAuthenticated initialDashboard={dashboard} />,
    )
    await user.click(screen.getByRole('button', { name: 'Descalificar' }))

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled()
    })
    const call = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    expect(JSON.parse(String(call[1].body))).toMatchObject({
      action: 'participant.eligibility',
      status: 'DISQUALIFIED',
      reason: 'identidad falsa',
    })
  })

  it('avisa cuando el despliegue no tiene edición activa', () => {
    render(
      <OrganizerConsole initialAuthenticated initialDashboard={undefined} />,
    )
    expect(screen.getByText(/Sin competencia configurada/u)).toBeInTheDocument()
  })

  it('no se rompe si el tablero llega con una forma inesperada', async () => {
    const fetchMock = vi.fn(
      async () =>
        ({ ok: true, status: 200, json: async () => ({}) }) as Response,
    )
    vi.stubGlobal('fetch', fetchMock)
    vi.stubGlobal('prompt', vi.fn().mockReturnValue('un motivo cualquiera'))
    const user = userEvent.setup()

    render(
      <OrganizerConsole initialAuthenticated initialDashboard={dashboard} />,
    )
    await user.click(screen.getByRole('button', { name: 'Descalificar' }))

    // Deja la consola diciendo «sin competencia» en vez de romper el render de
    // un docente en medio de la feria.
    await waitFor(() => {
      expect(
        screen.getByText(/Sin competencia configurada/u),
      ).toBeInTheDocument()
    })
  })
})

describe('la partida de competencia', () => {
  const descriptor = FULL_CAREER_EDITION.createDescriptor(
    TEST_COMPETITION_SEED,
    '33333333-3333-4333-8333-333333333333',
  )

  function checkpointKey(attemptId: string): string {
    return `egresado.competition.v1.${attemptId}`
  }

  beforeEach(() => {
    localStorage.clear()
  })

  it('arranca la carrera y guarda un checkpoint atado a este intento', async () => {
    if (descriptor === undefined) throw new Error('sin descriptor')
    render(
      <AttemptRun
        attemptId="attempt-nuevo"
        descriptor={descriptor}
        onVerified={() => undefined}
        onPlayAgain={() => undefined}
        onBackToRanking={() => undefined}
      />,
    )

    expect(await screen.findByTestId('stage-label')).toBeInTheDocument()
    expect(localStorage.getItem(checkpointKey('attempt-nuevo'))).not.toBeNull()
    // Y no hay ningún puntaje en pantalla: todavía no se jugó nada.
    expect(screen.queryByTestId('verified-fair-score')).not.toBeInTheDocument()
  }, 60_000)

  it('descarta un checkpoint que no corresponde a esta emisión', async () => {
    if (descriptor === undefined) throw new Error('sin descriptor')
    localStorage.setItem(
      checkpointKey('attempt-ajeno'),
      JSON.stringify({ snapshot: { version: 8 }, log: { version: 7 } }),
    )

    render(
      <AttemptRun
        attemptId="attempt-ajeno"
        descriptor={descriptor}
        onVerified={() => undefined}
        onPlayAgain={() => undefined}
        onBackToRanking={() => undefined}
      />,
    )

    // No se adapta ni se migra: empieza limpio. Inventar avance sería peor que
    // perderlo, porque el servidor va a volver a jugar el log igual.
    expect(await screen.findByTestId('stage-label')).toBeInTheDocument()
  }, 60_000)

  it('envía la carrera terminada y muestra lo que el servidor devolvió', async () => {
    if (descriptor === undefined) throw new Error('sin descriptor')
    const played = playCareer(descriptor)
    localStorage.setItem(
      checkpointKey('attempt-listo'),
      JSON.stringify({
        snapshot: serializeSnapshot(played.final),
        log: played.serialized,
      }),
    )

    const onVerified = vi.fn()
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => ({
          result: {
            attemptId: 'attempt-listo',
            status: 'VERIFIED',
            fairScore: 10000,
            prestigeScore: 0,
            graduated: true,
            rejectionCode: undefined,
            personalBest: true,
          },
          state: stateFixture(),
        }),
      })) as unknown as typeof fetch,
    )

    render(
      <AttemptRun
        attemptId="attempt-listo"
        descriptor={descriptor}
        onVerified={onVerified}
        onPlayAgain={() => undefined}
        onBackToRanking={() => undefined}
      />,
    )

    expect(await screen.findByTestId('graduated')).toHaveTextContent(
      'Egresaste',
    )
    await waitFor(() => {
      expect(screen.getByTestId('verification-verified')).toBeInTheDocument()
    })
    expect(screen.getByTestId('verified-fair-score')).toHaveTextContent(
      '10.000',
    )
    expect(onVerified).toHaveBeenCalledOnce()
    // El checkpoint se limpia recién cuando el servidor confirmó.
    expect(localStorage.getItem(checkpointKey('attempt-listo'))).toBeNull()
  }, 120_000)

  it('deja reintentar cuando la red falla, sin perder la partida', async () => {
    if (descriptor === undefined) throw new Error('sin descriptor')
    const played = playCareer(descriptor)
    localStorage.setItem(
      checkpointKey('attempt-sin-red'),
      JSON.stringify({
        snapshot: serializeSnapshot(played.final),
        log: played.serialized,
      }),
    )

    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('sin red')
      }) as unknown as typeof fetch,
    )

    render(
      <AttemptRun
        attemptId="attempt-sin-red"
        descriptor={descriptor}
        onVerified={() => undefined}
        onPlayAgain={() => undefined}
        onBackToRanking={() => undefined}
      />,
    )

    await waitFor(() => {
      expect(screen.getByTestId('verification-failed')).toBeInTheDocument()
    })
    // El checkpoint sigue ahí: sin él no habría forma de reintentar el envío.
    expect(
      localStorage.getItem(checkpointKey('attempt-sin-red')),
    ).not.toBeNull()
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeEnabled()
  }, 120_000)
})

describe('acceso y acciones del organizador', () => {
  const dashboardFixture = {
    competition: {
      name: 'Feria 2026',
      slug: 'feria-2026',
      status: 'OPEN',
      closesAt: undefined,
      retentionDays: 120,
      runSeed: 'feria-abc',
    },
    participants: [
      {
        id: '11111111-1111-4111-8111-111111111111',
        nickname: 'Anita',
        nicknameHidden: false,
        fullName: 'Ana Belén Ramírez',
        schoolYear: '4.º',
        division: undefined,
        dniLast4: '3456',
        status: 'ELIGIBLE' as const,
        identityVerifiedAt: undefined,
        rank: 1,
        attempts: 3,
        verifiedAttempts: 2,
        bestFairScore: 8123,
        attemptDetail: [
          {
            id: '22222222-2222-4222-8222-222222222222',
            attemptNumber: 2,
            status: 'VERIFIED',
            fairScore: 8123,
            prestigeScore: 0,
            rejectionCode: undefined,
            invalidatedAt: undefined,
          },
        ],
      },
    ],
  }

  function stubOrganizerFetch(
    handler: (
      url: string,
      init?: RequestInit,
    ) => Partial<Response> & {
      json?: () => Promise<unknown>
    },
  ) {
    const mock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) =>
      handler(String(input), init),
    )
    vi.stubGlobal('fetch', mock)
    return mock
  }

  it('entra con la credencial correcta y carga el tablero', async () => {
    const fetchMock = stubOrganizerFetch((url) =>
      url.includes('/api/organizer/session')
        ? { ok: true, status: 200, json: async () => ({ authenticated: true }) }
        : { ok: true, status: 200, json: async () => dashboardFixture },
    )
    const user = userEvent.setup()

    render(
      <OrganizerConsole
        initialAuthenticated={false}
        initialDashboard={undefined}
      />,
    )
    await user.type(screen.getByLabelText('Usuario'), 'organizador')
    await user.type(screen.getByLabelText('Contraseña'), 'una-contraseña')
    await user.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(await screen.findByText('Feria 2026')).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalled()
  })

  it('muestra el mensaje del servidor cuando la credencial no sirve', async () => {
    stubOrganizerFetch(() => ({
      ok: false,
      status: 401,
      json: async () => ({
        error: {
          code: 'ORGANIZER_CREDENTIALS_INVALID',
          message: 'No tenés acceso a esta sección.',
        },
      }),
    }))
    const user = userEvent.setup()

    render(
      <OrganizerConsole
        initialAuthenticated={false}
        initialDashboard={undefined}
      />,
    )
    await user.type(screen.getByLabelText('Usuario'), 'intruso')
    await user.type(screen.getByLabelText('Contraseña'), 'lo-que-sea')
    await user.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(await screen.findByText(/No tenés acceso/u)).toBeInTheDocument()
    // Y no dice si el usuario existe.
    expect(screen.queryByText(/usuario/iu)).not.toHaveTextContent('no existe')
  })

  it('vuelve al formulario cuando la sesión venció', async () => {
    stubOrganizerFetch(() => ({
      ok: false,
      status: 401,
      json: async () => ({}),
    }))
    vi.stubGlobal('prompt', vi.fn().mockReturnValue('un motivo cualquiera'))
    const user = userEvent.setup()

    render(
      <OrganizerConsole
        initialAuthenticated
        initialDashboard={dashboardFixture}
      />,
    )
    await user.click(screen.getByRole('button', { name: 'Descalificar' }))

    expect(await screen.findByLabelText('Usuario')).toBeInTheDocument()
  })

  it('cambia el estado de la edición con su motivo', async () => {
    const fetchMock = stubOrganizerFetch(() => ({
      ok: true,
      status: 200,
      json: async () => dashboardFixture,
    }))
    vi.stubGlobal('prompt', vi.fn().mockReturnValue('terminó la feria'))
    const user = userEvent.setup()

    render(
      <OrganizerConsole
        initialAuthenticated
        initialDashboard={dashboardFixture}
      />,
    )
    await user.click(screen.getByRole('button', { name: 'CLOSED' }))

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled()
    })
    const call = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    expect(JSON.parse(String(call[1].body))).toMatchObject({
      action: 'competition.status',
      status: 'CLOSED',
      reason: 'terminó la feria',
    })
  })

  it('oculta un alias y marca una identidad verificada', async () => {
    const fetchMock = stubOrganizerFetch(() => ({
      ok: true,
      status: 200,
      json: async () => dashboardFixture,
    }))
    vi.stubGlobal('prompt', vi.fn().mockReturnValue('alias inapropiado'))
    const user = userEvent.setup()

    render(
      <OrganizerConsole
        initialAuthenticated
        initialDashboard={dashboardFixture}
      />,
    )
    await user.click(screen.getByRole('button', { name: 'Ocultar alias' }))
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled()
    })
    expect(
      JSON.parse(
        String(
          (fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1].body,
        ),
      ),
    ).toMatchObject({ action: 'participant.correct', nicknameHidden: true })

    await user.click(
      screen.getByRole('button', { name: 'Marcar identidad verificada' }),
    )
    await waitFor(() => {
      expect(fetchMock.mock.calls.length).toBeGreaterThan(1)
    })
  })

  it('invalida un intento verificado y ofrece purgar los datos privados', async () => {
    const fetchMock = stubOrganizerFetch(() => ({
      ok: true,
      status: 200,
      json: async () => dashboardFixture,
    }))
    vi.stubGlobal('prompt', vi.fn().mockReturnValue('confirmado como copia'))
    const user = userEvent.setup()

    render(
      <OrganizerConsole
        initialAuthenticated
        initialDashboard={dashboardFixture}
      />,
    )
    await user.click(
      screen.getByRole('button', { name: /Invalidar intento 2/u }),
    )
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled()
    })
    expect(
      JSON.parse(
        String(
          (fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1].body,
        ),
      ),
    ).toMatchObject({ action: 'attempt.validity', invalid: true })

    await user.click(
      screen.getByRole('button', { name: 'Anonimizar datos privados' }),
    )
    await waitFor(() => {
      expect(fetchMock.mock.calls.length).toBeGreaterThan(1)
    })
  })

  it('muestra el error del servidor sin romper el tablero', async () => {
    stubOrganizerFetch(() => ({
      ok: false,
      status: 409,
      json: async () => ({
        error: { code: 'NICKNAME_TAKEN', message: 'Ese alias ya está en uso.' },
      }),
    }))
    vi.stubGlobal('prompt', vi.fn().mockReturnValue('pedido del estudiante'))
    const user = userEvent.setup()

    render(
      <OrganizerConsole
        initialAuthenticated
        initialDashboard={dashboardFixture}
      />,
    )
    await user.click(screen.getByRole('button', { name: 'Ocultar alias' }))

    expect(
      await screen.findByText(/Ese alias ya está en uso/u),
    ).toBeInTheDocument()
    expect(screen.getByTestId('organizer-participant')).toBeInTheDocument()
  })

  it('ofrece la exportación como enlace autenticado', () => {
    render(
      <OrganizerConsole
        initialAuthenticated
        initialDashboard={dashboardFixture}
      />,
    )
    expect(screen.getByRole('link', { name: 'Exportar CSV' })).toHaveAttribute(
      'href',
      '/api/organizer/export',
    )
  })

  it('cierra la sesión y vuelve al formulario', async () => {
    stubOrganizerFetch(() => ({
      ok: true,
      status: 200,
      json: async () => ({}),
    }))
    const user = userEvent.setup()

    render(
      <OrganizerConsole
        initialAuthenticated
        initialDashboard={dashboardFixture}
      />,
    )
    await user.click(screen.getByRole('button', { name: 'Cerrar sesión' }))
    expect(await screen.findByLabelText('Usuario')).toBeInTheDocument()
  })
})

describe('de la portada a la partida', () => {
  it('emite el intento y entra al juego', async () => {
    const descriptor = FULL_CAREER_EDITION.createDescriptor(
      TEST_COMPETITION_SEED,
      '44444444-4444-4444-8444-444444444444',
    )
    if (descriptor === undefined) throw new Error('sin descriptor')

    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input)
        if (url.includes('/api/competition/attempts')) {
          return {
            ok: true,
            status: 200,
            json: async () => ({
              attemptId: 'attempt-desde-portada',
              attemptNumber: 1,
              resumed: false,
              descriptor,
            }),
          } as Response
        }
        return {
          ok: true,
          status: 200,
          json: async () => stateFixture(),
        } as Response
      }),
    )
    const user = userEvent.setup()

    render(
      <CompetitionExperience
        initialState={stateFixture({
          you: {
            nickname: 'Tomi',
            bestFairScore: undefined,
            bestPrestigeScore: undefined,
            rank: undefined,
            attempts: 0,
            activeAttempt: undefined,
          },
        })}
        formConfig={formConfig}
      />,
    )

    await user.click(screen.getByTestId('play'))
    // La portada desaparece y empieza la carrera: no hay una segunda dirección.
    expect(await screen.findByTestId('stage-label')).toBeInTheDocument()
    expect(screen.queryByTestId('greeting')).not.toBeInTheDocument()
  }, 60_000)

  it('registra al participante y arranca la partida en un solo gesto', async () => {
    const descriptor = FULL_CAREER_EDITION.createDescriptor(
      TEST_COMPETITION_SEED,
      '55555555-5555-4555-8555-555555555555',
    )
    if (descriptor === undefined) throw new Error('sin descriptor')

    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input)
      if (url.includes('/api/competition/participants')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({ created: true }),
        } as Response
      }
      if (url.includes('/api/competition/attempts')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            attemptId: 'attempt-tras-registro',
            attemptNumber: 1,
            resumed: false,
            descriptor,
          }),
        } as Response
      }
      return {
        ok: true,
        status: 200,
        json: async () => stateFixture(),
      } as Response
    })
    vi.stubGlobal('fetch', fetchMock)
    const user = userEvent.setup()

    render(
      <CompetitionExperience
        initialState={stateFixture()}
        formConfig={formConfig}
      />,
    )

    await user.click(screen.getByTestId('play'))
    await user.type(screen.getByLabelText('Alias'), 'Sofi')
    await user.type(screen.getByLabelText('Nombre y apellido'), 'Sofía Gómez')
    await user.type(screen.getByLabelText('DNI'), '45123456')
    await user.selectOptions(screen.getByLabelText('Año o curso'), '2.º')
    await user.click(screen.getByTestId('identity-submit'))

    expect(await screen.findByTestId('stage-label')).toBeInTheDocument()

    // El cuerpo enviado lleva la versión del aviso y su reconocimiento.
    const registration = fetchMock.mock.calls.find(([input]) =>
      String(input).includes('/api/competition/participants'),
    ) as unknown as [string, RequestInit]
    expect(JSON.parse(String(registration[1].body))).toMatchObject({
      nickname: 'Sofi',
      privacyNoticeVersion: '1',
      privacyNoticeAcknowledged: true,
    })
  }, 60_000)

  it('muestra el rechazo del registro sin sacar a la persona del formulario', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        if (String(input).includes('/api/competition/participants')) {
          return {
            ok: false,
            status: 409,
            json: async () => ({
              error: {
                code: 'NICKNAME_TAKEN',
                message: 'Ese alias ya está en uso. Probá con otro.',
              },
            }),
          } as Response
        }
        return {
          ok: true,
          status: 200,
          json: async () => stateFixture(),
        } as Response
      }),
    )
    const user = userEvent.setup()

    render(
      <CompetitionExperience
        initialState={stateFixture()}
        formConfig={formConfig}
      />,
    )

    await user.click(screen.getByTestId('play'))
    await user.type(screen.getByLabelText('Alias'), 'Repetido')
    await user.type(screen.getByLabelText('Nombre y apellido'), 'Sofía Gómez')
    await user.type(screen.getByLabelText('DNI'), '45123456')
    await user.selectOptions(screen.getByLabelText('Año o curso'), '2.º')
    await user.click(screen.getByTestId('identity-submit'))

    expect(
      await screen.findByText(/Ese alias ya está en uso/u),
    ).toBeInTheDocument()
    // Lo escrito sigue ahí: reescribir cuatro campos por un alias repetido
    // sería castigar a alguien por una colisión que no eligió.
    expect(screen.getByLabelText('Nombre y apellido')).toHaveValue(
      'Sofía Gómez',
    )
  })
})
