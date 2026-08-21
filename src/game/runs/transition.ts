/**
 * The transition function.
 *
 * `transition(state, command, dependencies)` is the only place run state
 * changes. It is pure: given the same state, command and dependencies it always
 * returns the same next state and the same events, and it performs no I/O, reads
 * no clock and draws no ambient randomness.
 *
 * Invalid commands are refused with a typed rejection rather than being ignored,
 * so a client cannot answer twice, answer a stale challenge, skip feedback or
 * resurrect a finished run.
 */

import { assertNever } from '../core/exhaustive'
import { EngineInvariantError } from '../core/invariant'
import { err, ok, type Result } from '../core/result'
import type { EngineRejection } from '../core/errors'
import {
  toChallengeInstanceId,
  type ChallengeInstanceId,
  type StoryletId,
} from '../core/branded'
import type {
  ChallengeInstanceRef,
  MaterializedChallenge,
  PublicChallengeView,
} from '../challenges/contracts'
import type { ChallengeRegistry } from '../challenges/registry'
import type { DifficultyLevel } from '../challenges/taxonomy'
import { initialDifficultyState } from '../difficulty/policy'
import { applyEffects } from '../narrative/effects'
import type { NarrativeContext } from '../narrative/conditions'
import {
  emptySelectionState,
  recordSelection,
  selectStorylet,
} from '../narrative/selection'
import type { Storylet } from '../narrative/storylet'
import { emptyDimensions, type ProfileDimensions } from '../profiles/policy'
import type { StageConfig } from '../progression/stages'
import {
  applyStatEffects,
  initialStats,
  readStat,
  VISIBLE_STATS,
  type PlayerStats,
} from '../progression/stats'
import { createRng } from '../random/rng'
import {
  firstStage,
  nextStageConfig,
  stageConfig,
  type Ruleset,
} from '../ruleset/ruleset'
import type { GameCommand } from './commands'
import type { DomainEvent, TransitionResult } from './events'
import type {
  ActiveEvent,
  ResolvedEvent,
  RunDescriptor,
  RunState,
} from './state'

export interface EngineDependencies {
  readonly ruleset: Ruleset
  readonly challenges: ChallengeRegistry
  readonly storylets: readonly Storylet[]
}

/** Substream address of the challenge generated at a given event. */
function challengeRngPath(
  ref: ChallengeInstanceRef,
): readonly (string | number)[] {
  return [
    'stage',
    ref.stageId,
    'event',
    ref.eventIndex,
    'challenge',
    ref.definitionId,
    'difficulty',
    ref.difficulty,
  ]
}

/**
 * Recomputes the model behind a challenge reference.
 *
 * Generation is deterministic in the reference, so this can be called any number
 * of times — during play, on resume, or on the server during replay — and always
 * produces the same challenge.
 */
export function materializeChallenge(
  descriptor: RunDescriptor,
  ref: ChallengeInstanceRef,
  dependencies: EngineDependencies,
): Result<MaterializedChallenge, EngineRejection> {
  const definition = dependencies.challenges.get(ref.definitionId)

  if (definition === undefined) {
    return err({ kind: 'unknown-challenge', challengeId: ref.definitionId })
  }

  return ok(
    definition.materialize(ref, {
      rng: createRng(descriptor.seed, challengeRngPath(ref)),
      difficulty: ref.difficulty,
    }),
  )
}

/** Public view of whatever the run is currently showing. */
export function activeChallengeView(
  state: RunState,
  dependencies: EngineDependencies,
): Result<PublicChallengeView | undefined, EngineRejection> {
  const active = state.activeEvent

  if (active?.challenge === undefined) {
    return ok(undefined)
  }

  const materialized = materializeChallenge(
    state.descriptor,
    active.challenge,
    dependencies,
  )
  if (!materialized.ok) {
    return materialized
  }

  return ok({
    ref: active.challenge,
    narrative: materialized.value.narrative,
    interaction: materialized.value.present(active.revealed),
    tools: materialized.value.tools,
  })
}

