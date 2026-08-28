/**
 * Snapshot codec.
 *
 * FR-009 and FR-010 require a checkpoint after every completed event so a run
 * can be resumed. A snapshot is an *optimisation for resume*, not an
 * authoritative artefact: the action log remains the strongest validation
 * mechanism, because it can be re-executed while a snapshot can only be trusted.
 *
 * The codec therefore validates aggressively and refuses anything it does not
 * fully recognise. Incompatible versions produce an explicit error instead of a
 * silent migration, matching the compatibility rule in `game-engine.md`.
 */

import { z } from 'zod'

import {
  IDENTIFIER_PATTERN,
  OPAQUE_ID_PATTERN,
  toChallengeId,
  toChallengeInstanceId,
  toScenarioFamilyId,
  toVariantId,
  toRunId,
  toRunSeed,
  toStoryletId,
} from '../core/branded'
import { err, ok, type Result } from '../core/result'
import type { EngineRejection } from '../core/errors'
import {
  assertCompatibleVersions,
  type VersionTriple,
} from '../core/versioning'
import { STAGE_ORDER } from '../progression/stages'
import { ESTILO_AXES } from '../progression/career'
import type {
  CareerChange,
  CareerState,
  Estilo,
  EstiloAxis,
} from '../progression/career'
import { MATH_CATEGORIES, SOLUTION_QUALITIES } from '../challenges/taxonomy'
import type { MathCategory } from '../challenges/taxonomy'
import type { ChallengeFeedback } from '../challenges/contracts'
import { PROFILE_IDS } from '../profiles/policy'
import { runStateIssues } from './invariants'
import type { RunState } from './state'

/**
 * Snapshot schema version.
 *
 * Raised when the persisted shape changes.
 *
 * Version 2 replaced the four v0.1 stats (`knowledge · team · initiative ·
 * energy`) with the career model (`Promedio · Equipo · Aura · Estilo`). The two
 * shapes do not describe the same thing — a run played under v1 has no grades
 * and no Aura, and inventing them would fabricate a career the player never
 * had — so there is deliberately no migration from 1 to 2. A v1 snapshot is
 * rejected as an unsupported version, which the application handles by
 * discarding the checkpoint and offering a fresh run; that is a better outcome
 * than resuming into numbers nobody earned.
 */
export const SNAPSHOT_SCHEMA_VERSION = 3

// Built from the canonical tuples, so each schema infers the exact literal
// union. That is what lets the restore path below be cast-free.
const stageSchema = z.enum(STAGE_ORDER)
const qualitySchema = z.enum(SOLUTION_QUALITIES)
const profileSchema = z.enum(PROFILE_IDS)
const difficultySchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(5),
])

const flagValueSchema = z.union([z.boolean(), z.number(), z.string()])
const flagMapSchema = z.record(z.string(), flagValueSchema)

const estiloSchema = z
  .object({
    aplicado: z.number().int().min(0).max(100),
    estratega: z.number().int().min(0).max(100),
    improvisador: z.number().int().min(0).max(100),
  })
  // Estilo is a ternary split, so the three shares agreeing with each other is
  // part of the shape and not an afterthought a caller could skip.
  .refine(
    (estilo) =>
      estilo.aplicado + estilo.estratega + estilo.improvisador === 100,
    { message: 'the three Estilo shares must add up to 100' },
  )

const careerSchema = z.object({
  grades: z.array(z.number().min(1).max(10)).max(256),
  equipo: z.number().int().min(0).max(100).nullable(),
  aura: z.number().int().nullable(),
  estilo: estiloSchema,
  estiloEvidence: z.number().int().min(0),
  // Partial on purpose: a category with no key has no evidence yet, which is
  // a different statement from mastery 0.
  mastery: z.partialRecord(z.enum(MATH_CATEGORIES), z.number().min(0).max(1)),
})

