/**
 * Composition audit.
 *
 * Sweeps seeds, composes a run for each and reports the distribution: total
 * load, per-stage load, how often each template gets scheduled and how many
 * distinct plans came out. It is the evidence behind the claim that different
 * runs carry comparable difficulty.
 *
 *     pnpm game:compose                     the composed development career
 *     pnpm game:compose -- --content=grade-7
 *     pnpm game:compose -- --runs=5000
 *
 * Lives outside `src/game` for the usual reason: the deterministic core may not
 * read argv or write to stdout.
 */

import {
  auditComposition,
  formatCost,
  hasNoErrors,
  type CompositionAuditReport,
  type ContentCatalog,
  type CompositionPolicy,
  type ApprovedVariantLookup,
  type StageId,
} from '../../src/game'
import {
  createComposedDevelopmentDependencies,
  composedDevelopmentCompositionPolicy,
} from '../../src/game/testing'
import {
  createGrade7ComposedDependencies,
  grade7CompositionPolicy,
} from '../../src/content/grade-7'

interface Target {
  readonly label: string
  readonly stages: readonly StageId[]
  readonly catalog: ContentCatalog
  readonly approvedVariants?: ApprovedVariantLookup
  readonly policy: CompositionPolicy
}

function selectTarget(argv: readonly string[]): Target {
  const requested = argv
    .find((entry) => entry.startsWith('--content='))
    ?.slice('--content='.length)

  if (requested === 'grade-7') {
    const dependencies = createGrade7ComposedDependencies()
    return {
      label: 'grade-7 composed',
      stages: dependencies.ruleset.stages.map((stage) => stage.id),
      catalog: dependencies.catalog,
      ...(dependencies.approvedVariants === undefined
        ? {}
        : { approvedVariants: dependencies.approvedVariants }),
      policy: grade7CompositionPolicy,
    }
  }
  if (requested !== undefined && requested !== 'development') {
    throw new Error(`unknown content set: ${requested}`)
  }

  const dependencies = createComposedDevelopmentDependencies()
  return {
    label: 'development composed career',
    stages: dependencies.ruleset.stages.map((stage) => stage.id),
    catalog: dependencies.catalog,
    policy: composedDevelopmentCompositionPolicy,
  }
}

function readRuns(argv: readonly string[]): number {
  const raw = argv
    .find((entry) => entry.startsWith('--runs='))
    ?.slice('--runs='.length)
  const parsed = Number.parseInt(raw ?? '2000', 10)
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : 2000
}

function ranked(counts: Readonly<Record<string, number>>): string {
  return Object.entries(counts)
    .sort(([leftKey, left], [rightKey, right]) =>
      right === left ? (leftKey < rightKey ? -1 : 1) : right - left,
    )
    .map(([key, count]) => `${key}=${String(count)}`)
    .join(' ')
}

function report(target: Target, audit: CompositionAuditReport): void {
  const lines: string[] = [
    'Egresado composition audit',
    `  content        ${target.label}`,
    `  policy         ${target.policy.id}@${target.policy.version} (official=${String(target.policy.official)})`,
    `  costs          ${target.policy.costPolicy.id}@${target.policy.costPolicy.version}`,
    `  runs           ${String(audit.runs)}`,
    `  composed       ${String(audit.composed)}`,
    `  distinct plans ${String(audit.distinctPlans)}`,
    `  run load       ${formatCost(audit.total.min)} … ${formatCost(audit.total.max)} (mean ${formatCost(audit.total.mean)}, spread ${formatCost(audit.total.spread)})`,
    '',
  ]

  for (const stage of audit.stages) {
    lines.push(
      `  ${stage.stageId} load ${formatCost(stage.cost.min)}…${formatCost(stage.cost.max)} mean ${formatCost(stage.cost.mean)} · beats ${ranked(stage.beatCounts)} · bands ${ranked(stage.bandCounts)}`,
    )
    lines.push(`      templates ${ranked(stage.templateCounts)}`)
  }

  if (Object.keys(audit.failures).length > 0) {
    lines.push('', `  failures ${ranked(audit.failures)}`)
  }

  if (audit.issues.length > 0) {
    lines.push('')
    for (const issue of audit.issues) {
      lines.push(
        `  ${issue.severity}: ${issue.code} ${issue.subject} — ${issue.message}`,
      )
    }
  }

  process.stdout.write(`${lines.join('\n')}\n`)
}

const argv = process.argv.slice(2)
const target = selectTarget(argv)
const audit = auditComposition({
  runs: readRuns(argv),
  stages: target.stages,
  catalog: target.catalog,
  ...(target.approvedVariants === undefined
    ? {}
    : { approvedVariants: target.approvedVariants }),
  policy: target.policy,
})

report(target, audit)

if (!hasNoErrors(audit.issues)) {
  process.exitCode = 1
}
