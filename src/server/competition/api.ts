import 'server-only'

import { abandonActiveAttempt, startAttempt, submitAttempt } from './attempts'
import { CompetitionConfigurationError } from './config'
import { competitionError, type CompetitionError } from './errors'
import { exportFilename, exportParticipantsCsv } from './export'
import {
  assertSameOrigin,
  clearOrganizerCookie,
  clearParticipantCookie,
  errorResponse,
  jsonResponse,
  rateLimitSubject,
  readJsonBody,
  readOrganizerToken,
  readParticipantToken,
  requestIdentifier,
  writeOrganizerCookie,
  writeParticipantCookie,
} from './http'
import { competitionLog } from './logging'
import {
  authenticateOrganizer,
  correctParticipant,
  endOrganizerSession,
  loadOrganizerDashboard,
  resolveOrganizerSession,
  setAttemptValidity,
  setCompetitionStatus,
  setParticipantEligibility,
  verifyWinnerIdentity,
} from './organizer'
import {
  forgetParticipantSession,
  identifyParticipant,
  resolveParticipantSession,
} from './participants'
import { loadPublicState, unconfiguredState } from './ranking'
import { purgeCompetition } from './retention'
import {
  identitySubmissionSchema,
  MAX_ACTION_LOG_BYTES,
  organizerActionSchema,
  organizerLoginSchema,
  submissionSchema,
} from './schemas'
import {
  createCompetitionContext,
  loadActiveCompetition,
  type CompetitionContext,
} from './runtime'

/**
 * Los manejadores de la API de competencia.
 *
 * Viven acá y no en los archivos de ruta por dos razones. Una ruta de Next es
 * un punto de entrada del framework y probarla exige levantar el framework;
 * estas funciones reciben un `Request` y devuelven un `Response`, así que la
 * suite las ejercita directamente, incluida la matriz de ataque. La otra es que
 * el árbol de decisiones —origen, límite de tasa, sesión, competencia abierta—
 * es el mismo en casi todas, y repetirlo ocho veces es cómo se termina con una
 * ruta que se olvidó de mirar la sesión.
 */

const SESSION_REQUIRED = competitionError('PARTICIPANT_SESSION_REQUIRED')

interface ResolvedRequest {
  readonly context: CompetitionContext
  readonly competition: Awaited<ReturnType<typeof loadActiveCompetition>>
}

async function resolveContext(): Promise<
  | { readonly ok: true; readonly value: ResolvedRequest }
  | { readonly ok: false; readonly error: CompetitionError }
> {
  let context: CompetitionContext | undefined
  try {
    context = createCompetitionContext()
  } catch (error) {
    if (error instanceof CompetitionConfigurationError) {
      // Un despliegue que declara competencia sin declarar responsable de los
      // datos no puede atender: no hay forma honesta de mostrar el aviso.
      competitionLog({
        event: 'competition.misconfigured',
        outcome: 'error',
        detail: error.missing.join(','),
      })
      return {
        ok: false,
        error: competitionError('COMPETITION_NOT_CONFIGURED'),
      }
    }
    throw error
  }

  if (context === undefined) {
    return { ok: false, error: competitionError('COMPETITION_NOT_CONFIGURED') }
  }

  try {
    const competition = await loadActiveCompetition(context)
    return { ok: true, value: { context, competition } }
  } catch (error) {
    competitionLog({
      event: 'competition.storage',
      outcome: 'error',
      detail: error instanceof Error ? error.name : 'desconocido',
    })
    return { ok: false, error: competitionError('STORAGE_UNAVAILABLE') }
  }
}

async function currentParticipant(context: CompetitionContext) {
  return resolveParticipantSession(context, await readParticipantToken())
}

/* --------------------------------------------------------------------------
 * Estado público
 * ----------------------------------------------------------------------- */

export async function handlePublicState(): Promise<Response> {
  const resolved = await resolveContext()
  if (!resolved.ok) {
    return resolved.error.code === 'COMPETITION_NOT_CONFIGURED'
      ? jsonResponse(unconfiguredState())
      : errorResponse(resolved.error)
  }

  const { context, competition } = resolved.value
  if (competition === undefined) return jsonResponse(unconfiguredState())

  const session = await currentParticipant(context)
  return jsonResponse(
    await loadPublicState(context, competition, session?.participant),
  )
}

/** La misma lectura, para el Server Component de `/`. */
export async function readPublicState() {
  const resolved = await resolveContext()
  if (!resolved.ok) return unconfiguredState()
  const { context, competition } = resolved.value
  if (competition === undefined) return unconfiguredState()
  const session = await currentParticipant(context)
  return loadPublicState(context, competition, session?.participant)
}