function narrativeContext(state: RunState): NarrativeContext {
  return {
    stage: state.stage,
    eventIndex: state.eventIndex,
    stats: state.stats,
    flags: state.flags,
    seenStorylets: state.seenStorylets,
    qualityHistory: state.qualityHistory,
  }
}

function statChangeEvents(
  before: PlayerStats,
  after: PlayerStats,
): readonly DomainEvent[] {
  return VISIBLE_STATS.filter(
    (stat) => readStat(before, stat) !== readStat(after, stat),
  ).map((stat) => ({
    type: 'stat.changed' as const,
    stat,
    from: readStat(before, stat),
    to: readStat(after, stat),
  }))
}

function requireStage(ruleset: Ruleset, state: RunState): StageConfig {
  const config = stageConfig(ruleset, state.stage)
  if (config === undefined) {
    throw new EngineInvariantError(
      `run is in stage ${state.stage}, which the ruleset does not define`,
    )
  }
  return config
}

/**
 * Opens the next event.
 *
 * Selects a storylet, applies its effects, and — when the storylet carries a
 * challenge pool — picks and generates the challenge. Returns the run in either
 * the `narrative` or the `challenge` phase.
 */
function beginEvent(
  state: RunState,
  dependencies: EngineDependencies,
): TransitionResult {
  const stage = requireStage(dependencies.ruleset, state)
  const events: DomainEvent[] = []

  const selectionRng = createRng(state.descriptor.seed, [
    'stage',
    state.stage,
    'event',
    state.eventIndex,
    'storylet',
  ])

  const outcome = selectStorylet(
    dependencies.storylets,
    narrativeContext(state),
    state.selection,
    dependencies.ruleset.narrative,
    selectionRng,
  )

  if (outcome.kind === 'empty-pool') {
    // Content cannot serve this stage. The run ends cleanly rather than
    // looping, and the fact is reported so validation and simulation can see it.
    events.push({ type: 'narrative.exhausted', stage: state.stage })
    return completeRun({ ...state }, dependencies, events)
  }

  const storylet = outcome.storylet
  events.push({
    type: 'storylet.selected',
    storyletId: storylet.id,
    stage: state.stage,
    eventIndex: state.eventIndex,
  })

  const applied = applyEffects(
    { stats: state.stats, flags: state.flags },
    storylet.effects,
  )
  events.push(...statChangeEvents(state.stats, applied.stats))
  for (const effect of storylet.effects) {
    if (effect.kind === 'flag-set') {
      events.push({ type: 'flag.set', flag: effect.flag, value: effect.value })
    }
    if (effect.kind === 'flag-clear') {
      events.push({ type: 'flag.cleared', flag: effect.flag })
    }
  }

  const seenStorylets: readonly StoryletId[] = state.seenStorylets.includes(
    storylet.id,
  )
    ? state.seenStorylets
    : [...state.seenStorylets, storylet.id]

  const baseEvent: ActiveEvent = {
    storyletId: storylet.id,
    title: storylet.title,
    text: storylet.text,
    challenge: undefined,
    revealed: [],
    toolsUsed: [],
  }

  const common = {
    ...state,
    stats: applied.stats,
    flags: applied.flags,
    selection: recordSelection(state.selection, storylet.id, state.eventIndex),
    seenStorylets,
  }

  if (storylet.challengePool.length === 0) {
    return {
      state: { ...common, phase: 'narrative', activeEvent: baseEvent },
      events,
      effects: events.map((event) => ({ type: 'track', event })),
    }
  }

  // Pick from the pool on its own substream so adding a challenge to a pool
  // does not disturb storylet selection.
  const pickRng = createRng(state.descriptor.seed, [
    'stage',
    state.stage,
    'event',
    state.eventIndex,
    'challenge-pick',
  ])
  const eligible = storylet.challengePool.filter(
    (id) => dependencies.challenges.get(id) !== undefined,
  )

  if (eligible.length === 0) {
    throw new EngineInvariantError(
      `storylet ${storylet.id} references no registered challenge; content validation should have rejected it`,
    )
  }

  const definitionId = pickRng.pick(eligible)
  const difficulty: DifficultyLevel =
    state.descriptor.difficulty === 'fixed'
      ? stage.targetDifficulty
      : state.difficulty.current

  const instanceId: ChallengeInstanceId = toChallengeInstanceId(
    `${state.stage}:${String(state.eventIndex)}:${definitionId}`,
  )
  const ref: ChallengeInstanceRef = {
    instanceId,
    definitionId,
    stageId: state.stage,
    eventIndex: state.eventIndex,
    difficulty,
  }

  events.push({
    type: 'challenge.generated',
    challengeId: definitionId,
    instanceId,
    difficulty,
  })
  events.push({ type: 'challenge.presented', instanceId })

  return {
    state: {
      ...common,
      phase: 'challenge',
      activeEvent: { ...baseEvent, challenge: ref },
    },
    events,
    effects: events.map((event) => ({ type: 'track', event })),
  }
}

