import { describe, expect, it } from 'vitest'
import {
  developmentRecoveryPolicy,
  emptyProgression,
  obligationFor,
  obligationSourceOf,
  recordCoverage,
  recoveryContentIssues,
  recoveryCoverage,
  recoveryNotes,
  reviewsFor,
  runProgress,
  createRun,
  selectedObligation,
  toChallengeId,
  toStoryletId,
  toVariantId,
  withObligation,
  withRecovery,
  type ChallengeVariantRef,
  type RecoveryContent,
  type RecoveryObligation,
} from '@/game'
import { plannedEventCount } from '@/game/plan/composer'
import {
  createGrade1Dependencies,
  createGrade1RunDescriptor,
  grade1RecoveryContent,
} from '@/content/grade-1'
import { playGrade1, stressCaseQualities } from '../helpers/grade-1-play'

const deps = createGrade1Dependencies(true)
const stages = deps.ruleset.stages.map((stage) => stage.id)

function ref(templateId: string, variantId = 'c00001'): ChallengeVariantRef {
  const template = deps.catalog.template(toChallengeId(templateId))
  if (template === undefined) throw new Error(`missing ${templateId}`)
  return {
    familyId: template.family,
    templateId: template.id,
    variantId: toVariantId(variantId),
  }
}
function obligation(
  templateId: string,
  eventIndex: number,
): RecoveryObligation {
  const created = obligationFor(
    developmentRecoveryPolicy,
    'year-1',
    eventIndex,
    ref(templateId),
    'invalid',
  )
  if (created === undefined)
    throw new Error('INVALID must create an obligation')
  return created
}
const layout = obligation('y1.classroom-layout', 12)
const schedule = obligation('y1.rehearsal-schedule', 13)
const reviewsOf = (id: string) => reviewsFor(grade1RecoveryContent, id)

/** The same declaration with no authored debriefs. */
function undebriefed(content: RecoveryContent): RecoveryContent {
  const { debriefs, ...rest } = content
  return debriefs === undefined ? content : rest
}

describe('Repaso: una obligación seleccionada, el resto debriefeado', () => {
  it('selects the first obligation in canonical order, whatever order it was recorded in', () => {
    const progression = withObligation(
      withObligation(emptyProgression(), schedule),
      layout,
    )
    expect(selectedObligation(progression, 'year-1')).toEqual(layout)
    expect(selectedObligation(progression, 'year-2')).toBeUndefined()
    expect(
      obligationFor(
        developmentRecoveryPolicy,
        'year-1',
        1,
        ref('y1.classroom-layout'),
        'functional',
      ),
    ).toBeUndefined()
  })

  it('splits practised from debriefed by the routing the content set declares', () => {
    expect(
      recoveryCoverage([schedule, layout], 'y1.scale-fit-review', reviewsOf),
    ).toEqual({
      practised: [layout],
      debriefed: [schedule],
    })
    // Two sources routed to the same review are both practised by it: nothing to debrief.
    expect(
      recoveryCoverage([schedule, layout], 'y1.scale-fit-review', () => [
        'y1.scale-fit-review',
      ]).debriefed,
    ).toEqual([])
  })

  it('reads a closed obligation back from its semantic id and refuses anything else', () => {
    expect(obligationSourceOf(layout.id)).toEqual({
      stageId: 'year-1',
      sourceEventIndex: 12,
      source: layout.source,
    })
    for (const bad of [
      'nope',
      'year-9/1/classroom-space/y1.classroom-layout/c00001',
      'year-1/x/classroom-space/y1.classroom-layout/c00001',
      'year-1/1/classroom-space/y1.classroom-layout',
      'year-1/1/classroom space/y1.classroom-layout/c00001',
    ])
      expect(obligationSourceOf(bad)).toBeUndefined()
  })

  it('re-derives the split from the closed record, and treats a record without content as debrief only', () => {
    const owed = withObligation(
      withObligation(emptyProgression(), schedule),
      layout,
    )
    const closed = withRecovery(
      owed,
      'year-1',
      ref('y1.scale-fit-review'),
      'optimal',
      developmentRecoveryPolicy,
    )
    const record = closed.history[0]
    if (record === undefined) throw new Error('missing record')
    expect(record.resolved).toEqual([layout.id, schedule.id])
    expect(record.previa).toBe(false)
    expect(recordCoverage(record, reviewsOf)).toEqual({
      practised: [layout.id],
      debriefed: [schedule.id],
    })
    expect(
      recordCoverage({ ...record, content: undefined }, reviewsOf),
    ).toEqual({
      practised: [],
      debriefed: [layout.id, schedule.id],
    })
  })

  it('recoveryNotes returns authored notes, or exactly the obligations that would go unexplained', () => {
    const notes = recoveryNotes(
      grade1RecoveryContent,
      [schedule, layout],
      'y1.scale-fit-review',
    )
    expect(
      notes.ok && notes.value?.practised.map((note) => note.title),
    ).toEqual(['Escala y encastre'])
    expect(
      notes.ok && notes.value?.debriefed.map((note) => note.title),
    ).toEqual(['Agenda y traslados'])
    const bare = undebriefed(grade1RecoveryContent)
    expect(recoveryNotes(bare, [layout], 'y1.scale-fit-review')).toEqual({
      ok: true,
      value: undefined,
    })
    expect(
      recoveryNotes(bare, [schedule, layout], 'y1.scale-fit-review'),
    ).toEqual({
      ok: false,
      error: [schedule.id],
    })
    const partial: RecoveryContent = {
      ...grade1RecoveryContent,
      debriefs: { 'y1.classroom-layout': { title: 't', text: 'x' } },
    }
    expect(
      recoveryNotes(partial, [schedule, layout], 'y1.scale-fit-review'),
    ).toEqual({
      ok: false,
      error: [schedule.id],
    })
  })
})

