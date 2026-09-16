/**
 * 4.º · Proyecto del Curso IV (`y4.course-project-fundraiser`) y su Repaso
 * (`y4.margin-review`).
 *
 * El curso organiza la peña para juntar plata. Hay un costo fijo que se paga
 * exista o no la venta, tres cosas para vender con su costo y su precio, y una
 * cocina que sólo da para tanto. La decisión es cuánto preparar de cada cosa.
 *
 * Cubrir los costos y llegar al objetivo son dos cosas distintas, y ésa es la
 * matemática del año: la primera es que la cuenta no dé negativa, la segunda es
 * que sobre lo suficiente. Una variante que se resuelva mirando el margen por
 * unidad no se aprueba: la cocina es compartida, así que lo que decide es el
 * margen por minuto de cocina, y el señuelo es exactamente el otro.
 *
 * No es el umbral de usos de 3.º: allá se elegía entre formas de pagar lo
 * propio, acá se produce para un objetivo del curso con una capacidad común.
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
  type ChallengeDefinition,
  type EstiloAxis,
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
  styleGateIssues,
  tierWitnessIssues,
  type StyledPlan,
} from '@/content/authoring'
import { projectArcCallback } from '../../career-facts'

/** Se vende por bandeja: los números quedan legibles y la cuenta, entera. */
export const ITEMS = [
  { id: 'panchos', label: 'Bandeja de panchos', per: 10, max: 8 },
  { id: 'tortas', label: 'Bandeja de tortas', per: 8, max: 6 },
  { id: 'bebidas', label: 'Cajón de bebidas', per: 12, max: 9 },
] as const
export type ItemId = (typeof ITEMS)[number]['id']

const money = z.number().int().min(100).max(200_000).multipleOf(100)
const item = z.strictObject({
  /** Lo que sale preparar una bandeja y lo que se cobra por ella. */
  cost: money,
  price: money,
  /** Minutos de cocina que ocupa. La cocina es de todos. */
  minutes: z.number().int().min(5).max(90).multipleOf(5),
})
export const fundraiserSchema = z
  .strictObject({
    shape: z.enum(['cocina-corta', 'objetivo-alto', 'margen-parejo']),
    /** El costo fijo: se paga aunque no se venda nada. */
    fixedCost: money,
    /** Lo que el curso necesita juntar, y el colchón que quiere dejar. */
    target: money,
    reserve: money,
    /** Minutos de cocina disponibles. */
    kitchenMinutes: z.number().int().min(60).max(600).multipleOf(10),
    items: z.tuple([item, item, item]),
  })
  .refine(
    (p) => p.items.every((entry) => entry.price > entry.cost),
    'una bandeja se vende a menos de lo que cuesta',
  )
export type FundraiserParams = z.infer<typeof fundraiserSchema>

export function marginOf(p: FundraiserParams, index: number): number {
  const entry = p.items[index]
  return entry === undefined ? 0 : entry.price - entry.cost
}

export interface FundraiserOutcome {
  readonly quality: SolutionQuality
  /** Lo que queda después de pagar el costo fijo y lo que costó producir. */
  readonly profit: number
  readonly minutes: number
  readonly style?: EstiloAxis
}

/**
 * La lectura completa de una producción.
 *
 * Toda la plata en pesos enteros. La cocina se mide aparte de la plata porque
 * son dos límites distintos: uno dice cuánto podés hacer y el otro, cuánto te
 * queda.
 */
export function readFundraiser(
  p: FundraiserParams,
  lines: readonly BudgetLine[],
): FundraiserOutcome {
  const counts = ITEMS.map((entry) => quantity(lines, entry.id))
  const minutes = counts.reduce(
    (total, count, index) => total + count * (p.items[index]?.minutes ?? 0),
    0,
  )
  const revenue = counts.reduce(
    (total, count, index) => total + count * (p.items[index]?.price ?? 0),
    0,
  )
  const variable = counts.reduce(
    (total, count, index) => total + count * (p.items[index]?.cost ?? 0),
    0,
  )
  const profit = revenue - variable - p.fixedCost

  // Escalera escrita: primero que la cuenta no dé negativa, después que
  // alcance el objetivo, y recién después que quede el colchón. Cubrir costos
  // y llegar al objetivo son dos niveles distintos a propósito.
  const quality: SolutionQuality =
    minutes > p.kitchenMinutes || profit < 0
      ? 'invalid'
      : profit >= p.target + p.reserve
        ? 'optimal'
        : profit >= p.target
          ? 'efficient'
          : 'functional'

  // Estilo describe la forma de la producción, nunca cuánto se juntó: dejar
  // cocina sin usar, concentrarse en una sola cosa o preparar de todo pueden
  // pasar con o sin objetivo cumplido.
  const used = counts.filter((count) => count > 0).length
  const style: EstiloAxis | undefined =
    quality === 'invalid'
      ? undefined
      : minutes * 4 < p.kitchenMinutes * 3
        ? 'improvisador'
        : used <= 1
          ? 'estratega'
          : 'aplicado'

  return { quality, profit, minutes, ...(style === undefined ? {} : { style }) }
}