/** Aggregates the hidden reasoning dimensions used by the profile policy. */
function computeDimensions(state: RunState): ProfileDimensions {
  const resolved = state.history.filter(
    (entry) => entry.metrics !== undefined && entry.quality !== undefined,
  )

  if (resolved.length === 0) {
    return emptyDimensions()
  }

  const average = (pick: (entry: ResolvedEvent) => number): number =>
    resolved.reduce((total, entry) => total + pick(entry), 0) / resolved.length

  const efficiency = average((entry) => entry.metrics?.efficiency ?? 0)
  const precision = average((entry) => entry.metrics?.precision ?? 0)
  const risk = average((entry) => entry.metrics?.risk ?? 0)
  const informationUse = average((entry) => entry.metrics?.informationUse ?? 0)

  // Stability measures how consistent quality was: the mean absolute deviation
  // of precision, inverted so steady play scores high.
  const deviation = average((entry) =>
    Math.abs((entry.metrics?.precision ?? 0) - precision),
  )

  return {
    efficiency,
    precision,
    risk,
    informationUse,
    // Team and initiative are the visible stats the narrative moved, normalized
    // against their documented bounds.
    collaboration: state.stats.team / 100,
    initiative: state.stats.initiative / 100,
    stability: Math.max(0, 1 - deviation * 2),
  }
}

function completeRun(
  state: RunState,
  dependencies: EngineDependencies,
  priorEvents: readonly DomainEvent[],
): TransitionResult {
  const profile = dependencies.ruleset.profile.classify(
    computeDimensions(state),
    state.stats,
  )

  const completed: RunState = {
    ...state,
    phase: 'completed',
    status: 'completed',
    activeEvent: undefined,
    pendingFeedback: undefined,
    completion: {
      totalScore: state.scorePreview,
      profile,
      stats: state.stats,
      eventsPlayed: state.history.length,
    },
  }

  const events: DomainEvent[] = [
    ...priorEvents,
    { type: 'stage.completed', stage: state.stage },
    {
      type: 'run.completed',
      totalScore: completed.scorePreview,
      profile: profile.profileId,
    },
  ]

  return {
    state: completed,
    events,
    effects: [
      ...events.map((event) => ({ type: 'track' as const, event })),
      { type: 'persist-snapshot', reason: 'run-completed' },
    ],
  }
}

/**
 * Moves past a resolved event.
 *
 * Advances within the stage, rolls over to the next stage when the stage's
 * event budget is spent, and completes the run after the final stage.
 */
