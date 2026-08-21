import { describe, expect, it } from 'vitest'

import {
  activeChallengeView,
  appendAction,
  canonicalize,
  createRun,
  emptyActionLog,
  isErr,
  isOk,
  parseActionLog,
  replayRun,
  restoreSnapshot,
  serializeActionLog,
  serializeSnapshot,
  transition,
  type GameCommand,
  type RunState,
} from '@/game'
import {
  createDevelopmentDependencies,
  developmentRunDescriptor,
  simulateRun,
  synthesizeAnswer,
} from '@/game/testing'
import { createRng } from '@/game/random/rng'

const dependencies = createDevelopmentDependencies()

function descriptorFor(seed: string) {
  return developmentRunDescriptor(seed, dependencies)
}

describe('engine vertical slice', () => {
  it('plays a development run from creation to graduation', () => {
    const descriptor = descriptorFor('integration-1')
    const created = createRun(descriptor, dependencies)

    expect(isOk(created)).toBe(true)
    if (!created.ok) return

    expect(created.value.state.stage).toBe('grade-7')
    expect(created.value.events.map((event) => event.type)).toContain(
      'run.started',
    )

    const outcome = simulateRun(descriptor, dependencies)
    expect(isOk(outcome)).toBe(true)
    if (!outcome.ok) return

    const { state } = outcome.value
    expect(state.status).toBe('completed')
    expect(state.phase).toBe('completed')
    expect(state.completion).toBeDefined()

    // Every stage in the ruleset is visited, and the run resolves exactly the
    // number of events the stages budget for.
    const expectedEvents = dependencies.ruleset.stages.reduce(
      (total, stage) => total + stage.eventCount,
      0,
    )
    expect(state.history).toHaveLength(expectedEvents)
    expect(new Set(state.history.map((entry) => entry.stage)).size).toBe(
      dependencies.ruleset.stages.length,
    )
    expect(state.completion?.profile.profileId).toBeTruthy()
  })

  it('walks the documented lifecycle one command at a time', () => {
    const descriptor = descriptorFor('integration-lifecycle')
    const created = createRun(descriptor, dependencies)
    if (!created.ok) throw new Error('run creation failed')

    let state = created.value.state
    // The development pool opens on the welcome storylet, which is narrative.
    expect(state.phase).toBe('narrative')

    const continued = transition(state, { type: 'CONTINUE' }, dependencies)
    if (!continued.ok) throw new Error('continue rejected')
    state = continued.value.state
    expect(state.phase).toBe('challenge')

    const view = activeChallengeView(state, dependencies)
    if (!view.ok || view.value === undefined) throw new Error('no active view')

    // The public view carries narrative and interaction, never a solution.
    expect(view.value.narrative.title.length).toBeGreaterThan(0)
    expect(JSON.stringify(view.value)).not.toContain('correctAnswer')

    const answer = synthesizeAnswer(
      view.value.interaction,
      createRng(descriptor.seed, ['test', 'answer']),
    )
    const answered = transition(
      state,
      { type: 'ANSWER', instanceId: view.value.ref.instanceId, answer },
      dependencies,
    )
    if (!answered.ok) throw new Error('answer rejected')
    state = answered.value.state

    expect(state.phase).toBe('feedback')
    expect(state.pendingFeedback).toBeDefined()
    expect(state.pendingFeedback?.feedback.facts.length).toBeGreaterThan(0)
    expect(answered.value.events.map((event) => event.type)).toEqual(
      expect.arrayContaining([
        'challenge.answered',
        'challenge.evaluated',
        'feedback.created',
        'score.awarded',
      ]),
    )

    // A snapshot is requested exactly when an event resolves.
    expect(
      answered.value.effects.some(
        (effect) =>
          effect.type === 'persist-snapshot' &&
          effect.reason === 'event-resolved',
      ),
    ).toBe(true)
  })

  it('reproduces a run exactly through the serialized action log', () => {
    const descriptor = descriptorFor('integration-replay')
    const played = simulateRun(descriptor, dependencies)
    if (!played.ok) throw new Error('simulation failed')

    const transported = parseActionLog(serializeActionLog(played.value.log))
    expect(isOk(transported)).toBe(true)
    if (!transported.ok) return

    const replayed = replayRun(transported.value, dependencies)
    expect(isOk(replayed)).toBe(true)
    if (!replayed.ok) return

    expect(canonicalize(replayed.value.state)).toBe(
      canonicalize(played.value.state),
    )
    expect(replayed.value.state.scorePreview).toBe(
      played.value.state.scorePreview,
    )
    expect(replayed.value.state.completion?.profile.profileId).toBe(
      played.value.state.completion?.profile.profileId,
    )
  })

  it('round-trips a snapshot through JSON without losing information', () => {
    const descriptor = descriptorFor('integration-snapshot')
    const played = simulateRun(descriptor, dependencies)
    if (!played.ok) throw new Error('simulation failed')

    const wire: unknown = JSON.parse(
      JSON.stringify(serializeSnapshot(played.value.state)),
    )
    const restored = restoreSnapshot(wire, {
      gameVersion: descriptor.gameVersion,
      rulesetVersion: descriptor.rulesetVersion,
      contentVersion: descriptor.contentVersion,
    })

    expect(isOk(restored)).toBe(true)
    if (!restored.ok) return

    expect(canonicalize(restored.value)).toBe(canonicalize(played.value.state))
  })

  it('resumes mid-run from a snapshot and reaches the same ending', () => {
    const descriptor = descriptorFor('integration-resume')
    const created = createRun(descriptor, dependencies)
    if (!created.ok) throw new Error('run creation failed')

    let state: RunState = created.value.state
    let log = emptyActionLog(descriptor)
    const commands: GameCommand[] = []

    // Play a few events, then snapshot.
    const rng = createRng(descriptor.seed, ['test', 'resume'])
    for (let step = 0; step < 6 && state.status === 'active'; step += 1) {
      let command: GameCommand
      if (state.phase === 'challenge') {
        const view = activeChallengeView(state, dependencies)
        if (!view.ok || view.value === undefined) break
        command = {
          type: 'ANSWER',
          instanceId: view.value.ref.instanceId,
          answer: synthesizeAnswer(view.value.interaction, rng.derive(step)),
        }
      } else {
        command = { type: 'CONTINUE' }
      }

      const result = transition(state, command, dependencies)
      if (!result.ok) throw new Error(`command rejected: ${result.error.kind}`)
      state = result.value.state
      log = appendAction(log, command)
      commands.push(command)
    }

    const restored = restoreSnapshot(
      JSON.parse(JSON.stringify(serializeSnapshot(state))),
      {
        gameVersion: descriptor.gameVersion,
        rulesetVersion: descriptor.rulesetVersion,
        contentVersion: descriptor.contentVersion,
      },
    )
    if (!restored.ok) throw new Error('restore failed')

    // Continuing from the restored state must behave identically to continuing
    // from the live one.
    const fromLive = transition(state, { type: 'CONTINUE' }, dependencies)
    const fromRestored = transition(
      restored.value,
      { type: 'CONTINUE' },
      dependencies,
    )

    expect(fromLive.ok).toBe(fromRestored.ok)
    if (fromLive.ok && fromRestored.ok) {
      expect(canonicalize(fromRestored.value.state)).toBe(
        canonicalize(fromLive.value.state),
      )
    }
  })

  it('refuses a snapshot produced by a different ruleset', () => {
    const descriptor = descriptorFor('integration-version')
    const played = simulateRun(descriptor, dependencies)
    if (!played.ok) throw new Error('simulation failed')

    const restored = restoreSnapshot(
      JSON.parse(JSON.stringify(serializeSnapshot(played.value.state))),
      {
        gameVersion: descriptor.gameVersion,
        rulesetVersion: '9.9.9-other',
        contentVersion: descriptor.contentVersion,
      },
    )

    expect(isErr(restored)).toBe(true)
    if (restored.ok) return
    expect(restored.error.kind).toBe('unsupported-version')
  })
})
