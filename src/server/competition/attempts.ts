import 'server-only'

import { summarizeVerifiedRun } from './run-summary'

import { createHash } from 'node:crypto'

import {
  canonicalize,
  describeRejection,
  isErr,
  parseActionLog,
  serializeActionLog,
  type RunDescriptor,
} from '@/game'
import { validateSubmittedRun } from '@/server/game/validate-run'
import type {
  AttemptRow,
  CompetitionRow,
  ParticipantRow,
  PinnedVersions,
} from '@/server/persistence/competition/rows'
import type { CompetitionStore } from '@/server/persistence/competition/store'
import type { Clock } from './clock'
import { competitionError, type CompetitionError } from './errors'
import {
  describeVersionMismatch,
  listEditions,
  resolveEdition,
} from './editions'
import { createRunIdentifier } from './tokens'

/**
 * El ciclo de vida de un intento, con el servidor como única autoridad.
 *
 * Tres cosas se deciden acá y en ningún otro lado:
 *
 * 1. **Qué juego se juega.** El cliente no elige seed, plan, catálogo,
 *    dificultad ni política de score. La edición tiene una Competition Seed
 *    compartida —decisión de producto v1— y todos los intentos reciben el mismo
 *    plan; lo único propio de cada intento es su `runId`. Un campo que el
 *    cliente mande con cualquiera de esos nombres se descarta sin mirarlo,
 *    porque la emisión ni siquiera los lee.
 *
 * 2. **Cuánto vale.** El score no se envía: se recomputa. El servidor vuelve a
 *    jugar el log de acciones contra las versiones que el intento fijó al
 *    emitirse y calcula FairScore y Prestige desde ese replay.
 *
 * 3. **Cuándo.** La ventana la mide el reloj del servidor. El cliente puede
 *    decir la hora que quiera; no se lee.
 */

export interface AttemptServiceDependencies {
  readonly store: CompetitionStore
  readonly clock: Clock
}

type Outcome<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: CompetitionError }

/** Lo que el navegador necesita para jugar. Nada más. */
export interface IssuedAttempt {
  readonly attemptId: string
  readonly attemptNumber: number
  readonly descriptor: RunDescriptor
  /** `true` cuando se devolvió una partida que ya estaba en curso. */
  readonly resumed: boolean
}

export interface VerifiedAttempt {
  readonly attemptId: string
  readonly status: AttemptRow['status']
  readonly fairScore: number | undefined
  readonly prestigeScore: number | undefined
  readonly graduated: boolean
  readonly rejectionCode: string | undefined
  /** `true` si este intento es ahora el mejor verificado del participante. */
  readonly personalBest: boolean
}

function versionsOf(row: PinnedVersions): PinnedVersions {
  return {
    engineVersion: row.engineVersion,
    rulesetVersion: row.rulesetVersion,
    contentVersion: row.contentVersion,
    variantCatalogVersion: row.variantCatalogVersion,
    scoreVersion: row.scoreVersion,
    actionLogVersion: row.actionLogVersion,
    snapshotVersion: row.snapshotVersion,
  }
}

/**
 * Si la edición admite empezar una partida ahora.
 *
 * `OPEN` no alcanza: la ventana también tiene que estar abierta. Un organizador
 * que se olvidó de cerrar a las seis no convierte en válida una partida de las
 * nueve de la noche.
 */
export function canStartAttempt(
  competition: CompetitionRow,
  now: Date,
): CompetitionError | undefined {
  if (competition.status !== 'OPEN') {
    return competitionError(
      competition.status === 'CLOSED' || competition.status === 'ARCHIVED'
        ? 'COMPETITION_CLOSED'
        : 'COMPETITION_NOT_OPEN',
      `status:${competition.status}`,
    )
  }
  if (
    competition.opensAt !== undefined &&
    now.getTime() < new Date(competition.opensAt).getTime()
  ) {
    return competitionError('COMPETITION_NOT_OPEN', 'antes de opensAt')
  }
  if (
    competition.closesAt !== undefined &&
    now.getTime() >= new Date(competition.closesAt).getTime()
  ) {
    return competitionError('COMPETITION_CLOSED', 'después de closesAt')
  }
  return undefined
}