function advance(
  state: RunState,
  dependencies: EngineDependencies,
  priorEvents: readonly DomainEvent[],
): TransitionResult {
  const stage = requireStage(dependencies.ruleset, state)
  const events = [...priorEvents]

  const nextStageEventIndex = state.stageEventIndex + 1

  if (nextStageEventIndex < stage.eventCount) {
    const opened = beginEvent(
      {
        ...state,
        eventIndex: state.eventIndex + 1,
        stageEventIndex: nextStageEventIndex,
        activeEvent: undefined,
        pendingFeedback: undefined,
      },
      dependencies,
    )
    return {
      state: opened.state,
      events: [...events, ...opened.events],
      effects: [
        ...events.map((event) => ({ type: 'track' as const, event })),
        ...opened.effects,
      ],
    }
  }

  events.push({ type: 'stage.completed', stage: state.stage })
  const following = nextStageConfig(dependencies.ruleset, state.stage)

  if (following === undefined) {
    return completeRun(state, dependencies, events)
  }

  const difficulty = dependencies.ruleset.difficulty.initialFor(
    following,
    state.difficulty,
  )

  events.push({ type: 'stage.started', stage: following.id })

  const opened = beginEvent(
    {
      ...state,
      stage: following.id,
      eventIndex: state.eventIndex + 1,
      stageEventIndex: 0,
      difficulty: { current: difficulty, recent: [] },
      activeEvent: undefined,
      pendingFeedback: undefined,
    },
    dependencies,
  )

  return {
    state: opened.state,
    events: [...events, ...opened.events],
    effects: [
      ...events.map((event) => ({ type: 'track' as const, event })),
      ...opened.effects,
    ],
  }
}

/** Creates a run and opens its first event. */
export function createRun(
  descriptor: RunDescriptor,
  dependencies: EngineDependencies,
): Result<TransitionResult, EngineRejection> {
  const stage = firstStage(dependencies.ruleset)

  if (stage === undefined) {
    return err({
      kind: 'invalid-ruleset',
      detail: 'the ruleset defines no stages',
    })
  }

  if (descriptor.rulesetVersion !== dependencies.ruleset.version) {
    return err({
      kind: 'unsupported-version',
      field: 'rulesetVersion',
      expected: dependencies.ruleset.version,
      received: descriptor.rulesetVersion,
    })
  }
  if (descriptor.contentVersion !== dependencies.ruleset.contentVersion) {
    return err({
      kind: 'unsupported-version',
      field: 'contentVersion',
      expected: dependencies.ruleset.contentVersion,
      received: descriptor.contentVersion,
    })
  }

  const seeded: RunState = {
    descriptor,
    phase: 'narrative',
    status: 'active',
    stage: stage.id,
    eventIndex: 0,
    stageEventIndex: 0,
    stats: initialStats(),
    flags: {},
    difficulty: initialDifficultyState(
      dependencies.ruleset.difficulty.initialFor(stage, undefined),
    ),
    selection: emptySelectionState(),
    seenStorylets: [],
    qualityHistory: [],
    activeEvent: undefined,
    pendingFeedback: undefined,
    history: [],
    scorePreview: 0,
    optimalStreak: 0,
    completion: undefined,
  }

  const opened = beginEvent(seeded, dependencies)
  const events: DomainEvent[] = [
    { type: 'run.started', runId: descriptor.runId },
    { type: 'stage.started', stage: stage.id },
    ...opened.events,
  ]

  return ok({
    state: opened.state,
    events,
    effects: events.map((event) => ({ type: 'track', event })),
  })
}

function rejectTransition(
  state: RunState,
  command: GameCommand,
): Result<TransitionResult, EngineRejection> {
  return err({
    kind: 'invalid-transition',
    phase: state.phase,
    command: command.type,
  })
}

