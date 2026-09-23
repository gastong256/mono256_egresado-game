/**
 * 3.º · Los mandados del sábado (`y3.route-plan`).
 *
 * Una mañana, cuatro o cinco lugares en el barrio y una hora a la que hay que
 * estar de vuelta. Cada lugar está en una esquina de la cuadrícula, abre y
 * cierra a su hora y te lleva un rato adentro. La respuesta es el **orden**.
 *
 * El orden no es decorado: cambiarlo cambia cuántas cuadras caminás, y encima
 * cambia a qué hora llegás a cada lugar, así que un recorrido puede ser
 * imposible sólo por estar al revés. Una variante donde todos los órdenes den
 * lo mismo no se aprueba.
 *
 * No es el plano de 1.º ni las zonas de 2.º: acá la geometría es de red y
 * distancia, no de encastre ni de región. Es Math sola: no hay Equipo, Aura ni
 * Estilo, y no tiene Repaso.
 */
import { z } from 'zod'
import {
  authoredVariantIds,
  defineChallenge,
  err,
  ok,
  toChallengeId,
  toScenarioFamilyId,
  type InteractionAnswer,
  type SolutionQuality,
} from '@/game'
import {
  at,
  candidateAxes,
  digit,
  generatedSource,
  outcome,
  parameters,
  spaceOf,
  tierWitnessIssues,
} from '@/content/authoring'
import { graded } from '../../grades'

/** El barrio: nueve por siete esquinas, que es lo que entra a 320 px. */
export const MAP = { width: 8, height: 6 } as const

export const STOPS = [
  { id: 'panaderia', label: 'La panadería', code: 'P', optional: false },
  { id: 'correo', label: 'El correo', code: 'C', optional: false },
  { id: 'biblioteca', label: 'La biblioteca', code: 'B', optional: false },
  { id: 'vivero', label: 'El vivero', code: 'V', optional: true },
  { id: 'kiosco', label: 'El kiosco', code: 'K', optional: true },
] as const
export type StopId = (typeof STOPS)[number]['id']

const coordinate = z.strictObject({
  x: z.number().int().min(0).max(8),
  y: z.number().int().min(0).max(6),
})
const minute = z.number().int().min(0).max(1439).multipleOf(5)
const stopSchema = z.strictObject({
  id: z.enum(['panaderia', 'correo', 'biblioteca', 'vivero', 'kiosco']),
  at: coordinate,
  /** Cuánto te quedás adentro. */
  stay: z.number().int().min(5).max(30).multipleOf(5),
  /** Cuándo abre y cuándo cierra. Hay que entrar y salir dentro de eso. */
  opens: minute,
  closes: minute,
})
export const routeSchema = z
  .strictObject({
    shape: z.enum(['cierra-temprano', 'abre-tarde', 'lejos']),
    home: coordinate,
    /** A qué hora salís y a qué hora tenés que estar de vuelta. */
    start: minute,
    deadline: minute,
    /** Lo que se tarda en caminar una cuadra. */
    perBlock: z.number().int().min(2).max(6),
    stops: z.array(stopSchema).min(5).max(5),
  })
  .refine((p) => p.deadline > p.start, 'la vuelta es antes de la salida')
  .refine(
    (p) => p.stops.every((stop) => stop.closes - stop.opens >= stop.stay),
    'un lugar cierra antes de que puedas entrar',
  )
  .refine(
    (p) =>
      new Set(
        p.stops.map((stop) => `${String(stop.at.x)},${String(stop.at.y)}`),
      ).size === p.stops.length,
    'dos lugares en la misma esquina',
  )
export type RouteParams = z.infer<typeof routeSchema>
export type Stop = RouteParams['stops'][number]

export function clockText(value: number): string {
  return `${String(Math.floor(value / 60)).padStart(2, '0')}:${String(value % 60).padStart(2, '0')}`
}

/** Cuadras entre dos esquinas: se camina por la calle, no en diagonal. */
export function blocksBetween(
  from: { readonly x: number; readonly y: number },
  to: { readonly x: number; readonly y: number },
): number {
  return Math.abs(from.x - to.x) + Math.abs(from.y - to.y)
}

export interface RouteOutcome {
  readonly quality: SolutionQuality
  /** Hora a la que volvés a casa, si el recorrido se puede hacer. */
  readonly back?: number
  readonly blocks: number
  /** Dónde se rompió, para poder decirlo con nombre. */
  readonly failure?: { readonly stopId: StopId; readonly reason: 'cerrado' }
  readonly late?: boolean
  readonly missing?: StopId
}

/**
 * La lectura completa de un recorrido, en minutos enteros.
 *
 * Se camina, se espera si llegaste antes de que abra, se está el rato de
 * adentro y se sigue. Esperar está permitido: lo que no está permitido es
 * llegar cuando ya cerró, ni volver después de la hora.
 */
