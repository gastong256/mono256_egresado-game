/**
 * Engine commands.
 *
 * Commands are a closed discriminated union, not a generic `dispatch(type,
 * payload)`. Inside the engine every command is already typed and validated;
 * `parseCommand` is the single trust boundary where an untyped payload from a
 * browser, a stored action log or an HTTP request becomes a domain command.
 *
 * The vocabulary follows `game-engine.md`, plus an explicit abandon, which the
 * progression rules require as the other way a run can end.
 */

import { z } from 'zod'

import { OPAQUE_ID_PATTERN, toChallengeInstanceId } from '../core/branded'
import { err, ok, type Result } from '../core/result'
import type { EngineRejection } from '../core/errors'
import type { ChallengeInstanceId } from '../core/branded'
import type { InteractionAnswer, ToolId } from '../challenges/interactions'

export type GameCommand =
  | {
      readonly type: 'ANSWER'
      readonly instanceId: ChallengeInstanceId
      readonly answer: InteractionAnswer
    }
  | {
      readonly type: 'REQUEST_INFO'
      readonly instanceId: ChallengeInstanceId
      readonly key: string
    }
  | {
      readonly type: 'USE_TOOL'
      readonly instanceId: ChallengeInstanceId
      readonly tool: ToolId
    }
  | { readonly type: 'CONTINUE' }
  | { readonly type: 'ABANDON' }

export type GameCommandType = GameCommand['type']

const budgetLineSchema = z.object({
  itemId: z.string().min(1),
  quantity: z.number().int().min(0).max(999),
})

const assignmentSchema = z.object({
  agentId: z.string().min(1),
  taskId: z.string().min(1),
})

/**
 * Una ronda marcada de una grilla de clasificación.
 *
 * Los números se acotan a enteros chicos porque una grilla de 7.º los tiene, y
 * porque acotar acá es lo que impide que un cliente hostil mande cien mil
 * enteros de 15 dígitos para hacer trabajar al evaluador.
 */
const gridRoundSelectionSchema = z.object({
  roundId: z.string().min(1).max(64),
  numbers: z.array(z.number().int().min(0).max(9999)).max(64),
})

/** Decimal literal, so a numeric answer never arrives as a binary float. */
const decimalLiteral = z
  .string()
  .min(1)
  .max(24)
  .regex(/^[+-]?\d+(?:\.\d+)?$/u, 'expected a decimal literal')

