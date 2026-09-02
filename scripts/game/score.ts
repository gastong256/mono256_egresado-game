/**
 * Competitive score audit.
 *
 * Composes real Grade-7 run plans, applies synthetic performance profiles to
 * each, and reports what the policy does with them: what perfect play is worth
 * across every plan shape, whether more beats buy a higher ceiling, whether a
 * plan without collaboration or public-performance content costs a player
 * anything, and how far the secondary components can move a result.
 *
 *     pnpm game:score                      audit the candidate policy
 *     pnpm game:score -- --runs=20000
 *     pnpm game:score -- --compare         candidate weights against alternatives
 *
 * The comparison preserves Teacher Gate 1 traceability: the same authoritative
 * evidence under historical dev-1 and post-Gate dev-2, plus useful controls. It
 * is not a ranking and it does not pick a winner.
 */

import {
  auditScorePolicy,
  aggregate,
  composeRun,
  hasNoErrors,
  isOk,
  toRunSeed,
  candidateFairScorePolicy,
  fairScoreDev1Policy,
  AUDIT_PROFILES,
  SCORE_COMPONENTS,
  type AuditedPlan,
  type BeatEvidence,
  type CompetitiveScorePolicy,
  type ScoreAuditReport,
  type StageId,
} from '../../src/game'
import {
  createGrade7ComposedDependencies,
  grade7CompositionPolicy,
  GRADE_7_HOSTABLE_TEMPLATES,
} from '../../src/content/grade-7'
import {
  createComposedDevelopmentDependencies,
  composedDevelopmentCompositionPolicy,
  createSyntheticSixStageCompositionCatalog,
  syntheticSixStageCompositionPolicy,
  SYNTHETIC_SIX_STAGE_IDS,
} from '../../src/game/testing'

function readNumber(
  argv: readonly string[],
  name: string,
  fallback: number,
): number {
  const raw = argv
    .find((entry) => entry.startsWith(`--${name}=`))
    ?.slice(name.length + 3)
  const parsed = Number.parseInt(raw ?? '', 10)
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback
}

const argv = process.argv.slice(2)
const dependencies = createGrade7ComposedDependencies()
const runs = readNumber(argv, 'runs', 20_000)

/*
 * The population under audit.
 *
 * Deliberately mixed. Real composed Grade-7 years are two beats of pure
 * mathematics, and a sweep over only those would prove that the score works on
 * the one shape the current content set produces. The fairness claims are about
 * shapes this content does not have yet: a one-beat year, a plan with
 * collaboration evidence, a plan with public-performance evidence, a career of
 * six stages. Those come from fixtures, which is what fixtures are for.
 */
const development = createComposedDevelopmentDependencies()
const sixStage = createSyntheticSixStageCompositionCatalog()

/** Grade-7 restricted to a single ordinary beat, for the one-beat comparison. */
const oneBeatPolicy = {
  ...grade7CompositionPolicy,
  id: 'grade-7-one-beat-audit',
  stages: grade7CompositionPolicy.stages.map((stage) => ({
    ...stage,
    ordinaryBeats: { min: 1, max: 1 },
    difficulty: { target: 150, tolerance: 110 },
    hostableTemplates: [...GRADE_7_HOSTABLE_TEMPLATES],
  })),
}

const plans: AuditedPlan[] = []

function collect(
  population: string,
  count: number,
  catalog: Parameters<typeof composeRun>[0]['catalog'],
  stages: readonly StageId[],
  policy: Parameters<typeof composeRun>[0]['policy'],
  approvedVariants?: Parameters<typeof composeRun>[0]['approvedVariants'],
): void {
  for (let index = 0; index < count; index += 1) {
    const composed = composeRun({
      seed: toRunSeed(`score-${population}-${String(index)}`),
      stages,
      catalog,
      ...(approvedVariants === undefined ? {} : { approvedVariants }),
      policy,
    })
    if (composed.ok) {
      plans.push({ plan: composed.value, catalog, population })
    }
  }
}

collect(
  'grade-7',
  runs,
  dependencies.catalog,
  dependencies.ruleset.stages.map((stage) => stage.id),
  grade7CompositionPolicy,
  dependencies.approvedVariants,
)
collect(
  'grade-7-one-beat',
  Math.max(1, Math.floor(runs / 20)),
  dependencies.catalog,
  ['grade-7'],
  oneBeatPolicy,
  dependencies.approvedVariants,
)
collect(
  'development-career',
  Math.max(1, Math.floor(runs / 20)),
  development.catalog,
  development.ruleset.stages.map((stage) => stage.id),
  composedDevelopmentCompositionPolicy,
)
collect(
  'six-stage',
  Math.max(1, Math.floor(runs / 20)),
  sixStage,
  SYNTHETIC_SIX_STAGE_IDS,
  syntheticSixStageCompositionPolicy,
)

/**
 * Alternative weightings, for comparison only.
 *
 * dev-1 is historical; the others are controls. They show what moving the dial
 * does to the same runs without claiming an empirical winner.
 */
const ALTERNATIVES: readonly CompetitiveScorePolicy[] = [
  fairScoreDev1Policy,
  {
    ...candidateFairScorePolicy,
    id: 'fair-score-alt-math-90',
    version: '1.0.0-comparison',
    weights: { math: 9_000, team: 1_000, aura: 0 },
  },
  {
    ...candidateFairScorePolicy,
    id: 'fair-score-alt-no-reward',
    version: '1.0.0-comparison',
    difficultyReward: { core: 10_000, standard: 10_000, stretch: 10_000 },
  },
]