/* --------------------------------------------------------------------------
 * Identidad
 * ----------------------------------------------------------------------- */

export async function handleIdentify(request: Request): Promise<Response> {
  const origin = await assertSameOrigin(request)
  if (origin !== undefined) return errorResponse(origin)

  const resolved = await resolveContext()
  if (!resolved.ok) return errorResponse(resolved.error)
  const { context, competition } = resolved.value
  if (competition === undefined) {
    return errorResponse(competitionError('COMPETITION_NOT_CONFIGURED'))
  }

  const subject = await rateLimitSubject(context.config.identitySecret)
  if (!(await context.rateLimiter.allow('register', subject))) {
    competitionLog({
      event: 'participant.identify',
      outcome: 'rejected',
      code: 'RATE_LIMITED',
    })
    return errorResponse(competitionError('RATE_LIMITED'))
  }

  const body = await readJsonBody(request, 8 * 1024)
  if (!body.ok) return errorResponse(body.error)

  const parsed = identitySubmissionSchema.safeParse(body.value)
  if (!parsed.success) {
    return errorResponse(
      competitionError(
        'INVALID_REQUEST',
        parsed.error.issues[0]?.path.join('.') ?? 'cuerpo',
      ),
    )
  }

  const result = await identifyParticipant(
    {
      ...context,
      identitySecret: context.config.identitySecret,
      schoolYears: context.config.schoolYears,
      schoolDivisions: context.config.schoolDivisions,
    },
    competition,
    {
      nickname: parsed.data.nickname,
      fullName: parsed.data.fullName,
      dni: parsed.data.dni,
      schoolYear: parsed.data.schoolYear,
      ...(parsed.data.division === undefined
        ? {}
        : { division: parsed.data.division }),
      privacyNoticeVersion: parsed.data.privacyNoticeVersion,
    },
  )

  if (!result.ok) {
    competitionLog({
      event: 'participant.identify',
      outcome: 'rejected',
      code: result.error.code,
      competitionId: competition.id,
    })
    return errorResponse(result.error)
  }

  await writeParticipantCookie(
    result.value.sessionToken,
    result.value.expiresAt,
  )
  competitionLog({
    event: 'participant.identify',
    outcome: 'ok',
    code: result.value.created ? 'created' : 'restored',
    competitionId: competition.id,
    participantId: result.value.participant.id,
    ...(await requestIdentifier().then((id) =>
      id === undefined ? {} : { requestId: id },
    )),
  })

  return jsonResponse({
    created: result.value.created,
    you: {
      nickname: result.value.participant.publicNickname,
      bestFairScore: undefined,
      bestPrestigeScore: undefined,
      rank: undefined,
      attempts: 0,
      activeAttempt: undefined,
    },
  })
}

export async function handleForgetParticipant(
  request: Request,
): Promise<Response> {
  const origin = await assertSameOrigin(request)
  if (origin !== undefined) return errorResponse(origin)

  const resolved = await resolveContext()
  if (resolved.ok) {
    await forgetParticipantSession(
      resolved.value.context,
      await readParticipantToken(),
    )
  }
  await clearParticipantCookie()
  return jsonResponse({ forgotten: true })
}

/* --------------------------------------------------------------------------
 * Intentos
 * ----------------------------------------------------------------------- */

export async function handleStartAttempt(request: Request): Promise<Response> {
  const origin = await assertSameOrigin(request)
  if (origin !== undefined) return errorResponse(origin)

  const resolved = await resolveContext()
  if (!resolved.ok) return errorResponse(resolved.error)
  const { context, competition } = resolved.value
  if (competition === undefined) {
    return errorResponse(competitionError('COMPETITION_NOT_CONFIGURED'))
  }

  const session = await currentParticipant(context)
  if (session === undefined) return errorResponse(SESSION_REQUIRED)

  if (
    !(await context.rateLimiter.allow('attemptStart', session.participant.id))
  ) {
    return errorResponse(competitionError('RATE_LIMITED'))
  }

  const result = await startAttempt(context, competition, session.participant)
  if (!result.ok) {
    competitionLog({
      event: 'attempt.start',
      outcome: 'rejected',
      code: result.error.code,
      competitionId: competition.id,
      participantId: session.participant.id,
    })
    return errorResponse(result.error)
  }

  competitionLog({
    event: 'attempt.start',
    outcome: 'ok',
    code: result.value.resumed ? 'resumed' : 'issued',
    competitionId: competition.id,
    participantId: session.participant.id,
    attemptId: result.value.attemptId,
  })

  return jsonResponse({
    attemptId: result.value.attemptId,
    attemptNumber: result.value.attemptNumber,
    resumed: result.value.resumed,
    // El descriptor incluye la seed. No es un secreto: la autoridad no está en
    // esconderla sino en que el servidor la emitió y la tiene registrada, y en
    // que sin ella el navegador no podría componer el mismo plan.
    descriptor: result.value.descriptor,
  })
}

