/** Authoring witnesses for 4.º, never imported by the player or server. */
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
import { grade3Answer } from './grade-3-play'
import {
  shiftSchema,
  shiftPlans,
} from '@/content/grade-4/challenges/shift-coverage'
import {
  fundraiserSchema,
  fundraiserPlans,
  marginReviewSchema,
  traysToBreakEven,
} from '@/content/grade-4/challenges/course-project-fundraiser'
import {
  flowSchema,
  flowPlans,
  STATIONS as FLOW_STATIONS,
} from '@/content/grade-4/challenges/school-event-flow'
import {
  floorSchema,
  floorSearch,
  capacityReviewSchema,
  seatsThatFit,
} from '@/content/grade-4/challenges/event-floor-plan'
import {
  representSchema,
  representPlans,
  PROPOSALS,
  fits,
} from '@/content/grade-4/challenges/represent-class'

function paramsOf(view: PublicChallengeView, deps: EngineDependencies) {
  const template = deps.catalog.template(view.ref.templateId)
  if (template === undefined) throw new Error('missing template')
  return template.variantSource.canonicalFor(
    view.ref.variantId,
    createVariantRng(view.ref),
  )
}

/** A semantic answer reaching `quality`, taken from each Template's own oracle. */
export function grade4Answer(
  view: PublicChallengeView,
  deps: EngineDependencies,
  quality: SolutionQuality = 'optimal',
  descriptor?: RunDescriptor,
): InteractionAnswer {
  const id = view.ref.templateId
  const params = paramsOf(view, deps)

  if (id === 'y4.shift-coverage') {
    const plan = shiftPlans(shiftSchema.parse(params))
      .filter((entry) => entry.quality === quality)
      .sort((left, right) => right.team - left.team)[0]
    if (plan === undefined) throw new Error(`missing ${quality} for ${id}`)
    return { kind: 'assignment-board', assignments: plan.assignments }
  }
  if (id === 'y4.course-project-fundraiser') {
    const plan = fundraiserPlans(fundraiserSchema.parse(params)).find(
      (entry) => entry.quality === quality,
    )
    if (plan === undefined) throw new Error(`missing ${quality} for ${id}`)
    return { kind: 'quantity-builder', lines: plan.lines }
  }
  if (id === 'y4.school-event-flow') {
    const p = flowSchema.parse(params)
    const plan = flowPlans(p).find((entry) => entry.quality === quality)
    if (plan !== undefined)
      return { kind: 'quantity-builder', lines: plan.lines }
    // Repartir más ayudantes de los que hay es inválido siempre, y el oráculo
    // no lo enumera porque sólo recorre repartos que existen.
    if (quality === 'invalid')
      return {
        kind: 'quantity-builder',
        lines: FLOW_STATIONS.map((station) => ({
          itemId: station.id,
          quantity: station.max,
        })),
      }
    throw new Error(`missing ${quality} for ${id}`)
  }
  if (id === 'y4.event-floor-plan') {
    if (quality === 'invalid') return { kind: 'spatial-layout', placements: [] }
    const found = floorSearch(floorSchema.parse(params))
    const placements = found.witnesses[quality]
    if (placements.length === 0) throw new Error(`missing ${quality} for ${id}`)
    return { kind: 'spatial-layout', placements }
  }
  if (id === 'y4.represent-class') {
    const p = representSchema.parse(params)
    const plan = representPlans(p).find((entry) => entry.quality === quality)
    if (plan === undefined) throw new Error(`missing ${quality} for ${id}`)
    return {
      kind: 'classification',
      entries: plan.entries,
      // La postura que más Aura deja para esa situación. Se elige aparte a
      // propósito: la respuesta de Math no la decide.
      stance: p.stakes === 'todo-el-colegio' ? 'del-curso' : 'propia',
    }
  }
  if (id === 'y4.margin-review') {
    const exact = traysToBreakEven(marginReviewSchema.parse(params))
    return {
      kind: 'numeric-input',
      value: String(
        quality === 'optimal'
          ? exact
          : quality === 'efficient'
            ? exact + 1
            : quality === 'functional'
              ? exact
              : exact + 40,
      ),
    }
  }
  if (id === 'y4.spatial-capacity-review') {
    const exact = seatsThatFit(capacityReviewSchema.parse(params))
    return {
      kind: 'numeric-input',
      value: String(
        quality === 'optimal'
          ? exact
          : quality === 'efficient'
            ? exact - 8
            : quality === 'functional'
              ? exact
              : exact + 96,
      ),
    }
  }
  return grade3Answer(view, deps, quality, descriptor)
}

/** Which proposals the limits actually allow, for tests that need the truth. */
export function viableProposals(
  view: PublicChallengeView,
  deps: EngineDependencies,
): readonly string[] {
  const p = representSchema.parse(paramsOf(view, deps))
  return PROPOSALS.filter((_, index) => fits(p, index)).map((entry) => entry.id)
}

export function playGrade4(
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
  for (let step = 0; step < 200 && state.status === 'active'; step++) {
    let command: GameCommand = { type: 'CONTINUE' }
    if (state.phase === 'challenge') {
      const view = activeChallengeView(state, deps)
      if (!view.ok || view.value === undefined)
        throw new Error('missing public view')
      views.push(view.value)
      command = {
        type: 'ANSWER',
        instanceId: view.value.ref.instanceId,
        answer: grade4Answer(
          view.value,
          deps,
          qualityFor(view.value.ref.templateId),
          descriptor,
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