/**
 * Si una partida ya emitida todavía se puede enviar.
 *
 * La regla es la menos sorprendente de las dos que estaban sobre la mesa:
 * **empezar mientras está abierta, enviar antes del cierre más una tolerancia
 * configurada**. La alternativa estricta —enviar antes del cierre, sin
 * tolerancia— le saca el resultado a quien empezó a las 17:52 una carrera de
 * doce minutos, que no hizo nada mal. La tolerancia es de la edición y se
 * anuncia antes de abrir, así que nadie la descubre cuando le toca.
 */
export function canSubmitAttempt(
  competition: CompetitionRow,
  now: Date,
): CompetitionError | undefined {
  if (competition.closesAt === undefined) return undefined
  const deadline =
    new Date(competition.closesAt).getTime() +
    competition.submissionGraceSeconds * 1000
  return now.getTime() > deadline
    ? competitionError('SUBMISSION_TOO_LATE', 'después de la tolerancia')
    : undefined
}

/**
 * Emite un intento, o devuelve el que ya estaba en curso.
 *
 * Dos pestañas abiertas no son un ataque: son un teléfono. El índice único
 * parcial de la base garantiza que haya a lo sumo una partida activa por
 * participante, y cuando choca, esta función devuelve la que existe en vez de
 * crear una paralela. Eso es lo que hace que recargar la página no duplique
 * nada y que no haya dos logs compitiendo por el mismo puesto.
 */
export async function startAttempt(
  dependencies: AttemptServiceDependencies,
  competition: CompetitionRow,
  participant: ParticipantRow,
): Promise<Outcome<IssuedAttempt>> {
  if (participant.status !== 'ELIGIBLE') {
    return { ok: false, error: competitionError('PARTICIPANT_DISQUALIFIED') }
  }

  const now = dependencies.clock.now()
  const active = await dependencies.store.findActiveAttempt(participant.id)
  if (active !== undefined) {
    const descriptor = descriptorFor(active)
    if (descriptor === undefined) {
      // La partida activa quedó con versiones que este servidor ya no
      // implementa. Se abandona en vez de dejar al jugador atrapado en algo
      // que nunca va a poder enviar.
      await dependencies.store.abandonAttempt(active.id)
    } else {
      return {
        ok: true,
        value: {
          attemptId: active.id,
          attemptNumber: active.attemptNumber,
          descriptor,
          resumed: true,
        },
      }
    }
  }

  const window = canStartAttempt(competition, now)
  if (window !== undefined) return { ok: false, error: window }

  const edition = resolveEdition(versionsOf(competition))
  if (edition === undefined) {
    return {
      ok: false,
      error: competitionError(
        'ATTEMPT_VERSION_UNSUPPORTED',
        'la edición declara versiones que este servidor no implementa',
      ),
    }
  }

  const existing = await dependencies.store.countAttempts(participant.id)
  const runId = createRunIdentifier()
  const descriptor = edition.createDescriptor(competition.runSeed, runId)
  if (descriptor === undefined) {
    return {
      ok: false,
      error: competitionError(
        'ATTEMPT_VERSION_UNSUPPORTED',
        'la seed de la edición ya no compone un plan válido',
      ),
    }
  }

  // La huella del plan se recomputa y se compara con la que la edición
  // congeló. Si una calibración se movió después de abrir, el plan que saldría
  // hoy no es el que los demás jugaron, y emitirlo sería competir contra otro
  // juego bajo el mismo nombre.
  if (descriptor.planFingerprint !== competition.runPlanFingerprint) {
    return {
      ok: false,
      error: competitionError(
        'ATTEMPT_VERSION_UNSUPPORTED',
        'la huella del plan no coincide con la congelada en la edición',
      ),
    }
  }

  const insert = await dependencies.store.insertAttempt({
    competitionId: competition.id,
    participantId: participant.id,
    attemptNumber: existing + 1,
    runId,
    seed: competition.runSeed,
    runPlanFingerprint: competition.runPlanFingerprint,
    startedAt: now.toISOString(),
    ...edition.versions,
  })

  if (insert.outcome !== 'created') {
    // Otro pedido ganó la carrera. Se devuelve su partida, que es lo que el
    // jugador quería: una partida activa, no específicamente ésta.
    const winner = await dependencies.store.findActiveAttempt(participant.id)
    if (winner === undefined) {
      return { ok: false, error: competitionError('SUBMISSION_CONFLICT') }
    }
    const winnerDescriptor = descriptorFor(winner)
    if (winnerDescriptor === undefined) {
      return {
        ok: false,
        error: competitionError('ATTEMPT_VERSION_UNSUPPORTED'),
      }
    }
    return {
      ok: true,
      value: {
        attemptId: winner.id,
        attemptNumber: winner.attemptNumber,
        descriptor: winnerDescriptor,
        resumed: true,
      },
    }
  }

  return {
    ok: true,
    value: {
      attemptId: insert.attempt.id,
      attemptNumber: insert.attempt.attemptNumber,
      descriptor,
      resumed: false,
    },
  }
}

