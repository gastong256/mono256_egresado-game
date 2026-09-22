import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  competitionLog,
  FORBIDDEN_LOG_FIELDS,
} from '@/server/competition/logging'
import {
  COMPETITION_ERROR_CODES,
  competitionError,
  httpStatusFor,
  playerMessageFor,
} from '@/server/competition/errors'
import { CompetitionStorageError } from '@/server/persistence/competition/supabase-store'
import { currentRelease, releaseFingerprint } from '@/release'

/**
 * Lo que sale del servidor por las dos salidas que nadie mira: los logs y los
 * mensajes de error.
 *
 * Un log es el lugar donde el dato personal se filtra sin que nadie lo decida.
 * Nadie escribe `console.log(dni)`; sí escribe `console.log(submission)`. La
 * defensa del repositorio es de tipo —`CompetitionLogFields` es un conjunto
 * cerrado de nueve campos opacos— y lo que se comprueba acá es que la defensa
 * sigue en pie **en tiempo de ejecución**: qué se serializa de verdad.
 *
 * Un mensaje de error es la otra. Una excepción de Postgres lleva el host, el
 * nombre de la base y a veces la consulta; devolverla al navegador publicaría
 * las tres en el primer incidente, que es cuando más gente está mirando.
 */

let lines: string[] = []

