// @vitest-environment jsdom
import { act, render, screen, within, cleanup } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Leaderboard } from '@/components/competition/leaderboard'
import { InstitutionalFooter } from '@/components/competition/institutional-footer'
import { CompetitionExperience } from '@/components/competition/competition-experience'
import type {
  PublicCompetitionState,
  PublicLeaderboardEntry,
} from '@/lib/competition'

const entry = (
  rank: number,
  nickname: string,
  isYou = false,
): PublicLeaderboardEntry => ({
  rank,
  nickname,
  isYou,
  fairScore: 10000 - rank * 100,
})
const you = {
  nickname: 'Yo',
  rank: 6,
  bestFairScore: 9400,
  bestPrestigeScore: 0,
  attempts: 2,
  activeAttempt: undefined,
}
afterEach(() => {
  cleanup()
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('podio por puestos', () => {
  it('representa empates completos sin inventar puestos omitidos', () => {
    render(
      <Leaderboard
        entries={[
          { ...entry(1, 'A'), sharedCount: 1 },
          { ...entry(3, 'C'), sharedCount: 2 },
        ]}
        you={you}
        total={8}
      />,
    )
    const rows = screen.getAllByTestId('leaderboard-entry')
    expect(rows).toHaveLength(2)
    expect(rows[0]).toHaveTextContent('Compartido con 1 más')
    expect(rows[1]).toHaveTextContent('Compartido con 2 más')
    expect(screen.queryByLabelText(/puesto 2/u)).not.toBeInTheDocument()
    expect(screen.getByTestId('own-rank')).toHaveTextContent('Tu puesto: 6')
  })
  it('mantiene orden lógico 1, 2, 3 y resalta a quien está en el podio', () => {
    render(
      <Leaderboard
        entries={[entry(1, 'A'), entry(2, 'Yo', true), entry(3, 'C')]}
        you={{ ...you, rank: 2 }}
        total={3}
      />,
    )
    const groups = screen.getByRole('list', {
      name: 'Ranking de mejores partidas',
    }).children
    expect([...groups].map((group) => group.getAttribute('value'))).toEqual([
      '1',
      '2',
      '3',
    ])
    expect(
      within(screen.getByLabelText('Yo, puesto 2, tu mejor partida')).getByText(
        '(vos)',
      ),
    ).toBeInTheDocument()
    expect(screen.queryByTestId('own-rank')).not.toBeInTheDocument()
  })
  it('un solo puesto no agrega personas ni premios de relleno', () => {
    render(<Leaderboard entries={[entry(1, 'A')]} you={undefined} total={1} />)
    expect(screen.getAllByTestId('leaderboard-entry')).toHaveLength(1)
    expect(screen.getByText('1 participante en el ranking')).toBeInTheDocument()
  })
  it('cerrado y vacío no invita a publicar una partida nueva', () => {
    render(
      <Leaderboard entries={[]} you={undefined} total={0} status="closed" />,
    )
    expect(
      screen.getByRole('heading', { name: 'Resultados del evento' }),
    ).toBeInTheDocument()
    expect(screen.getByTestId('ranking-empty')).toHaveTextContent(
      'cerró sin resultados',
    )
    expect(screen.queryByText(/Completá una partida/u)).not.toBeInTheDocument()
  })
  it('upcoming anticipa el podio sin fingir resultados', () => {
    render(
      <Leaderboard entries={[]} you={undefined} total={0} status="upcoming" />,
    )
    expect(screen.getByTestId('ranking-empty')).toHaveTextContent('Cuando abra')
  })
})

describe('footer institucional', () => {
  it('incluye las dos marcas institucionales y créditos con enlaces separados', () => {
    render(<InstitutionalFooter />)
    expect(screen.getAllByRole('img')).toHaveLength(2)
    expect(
      screen.getByRole('img', { name: 'Colegio Integral Piacentini' }),
    ).toHaveAttribute('src', '/assets/footer/logo-piacentini.webp')
    expect(
      screen.getByRole('img', { name: /Feria del Libro 2026/u }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: /developed by gastong256.dev/u }),
    ).toHaveAttribute('href', 'https://gastong256.dev')
    expect(screen.getByRole('link', { name: /developed by/u })).toHaveAttribute(
      'rel',
      'noopener noreferrer',
    )
    expect(
      screen.queryByRole('img', { name: /Logo de gastong256/u }),
    ).not.toBeInTheDocument()
    const repository = screen.getByRole('link', {
      name: 'Repositorio en GitHub (abre en otra pestaña)',
    })
    expect(repository).toHaveAttribute(
      'href',
      'https://github.com/gastong256/mono256_egresado-game',
    )
    expect(repository).toHaveAttribute('target', '_blank')
    expect(repository).toHaveAttribute('rel', 'noopener noreferrer')
    expect(
      screen.getByRole('link', {
        name: 'Política de privacidad y uso de datos',
      }),
    ).toHaveAttribute('href', '/privacidad')
    expect(
      screen.getByRole('link', { name: 'Cómo se calculan los puntos' }),
    ).toHaveAttribute('href', '/puntajes')
  })
})

describe('autoridad de estado en home', () => {
  it('llegar a cero sólo refresca; Jugar aparece cuando lo confirma el servidor', async () => {
    vi.useFakeTimers()
    vi.setSystemTime('2026-10-03T12:00:00Z')
    const state: PublicCompetitionState = {
      competition: {
        name: 'Feria de prueba',
        status: 'upcoming',
        opensAt: '2026-10-03T12:00:01Z',
        closesAt: undefined,
      },
      you: undefined,
      leaderboard: [],
      totalRanked: 0,
    }
    let returned = state
    const fetch = vi.fn(async () => ({ ok: true, json: async () => returned }))
    vi.stubGlobal('fetch', fetch)
    render(
      <CompetitionExperience initialState={state} formConfig={undefined} />,
    )
    await act(async () => {
      vi.advanceTimersByTime(1000)
    })
    expect(fetch).toHaveBeenCalledOnce()
    expect(screen.queryByTestId('play')).not.toBeInTheDocument()
    returned = {
      ...state,
      competition: { ...state.competition, status: 'open' },
    }
    await act(async () => {
      vi.advanceTimersByTime(19000)
    })
    expect(screen.getByTestId('play')).toBeInTheDocument()
    expect(screen.getByTestId('play')).toBeDisabled() // no identity config, no dead-end form
  })
  it('la portada cerrada tampoco invita a reintentar en la explicación', () => {
    render(
      <CompetitionExperience
        initialState={{
          competition: {
            name: 'Feria',
            status: 'closed',
            opensAt: undefined,
            closesAt: undefined,
          },
          you,
          leaderboard: [],
          totalRanked: 0,
        }}
        formConfig={undefined}
      />,
    )
    expect(screen.queryByText(/Podés volver a jugar/u)).not.toBeInTheDocument()
    expect(screen.getByText(/En esta competencia contó/u)).toBeInTheDocument()
    expect(screen.queryByTestId('play')).not.toBeInTheDocument()
  })
  it('explica Matemática, Equipo y Aura sin presentar Prestige', () => {
    render(
      <CompetitionExperience
        initialState={{
          competition: {
            name: 'Feria',
            status: 'open',
            opensAt: undefined,
            closesAt: undefined,
          },
          you,
          leaderboard: [],
          totalRanked: 0,
        }}
        formConfig={undefined}
      />,
    )
    expect(screen.getByText('Matemática')).toBeInTheDocument()
    expect(screen.getByText('Equipo')).toBeInTheDocument()
    expect(screen.getByText('Aura')).toBeInTheDocument()
    const explanation = screen.getByRole('region', {
      name: /La matemática manda/u,
    })
    expect(
      within(explanation)
        .getAllByRole('term')
        .map((term) => term.textContent),
    ).toEqual(['Matemática', 'Equipo', 'Aura'])
    // Icons accompany text and never add duplicate accessible image names.
    expect(within(explanation).queryByRole('img')).not.toBeInTheDocument()
    expect(screen.queryByText(/Prestige/u)).not.toBeInTheDocument()
  })
})
