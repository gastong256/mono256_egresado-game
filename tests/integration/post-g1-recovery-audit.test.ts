import { mkdirSync, writeFileSync } from 'node:fs'
import { describe, expect, it, vi } from 'vitest'
import {
  activeChallengeView,
  createRun,
  serializeSnapshot,
  restoreSnapshot,
  replayRun,
  transition,
  scoreRun,
  scoredEventsOf,
  candidateFairScorePolicy,
  selectedObligation,
  orderObligations,
  obligationFor,
  emptyProgression,
  withObligation,
  withRecovery,
  developmentRecoveryPolicy,
  recoveryNotes,
  recordCoverage,
  owesRecovery,
  reviewsFor,
  toChallengeId,
  toScenarioFamilyId,
  toVariantId,
  serializeActionLog,
  materializeChallenge,
  type RecoveryContent,
} from '@/game'
import {
  createGrade1Dependencies,
  createGrade1RunDescriptor,
  grade1RecoveryContent,
} from '@/content/grade-1'
import { actionLogSchema } from '@/game/runs/action-log'
import { validateSubmittedRun } from '@/server/game/validate-run'
import { playGrade1, stressCaseQualities } from '../helpers/grade-1-play'

const demo = createGrade1Dependencies(true)
function descriptor(seed: string, broad = true) {
  const result = createGrade1RunDescriptor(seed, broad)
  if (!result.ok) throw new Error(result.error.detail)
  return result.value
}
const scored = (history: Parameters<typeof scoredEventsOf>[0]) =>
  scoreRun(scoredEventsOf(history), demo.catalog, candidateFairScorePolicy)
function artifact(name: string, data: unknown) {
  mkdirSync('/tmp/post-g1-audit', { recursive: true })
  writeFileSync(
    `/tmp/post-g1-audit/${name}.json`,
    JSON.stringify(data, null, 2),
  )
}

