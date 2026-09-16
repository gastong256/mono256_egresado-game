/** Authoring witnesses for 3.º, never imported by the player or server. */
import {
  activeChallengeView,
  appendAction,
  createRun,
  createVariantRng,
  emptyActionLog,
  transition,
  type EngineDependencies,
  type GameCommand,
  type InteractionAnswer,
  type PublicChallengeView,
  type RunDescriptor,
  type SolutionQuality,
} from '@/game'
import { grade2Answer } from './grade-2-play'
import {
  friendDaySchema,
  dayPlans,
} from '@/content/grade-3/challenges/friend-day'
import {
  techSchema,
  techPlans,
  rateReviewSchema,
  fitsWhole,
} from '@/content/grade-3/challenges/course-project-tech'
import {
  weekSchema,
  weekPlans,
  absolute,
} from '@/content/grade-3/challenges/week-planner'
import {
  passSchema,
  passChoices,
  reviewSchema as passReviewSchema,
  breakEvenTrips,
} from '@/content/grade-3/challenges/transport-pass'
import {
  routeSchema,
  routePlans,
} from '@/content/grade-3/challenges/route-plan'

function paramsOf(view: PublicChallengeView, deps: EngineDependencies) {
  const template = deps.catalog.template(view.ref.templateId)
  if (template === undefined) throw new Error('missing template')
  return template.variantSource.canonicalFor(
    view.ref.variantId,
    createVariantRng(view.ref),
  )
}

/** A semantic answer reaching `quality`, taken from each Template's own oracle. */
export function grade3Answer(
  view: PublicChallengeView,
  deps: EngineDependencies,
  quality: SolutionQuality = 'optimal',
): InteractionAnswer {
  const id = view.ref.templateId
  const params = paramsOf(view, deps)

  if (id === 'y3.friend-day') {
    const plan = dayPlans(friendDaySchema.parse(params)).find(
      (entry) => entry.quality === quality,
    )
    if (plan === undefined) throw new Error(`missing ${quality} for ${id}`)
    return { kind: 'schedule-builder', placements: plan.placements }
  }
  if (id === 'y3.week-planner') {
    const p = weekSchema.parse(params)
    const plan = weekPlans(p).find((entry) => entry.quality === quality)
    if (plan === undefined) throw new Error(`missing ${quality} for ${id}`)
    return {
      kind: 'schedule-builder',
      // Lo que ya estaba tomado viaja igual que en la pantalla: la agenda lo
      // muestra con un solo horario posible.
      placements: [
        ...plan.placements,
        ...p.fixed.map((entry) => ({
          activityId: entry.id,
          startMinute: absolute(entry.day, entry.start),
        })),
      ],
    }
  }
  if (id === 'y3.course-project-tech') {
    const plan = techPlans(techSchema.parse(params)).find(
      (entry) => entry.quality === quality,
    )
    if (plan === undefined) throw new Error(`missing ${quality} for ${id}`)
    return { kind: 'quantity-builder', lines: plan.lines }
  }
  if (id === 'y3.transport-pass') {
    const choice = passChoices(passSchema.parse(params)).find(
      (entry) => entry.quality === quality,
    )
    if (choice === undefined) throw new Error(`missing ${quality} for ${id}`)
    return { kind: 'decision-card', optionId: choice.optionId }
  }
  if (id === 'y3.route-plan') {
    const plan = routePlans(routeSchema.parse(params)).find(
      (entry) => entry.quality === quality,
    )
    if (plan === undefined) throw new Error(`missing ${quality} for ${id}`)
    return { kind: 'route-builder', stops: plan.order }
  }
  if (id === 'y3.rate-capacity-review') {
    const whole = fitsWhole(rateReviewSchema.parse(params))
    return {
      kind: 'numeric-input',
      value: String(
        quality === 'optimal'
          ? whole
          : quality === 'functional'
            ? whole + 1
            : quality === 'efficient'
              ? whole - 1
              : whole + 7,
      ),
    }
  }
  if (id === 'y3.fixed-variable-review') {
    const exact = breakEvenTrips(passReviewSchema.parse(params))
    return {
      kind: 'numeric-input',
      value: String(
        quality === 'optimal'
          ? exact
          : quality === 'functional'
            ? exact - 1
            : quality === 'efficient'
              ? exact + 1
              : exact + 9,
      ),
    }
  }
  return grade2Answer(view, deps, quality)
}

export function playGrade3(
  descriptor: RunDescriptor,
  deps: EngineDependencies,
  qualityFor: (id: string) => SolutionQuality = () => 'optimal',
) {
  const created = createRun(descriptor, deps)
  if (!created.ok) throw new Error(`create: ${JSON.stringify(created.error)}`)
  let state = created.value.state
  let log = emptyActionLog(descriptor)
  const states = [state]
  const views: PublicChallengeView[] = []
  const commands: GameCommand[] = []
  for (let step = 0; step < 160 && state.status === 'active'; step++) {
    let command: GameCommand = { type: 'CONTINUE' }
    if (state.phase === 'challenge') {
      const view = activeChallengeView(state, deps)
      if (!view.ok || view.value === undefined)
        throw new Error('missing public view')
      views.push(view.value)
      command = {
        type: 'ANSWER',
        instanceId: view.value.ref.instanceId,
        answer: grade3Answer(
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
