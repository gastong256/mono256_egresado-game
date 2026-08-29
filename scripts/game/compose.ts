/**
 * Reproducible composition audit.
 *
 *     pnpm game:compose -- --content=grade-7 --runs=20000
 *     pnpm game:compose -- --content=synthetic-six-stage --runs=5000
 *
 * The report has no timestamps or timings, so the same repository, seed prefix
 * and run count produce byte-for-byte identical output.
 */

import {
  auditComposition,
  hasNoErrors,
  type ApprovedVariantLookup,
  type CompositionAuditReport,
  type CompositionPolicy,
  type ContentCatalog,
  type CostDistribution,
  type StageId,
} from '../../src/game'
import {
  createComposedDevelopmentDependencies,
  composedDevelopmentCompositionPolicy,
  createSyntheticSixStageCompositionCatalog,
  syntheticSixStageCompositionPolicy,
  SYNTHETIC_SIX_STAGE_IDS,
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
  if (requested === 'synthetic-six-stage') {
    return {
      label: 'synthetic six-stage composition proof',
      stages: SYNTHETIC_SIX_STAGE_IDS,
      catalog: createSyntheticSixStageCompositionCatalog(),
      policy: syntheticSixStageCompositionPolicy,
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

interface Options {
  readonly runs: number
  readonly seedPrefix: string
}

function readOptions(argv: readonly string[]): Options {
  const read = (name: string): string | undefined =>
    argv.find((entry) => entry.startsWith(`--${name}=`))?.slice(name.length + 3)
  const parsed = Number.parseInt(read('runs') ?? '2000', 10)
  return {
    runs: Number.isSafeInteger(parsed) && parsed > 0 ? parsed : 2000,
    seedPrefix: read('seed') ?? 'audit',
  }
}

function ranked(counts: Readonly<Record<string, number>>): string {
  const entries = Object.entries(counts).sort(
    ([leftKey, left], [rightKey, right]) =>
      right === left
        ? leftKey < rightKey
          ? -1
          : leftKey > rightKey
            ? 1
            : 0
        : right - left,
  )
  return entries.length === 0
    ? '(none)'
    : entries.map(([key, count]) => `${key}=${String(count)}`).join(' ')
}

function cost(value: number): string {
  return (value / 100).toFixed(2)
}

function costDistribution(value: CostDistribution): string {
  return [
    `min=${cost(value.min)}`,
    `p10=${cost(value.p10)}`,
    `p25=${cost(value.p25)}`,
    `median=${cost(value.median)}`,
    `mean=${cost(value.mean)}`,
    `p75=${cost(value.p75)}`,
    `p90=${cost(value.p90)}`,
    `max=${cost(value.max)}`,
    `sd=${cost(value.standardDeviation)}`,
    `spread=${cost(value.spread)}`,
  ].join(' ')
}

function report(
  target: Target,
  seedPrefix: string,
  audit: CompositionAuditReport,
): void {
  const verification = audit.verification
  const lines: string[] = [
    'Egresado composition audit v2',
    `  content          ${target.label}`,
    `  policy           ${target.policy.id}@${target.policy.version} (official=${String(target.policy.official)})`,
    `  costs            ${target.policy.costPolicy.id}@${target.policy.costPolicy.version} (official=${String(target.policy.costPolicy.official)})`,
    `  seed prefix      ${seedPrefix}`,
    `  runs             ${String(audit.runs)}`,
    `  composed         ${String(audit.composed)}`,
    `  plan validation  ${String(verification.validated)} checked / ${String(verification.invalidPlans)} invalid`,
    `  JSON round-trip  ${String(verification.roundTrips)} checked / ${String(verification.roundTripFailures)} failures`,
    `  recomposition    ${String(verification.recompositions)} checked / ${String(verification.recompositionMismatches)} mismatches`,
    `  distinct plans   ${String(audit.distinctPlans)}`,
    `  duplicate plans  ${String(audit.duplicatePlans)}`,
    `  distinct ratio   ${(audit.distinctPlanRatio * 100).toFixed(2)}%`,
    `  ordinary beats   ${ranked(audit.counts.beats)}`,
    `  run load         ${costDistribution(audit.total)}`,
    '',
    `  templates        ${ranked(audit.counts.templates)}`,
    `  families         ${ranked(audit.counts.families)}`,
    `  roles            ${ranked(audit.counts.roles)}`,
    `  interactions     ${ranked(audit.counts.interactions)}`,
    `  domains          ${ranked(audit.counts.domains)}`,
    `  bands            ${ranked(audit.counts.bands)}`,
    `  distinct variants ${String(Object.keys(audit.counts.variants).length)}`,
    '',
  ]

  for (const stage of audit.stages) {
    lines.push(
      `  stage ${stage.stageId}`,
      `    load         ${costDistribution(stage.cost)}`,
      `    beats        ${ranked(stage.counts.beats)}`,
      `    templates    ${ranked(stage.counts.templates)}`,
      `    families     ${ranked(stage.counts.families)}`,
      `    roles        ${ranked(stage.counts.roles)}`,
      `    interactions ${ranked(stage.counts.interactions)}`,
      `    domains      ${ranked(stage.counts.domains)}`,
      `    bands        ${ranked(stage.counts.bands)}`,
      `    outside      ${String(stage.outsideEnvelope)}`,
    )
  }

  lines.push('', '  content selection')
  for (const entry of audit.contentStatus) {
    lines.push(
      `    ${entry.templateId} status=${entry.status} selections=${String(entry.selected)}`,
    )
  }

  lines.push('', '  variant coverage')
  for (const entry of audit.variantCoverage) {
    lines.push(
      `    ${entry.templateId} selected=${String(entry.selectedDistinct)}/${String(entry.available)} uses=${String(entry.selected)}`,
    )
  }

  lines.push('', '  dominant templates (>=80% of composed runs)')
  if (audit.dominantTemplates.length === 0) {
    lines.push('    (none)')
  } else {
    for (const entry of audit.dominantTemplates) {
      lines.push(
        `    ${entry.templateId} runs=${String(entry.runs)} share=${(entry.runShare * 100).toFixed(2)}%`,
      )
    }
  }

  if (Object.keys(audit.failures).length > 0) {
    lines.push('', `  failures ${ranked(audit.failures)}`)
  }
  if (Object.keys(verification.validationIssueCounts).length > 0) {
    lines.push(
      '',
      `  validation issues ${ranked(verification.validationIssueCounts)}`,
    )
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
const options = readOptions(argv)
const target = selectTarget(argv)
const audit = auditComposition({
  runs: options.runs,
  seedPrefix: options.seedPrefix,
  stages: target.stages,
  catalog: target.catalog,
  ...(target.approvedVariants === undefined
    ? {}
    : { approvedVariants: target.approvedVariants }),
  policy: target.policy,
})

report(target, options.seedPrefix, audit)
if (!hasNoErrors(audit.issues)) process.exitCode = 1