export const interactionAnswerSchema = z.discriminatedUnion('kind', [
  z.strictObject({
    kind: z.literal('schedule-builder'),
    placements: z
      .array(
        z.strictObject({
          activityId: z
            .string()
            .min(1)
            .max(64)
            .regex(/^[a-zA-Z0-9._-]+$/u),
          startMinute: z.number().int().min(0).max(1439),
        }),
      )
      .max(8)
      .refine(
        (values) =>
          new Set(values.map((v) => v.activityId)).size === values.length,
        'duplicate activity',
      ),
  }),
  z.strictObject({
    kind: z.literal('spatial-layout'),
    placements: z
      .array(
        z.strictObject({
          objectId: z
            .string()
            .min(1)
            .max(64)
            .regex(/^[a-zA-Z0-9._-]+$/u),
          x: z.number().int().min(0).max(15),
          y: z.number().int().min(0).max(15),
          rotation: z.union([z.literal(0), z.literal(90)]),
        }),
      )
      .max(8)
      .refine(
        (values) =>
          new Set(values.map((v) => v.objectId)).size === values.length,
        'duplicate object',
      ),
  }),
  z.strictObject({
    kind: z.literal('quantity-builder'),
    lines: z
      .array(
        z.strictObject({
          itemId: z
            .string()
            .min(1)
            .max(64)
            .regex(/^[a-zA-Z0-9._-]+$/u),
          quantity: z.number().int().min(0).max(999),
        }),
      )
      .max(12)
      .refine(
        (lines) =>
          new Set(lines.map((line) => line.itemId)).size === lines.length,
        'duplicate quantity item',
      ),
  }),
  z.strictObject({
    kind: z.literal('classification'),
    entries: z
      .array(
        z.strictObject({
          statementId: z
            .string()
            .min(1)
            .max(64)
            .regex(/^[a-zA-Z0-9._-]+$/u),
          labelId: z
            .string()
            .min(1)
            .max(64)
            .regex(/^[a-zA-Z0-9._-]+$/u),
        }),
      )
      .max(12)
      .refine(
        (entries) =>
          new Set(entries.map((entry) => entry.statementId)).size ===
          entries.length,
        'duplicate statement',
      ),
    /** La acción pública viaja aparte de las etiquetas, nunca mezclada. */
    stance: z
      .string()
      .min(1)
      .max(64)
      .regex(/^[a-zA-Z0-9._-]+$/u)
      .optional(),
  }),
  z.object({ kind: z.literal('decision-card'), optionId: z.string().min(1) }),
  z.object({ kind: z.literal('numeric-input'), value: decimalLiteral }),
  z.object({
    kind: z.literal('budget-builder'),
    lines: z.array(budgetLineSchema).max(32),
  }),
  z.object({ kind: z.literal('timeline'), optionId: z.string().min(1) }),
  z.object({
    kind: z.literal('chart-interpretation'),
    optionId: z.string().min(1),
  }),
  z.object({
    kind: z.literal('assignment-board'),
    assignments: z.array(assignmentSchema).max(32),
  }),
  z.object({
    kind: z.literal('information-request'),
    optionId: z.string().min(1),
  }),
  z.object({
    kind: z.literal('number-grid'),
    rounds: z.array(gridRoundSelectionSchema).max(8),
  }),
])

const toolSchema = z.enum(['calculator', 'notepad', 'table', 'ruler'])

export const gameCommandSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('ANSWER'),
    instanceId: z.string().regex(OPAQUE_ID_PATTERN),
    answer: interactionAnswerSchema,
  }),
  z.object({
    type: z.literal('REQUEST_INFO'),
    instanceId: z.string().regex(OPAQUE_ID_PATTERN),
    key: z.string().min(1).max(64),
  }),
  z.object({
    type: z.literal('USE_TOOL'),
    instanceId: z.string().regex(OPAQUE_ID_PATTERN),
    tool: toolSchema,
  }),
  z.object({ type: z.literal('CONTINUE') }),
  z.object({ type: z.literal('ABANDON') }),
])

/**
 * Parses an untrusted payload into a command.
 *
 * Everything past this point may assume the command is structurally valid;
 * whether it is *allowed right now* is the transition function's decision.
 */
export function parseCommand(
  input: unknown,
): Result<GameCommand, EngineRejection> {
  const parsed = gameCommandSchema.safeParse(input)

  if (!parsed.success) {
    const detail = parsed.error.issues
      .map((issue) => `${issue.path.join('.') || 'command'}: ${issue.message}`)
      .join('; ')
    return err({ kind: 'invalid-command', detail })
  }

  const command = parsed.data

  switch (command.type) {
    case 'ANSWER':
      return ok({
        type: 'ANSWER',
        instanceId: toChallengeInstanceId(command.instanceId),
        // Zod infers mutable arrays where the domain type declares readonly
        // ones. The shapes are otherwise identical and already validated, so
        // this is the one narrowing the parser cannot express.
        answer: command.answer as InteractionAnswer,
      })
    case 'REQUEST_INFO':
      return ok({
        type: 'REQUEST_INFO',
        instanceId: toChallengeInstanceId(command.instanceId),
        key: command.key,
      })
    case 'USE_TOOL':
      return ok({
        type: 'USE_TOOL',
        instanceId: toChallengeInstanceId(command.instanceId),
        tool: command.tool satisfies ToolId,
      })
    case 'CONTINUE':
      return ok({ type: 'CONTINUE' })
    case 'ABANDON':
      return ok({ type: 'ABANDON' })
  }
}
