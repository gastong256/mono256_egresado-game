// @vitest-environment jsdom

import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeAll, describe, expect, it, vi } from 'vitest'

import {
  CareerEpilogueView,
  type EndingInput,
  type EndingResult,
} from '@/components/game/career-epilogue'
import {
  closeCareer,
  createFullCareerRunDescriptor,
} from '@/content/full-career'
import { parseActionLog, type RunDescriptor } from '@/game'
import type {
  PublicCompetitionState,
  VerifiedAttemptPayload,
} from '@/lib/competition'
import { playCareer } from '../helpers/play-career'

/**
 * El cierre entero, con una carrera real y resultados de servidor simulados.
 *
 * Lo que se prueba es lo que la pantalla afirma: que el egreso va primero,
 * que el puesto sale del estado público y no del puntaje, que las
 * afirmaciones fuertes aparecen sólo con evidencia, y que la práctica no
 * muestra nada competitivo.
 */

let descriptor: RunDescriptor
let optimal: EndingInput
let weak: EndingInput

function endingOf(quality: 'optimal' | 'invalid'): EndingInput {
  const played = playCareer(descriptor, quality)
  const log = parseActionLog(played.log)
  if (!log.ok) throw new Error('invalid log')
  const closed = closeCareer(played.state)
  return {
    state: played.state,
    epilogue: closed.epilogue,
    milestones: closed.milestones,
    memories: closed.memories,
  }
}

beforeAll(() => {
  const built = createFullCareerRunDescriptor('career-ending-component')
  if (!built.ok) throw new Error('invalid fixture')
  descriptor = built.value
  optimal = endingOf('optimal')
  weak = endingOf('invalid')
})

const payload = (
  overrides: Partial<VerifiedAttemptPayload> = {},
): VerifiedAttemptPayload => ({
  attemptId: 'a1',
  status: 'VERIFIED',
  fairScore: 9800,
  prestigeScore: 0,
  graduated: true,
  rejectionCode: undefined,
  personalBest: true,
  ...overrides,
})

const publicState = (
  rank: number | undefined,
  leaderboard: readonly { rank: number; score: number; you?: boolean }[],
  status: PublicCompetitionState['competition']['status'] = 'open',
): PublicCompetitionState => ({
  competition: {
    name: 'Feria',
    status,
    opensAt: undefined,
    closesAt: undefined,
  },
  leaderboard: leaderboard.map((entry, index) => ({
    rank: entry.rank,
    nickname: `p${String(index)}`,
    fairScore: entry.score,
    isYou: entry.you === true,
  })),
  totalRanked: 9,
  you:
    rank === undefined
      ? undefined
      : {
          nickname: 'yo',
          bestFairScore: 9800,
          bestPrestigeScore: 0,
          rank,
          attempts: 2,
          activeAttempt: undefined,
        },
})

function renderEnding(ending: EndingInput, result: EndingResult) {
  const onPlayAgain = vi.fn()
  const onBackToRanking = vi.fn()
  render(
    <CareerEpilogueView
      ending={ending}
      result={result}
      onPlayAgain={onPlayAgain}
      onBackToRanking={onBackToRanking}
    />,
  )
  return { onPlayAgain, onBackToRanking }
}

