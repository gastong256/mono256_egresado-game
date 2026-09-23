// @vitest-environment jsdom
import { act, cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  RankingDeadlineNotice,
  rankingDeadlineMessage,
} from '@/components/competition/ranking-deadline-notice'

const start = Date.parse('2026-10-03T12:00:00Z')
beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(start)
})
afterEach(() => {
  cleanup()
  vi.useRealTimers()
})
const tick = (ms = 0) =>
  act(() => {
    vi.advanceTimersByTime(ms)
  })

describe('aviso de cierre en el ranking', () => {
  it.each([
    [7200, '¡Mejorá tu marca! Quedan menos de 3 horas.'],
    [7199, '¡Mejorá tu marca! Quedan menos de 2 horas.'],
    [3600, '¡Mejorá tu marca! Quedan menos de 2 horas.'],
    [3599, '¡Dale una más! Quedan menos de 60 minutos.'],
    [60, '¡Dale una más! Quedan menos de 2 minutos.'],
    [59, '¡Últimos segundos para mejorar tu marca!'],
    [1, '¡Últimos segundos para mejorar tu marca!'],
    [0, undefined],
    [-1, undefined],
    [Number.NaN, undefined],
  ])('usa un plazo verdadero para %s segundos', (seconds, expected) => {
    expect(rankingDeadlineMessage(seconds)).toBe(expected)
  })
  it('pasa de horas a minutos, a últimos segundos y desaparece al vencer', () => {
    const { container } = render(
      <RankingDeadlineNotice
        status="open"
        closesAt={new Date(start + 3600_000).toISOString()}
      />,
    )
    tick()
    expect(screen.getByTestId('ranking-deadline-notice')).toHaveTextContent(
      'menos de 2 horas',
    )
    tick(1000)
    expect(screen.getByTestId('ranking-deadline-notice')).toHaveTextContent(
      'menos de 60 minutos',
    )
    vi.setSystemTime(start + 3590_000)
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'))
    })
    expect(screen.getByTestId('ranking-deadline-notice')).toHaveTextContent(
      'Últimos segundos',
    )
    expect(container.querySelector('[aria-live]')).toBeNull()
    tick(10000)
    expect(
      screen.queryByTestId('ranking-deadline-notice'),
    ).not.toBeInTheDocument()
  })
  it.each(['upcoming', 'closed', 'not-configured'] as const)(
    'no invita a mejorar en estado %s',
    (status) => {
      render(
        <RankingDeadlineNotice
          status={status}
          closesAt={new Date(start + 3600_000).toISOString()}
        />,
      )
      tick()
      expect(
        screen.queryByTestId('ranking-deadline-notice'),
      ).not.toBeInTheDocument()
    },
  )
  it.each([undefined, 'inválida', new Date(start - 1).toISOString()])(
    'no inventa un plazo cuando falta o venció: %s',
    (closesAt) => {
      render(<RankingDeadlineNotice status="open" closesAt={closesAt} />)
      tick()
      expect(
        screen.queryByTestId('ranking-deadline-notice'),
      ).not.toBeInTheDocument()
    },
  )
  it('respeta un cierre o una extensión recibidos del servidor', () => {
    const closesAt = new Date(start + 120_000).toISOString()
    const { rerender } = render(
      <RankingDeadlineNotice status="open" closesAt={closesAt} />,
    )
    tick()
    rerender(<RankingDeadlineNotice status="closed" closesAt={closesAt} />)
    expect(
      screen.queryByTestId('ranking-deadline-notice'),
    ).not.toBeInTheDocument()
    rerender(
      <RankingDeadlineNotice
        status="open"
        closesAt={new Date(start + 7200_000).toISOString()}
      />,
    )
    tick()
    expect(screen.getByTestId('ranking-deadline-notice')).toHaveTextContent(
      'menos de 3 horas',
    )
  })
})