export function readRoute(
  p: RouteParams,
  order: readonly string[],
): RouteOutcome {
  const missing = p.stops.find(
    (stop) =>
      !STOPS.find((entry) => entry.id === stop.id)?.optional &&
      !order.includes(stop.id),
  )
  if (missing !== undefined)
    return { quality: 'invalid', blocks: 0, missing: missing.id }

  let position = p.home
  let clock = p.start
  let blocks = 0
  for (const stopId of order) {
    const stop = p.stops.find((entry) => entry.id === stopId)
    if (stop === undefined)
      return { quality: 'invalid', blocks, missing: 'panaderia' }
    const walk = blocksBetween(position, stop.at)
    blocks += walk
    const arrival = Math.max(clock + walk * p.perBlock, stop.opens)
    if (arrival + stop.stay > stop.closes)
      return {
        quality: 'invalid',
        blocks,
        failure: { stopId: stop.id, reason: 'cerrado' },
      }
    clock = arrival + stop.stay
    position = stop.at
  }
  const walkHome = blocksBetween(position, p.home)
  blocks += walkHome
  const back = clock + walkHome * p.perBlock
  if (back > p.deadline) return { quality: 'invalid', blocks, back, late: true }

  const extras = order.filter(
    (stopId) => STOPS.find((entry) => entry.id === stopId)?.optional === true,
  ).length
  return {
    quality:
      extras >= 2 ? 'optimal' : extras === 1 ? 'efficient' : 'functional',
    back,
    blocks,
  }
}

export interface RoutePlan {
  readonly order: readonly string[]
  readonly quality: SolutionQuality
  readonly blocks: number
}

/**
 * Oráculo independiente: todos los recorridos posibles.
 *
 * Son los subconjuntos que incluyen lo obligatorio, en todos sus órdenes. Con
 * cinco lugares eso son ciento setenta y cuatro recorridos: se enumeran, no se
 * buscan, y nunca se llama al evaluador.
 */
export function routePlans(p: RouteParams): readonly RoutePlan[] {
  const required = p.stops
    .filter((stop) => !STOPS.find((entry) => entry.id === stop.id)?.optional)
    .map((stop) => stop.id)
  const optional = p.stops
    .filter((stop) => STOPS.find((entry) => entry.id === stop.id)?.optional)
    .map((stop) => stop.id)

  const permutations = (items: readonly string[]): readonly string[][] =>
    items.length <= 1
      ? [[...items]]
      : items.flatMap((item, index) =>
          permutations([
            ...items.slice(0, index),
            ...items.slice(index + 1),
          ]).map((rest) => [item, ...rest]),
        )

  const plans: RoutePlan[] = []
  for (let mask = 0; mask < 1 << optional.length; mask++) {
    const chosen = optional.filter((_, index) => (mask & (1 << index)) !== 0)
    for (const order of permutations([...required, ...chosen])) {
      const read = readRoute(p, order)
      plans.push({ order, quality: read.quality, blocks: read.blocks })
    }
  }
  return plans
}

const HOMES = [
  { x: 0, y: 0 },
  { x: 8, y: 0 },
  { x: 0, y: 6 },
  { x: 4, y: 6 },
] as const
const LAYOUTS = [
  [
    { x: 2, y: 1 },
    { x: 6, y: 2 },
    { x: 3, y: 5 },
    { x: 7, y: 5 },
    { x: 1, y: 4 },
  ],
  [
    { x: 5, y: 1 },
    { x: 1, y: 3 },
    { x: 7, y: 4 },
    { x: 3, y: 2 },
    { x: 6, y: 6 },
  ],
  [
    { x: 1, y: 2 },
    { x: 4, y: 4 },
    { x: 8, y: 3 },
    { x: 2, y: 6 },
    { x: 5, y: 0 },
  ],
  [
    { x: 3, y: 3 },
    { x: 7, y: 1 },
    { x: 2, y: 5 },
    { x: 5, y: 6 },
    { x: 8, y: 5 },
  ],
] as const
const WINDOWS = [
  [
    [540, 660],
    [540, 720],
    [600, 780],
    [540, 780],
    [540, 780],
  ],
  [
    [570, 690],
    [600, 660],
    [540, 750],
    [630, 780],
    [540, 700],
  ],
  [
    [540, 630],
    [570, 750],
    [620, 780],
    [540, 720],
    [600, 780],
  ],
] as const
const STAYS = [
  [15, 20, 10, 10, 5],
  [10, 25, 15, 5, 10],
  [20, 15, 20, 10, 5],
] as const
const DEADLINES = [780, 800, 820] as const
const PER_BLOCK = [2, 3, 4] as const
const SHAPES = ['cierra-temprano', 'abre-tarde', 'lejos'] as const
const RADICES = [
  SHAPES.length,
  HOMES.length,
  LAYOUTS.length,
  WINDOWS.length,
  STAYS.length,
  DEADLINES.length,
  PER_BLOCK.length,
]
export const ROUTE_SPACE = spaceOf(RADICES)