export async function handleSubmitAttempt(
  request: Request,
  attemptId: string,
): Promise<Response> {
  const started = Date.now()
  const origin = await assertSameOrigin(request)
  if (origin !== undefined) return errorResponse(origin)

  const resolved = await resolveContext()
  if (!resolved.ok) return errorResponse(resolved.error)
  const { context, competition } = resolved.value
  if (competition === undefined) {
    return errorResponse(competitionError('COMPETITION_NOT_CONFIGURED'))
  }

  const session = await currentParticipant(context)
  if (session === undefined) return errorResponse(SESSION_REQUIRED)

  if (
    !(await context.rateLimiter.allow('attemptSubmit', session.participant.id))
  ) {
    return errorResponse(competitionError('RATE_LIMITED'))
  }

  const body = await readJsonBody(request, MAX_ACTION_LOG_BYTES)
  if (!body.ok) return errorResponse(body.error)

  const parsed = submissionSchema.safeParse(body.value)
  if (!parsed.success) {
    return errorResponse(competitionError('INVALID_REQUEST', 'actionLog'))
  }

  const result = await submitAttempt(
    context,
    competition,
    session.participant,
    attemptId,
    parsed.data.actionLog,
  )

  if (!result.ok) {
    competitionLog({
      event: 'attempt.submit',
      outcome: 'rejected',
      code: result.error.code,
      competitionId: competition.id,
      participantId: session.participant.id,
      attemptId,
      durationMs: Date.now() - started,
    })
    return errorResponse(result.error)
  }

  competitionLog({
    event: 'attempt.submit',
    outcome: 'ok',
    code: result.value.status,
    competitionId: competition.id,
    participantId: session.participant.id,
    attemptId,
    durationMs: Date.now() - started,
  })

  const state = await loadPublicState(context, competition, session.participant)
  return jsonResponse({ result: result.value, state })
}

export async function handleAbandonAttempt(
  request: Request,
  attemptId: string,
): Promise<Response> {
  const origin = await assertSameOrigin(request)
  if (origin !== undefined) return errorResponse(origin)

  const resolved = await resolveContext()
  if (!resolved.ok) return errorResponse(resolved.error)
  const { context, competition } = resolved.value
  if (competition === undefined) {
    return errorResponse(competitionError('COMPETITION_NOT_CONFIGURED'))
  }

  const session = await currentParticipant(context)
  if (session === undefined) return errorResponse(SESSION_REQUIRED)

  const result = await abandonActiveAttempt(
    context,
    session.participant,
    attemptId,
  )
  return result.ok ? jsonResponse(result.value) : errorResponse(result.error)
}

/* --------------------------------------------------------------------------
 * Organizador
 * ----------------------------------------------------------------------- */

async function requireOrganizer(context: CompetitionContext) {
  return resolveOrganizerSession(context, await readOrganizerToken())
}

export async function handleOrganizerLogin(
  request: Request,
): Promise<Response> {
  const origin = await assertSameOrigin(request)
  if (origin !== undefined) return errorResponse(origin)

  const resolved = await resolveContext()
  if (!resolved.ok) return errorResponse(resolved.error)
  const { context } = resolved.value

  const subject = await rateLimitSubject(context.config.identitySecret)
  if (!(await context.rateLimiter.allow('organizerLogin', subject))) {
    return errorResponse(competitionError('RATE_LIMITED'))
  }

  const body = await readJsonBody(request, 4 * 1024)
  if (!body.ok) return errorResponse(body.error)
  const parsed = organizerLoginSchema.safeParse(body.value)
  if (!parsed.success) {
    return errorResponse(competitionError('ORGANIZER_CREDENTIALS_INVALID'))
  }

  const result = await authenticateOrganizer(
    context,
    parsed.data.username,
    parsed.data.password,
  )
  if (!result.ok) {
    competitionLog({
      event: 'organizer.login',
      outcome: 'rejected',
      code: result.error.code,
    })
    return errorResponse(result.error)
  }

  await writeOrganizerCookie(result.value.token, result.value.expiresAt)
  competitionLog({ event: 'organizer.login', outcome: 'ok' })
  return jsonResponse({ authenticated: true })
}

export async function handleOrganizerLogout(
  request: Request,
): Promise<Response> {
  const origin = await assertSameOrigin(request)
  if (origin !== undefined) return errorResponse(origin)
  const resolved = await resolveContext()
  if (resolved.ok) {
    await endOrganizerSession(
      resolved.value.context,
      await readOrganizerToken(),
    )
  }
  await clearOrganizerCookie()
  return jsonResponse({ authenticated: false })
}

