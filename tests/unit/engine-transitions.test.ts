import { describe, expect, it } from 'vitest'

import {
  activeChallengeView,
  createRun,
  isErr,
  parseCommand,
  toChallengeInstanceId,
  transition,
  type GameCommand,
  type RunState,
} from '@/game'
import {
  createDevelopmentDependencies,
  developmentRunDescriptor,
  synthesizeAnswer,
} from '@/game/testing'
import { createRng } from '@/game/random/rng'

const dependencies = createDevelopmentDependencies()
const descriptor = developmentRunDescriptor('transitions', dependencies)

/** Advances a fresh run to the first challenge. */
function runAtChallenge(): RunState {
  const created = createRun(descriptor, dependencies)
  if (!created.ok) throw new Error('run creation failed')

  let state = created.value.state
  let guard = 0

  while (state.phase !== 'challenge' && guard < 10) {
    const result = transition(state, { type: 'CONTINUE' }, dependencies)
    if (!result.ok) throw new Error('continue rejected')
    state = result.value.state
    guard += 1
  }

  return state
}

function answerFor(state: RunState): GameCommand {
  const view = activeChallengeView(state, dependencies)
  if (!view.ok || view.value === undefined) throw new Error('no active view')

  return {
    type: 'ANSWER',
    instanceId: view.value.ref.instanceId,
    answer: synthesizeAnswer(
      view.value.interaction,
      createRng(descriptor.seed, ['unit', 'answer']),
    ),
  }
}

