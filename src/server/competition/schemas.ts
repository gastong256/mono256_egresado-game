import 'server-only'

import { z } from 'zod'

import {
  DNI_MAX_DIGITS,
  FULL_NAME_MAX_LENGTH,
  NICKNAME_MAX_LENGTH,
} from '@/lib/competition'

/**
 * Los esquemas de la frontera de red.
 *
 * Cada ruta parsea antes de mirar nada. Dos decisiones vale la pena nombrar.
 *
 * `.strict()` en los cuerpos de identidad y de acción de organizador: un campo
 * de más no se ignora, se rechaza. No es purismo — es la diferencia entre
 * descartar en silencio un `competitionId` que el cliente mandó y decirle que
 * ese campo no existe, que es lo que impide que alguien crea que lo eligió.
 *
 * El log de acciones, en cambio, entra como `unknown`. Su forma la valida el
 * propio codec del motor, que es el que sabe qué comandos existen; duplicar esa
 * gramática acá crearía una segunda definición que se va a desincronizar. Lo
 * que sí se acota antes es el **tamaño**.
 */

/** Una carrera de nueve beats produce decenas de comandos, no miles. */
export { MAX_ACTION_LOG_BYTES } from '@/server/game/submission-limits'

export const identitySubmissionSchema = z
  .object({
    nickname: z
      .string()
      .min(1)
      .max(NICKNAME_MAX_LENGTH * 4),
    fullName: z
      .string()
      .min(1)
      .max(FULL_NAME_MAX_LENGTH * 2),
    // Se acepta con separadores y se normaliza del lado del servidor; el tope
    // deja lugar a puntos y espacios sin abrir la puerta a un campo enorme.
    dni: z
      .string()
      .min(1)
      .max(DNI_MAX_DIGITS * 3),
    schoolYear: z.string().min(1).max(32),
    division: z.string().min(1).max(16).optional(),
    privacyNoticeVersion: z.string().min(1).max(32),
    privacyNoticeAcknowledged: z.literal(true),
  })
  .strict()

export type IdentitySubmissionInput = z.infer<typeof identitySubmissionSchema>

export const submissionSchema = z
  .object({
    /**
     * El log de acciones, sin interpretar.
     *
     * Lo que el cliente además mande —un score, un `graduated`, un Prestige—
     * no se rechaza y tampoco se lee: no hay ningún punto de este camino donde
     * se consulte. Rechazarlo obligaría a enumerar los nombres que alguien
     * podría inventar; ignorarlo es una propiedad de la arquitectura.
     */
    actionLog: z.unknown(),
  })
  .passthrough()

export const organizerLoginSchema = z
  .object({
    username: z.string().min(1).max(64),
    password: z.string().min(1).max(256),
  })
  .strict()

const reason = z.string().min(3).max(240)

export const organizerActionSchema = z.discriminatedUnion('action', [
  z
    .object({
      action: z.literal('competition.status'),
      status: z.enum(['DRAFT', 'UPCOMING', 'OPEN', 'CLOSED', 'ARCHIVED']),
      reason,
    })
    .strict(),
  z
    .object({
      action: z.literal('participant.correct'),
      participantId: z.uuid(),
      nickname: z
        .string()
        .min(1)
        .max(NICKNAME_MAX_LENGTH * 4)
        .optional(),
      fullName: z.string().min(1).max(FULL_NAME_MAX_LENGTH).optional(),
      schoolYear: z.string().min(1).max(32).optional(),
      division: z.string().min(1).max(16).nullable().optional(),
      nicknameHidden: z.boolean().optional(),
      reason,
    })
    .strict(),
  z
    .object({
      action: z.literal('participant.eligibility'),
      participantId: z.uuid(),
      status: z.enum(['ELIGIBLE', 'DISQUALIFIED']),
      reason,
    })
    .strict(),
  z
    .object({
      action: z.literal('participant.identity-verified'),
      participantId: z.uuid(),
      verified: z.boolean(),
      reason,
    })
    .strict(),
  z
    .object({
      action: z.literal('attempt.validity'),
      attemptId: z.uuid(),
      invalid: z.boolean(),
      reason,
    })
    .strict(),
  z
    .object({
      action: z.literal('competition.purge'),
      force: z.boolean().optional(),
      reason,
    })
    .strict(),
])

export type OrganizerAction = z.infer<typeof organizerActionSchema>
