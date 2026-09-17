/**
 * 4.º · La cola del evento (`y4.school-event-flow`).
 *
 * La gente entra por la puerta, pasa por acreditación y termina en el buffet.
 * Las tres cosas pasan en fila: por más rápido que sea el buffet, no entra más
 * gente de la que pasa por la puerta. Hay ayudantes para repartir y cada uno
 * rinde distinto en cada puesto.
 *
 * Lo que decide es el cuello de botella: el puesto más lento manda sobre todo
 * el evento, y poner gente en cualquier otro no cambia nada. Por eso una
 * variante donde alcance con mirar un solo puesto no se aprueba, y por eso el
 * mejor reparto casi nunca es «todos los ayudantes al más lento».
 *
 * La consecuencia sobre otra gente es visible —si el cálculo sale mal, la cola
 * queda en la vereda— pero la evaluación es sólo matemática: acá no se mide
 * Equipo ni Aura.
 */
import { z } from 'zod'
import {
  authoredVariantIds,
  defineChallenge,
  err,
  ok,
  toChallengeId,
  toScenarioFamilyId,
  type BudgetLine,
  type InteractionAnswer,
  type SolutionQuality,
} from '@/game'
import {
  at,
  candidateAxes,
  digit,
  generatedSource,
  mil,
  outcome,
  parameters,
  quantity,
  quantityIssues,
  spaceOf,
  tierWitnessIssues,
} from '@/content/authoring'

/** Los puestos, en el orden en el que la gente los cruza. */
export const STATIONS = [
  { id: 'puerta', label: 'Puerta', max: 4 },
  { id: 'acreditacion', label: 'Acreditación', max: 4 },
  { id: 'buffet', label: 'Buffet', max: 4 },
] as const
export type StationId = (typeof STATIONS)[number]['id']

const rate = z.number().int().min(2).max(60)
const station = z.strictObject({
  /** Personas que despacha cada diez minutos sin ayuda. */
  base: rate,
  /** Cuánto suma cada ayudante en **este** puesto. */
  perHelper: z.number().int().min(1).max(20),
})
export const flowSchema = z
  .strictObject({
    shape: z.enum(['puerta-lenta', 'buffet-lento', 'acreditacion-lenta']),
    /** Ayudantes disponibles para repartir. */
    helpers: z.number().int().min(2).max(10),
    /** Cuánta gente se espera y en cuántos tramos de diez minutos. */
    people: z.number().int().min(60).max(1200),
    slots: z.number().int().min(4).max(18),
    stations: z.tuple([station, station, station]),
  })
  .refine((p) => p.people % p.slots === 0, 'el ritmo pedido no da entero')
export type FlowParams = z.infer<typeof flowSchema>

/** Personas cada diez minutos que hay que sostener para que la cola no crezca. */
export function requiredRate(p: FlowParams): number {
  return p.people / p.slots
}

export function stationRate(
  p: FlowParams,
  index: number,
  helpers: number,
): number {
  const data = p.stations[index]
  return data === undefined ? 0 : data.base + data.perHelper * helpers
}

/** La fila entera va al ritmo del puesto más lento. */
export function throughput(
  p: FlowParams,
  lines: readonly BudgetLine[],
): number {
  return Math.min(
    ...STATIONS.map((station, index) =>
      stationRate(p, index, quantity(lines, station.id)),
    ),
  )
}

export function usedHelpers(lines: readonly BudgetLine[]): number {
  return STATIONS.reduce(
    (total, station) => total + quantity(lines, station.id),
    0,
  )
}

/** El mejor ritmo alcanzable con los ayudantes que hay. */
export function bestThroughput(p: FlowParams): number {
  let best = 0
  for (const plan of flowDistributions(p))
    best = Math.max(best, throughput(p, plan))
  return best
}

/** Todos los repartos posibles de ayudantes, sin pasarse del total. */
export function flowDistributions(
  p: FlowParams,
): readonly (readonly BudgetLine[])[] {
  const plans: (readonly BudgetLine[])[] = []
  const [first, second, third] = STATIONS
  if (first === undefined || second === undefined || third === undefined)
    return plans
  for (let a = 0; a <= first.max; a++)
    for (let b = 0; b <= second.max; b++)
      for (let c = 0; c <= third.max; c++) {
        if (a + b + c > p.helpers) continue
        plans.push([
          { itemId: first.id, quantity: a },
          { itemId: second.id, quantity: b },
          { itemId: third.id, quantity: c },
        ])
      }
  return plans
}

export interface FlowOutcome {
  readonly quality: SolutionQuality
  readonly rate: number
  readonly required: number
  readonly best: number
  /** Qué puesto quedó mandando. */
  readonly bottleneck: StationId
  readonly overstaffed: boolean
}