beforeEach(() => {
  lines = []
  vi.spyOn(console, 'info').mockImplementation((line: unknown) => {
    lines.push(String(line))
  })
  vi.spyOn(console, 'error').mockImplementation((line: unknown) => {
    lines.push(String(line))
  })
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('el registro operativo', () => {
  it('escribe una línea JSON por evento', () => {
    competitionLog({ event: 'attempt.start', outcome: 'ok' })
    expect(lines).toHaveLength(1)
    const parsed = JSON.parse(lines[0] ?? '{}') as Record<string, unknown>
    expect(parsed['scope']).toBe('competition')
    expect(parsed['event']).toBe('attempt.start')
    expect(parsed['outcome']).toBe('ok')
  })

  it('lleva la identidad del release en cada línea', () => {
    // Durante un incidente, «esto pasó» sólo sirve junto con «bajo qué
    // versión». Reconstruir la segunda mitad correlacionando con un panel de
    // deploy es el trabajo que nadie quiere hacer a las once de la mañana.
    competitionLog({ event: 'attempt.submit', outcome: 'ok' })
    const parsed = JSON.parse(lines[0] ?? '{}') as Record<string, unknown>
    const release = currentRelease()
    expect(parsed['releaseId']).toBe(
      `${release.releaseId}@${release.releaseVersion}`,
    )
    expect(parsed['releaseFingerprint']).toBe(
      releaseFingerprint(release).slice(0, 12),
    )
  })

  it('manda los errores a `console.error` y el resto a `console.info`', () => {
    const error = vi.spyOn(console, 'error')
    const info = vi.spyOn(console, 'info')
    competitionLog({ event: 'competition.storage', outcome: 'error' })
    competitionLog({ event: 'attempt.start', outcome: 'ok' })
    expect(error).toHaveBeenCalledTimes(1)
    expect(info).toHaveBeenCalledTimes(1)
  })

  it('no tiene un campo donde poner un dato personal', () => {
    competitionLog({
      event: 'participant.register',
      outcome: 'ok',
      competitionId: 'c1',
      participantId: 'p1',
      attemptId: 'a1',
      requestId: 'r1',
      durationMs: 12,
      code: 'OK',
      detail: 'creado',
    })
    const parsed = JSON.parse(lines[0] ?? '{}') as Record<string, unknown>
    for (const forbidden of FORBIDDEN_LOG_FIELDS) {
      expect(Object.keys(parsed)).not.toContain(forbidden)
    }
  })

  it('un campo prohibido no se puede colar ni con un objeto armado a mano', () => {
    // Un DTO con propiedades extra puede satisfacer un tipo estructural.
    // El logger debe seleccionar sus campos también en runtime.
    competitionLog({
      event: 'participant.register',
      outcome: 'ok',
      ...({ dni: '40123456', fullName: 'Ana Prueba' } as unknown as Record<
        string,
        never
      >),
    })
    const line = lines[0] ?? ''
    expect(line).not.toContain('40123456')
    expect(line).not.toContain('Ana Prueba')
    for (const field of FORBIDDEN_LOG_FIELDS) {
      expect(Object.keys(JSON.parse(line) as object)).not.toContain(field)
    }
  })

  it('el detalle de un fallo de almacenamiento no lleva el mensaje del driver', () => {
    const failure = new CompetitionStorageError('insertAttempt', {
      code: '23505',
      message:
        'duplicate key value violates unique constraint on host db.abcdefghij.supabase.co',
    })
    competitionLog({
      event: 'competition.storage',
      outcome: 'error',
      detail: failure.name,
    })
    const line = lines[0] ?? ''
    expect(line).not.toContain('supabase.co')
    expect(line).not.toContain('duplicate key')
    expect(line).toContain('CompetitionStorageError')
  })
})

describe('el mensaje que ve un jugador', () => {
  it('existe para cada código y no contiene el código', () => {
    for (const code of COMPETITION_ERROR_CODES) {
      const message = playerMessageFor(code)
      expect(message.length).toBeGreaterThan(10)
      expect(message).not.toContain(code)
      expect(message).not.toContain('_')
    }
  })

  it('no distingue «ese documento es de otra persona» de «no existe»', () => {
    // El formulario no puede ser un oráculo sobre quién se anotó: las dos
    // explicaciones posibles —un tipeo y un documento ajeno— se ven idénticas
    // desde el servidor, y decir cuál es contaría algo que nadie pidió.
    expect(playerMessageFor('IDENTITY_MISMATCH')).not.toMatch(
      /otra persona|ya registrad|existe/iu,
    )
  })

  it('no nombra una tabla, un host ni una tecnología', () => {
    for (const code of COMPETITION_ERROR_CODES) {
      const message = playerMessageFor(code).toLowerCase()
      for (const leak of [
        'postgres',
        'supabase',
        'sql',
        'null',
        'undefined',
        'stack',
        'http',
      ]) {
        expect(message).not.toContain(leak)
      }
    }
  })

  it('el detalle interno nunca se le muestra al jugador', () => {
    const error = competitionError(
      'STORAGE_UNAVAILABLE',
      'connect ECONNREFUSED 127.0.0.1:54322',
    )
    expect(playerMessageFor(error.code)).not.toContain('ECONNREFUSED')
    expect(playerMessageFor(error.code)).not.toContain('54322')
  })

  it('cada código tiene un status HTTP en su familia correcta', () => {
    for (const code of COMPETITION_ERROR_CODES) {
      const status = httpStatusFor(code)
      expect(status).toBeGreaterThanOrEqual(400)
      expect(status).toBeLessThan(600)
    }
    expect(httpStatusFor('RATE_LIMITED')).toBe(429)
    expect(httpStatusFor('STORAGE_UNAVAILABLE')).toBe(503)
    expect(httpStatusFor('ORGANIZER_AUTH_REQUIRED')).toBe(401)
  })
})

describe('el error de almacenamiento', () => {
  it('no arrastra el mensaje del driver a su propio mensaje', () => {
    const failure = new CompetitionStorageError('finalizeAttempt', {
      code: '42501',
      message: 'permission denied for table attempts on db.internal.host',
    })
    expect(failure.message).toContain('finalizeAttempt')
    expect(failure.message).toContain('42501')
    expect(failure.message).not.toContain('db.internal.host')
    expect(failure.message).not.toContain('permission denied')
  })

  it('sin código, lo dice en vez de inventar uno', () => {
    const failure = new CompetitionStorageError('listAttempts', {})
    expect(failure.message).toContain('sin código')
  })
})