describe('el cierre de la carrera', () => {
  it('egresa primero, con el numeral como h1 y el resultado después', () => {
    renderEnding(optimal, {
      kind: 'competition',
      phase: 'verified',
      result: payload(),
      competition: publicState(1, [{ rank: 1, score: 9800, you: true }]),
    })
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Egresado',
    )
    expect(screen.getByTestId('graduated')).toHaveTextContent('Egresaste')
    const artwork = screen.getByTestId('scene-media').querySelector('img')
    expect(artwork?.getAttribute('src')).toContain('graduation.webp')
    expect(artwork).toHaveAttribute('alt', '')
    expect(artwork).toHaveAttribute('sizes', '192px')
    const graduated = screen.getByTestId('graduated')
    const score = screen.getByTestId('verified-fair-score')
    expect(
      graduated.compareDocumentPosition(score) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
    expect(score).toHaveTextContent('9.800')
    expect(screen.getByTestId('performance-headline')).toHaveAttribute(
      'data-band',
      'exceptional',
    )
    // Estilo, números, hitos y recorrido, en ese orden.
    expect(screen.getByTestId('play-style')).toBeInTheDocument()
    expect(screen.getByTestId('epilogue-record')).toHaveTextContent('Promedio')
    expect(screen.getByTestId('achievements')).toBeInTheDocument()
    expect(screen.getAllByTestId('recap-year')).toHaveLength(6)
    expect(document.querySelectorAll('[data-primary]')).toHaveLength(1)
  })

  it('está 1.º sin compartir, sin récord y sin «nuevo» cuando no hay evidencia', () => {
    renderEnding(optimal, {
      kind: 'competition',
      phase: 'verified',
      result: payload(),
      competition: publicState(1, [{ rank: 1, score: 9800, you: true }]),
    })
    const placement = screen.getByTestId('placement')
    expect(placement).toHaveAttribute('data-rank', '1')
    expect(within(placement).getByTestId('placement-claim')).toHaveTextContent(
      'Estás 1.º.',
    )
    expect(placement).not.toHaveAttribute('data-record')
    expect(placement).not.toHaveAttribute('data-new-first')
    expect(placement).not.toHaveTextContent(/Récord/u)
  })

  it('anuncia récord y subida sólo con el antes y el después', () => {
    renderEnding(optimal, {
      kind: 'competition',
      phase: 'verified',
      result: payload({ fairScore: 9800 }),
      competition: publicState(1, [{ rank: 1, score: 9800, you: true }]),
      before: { rank: 3, bestFairScore: 8000, topScore: 9500 },
    })
    const placement = screen.getByTestId('placement')
    expect(placement).toHaveAttribute('data-record', 'true')
    expect(within(placement).getByTestId('placement-claim')).toHaveTextContent(
      /Récord de la competencia/u,
    )
    expect(screen.getByTestId('personal-best')).toHaveTextContent(
      'Nuevo mejor puntaje personal',
    )
  })

  it('un 1.º compartido lo dice como compartido', () => {
    renderEnding(optimal, {
      kind: 'competition',
      phase: 'verified',
      result: payload(),
      competition: publicState(1, [
        { rank: 1, score: 9800 },
        { rank: 1, score: 9800, you: true },
      ]),
      before: { rank: 2, bestFairScore: 9000, topScore: 9800 },
    })
    expect(screen.getByTestId('placement-claim')).toHaveTextContent(
      'Compartís el 1.º puesto.',
    )
    expect(screen.getByTestId('placement')).not.toHaveAttribute('data-record')
  })

  it('fuera del podio muestra el puesto actual sin afirmaciones', () => {
    renderEnding(optimal, {
      kind: 'competition',
      phase: 'verified',
      result: payload({ fairScore: 7200, personalBest: false }),
      competition: publicState(7, [
        { rank: 1, score: 9800 },
        { rank: 2, score: 9500 },
        { rank: 3, score: 9300 },
      ]),
    })
    const placement = screen.getByTestId('placement')
    expect(placement).toHaveAttribute('data-rank', '7')
    expect(placement).not.toHaveAttribute('data-podium')
    expect(screen.queryByTestId('placement-claim')).not.toBeInTheDocument()
    expect(within(placement).getByTestId('own-rank-figure')).toHaveTextContent(
      '7',
    )
    expect(placement).toHaveTextContent('Tu puesto actual')
    expect(screen.getByTestId('personal-best')).toHaveTextContent(
      'sigue contando la anterior',
    )
    expect(screen.getByTestId('performance-headline')).toHaveAttribute(
      'data-band',
      'solid',
    )
  })

  it('sin puesto en el estado público no dibuja un número', () => {
    renderEnding(optimal, {
      kind: 'competition',
      phase: 'verified',
      result: payload(),
      competition: publicState(undefined, []),
    })
    expect(screen.queryByTestId('own-rank-figure')).not.toBeInTheDocument()
    expect(screen.getByTestId('placement')).toHaveTextContent(
      /No pudimos leer tu puesto/u,
    )
  })

  it('una partida pobre egresa igual, lo dice sin humillar y pide revancha', () => {
    renderEnding(weak, {
      kind: 'competition',
      phase: 'verified',
      result: payload({ fairScore: 1900, personalBest: true }),
      competition: publicState(9, [{ rank: 1, score: 9800 }]),
    })
    expect(screen.getByTestId('graduated')).toHaveTextContent('Egresaste')
    expect(screen.getByTestId('performance-headline')).toHaveAttribute(
      'data-band',
      'struggling',
    )
    expect(screen.getByTestId('performance-headline')).toHaveTextContent(
      /Safaste/u,
    )
    expect(screen.getByTestId('performance-closing')).toHaveTextContent(
      /revancha/u,
    )
    const text = document.body.textContent?.toLowerCase() ?? ''
    for (const forbidden of ['fracas', 'pésimo', 'mal alumno', 'burro'])
      expect(text).not.toContain(forbidden)
    // Los años con Repaso se dicen como Repaso, no como fallas contadas.
    const recap = screen.getByTestId('career-recap')
    expect(recap).toHaveTextContent(/Repaso/u)
    expect(recap).not.toHaveTextContent(/fall/u)
  })

  it('mientras verifica no muestra número ni acciones que pierdan la partida', () => {
    renderEnding(optimal, { kind: 'competition', phase: 'verifying' })
    expect(screen.getByTestId('verification-pending')).toBeInTheDocument()
    expect(screen.queryByTestId('verified-fair-score')).not.toBeInTheDocument()
    expect(screen.queryByTestId('placement')).not.toBeInTheDocument()
    expect(screen.queryByTestId('play-again')).not.toBeInTheDocument()
    expect(screen.queryByTestId('performance-headline')).not.toBeInTheDocument()
  })

  it('con la red caída ofrece reintentar y conserva el recorrido', async () => {
    const onRetry = vi.fn()
    const user = userEvent.setup()
    renderEnding(optimal, {
      kind: 'competition',
      phase: 'failed',
      message: 'Sin conexión.',
      onRetry,
    })
    expect(screen.getByTestId('verification-failed')).toHaveTextContent(
      'Sin conexión.',
    )
    await user.click(screen.getByRole('button', { name: 'Reintentar' }))
    expect(onRetry).toHaveBeenCalledOnce()
    expect(screen.getAllByTestId('recap-year')).toHaveLength(6)
    expect(screen.queryByTestId('placement')).not.toBeInTheDocument()
  })

  it('un intento rechazado no inventa puntaje ni puesto', () => {
    renderEnding(optimal, {
      kind: 'competition',
      phase: 'verified',
      result: payload({ status: 'REJECTED', fairScore: undefined }),
      competition: publicState(undefined, []),
    })
    expect(screen.getByTestId('verification-rejected')).toBeInTheDocument()
    expect(screen.queryByTestId('verified-fair-score')).not.toBeInTheDocument()
    expect(screen.queryByTestId('placement')).not.toBeInTheDocument()
    expect(screen.getByTestId('play-again')).toBeInTheDocument()
  })

  it('con la competencia cerrada no ofrece jugar de nuevo', async () => {
    const user = userEvent.setup()
    const { onBackToRanking } = renderEnding(optimal, {
      kind: 'competition',
      phase: 'verified',
      result: payload(),
      competition: publicState(
        2,
        [
          { rank: 1, score: 9900 },
          { rank: 2, score: 9800, you: true },
        ],
        'closed',
      ),
    })
    expect(screen.queryByTestId('play-again')).not.toBeInTheDocument()
    expect(screen.getByTestId('placement-claim')).toHaveTextContent(
      'Entraste al podio.',
    )
    await user.click(screen.getByTestId('back-to-ranking'))
    expect(onBackToRanking).toHaveBeenCalledOnce()
    expect(document.querySelectorAll('[data-primary]')).toHaveLength(1)
  })

  it('la práctica comparte el cierre y no muestra nada competitivo', () => {
    renderEnding(optimal, { kind: 'practice', phase: 'done', fairScore: 8400 })
    expect(screen.getByTestId('graduated')).toHaveTextContent('Egresaste')
    expect(screen.getByTestId('practice-score')).toHaveTextContent('8.400')
    expect(screen.getByTestId('performance-headline')).toHaveAttribute(
      'data-band',
      'strong',
    )
    expect(
      screen.getByText('Este puntaje es de práctica y no modifica el ranking.'),
    ).toBeInTheDocument()
    expect(screen.queryByTestId('placement')).not.toBeInTheDocument()
    expect(screen.queryByTestId('verified-fair-score')).not.toBeInTheDocument()
    const text = document.body.textContent ?? ''
    for (const forbidden of ['puesto', 'podio', 'Récord', 'ranking oficial'])
      expect(text).not.toContain(forbidden)
    expect(screen.getByTestId('play-again')).toHaveTextContent(
      'Practicar de nuevo',
    )
    expect(screen.getByTestId('play-style')).toBeInTheDocument()
    expect(screen.getAllByTestId('recap-year')).toHaveLength(6)
  })

  it('nombra al jugador al egresar cuando hay alias, y no lo inventa cuando no', () => {
    const { unmount } = render(
      <CareerEpilogueView
        ending={optimal}
        result={{ kind: 'practice', phase: 'done', fairScore: 9000 }}
        onPlayAgain={() => undefined}
      />,
    )
    expect(screen.getByTestId('graduated')).toHaveTextContent(/^Egresaste$/u)
    unmount()
    render(
      <CareerEpilogueView
        ending={optimal}
        result={{ kind: 'practice', phase: 'done', fairScore: 9000 }}
        nickname="AliasLargoDePruebaABCD"
        onPlayAgain={() => undefined}
      />,
    )
    expect(screen.getByTestId('graduated')).toHaveTextContent(
      'Egresaste, AliasLargoDePruebaABCD.',
    )
    // Texto, nunca HTML: React lo escapa.
    expect(document.querySelector('[data-testid="graduated"] b')).toBeNull()
  })

  it('un recorrido de desarrollo cierra sin puntaje y con un solo primario', () => {
    renderEnding(optimal, { kind: 'none' })
    expect(screen.queryByTestId('performance-headline')).not.toBeInTheDocument()
    expect(screen.getByTestId('play-again')).toHaveTextContent('Jugar de nuevo')
    expect(document.querySelectorAll('[data-primary]')).toHaveLength(1)
  })
})