describe('recoveryContentIssues: gaps fail before a run starts', () => {
  const base = {
    catalog: deps.catalog,
    storylets: deps.storylets,
    stages,
    ...(deps.approvedVariants === undefined
      ? {}
      : { approvedVariants: deps.approvedVariants }),
  }

  it('accepts the real Grade-1 declaration', () => {
    expect(
      recoveryContentIssues({
        ...base,
        recoveryContent: grade1RecoveryContent,
      }),
    ).toEqual([])
  })

  it('names unknown sources, recovery sources, empty routes and non-recovery reviews', () => {
    const issues = recoveryContentIssues({
      ...base,
      recoveryContent: {
        ...grade1RecoveryContent,
        reviews: {
          ...grade1RecoveryContent.reviews,
          'y1.unknown': [toChallengeId('y1.schedule-review')],
          'y1.schedule-review': [toChallengeId('y1.schedule-review')],
          'y1.mobile-data': [],
          'y1.course-project-expo': [toChallengeId('y1.mobile-data')],
          'y1.student-day-challenge-wheel': [toChallengeId('y1.missing')],
        },
      },
    })
    expect(issues).toEqual(
      expect.arrayContaining([
        'recovery source y1.unknown is not in the catalog',
        'recovery source y1.schedule-review is not ordinary content',
        'y1.mobile-data declares an empty review list; omit it for none',
        'review y1.mobile-data does not carry the recovery role',
        'review y1.missing for y1.student-day-challenge-wheel is not in the catalog',
        'y1.course-project-expo can leave year-1 owing and no declared review is eligible there',
      ]),
    )
  })

  it('names a missing frame, an empty approved pool, a missing debrief and unexplained routes', () => {
    expect(
      recoveryContentIssues({
        ...base,
        recoveryContent: {
          ...grade1RecoveryContent,
          storyletByStage: { 'year-1': toStoryletId('y1.nope') },
        },
      }),
    ).toContain('year-1 can owe a review and has no frame storylet')
    const approved = deps.approvedVariants
    if (approved === undefined) throw new Error('missing catalog')
    expect(
      recoveryContentIssues({
        ...base,
        recoveryContent: grade1RecoveryContent,
        approvedVariants: {
          ...approved,
          variantsFor: (id) =>
            id === 'y1.scale-fit-review' ? [] : approved.variantsFor(id),
        },
      }),
    ).toContain('no approved variants for review y1.scale-fit-review')
    const fewer = Object.fromEntries(
      Object.entries(grade1RecoveryContent.debriefs ?? {}).filter(
        ([source]) => source !== 'y1.classroom-layout',
      ),
    )
    expect(
      recoveryContentIssues({
        ...base,
        recoveryContent: { ...grade1RecoveryContent, debriefs: fewer },
      }),
    ).toContain('missing debrief for y1.classroom-layout')
    expect(
      recoveryContentIssues({
        ...base,
        recoveryContent: undebriefed(grade1RecoveryContent),
      }),
    ).toContain(
      'year-1 can owe concepts practised by different reviews and no debrief explains the ones a single review leaves out',
    )
  })
})

describe('progreso de etapa', () => {
  it('uses the composed length of each stage, never the ruleset fallback, in a composed run', () => {
    const partial = createGrade1Dependencies()
    const descriptor = createGrade1RunDescriptor('progress-partial')
    if (!descriptor.ok) throw new Error(descriptor.error.detail)
    const created = createRun(descriptor.value, partial)
    if (!created.ok || created.value.state.plan === undefined)
      throw new Error('missing plan')
    const state = created.value.state
    const progress = runProgress(state, partial.ruleset)
    const planned = state.plan!.stages.map((stage) => stage.eventCount)
    expect(progress.eventsInStage).toBe(planned[0])
    expect(progress.totalEvents).toBe(planned.reduce((a, b) => a + b, 0))
    expect(progress.totalEvents).toBeLessThan(
      partial.ruleset.stages.reduce((sum, stage) => sum + stage.eventCount, 0),
    )
    expect(progress.resolvedInStage).toBe(0)
    expect(progress.stageCells).toBe(progress.eventsInStage)
    const stage = partial.ruleset.stages[0]!
    expect(plannedEventCount(undefined, stage)).toBe(stage.eventCount)
    expect(plannedEventCount({ ...state.plan!, stages: [] }, stage)).toBe(
      stage.eventCount,
    )
  })

  it('adds one cell when the year opens its Repaso', () => {
    const played = playGrade1(
      (() => {
        const d = createGrade1RunDescriptor('progress-review', true)
        if (!d.ok) throw new Error(d.error.detail)
        return d.value
      })(),
      deps,
      stressCaseQualities(),
    )
    const reviewing = played.states.find(
      (state) =>
        state.stage === 'year-1' && state.activeEvent?.recovery === true,
    )
    if (reviewing === undefined) throw new Error('missing review state')
    const progress = runProgress(reviewing, deps.ruleset)
    expect(progress.resolvedInStage).toBe(progress.eventsInStage)
    expect(progress.stageCells).toBe(progress.eventsInStage + 1)
  })
})