export interface FundraiserPlan extends StyledPlan {
  readonly lines: readonly BudgetLine[]
  readonly profit: number
}

/** Oráculo independiente sobre todas las producciones posibles. */
export function fundraiserPlans(
  p: FundraiserParams,
): readonly FundraiserPlan[] {
  const plans: FundraiserPlan[] = []
  const [first, second, third] = ITEMS
  if (first === undefined || second === undefined || third === undefined)
    return plans
  for (let a = 0; a <= first.max; a++)
    for (let b = 0; b <= second.max; b++)
      for (let c = 0; c <= third.max; c++) {
        const lines = [
          { itemId: first.id, quantity: a },
          { itemId: second.id, quantity: b },
          { itemId: third.id, quantity: c },
        ]
        const read = readFundraiser(p, lines)
        plans.push({
          lines,
          quality: read.quality,
          profit: read.profit,
          ...(read.style === undefined ? {} : { style: read.style }),
        })
      }
  return plans
}

const SHAPES = ['cocina-corta', 'objetivo-alto', 'margen-parejo'] as const
const COSTS = [
  [4000, 3000, 3600],
  [3600, 3200, 3000],
  [4400, 2800, 4000],
] as const
const PRICES = [
  [9000, 7200, 7200],
  [8400, 8000, 6000],
  [9600, 6400, 8000],
] as const
const MINUTES = [
  [20, 45, 10],
  [25, 35, 15],
  [30, 50, 10],
] as const
const FIXED = [10_000, 14_000, 18_000] as const
const TARGETS = [18_000, 24_000, 30_000] as const
const KITCHEN = [180, 240, 300] as const
const RESERVE = 6_000
const RADICES = [
  SHAPES.length,
  COSTS.length,
  PRICES.length,
  MINUTES.length,
  FIXED.length,
  TARGETS.length,
  KITCHEN.length,
]
export const FUNDRAISER_SPACE = spaceOf(RADICES)

export function generateFundraiser(index: number): FundraiserParams {
  const axes = candidateAxes(index, RADICES, 587)
  const shape = at(SHAPES, digit(axes, 0))
  const costs = at(COSTS, digit(axes, 1))
  const prices = at(PRICES, digit(axes, 2))
  const minutes = at(MINUTES, digit(axes, 3))
  const target = at(TARGETS, digit(axes, 5))
  // La forma dice qué aprieta: la cocina, el objetivo o un margen parejo entre
  // las tres cosas. La forma no se muestra, así que cada una tiene su firma.
  const kitchen = shape === 'cocina-corta' ? 150 : at(KITCHEN, digit(axes, 6))
  return fundraiserSchema.parse({
    shape,
    fixedCost: at(FIXED, digit(axes, 4)),
    target: shape === 'objetivo-alto' ? target + 8_000 : target,
    reserve: RESERVE,
    kitchenMinutes: kitchen,
    items: ITEMS.map((_, position) => ({
      cost: costs[position] ?? 3000,
      price:
        shape === 'margen-parejo'
          ? (costs[position] ?? 3000) + 4000
          : (prices[position] ?? 7000),
      minutes: minutes[position] ?? 20,
    })),
  })
}

