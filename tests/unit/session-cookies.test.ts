import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

interface RecordedCookie {
  readonly name: string
  readonly value: string
  readonly options: Record<string, unknown>
}

const written: RecordedCookie[] = []
const deleted: string[] = []
const jar = new Map<string, string>()

vi.mock('next/headers', () => ({
  cookies: () =>
    Promise.resolve({
      get: (name: string) => {
        const value = jar.get(name)
        return value === undefined ? undefined : { name, value }
      },
      set: (name: string, value: string, options: Record<string, unknown>) => {
        written.push({ name, value, options })
        jar.set(name, value)
      },
      delete: (name: string) => {
        deleted.push(name)
        jar.delete(name)
      },
    }),
  headers: () => Promise.resolve(new Headers()),
}))

const {
  clearOrganizerCookie,
  clearParticipantCookie,
  writeOrganizerCookie,
  writeParticipantCookie,
} = await import('@/server/competition/http')
const { ORGANIZER_SESSION_COOKIE, PARTICIPANT_SESSION_COOKIE } =
  await import('@/server/competition/tokens')

/**
 * Los atributos de las cookies de sesión, en modo producción.
 *
 * Una cookie de sesión mal configurada no rompe nada visible: la aplicación
 * funciona igual, y lo único que cambia es que el token viaja por HTTP o que
 * JavaScript puede leerlo. Por eso es exactamente el tipo de cosa que hay que
 * fijar en un test antes de congelar, y no revisar a ojo.
 *
 * `Secure` depende de `NODE_ENV`, así que los casos se corren con el entorno
 * simulado en los dos valores: en desarrollo la cookie tiene que poder viajar
 * por `http://localhost`, y en producción no.
 */

beforeEach(() => {
  written.length = 0
  deleted.length = 0
  jar.clear()
})

afterEach(() => {
  vi.unstubAllEnvs()
})

async function writeIn(
  nodeEnv: string,
  write: () => Promise<void>,
): Promise<RecordedCookie> {
  vi.stubEnv('NODE_ENV', nodeEnv)
  await write()
  const last = written.at(-1)
  if (last === undefined) throw new Error('no se escribió ninguna cookie')
  return last
}

const EXPIRES = '2026-11-02T15:00:00.000Z'

describe('cookie de participante', () => {
  it('es HttpOnly, SameSite=Lax y de alcance raíz', async () => {
    const cookie = await writeIn('production', () =>
      writeParticipantCookie('token-opaco', EXPIRES),
    )
    expect(cookie.name).toBe(PARTICIPANT_SESSION_COOKIE)
    expect(cookie.options['httpOnly']).toBe(true)
    // `lax` y no `strict`: con `strict`, quien llega desde el enlace que
    // compartió el organizador aparecería como desconocido en la primera
    // navegación. Contra el envío cruzado, `lax` ya no manda la cookie en un
    // POST de otro sitio, que es la protección que importa.
    expect(cookie.options['sameSite']).toBe('lax')
    expect(cookie.options['path']).toBe('/')
  })

  it('es Secure en producción', async () => {
    const cookie = await writeIn('production', () =>
      writeParticipantCookie('token-opaco', EXPIRES),
    )
    expect(cookie.options['secure']).toBe(true)
  })

  it('no es Secure en desarrollo, donde no hay https', async () => {
    const cookie = await writeIn('development', () =>
      writeParticipantCookie('token-opaco', EXPIRES),
    )
    expect(cookie.options['secure']).toBe(false)
  })

  it('caduca cuando caduca la sesión del servidor, no antes ni después', async () => {
    const cookie = await writeIn('production', () =>
      writeParticipantCookie('token-opaco', EXPIRES),
    )
    expect(cookie.options['expires']).toEqual(new Date(EXPIRES))
  })

  it('lleva el token y nada más: no hay datos dentro', async () => {
    const cookie = await writeIn('production', () =>
      writeParticipantCookie('token-opaco', EXPIRES),
    )
    expect(cookie.value).toBe('token-opaco')
    expect(JSON.stringify(cookie.options)).not.toContain('token-opaco')
  })

  it('se puede borrar', async () => {
    await writeParticipantCookie('token-opaco', EXPIRES)
    await clearParticipantCookie()
    expect(deleted).toContain(PARTICIPANT_SESSION_COOKIE)
  })
})

describe('cookie de organizador', () => {
  it('tiene los mismos atributos y un nombre propio', async () => {
    const cookie = await writeIn('production', () =>
      writeOrganizerCookie('token-organizador', EXPIRES),
    )
    expect(cookie.name).toBe(ORGANIZER_SESSION_COOKIE)
    expect(cookie.name).not.toBe(PARTICIPANT_SESSION_COOKIE)
    expect(cookie.options['httpOnly']).toBe(true)
    expect(cookie.options['secure']).toBe(true)
    expect(cookie.options['sameSite']).toBe('lax')
  })

  it('se puede revocar desde el navegador', async () => {
    await writeOrganizerCookie('token-organizador', EXPIRES)
    await clearOrganizerCookie()
    expect(deleted).toContain(ORGANIZER_SESSION_COOKIE)
  })
})

describe('la duración de cada sesión', () => {
  it('participante treinta días, organizador ocho horas', async () => {
    const { PARTICIPANT_SESSION_DAYS, ORGANIZER_SESSION_HOURS } =
      await import('@/server/competition/tokens')
    // La asimetría es la decisión: la sesión de participante es continuidad
    // entre partidas y sobrevive a la feria; la de organizador da acceso a
    // datos de menores y dura una jornada.
    expect(PARTICIPANT_SESSION_DAYS).toBe(30)
    expect(ORGANIZER_SESSION_HOURS).toBe(8)
  })
})

describe('el token en sí', () => {
  it('es opaco: no lleva el id de nadie adentro', async () => {
    const { createOpaqueToken, hashToken } =
      await import('@/server/competition/tokens')
    const token = createOpaqueToken()
    // 32 bytes en base64url.
    expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/u)
    expect(createOpaqueToken()).not.toBe(token)
    // Y lo que la base guarda es el digest, no el token.
    expect(hashToken(token)).toMatch(/^[0-9a-f]{64}$/u)
    expect(hashToken(token)).not.toContain(token)
  })
})
