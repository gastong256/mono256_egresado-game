/** Dry-run by default; --write persists compatible verified summaries once. */
import { loadCompetitionEnvironment } from './environment'
import { requireCompetitionConfiguration } from '@/server/competition/config'
import { createCompetitionStore } from '@/server/competition/runtime'
import { backfillRunSummaries } from '@/server/competition/backfill-summaries'

loadCompetitionEnvironment()
const config = requireCompetitionConfiguration()
const store = createCompetitionStore()
const competition = await store.findCompetitionBySlug(config.slug)
if (!competition)
  throw new Error('No hay una competencia configurada en esta base.')
const write = process.argv.includes('--write')
const report = await backfillRunSummaries(store, competition.id, write)
process.stdout.write(
  `${JSON.stringify({ mode: write ? 'write' : 'dry-run', ...report })}\n`,
)
if (report.skipped > 0) process.exitCode = 2