/** Reconstruye el descriptor de un intento guardado, desde sus versiones fijadas. */
export function descriptorFor(attempt: AttemptRow): RunDescriptor | undefined {
  const edition = resolveEdition(versionsOf(attempt))
  if (edition === undefined) return undefined
  const descriptor = edition.createDescriptor(attempt.seed, attempt.runId)
  if (descriptor === undefined) return undefined
  return descriptor.planFingerprint === attempt.runPlanFingerprint
    ? descriptor
    : undefined
}

/** Huella de la submission, para reconocer un reenvío byte a byte. */
export function submissionDigest(actionLog: unknown): string {
  return createHash('sha256').update(canonicalize(actionLog)).digest('hex')
}

function verifiedView(
  attempt: AttemptRow,
  personalBest: boolean,
): VerifiedAttempt {
  return {
    attemptId: attempt.id,
    status: attempt.status,
    fairScore: attempt.verifiedFairScore,
    prestigeScore: attempt.verifiedPrestigeScore,
    graduated:
      typeof attempt.verifiedSummary === 'object' &&
      attempt.verifiedSummary !== null &&
      (attempt.verifiedSummary as { graduated?: unknown }).graduated === true,
    rejectionCode: attempt.rejectionCode,
    personalBest,
  }
}

async function isPersonalBest(
  dependencies: AttemptServiceDependencies,
  attempt: AttemptRow,
): Promise<boolean> {
  if (attempt.status !== 'VERIFIED') return false
  const all = await dependencies.store.listAttemptsForParticipant(
    attempt.participantId,
  )
  const better = all.filter(
    (row) =>
      row.id !== attempt.id &&
      row.status === 'VERIFIED' &&
      row.invalidatedAt === undefined &&
      ((row.verifiedFairScore ?? 0) > (attempt.verifiedFairScore ?? 0) ||
        ((row.verifiedFairScore ?? 0) === (attempt.verifiedFairScore ?? 0) &&
          (row.verifiedPrestigeScore ?? 0) >
            (attempt.verifiedPrestigeScore ?? 0))),
  )
  return better.length === 0
}

/**
 * Recibe una partida, la vuelve a jugar y guarda lo que valió.
 *
 * El único dato del cliente que se lee es el log de acciones. La seed, el plan,
 * las versiones y el participante salen de la fila del intento, que el servidor
 * escribió al emitirlo. Un payload que además traiga `score`, `fairScore`,
 * `graduated` o `prestige` no es rechazado: es **ignorado**, porque no hay
 * ningún lugar en este camino donde se lo lea.
 */