export function fundraiserGates(p: FundraiserParams): readonly string[] {
  const issues: string[] = []
  const plans = fundraiserPlans(p)
  issues.push(...tierWitnessIssues(plans), ...styleGateIssues(plans))

  // LOCKED: cubrir costos y llegar al objetivo son condiciones distintas, y
  // las dos tienen que ser alcanzables por separado.
  const covers = plans.filter(
    (plan) => plan.quality === 'functional' && plan.profit >= 0,
  )
  if (covers.length === 0)
    issues.push('no hay producción que sólo cubra costos')
  if (!plans.some((plan) => plan.quality === 'optimal'))
    issues.push('el objetivo con colchón es inalcanzable')

  // La cocina tiene que apretar: si entra todo, no hay nada que decidir.
  const everything = ITEMS.map((entry) => ({
    itemId: entry.id,
    quantity: entry.max,
  }))
  if (readFundraiser(p, everything).quality !== 'invalid')
    issues.push('la cocina alcanza para todo')

  // Señuelo del Intrinsic Math Gate: el mejor margen por bandeja no puede ser
  // el mejor margen por minuto de cocina, o la decisión se toma sin mirar la
  // capacidad compartida.
  const byUnit = ITEMS.map((_, index) => marginOf(p, index))
  const byMinute = ITEMS.map(
    (_, index) => marginOf(p, index) / (p.items[index]?.minutes ?? 1),
  )
  const bestUnit = byUnit.indexOf(Math.max(...byUnit))
  const bestMinute = byMinute.indexOf(Math.max(...byMinute))
  if (bestUnit === bestMinute)
    issues.push('el mejor margen por bandeja ya es el mejor por minuto')
  return issues
}

export function evaluateFundraiser(
  p: FundraiserParams,
  lines: readonly BudgetLine[],
) {
  const malformed = quantityIssues(
    lines,
    ITEMS.map((entry) => ({ id: entry.id, maxQuantity: entry.max })),
  )
  if (malformed.length > 0)
    return err({ kind: 'invalid-answer' as const, detail: malformed[0] ?? '' })

  const read = readFundraiser(p, lines)
  return ok(
    outcome(
      read.quality,
      {
        outcomeKey: `course-project-fundraiser.${p.shape}.${read.quality}`,
        stamp: read.quality === 'invalid' ? 'No cierra' : 'Peña',
        facts: [
          { label: 'Costo fijo', value: `$${mil(p.fixedCost)}` },
          {
            label: 'Cocina',
            value: `${String(read.minutes)} de ${String(p.kitchenMinutes)} min`,
          },
          { label: 'Queda', value: `$${mil(read.profit)}` },
          { label: 'Objetivo', value: `$${mil(p.target)}` },
        ],
        ...(read.quality === 'invalid'
          ? {
              violatedConstraint:
                read.minutes > p.kitchenMinutes
                  ? 'La cocina no da para preparar todo eso.'
                  : 'Con esa producción el curso pone plata en vez de juntarla.',
            }
          : {}),
        consequence:
          read.quality === 'invalid'
            ? 'La peña termina costando plata.'
            : read.quality === 'functional'
              ? 'Se cubren los costos, pero no alcanza para lo que el curso necesita.'
              : read.quality === 'efficient'
                ? 'Se llega al objetivo, justo.'
                : 'Se llega al objetivo y queda un colchón por si algo sale mal.',
      },
      read.style === undefined
        ? {}
        : { estilo: { axis: read.style, amount: 8 } },
      [
        { flag: 'y4.fundraiser.outcome', value: read.quality },
        ...(read.style === undefined
          ? []
          : [{ flag: 'y4.fundraiser.strategy', value: read.style }]),
      ],
    ),
  )
}

export const fundraiserVariants = generatedSource({
  id: 'y4.course-project-fundraiser.margin',
  version: '1',
  schema: fundraiserSchema,
  size: FUNDRAISER_SPACE,
  generate: generateFundraiser,
  gates: fundraiserGates,
})

const PROJECT_FAMILY = toScenarioFamilyId('course-project')

export const courseProjectFundraiser: ChallengeDefinition = defineChallenge<
  FundraiserParams,
  FundraiserParams
