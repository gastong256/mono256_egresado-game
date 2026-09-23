// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
import { Leaderboard } from '@/components/competition/leaderboard'
import { RankingRunMetrics } from '@/components/competition/ranking-run-details'
import { publicRunSummary } from '../helpers/ranking-summary'

afterEach(cleanup)
describe('ranking run presentation', () => {
  it('separates official score, career metrics and achievements, with keyboard disclosure', async () => {
    const user = userEvent.setup()
    render(
      <Leaderboard
        entries={[
          {
            rank: 48,
            nickname: 'Sofi',
            isYou: true,
            fairScore: 9800,
            sharedCount: 5,
            gapBefore: 40,
            summary: publicRunSummary,
          },
        ]}
        you={undefined}
        total={80}
      />,
    )
    expect(screen.getByText('9.800')).toBeVisible()
    expect(screen.getByText('8,7')).toBeVisible()
    expect(screen.getByText('+1.250')).toBeVisible()
    expect(screen.getByText('Compartido con 5 más')).toBeVisible()
    expect(
      screen.getByText(/40 participantes entre estos puestos/u),
    ).toBeVisible()
    expect(screen.getByText('(vos)')).toBeVisible()
    await user.tab()
    expect(document.activeElement?.tagName).toBe('SUMMARY')
    // jsdom does not implement native summary keyboard activation; browser E2E covers Enter.
    await user.click(document.activeElement as HTMLElement)
    expect(screen.getByText('Aportes al puntaje')).toBeVisible()
    expect(screen.getByText('Todo Óptimo en 2.º.')).toBeVisible()
  })
  it('omits missing dimensions and keeps legitimate zeros and negative Aura', () => {
    render(
      <RankingRunMetrics
        summary={{
          ...publicRunSummary,
          career: { promedio: null, equipo: 0, aura: -50 },
        }}
      />,
    )
    expect(screen.queryByText('Promedio')).not.toBeInTheDocument()
    expect(screen.getByText('0')).toBeVisible()
    expect(screen.getByText('-50')).toBeVisible()
  })
})
