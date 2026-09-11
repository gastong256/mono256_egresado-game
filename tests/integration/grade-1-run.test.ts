import { describe, expect, it } from 'vitest'
import fc from 'fast-check'
import {
  activeChallengeView,
  candidateFairScorePolicy,
  createRun,
  materializeChallenge,
  parseActionLog,
  recordCoverage,
  replayRun,
  restoreSnapshot,
  reviewsFor,
  scoreRun,
  scoredEventsOf,
  serializeActionLog,
  serializeSnapshot,
  toVariantId,
  transition,
  validateComposedPlan,
  type RunDescriptor,
  type RunState,
} from '@/game'
import {
  createGrade1Dependencies,
  createGrade1RunDescriptor,
  grade1Challenges,
  grade1RecoveryContent,
} from '@/content/grade-1'
import {
  grade1NarrativeHooks,
  grade1PowerOutageContext,
  grade7TimingCallback,
} from '@/content/grade-1/career-facts'
import { validateSubmittedRun } from '@/server/game/validate-run'
import { playGrade1, stressCaseQualities } from '../helpers/grade-1-play'
import { actionLogSchema } from '@/game/runs/action-log'

function descriptor(seed: string, demo = false): RunDescriptor {
  const result = createGrade1RunDescriptor(seed, demo)
  if (!result.ok) throw new Error(result.error.detail)
  return result.value
}
const demo = createGrade1Dependencies(true),
  partial = createGrade1Dependencies()
const isReview = (id: string) => id.endsWith('-review')

