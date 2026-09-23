// @vitest-environment jsdom
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'
import { createFullCareerRunDescriptor } from '@/content/full-career'
import { parseActionLog, type RunDescriptor } from '@/game'
import { PracticeRun } from '@/components/practice/practice-run'
import {
  PRACTICE_STORAGE_KEY,
  readPracticeCheckpoint,
  type PracticeCheckpoint,
} from '@/components/practice/storage'
import { playCareer } from '../helpers/play-career'

let descriptor: RunDescriptor
let completed: PracticeCheckpoint
beforeAll(() => {
  const built = createFullCareerRunDescriptor(`practice-v1-${'b'.repeat(48)}`, {
    runId: 'practice-v1-11111111-1111-4111-8111-111111111111',
  })
  if (!built.ok) throw new Error('invalid fixture')
  descriptor = built.value
  const played = playCareer(descriptor, 'optimal')
  const log = parseActionLog(played.log)
  if (!log.ok) throw new Error('invalid fixture log')
  completed = { state: played.state, log: log.value }
})
beforeEach(() => localStorage.clear())
afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

const result = (fairScore = 2345) => ({
  ok: true,
  json: async () => ({
    result: {
      kind: 'practice',
      runId: descriptor.runId,
      fairScore,
      graduated: true,
    },
  }),
})

describe('partida de práctica con controller y vistas reales', () => {
  it('guarda cada CONTINUE y conserva el descriptor emitido sin pedir otro al servidor', async () => {
    const fetch = vi.fn()
    vi.stubGlobal('fetch', fetch)
    render(
      <PracticeRun
        descriptor={descriptor}
        onInvalid={vi.fn()}
        onPlayAgain={vi.fn()}
        pending={false}
      />,
    )
    await waitFor(() => expect(readPracticeCheckpoint().kind).toBe('saved'))
    const before = readPracticeCheckpoint()
    if (before.kind !== 'saved') throw new Error('not saved')
    fireEvent.click(screen.getByTestId('continue'))
    const after = readPracticeCheckpoint()
    if (after.kind !== 'saved') throw new Error('not saved')
    expect(after.checkpoint.log.actions).toHaveLength(
      before.checkpoint.log.actions.length + 1,
    )
    expect(after.checkpoint.log.descriptor).toEqual(descriptor)
    expect(fetch).not.toHaveBeenCalled()
  })
  it('conserva el cierre ante caída de red, reintenta replay y muestra sólo el puntaje recibido', async () => {
    const fetch = vi
      .fn()
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValue(result())
    vi.stubGlobal('fetch', fetch)
    const onPlayAgain = vi.fn()
    const props = {
      descriptor,
      checkpoint: completed,
      onInvalid: vi.fn(),
      onPlayAgain,
      pending: false,
    }
    const view = render(<PracticeRun {...props} />)
    expect(
      await screen.findByRole('button', { name: 'Reintentar cálculo' }),
    ).toBeInTheDocument()
    expect(screen.queryByTestId('practice-score')).not.toBeInTheDocument()
    await waitFor(() => expect(readPracticeCheckpoint().kind).toBe('saved'))
    const saved = localStorage.getItem(PRACTICE_STORAGE_KEY)
    await act(async () =>
      fireEvent.click(
        screen.getByRole('button', { name: 'Reintentar cálculo' }),
      ),
    )
    expect(await screen.findByTestId('practice-score')).toHaveTextContent(
      '2.345',
    )
    expect(fetch).toHaveBeenLastCalledWith(
      '/api/practice/runs/verify',
      expect.objectContaining({ credentials: 'omit', method: 'POST' }),
    )
    expect(localStorage.getItem(PRACTICE_STORAGE_KEY)).toBe(saved)
    view.rerender(<PracticeRun {...props} pending />)
    fireEvent.click(screen.getByTestId('play-again'))
    expect(onPlayAgain).not.toHaveBeenCalled()
    view.rerender(<PracticeRun {...props} />)
    fireEvent.click(screen.getByTestId('play-again'))
    expect(onPlayAgain).toHaveBeenCalledOnce()
  })
  it('explica una versión incompatible sin adoptar ni sobrescribir el checkpoint', async () => {
    localStorage.setItem(PRACTICE_STORAGE_KEY, 'previous checkpoint')
    const onInvalid = vi.fn()
    render(
      <PracticeRun
        descriptor={{ ...descriptor, gameVersion: 'unknown' }}
        checkpoint={completed}
        onInvalid={onInvalid}
        onPlayAgain={vi.fn()}
        pending={false}
      />,
    )
    await waitFor(() =>
      expect(onInvalid).toHaveBeenCalledWith(
        expect.stringContaining('versión'),
      ),
    )
    expect(localStorage.getItem(PRACTICE_STORAGE_KEY)).toBe(
      'previous checkpoint',
    )
  })
  it('un rechazo del servidor no presenta score ni pierde el avance final', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: false,
        json: async () => ({
          error: { code: 'RATE_LIMITED', message: 'Esperá unos minutos.' },
        }),
      })),
    )
    render(
      <PracticeRun
        descriptor={descriptor}
        checkpoint={completed}
        onInvalid={vi.fn()}
        onPlayAgain={vi.fn()}
        pending={false}
      />,
    )
    expect(await screen.findByText('Esperá unos minutos.')).toBeInTheDocument()
    expect(screen.queryByTestId('practice-score')).not.toBeInTheDocument()
    await waitFor(() => expect(readPracticeCheckpoint().kind).toBe('saved'))
  })
})
