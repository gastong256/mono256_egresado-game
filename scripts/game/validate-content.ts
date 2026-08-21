/**
 * Content validator.
 *
 * Runs the automated stages of the content pipeline over the development
 * content set and prints a report. Errors fail the process so the check can gate
 * CI; warnings are informational.
 *
 * Run through `pnpm game:validate-content`. Options:
 *
 *     --seeds=<n>   generated instances per challenge per stage (default 200)
 *     --stats       also print the per-challenge generation statistics
 */

import { validateContent } from '../../src/game/content/validation'
import { createDevelopmentDependencies } from '../../src/game/testing/fixtures/development-ruleset'

function main(): void {
  const argv = process.argv.slice(2)
  const seedsArg = argv.find((entry) => entry.startsWith('--seeds='))
  const parsed = Number.parseInt(seedsArg?.slice(8) ?? '200', 10)
  const seedsPerChallenge =
    Number.isSafeInteger(parsed) && parsed > 0 ? parsed : 200

  const dependencies = createDevelopmentDependencies()
  const report = validateContent({
    ruleset: dependencies.ruleset,
    challenges: dependencies.challenges,
    storylets: dependencies.storylets,
    seedsPerChallenge,
  })

  const errors = report.issues.filter((issue) => issue.severity === 'error')
  const warnings = report.issues.filter((issue) => issue.severity === 'warning')

  process.stdout.write(
    [
      'Egresado content validation',
      `  ruleset     ${dependencies.ruleset.id}@${dependencies.ruleset.version}`,
      `  content     ${dependencies.ruleset.contentVersion}`,
      `  challenges  ${String(dependencies.challenges.definitions.length)}`,
      `  storylets   ${String(dependencies.storylets.length)}`,
      `  seeds each  ${String(seedsPerChallenge)}`,
      `  errors      ${String(errors.length)}`,
      `  warnings    ${String(warnings.length)}`,
      '',
    ].join('\n'),
  )

  if (argv.includes('--stats')) {
    for (const stats of report.generation) {
      process.stdout.write(
        `  · ${stats.challengeId}: ${String(stats.seedsChecked)} seeds, ${String(stats.distinctPresentations)} distinct, ${String(stats.failures)} failures\n`,
      )
    }
    process.stdout.write('\n')
  }

  for (const issue of warnings) {
    process.stdout.write(
      `  ~ ${issue.code} [${issue.subject}] ${issue.message}\n`,
    )
  }
  for (const issue of errors) {
    process.stdout.write(
      `  ! ${issue.code} [${issue.subject}] ${issue.message}\n`,
    )
  }

  if (!report.ok) {
    process.exitCode = 1
  }
}

main()