const careerChangeSchema = z.object({
  promedio: z
    .object({ from: z.number().nullable(), to: z.number() })
    .nullable(),
  equipo: z
    .object({
      from: z.number().nullable(),
      to: z.number(),
      delta: z.number().int(),
    })
    .nullable(),
  aura: z
    .object({ delta: z.number().int(), total: z.number().int() })
    .nullable(),
  estilo: z.object({ axis: z.enum(ESTILO_AXES) }).nullable(),
})

const metricsSchema = z.object({
  efficiency: z.number().min(0).max(1),
  precision: z.number().min(0).max(1),
  risk: z.number().min(0).max(1),
  informationUse: z.number().min(0).max(1),
})

const factSchema = z.object({ label: z.string(), value: z.string() })

const feedbackSchema = z.object({
  outcomeKey: z.string().min(1),
  facts: z.array(factSchema).max(32),
  violatedConstraint: z.string().optional(),
  optimalComparison: z.string().optional(),
  consequence: z.string().optional(),
  stamp: z.string().optional(),
})

const scoreSchema = z.object({
  basePoints: z.number().int(),
  qualityFactor: z.string(),
  difficultyFactor: z.string(),
  components: z.array(z.object({ key: z.string(), points: z.number().int() })),
  bonusPoints: z.number().int(),
  penaltyPoints: z.number().int(),
  totalPoints: z.number().int().min(0),
})

const challengeRefSchema = z.object({
  instanceId: z.string().regex(OPAQUE_ID_PATTERN),
  familyId: z.string().regex(IDENTIFIER_PATTERN),
  templateId: z.string().regex(IDENTIFIER_PATTERN),
  variantId: z.string().regex(IDENTIFIER_PATTERN),
  stageId: stageSchema,
  eventIndex: z.number().int().min(0),
  difficulty: difficultySchema,
})

const activeEventSchema = z.object({
  storyletId: z.string().regex(IDENTIFIER_PATTERN),
  eyebrow: z.string(),
  title: z.string(),
  text: z.string(),
  challenge: challengeRefSchema.nullable(),
  revealed: z.array(z.string()).max(16),
  toolsUsed: z
    .array(z.enum(['calculator', 'notepad', 'table', 'ruler']))
    .max(8),
  careerChange: careerChangeSchema,
})

const resolvedEventSchema = z.object({
  sequence: z.number().int().min(0),
  stage: stageSchema,
  eventIndex: z.number().int().min(0),
  storyletId: z.string().regex(IDENTIFIER_PATTERN),
  challengeId: z.string().regex(IDENTIFIER_PATTERN).nullable(),
  instanceId: z.string().regex(OPAQUE_ID_PATTERN).nullable(),
  difficulty: difficultySchema,
  quality: qualitySchema.nullable(),
  metrics: metricsSchema.nullable(),
  points: z.number().int().min(0),
  revealedCount: z.number().int().min(0),
})

const stateSchema = z.object({
  descriptor: z.object({
    runId: z.string().regex(OPAQUE_ID_PATTERN),
    seed: z.string().regex(OPAQUE_ID_PATTERN),
    mode: z.enum(['standard', 'fair', 'practice']),
    difficulty: z.enum(['adaptive', 'fixed']),
    gameVersion: z.string().min(1),
    rulesetVersion: z.string().min(1),
    contentVersion: z.string().min(1),
  }),
  phase: z.enum(['narrative', 'challenge', 'feedback', 'completed']),
  status: z.enum(['active', 'completed', 'abandoned']),
  stage: stageSchema,
  eventIndex: z.number().int().min(0),
  stageEventIndex: z.number().int().min(0),
  career: careerSchema,
  flags: flagMapSchema,
  difficulty: z.object({
    current: difficultySchema,
    recent: z.array(qualitySchema).max(64),
  }),
  selection: z.object({
    lastSeenAt: z.record(z.string(), z.number().int().min(0)),
  }),
  seenStorylets: z.array(z.string().regex(IDENTIFIER_PATTERN)).max(256),
  qualityHistory: z.array(qualitySchema).max(256),
  activeEvent: activeEventSchema.nullable(),
  pendingFeedback: z
    .object({
      instanceId: z.string().regex(OPAQUE_ID_PATTERN),
      quality: qualitySchema,
      feedback: feedbackSchema,
      score: scoreSchema,
      careerChange: careerChangeSchema,
    })
    .nullable(),
  history: z.array(resolvedEventSchema).max(256),
  scorePreview: z.number().int().min(0),
  optimalStreak: z.number().int().min(0),
  completion: z
    .object({
      totalScore: z.number().int().min(0),
      profile: z.object({
        profileId: profileSchema,
        evidence: z.array(z.object({ key: z.string(), value: z.string() })),
        runnerUpId: profileSchema.nullable(),
      }),
      career: careerSchema,
      eventsPlayed: z.number().int().min(0),
    })
    .nullable(),
})