export function generateRoute(index: number): RouteParams {
  const axes = candidateAxes(index, RADICES, 373)
  const shape = at(SHAPES, digit(axes, 0))
  const layout = at(LAYOUTS, digit(axes, 2))
  const windows = at(WINDOWS, digit(axes, 3))
  const stays = at(STAYS, digit(axes, 4))
  // La forma dice qué aprieta: un lugar que cierra temprano, uno que abre tarde
  // o un barrio con las esquinas lejos. Cada una tiene su propia firma.
  const perBlock = shape === 'lejos' ? 5 : at(PER_BLOCK, digit(axes, 6))
  return routeSchema.parse({
    shape,
    home: HOMES[digit(axes, 1)] ?? HOMES[0],
    start: 540,
    deadline: at(DEADLINES, digit(axes, 5)),
    perBlock,
    stops: STOPS.map((stop, position) => {
      const window = windows[position] ?? [540, 780]
      const early = shape === 'cierra-temprano' && position === 0
      const late = shape === 'abre-tarde' && position === 1
      return {
        id: stop.id,
        at: layout[position] ?? { x: 0, y: 0 },
        stay: stays[position] ?? 10,
        opens: late ? Math.max(window[0], 620) : window[0],
        closes: early ? Math.min(window[1], 640) : window[1],
      }
    }),
  })
}

export function routeGates(p: RouteParams): readonly string[] {
  const issues: string[] = []
  const plans = routePlans(p)
  issues.push(...tierWitnessIssues(plans))

  const valid = plans.filter((plan) => plan.quality !== 'invalid')
  if (valid.length === 0) issues.push('ningún recorrido llega')

  // LOCKED: el orden cambia materialmente el resultado. Tiene que haber dos
  // recorridos con los mismos lugares y distinto final, y además la distancia
  // del mejor tiene que ser distinta de la del peor.
  const byStops = new Map<string, Set<SolutionQuality>>()
  const blocksByStops = new Map<string, Set<number>>()
  for (const plan of plans) {
    const key = [...plan.order].sort().join('+')
    const qualities = byStops.get(key) ?? new Set<SolutionQuality>()
    qualities.add(plan.quality)
    byStops.set(key, qualities)
    const blocks = blocksByStops.get(key) ?? new Set<number>()
    blocks.add(plan.blocks)
    blocksByStops.set(key, blocks)
  }
  if (![...byStops.values()].some((qualities) => qualities.size > 1))
    issues.push('el orden no cambia si el recorrido se puede hacer')
  if (![...blocksByStops.values()].some((blocks) => blocks.size > 1))
    issues.push('el orden no cambia las cuadras')

  // Los horarios tienen que apretar: si nada cierra a tiempo, esto es una suma.
  if (
    !plans.some(
      (plan) => readRoute(p, plan.order).failure?.reason === 'cerrado',
    )
  )
    issues.push('ningún recorrido llega con el lugar cerrado')
  if (!plans.some((plan) => readRoute(p, plan.order).late === true))
    issues.push('ningún recorrido vuelve tarde')
  // Y no puede ser que cualquier orden sirva.
  if (valid.length > plans.length * 0.8)
    issues.push('casi cualquier orden sirve')
  return issues
}

const STOP_LABEL = Object.fromEntries(
  STOPS.map((stop) => [stop.id, stop.label]),
) as Record<StopId, string>

export function evaluateRoute(p: RouteParams, order: readonly string[]) {
  if (
    new Set(order).size !== order.length ||
    order.some((stopId) => !p.stops.some((stop) => stop.id === stopId))
  )
    return err({
      kind: 'invalid-answer' as const,
      detail: 'parada repetida o fuera de contrato',
    })

  const read = readRoute(p, order)
  return ok(
    outcome(
      read.quality,
      {
        outcomeKey: `route-plan.${p.shape}.${read.quality}`,
        stamp: read.quality === 'invalid' ? 'Colgado' : 'Hecho',
        facts: [
          {
            label: 'Recorrido',
            value:
              order.length === 0
                ? 'no saliste'
                : order
                    .map((stopId) => STOP_LABEL[stopId as StopId] ?? stopId)
                    .join(' → '),
          },
          { label: 'Cuadras', value: String(read.blocks) },
          {
            label: 'Volvés',
            value:
              read.back === undefined
                ? 'no volvés'
                : `${clockText(read.back)} · límite ${clockText(p.deadline)}`,
          },
        ],
        ...(read.quality === 'invalid'
          ? {
              violatedConstraint:
                read.missing !== undefined
                  ? `${STOP_LABEL[read.missing]} quedó sin hacer.`
                  : read.failure !== undefined
                    ? `Llegás a ${STOP_LABEL[read.failure.stopId]} cuando ya cerró.`
                    : 'Volvés a casa después de la hora.',
            }
          : {}),
        consequence:
          read.quality === 'invalid'
            ? 'Con ese orden algo queda sin hacer.'
            : read.quality === 'optimal'
              ? 'Entraron los mandados y todavía te dio para las dos vueltas de más.'
              : 'Los mandados están hechos y volvés a horario.',
      },
      {},
      [{ flag: 'y3.route.outcome', value: read.quality }],
    ),
  )
}

