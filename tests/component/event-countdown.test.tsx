// @vitest-environment jsdom
import { act, fireEvent, render, screen, cleanup } from '@testing-library/react'
import { renderToString } from 'react-dom/server'
import { hydrateRoot } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { EventCountdown } from '@/components/competition/event-countdown'
import type { PublicCompetitionSummary } from '@/lib/competition'

const start = Date.parse('2026-10-03T12:00:00Z')
const competition: PublicCompetitionSummary = {
  name: 'Edición de prueba',
  status: 'upcoming',
  opensAt: '2026-10-04T14:03:04Z',
  closesAt: '2026-10-05T15:04:05Z',
}
const onElapsed = vi.fn()

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(start)
  onElapsed.mockReset()
})
afterEach(() => {
  cleanup()
  vi.useRealTimers()
})
const tick = (ms = 0) => {
  act(() => {
    vi.advanceTimersByTime(ms)
  })
}

describe('countdown del evento', () => {
  it('cuenta hacia opensAt, con días, horas, minutos y segundos', () => {
    render(<EventCountdown competition={competition} onElapsed={onElapsed} />)
    tick()
    expect(screen.getByText('Empieza en')).toBeInTheDocument()
    expect(screen.getByTestId('countdown-digits')).toHaveTextContent(
      '01Días02Horas03Min04Seg',
    )
    tick(1000)
    expect(screen.getByTestId('countdown-digits')).toHaveTextContent(
      '01Días02Horas03Min03Seg',
    )
  })
  it('OPEN cuenta hacia closesAt', () => {
    render(
      <EventCountdown
        competition={{ ...competition, status: 'open' }}
        onElapsed={onElapsed}
      />,
    )
    tick()
    expect(screen.getByText('Cierra en')).toBeInTheDocument()
    expect(screen.getByTestId('countdown-digits')).toHaveTextContent(
      '02Días03Horas04Min05Seg',
    )
  })
  it.each(['closed', 'not-configured'] as const)(
    '%s no monta reloj',
    (status) => {
      render(
        <EventCountdown
          competition={{ ...competition, status }}
          onElapsed={onElapsed}
        />,
      )
      tick(5000)
      expect(screen.queryByTestId('event-countdown')).not.toBeInTheDocument()
      expect(onElapsed).not.toHaveBeenCalled()
    },
  )
  it.each([undefined, 'fecha inválida'])(
    'tolera fecha ausente/inválida: %s',
    (opensAt) => {
      render(
        <EventCountdown
          competition={{ ...competition, opensAt }}
          onElapsed={onElapsed}
        />,
      )
      expect(screen.queryByTestId('event-countdown')).not.toBeInTheDocument()
    },
  )
  it('al llegar al horario consulta una vez; no inventa una apertura', () => {
    render(
      <EventCountdown
        competition={{
          ...competition,
          opensAt: new Date(start + 2000).toISOString(),
        }}
        onElapsed={onElapsed}
      />,
    )
    tick(2000)
    expect(onElapsed).toHaveBeenCalledOnce()
    expect(screen.queryByTestId('countdown-digits')).not.toBeInTheDocument()
    expect(screen.getByTestId('countdown-elapsed')).toHaveTextContent(
      'Esperando confirmación',
    )
    tick(10000)
    expect(onElapsed).toHaveBeenCalledOnce()
  })
  it('fecha ya vencida no queda en cero permanente', () => {
    render(
      <EventCountdown
        competition={{
          ...competition,
          opensAt: new Date(start - 1000).toISOString(),
        }}
        onElapsed={onElapsed}
      />,
    )
    tick()
    expect(screen.queryByTestId('countdown-digits')).not.toBeInTheDocument()
    expect(onElapsed).toHaveBeenCalledOnce()
  })
  it('recalcula desde el instante absoluto al volver de una pestaña suspendida', () => {
    render(<EventCountdown competition={competition} onElapsed={onElapsed} />)
    tick()
    vi.setSystemTime(start + 60_000)
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'))
    })
    expect(screen.getByTestId('countdown-digits')).toHaveTextContent(
      '01Días02Horas02Min04Seg',
    )
  })
  it('permite ocultar el contador y al volver muestra el tiempo actual', () => {
    render(<EventCountdown competition={competition} onElapsed={onElapsed} />)
    tick()
    fireEvent.click(screen.getByRole('button', { name: 'Ocultar contador' }))
    expect(screen.queryByTestId('countdown-digits')).not.toBeInTheDocument()
    expect(screen.getByText(/hora argentina/u)).toBeInTheDocument()
    tick(60000)
    fireEvent.click(screen.getByRole('button', { name: 'Mostrar contador' }))
    tick()
    expect(screen.getByTestId('countdown-digits')).toHaveTextContent(
      '01Días02Horas02Min04Seg',
    )
  })
  it('conserva fecha/zona accesibles y no anuncia cada segundo', () => {
    const { container } = render(
      <EventCountdown competition={competition} onElapsed={onElapsed} />,
    )
    tick()
    expect(screen.getByTestId('countdown-digits')).toHaveAttribute(
      'aria-hidden',
      'true',
    )
    expect(container.querySelector('[aria-live]')).toBeNull()
    expect(container.querySelector('time')).toHaveAttribute(
      'datetime',
      competition.opensAt,
    )
    expect(container.querySelector('time')).toHaveTextContent('11:03')
    expect(screen.getByText(/UTC−3/u)).toBeInTheDocument()
  })
  it('actualiza el objetivo si cambia la ventana o el estado', () => {
    const { rerender } = render(
      <EventCountdown
        competition={{ ...competition, opensAt: new Date(start).toISOString() }}
        onElapsed={onElapsed}
      />,
    )
    tick()
    expect(onElapsed).toHaveBeenCalledOnce()
    rerender(
      <EventCountdown
        competition={{
          ...competition,
          status: 'open',
          closesAt: new Date(start + 2000).toISOString(),
        }}
        onElapsed={onElapsed}
      />,
    )
    tick(2000)
    expect(onElapsed).toHaveBeenCalledTimes(2)
    rerender(
      <EventCountdown
        competition={{ ...competition, status: 'closed' }}
        onElapsed={onElapsed}
      />,
    )
    expect(screen.queryByTestId('event-countdown')).not.toBeInTheDocument()
  })
  it('hidrata sin diferencias aunque el reloj cliente esté adelantado', async () => {
    const element = (
      <EventCountdown competition={competition} onElapsed={onElapsed} />
    )
    const host = document.createElement('div')
    host.innerHTML = renderToString(element)
    document.body.append(host)
    vi.setSystemTime(start + 86400000)
    const recoverable = vi.fn()
    let root: ReturnType<typeof hydrateRoot>
    await act(async () => {
      root = hydrateRoot(host, element, { onRecoverableError: recoverable })
    })
    expect(recoverable).not.toHaveBeenCalled()
    act(() => {
      root.unmount()
    })
    host.remove()
  })
})