export const snapshotSchema = z.object({
  schemaVersion: z.number().int().min(1),
  state: stateSchema,
})

export interface RunSnapshot {
  readonly schemaVersion: number
  readonly state: unknown
}

/**
 * Converts `undefined` to `null`.
 *
 * `undefined` disappears through `JSON.stringify`, which would turn an absent
 * optional field into a missing key and make validation ambiguous. Persisted
 * absence is represented explicitly.
 */
function orNull<T>(value: T | undefined): T | null {
  return value ?? null
}

/**
 * Rebuilds feedback so absent optional fields are genuinely absent.
 *
 * `exactOptionalPropertyTypes` distinguishes "key missing" from "key present
 * and undefined"; a parsed object carries the latter, the domain type wants the
 * former.
 */
function restoreFeedback(raw: {
  outcomeKey: string
  facts: readonly { label: string; value: string }[]
  violatedConstraint?: string | undefined
  optimalComparison?: string | undefined
  consequence?: string | undefined
  stamp?: string | undefined
}): ChallengeFeedback {
  return {
    outcomeKey: raw.outcomeKey,
    facts: raw.facts,
    ...(raw.violatedConstraint === undefined
      ? {}
      : { violatedConstraint: raw.violatedConstraint }),
    ...(raw.optimalComparison === undefined
      ? {}
      : { optimalComparison: raw.optimalComparison }),
    ...(raw.consequence === undefined ? {} : { consequence: raw.consequence }),
    ...(raw.stamp === undefined ? {} : { stamp: raw.stamp }),
  }
}

/** Persisted form of a change report: absent optionals become explicit nulls. */
function careerChangeToJson(change: CareerChange): {
  promedio: { from: number | null; to: number } | null
  equipo: { from: number | null; to: number; delta: number } | null
  aura: { delta: number; total: number } | null
  estilo: { axis: EstiloAxis } | null
} {
  return {
    promedio: orNull(change.promedio),
    equipo: orNull(change.equipo),
    aura: orNull(change.aura),
    estilo: orNull(change.estilo),
  }
}

/**
 * Rebuilds a change report so absent dimensions are genuinely absent.
 *
 * `exactOptionalPropertyTypes` distinguishes "key missing" from "key present and
 * undefined", and the whole point of the report is that a missing key means the
 * dimension did not move.
 */
function restoreCareerChange(raw: {
  promedio: { from: number | null; to: number } | null
  equipo: { from: number | null; to: number; delta: number } | null
  aura: { delta: number; total: number } | null
  estilo: { axis: EstiloAxis } | null
}): CareerChange {
  return {
    ...(raw.promedio === null ? {} : { promedio: raw.promedio }),
    ...(raw.equipo === null ? {} : { equipo: raw.equipo }),
    ...(raw.aura === null ? {} : { aura: raw.aura }),
    ...(raw.estilo === null ? {} : { estilo: raw.estilo }),
  }
}