describe('transition rejections', () => {
  it('refuses an answer while feedback is pending', () => {
    const state = runAtChallenge()
    const answered = transition(state, answerFor(state), dependencies)
    if (!answered.ok) throw new Error('answer rejected')

    expect(answered.value.state.phase).toBe('feedback')

    const again = transition(
      answered.value.state,
      answerFor(state),
      dependencies,
    )

    expect(isErr(again)).toBe(true)
    if (again.ok) return
    expect(again.error.kind).toBe('invalid-transition')
  })

  it('refuses a second answer to the same challenge', () => {
    const state = runAtChallenge()
    const command = answerFor(state)
    const first = transition(state, command, dependencies)
    if (!first.ok) throw new Error('answer rejected')

    const second = transition(first.value.state, command, dependencies)
    expect(isErr(second)).toBe(true)
  })

  it('refuses an answer aimed at a stale challenge instance', () => {
    const state = runAtChallenge()
    const command = answerFor(state)
    if (command.type !== 'ANSWER') throw new Error('unexpected command')

    const stale = transition(
      state,
      {
        ...command,
        instanceId: toChallengeInstanceId('grade-7:99:dev.mural-coverage'),
      },
      dependencies,
    )

    expect(isErr(stale)).toBe(true)
    if (stale.ok) return
    expect(stale.error.kind).toBe('stale-challenge-answer')
  })

  it('refuses an answer whose shape does not match the interaction', () => {
    const state = runAtChallenge()
    const view = activeChallengeView(state, dependencies)
    if (!view.ok || view.value === undefined) throw new Error('no view')

    // Every development challenge at this point is a decision card; sending a
    // budget answer must be refused by the evaluator, not coerced.
    const mismatched = transition(
      state,
      {
        type: 'ANSWER',
        instanceId: view.value.ref.instanceId,
        answer: { kind: 'budget-builder', lines: [] },
      },
      dependencies,
    )

    expect(isErr(mismatched)).toBe(true)
    if (mismatched.ok) return
    expect(mismatched.error.kind).toBe('invalid-answer')
  })

  it('refuses continue while a challenge is unanswered', () => {
    const state = runAtChallenge()
    const result = transition(state, { type: 'CONTINUE' }, dependencies)

    expect(isErr(result)).toBe(true)
    if (result.ok) return
    expect(result.error.kind).toBe('invalid-transition')
  })

  it('refuses every command once the run has ended', () => {
    const state = runAtChallenge()
    const abandoned = transition(state, { type: 'ABANDON' }, dependencies)
    if (!abandoned.ok) throw new Error('abandon rejected')

    expect(abandoned.value.state.status).toBe('abandoned')

    for (const command of [
      { type: 'CONTINUE' },
      { type: 'ABANDON' },
      answerFor(state),
    ] satisfies GameCommand[]) {
      const result = transition(abandoned.value.state, command, dependencies)
      expect(isErr(result)).toBe(true)
      if (result.ok) continue
      expect(result.error.kind).toBe('run-already-completed')
    }
  })

  it('refuses an unknown information key and an unavailable tool', () => {
    const state = runAtChallenge()
    const view = activeChallengeView(state, dependencies)
    if (!view.ok || view.value === undefined) throw new Error('no view')

    const info = transition(
      state,
      {
        type: 'REQUEST_INFO',
        instanceId: view.value.ref.instanceId,
        key: 'not-a-real-key',
      },
      dependencies,
    )
    expect(isErr(info)).toBe(true)
    if (!info.ok) expect(info.error.kind).toBe('unknown-information-key')

    const availableTools = view.value.tools
    const unavailable = (
      ['calculator', 'notepad', 'table', 'ruler'] as const
    ).find((tool) => !availableTools.includes(tool))
    if (unavailable === undefined) return

    const tool = transition(
      state,
      {
        type: 'USE_TOOL',
        instanceId: view.value.ref.instanceId,
        tool: unavailable,
      },
      dependencies,
    )
    expect(isErr(tool)).toBe(true)
    if (!tool.ok) expect(tool.error.kind).toBe('tool-not-available')
  })

  it('treats a repeated information request as a no-op', () => {
    const descriptorForSurvey = developmentRunDescriptor(
      'info-request',
      dependencies,
    )
    const created = createRun(descriptorForSurvey, dependencies)
    if (!created.ok) throw new Error('run creation failed')

    let state = created.value.state
    let guard = 0

    // Walk until a challenge offering requestable information appears.
    while (guard < 60 && state.status === 'active') {
      if (state.phase === 'challenge') {
        const view = activeChallengeView(state, dependencies)
        if (view.ok && view.value?.interaction.kind === 'information-request') {
          const key = view.value.interaction.available[0]?.key
          if (key === undefined) break

          const first = transition(
            state,
            {
              type: 'REQUEST_INFO',
              instanceId: view.value.ref.instanceId,
              key,
            },
            dependencies,
          )
          if (!first.ok) throw new Error('request rejected')
          expect(first.value.state.activeEvent?.revealed).toContain(key)

          const repeat = transition(
            first.value.state,
            {
              type: 'REQUEST_INFO',
              instanceId: view.value.ref.instanceId,
              key,
            },
            dependencies,
          )
          if (!repeat.ok) throw new Error('repeat rejected')
          expect(repeat.value.state.activeEvent?.revealed).toEqual(
            first.value.state.activeEvent?.revealed,
          )
          expect(repeat.value.events).toEqual([])
          return
        }
      }

      const command: GameCommand =
        state.phase === 'challenge' ? answerFor(state) : { type: 'CONTINUE' }
      const result = transition(state, command, dependencies)
      if (!result.ok) break
      state = result.value.state
      guard += 1
    }
  })
})

describe('command parsing at the trust boundary', () => {
  it('accepts a well-formed command', () => {
    const parsed = parseCommand({
      type: 'ANSWER',
      instanceId: 'grade-7:0:dev.mural-coverage',
      answer: { kind: 'decision-card', optionId: 'tin-2l' },
    })

    expect(parsed.ok).toBe(true)
  })

  it.each([
    ['an unknown command type', { type: 'CHEAT', score: 999_999 }],
    ['a missing instance', { type: 'ANSWER', answer: { kind: 'timeline' } }],
    [
      'a non-decimal numeric answer',
      {
        type: 'ANSWER',
        instanceId: 'x',
        answer: { kind: 'numeric-input', value: '12abc' },
      },
    ],
    [
      'a negative budget quantity',
      {
        type: 'ANSWER',
        instanceId: 'x',
        answer: {
          kind: 'budget-builder',
          lines: [{ itemId: 'pack-1', quantity: -3 }],
        },
      },
    ],
    [
      'an unknown tool',
      { type: 'USE_TOOL', instanceId: 'x', tool: 'wolfram-alpha' },
    ],
    ['a raw string', 'CONTINUE'],
    ['null', null],
  ])('rejects %s', (_label, payload) => {
    const parsed = parseCommand(payload)
    expect(isErr(parsed)).toBe(true)
    if (parsed.ok) return
    expect(parsed.error.kind).toBe('invalid-command')
  })
})
