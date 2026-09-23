import { describe, expect, it, vi } from 'vitest'
import {
  createTestContext,
  identityFixture,
  playCareer,
} from '../helpers/competition'
import { identifyParticipant } from '@/server/competition/participants'
import { startAttempt, submitAttempt } from '@/server/competition/attempts'
import { loadPublicState } from '@/server/competition/ranking'
import { backfillRunSummaries } from '@/server/competition/backfill-summaries'
import { InMemoryCompetitionStore } from '@/server/persistence/competition/memory-store'
import { closeCareer } from '@/content/full-career'
import {
  careerNumbersOf,
  deriveAchievements,
} from '@/lib/presentation/ending-model'
import { readRunSummary } from '@/lib/competition/run-summary'

async function fixture(quality: 'optimal' | 'invalid' = 'optimal') {
  const store = new InMemoryCompetitionStore()
  const context = await createTestContext({ store })
  const identified = await identifyParticipant(
    context.participants,
    context.competition,
    identityFixture(),
  )
  if (!identified.ok) throw new Error('fixture identity')
  const participant = identified.value.participant
  const issued = await startAttempt(context, context.competition, participant)
  if (!issued.ok) throw new Error('fixture attempt')
  const played = playCareer(issued.value.descriptor, () => quality)
  const submitted = await submitAttempt(
    context,
    context.competition,
    participant,
    issued.value.attemptId,
    played.serialized,
  )
  expect(submitted.ok).toBe(true)
  return { ...context, store, participant, issued: issued.value, played }
}