describe('post-G1 adversarial recovery audit', () => {
  it.each(['invalid', 'functional', 'efficient', 'optimal'] as const)(
    'formal O1+O2 with review %s: every boundary, score channel and terminal bound',
    (quality) => {
      const played = playGrade1(
        descriptor('formal-multi-obligation'),
        demo,
        stressCaseQualities(quality),
      )
      const beforeIndex = played.states.findIndex(
        (s) =>
          s.stage === 'year-1' &&
          s.activeEvent?.recovery &&
          s.phase === 'challenge',
      )
      const before = played.states[beforeIndex]!
      const after = played.states[beforeIndex + 1]!
      expect(
        before.progression.pending.map((o) => o.source.templateId),
      ).toEqual(['y1.classroom-layout', 'y1.rehearsal-schedule'])
      expect(new Set(before.progression.pending.map((o) => o.id)).size).toBe(2)
      expect(before.progression.pending[0]!.sourceEventIndex).toBeLessThan(
        before.progression.pending[1]!.sourceEventIndex,
      )
      expect(before.activeEvent?.challenge?.templateId).toBe(
        'y1.scale-fit-review',
      )
      expect(after.progression.pending).toEqual([])
      expect(
        after.progression.history.find((r) => r.stageId === 'year-1')?.resolved,
      ).toEqual(before.progression.pending.map((o) => o.id))
      expect(scored(before.history)).toEqual(scored(after.history))
      // Legacy score is career evidence (competitive-scoring-and-ranking §intro).
      // Record its change; neutrality is required of the complete FairScore object above.
      expect(after.scorePreview - before.scorePreview).toBe(
        after.history.at(-1)?.points,
      )
      expect(before.stageEventIndex).toEqual(after.stageEventIndex)
      expect(
        played.state.history.filter(
          (e) => e.stage === 'year-1' && e.challengeId && !e.recovery,
        ),
      ).toHaveLength(5)
      expect(
        played.state.progression.history.filter((r) => r.stageId === 'year-1'),
      ).toHaveLength(1)
      expect(played.state.completion?.graduated).toBe(true)
      expect(transition(played.state, { type: 'CONTINUE' }, demo).ok).toBe(
        false,
      )
      for (const [index, state] of played.states.entries()) {
        const snapshot = serializeSnapshot(state)
        const restored = restoreSnapshot(
          JSON.parse(JSON.stringify(snapshot)),
          state.descriptor,
        )
        if (!restored.ok) throw new Error(JSON.stringify(restored.error))
        expect(serializeSnapshot(restored.value)).toEqual(snapshot)
        const prefix = replayRun(
          { ...played.log, actions: played.log.actions.slice(0, index) },
          demo,
        )
        expect(prefix.ok && prefix.value.state).toEqual(state)
        expect(activeChallengeView(restored.value, demo)).toEqual(
          activeChallengeView(state, demo),
        )
        const nextCommand = played.commands[index]
        if (nextCommand) {
          const resumed = transition(restored.value, nextCommand, demo)
          const direct = transition(state, nextCommand, demo)
          expect(resumed.ok && serializeSnapshot(resumed.value.state)).toEqual(
            direct.ok && serializeSnapshot(direct.value.state),
          )
          expect(resumed.ok && resumed.value.events).toEqual(
            direct.ok && direct.value.events,
          )
          expect(resumed.ok && resumed.value.effects).toEqual(
            direct.ok && direct.value.effects,
          )
        }
      }
      const notes = activeChallengeView(before, demo)
      artifact(`formal-${quality}`, {
        commands: played.commands.length,
        snapshots: played.states.length,
        before: before.progression,
        notes,
        after: after.progression,
        scoreBefore: scored(before.history),
        scoreAfter: scored(after.history),
        legacyBefore: before.scorePreview,
        legacyAfter: after.scorePreview,
        completion: played.state.completion,
        facts: played.state.flags,
      })
    },
  )

  it('selection ignores array insertion order and wall clock/random; temporal inversion changes the selected concept', () => {
    const played = playGrade1(
      descriptor('canonical-inversion'),
      demo,
      stressCaseQualities(),
    )
    const before = played.states.find(
      (s) => s.stage === 'year-1' && s.progression.pending.length === 2,
    )!
    const reversed = {
      ...before.progression,
      pending: [...before.progression.pending].reverse(),
    }
    const random = vi.spyOn(Math, 'random').mockImplementation(() => {
      throw new Error('global RNG forbidden')
    })
    const now = vi.spyOn(Date, 'now').mockImplementation(() => {
      throw new Error('global clock forbidden')
    })
    try {
      expect(selectedObligation(reversed, 'year-1')).toEqual(
        selectedObligation(before.progression, 'year-1'),
      )
      const swapped = before.progression.pending.map((o, index) =>
        obligationFor(
          developmentRecoveryPolicy,
          'year-1',
          100 - index,
          o.source,
          'invalid',
        )!,
      )
      expect(
        selectedObligation(
          { ...before.progression, pending: swapped },
          'year-1',
        )?.source.templateId,
      ).toBe('y1.rehearsal-schedule')
      expect(
        recoveryNotes(grade1RecoveryContent, swapped, 'y1.schedule-review'),
      ).toMatchObject({
        ok: true,
        value: {
          practised: [{ sourceTemplateId: 'y1.rehearsal-schedule' }],
          debriefed: [{ sourceTemplateId: 'y1.classroom-layout' }],
        },
      })
    } finally {
      random.mockRestore()
      now.mockRestore()
    }
  })

  it.each([1, 2, 3, 6, 9, 32])(
    'synthetic distinct-concept N=%s has linear records/notes and resolves in one step',
    (n) => {
      const notes: Record<string, { title: string; text: string }> = {},
        reviews: Record<string, ReturnType<typeof toChallengeId>[]> = {}
      let progression = emptyProgression()
      const start = performance.now()
      for (let i = n - 1; i >= 0; i--) {
        const id = `audit.concept-${i}`
        reviews[id] = [toChallengeId(`audit.review-${i}`)]
        notes[id] = {
          title: `Synthetic concept ${i}`,
          text: `Synthetic explanatory fixture ${i}; no claim of mastery.`,
        }
        const obligation = obligationFor(
          developmentRecoveryPolicy,
          'year-1',
          i,
          {
            familyId: toScenarioFamilyId('audit'),
            templateId: toChallengeId(id),
            variantId: toVariantId('v1'),
          },
          'invalid',
        )!
        progression = withObligation(progression, obligation)
      }
      const config: RecoveryContent = {
        ...grade1RecoveryContent,
        reviews,
        debriefs: notes,
      }
      expect(selectedObligation(progression, 'year-1')?.source.templateId).toBe(
        'audit.concept-0',
      )
      expect(orderObligations([...progression.pending].reverse())).toEqual(
        progression.pending,
      )
      const coverage = recoveryNotes(
        config,
        progression.pending,
        'audit.review-0',
      )
      if (!coverage.ok || !coverage.value)
        throw new Error('missing synthetic notes')
      expect(coverage.value.practised).toHaveLength(1)
      expect(coverage.value.debriefed).toHaveLength(n - 1)
      const ref = {
        familyId: toScenarioFamilyId('audit'),
        templateId: toChallengeId('audit.review-0'),
        variantId: toVariantId('v1'),
      }
      const closed = withRecovery(
        progression,
        'year-1',
        ref,
        'invalid',
        developmentRecoveryPolicy,
      )
      expect(closed.pending).toHaveLength(0)
      expect(closed.history).toHaveLength(1)
      expect(closed.history[0]!.resolved).toHaveLength(n)
      expect(owesRecovery(closed, 'year-1')).toBe(false)
      expect(
        withRecovery(
          closed,
          'year-1',
          ref,
          'invalid',
          developmentRecoveryPolicy,
        ),
      ).toEqual(closed)
      expect(
        recordCoverage(JSON.parse(JSON.stringify(closed.history[0])), (id) =>
          reviewsFor(config, id),
        ),
      ).toEqual({
        practised: [progression.pending[0]!.id],
        debriefed: progression.pending.slice(1).map((o) => o.id),
      })
      artifact(`synthetic-${n}`, {
        n,
        elapsedMs: performance.now() - start,
        bytes: JSON.stringify(progression).length,
        notesBytes: JSON.stringify(coverage).length,
        closed,
      })
    },
  )

  it('fail-closed at creation and recovery edge for empty pool, missing mapping and missing notes, without partial mutation', () => {
    const played = playGrade1(
      descriptor('audit-fail-closed'),
      demo,
      stressCaseQualities(),
    )
    const before = played.states.find(
      (s) =>
        s.stage === 'year-1' &&
        s.phase === 'narrative' &&
        s.activeEvent?.storyletId === 'y1.closing',
    )!
    const approval = demo.approvedVariants!
    const mutations = [
      {
        ...demo,
        approvedVariants: {
          ...approval,
          variantsFor: (id: Parameters<typeof approval.variantsFor>[0]) =>
            id === 'y1.scale-fit-review' ? [] : approval.variantsFor(id),
        },
      },
      {
        ...demo,
        recoveryContent: {
          ...grade1RecoveryContent,
          reviews: {
            ...grade1RecoveryContent.reviews,
            'y1.classroom-layout': [toChallengeId('audit.missing')],
          },
        },
      },
      { ...demo, recoveryContent: { ...grade1RecoveryContent, debriefs: {} } },
    ]
    const results = mutations.map((deps) => {
      const original = serializeSnapshot(before)
      const first = transition(before, { type: 'CONTINUE' }, deps)
      expect(first.ok).toBe(false)
      expect(transition(before, { type: 'CONTINUE' }, deps)).toEqual(first)
      expect(serializeSnapshot(before)).toEqual(original)
      expect(createRun(descriptor('audit-fail-closed'), deps).ok).toBe(false)
      return first
    })
    const review = played.views.find(
      (v) => v.ref.templateId === 'y1.scale-fit-review',
    )!
    for (const ref of [
      { ...review.ref, variantId: toVariantId('c99999') },
      { ...review.ref, familyId: toScenarioFamilyId('forged') },
      { ...review.ref, templateId: toChallengeId('unknown') },
    ]) {
      expect(materializeChallenge(played.state.descriptor, ref, demo).ok).toBe(
        false,
      )
    }
    artifact('recovery-fail-closed', results)
  })

  it('server rejects forged descriptors, replay edits and malformed semantic answers; recomputes claimed outputs', () => {
    const played = playGrade1(
      descriptor('audit-server'),
      demo,
      stressCaseQualities(),
    )
    const encoded = actionLogSchema.parse(serializeActionLog(played.log))
    const good = validateSubmittedRun(encoded, demo)
    expect(good.ok).toBe(true)
    expect(
      validateSubmittedRun(
        {
          ...encoded,
          score: 999999,
          quality: 'optimal',
          Team: 99999,
          Style: 99999,
          career: {},
          graduated: false,
        },
        demo,
      ),
    ).toEqual(good)
    const attacks: [string, unknown][] = []
    for (const field of [
      'gameVersion',
      'rulesetVersion',
      'contentVersion',
      'variantCatalogVersion',
      'scoreVersion',
    ])
      attacks.push([
        field,
        {
          ...encoded,
          descriptor: { ...encoded.descriptor, [field]: 'forged' },
        },
      ])
    attacks.push(
      ['old-codec', { ...encoded, version: 4 }],
      [
        'duplicate',
        { ...encoded, actions: [encoded.actions[0], ...encoded.actions] },
      ],
      [
        'missing-middle',
        { ...encoded, actions: encoded.actions.filter((_, i) => i !== 3) },
      ],
      ['missing-last', { ...encoded, actions: encoded.actions.slice(0, -1) }],
      [
        'reordered',
        {
          ...encoded,
          actions: [
            encoded.actions[1],
            encoded.actions[0],
            ...encoded.actions.slice(2),
          ],
        },
      ],
    )
    for (const [kind, answer] of [
      [
        'quantity-builder',
        {
          kind: 'quantity-builder',
          lines: [{ itemId: 'unknown', quantity: 1 }],
        },
      ],
      [
        'schedule-builder',
        {
          kind: 'schedule-builder',
          placements: [{ taskId: 'unknown', start: 999999 }],
        },
      ],
      [
        'spatial-layout',
        {
          kind: 'spatial-layout',
          placements: [{ itemId: 'unknown', x: -1, y: 999999, rotation: 0 }],
        },
      ],
      [
        'assignment-board',
        {
          kind: 'assignment-board',
          assignments: [{ taskId: 'unknown', agentId: 'unknown' }],
        },
      ],
    ] as const) {
      const index = encoded.actions.findIndex(
        (a) => a.command.type === 'ANSWER' && a.command.answer.kind === kind,
      )
      expect(index).toBeGreaterThan(-1)
      const target = encoded.actions[index]!
      attacks.push([
        `invalid-${kind}`,
        {
          ...encoded,
          actions: encoded.actions.map((a, i) =>
            i === index
              ? { ...target, command: { ...target.command, answer } }
              : a,
          ),
        },
      ])
    }
    const reviewIndex = encoded.actions.findIndex(
      (a) =>
        a.command.type === 'ANSWER' &&
        a.command.instanceId.includes('recovery'),
    )
    expect(reviewIndex).toBeGreaterThan(-1)
    attacks.push([
      'recovery-without-obligation',
      {
        ...encoded,
        actions: [
          { sequence: 0, command: encoded.actions[reviewIndex]!.command },
        ],
      },
    ])
    const outcomes = attacks.map(([name, input]) => {
      const result = validateSubmittedRun(input, demo)
      expect(result.ok, name).toBe(false)
      return { name, result }
    })
    const partial = createGrade1Dependencies()
    const composed = playGrade1(descriptor('audit-plan-tamper', false), partial)
    const log = actionLogSchema.parse(serializeActionLog(composed.log))
    const altered = validateSubmittedRun(
      { ...log, descriptor: { ...log.descriptor, planFingerprint: 'forged' } },
      partial,
    )
    expect(altered.ok).toBe(false)
    artifact('tampering', {
      rejected: outcomes.length + 1,
      ignoredClaims: [
        'score',
        'quality',
        'Team',
        'Style',
        'career',
        'graduated',
      ],
      outcomes,
      altered,
    })
  })

  it('bounded policy sweep graduates and converges with full replay/resume on 120 partial and demo runs', () => {
    const counts: Record<string, number> = {}
    let maxCommands = 0,
      boundaries = 0
    const start = performance.now()
    for (const broad of [false, true])
      for (let seed = 0; seed < 20; seed++)
        for (const policy of ['optimal', 'functional', 'invalid'] as const) {
          const deps = createGrade1Dependencies(broad)
          const played = playGrade1(
            descriptor(`audit-sweep-${seed}`, broad),
            deps,
            () => policy,
          )
          expect(played.state.completion?.graduated).toBe(true)
          expect(played.state.progression.pending).toEqual([])
          expect(replayRun(played.log, deps)).toMatchObject({
            ok: true,
            value: { state: played.state },
          })
          expect(
            validateSubmittedRun(serializeActionLog(played.log), deps).ok,
          ).toBe(true)
          for (const stage of ['grade-7', 'year-1'])
            expect(
              played.state.progression.history.filter(
                (r) => r.stageId === stage,
              ).length,
            ).toBeLessThanOrEqual(1)
          for (const state of played.states) {
            const resumed = restoreSnapshot(
              serializeSnapshot(state),
              state.descriptor,
            )
            expect(resumed.ok && serializeSnapshot(resumed.value)).toEqual(
              serializeSnapshot(state),
            )
            boundaries++
          }
          for (const view of played.views)
            counts[view.interaction.kind] =
              (counts[view.interaction.kind] ?? 0) + 1
          maxCommands = Math.max(maxCommands, played.commands.length)
        }
    artifact('graduation-sweep', {
      runs: 120,
      counts,
      maxCommands,
      boundaries,
      elapsedMs: performance.now() - start,
    })
  }, 60000)
})