export async function submitAttempt(
  dependencies: AttemptServiceDependencies,
  competition: CompetitionRow,
  participant: ParticipantRow,
  attemptId: string,
  payload: unknown,
): Promise<Outcome<VerifiedAttempt>> {
  const attempt = await dependencies.store.findAttemptById(attemptId)
  if (attempt === undefined) {
    return { ok: false, error: competitionError('ATTEMPT_NOT_FOUND') }
  }
  if (attempt.participantId !== participant.id) {
    // No se distingue de "no existe" hacia afuera: enumerar intentos ajenos no
    // le sirve a nadie salvo a quien esté probando ids.
    return { ok: false, error: competitionError('ATTEMPT_NOT_OWNED') }
  }
  if (attempt.competitionId !== competition.id) {
    return { ok: false, error: competitionError('ATTEMPT_NOT_FOUND') }
  }

  const digest = submissionDigest(payload)

  if (attempt.status !== 'STARTED') {
    // Ya está cerrado. Un reenvío idéntico devuelve el mismo resultado; uno
    // distinto no reemplaza nada.
    if (attempt.submissionDigest === digest) {
      return {
        ok: true,
        value: verifiedView(
          attempt,
          await isPersonalBest(dependencies, attempt),
        ),
      }
    }
    return {
      ok: false,
      error: competitionError(
        attempt.status === 'ABANDONED'
          ? 'ATTEMPT_NOT_FOUND'
          : 'ATTEMPT_ALREADY_FINALIZED',
        `status:${attempt.status}`,
      ),
    }
  }

  const now = dependencies.clock.now()
  const late = canSubmitAttempt(competition, now)
  if (late !== undefined) return { ok: false, error: late }

  const edition = resolveEdition(versionsOf(attempt))
  if (edition === undefined) {
    // El intento se emitió bajo versiones que este servidor ya no implementa.
    // Resolver "la más parecida" sería puntuar al jugador contra reglas que no
    // jugó, así que se falla cerrado y se nombra la primera diferencia contra
    // la edición vigente, que es lo que un organizador necesita saber.
    const current = listEditions()[0]
    return {
      ok: false,
      error: competitionError(
        'ATTEMPT_VERSION_UNSUPPORTED',
        current === undefined
          ? 'versiones no implementadas'
          : (describeVersionMismatch(current.versions, versionsOf(attempt)) ??
              'versiones no implementadas'),
      ),
    }
  }

  const log = parseActionLog(payload)
  if (isErr(log)) {
    return {
      ok: false,
      error: competitionError(
        'RUN_VALIDATION_FAILED',
        describeRejection(log.error),
      ),
    }
  }

  // El log tiene que ser de **este** intento. Sin esto, alguien podría enviar
  // una partida buena bajo el id de otro intento suyo y cobrarla dos veces.
  const declared = log.value.descriptor
  if (
    declared.runId !== attempt.runId ||
    declared.seed !== attempt.seed ||
    declared.planFingerprint !== attempt.runPlanFingerprint ||
    declared.mode !== 'fair'
  ) {
    return {
      ok: false,
      error: competitionError(
        'RUN_VALIDATION_FAILED',
        'el log no corresponde a la emisión de este intento',
      ),
    }
  }
  if (
    declared.gameVersion !== attempt.engineVersion ||
    declared.rulesetVersion !== attempt.rulesetVersion ||
    declared.contentVersion !== attempt.contentVersion ||
    declared.variantCatalogVersion !== attempt.variantCatalogVersion ||
    declared.scoreVersion !== attempt.scoreVersion
  ) {
    return {
      ok: false,
      error: competitionError(
        'ATTEMPT_VERSION_UNSUPPORTED',
        'el log declara versiones distintas a las que el intento fijó',
      ),
    }
  }

  const validated = validateSubmittedRun(payload, edition.createDependencies())
  const submittedAt = now.toISOString()

  if (isErr(validated)) {
    const finalized = await dependencies.store.finalizeAttempt(
      attempt.id,
      ['STARTED'],
      {
        status: 'REJECTED',
        submittedAt,
        verifiedAt: undefined,
        actionLog: serializeActionLog(log.value),
        submissionDigest: digest,
        verifiedFairScore: undefined,
        verifiedPrestigeScore: undefined,
        verifiedSummary: { rejection: describeRejection(validated.error) },
        rejectionCode: validated.error.kind,
      },
    )
    if (finalized === undefined) {
      return { ok: false, error: competitionError('SUBMISSION_CONFLICT') }
    }
    return { ok: true, value: verifiedView(finalized, false) }
  }

  const result = validated.value
  if (!result.graduated) {
    // Sólo una carrera completa y egresada compite. El motor ya se negaría a
    // completar una que deba algo; esto lo dice en el vocabulario del ranking.
    const finalized = await dependencies.store.finalizeAttempt(
      attempt.id,
      ['STARTED'],
      {
        status: 'REJECTED',
        submittedAt,
        verifiedAt: undefined,
        actionLog: serializeActionLog(log.value),
        submissionDigest: digest,
        verifiedFairScore: undefined,
        verifiedPrestigeScore: undefined,
        verifiedSummary: { graduated: false },
        rejectionCode: 'not-graduated',
      },
    )
    if (finalized === undefined) {
      return { ok: false, error: competitionError('SUBMISSION_CONFLICT') }
    }
    return { ok: true, value: verifiedView(finalized, false) }
  }

  const fairScore = result.competitiveScore?.fairScore
  if (fairScore === undefined) {
    return {
      ok: false,
      error: competitionError(
        'RUN_VALIDATION_FAILED',
        'la run no declaró una política de score competitivo',
      ),
    }
  }

  const finalized = await dependencies.store.finalizeAttempt(
    attempt.id,
    ['STARTED'],
    {
      status: 'VERIFIED',
      submittedAt,
      verifiedAt: submittedAt,
      actionLog: serializeActionLog(log.value),
      submissionDigest: digest,
      verifiedFairScore: fairScore,
      verifiedPrestigeScore: result.prestige?.total ?? 0,
      verifiedSummary: {
        ranking: summarizeVerifiedRun(result),
        graduated: result.graduated,
        profile: result.profile,
        eventsPlayed: result.eventsPlayed,
        recoveries: result.recoveries,
        previas: result.previas,
        optimalCount: result.competitiveScore?.optimalCount,
        difficultyCost: result.difficultyCost,
      },
      rejectionCode: undefined,
    },
  )

  if (finalized === undefined) {
    // Otro envío cerró la fila entre medio. Si era el mismo payload, el
    // resultado guardado ya es éste; si no, no se reemplaza.
    const current = await dependencies.store.findAttemptById(attempt.id)
    if (current !== undefined && current.submissionDigest === digest) {
      return {
        ok: true,
        value: verifiedView(
          current,
          await isPersonalBest(dependencies, current),
        ),
      }
    }
    return { ok: false, error: competitionError('SUBMISSION_CONFLICT') }
  }

  return {
    ok: true,
    value: verifiedView(
      finalized,
      await isPersonalBest(dependencies, finalized),
    ),
  }
}

/** Abandona la partida activa. Es una acción del jugador, no del servidor. */
export async function abandonActiveAttempt(
  dependencies: AttemptServiceDependencies,
  participant: ParticipantRow,
  attemptId: string,
): Promise<Outcome<{ readonly abandoned: boolean }>> {
  const attempt = await dependencies.store.findAttemptById(attemptId)
  if (attempt === undefined || attempt.participantId !== participant.id) {
    return { ok: false, error: competitionError('ATTEMPT_NOT_FOUND') }
  }
  const abandoned = await dependencies.store.abandonAttempt(attemptId)
  return { ok: true, value: { abandoned: abandoned !== undefined } }
}
