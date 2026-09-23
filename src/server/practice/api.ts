import 'server-only'

import { z } from 'zod'
import { MAX_ACTION_LOG_BYTES } from '@/server/game/submission-limits'
import { applicationLog } from '@/server/observability/events'
import {
  createPracticeRuntime,
  type PracticeRuntime,
  type PracticeOperation,
} from './runtime'
import { issuePracticeRun, verifyPracticeRun } from './service'

const submissionSchema = z.object({ actionLog: z.unknown() }).strict()
const messages = {
  INVALID_REQUEST: 'No pudimos leer la solicitud. Volvé a intentarlo.',
  TOO_LARGE: 'La partida enviada supera el tamaño permitido.',
  RATE_LIMITED:
    'Hay muchos pedidos de práctica desde esta red. Esperá unos minutos y volvé a intentar.',
  UNAVAILABLE:
    'La práctica no está disponible por un momento. Tu avance local se conserva.',
  INVALID_RUN: 'No pudimos comprobar esta práctica. Podés empezar una nueva.',
  INCOMPATIBLE_RUN:
    'Esta práctica no corresponde a la versión actual. Empezá una nueva.',
} as const
type ErrorCode = keyof typeof messages

function error(code: ErrorCode, status: number): Response {
  return Response.json(
    { error: { code, message: messages[code] } },
    {
      status,
      headers: {
        'cache-control': 'no-store',
        ...(status === 429 ? { 'retry-after': '300' } : {}),
      },
    },
  )
}

/** Bounded while streaming, including when Content-Length is absent or false. */
async function readBody(
  request: Request,
  maxBytes: number,
): Promise<unknown | Response> {
  const length = Number(request.headers.get('content-length') ?? 0)
  if (length > maxBytes) return error('TOO_LARGE', 413)
  const reader = request.body?.getReader()
  if (reader === undefined) return error('INVALID_REQUEST', 400)
  const chunks: Uint8Array[] = []
  let bytes = 0
  try {
    while (true) {
      const { value, done } = await reader.read()
      if (done) break
      bytes += value.byteLength
      if (bytes > maxBytes) {
        await reader.cancel()
        return error('TOO_LARGE', 413)
      }
      chunks.push(value)
    }
    const combined = new Uint8Array(bytes)
    let offset = 0
    for (const chunk of chunks) {
      combined.set(chunk, offset)
      offset += chunk.byteLength
    }
    return JSON.parse(
      new TextDecoder('utf-8', { fatal: true }).decode(combined),
    ) as unknown
  } catch {
    return error('INVALID_REQUEST', 400)
  } finally {
    reader.releaseLock()
  }
}

function sameOrigin(request: Request): boolean {
  if (request.headers.get('sec-fetch-site') === 'cross-site') return false
  const origin = request.headers.get('origin')
  if (origin === null) return true // No cookies are read; anonymous API clients are allowed.
  try {
    // Next may reconstruct request.url with its internal listening hostname.
    // Host and forwarded protocol describe the browser-facing trusted proxy.
    const source = new URL(origin)
    const target = new URL(request.url)
    const host = request.headers.get('host') ?? target.host
    const protocol = request.headers.get('x-forwarded-proto')
    return (
      source.host === host &&
      source.protocol === (protocol === null ? target.protocol : `${protocol}:`)
    )
  } catch {
    return false
  }
}

/** Injection is only a function argument in tests, never a URL or runtime switch. */
export function createPracticeHandlers(
  runtime: () => PracticeRuntime = createPracticeRuntime,
) {
  async function handle(
    request: Request,
    operation: PracticeOperation,
  ): Promise<Response> {
    const started = Date.now()
    const respond = (response: Response, code?: string) => {
      applicationLog({
        scope: 'practice',
        event: operation,
        outcome: response.ok
          ? 'ok'
          : response.status >= 500
            ? 'error'
            : 'rejected',
        ...(code === undefined ? {} : { code }),
        durationMs: Date.now() - started,
      })
      return response
    }
    try {
      if (
        !sameOrigin(request) ||
        new URL(request.url).search !== '' ||
        !request.headers.get('content-type')?.startsWith('application/json')
      ) {
        return respond(error('INVALID_REQUEST', 400), 'INVALID_REQUEST')
      }
      if (!(await runtime().allow(operation, request)))
        return respond(error('RATE_LIMITED', 429), 'RATE_LIMITED')
      const body = await readBody(
        request,
        operation === 'issue' ? 1024 : MAX_ACTION_LOG_BYTES,
      )
      if (body instanceof Response) return respond(body, 'INVALID_BODY')
      if (operation === 'issue') {
        if (!z.object({}).strict().safeParse(body).success)
          return respond(error('INVALID_REQUEST', 400), 'INVALID_REQUEST')
        return respond(
          Response.json(
            { descriptor: issuePracticeRun() },
            { headers: { 'cache-control': 'no-store' } },
          ),
        )
      }
      const parsed = submissionSchema.safeParse(body)
      if (!parsed.success)
        return respond(error('INVALID_REQUEST', 400), 'INVALID_REQUEST')
      const verified = verifyPracticeRun(parsed.data.actionLog)
      if (!verified.ok)
        return respond(
          error(
            verified.code,
            verified.code === 'INCOMPATIBLE_RUN' ? 409 : 400,
          ),
          verified.code,
        )
      return respond(
        Response.json(
          { result: verified.result },
          { headers: { 'cache-control': 'no-store' } },
        ),
      )
    } catch {
      return respond(error('UNAVAILABLE', 503), 'UNAVAILABLE')
    }
  }
  return {
    issue: (request: Request) => handle(request, 'issue'),
    verify: (request: Request) => handle(request, 'verify'),
  }
}

export const practiceHandlers = createPracticeHandlers()
