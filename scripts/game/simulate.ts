/**
 * Engine simulator.
 *
 * Plays many deterministic development runs and reports the invariants that
 * matter for balancing and for catching structural defects: dead ends, invalid
 * scores, replay divergence and snapshot drift.
 *
 * Run through `pnpm game:simulate`. Options:
 *
 *     --runs=<n>       number of runs (default 500)
 *     --seed=<prefix>  seed prefix, so a sweep is reproducible (default "sim")
 *     --verify=<n>     run the replay/snapshot check every n runs (default 25)
 *     --verbose        print the per-run seed of every finding
     --content=<grade-7|development>  content set (default grade-7)
 *
 * This lives outside `src/game` on purpose: the deterministic core may not read
 * `process`, argv or stdout, so the tooling that drives it stays out here where
 * touching the environment is legitimate.
 */

import { createDevelopmentDependencies } from '../../src/game/testing/fixtures/development-ruleset'
import { createGrade7Dependencies } from '../../src/content/grade-7'
import type { EngineDependencies } from '../../src/game'
import { simulateMany } from '../../src/game/testing/simulation'

/**
 * Which content set to exercise.
 *
 * `grade-7` is the playable product content and the default. `development` is
 * the fixture set that exists to prove the engine itself, and stays available
 * for engine work.
 */
function selectDependencies(argv: readonly string[]): EngineDependencies {
  const requested = argv
    .find((entry) => entry.startsWith('--content='))
    ?.slice('--content='.length)

  if (requested === 'development') {
    return createDevelopmentDependencies()
  }
  if (requested !== undefined && requested !== 'grade-7') {
    throw new Error(`unknown content set: ${requested}`)
  }
  return createGrade7Dependencies()
}

interface Options {
  readonly runs: number
  readonly seedPrefix: string
  readonly verifyEvery: number
  readonly verbose: boolean
}

function parseOptions(argv: readonly string[]): Options {
  const read = (name: string): string | undefined => {
    const match = argv.find((entry) => entry.startsWith(`--${name}=`))
    return match?.slice(name.length + 3)
  }

  const runs = Number.parseInt(read('runs') ?? '500', 10)
  const verifyEvery = Number.parseInt(read('verify') ?? '25', 10)

  return {
    runs: Number.isSafeInteger(runs) && runs > 0 ? runs : 500,
    seedPrefix: read('seed') ?? 'sim',
    verifyEvery:
      Number.isSafeInteger(verifyEvery) && verifyEvery > 0 ? verifyEvery : 25,
    verbose: argv.includes('--verbose'),
  }
}

function formatCounts(counts: Readonly<Record<string, number>>): string {
  const entries = Object.entries(counts).sort(([left], [right]) =>
    left < right ? -1 : 1,
  )
  return entries.length === 0
    ? '(none)'
    : entries.map(([key, value]) => `${key}=${String(value)}`).join(' ')
}

function main(): void {
  const argv = process.argv.slice(2)
  const options = parseOptions(argv)
  const dependencies = selectDependencies(argv)

  const startedAt = process.hrtime.bigint()
  const summary = simulateMany(dependencies, {
    runs: options.runs,
    seedPrefix: options.seedPrefix,
    verifyEvery: options.verifyEvery,
  })
  const elapsedMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000

  process.stdout.write(
    [
      `Egresado engine simulation`,
      `  ruleset        ${dependencies.ruleset.id}@${dependencies.ruleset.version} (official=${String(dependencies.ruleset.official)})`,
      `  content        ${dependencies.ruleset.contentVersion}`,
      `  seed prefix    ${options.seedPrefix}`,
      `  runs           ${String(summary.runs)}`,
      `  completed      ${String(summary.completed)}`,
      `  events played  ${String(summary.totalEvents)}`,
      `  events per run ${summary.averageEvents.toFixed(2)}`,
      `  score min/avg/max ${String(summary.minScore)} / ${String(summary.averageScore)} / ${String(summary.maxScore)}`,
      `  qualities      ${formatCounts(summary.qualityCounts)}`,
      `  profiles       ${formatCounts(summary.profileCounts)}`,
      `  duration       ${elapsedMs.toFixed(0)} ms`,
      `  findings       ${String(summary.findings.length)}`,
      '',
    ].join('\n'),
  )

  if (summary.findings.length > 0) {
    const shown = options.verbose
      ? summary.findings
      : summary.findings.slice(0, 20)

    for (const finding of shown) {
      process.stdout.write(
        `  ! ${finding.code} [seed ${finding.seed}] ${finding.detail}\n`,
      )
    }
    if (shown.length < summary.findings.length) {
      process.stdout.write(
        `  ... ${String(summary.findings.length - shown.length)} more; re-run with --verbose\n`,
      )
    }
    process.exitCode = 1
    return
  }

  if (summary.completed !== summary.runs) {
    process.stdout.write('  ! not every run completed\n')
    process.exitCode = 1
  }
}

main()
