/** Authoring witnesses for 2.º, never imported by the player or server. */
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
import { grade1Answer } from './grade-1-play'
import {
  kitOrderSchema,
  kitPlans,
} from '@/content/grade-2/challenges/team-kit-order'
import {
  surveySchema,
  surveyClaims,
  reviewSchema,
  reviewClaims,
} from '@/content/grade-2/challenges/course-project-survey'
import {
  standingsSchema,
  standingClaims,
} from '@/content/grade-2/challenges/standings-claim'
import {
  courtSchema,
  courtPlans,
} from '@/content/grade-2/challenges/court-zones'
import {
  planSchema,
  planOptions,
} from '@/content/grade-2/challenges/intercurso-plan'

function paramsOf(view: PublicChallengeView, deps: EngineDependencies) {
  const template = deps.catalog.template(view.ref.templateId)
  if (template === undefined) throw new Error('missing template')
  return template.variantSource.canonicalFor(
    view.ref.variantId,
    createVariantRng(view.ref),
  )
}

/** A semantic answer reaching `quality`, taken from each Template's own oracle. */
export function grade2Answer(
  view: PublicChallengeView,
  deps: EngineDependencies,
  quality: SolutionQuality = 'optimal',
  descriptor?: RunDescriptor,
): InteractionAnswer {
  const id = view.ref.templateId
  const params = paramsOf(view, deps)

  if (id === 'y2.team-kit-order') {
    const plan = kitPlans(kitOrderSchema.parse(params)).find(
      (entry) => entry.quality === quality,
    )
    if (plan === undefined) throw new Error(`missing ${quality} for ${id}`)
    return { kind: 'quantity-builder', lines: plan.lines }
  }
  if (id === 'y2.course-project-survey') {
    const claims = surveyClaims(surveySchema.parse(params))
    const wrong = quality === 'invalid'
    return {
      kind: 'classification',
      entries: claims.map((claim, index) => ({
        statementId: claim.id,
        labelId: wrong
          ? claim.supported
            ? 'publish'
            : 'publish'
          : quality === 'optimal' || index > 0
            ? claim.supported
              ? 'publish'
              : 'hold'
            : 'hold',
      })),
    }
  }
  if (id === 'y2.data-claim-review') {
    const claims = reviewClaims(reviewSchema.parse(params))
    return {
      kind: 'classification',
      entries: claims.map((claim) => ({
        statementId: claim.id,
        labelId:
          quality === 'invalid'
            ? 'publish'
            : claim.supported
              ? 'publish'
              : 'hold',
      })),
    }
  }
  if (id === 'y2.standings-claim') {
    const claims = standingClaims(standingsSchema.parse(params))
    const wrong = quality === 'invalid'
    const notSure = claims.find((claim) => claim.truth !== 'seguro')
    // La postura que más Aura deja: cantar el campeonato sólo cuando la tabla
    // lo respalda, y publicar la tabla cuando no.
    const champion = claims.some((claim) => claim.truth === 'seguro')
    return {
      kind: 'classification',
      entries: claims.map((claim) => ({
        statementId: claim.id,
        labelId: wrong && claim.id === notSure?.id ? 'seguro' : claim.truth,
      })),
      stance: champion ? 'campeones' : 'tabla',
    }
  }
  if (id === 'y2.court-zones') {
    const plan = courtPlans(courtSchema.parse(params)).find(
      (entry) => entry.quality === quality,
    )
    if (plan === undefined) throw new Error(`missing ${quality} for ${id}`)
    return { kind: 'spatial-layout', placements: plan.placements }
  }
  if (id === 'y2.intercurso-plan') {
    // Entre los planes del nivel pedido, el que además deja el mejor Equipo:
    // así una carrera puede demostrar que Math y Equipo máximos conviven.
    const plan = planOptions(planSchema.parse(params))
      .filter((entry) => entry.quality === quality)
      .sort((left, right) => right.team - left.team)[0]
    if (plan === undefined) throw new Error(`missing ${quality} for ${id}`)
    return { kind: 'assignment-board', assignments: plan.assignments }
  }
  return grade1Answer(view, deps, quality, descriptor)
}

export function playGrade2(
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
  for (let step = 0; step < 120 && state.status === 'active'; step++) {
    let command: GameCommand = { type: 'CONTINUE' }
    if (state.phase === 'challenge') {
      const view = activeChallengeView(state, deps)
      if (!view.ok || view.value === undefined)
        throw new Error('missing public view')
      views.push(view.value)
      command = {
        type: 'ANSWER',
        instanceId: view.value.ref.instanceId,
        answer: grade2Answer(
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