export async function handleOrganizerDashboard(): Promise<Response> {
  const resolved = await resolveContext()
  if (!resolved.ok) return errorResponse(resolved.error)
  const { context, competition } = resolved.value

  const organizer = await requireOrganizer(context)
  if (organizer === undefined) {
    return errorResponse(competitionError('ORGANIZER_AUTH_REQUIRED'))
  }
  if (competition === undefined) {
    return errorResponse(competitionError('COMPETITION_NOT_CONFIGURED'))
  }

  return jsonResponse(await loadOrganizerDashboard(context, competition))
}

export async function handleOrganizerAction(
  request: Request,
): Promise<Response> {
  const origin = await assertSameOrigin(request)
  if (origin !== undefined) return errorResponse(origin)

  const resolved = await resolveContext()
  if (!resolved.ok) return errorResponse(resolved.error)
  const { context, competition } = resolved.value

  const organizer = await requireOrganizer(context)
  if (organizer === undefined) {
    return errorResponse(competitionError('ORGANIZER_AUTH_REQUIRED'))
  }
  if (competition === undefined) {
    return errorResponse(competitionError('COMPETITION_NOT_CONFIGURED'))
  }

  const body = await readJsonBody(request, 8 * 1024)
  if (!body.ok) return errorResponse(body.error)
  const parsed = organizerActionSchema.safeParse(body.value)
  if (!parsed.success) {
    return errorResponse(
      competitionError(
        'INVALID_REQUEST',
        parsed.error.issues[0]?.path.join('.') ?? 'accion',
      ),
    )
  }

  const action = parsed.data
  const actor = organizer.username

  switch (action.action) {
    case 'competition.status': {
      const result = await setCompetitionStatus(
        context,
        actor,
        competition,
        action.status,
        action.reason,
      )
      return result.ok
        ? jsonResponse({ status: result.value.status })
        : errorResponse(result.error)
    }
    case 'participant.correct': {
      const result = await correctParticipant(
        context,
        actor,
        competition,
        action.participantId,
        {
          ...(action.nickname === undefined
            ? {}
            : { nickname: action.nickname }),
          ...(action.fullName === undefined
            ? {}
            : { fullName: action.fullName }),
          ...(action.schoolYear === undefined
            ? {}
            : { schoolYear: action.schoolYear }),
          ...(action.division === undefined
            ? {}
            : { division: action.division }),
          ...(action.nicknameHidden === undefined
            ? {}
            : { nicknameHidden: action.nicknameHidden }),
        },
        action.reason,
      )
      return result.ok
        ? jsonResponse({ corrected: true })
        : errorResponse(result.error)
    }
    case 'participant.eligibility': {
      const result = await setParticipantEligibility(
        context,
        actor,
        competition,
        action.participantId,
        action.status,
        action.reason,
      )
      return result.ok
        ? jsonResponse({ status: result.value.status })
        : errorResponse(result.error)
    }
    case 'participant.identity-verified': {
      const result = await verifyWinnerIdentity(
        context,
        actor,
        competition,
        action.participantId,
        action.verified,
        action.reason,
      )
      return result.ok
        ? jsonResponse({ verified: action.verified })
        : errorResponse(result.error)
    }
    case 'attempt.validity': {
      const result = await setAttemptValidity(
        context,
        actor,
        competition,
        action.attemptId,
        action.invalid,
        action.reason,
      )
      return result.ok
        ? jsonResponse({ invalid: action.invalid })
        : errorResponse(result.error)
    }
    case 'competition.purge': {
      const result = await purgeCompetition(context, competition, {
        actor,
        ...(action.force === undefined ? {} : { force: action.force }),
      })
      return jsonResponse(result)
    }
  }
}

export async function handleOrganizerExport(): Promise<Response> {
  const resolved = await resolveContext()
  if (!resolved.ok) return errorResponse(resolved.error)
  const { context, competition } = resolved.value

  const organizer = await requireOrganizer(context)
  if (organizer === undefined) {
    return errorResponse(competitionError('ORGANIZER_AUTH_REQUIRED'))
  }
  if (competition === undefined) {
    return errorResponse(competitionError('COMPETITION_NOT_CONFIGURED'))
  }

  const dashboard = await loadOrganizerDashboard(context, competition)
  competitionLog({
    event: 'organizer.export',
    outcome: 'ok',
    competitionId: competition.id,
  })

  return new Response(exportParticipantsCsv(dashboard), {
    status: 200,
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': `attachment; filename="${exportFilename(
        competition.slug,
        context.clock.now(),
      )}"`,
      'cache-control': 'no-store',
    },
  })
}