describe('authoritative ranking summary', () => {
  it('persists the existing ending facts and reads a bounded batch without loading actions', async () => {
    const context = await fixture()
    const closing = closeCareer(context.played.final)
    const read = vi.spyOn(context.store, 'readAttemptSummaries')
    const actions = vi.spyOn(context.store, 'listAttempts')
    const state = await loadPublicState(context, context.competition, undefined)
    expect(read).toHaveBeenCalledExactlyOnceWith([context.issued.attemptId])
    expect(actions).not.toHaveBeenCalled()
    const summary = state.leaderboard[0]?.summary
    expect(summary?.career).toEqual(careerNumbersOf(context.played.final))
    // Integration with the RC3 content fix: a fully optimal run stores 10,
    // rather than the old expo-only average, and publishes that same grade.
    expect(summary?.career.promedio).toBe(10)
    expect(summary?.eventsPlayed).toBe(20)
    expect(
      summary?.components.find((part) => part.component === 'math')
        ?.opportunities,
    ).toBe(9)
    expect(summary?.recoveries).toBe(0)
    expect(summary?.achievements).toEqual(
      deriveAchievements(
        context.played.final,
        closing.milestones,
        closing.memories,
      ),
    )
    expect(
      summary?.components.reduce((sum, part) => sum + part.contribution, 0),
    ).toBe(state.leaderboard[0]?.fairScore)
    expect(JSON.stringify(state)).not.toMatch(
      /actionLog|mastery|fullName|dni|finalState|participantId/u,
    )
  })
  it('el resumen ya guardado separa desafíos puntuables de escenas y repasos', async () => {
    const context = await fixture('invalid')
    const state = await loadPublicState(context, context.competition, undefined)
    const summary = state.leaderboard[0]!.summary!
    const history = context.played.final.history
    const challenges = history.filter(
      (entry) => entry.challengeId !== undefined && entry.recovery !== true,
    )
    const recoveries = history.filter((entry) => entry.recovery === true)
    expect(challenges).toHaveLength(9)
    expect(recoveries.length).toBeGreaterThan(0)
    expect(
      summary.components.find((part) => part.component === 'math')
        ?.opportunities,
    ).toBe(challenges.length)
    expect(summary.recoveries).toBe(recoveries.length)
    expect(summary.eventsPlayed).toBeGreaterThan(
      challenges.length + recoveries.length,
    )
  })
  it('backfills once, supports dry-run and preserves scores, evidence and legacy data', async () => {
    const context = await fixture()
    const attempt = await context.store.findAttemptById(
      context.issued.attemptId,
    )
    if (!attempt) throw new Error('attempt')
    // Simulate a pre-projection record using the existing test store.
    await context.store.finalizeAttempt(attempt.id, ['VERIFIED'], {
      ...attempt,
      submittedAt: attempt.submittedAt ?? '',
      submissionDigest: attempt.submissionDigest ?? '',
      verifiedSummary: { graduated: true, profile: 'balanced' },
    })
    const before = await context.store.findAttemptById(attempt.id)
    expect(
      (await backfillRunSummaries(context.store, context.competition.id))
        .eligible,
    ).toBe(1)
    expect(await context.store.findAttemptById(attempt.id)).toEqual(before)
    expect(
      (await backfillRunSummaries(context.store, context.competition.id, true))
        .updated,
    ).toBe(1)
    expect(
      (await backfillRunSummaries(context.store, context.competition.id, true))
        .updated,
    ).toBe(0)
    const after = await context.store.findAttemptById(attempt.id)
    expect(after).toMatchObject({
      verifiedFairScore: attempt.verifiedFairScore,
      actionLog: attempt.actionLog,
      submissionDigest: attempt.submissionDigest,
    })
    expect(after?.verifiedSummary).toMatchObject({
      profile: 'balanced',
      ranking: { version: 1 },
    })
  })
  it('keeps all details attached to the selected best run, including after moderation', async () => {
    const context = await fixture()
    const first = await loadPublicState(
      context,
      context.competition,
      context.participant,
    )
    const issued = await startAttempt(
      context,
      context.competition,
      context.participant,
    )
    if (!issued.ok) throw new Error('second attempt')
    const played = playCareer(issued.value.descriptor, () => 'functional')
    const submitted = await submitAttempt(
      context,
      context.competition,
      context.participant,
      issued.value.attemptId,
      played.serialized,
    )
    expect(submitted.ok).toBe(true)
    const second = await loadPublicState(
      context,
      context.competition,
      context.participant,
    )
    expect(second.leaderboard[0]?.summary).toEqual(
      first.leaderboard[0]?.summary,
    )
    expect(second.leaderboard[0]?.fairScore).toBe(
      first.leaderboard[0]?.fairScore,
    )
    await context.store.invalidateAttempt(
      context.issued.attemptId,
      '2026-10-03T17:00:00Z',
      'test',
    )
    const promoted = await loadPublicState(
      context,
      context.competition,
      context.participant,
    )
    expect(promoted.leaderboard[0]?.fairScore).toBeLessThan(
      first.leaderboard[0]?.fairScore ?? 0,
    )
    expect(promoted.leaderboard[0]?.summary?.career).toEqual(
      careerNumbersOf(played.final),
    )
    await context.store.updateParticipant(context.participant.id, {
      nicknameHidden: true,
    })
    const moderated = await loadPublicState(
      context,
      context.competition,
      context.participant,
    )
    expect(moderated.leaderboard[0]?.nickname).toBe('Jugador oculto')
    expect(moderated.leaderboard[0]?.isYou).toBe(true)
  })
  it('does not rewrite historical scores when replay disagrees', async () => {
    const context = await fixture()
    const attempt = await context.store.findAttemptById(
      context.issued.attemptId,
    )
    if (!attempt) throw new Error('attempt')
    await context.store.finalizeAttempt(attempt.id, ['VERIFIED'], {
      ...attempt,
      submittedAt: attempt.submittedAt ?? '',
      submissionDigest: attempt.submissionDigest ?? '',
      verifiedFairScore: 1,
      verifiedSummary: { graduated: true },
    })
    const report = await backfillRunSummaries(
      context.store,
      context.competition.id,
      true,
    )
    expect(report.skipped).toBe(1)
    expect(report.updated).toBe(0)
    expect(
      (await context.store.findAttemptById(attempt.id))?.verifiedFairScore,
    ).toBe(1)
  })
  it('does not publish or reconstruct malformed summaries during reads', async () => {
    const context = await fixture()
    const attempt = await context.store.findAttemptById(
      context.issued.attemptId,
    )
    if (!attempt) throw new Error('attempt')
    await context.store.finalizeAttempt(attempt.id, ['VERIFIED'], {
      ...attempt,
      submittedAt: attempt.submittedAt ?? '',
      submissionDigest: attempt.submissionDigest ?? '',
      verifiedSummary: { ranking: { version: 999, fullName: 'private' } },
    })
    const state = await loadPublicState(context, context.competition, undefined)
    expect(state.leaderboard[0]?.summary).toBeUndefined()
    expect(state.leaderboard[0]?.fairScore).toBe(attempt.verifiedFairScore)
    expect(readRunSummary({ version: 999 })).toBeUndefined()
  })
})