export function readFlow(
  p: FlowParams,
  lines: readonly BudgetLine[],
): FlowOutcome {
  const rates = STATIONS.map((station, index) =>
    stationRate(p, index, quantity(lines, station.id)),
  )
  const rate = Math.min(...rates)
  const required = requiredRate(p)
  const best = bestThroughput(p)
  const overstaffed = usedHelpers(lines) > p.helpers
  const bottleneck =
    STATIONS[rates.indexOf(rate)]?.id ?? STATIONS[0]?.id ?? 'puerta'

  // Escalera escrita: primero que la cola no crezca, después que el margen
  // llegue a la mitad de lo que se podía, y recién después que el reparto sea
  // el mejor posible con esa gente. La mitad se compara con enteros para que
  // la escalera no dependa de un redondeo.
  const quality: SolutionQuality =
    overstaffed || rate < required
      ? 'invalid'
      : rate >= best
        ? 'optimal'
        : rate * 2 >= required + best
          ? 'efficient'
          : 'functional'

  return { quality, rate, required, best, bottleneck, overstaffed }
}

export interface FlowPlan {
  readonly lines: readonly BudgetLine[]
  readonly quality: SolutionQuality
  readonly rate: number
}

/** Oráculo independiente: todos los repartos, con su ritmo. */
export function flowPlans(p: FlowParams): readonly FlowPlan[] {
  return flowDistributions(p).map((lines) => {
    const read = readFlow(p, lines)
    return { lines, quality: read.quality, rate: read.rate }
  })
}

const SHAPES = ['puerta-lenta', 'acreditacion-lenta', 'buffet-lento'] as const
const BASES = [
  [12, 20, 18],
  [10, 16, 22],
  [14, 18, 16],
  [16, 12, 20],
] as const
const GAINS = [
  [6, 3, 4],
  [4, 6, 3],
  [3, 4, 6],
  [5, 5, 2],
] as const
const HELPERS = [3, 4, 5, 6] as const
const LOADS = [
  { people: 180, slots: 12 },
  { people: 168, slots: 14 },
  { people: 216, slots: 12 },
  { people: 270, slots: 18 },
] as const
const RADICES = [
  SHAPES.length,
  BASES.length,
  GAINS.length,
  HELPERS.length,
  LOADS.length,
]
export const FLOW_SPACE = spaceOf(RADICES)

export function generateFlow(index: number): FlowParams {
  const axes = candidateAxes(index, RADICES, 97)
  const shape = at(SHAPES, digit(axes, 0))
  const bases = at(BASES, digit(axes, 1))
  const gains = at(GAINS, digit(axes, 2))
  const load = at(LOADS, digit(axes, 4))
  // La forma dice cuál es el puesto lento de entrada. No se muestra, así que
  // cada una baja un puesto distinto y ninguna produce la misma tabla.
  const slowIndex = SHAPES.indexOf(shape)
  return flowSchema.parse({
    shape,
    helpers: at(HELPERS, digit(axes, 3)),
    people: load.people,
    slots: load.slots,
    stations: STATIONS.map((_, position) => ({
      base:
        position === slowIndex
          ? Math.max(2, (bases[position] ?? 12) - 6)
          : (bases[position] ?? 12),
      perHelper: gains[position] ?? 4,
    })),
  })
}

export function flowGates(p: FlowParams): readonly string[] {
  const issues: string[] = []
  const plans = flowPlans(p)
  issues.push(...tierWitnessIssues(plans))

  const required = requiredRate(p)
  const best = bestThroughput(p)
  if (best <= required) issues.push('el evento no se puede sostener')
  if (best <= required + 1)
    issues.push('no hay margen entre lo que se pide y lo mejor posible')

  // LOCKED: el cuello de botella tiene que decidir. Si el mejor reparto pone
  // todos los ayudantes en un solo puesto, alcanza con una cuenta aislada.
  const optimal = plans.filter((plan) => plan.quality === 'optimal')
  if (optimal.length === 0) issues.push('ningún reparto alcanza el mejor ritmo')
  if (
    !optimal.every(
      (plan) => plan.lines.filter((line) => line.quantity > 0).length >= 2,
    )
  )
    issues.push('el mejor reparto cabe en un solo puesto')

  // Señuelo: el puesto más lento no puede ser también el que más rinde por
  // ayudante, o la decisión se toma sin comparar.
  const bases = p.stations.map((station) => station.base)
  const gains = p.stations.map((station) => station.perHelper)
  if (bases.indexOf(Math.min(...bases)) === gains.indexOf(Math.max(...gains)))
    issues.push('el puesto más lento ya es el que más rinde por ayudante')
  return issues
}

