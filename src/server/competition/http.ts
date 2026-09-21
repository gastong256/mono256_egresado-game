import 'server-only'

import { cookies, headers } from 'next/headers'

import { getServerEnvironment } from '@/config/env.server'
import {
  competitionError,
  httpStatusFor,
  playerMessageFor,
  type CompetitionError,
} from './errors'
import { clientFingerprint } from './rate-limit'
import { ORGANIZER_SESSION_COOKIE, PARTICIPANT_SESSION_COOKIE } from './tokens'

/**
 * La frontera HTTP de la competencia.
 *
 * Las rutas quedan finas a propósito: parsean, llaman a un servicio y traducen
 * el resultado. Todo lo que se repite —cookies, origen, respuesta de error,
 * etiqueta de cliente para el límite de tasa— vive acá una sola vez, porque es
 * exactamente el tipo de cosa que se implementa distinto en la quinta ruta.
 */

export interface ErrorBody {
  readonly error: {
    readonly code: string
    /** Lo que se le muestra al jugador. Nunca el detalle interno. */
    readonly message: string
  }
}

export function errorResponse(error: CompetitionError): Response {
  const body: ErrorBody = {
    error: { code: error.code, message: playerMessageFor(error.code) },
  }
  return Response.json(body, {
    status: httpStatusFor(error.code),
    headers: { 'cache-control': 'no-store' },
  })
}

export function jsonResponse(body: unknown, status = 200): Response {
  return Response.json(body, {
    status,
    // Todo lo de competencia es privado o vivo. Una respuesta cacheada por un
    // intermediario compartido podría mostrarle a un jugador el «vos» de otro,
    // que es la peor forma posible de filtrar una sesión.
    headers: { 'cache-control': 'no-store' },
  })
}

function isProduction(): boolean {
  return getServerEnvironment().NODE_ENV === 'production'
}

export async function readParticipantToken(): Promise<string | undefined> {
  const store = await cookies()
  return store.get(PARTICIPANT_SESSION_COOKIE)?.value
}

export async function readOrganizerToken(): Promise<string | undefined> {
  const store = await cookies()
  return store.get(ORGANIZER_SESSION_COOKIE)?.value
}

async function writeSessionCookie(
  name: string,
  token: string,
  expiresAt: string,
): Promise<void> {
  const store = await cookies()
  store.set(name, token, {
    httpOnly: true,
    secure: isProduction(),
    // `lax` y no `strict`: con `strict` alguien que llega desde el enlace que
    // compartió el organizador aparecería como desconocido en la primera
    // navegación. Contra el envío desde otro sitio, `lax` ya no manda la
    // cookie en un POST cruzado, que es la protección que importa acá.
    sameSite: 'lax',
    path: '/',
    expires: new Date(expiresAt),
  })
}

export async function writeParticipantCookie(
  token: string,
  expiresAt: string,
): Promise<void> {
  await writeSessionCookie(PARTICIPANT_SESSION_COOKIE, token, expiresAt)
}

export async function writeOrganizerCookie(
  token: string,
  expiresAt: string,
): Promise<void> {
  await writeSessionCookie(ORGANIZER_SESSION_COOKIE, token, expiresAt)
}

export async function clearParticipantCookie(): Promise<void> {
  const store = await cookies()
  store.delete(PARTICIPANT_SESSION_COOKIE)
}

export async function clearOrganizerCookie(): Promise<void> {
  const store = await cookies()
  store.delete(ORGANIZER_SESSION_COOKIE)
}

/**
 * Comprueba que un pedido que cambia estado venga de esta misma aplicación.
 *
 * La cookie `SameSite=lax` ya impide que un formulario de otro sitio la envíe
 * en un POST. Esto es la segunda línea, por si un navegador viejo o una
 * extensión no respetan esa regla: se compara el `Origin` con el host que
 * atendió el pedido. Un pedido sin `Origin` —algunos clientes no lo mandan—
 * se acepta sólo si tampoco trae cookie de sesión, así que nunca actúa en
 * nombre de nadie.
 */
export async function assertSameOrigin(
  request: Request,
): Promise<CompetitionError | undefined> {
  const origin = request.headers.get('origin')
  if (origin === null) {
    const store = await cookies()
    const authenticated =
      store.get(PARTICIPANT_SESSION_COOKIE) !== undefined ||
      store.get(ORGANIZER_SESSION_COOKIE) !== undefined
    return authenticated
      ? competitionError('INVALID_REQUEST', 'origin ausente')
      : undefined
  }

  const headerList = await headers()
  const host = headerList.get('host')
  let originHost: string
  try {
    originHost = new URL(origin).host
  } catch {
    return competitionError('INVALID_REQUEST', 'origin inválido')
  }

  if (host !== null && originHost === host) return undefined

  const configured = new URL(getServerEnvironment().NEXT_PUBLIC_APP_URL).host
  return originHost === configured
    ? undefined
    : competitionError('INVALID_REQUEST', 'origin cruzado')
}

/**
 * Etiqueta de cliente para el límite de tasa.
 *
 * La dirección no se guarda: se deriva con el secreto de la competencia y se
 * usa sólo como clave de contador. Detrás de un proxy se lee el primer salto de
 * `x-forwarded-for`, y cuando no hay nada se cae a una etiqueta compartida, que
 * limita de más antes que de menos.
 */
export async function rateLimitSubject(secret: string): Promise<string> {
  const headerList = await headers()
  const forwarded = headerList.get('x-forwarded-for')
  const address =
    forwarded?.split(',')[0]?.trim() ??
    headerList.get('x-real-ip') ??
    'desconocido'
  return clientFingerprint(secret, address)
}

export async function requestIdentifier(): Promise<string | undefined> {
  const headerList = await headers()
  return headerList.get('x-request-id') ?? undefined
}

/** Lee un cuerpo JSON acotado. Un payload enorme no llega al parser. */
export async function readJsonBody(
  request: Request,
  maxBytes: number,
): Promise<
  | { readonly ok: true; readonly value: unknown }
  | { readonly ok: false; readonly error: CompetitionError }
> {
  const declared = request.headers.get('content-length')
  if (declared !== null && Number(declared) > maxBytes) {
    return {
      ok: false,
      error: competitionError('INVALID_REQUEST', 'cuerpo demasiado grande'),
    }
  }

  const text = await request.text()
  if (text.length > maxBytes) {
    return {
      ok: false,
      error: competitionError('INVALID_REQUEST', 'cuerpo demasiado grande'),
    }
  }

  try {
    return { ok: true, value: JSON.parse(text) }
  } catch {
    return {
      ok: false,
      error: competitionError('INVALID_REQUEST', 'json inválido'),
    }
  }
}
