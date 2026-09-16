/**
 * Canonical run action log.
 *
 * ADR-004 makes the server authoritative: the client submits what the player
 * did, and the server replays it. The action log is that submission, and it is
 * the strongest validation artefact the system has — stronger than a snapshot,
 * because it can be re-executed rather than merely trusted.
 *
 * The format is versioned separately from the engine so a transport change and
 * a rules change stay distinguishable.
 */

import { z } from 'zod'

import { OPAQUE_ID_PATTERN, toRunId, toRunSeed } from '../core/branded'
import { err, ok, type Result } from '../core/result'
import type { EngineRejection } from '../core/errors'
import { gameCommandSchema, parseCommand, type GameCommand } from './commands'
import type { RunDescriptor } from './state'

/**
 * Bumped when the envelope shape changes, not when game rules change.
 *
 * `2` carries the approved variant catalog a run drew from. Dropping it was a
 * real defect: a log that reached a server without its catalog version would be
 * replayed against whatever catalog that server happened to hold, and the same
 * seed would resolve different variants without anyone noticing.
 */
export const ACTION_LOG_VERSION = 7

export interface RunActionEnvelope {
  /** Strictly increasing, starting at zero. */
  readonly sequence: number
  readonly command: GameCommand
}

export interface RunActionLog {
  readonly version: number
  readonly descriptor: RunDescriptor
  readonly actions: readonly RunActionEnvelope[]
}

const descriptorSchema = z.object({
  // The charset is enforced here rather than trusted: the RNG address encoding
  // separates a seed from its path with control characters, so a seed able to
  // contain one could make two different substreams resolve to the same
  // address. See `core/branded`.
  runId: z.string().regex(OPAQUE_ID_PATTERN),
  seed: z.string().regex(OPAQUE_ID_PATTERN),
  mode: z.enum(['standard', 'fair', 'practice']),
  difficulty: z.enum(['adaptive', 'fixed']),
  gameVersion: z.string().min(1).max(32),
  rulesetVersion: z.string().min(1).max(32),
  contentVersion: z.string().min(1).max(32),
  // Null, not absent: a log states explicitly that its run drew from no
  // approved catalog rather than leaving a reader to assume it.
  variantCatalogVersion: z.string().min(1).max(64).nullable(),
  // Which composed plan this run played. Null for an uncomposed run, and that
  // is a statement, not a gap: a run that resolved its content as it went did
  // not have a plan to fingerprint.
  planFingerprint: z.string().min(1).max(128).nullable(),
  // Which competitive calibration this run was played under. Null for a run
  // that is not competing, which is a statement and not a gap.
  scoreVersion: z.string().min(1).max(64).nullable(),
})

const envelopeSchema = z.object({
  sequence: z.number().int().min(0),
  command: gameCommandSchema,
})

export const actionLogSchema = z.object({
  version: z.number().int().min(1),
  descriptor: descriptorSchema,
  // The cap bounds the replay work a single submission can ask the server to
  // do, as required by the API limits section.
  actions: z.array(envelopeSchema).max(512),
})

export function appendAction(
  log: RunActionLog,
  command: GameCommand,
): RunActionLog {
  return {
    ...log,
    actions: [...log.actions, { sequence: log.actions.length, command }],
  }
}

export function emptyActionLog(descriptor: RunDescriptor): RunActionLog {
  return { version: ACTION_LOG_VERSION, descriptor, actions: [] }
}

/**
 * Parses and validates an untrusted action log.
 *
 * Sequence numbers must start at zero and increase by exactly one. A gap means
 * actions were dropped or reordered, which would silently change the run, so it
 * is refused rather than repaired.
 */
export function parseActionLog(
  input: unknown,
): Result<RunActionLog, EngineRejection> {
  const parsed = actionLogSchema.safeParse(input)

  if (!parsed.success) {
    const detail = parsed.error.issues
      .map(
        (issue) => `${issue.path.join('.') || 'actionLog'}: ${issue.message}`,
      )
      .join('; ')
    return err({ kind: 'invalid-command', detail })
  }

  if (parsed.data.version !== ACTION_LOG_VERSION) {
    return err({
      kind: 'unsupported-version',
      field: 'actionLogVersion',
      expected: String(ACTION_LOG_VERSION),
      received: String(parsed.data.version),
    })
  }

  const actions: RunActionEnvelope[] = []

  for (const [index, envelope] of parsed.data.actions.entries()) {
    if (envelope.sequence !== index) {
      return err({
        kind: 'action-log-sequence-gap',
        expected: index,
        received: envelope.sequence,
      })
    }

    const command = parseCommand(envelope.command)
    if (!command.ok) {
      return command
    }

    actions.push({ sequence: index, command: command.value })
  }

  const raw = parsed.data.descriptor
  const descriptor: RunDescriptor = {
    runId: toRunId(raw.runId),
    seed: toRunSeed(raw.seed),
    mode: raw.mode,
    difficulty: raw.difficulty,
    gameVersion: raw.gameVersion,
    rulesetVersion: raw.rulesetVersion,
    contentVersion: raw.contentVersion,
    ...(raw.variantCatalogVersion === null
      ? {}
      : { variantCatalogVersion: raw.variantCatalogVersion }),
    ...(raw.planFingerprint === null
      ? {}
      : { planFingerprint: raw.planFingerprint }),
    ...(raw.scoreVersion === null ? {} : { scoreVersion: raw.scoreVersion }),
  }

  return ok({ version: parsed.data.version, descriptor, actions })
}

/** JSON-ready form. The log is already plain data, so this is a structural copy. */
export function serializeActionLog(log: RunActionLog): unknown {
  return {
    version: log.version,
    descriptor: {
      ...log.descriptor,
      variantCatalogVersion: log.descriptor.variantCatalogVersion ?? null,
      planFingerprint: log.descriptor.planFingerprint ?? null,
      scoreVersion: log.descriptor.scoreVersion ?? null,
    },
    actions: log.actions.map((envelope) => ({
      sequence: envelope.sequence,
      command: envelope.command,
    })),
  }
}
