/**
 * Auditoría de Estilo sobre la carrera completa.
 *
 * Estilo no puntúa: no entra en FairScore ni en Prestige y ningún eje es mejor
 * que otro. Lo que sí tiene que sostenerse es que sea una elección y no una
 * consecuencia de jugar bien. Estas pruebas lo miden en dos planos: por
 * Template —qué estilos quedan disponibles cuando la matemática ya es óptima— y
 * por carrera jugada —qué estilo termina dominando bajo distintas políticas.
 */
import { describe, expect, it } from 'vitest'
import {
  activeChallengeView,
  createRun,
  createVariantRng,
  transition,
  type EstiloAxis,
  type GameCommand,
  type InteractionAnswer,
  type PublicChallengeView,
  type RunState,
  type SolutionQuality,
} from '@/game'
import {
  createFullCareerDependencies,
  createFullCareerRunDescriptor,
} from '@/content/full-career'
import { grade5ApprovedVariants } from '@/content/grade-5'
import { grade5Answer } from '../helpers/grade-5-play'
import {
  planSchema,
  planOptions,
} from '@/content/grade-2/challenges/intercurso-plan'
import {
  friendDaySchema,
  dayPlans,
} from '@/content/grade-3/challenges/friend-day'
import {
  weekSchema,
  weekPlans,
  absolute,
} from '@/content/grade-3/challenges/week-planner'
import {
  fundraiserSchema,
  fundraiserPlans,
} from '@/content/grade-4/challenges/course-project-fundraiser'
import {
  finalSchema,
  finalPlans,
} from '@/content/grade-5/challenges/course-project-final'

const AXES = ['aplicado', 'estratega', 'improvisador'] as const

const dependencies = createFullCareerDependencies()

/** Un plan del oráculo: nivel, estilo y los campos de respuesta propios de su motor. */
interface StyledPlan {
  readonly quality: SolutionQuality
  readonly style?: EstiloAxis
}

/** Lee un campo de respuesta del plan sin atarse al motor de cada Template. */
function field(plan: StyledPlan, name: string): never {
  return (plan as unknown as Record<string, never>)[name] as never
}

/** Las Templates de 7.º a 5.º cuyo oráculo etiqueta estilo por plan. */
const styledTemplates: Record<
  string,
  (params: unknown) => readonly StyledPlan[]
> = {
  'y2.intercurso-plan': (params) => planOptions(planSchema.parse(params)),
  'y3.friend-day': (params) => dayPlans(friendDaySchema.parse(params)),
  'y3.week-planner': (params) => weekPlans(weekSchema.parse(params)),
  'y4.course-project-fundraiser': (params) =>
    fundraiserPlans(fundraiserSchema.parse(params)),
  'y5.course-project-final': (params) => finalPlans(finalSchema.parse(params)),
}

function paramsOf(templateId: string, variantId: string) {
  const template = dependencies.catalog.template(templateId as never)
  if (template === undefined) throw new Error(`missing ${templateId}`)
  return template.variantSource.canonicalFor(
    variantId as never,
    createVariantRng({
      familyId: template.family,
      templateId: template.id,
      variantId: variantId as never,
    }),
  )
}

/** Entre los planes válidos, uno del eje pedido; si no existe, el óptimo. */
function directedAnswer(
  view: PublicChallengeView,
  axis: EstiloAxis,
): InteractionAnswer | undefined {
  const id = view.ref.templateId
  const plans = styledTemplates[id]
  if (plans === undefined) return undefined
  const params = paramsOf(id, view.ref.variantId)
  const candidates = plans(params)
  const chosen =
    candidates.find(
      (plan) => plan.quality !== 'invalid' && plan.style === axis,
    ) ?? candidates.find((plan) => plan.quality === 'optimal')
  if (chosen === undefined) return undefined

  if (id === 'y2.intercurso-plan')
    return {
      kind: 'assignment-board',
      assignments: field(chosen, 'assignments'),
    }
  if (id === 'y3.friend-day')
    return {
      kind: 'schedule-builder',
      placements: field(chosen, 'placements'),
    }
  if (id === 'y3.week-planner') {
    const week = weekSchema.parse(params)
    return {
      kind: 'schedule-builder',
      placements: [
        ...(field(chosen, 'placements') as readonly never[]),
        ...week.fixed.map((entry) => ({
          activityId: entry.id,
          startMinute: absolute(entry.day, entry.start),
        })),
      ] as never,
    }
  }
  if (id === 'y4.course-project-fundraiser')
    return { kind: 'quantity-builder', lines: field(chosen, 'lines') }
  return {
    kind: 'classification',
    entries: field(chosen, 'entries'),
    stance: finalSchema.parse(params).visible ? 'avisar' : 'resolver',
  }
}