/** Deep copy of a career, so the snapshot never aliases live state. */
function careerToJson(career: CareerState): {
  grades: number[]
  equipo: number | null
  aura: number | null
  estilo: Estilo
  estiloEvidence: number
  mastery: Partial<Record<MathCategory, number>>
} {
  return {
    grades: [...career.grades],
    equipo: career.equipo,
    aura: career.aura,
    estilo: { ...career.estilo },
    estiloEvidence: career.estiloEvidence,
    mastery: { ...career.mastery },
  }
}

export function serializeSnapshot(state: RunState): RunSnapshot {
  const active = state.activeEvent
  const feedback = state.pendingFeedback
  const completion = state.completion

  return {
    schemaVersion: SNAPSHOT_SCHEMA_VERSION,
    state: {
      descriptor: { ...state.descriptor },
      phase: state.phase,
      status: state.status,
      stage: state.stage,
      eventIndex: state.eventIndex,
      stageEventIndex: state.stageEventIndex,
      career: careerToJson(state.career),
      flags: { ...state.flags },
      difficulty: {
        current: state.difficulty.current,
        recent: [...state.difficulty.recent],
      },
      selection: { lastSeenAt: { ...state.selection.lastSeenAt } },
      seenStorylets: [...state.seenStorylets],
      qualityHistory: [...state.qualityHistory],
      activeEvent:
        active === undefined
          ? null
          : {
              storyletId: active.storyletId,
              eyebrow: active.eyebrow,
              title: active.title,
              text: active.text,
              challenge: orNull(active.challenge),
              revealed: [...active.revealed],
              toolsUsed: [...active.toolsUsed],
              careerChange: careerChangeToJson(active.careerChange),
            },
      pendingFeedback:
        feedback === undefined
          ? null
          : {
              instanceId: feedback.instanceId,
              quality: feedback.quality,
              feedback: feedback.feedback,
              score: feedback.score,
              careerChange: careerChangeToJson(feedback.careerChange),
            },
      history: state.history.map((entry) => ({
        ...entry,
        challengeId: orNull(entry.challengeId),
        instanceId: orNull(entry.instanceId),
        quality: orNull(entry.quality),
        metrics: orNull(entry.metrics),
      })),
      scorePreview: state.scorePreview,
      optimalStreak: state.optimalStreak,
      completion:
        completion === undefined
          ? null
          : {
              totalScore: completion.totalScore,
              profile: {
                ...completion.profile,
                runnerUpId: orNull(completion.profile.runnerUpId),
              },
              career: careerToJson(completion.career),
              eventsPlayed: completion.eventsPlayed,
            },
    },
  }
}

/**
 * Restores a snapshot, refusing anything incompatible or malformed.
 *
 * `expected` carries the engine, ruleset and content versions the caller is
 * prepared to run. A mismatch is rejected: `game-engine.md` forbids silently
 * migrating an active run between incompatible rulesets.
 */