function handleAnswer(
  state: RunState,
  command: Extract<GameCommand, { type: 'ANSWER' }>,
  dependencies: EngineDependencies,
): Result<TransitionResult, EngineRejection> {
  const active = state.activeEvent

  if (state.phase !== 'challenge' || active?.challenge === undefined) {
    return rejectTransition(state, command)
  }

  if (active.challenge.instanceId !== command.instanceId) {
    return err({
      kind: 'stale-challenge-answer',
      expected: active.challenge.instanceId,
      received: command.instanceId,
    })
  }

  const materialized = materializeChallenge(
    state.descriptor,
    active.challenge,
    dependencies,
  )
  if (!materialized.ok) {
    return materialized
  }

  const evaluation = materialized.value.evaluate(
    command.answer,
    active.revealed,
  )
  if (!evaluation.ok) {
    return evaluation
  }

  const result = evaluation.value
  const score = dependencies.ruleset.scoring.scoreEvent({
    quality: result.quality,
    difficulty: active.challenge.difficulty,
    metrics: result.metrics,
    optimalStreak: state.optimalStreak,
  })

  const withStats = applyStatEffects(state.stats, result.statEffects)
  const flags = result.flagEffects.reduce(
    (current, effect) => ({ ...current, [effect.flag]: effect.value }),
    state.flags,
  )

  const events: DomainEvent[] = [
    { type: 'challenge.answered', instanceId: command.instanceId },
    {
      type: 'challenge.evaluated',
      instanceId: command.instanceId,
      quality: result.quality,
    },
    {
      type: 'feedback.created',
      instanceId: command.instanceId,
      outcomeKey: result.feedback.outcomeKey,
    },
    {
      type: 'score.awarded',
      instanceId: command.instanceId,
      points: score.totalPoints,
    },
    ...statChangeEvents(state.stats, withStats),
    ...result.flagEffects.map((effect) => ({
      type: 'flag.set' as const,
      flag: effect.flag,
      value: effect.value,
    })),
  ]

  const qualityHistory = [...state.qualityHistory, result.quality]
  const difficultyBefore = state.difficulty.current
  const stage = requireStage(dependencies.ruleset, state)
  const difficulty =
    state.descriptor.difficulty === 'adaptive'
      ? dependencies.ruleset.difficulty.next(
          {
            current: state.difficulty.current,
            recent: [...state.difficulty.recent, result.quality],
          },
          stage,
        )
      : state.difficulty

  if (difficulty.current !== difficultyBefore) {
    events.push({
      type: 'difficulty.changed',
      from: difficultyBefore,
      to: difficulty.current,
    })
  }

  const resolved: ResolvedEvent = {
    sequence: state.history.length,
    stage: state.stage,
    eventIndex: state.eventIndex,
    storyletId: active.storyletId,
    challengeId: active.challenge.definitionId,
    instanceId: active.challenge.instanceId,
    difficulty: active.challenge.difficulty,
    quality: result.quality,
    metrics: result.metrics,
    points: score.totalPoints,
    revealedCount: active.revealed.length,
  }

  return ok({
    state: {
      ...state,
      phase: 'feedback',
      stats: withStats,
      flags,
      qualityHistory,
      difficulty,
      history: [...state.history, resolved],
      scorePreview: state.scorePreview + score.totalPoints,
      optimalStreak: result.quality === 'optimal' ? state.optimalStreak + 1 : 0,
      pendingFeedback: {
        instanceId: command.instanceId,
        quality: result.quality,
        feedback: result.feedback,
        score,
      },
    },
    events,
    effects: [
      ...events.map((event) => ({ type: 'track' as const, event })),
      { type: 'persist-snapshot', reason: 'event-resolved' },
    ],
  })
}

/**
 * Applies one command.
 *
 * Pure in `state`, `command` and `dependencies`: no clock, no ambient RNG, no
 * I/O. Every rejection is a value, so a caller can distinguish "not allowed" from
 * "something is broken".
 */