>({
  id: toChallengeId('y4.course-project-fundraiser'),
  family: PROJECT_FAMILY,
  placement: 'anchor',
  variants: authoredVariantIds(fundraiserVariants.authored),
  variantSource: fundraiserVariants,
  interaction: 'quantity-builder',
  stages: ['year-4'],
  categories: ['quantity', 'proportions-and-percentages'],
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
    primaryReasoningFamily: 'ECONOMIC_PROPORTIONAL',
    interactionEngine: 'allocate-constrain',
    pacingClass: 'MEDIUM',
    chronology: 20,
    recurringArc: 'PROJECT',
  },
  scoring: {
    math: 'discrete-quality',
    team: 'none',
    aura: 'none',
    rationale:
      'La cuenta es costo fijo, costo variable, ingreso y capacidad compartida contra un objetivo del curso. No hay Equipo ni Aura: nadie reparte tareas acá. Estilo describe la forma de la producción y es señal de carrera, nunca puntaje.',
  },
  tools: ['calculator', 'notepad'],
  generate: ({ params }) => parameters(fundraiserSchema, params),
  verify: (p) =>
    p.items.every((entry) => entry.price > entry.cost)
      ? []
      : ['una bandeja se vende a menos de lo que cuesta'],
  narrate: (_p, context) => ({
    title: 'Proyecto del Curso: la peña',
    setup: `${projectArcCallback(context.flags)}El curso alquila el salón para la peña y hay que decidir cuánto preparar de cada cosa.`,
    goal: 'Armá la producción: que cubra los costos y llegue a lo que el curso necesita juntar.',
  }),
  present: (p) => ({
    kind: 'quantity-builder',
    instructions:
      'Poné cuántas bandejas prepara el curso. El costo fijo se paga igual, se venda o no.',
    data: [
      {
        label: 'Costo fijo',
        value: `$${mil(p.fixedCost)}`,
        constraint: true,
      },
      {
        label: 'Cocina',
        value: String(p.kitchenMinutes),
        unit: 'minutos',
        constraint: true,
      },
      { label: 'Objetivo', value: `$${mil(p.target)}` },
      { label: 'Colchón que quieren', value: `$${mil(p.reserve)}` },
    ],
    items: ITEMS.map((entry, index) => {
      const data = p.items[index]
      return {
        id: entry.id,
        label: entry.label,
        detail: `cuesta $${mil(data?.cost ?? 0)} · se vende a $${mil(data?.price ?? 0)} · ocupa ${String(data?.minutes ?? 0)} min`,
        maxQuantity: entry.max,
      }
    }),
  }),
  evaluate: (p, answer: InteractionAnswer) =>
    answer.kind === 'quantity-builder'
      ? evaluateFundraiser(p, answer.lines)
      : err({
          kind: 'invalid-answer',
          detail: 'se esperaba un plan de producción',
        }),
})

/* -------------------------------------------------------------------------
 * Repaso: cubrir el costo fijo.
 * ---------------------------------------------------------------------- */

export const marginReviewSchema = z
  .strictObject({
    /** Lo que se paga una vez, exista o no la venta. */
    fixedCost: money,
    /** Lo que cuesta preparar una bandeja y lo que se cobra por ella. */
    cost: money,
    price: money,
  })
  .refine((p) => p.price > p.cost, 'la bandeja se vende a pérdida')
export type MarginReviewParams = z.infer<typeof marginReviewSchema>

/** Bandejas enteras que hay que vender para dejar de perder plata. */
export function traysToBreakEven(p: MarginReviewParams): number {
  return Math.ceil(p.fixedCost / (p.price - p.cost))
}

const REVIEW_FIXED = [9_000, 12_000, 15_000, 18_000, 24_000] as const
const REVIEW_COSTS = [2_500, 3_000, 3_500, 4_000] as const
const REVIEW_MARGINS = [1_500, 2_000, 2_500, 3_000] as const
const REVIEW_RADICES = [
  REVIEW_FIXED.length,
  REVIEW_COSTS.length,
  REVIEW_MARGINS.length,
]
export const MARGIN_REVIEW_SPACE = spaceOf(REVIEW_RADICES)

export function generateMarginReview(index: number): MarginReviewParams {
  const axes = candidateAxes(index, REVIEW_RADICES, 31)
  const cost = at(REVIEW_COSTS, digit(axes, 1))
  return marginReviewSchema.parse({
    fixedCost: at(REVIEW_FIXED, digit(axes, 0)),
    cost,
    price: cost + at(REVIEW_MARGINS, digit(axes, 2)),
  })
}

export function marginReviewGates(p: MarginReviewParams): readonly string[] {
  const issues: string[] = []
  const exact = traysToBreakEven(p)
  // El señuelo de este Repaso es dividir por el precio en vez de por lo que
  // deja cada bandeja. Si las dos cuentas dan lo mismo, el Repaso no toca el
  // paso que vino a reparar.
  if (Math.ceil(p.fixedCost / p.price) === exact)
    issues.push('dividir por el precio da la misma respuesta')
  if (exact < 3 || exact > 20) issues.push('la respuesta cae fuera de escala')
  return issues
}

