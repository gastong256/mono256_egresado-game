/** Authoring witnesses for 5.º, never imported by the player or server. */
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
import { grade4Answer } from './grade-4-play'
import {
  tripSchema,
  tripChoices,
  comparisonReviewSchema,
  totalWithBus,
} from '@/content/grade-5/challenges/final-trip'
import {
  finalSchema,
  finalPlans,
} from '@/content/grade-5/challenges/course-project-final'
import {
  screenSchema,
  screenChoices,
} from '@/content/grade-5/challenges/stage-screen'
import {
  yearbookSchema,
  yearbookPlans,
  proportionReviewSchema,
  pagesNeeded,
} from '@/content/grade-5/challenges/yearbook'
import {
  nextStepSchema,
  nextStepPlans,
} from '@/content/grade-5/challenges/next-step-options'

function paramsOf(view: PublicChallengeView, deps: EngineDependencies) {
  const template = deps.catalog.template(view.ref.templateId)
  if (template === undefined) throw new Error('missing template')
  return template.variantSource.canonicalFor(
    view.ref.variantId,
    createVariantRng(view.ref),
  )
}

/** A semantic answer reaching `quality`, taken from each Template's own oracle. */
export function grade5Answer(
  view: PublicChallengeView,
  deps: EngineDependencies,
  quality: SolutionQuality = 'optimal',
): InteractionAnswer {
  const id = view.ref.templateId
  const params = paramsOf(view, deps)

  if (id === 'y5.final-trip-or-event') {
    const choice = tripChoices(tripSchema.parse(params)).find(
      (entry) => entry.quality === quality,
    )
    if (choice === undefined) throw new Error(`missing ${quality} for ${id}`)
    return { kind: 'decision-card', optionId: choice.packageId }
  }
  if (id === 'y5.stage-screen') {
    const choice = screenChoices(screenSchema.parse(params)).find(
      (entry) => entry.quality === quality,
    )
    if (choice === undefined) throw new Error(`missing ${quality} for ${id}`)
    return { kind: 'decision-card', optionId: choice.wayId }
  }
  if (id === 'y5.yearbook') {
    const plan = yearbookPlans(yearbookSchema.parse(params)).find(
      (entry) => entry.quality === quality,
    )
    if (plan === undefined) throw new Error(`missing ${quality} for ${id}`)
    return { kind: 'quantity-builder', lines: plan.lines }
  }
  if (id === 'y5.next-step-options') {
    const plan = nextStepPlans(nextStepSchema.parse(params)).find(
      (entry) => entry.quality === quality,
    )
    if (plan === undefined) throw new Error(`missing ${quality} for ${id}`)
    // La preferencia va siempre igual: no se puntúa, así que no puede depender
    // del nivel que el test quiere alcanzar.
    return {
      kind: 'classification',
      entries: plan.entries,
      stance: 'sin-decidir',
    }
  }
  if (id === 'y5.course-project-final') {
    const p = finalSchema.parse(params)
    const plan = finalPlans(p).find((entry) => entry.quality === quality)
    if (plan === undefined) throw new Error(`missing ${quality} for ${id}`)
    return {
      kind: 'classification',
      entries: plan.entries,
      stance: p.visible ? 'avisar' : 'resolver',
    }
  }
  if (id === 'y5.multi-option-comparison-review') {
    const p = comparisonReviewSchema.parse(params)
    const exact = totalWithBus(p)
    return {
      kind: 'numeric-input',
      value: String(
        quality === 'optimal'
          ? exact
          : quality === 'functional'
            ? p.packagePrice + p.perPerson
            : quality === 'efficient'
              ? exact - p.perPerson
              : exact * 3,
      ),
    }
  }
  if (id === 'y5.proportion-capacity-review') {
    const exact = pagesNeeded(proportionReviewSchema.parse(params))
    return {
      kind: 'numeric-input',
      value: String(
        quality === 'optimal'
          ? exact
          : quality === 'functional'
            ? exact - 1
            : quality === 'efficient'
              ? exact + 1
              : exact + 20,
      ),
    }
  }
  return grade4Answer(view, deps, quality)
}

export function playGrade5(
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
  for (let step = 0; step < 240 && state.status === 'active'; step++) {
    let command: GameCommand = { type: 'CONTINUE' }
    if (state.phase === 'challenge') {
      const view = activeChallengeView(state, deps)
      if (!view.ok || view.value === undefined)
        throw new Error('missing public view')
      views.push(view.value)
      command = {
        type: 'ANSWER',
        instanceId: view.value.ref.instanceId,
        answer: grade5Answer(
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