export function transition(
  state: RunState,
  command: GameCommand,
  dependencies: EngineDependencies,
): Result<TransitionResult, EngineRejection> {
  if (state.status !== 'active') {
    return err({ kind: 'run-already-completed' })
  }

  switch (command.type) {
    case 'ANSWER':
      return handleAnswer(state, command, dependencies)

    case 'REQUEST_INFO': {
      const active = state.activeEvent
      if (state.phase !== 'challenge' || active?.challenge === undefined) {
        return rejectTransition(state, command)
      }
      if (active.challenge.instanceId !== command.instanceId) {
        return err({
          kind: 'stale-challenge-answer',
          expected: active.challenge.instanceId,
          received: command.instanceId,
        })
      }

      const materialized = materializeChallenge(
        state.descriptor,
        active.challenge,
        dependencies,
      )
      if (!materialized.ok) {
        return materialized
      }
      if (
        !materialized.value.requestable.some(
          (entry) => entry.key === command.key,
        )
      ) {
        return err({ kind: 'unknown-information-key', key: command.key })
      }
      if (active.revealed.includes(command.key)) {
        // Revealing twice is a no-op rather than an error: the datum is already
        // on screen and the client may simply have retried.
        return ok({ state, events: [], effects: [] })
      }

      const events: readonly DomainEvent[] = [
        {
          type: 'information.requested',
          instanceId: command.instanceId,
          key: command.key,
        },
      ]

      return ok({
        state: {
          ...state,
          activeEvent: {
            ...active,
            revealed: [...active.revealed, command.key],
          },
        },
        events,
        effects: events.map((event) => ({ type: 'track', event })),
      })
    }

    case 'USE_TOOL': {
      const active = state.activeEvent
      if (state.phase !== 'challenge' || active?.challenge === undefined) {
        return rejectTransition(state, command)
      }
      if (active.challenge.instanceId !== command.instanceId) {
        return err({
          kind: 'stale-challenge-answer',
          expected: active.challenge.instanceId,
          received: command.instanceId,
        })
      }

      const materialized = materializeChallenge(
        state.descriptor,
        active.challenge,
        dependencies,
      )
      if (!materialized.ok) {
        return materialized
      }
      if (!materialized.value.tools.includes(command.tool)) {
        return err({ kind: 'tool-not-available', tool: command.tool })
      }

      const events: readonly DomainEvent[] = [
        {
          type: 'tool.used',
          instanceId: command.instanceId,
          tool: command.tool,
        },
      ]
      const toolsUsed = active.toolsUsed.includes(command.tool)
        ? active.toolsUsed
        : [...active.toolsUsed, command.tool]

      return ok({
        state: { ...state, activeEvent: { ...active, toolsUsed } },
        events,
        effects: events.map((event) => ({ type: 'track', event })),
      })
    }

    case 'CONTINUE': {
      if (state.phase === 'feedback') {
        return ok(advance(state, dependencies, []))
      }

      if (state.phase === 'narrative') {
        const active = state.activeEvent
        if (active === undefined) {
          return rejectTransition(state, command)
        }
        const resolved: ResolvedEvent = {
          sequence: state.history.length,
          stage: state.stage,
          eventIndex: state.eventIndex,
          storyletId: active.storyletId,
          challengeId: undefined,
          instanceId: undefined,
          difficulty: state.difficulty.current,
          quality: undefined,
          metrics: undefined,
          points: 0,
          revealedCount: 0,
        }
        return ok(
          advance(
            { ...state, history: [...state.history, resolved] },
            dependencies,
            [],
          ),
        )
      }

      return rejectTransition(state, command)
    }

    case 'ABANDON': {
      const events: readonly DomainEvent[] = [{ type: 'run.abandoned' }]
      return ok({
        state: {
          ...state,
          phase: 'completed',
          status: 'abandoned',
          activeEvent: undefined,
          pendingFeedback: undefined,
        },
        events,
        effects: [
          ...events.map((event) => ({ type: 'track' as const, event })),
          { type: 'persist-snapshot', reason: 'run-completed' },
        ],
      })
    }

    default:
      return assertNever(command)
  }
}
