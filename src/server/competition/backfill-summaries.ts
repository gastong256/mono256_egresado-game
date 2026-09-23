import 'server-only'

import { parseActionLog } from '@/game'
import { validateSubmittedRun } from '@/server/game/validate-run'
import type { CompetitionStore } from '@/server/persistence/competition/store'
import { resolveEdition } from './editions'
import { summarizeVerifiedRun } from './run-summary'

/** Offline maintenance only. Public reads never import or invoke this module. */
export async function backfillRunSummaries(
  store: CompetitionStore,
  competitionId: string,
  write = false,
) {
  const report = { scanned: 0, eligible: 0, updated: 0, skipped: 0 }
  let afterId: string | undefined
  for (;;) {
    const batch = await store.listLegacySummaryAttempts(competitionId, afterId)
    if (batch.length === 0) break
    for (const attempt of batch) {
      if (attempt.status !== 'VERIFIED' || attempt.invalidatedAt !== undefined)
        continue
      report.scanned++
      const old =
        typeof attempt.verifiedSummary === 'object' &&
        attempt.verifiedSummary !== null
          ? attempt.verifiedSummary
          : {}
      if ('ranking' in old) {
        report.skipped++ // Never reinterpret another projection version.
        continue
      }
      const edition = resolveEdition(attempt)
      const log = parseActionLog(attempt.actionLog)
      if (
        !edition ||
        !log.ok ||
        log.value.descriptor.runId !== attempt.runId ||
        log.value.descriptor.seed !== attempt.seed ||
        log.value.descriptor.mode !== 'fair' ||
        log.value.descriptor.planFingerprint !== attempt.runPlanFingerprint
      ) {
        report.skipped++
        continue
      }
      const result = validateSubmittedRun(
        attempt.actionLog,
        edition.createDependencies(),
      )
      if (
        !result.ok ||
        !result.value.graduated ||
        result.value.competitiveScore?.fairScore !==
          attempt.verifiedFairScore ||
        (result.value.prestige?.total ?? 0) !== attempt.verifiedPrestigeScore
      ) {
        report.skipped++
        continue
      }
      const ranking = summarizeVerifiedRun(result.value)
      report.eligible++
      if (
        write &&
        (await store.saveAttemptSummary(attempt.id, { ...old, ranking }))
      )
        report.updated++
    }
    afterId = batch.at(-1)?.id
  }
  return report
}