export const routeVariants = generatedSource({
  id: 'y3.route-plan.order',
  version: '1',
  schema: routeSchema,
  size: ROUTE_SPACE,
  generate: generateRoute,
  gates: routeGates,
})

const routePlanDefinition = defineChallenge<RouteParams, RouteParams>({
  id: toChallengeId('y3.route-plan'),
  family: toScenarioFamilyId('barrio'),
  placement: 'anchor',
  variants: authoredVariantIds(routeVariants.authored),
  variantSource: routeVariants,
  interaction: 'route-builder',
  stages: ['year-3'],
  categories: ['space-and-shape', 'time-and-rates'],
  baseDifficulty: 4,
  // Dos relaciones encadenadas —cuadras que son minutos, y minutos que deciden
  // si llegás abierto—, tres restricciones sostenidas a la vez, elegir qué
  // lugares entran, optimizar el orden y construir la respuesta: carga 8, que
  // `bandOf` lee como STRETCH.
  cognitive: {
    steps: 2,
    constraints: 3,
    selection: 1,
    optimization: 1,
    uncertainty: 0,
    construction: 1,
  },
  composition: {
    primaryReasoningFamily: 'SPATIAL',
    interactionEngine: 'spatial-graph',
    pacingClass: 'DEEP',
    chronology: 60,
  },
  scoring: {
    math: 'discrete-quality',
    team: 'none',
    aura: 'none',
    rationale:
      'La cuenta es distancia, tiempo y orden de visita: nadie más participa del recorrido, así que no hay Equipo ni Aura, y elegir un orden no describe una estrategia de vida, así que tampoco hay Estilo.',
  },
  tools: ['notepad', 'ruler'],
  generate: ({ params }) => parameters(routeSchema, params),
  verify: (p) =>
    p.stops.every((stop) => stop.closes > stop.opens)
      ? []
      : ['un lugar cierra antes de abrir'],
  narrate: () => ({
    title: 'Los mandados del sábado',
    setup:
      'Te tocan los mandados del sábado y hay que estar de vuelta para el almuerzo. Cada lugar abre y cierra a su hora.',
    goal: 'Armá el orden del recorrido para llegar a todo y volver a tiempo.',
  }),
  present: (p) => ({
    kind: 'route-builder',
    instructions:
      'Elegí en qué orden vas. Podés esperar si llegás antes de que abra, pero no entrar después de que cierre.',
    data: [
      { label: 'Salís', value: clockText(p.start) },
      {
        label: 'Tenés que volver',
        value: clockText(p.deadline),
        constraint: true,
      },
      {
        label: 'Cada cuadra',
        value: String(p.perBlock),
        unit: 'minutos caminando',
        span: 2,
      },
    ],
    width: MAP.width,
    height: MAP.height,
    origin: {
      id: 'casa',
      label: 'Tu casa',
      code: 'H',
      x: p.home.x,
      y: p.home.y,
      detail: `esquina ${String(p.home.x)} y ${String(p.home.y)}`,
      optional: false,
    },
    points: p.stops.map((stop) => {
      const meta = STOPS.find((entry) => entry.id === stop.id)
      return {
        id: stop.id,
        label: meta?.label ?? stop.id,
        code: meta?.code ?? '?',
        x: stop.at.x,
        y: stop.at.y,
        detail: `esquina ${String(stop.at.x)} y ${String(stop.at.y)} · ${clockText(stop.opens)} a ${clockText(stop.closes)} · ${String(stop.stay)} min adentro`,
        optional: meta?.optional ?? false,
      }
    }),
  }),
  evaluate: (p, answer: InteractionAnswer) =>
    answer.kind === 'route-builder'
      ? evaluateRoute(p, answer.stops)
      : err({ kind: 'invalid-answer', detail: 'se esperaba un recorrido' }),
})

/** Con nota por calidad (10/8/6/4). Ver `src/content/grades.ts`. */
export const routePlan = graded(routePlanDefinition)
