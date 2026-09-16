/** Authoring witnesses for tests, never imported by the player or server. */
import {
  activeChallengeView,
  appendAction,
  createRun,
  createVariantRng,
  emptyActionLog,
  targetsFor,
  transition,
  type EngineDependencies,
  type GameCommand,
  type InteractionAnswer,
  type PublicChallengeView,
  type RunDescriptor,
  type SolutionQuality,
} from '@/game'
import {
  mobileDataSchema,
  mobilePlans,
} from '@/content/grade-1/challenges/mobile-data'
import {
  wheelSchema,
  wheelPlans,
} from '@/content/grade-1/challenges/student-day-challenge-wheel'
import {
  expoSchema,
  expoPlans,
} from '@/content/grade-1/challenges/course-project-expo'
import {
  scheduleSchema,
  schedulePlans,
} from '@/content/grade-1/challenges/rehearsal-schedule'
import {
  layoutSchema,
  layoutWitness,
} from '@/content/grade-1/challenges/classroom-layout'

/** Canonical parameters behind a public view, through the template's own source. */
export function paramsOf(view: PublicChallengeView, deps: EngineDependencies) {
  const template = deps.catalog.template(view.ref.templateId)
  if (template === undefined) throw new Error('missing real template')
  return template.variantSource.canonicalFor(
    view.ref.variantId,
    createVariantRng(view.ref),
  )
}

/**
 * A semantic answer that reaches `quality`, taken from the Template's own
 * independent oracle. INVALID is the empty construction, which every Grade-1
 * evaluator refuses as a plan because an essential piece is missing.
 */
export function grade1Answer(
  view: PublicChallengeView,
  deps: EngineDependencies,
  quality: SolutionQuality = 'optimal',
): InteractionAnswer {
  const p = view.interaction
  const params = paramsOf(view, deps)
  const id = view.ref.templateId
  if (p.kind === 'quantity-builder') {
    if (quality === 'invalid') return { kind: p.kind, lines: [] }
    const plans =
      id === 'y1.mobile-data'
        ? mobilePlans(mobileDataSchema.parse(params))
        : wheelPlans(wheelSchema.parse(params))
    const lines = plans.find((plan) => plan.quality === quality)?.lines
    if (lines === undefined) throw new Error(`missing ${quality} for ${id}`)
    return { kind: p.kind, lines }
  }
  if (p.kind === 'schedule-builder') {
    if (quality === 'invalid') return { kind: p.kind, placements: [] }
    const placements = schedulePlans(scheduleSchema.parse(params)).find(
      (plan) => plan.quality === quality,
    )?.placements
    if (placements === undefined)
      throw new Error(`missing ${quality} for ${id}`)
    return { kind: p.kind, placements }
  }
  if (p.kind === 'spatial-layout')
    return {
      kind: p.kind,
      placements:
        quality === 'invalid'
          ? []
          : layoutWitness(layoutSchema.parse(params), quality),
    }
  if (p.kind === 'assignment-board' && id === 'y1.course-project-expo') {
    if (quality === 'invalid') return { kind: p.kind, assignments: [] }
    const assignments = expoPlans(expoSchema.parse(params)).find(
      (plan) =>
        plan.quality === quality && (quality !== 'optimal' || plan.team === 3),
    )?.assignments
    if (assignments === undefined)
      throw new Error(`missing ${quality} for ${id}`)
    return { kind: p.kind, assignments }
  }
  // G7 portion: public, deliberately ordinary play. Its regressions have their
  // own optimal/worst-run suite; do not duplicate those private math oracles.
  switch (p.kind) {
    case 'route-builder':
      // Ningún año implementado hasta 1.º arma un recorrido; la rama existe
      // para que el día que alguno lo haga esto no compile en silencio.
      return { kind: p.kind, stops: p.points.map((point) => point.id) }
    case 'classification':
      return {
        kind: 'classification',
        entries: p.statements.map((statement) => ({
          statementId: statement.id,
          labelId: p.labels[0]?.id ?? '',
        })),
        ...(p.stance === undefined
          ? {}
          : { stance: p.stance.options[0]?.id ?? '' }),
      }
    case 'number-grid':
      return {
        kind: p.kind,
        rounds: p.rounds.map((round) => ({
          roundId: round.id,
          numbers: [...targetsFor(round.rule, round.numbers)],
        })),
      }
    case 'numeric-input':
      return { kind: p.kind, value: '30' }
    case 'timeline':
    case 'decision-card':
    case 'chart-interpretation':
    case 'information-request': {
      const option = p.options[0]
      if (option === undefined) throw new Error('no public option')
      return { kind: p.kind, optionId: option.id }
    }
    case 'assignment-board':
      return {
        kind: p.kind,
        assignments: p.tasks.flatMap((task, i) =>
          p.agents[i] === undefined
            ? []
            : [{ taskId: task.id, agentId: p.agents[i].id }],
        ),
      }
    case 'budget-builder':
      return {
        kind: p.kind,
        lines: p.items.map((item) => ({ itemId: item.id, quantity: 1 })),
      }
  }
}

export function playGrade1(
  descriptor: RunDescriptor,
  deps: EngineDependencies,
  qualityFor: (id: string) => SolutionQuality = () => 'optimal',
) {
  const created = createRun(descriptor, deps)
  if (!created.ok) throw new Error(`create: ${JSON.stringify(created.error)}`)
  let state = created.value.state,
    log = emptyActionLog(descriptor)
  const states = [state],
    views: PublicChallengeView[] = [],
    commands: GameCommand[] = []
  for (let step = 0; step < 80 && state.status === 'active'; step++) {
    let command: GameCommand = { type: 'CONTINUE' }
    if (state.phase === 'challenge') {
      const view = activeChallengeView(state, deps)
      if (!view.ok || view.value === undefined)
        throw new Error('missing public view')
      views.push(view.value)
      command = {
        type: 'ANSWER',
        instanceId: view.value.ref.instanceId,
        answer: grade1Answer(
          view.value,
          deps,
          qualityFor(view.value.ref.templateId),
        ),
      }
    }
    const next = transition(state, command, deps)
    if (!next.ok) throw new Error(`transition: ${JSON.stringify(next.error)}`)
    state = next.value.state
    log = appendAction(log, command)
    commands.push(command)
    states.push(state)
  }
  if (state.status !== 'completed') throw new Error('run exceeded its bound')
  return { state, log, states, views, commands }
}

/**
 * The seed-independent stress fixture the post-G1 audit starts from: both
 * recovery-capable Templates of 1.º in one stage, each forced INVALID, and
 * the single review forced to `review` quality.
 */
export function stressCaseQualities(review: SolutionQuality = 'invalid') {
  return (id: string): SolutionQuality =>
    id === 'y1.classroom-layout' || id === 'y1.rehearsal-schedule'
      ? 'invalid'
      : id.endsWith('-review')
        ? review
        : 'optimal'
}