describe('Grade 1 real · create → commands → resume → replay → server', () => {
  it.each([false, true])(
    'round-trips every confirmed/narrative/recovery boundary (demo=%s)',
    (broad) => {
      const deps = broad ? demo : partial
      const played = playGrade1(
        descriptor('g1-roundtrip', broad),
        deps,
        (id) => (id.startsWith('y1.') ? 'invalid' : 'optimal'),
      )
      expect(played.state.completion?.graduated).toBe(true)
      expect(played.state.progression.pending).toEqual([])
      for (const [index, state] of played.states.entries()) {
        const restored = restoreSnapshot(
          serializeSnapshot(state),
          state.descriptor,
        )
        expect(restored.ok && serializeSnapshot(restored.value)).toEqual(
          serializeSnapshot(state),
        )
        if (!restored.ok) throw new Error('snapshot rejected')
        expect(activeChallengeView(restored.value, deps)).toEqual(
          activeChallengeView(state, deps),
        )
        const prefix = {
          ...played.log,
          actions: played.log.actions.slice(0, index),
        }
        const replayed = replayRun(prefix, deps)
        expect(replayed.ok && replayed.value.state).toEqual(state)
        const command = played.commands[index]
        if (command !== undefined) {
          const resumed = transition(restored.value, command, deps),
            uninterrupted = transition(state, command, deps)
          expect(resumed.ok && serializeSnapshot(resumed.value.state)).toEqual(
            uninterrupted.ok && serializeSnapshot(uninterrupted.value.state),
          )
          expect(resumed.ok && resumed.value.events).toEqual(
            uninterrupted.ok && uninterrupted.value.events,
          )
        }
      }
      const parsed = parseActionLog(serializeActionLog(played.log))
      expect(parsed.ok && parsed.value).toEqual(played.log)
      const submitted = validateSubmittedRun(
        serializeActionLog(played.log),
        deps,
      )
      expect(submitted.ok).toBe(true)
      if (!submitted.ok) throw new Error(submitted.error.kind)
      expect(submitted.value.career).toEqual(played.state.career)
      expect(submitted.value.recoveries).toBe(
        played.state.completion?.recoveries,
      )
      const score = scoreRun(
        scoredEventsOf(played.state.history),
        deps.catalog,
        candidateFairScorePolicy,
      )
      expect(score.ok && score.value).toEqual(submitted.value.competitiveScore)
      expect(submitted.value.competitiveScore?.official).toBe(false)
    },
  )

  it('all five templates run in authored chronology and record their callback facts at origin', () => {
    const played = playGrade1(descriptor('g1-perfect', true), demo)
    const ids = played.state.history
      .filter((e) => e.stage === 'year-1' && e.challengeId !== undefined)
      .map((e) => e.challengeId)
    expect(ids).toEqual([
      'y1.mobile-data',
      'y1.course-project-expo',
      'y1.classroom-layout',
      'y1.rehearsal-schedule',
      'y1.student-day-challenge-wheel',
    ])
    const flags = played.state.flags
    expect(flags['y1.project.context-established']).toBe(true)
    expect(flags['y1.project.outcome']).toBe('optimal')
    expect(flags['y1.project.everyone-participated']).toBe(true)
    expect(flags['y1.project.volunteer-respected']).toBe(true)
    expect(flags['y1.project.request-respected']).toBe(true)
    expect(flags['y1.project.backup-presenter']).toBe(true)
    expect(typeof flags['y1.project.centralized']).toBe('boolean')
    expect(flags['y1.schedule.outcome']).toBe('optimal')
    expect(flags['y1.layout.accessible']).toBe(true)
    expect(flags['y1.student-day.outcome']).toBe('optimal')
    expect(['aplicado', 'estratega', 'improvisador']).toContain(
      flags['y1.mobile.strategy'],
    )
    expect(played.state.career.grades.length).toBeGreaterThan(0)
    expect(grade1PowerOutageContext(played.state)).toBe(true)
    expect(played.state.flags['rare.y1.power-outage.occurred']).toBeUndefined()
    expect(grade1NarrativeHooks.powerOutage).toMatchObject({
      implemented: false,
      appearancePrestige: 0,
      participation: 'NARRATIVE_ONLY',
    })
    expect(grade1PowerOutageContext({ flags: {} })).toBe(false)
    expect(
      grade1PowerOutageContext({
        flags: {
          'y1.project.context-established': true,
          'y1.project.outcome': 'invalid',
        },
      }),
    ).toBe(false)
  })

  it('FairScore of the Grade-1 beats reaches exactly 10.000 when every available piece of evidence is maximal', () => {
    const played = playGrade1(descriptor('g1-ceiling', true), demo)
    const grade1 = played.state.history.filter(
      (entry) => entry.stage === 'year-1',
    )
    const score = scoreRun(
      scoredEventsOf(grade1),
      demo.catalog,
      candidateFairScorePolicy,
    )
    expect(score.ok).toBe(true)
    if (!score.ok) return
    expect(score.value.fairScore).toBe(10_000)
    expect(score.value.scoredBeats).toBe(5)
    expect(score.value.mathRaw).toBe(score.value.mathMax)
    const team = score.value.components.find(
      (component) => component.component === 'team',
    )
    expect(team?.opportunities).toBe(1)
    expect(team?.performance).toBe(10_000)
  })

  it('partial composition covers all five templates without inventing an official six-year career', () => {
    const seen = new Set<string>()
    for (let seed = 0; seed < 80; seed++) {
      const d = descriptor(`g1-coverage-${seed}`)
      expect(d.mode).toBe('practice')
      const created = createRun(d, partial)
      if (
        !created.ok ||
        created.value.state.plan === undefined ||
        partial.composition === undefined ||
        partial.approvedVariants === undefined
      )
        throw new Error('missing partial plan')
      const plan = created.value.state.plan
      expect(plan.stages.map((stage) => stage.stageId)).toEqual([
        'grade-7',
        'year-1',
      ])
      expect(plan.stages.flatMap((stage) => stage.beats)).toHaveLength(4)
      expect(
        validateComposedPlan(plan, {
          catalog: partial.catalog,
          policy: partial.composition,
          approvedVariants: partial.approvedVariants,
        }),
      ).toEqual([])
      for (const beat of plan.stages.flatMap((stage) => stage.beats))
        if (beat.variant.templateId.startsWith('y1.'))
          seen.add(beat.variant.templateId)
    }
    expect(seen).toEqual(
      new Set(
        grade1Challenges
          .filter((t) => t.placement !== 'recovery')
          .map((t) => t.id),
      ),
    )
    expect(partial.composition?.official).toBe(false)
    expect(partial.composition?.career?.scope).toBe('partial-development')
  })

  it('seed property: composed real content converges and replays, with mixed qualities', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 10000 }),
        fc.constantFrom(
          'optimal' as const,
          'functional' as const,
          'invalid' as const,
        ),
        (seed, quality) => {
          const played = playGrade1(
            descriptor(`g1-property-${seed}`),
            partial,
            () => quality,
          )
          const replayed = replayRun(played.log, partial)
          expect(replayed.ok && replayed.value.state).toEqual(played.state)
          expect(played.state.completion?.graduated).toBe(true)
          expect(played.state.progression.pending).toHaveLength(0)
        },
      ),
      { numRuns: 40 },
    )
  })

  it('callbacks read actual G7 facts and never change the mathematical instance', () => {
    const played = playGrade1(descriptor('g1-callback', true), demo)
    for (const [templateId, flags, phrase] of [
      [
        'y1.rehearsal-schedule',
        { 'g7.llegoTarde': true },
        'una demora también ocupa tiempo',
      ],
      [
        'y1.course-project-expo',
        { 'g7.grupoOrganizado': true },
        'En séptimo el reparto salió bien',
      ],
    ] as const) {
      const state = played.states.find(
        (s) => s.activeEvent?.challenge?.templateId === templateId,
      )
      if (state === undefined) throw new Error(`missing ${templateId}`)
      const withFlags = (value: RunState['flags']) =>
        activeChallengeView({ ...state, flags: value }, demo)
      const clean = withFlags({}),
        recalled = withFlags(flags)
      expect(recalled.ok && recalled.value?.narrative.setup).toContain(phrase)
      expect(clean.ok && clean.value?.interaction).toEqual(
        recalled.ok && recalled.value?.interaction,
      )
    }
    expect(grade7TimingCallback({ 'g7.calculoSeguro': true })).toContain(
      'margen',
    )
    expect(grade7TimingCallback({})).toBe('')
  })
})