export function restoreSnapshot(
  input: unknown,
  expected: VersionTriple,
): Result<RunState, EngineRejection> {
  const parsed = snapshotSchema.safeParse(input)

  if (!parsed.success) {
    const detail = parsed.error.issues
      .map((issue) => `${issue.path.join('.') || 'snapshot'}: ${issue.message}`)
      .join('; ')
    return err({ kind: 'corrupted-snapshot', detail })
  }

  if (parsed.data.schemaVersion !== SNAPSHOT_SCHEMA_VERSION) {
    return err({
      kind: 'unsupported-version',
      field: 'snapshotSchemaVersion',
      expected: String(SNAPSHOT_SCHEMA_VERSION),
      received: String(parsed.data.schemaVersion),
    })
  }

  const raw = parsed.data.state
  const compatibility = assertCompatibleVersions(expected, {
    gameVersion: raw.descriptor.gameVersion,
    rulesetVersion: raw.descriptor.rulesetVersion,
    contentVersion: raw.descriptor.contentVersion,
  })
  if (!compatibility.ok) {
    return compatibility
  }

  const state: RunState = {
    descriptor: {
      runId: toRunId(raw.descriptor.runId),
      seed: toRunSeed(raw.descriptor.seed),
      mode: raw.descriptor.mode,
      difficulty: raw.descriptor.difficulty,
      gameVersion: raw.descriptor.gameVersion,
      rulesetVersion: raw.descriptor.rulesetVersion,
      contentVersion: raw.descriptor.contentVersion,
    },
    phase: raw.phase,
    status: raw.status,
    stage: raw.stage,
    eventIndex: raw.eventIndex,
    stageEventIndex: raw.stageEventIndex,
    career: raw.career,
    flags: raw.flags,
    difficulty: {
      current: raw.difficulty.current,
      recent: raw.difficulty.recent,
    },
    selection: raw.selection,
    seenStorylets: raw.seenStorylets.map(toStoryletId),
    qualityHistory: raw.qualityHistory,
    activeEvent:
      raw.activeEvent === null
        ? undefined
        : {
            storyletId: toStoryletId(raw.activeEvent.storyletId),
            eyebrow: raw.activeEvent.eyebrow,
            title: raw.activeEvent.title,
            text: raw.activeEvent.text,
            challenge:
              raw.activeEvent.challenge === null
                ? undefined
                : {
                    instanceId: toChallengeInstanceId(
                      raw.activeEvent.challenge.instanceId,
                    ),
                    familyId: toScenarioFamilyId(
                      raw.activeEvent.challenge.familyId,
                    ),
                    templateId: toChallengeId(
                      raw.activeEvent.challenge.templateId,
                    ),
                    variantId: toVariantId(raw.activeEvent.challenge.variantId),
                    stageId: raw.activeEvent.challenge.stageId,
                    eventIndex: raw.activeEvent.challenge.eventIndex,
                    difficulty: raw.activeEvent.challenge.difficulty,
                  },
            revealed: raw.activeEvent.revealed,
            toolsUsed: raw.activeEvent.toolsUsed,
            careerChange: restoreCareerChange(raw.activeEvent.careerChange),
          },
    pendingFeedback:
      raw.pendingFeedback === null
        ? undefined
        : {
            instanceId: toChallengeInstanceId(raw.pendingFeedback.instanceId),
            quality: raw.pendingFeedback.quality,
            feedback: restoreFeedback(raw.pendingFeedback.feedback),
            score: raw.pendingFeedback.score,
            careerChange: restoreCareerChange(raw.pendingFeedback.careerChange),
          },
    history: raw.history.map((entry) => ({
      sequence: entry.sequence,
      stage: entry.stage,
      eventIndex: entry.eventIndex,
      storyletId: toStoryletId(entry.storyletId),
      challengeId:
        entry.challengeId === null
          ? undefined
          : toChallengeId(entry.challengeId),
      instanceId:
        entry.instanceId === null
          ? undefined
          : toChallengeInstanceId(entry.instanceId),
      difficulty: entry.difficulty,
      quality: entry.quality ?? undefined,
      metrics: entry.metrics ?? undefined,
      points: entry.points,
      revealedCount: entry.revealedCount,
    })),
    scorePreview: raw.scorePreview,
    optimalStreak: raw.optimalStreak,
    completion:
      raw.completion === null
        ? undefined
        : {
            totalScore: raw.completion.totalScore,
            profile: {
              profileId: raw.completion.profile.profileId,
              evidence: raw.completion.profile.evidence,
              runnerUpId: raw.completion.profile.runnerUpId ?? undefined,
            },
            career: raw.completion.career,
            eventsPlayed: raw.completion.eventsPlayed,
          },
  }

  // Field-level validation cannot see whether the fields agree with each other.
  // A snapshot that satisfies the schema while contradicting itself restores
  // into a run that cannot progress, so it is refused here rather than handed
  // back as a playable state.
  const issues = runStateIssues(state)
  if (issues.length > 0) {
    return err({
      kind: 'corrupted-snapshot',
      detail: issues.join('; '),
    })
  }

  return ok(state)
}