const COMPARISON_EVIDENCE: readonly {
  readonly label: string
  readonly math: number
  readonly team?: number
  readonly aura?: number
}[] = [
  { label: 'math-only', math: 7_500 },
  { label: 'math-and-team', math: 7_500, team: 5_000 },
  { label: 'math-team-aura', math: 7_500, team: 5_000, aura: 2_500 },
  { label: 'strong-math-low-secondary', math: 9_000, team: 1_000, aura: 1_000 },
  {
    label: 'weak-math-high-secondary',
    math: 4_000,
    team: 10_000,
    aura: 10_000,
  },
]

function comparisonEvidence(
  entry: (typeof COMPARISON_EVIDENCE)[number],
): BeatEvidence {
  const part = (value: number | undefined) =>
    value === undefined
      ? { achieved: 0, available: 0 }
      : { achieved: value * 10_000, available: 10_000 * 10_000 }
  return {
    templateId: 'audit.policy-comparison' as BeatEvidence['templateId'],
    band: 'core',
    difficultyReward: 10_000,
    math: part(entry.math),
    team: part(entry.team),
    aura: part(entry.aura),
  }
}

function comparisonLines(): string[] {
  const lines = [
    'Representative dev-1 vs dev-2 comparison',
    '  case                           policy             score   math   team   aura',
  ]
  for (const entry of COMPARISON_EVIDENCE) {
    for (const policy of [fairScoreDev1Policy, candidateFairScorePolicy]) {
      const result = aggregate([comparisonEvidence(entry)], policy)
      if (!isOk(result)) {
        lines.push(`  ${entry.label} ${policy.id} ERROR ${result.error.code}`)
        continue
      }
      const contribution = (component: 'math' | 'team' | 'aura') =>
        result.value.components.find((part) => part.component === component)
          ?.contribution ?? 0
      lines.push(
        `  ${entry.label.padEnd(30)} ${policy.id.padEnd(18)} ${String(result.value.fairScore).padStart(5)} ${String(contribution('math')).padStart(6)} ${String(contribution('team')).padStart(6)} ${String(contribution('aura')).padStart(6)}`,
      )
    }
  }
  return lines
}

function bar(value: {
  min: number
  max: number
  mean: number
  spread: number
}): string {
  return `min=${String(value.min)} mean=${String(value.mean)} max=${String(value.max)} spread=${String(value.spread)}`
}

const populations = [...new Set(plans.map((entry) => entry.population))]
  .map(
    (population) =>
      `${population}=${String(plans.filter((entry) => entry.population === population).length)}`,
  )
  .join(' ')

function report(audit: ScoreAuditReport): string[] {
  const lines: string[] = [
    `  policy           ${audit.policyId}@${audit.policyVersion} (official=${String(audit.official)})`,
    `  plans            ${String(audit.plans)}`,
    `  populations      ${populations}`,
    '',
  ]

  for (const profile of audit.profiles) {
    lines.push(
      `  ${profile.profileId.padEnd(26)} score ${bar(profile.score)} distinct=${String(profile.distinctScores)}`,
    )
    lines.push(
      `  ${' '.repeat(26)} contributions ${SCORE_COMPONENTS.map(
        (component) =>
          `${component}=${String(profile[component].mean)}/${String(profile.opportunities[component])} plans`,
      ).join(' ')}`,
    )
  }

  lines.push('', '  perfect play by plan shape')
  for (const shape of audit.byBeatCount) {
    lines.push(
      `    ${String(shape.beats)} beats  plans=${String(shape.plans)}  ${bar(shape.perfectScore)}`,
    )
  }

  lines.push(
    '',
    `  perfect with team opportunity     ${bar(audit.perfectWithTeam)} (${String(audit.perfectWithTeam.max === 0 ? 0 : 1)} present)`,
    `  perfect without team opportunity  ${bar(audit.perfectWithoutTeam)}`,
    `  perfect with aura opportunity     ${bar(audit.perfectWithAura)}`,
    `  perfect without aura opportunity  ${bar(audit.perfectWithoutAura)}`,
    `  rounding ties                     ${String(audit.roundingTies)}`,
  )

  if (audit.issues.length > 0) {
    lines.push('')
    for (const issue of audit.issues) {
      lines.push(
        `  ${issue.severity}: ${issue.code} ${issue.subject} — ${issue.message}`,
      )
    }
  }

  return lines
}

const audits: ScoreAuditReport[] = [
  auditScorePolicy({
    plans,
    policy: candidateFairScorePolicy,
    profiles: AUDIT_PROFILES,
  }),
]

if (argv.includes('--compare')) {
  for (const alternative of ALTERNATIVES) {
    audits.push(
      auditScorePolicy({
        plans,
        policy: alternative,
        profiles: AUDIT_PROFILES,
      }),
    )
  }
}

const out: string[] = ['Egresado competitive score audit']
for (const audit of audits) {
  out.push(...report(audit), '')
}
if (argv.includes('--compare')) {
  out.push(...comparisonLines(), '')
}

process.stdout.write(`${out.join('\n')}\n`)

if (audits.some((audit) => !hasNoErrors(audit.issues))) {
  process.exitCode = 1
}