describe('Repaso de primero · one interactive review, other concepts debriefed', () => {
  it.each(['y1.rehearsal-schedule', 'y1.classroom-layout', 'both'])(
    '%s invalid triggers the mapped review and always closes',
    (failed) => {
      const played = playGrade1(
        descriptor(`review-${failed}`, true),
        demo,
        (id) =>
          id === failed ||
          (failed === 'both' &&
            ['y1.rehearsal-schedule', 'y1.classroom-layout'].includes(id)) ||
          isReview(id)
            ? 'invalid'
            : 'optimal',
      )
      const reviews = played.views.filter(
        (view) =>
          view.ref.stageId === 'year-1' && isReview(view.ref.templateId),
      )
      expect(reviews).toHaveLength(1)
      const expected =
        failed === 'y1.rehearsal-schedule'
          ? { review: 'y1.schedule-review', title: 'Agenda y traslados' }
          : { review: 'y1.scale-fit-review', title: 'Escala y encastre' }
      expect(reviews[0]?.ref.templateId).toBe(expected.review)
      expect(reviews[0]?.review?.practised.map((note) => note.title)).toEqual([
        expected.title,
      ])
      expect(reviews[0]?.review?.debriefed.map((note) => note.title)).toEqual(
        failed === 'both' ? ['Agenda y traslados'] : [],
      )
      const record = played.state.progression.history.find(
        (r) => r.stageId === 'year-1',
      )
      expect(record?.resolved).toHaveLength(failed === 'both' ? 2 : 1)
      expect(record?.previa).toBe(true)
      expect(played.state.completion?.graduated).toBe(true)
    },
  )

  it('the practised/debriefed split is re-derived from the record, and replay reaches the same one', () => {
    const played = playGrade1(
      descriptor('review-coverage', true),
      demo,
      stressCaseQualities('optimal'),
    )
    const record = played.state.progression.history.find(
      (r) => r.stageId === 'year-1',
    )
    if (record === undefined) throw new Error('missing record')
    const coverage = recordCoverage(record, (id) =>
      reviewsFor(grade1RecoveryContent, id),
    )
    expect(coverage.practised).toHaveLength(1)
    expect(coverage.debriefed).toHaveLength(1)
    expect(coverage.practised[0]).toContain('y1.classroom-layout')
    expect(coverage.debriefed[0]).toContain('y1.rehearsal-schedule')
    expect(record.previa).toBe(false)
    const replayed = replayRun(played.log, demo)
    expect(replayed.ok && replayed.value.state.progression).toEqual(
      played.state.progression,
    )
  })

  it('FUNCTIONAL never creates debt; review success changes neither score nor denominator', () => {
    const d = descriptor('review-score', true)
    const functional = playGrade1(d, demo, () => 'functional')
    expect(
      functional.state.progression.history.filter(
        (r) => r.stageId === 'year-1',
      ),
    ).toHaveLength(0)
    const played = (reviewSuccess: boolean) =>
      playGrade1(d, demo, (id) =>
        id.startsWith('y1.') && (!isReview(id) || !reviewSuccess)
          ? 'invalid'
          : 'optimal',
      )
    const failed = played(false),
      recovered = played(true),
      perfect = playGrade1(d, demo)
    const score = (run: ReturnType<typeof playGrade1>) =>
      scoreRun(
        scoredEventsOf(run.state.history),
        demo.catalog,
        candidateFairScorePolicy,
      )
    expect(score(failed)).toEqual(score(recovered))
    const low = score(failed),
      high = score(perfect)
    if (!low.ok || !high.ok) throw new Error('score rejected')
    expect(low.value.mathMax).toBe(high.value.mathMax)
    expect(low.value.fairScore).toBeLessThan(high.value.fairScore)
  })

  it('an empty approved review pool or a missing debrief fails explicitly without mutating the run', () => {
    const played = playGrade1(
      descriptor('review-empty', true),
      demo,
      () => 'invalid',
    )
    const before = played.states.find(
      (s) =>
        s.stage === 'year-1' &&
        s.phase === 'narrative' &&
        s.activeEvent?.storyletId === 'y1.closing',
    )
    if (
      before === undefined ||
      demo.approvedVariants === undefined ||
      demo.recoveryContent === undefined
    )
      throw new Error('missing end of stage')
    const original = serializeSnapshot(before)
    const approved = demo.approvedVariants
    const empty = {
      ...demo,
      approvedVariants: {
        ...approved,
        variantsFor: (id: Parameters<typeof approved.variantsFor>[0]) =>
          id === 'y1.scale-fit-review' ? [] : approved.variantsFor(id),
      },
    }
    const result = transition(before, { type: 'CONTINUE' }, empty)
    expect(result.ok).toBe(false)
    expect(!result.ok && result.error.kind).toBe('invalid-content')
    expect(
      transition(
        before,
        { type: 'CONTINUE' },
        { ...demo, recoveryContent: { ...demo.recoveryContent, debriefs: {} } },
      ).ok,
    ).toBe(false)
    expect(serializeSnapshot(before)).toEqual(original)
    // And before a run even starts: the same gaps refuse creation.
    const created = createRun(descriptor('review-empty', true), empty)
    expect(
      !created.ok &&
        created.error.kind === 'invalid-content' &&
        created.error.issues,
    ).toContain('no approved variants for review y1.scale-fit-review')
    const undebriefed = createRun(descriptor('review-empty', true), {
      ...demo,
      recoveryContent: {
        storyletId: demo.recoveryContent.storyletId,
        reviews: demo.recoveryContent.reviews,
        ...(demo.recoveryContent.storyletByStage === undefined
          ? {}
          : { storyletByStage: demo.recoveryContent.storyletByStage }),
      },
    })
    expect(undebriefed.ok).toBe(false)
  })
})