export function evaluateMarginReview(p: MarginReviewParams, value: string) {
  if (!/^\d{1,4}$/u.test(value))
    return err({
      kind: 'invalid-answer' as const,
      detail: 'se esperaba una cantidad entera de bandejas',
    })
  const answered = Number(value)
  const exact = traysToBreakEven(p)
  const byPrice = Math.ceil(p.fixedCost / p.price)
  const quality: SolutionQuality =
    answered === exact
      ? 'optimal'
      : // Dividir por el precio: la cuenta está bien hecha sobre un número que
        // no es el que queda, porque preparar cada bandeja también cuesta.
        answered === byPrice
        ? 'functional'
        : Math.abs(answered - exact) === 1
          ? 'efficient'
          : 'invalid'
  return ok(
    outcome(quality, {
      outcomeKey: `margin-review.${quality}`,
      stamp: quality === 'optimal' ? 'Justo' : 'Cerca',
      facts: [
        { label: 'Costo fijo', value: `$${mil(p.fixedCost)}` },
        { label: 'Cada bandeja deja', value: `$${mil(p.price - p.cost)}` },
        {
          label: `${String(exact)} bandejas dejan`,
          value: `$${mil(exact * (p.price - p.cost))}`,
        },
      ],
      ...(quality === 'optimal'
        ? {
            optimalComparison:
              'De cada bandeja no queda el precio: queda el precio menos lo que costó prepararla. El costo fijo se cubre con eso.',
          }
        : {}),
      ...(quality === 'functional'
        ? {
            violatedConstraint: `Cada bandeja se vende a $${mil(p.price)}, pero deja $${mil(p.price - p.cost)}: preparar también cuesta.`,
          }
        : {}),
      consequence:
        quality === 'optimal'
          ? 'Recién a partir de ahí la peña empieza a juntar.'
          : 'Con esa cuenta el curso cree que ya cubrió y todavía está poniendo plata.',
    }),
  )
}

export const marginReviewVariants = generatedSource({
  id: 'y4.margin-review.break-even',
  version: '1',
  schema: marginReviewSchema,
  size: MARGIN_REVIEW_SPACE,
  generate: generateMarginReview,
  gates: marginReviewGates,
})

export const marginReview: ChallengeDefinition = defineChallenge<
  MarginReviewParams,
  MarginReviewParams
>({
  id: toChallengeId('y4.margin-review'),
  family: PROJECT_FAMILY,
  placement: 'recovery',
  variants: authoredVariantIds(marginReviewVariants.authored),
  variantSource: marginReviewVariants,
  interaction: 'numeric-input',
  stages: ['year-4'],
  categories: ['quantity'],
  baseDifficulty: 1,
  cognitive: {
    steps: 1,
    constraints: 0,
    selection: 0,
    optimization: 0,
    uncertainty: 0,
    construction: 1,
  },
  composition: {
    primaryReasoningFamily: 'ECONOMIC_PROPORTIONAL',
    interactionEngine: 'allocate-constrain',
    pacingClass: 'QUICK',
  },
  scoring: {
    math: 'discrete-quality',
    team: 'none',
    aura: 'none',
    rationale:
      'Contenido de recuperación: la evidencia competitiva es el beat ordinario que lo disparó, y puntuar el Repaso premiaría haber fallado.',
  },
  tools: ['calculator'],
  generate: ({ params }) => parameters(marginReviewSchema, params),
  verify: (p) => marginReviewGates(p),
  narrate: () => ({
    title: 'Lo que deja cada bandeja',
    setup:
      'Antes de volver a la peña, una sola cuenta: cuánto hay que vender para dejar de perder.',
    goal: 'Decí cuántas bandejas cubren el costo fijo.',
  }),
  present: (p) => ({
    kind: 'numeric-input',
    data: [
      { label: 'Costo fijo', value: `$${mil(p.fixedCost)}`, constraint: true },
      {
        label: 'Cuesta preparar',
        value: `$${mil(p.cost)}`,
        unit: 'la bandeja',
      },
      { label: 'Se vende a', value: `$${mil(p.price)}`, unit: 'la bandeja' },
      {
        label: 'Primero',
        value: `$${mil(p.price)} − $${mil(p.cost)}`,
        unit: 'lo que deja cada una',
        span: 2,
      },
    ],
    unitLabel: 'bandejas',
    min: '0',
    max: '99',
    step: '1',
  }),
  evaluate: (p, answer: InteractionAnswer) =>
    answer.kind === 'numeric-input'
      ? evaluateMarginReview(p, answer.value)
      : err({ kind: 'invalid-answer', detail: 'se esperaba un número' }),
})