/** Una carrera completa jugada con una política de nivel y un eje dirigido. */
function playCareer(
  seed: string,
  quality: (templateId: string) => SolutionQuality,
  axis?: EstiloAxis,
): RunState | undefined {
  const built = createFullCareerRunDescriptor(seed)
  if (!built.ok) return undefined
  const created = createRun(built.value, dependencies)
  if (!created.ok) return undefined
  let state = created.value.state
  for (let step = 0; step < 240 && state.status === 'active'; step++) {
    let command: GameCommand = { type: 'CONTINUE' }
    if (state.phase === 'challenge') {
      const view = activeChallengeView(state, dependencies)
      if (!view.ok || view.value === undefined) return undefined
      const directed =
        axis === undefined ? undefined : directedAnswer(view.value, axis)
      command = {
        type: 'ANSWER',
        instanceId: view.value.ref.instanceId,
        answer:
          directed ??
          grade5Answer(
            view.value,
            dependencies,
            quality(view.value.ref.templateId),
            built.value,
          ),
      }
    }
    const next = transition(state, command, dependencies)
    if (!next.ok) return undefined
    state = next.value.state
  }
  return state.status === 'completed' ? state : undefined
}

function dominantAxis(state: RunState): EstiloAxis | 'empate' {
  const estilo = state.career.estilo
  const top = [...AXES].sort((left, right) => estilo[right] - estilo[left])[0]
  if (top === undefined) return 'empate'
  return AXES.filter((axis) => estilo[axis] === estilo[top]).length > 1
    ? 'empate'
    : top
}

describe('Estilo por Template', () => {
  it.each(Object.keys(styledTemplates))(
    '%s deja al menos dos estilos con la matemática óptima, en cada variante',
    (templateId) => {
      const variants = grade5ApprovedVariants.variantsFor(templateId as never)
      expect(variants.length).toBeGreaterThan(0)
      const reached = new Set<EstiloAxis>()
      for (const variantId of variants) {
        const plans = styledTemplates[templateId]
        if (plans === undefined) throw new Error('missing oracle')
        const optimal = plans(paramsOf(templateId, variantId)).filter(
          (plan) => plan.quality === 'optimal',
        )
        const styles = new Set(
          optimal.flatMap((plan) =>
            plan.style === undefined ? [] : [plan.style],
          ),
        )
        styles.forEach((style) => reached.add(style))
        // Ninguna variante puede obligar a un estilo para jugar perfecto.
        expect(styles.size).toBeGreaterThanOrEqual(2)
      }
      expect(reached.size).toBeGreaterThanOrEqual(2)
    },
  )

  it('ningún plan inválido etiqueta estilo', { timeout: 60_000 }, () => {
    for (const [templateId, plans] of Object.entries(styledTemplates))
      for (const variantId of grade5ApprovedVariants.variantsFor(
        templateId as never,
      ))
        for (const plan of plans(paramsOf(templateId, variantId)))
          if (plan.quality === 'invalid') expect(plan.style).toBeUndefined()
  })
})

describe('Estilo por carrera jugada', () => {
  it('la matemática óptima no fuerza un estilo', { timeout: 120_000 }, () => {
    const dominants = new Set<string>()
    let completed = 0
    for (let index = 0; index < 8; index++) {
      const state = playCareer(
        `style-optimal-${String(index)}`,
        () => 'optimal',
      )
      if (state === undefined) continue
      completed++
      dominants.add(dominantAxis(state))
    }
    expect(completed).toBe(8)
    // Jugando siempre óptimo aparece más de un estilo dominante: el eje lo
    // decide la forma de resolver, no el nivel alcanzado.
    expect(dominants.size).toBeGreaterThanOrEqual(2)
  })

  it.each(AXES)(
    'jugar dirigido a %s lo deja dominante en alguna carrera',
    { timeout: 120_000 },
    (axis) => {
      const dominants: (EstiloAxis | 'empate')[] = []
      for (let index = 0; index < 6; index++) {
        const state = playCareer(
          `style-directed-${String(index)}`,
          () => 'optimal',
          axis,
        )
        if (state !== undefined) dominants.push(dominantAxis(state))
      }
      expect(dominants.length).toBe(6)
      expect(dominants).toContain(axis)
    },
  )
})