describe('Grade 1 trust boundary', () => {
  it('rejects version/sequence/instance tampering and never reads client quality, score or Team', () => {
    const played = playGrade1(descriptor('g1-server', true), demo)
    const encoded = actionLogSchema.parse(serializeActionLog(played.log))
    const good = validateSubmittedRun(encoded, demo)
    expect(good.ok).toBe(true)
    expect(
      validateSubmittedRun(
        {
          ...encoded,
          quality: 'optimal',
          score: 999999,
          Team: 999999,
          career: {},
          graduated: true,
        },
        demo,
      ),
    ).toEqual(good)
    for (const field of [
      'gameVersion',
      'rulesetVersion',
      'contentVersion',
      'variantCatalogVersion',
      'scoreVersion',
      'planFingerprint',
    ])
      expect(
        validateSubmittedRun(
          {
            ...encoded,
            descriptor: { ...encoded.descriptor, [field]: 'forged' },
          },
          demo,
        ).ok,
      ).toBe(false)
    expect(
      validateSubmittedRun(
        { ...encoded, actions: encoded.actions.slice(1) },
        demo,
      ).ok,
    ).toBe(false)
    expect(
      validateSubmittedRun(
        { ...encoded, actions: encoded.actions.slice(0, -1) },
        demo,
      ).ok,
    ).toBe(false)
    const answered = encoded.actions.findIndex(
      (a) =>
        a.command.type === 'ANSWER' &&
        a.command.answer.kind === 'quantity-builder',
    )
    expect(answered).toBeGreaterThan(0)
    const target = encoded.actions[answered]!
    expect(
      validateSubmittedRun(
        {
          ...encoded,
          actions: encoded.actions.map((a, i) =>
            i === answered
              ? {
                  ...target,
                  command: { ...target.command, instanceId: 'forged' },
                }
              : a,
          ),
        },
        demo,
      ).ok,
    ).toBe(false)
  })

  it('rejects a known but unapproved variant and a missing ordinary approved pool', () => {
    const played = playGrade1(descriptor('g1-approval', true), demo)
    const view = played.views.find((v) => v.ref.templateId === 'y1.mobile-data')
    if (view === undefined || demo.approvedVariants === undefined)
      throw new Error('missing mobile')
    expect(
      materializeChallenge(
        played.state.descriptor,
        { ...view.ref, variantId: toVariantId('c00000') },
        demo,
      ).ok,
    ).toBe(false) // duplicate of the authored reference, never approved
    expect(
      materializeChallenge(
        played.state.descriptor,
        { ...view.ref, variantId: toVariantId('c99999') },
        demo,
      ).ok,
    ).toBe(false)
    const approved = demo.approvedVariants
    expect(
      createRun(descriptor('g1-approval', true), {
        ...demo,
        approvedVariants: {
          ...approved,
          variantsFor: (id) =>
            id === 'y1.mobile-data' ? [] : approved.variantsFor(id),
        },
      }).ok,
    ).toBe(false)
  })
})