export function evaluateFlow(p: FlowParams, lines: readonly BudgetLine[]) {
  const malformed = quantityIssues(
    lines,
    STATIONS.map((station) => ({
      id: station.id,
      maxQuantity: station.max,
    })),
  )
  if (malformed.length > 0)
    return err({ kind: 'invalid-answer' as const, detail: malformed[0] ?? '' })

  const read = readFlow(p, lines)
  const label = (id: string) =>
    STATIONS.find((station) => station.id === id)?.label ?? id

  return ok(
    outcome(
      read.quality,
      {
        outcomeKey: `school-event-flow.${p.shape}.${read.quality}`,
        stamp: read.quality === 'invalid' ? 'Cola' : 'Fluye',
        facts: [
          {
            label: 'Hace falta',
            value: `${String(read.required)} cada 10 min`,
          },
          { label: 'Tu ritmo', value: `${String(read.rate)} cada 10 min` },
          { label: 'Manda', value: label(read.bottleneck) },
          {
            label: 'Ayudantes',
            value: `${String(usedHelpers(lines))} de ${String(p.helpers)}`,
          },
        ],
        ...(read.quality === 'invalid'
          ? {
              violatedConstraint: read.overstaffed
                ? `Repartiste más ayudantes de los que hay.`
                : `${label(read.bottleneck)} despacha ${String(read.rate)} cada diez minutos y hacen falta ${String(read.required)}.`,
            }
          : {}),
        consequence:
          read.quality === 'invalid'
            ? read.overstaffed
              ? 'Ese reparto usa ayudantes que no hay: así la entrada no se puede armar.'
              : `La cola sale a la vereda: no todas las ${mil(p.people)} personas entran a tiempo.`
            : read.quality === 'functional'
              ? 'Entra todo el mundo, justo: cualquier demora se nota.'
              : read.quality === 'efficient'
                ? 'Entra todo el mundo con aire de sobra.'
                : 'Ese es el mejor ritmo que se puede sostener con esa gente.',
      },
      {},
      [{ flag: 'y4.flow.outcome', value: read.quality }],
    ),
  )
}

export const flowVariants = generatedSource({
  id: 'y4.school-event-flow.bottleneck',
  version: '1',
  schema: flowSchema,
  size: FLOW_SPACE,
  generate: generateFlow,
  gates: flowGates,
})

export const schoolEventFlow = defineChallenge<FlowParams, FlowParams>({
  id: toChallengeId('y4.school-event-flow'),
  family: toScenarioFamilyId('evento-escolar'),
  placement: 'anchor',
  variants: authoredVariantIds(flowVariants.authored),
  variantSource: flowVariants,
  interaction: 'quantity-builder',
  stages: ['year-4'],
  categories: ['time-and-rates', 'optimization-and-constraints'],
  baseDifficulty: 3,
  cognitive: {
    steps: 2,
    constraints: 2,
    selection: 0,
    optimization: 1,
    uncertainty: 0,
    construction: 1,
  },
  composition: {
    primaryReasoningFamily: 'SYSTEMS_OPTIMIZATION',
    interactionEngine: 'allocate-constrain',
    pacingClass: 'MEDIUM',
    chronology: 40,
    eventCluster: 'evento-escolar',
  },
  scoring: {
    math: 'discrete-quality',
    team: 'none',
    aura: 'none',
    rationale:
      'La cuenta es tasa, capacidad y cuello de botella: el puesto más lento manda sobre todo el evento. La consecuencia sobre otra gente es visible, pero no se mide Equipo ni Aura por ella: repartir ayudantes bien no es un gesto social, es una cuenta.',
  },
  tools: ['calculator', 'notepad'],
  generate: ({ params }) => parameters(flowSchema, params),
  verify: (p) =>
    p.people % p.slots === 0 ? [] : ['el ritmo pedido no da entero'],
  narrate: () => ({
    title: 'La cola del evento',
    setup:
      'La gente entra por la puerta, se acredita y pasa al buffet. Todo en fila, y hay ayudantes para repartir.',
    goal: 'Repartí los ayudantes para que la cola no se corte.',
  }),
  present: (p) => ({
    kind: 'quantity-builder',
    instructions:
      'Poné cuántos ayudantes va a tener cada puesto. La gente pasa por los tres, en orden.',
    data: [
      { label: 'Se esperan', value: mil(p.people), unit: 'personas' },
      {
        label: 'En',
        value: String(p.slots * 10),
        unit: 'minutos',
        constraint: true,
      },
      {
        label: 'Hace falta',
        value: String(requiredRate(p)),
        unit: 'personas cada 10 min',
        span: 2,
      },
      { label: 'Ayudantes', value: String(p.helpers), constraint: true },
    ],
    items: STATIONS.map((station, index) => {
      const data = p.stations[index]
      return {
        id: station.id,
        label: station.label,
        detail: `despacha ${String(data?.base ?? 0)} cada 10 min · cada ayudante suma ${String(data?.perHelper ?? 0)}`,
        maxQuantity: station.max,
      }
    }),
  }),
  evaluate: (p, answer: InteractionAnswer) =>
    answer.kind === 'quantity-builder'
      ? evaluateFlow(p, answer.lines)
      : err({
          kind: 'invalid-answer',
          detail: 'se esperaba un reparto de ayudantes',
        }),
})
