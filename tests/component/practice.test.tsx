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
import { parseActionLog, serializeSnapshot, type RunDescriptor } from '@/game'
import { PracticeExperience } from '@/components/practice/practice-experience'
import {
  PRACTICE_STORAGE_KEY,
  readPracticeCheckpoint,
  savePracticeCheckpoint,
} from '@/components/practice/storage'
import { playCareer } from '../helpers/play-career'

vi.mock('next/dynamic', () => ({
  default: () =>
    function LoadedPractice() {
      return <p>Partida cargada</p>
    },
}))

let descriptor: RunDescriptor
let played: ReturnType<typeof playCareer>
beforeAll(() => {
  const built = createFullCareerRunDescriptor(`practice-v1-${'a'.repeat(48)}`, {
    runId: 'practice-v1-00000000-0000-4000-8000-000000000000',
  })
  if (!built.ok) throw new Error('invalid fixture')
  descriptor = built.value
  played = playCareer(descriptor, 'optimal', 3)
})
beforeEach(() => {
  localStorage.clear()
})
afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('checkpoint privado de práctica', () => {
  it('guarda/reanuda tres desafíos con descriptor y log sin tocar claves competitivas', () => {
    localStorage.setItem('egresado.competition.v1.official', 'unchanged')
    const log = parseActionLog(played.log)
    if (!log.ok) throw new Error('invalid log')
    expect(savePracticeCheckpoint(played.state, log.value)).toBe(true)
    const loaded = readPracticeCheckpoint()
    expect(loaded.kind).toBe('saved')
    if (loaded.kind !== 'saved') throw new Error('not saved')
    expect(serializeSnapshot(loaded.checkpoint.state)).toEqual(
      serializeSnapshot(played.state),
    )
    expect(loaded.checkpoint.log).toEqual(log.value)
    expect(localStorage.getItem('egresado.competition.v1.official')).toBe(
      'unchanged',
    )
  })
  it.each([
    'broken',
    '{}',
    JSON.stringify({ version: 99, log: {}, snapshot: {} }),
  ])('tolera checkpoint corrupto/incompatible: %s', (raw) => {
    localStorage.setItem(PRACTICE_STORAGE_KEY, raw)
    expect(readPracticeCheckpoint()).toEqual({ kind: 'invalid' })
  })
  it('sin storage sigue siendo posible jugar, con aviso de pérdida al recargar', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    render(<PracticeExperience />)
    expect(
      await screen.findByText(/este navegador bloquea el almacenamiento/u),
    ).toBeInTheDocument()
    expect(screen.getByTestId('practice-start')).toBeEnabled()
  })
  it('se niega a guardar un estado Fair en el namespace de práctica', () => {
    const log = parseActionLog(played.log)
    if (!log.ok) throw new Error('invalid log')
    expect(
      savePracticeCheckpoint(
        { ...played.state, descriptor: { ...descriptor, mode: 'fair' } },
        log.value,
      ),
    ).toBe(false)
    expect(localStorage.getItem(PRACTICE_STORAGE_KEY)).toBeNull()
  })
  it('devuelve fallo de guardado sin lanzar si localStorage no permite escribir', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota')
    })
    const log = parseActionLog(played.log)
    if (!log.ok) throw new Error('invalid log')
    expect(savePracticeCheckpoint(played.state, log.value)).toBe(false)
  })
})

describe('entrada a práctica', () => {
  it('explica el modo, no pide PII y emite sin credenciales ni overrides', async () => {
    const fetch = vi.fn(async () => ({
      ok: true,
      json: async () => ({ descriptor }),
    }))
    vi.stubGlobal('fetch', fetch)
    render(<PracticeExperience />)
    expect(screen.getByText('Modo práctica')).toBeInTheDocument()
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    await waitFor(() =>
      expect(screen.getByTestId('practice-start')).toBeEnabled(),
    )
    await act(async () => {
      fireEvent.click(screen.getByTestId('practice-start'))
    })
    expect(fetch).toHaveBeenCalledWith(
      '/api/practice/runs',
      expect.objectContaining({
        method: 'POST',
        credentials: 'omit',
        body: '{}',
      }),
    )
    expect(screen.getByText('Partida cargada')).toBeInTheDocument()
  })
  it('continuar no emite otra run y empezar otra pide confirmación', async () => {
    localStorage.setItem(
      PRACTICE_STORAGE_KEY,
      JSON.stringify({
        version: 1,
        log: played.log,
        snapshot: serializeSnapshot(played.state),
      }),
    )
    const fetch = vi.fn()
    vi.stubGlobal('fetch', fetch)
    render(<PracticeExperience />)
    await screen.findByTestId('practice-resume')
    fireEvent.click(
      screen.getByRole('button', { name: 'Empezar otra práctica' }),
    )
    expect(screen.getByText(/reemplazará el avance/u)).toBeInTheDocument()
    fireEvent.click(
      screen.getByRole('button', { name: 'Conservar mi práctica' }),
    )
    fireEvent.click(screen.getByTestId('practice-resume'))
    expect(fetch).not.toHaveBeenCalled()
    expect(screen.getByText('Partida cargada')).toBeInTheDocument()
  })
  it('un error al emitir otra práctica conserva el avance anterior', async () => {
    const saved = JSON.stringify({
      version: 1,
      log: played.log,
      snapshot: serializeSnapshot(played.state),
    })
    localStorage.setItem(PRACTICE_STORAGE_KEY, saved)
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('offline')
      }),
    )
    render(<PracticeExperience />)
    await screen.findByTestId('practice-resume')
    fireEvent.click(
      screen.getByRole('button', { name: 'Empezar otra práctica' }),
    )
    await act(async () => {
      fireEvent.click(
        screen.getByRole('button', { name: 'Empezar otra práctica' }),
      )
    })
    expect(
      screen.getByText(/Tu práctica anterior se conserva/u),
    ).toBeInTheDocument()
    expect(localStorage.getItem(PRACTICE_STORAGE_KEY)).toBe(saved)
  })
})
