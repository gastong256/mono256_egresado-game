/**
 * 3.º · El abono del colectivo (`y3.transport-pass`) y su Repaso
 * (`y3.fixed-variable-review`).
 *
 * Hay cuatro formas de pagar el mismo colectivo y ninguna es la mejor siempre:
 * el boleto suelto no compromete nada, la tarjeta cobra menos por viaje pero se
 * paga una vez, el combo trae viajes incluidos y el abono es libre. Cuál
 * conviene depende de **cuánto vas a viajar**, y eso este mes no se sabe con
 * exactitud: los días de clase están entre dos números.
 *
 * Por eso no es la oferta de 7.º. Ahí se comparaban dos descuentos sobre un
 * mismo precio y ganaba uno; acá el ganador cambia dentro del rango posible, y
 * una variante donde no cambie no se aprueba. La cuenta es un costo fijo contra
 * uno variable, y el umbral de usos es lo que decide.
 *
 * El Repaso aísla ese umbral: un costo fijo, uno por viaje y la pregunta de a
 * partir de cuántos viajes se da vuelta la conveniencia.
 */
import { z } from 'zod'
import {
  authoredVariantIds,
  defineChallenge,
  err,
  ok,
  toChallengeId,
  toScenarioFamilyId,
  type ChallengeDefinition,
  type InteractionAnswer,
  type SolutionQuality,
} from '@/game'
import {
  at,
  candidateAxes,
  digit,
  feasibilityConstruction,
  generatedSource,
  mil,
  outcome,
  parameters,
  spaceOf,
  tierWitnessIssues,
} from '@/content/authoring'

export const OPTIONS = [
  { id: 'suelto', label: 'Boleto suelto' },
  { id: 'recargable', label: 'Tarjeta recargable' },
  { id: 'combo', label: 'Combo mensual' },
  { id: 'abono', label: 'Abono libre' },
] as const
export type OptionId = (typeof OPTIONS)[number]['id']

const money = z.number().int().min(50).max(100_000).multipleOf(10)
export const passSchema = z
  .strictObject({
    /** Qué forma tiene el mes: cuánta incertidumbre hay sobre los viajes. */
    shape: z.enum([
      'mes-corto',
      'arranque',
      'mes-completo',
      'con-salidas',
      'mes-cargado',
    ]),
    /** Viajes posibles del mes y los del mes pasado, que es la referencia. */
    low: z.number().int().min(10).max(80),
    likely: z.number().int().min(10).max(80),
    high: z.number().int().min(10).max(80),
    ticket: money,
    /** Lo que sale la tarjeta una vez, más lo que cobra por viaje. */
    card: money,
    fare: money,
    /** El combo: lo que sale, cuántos viajes trae y el viaje extra. */
    combo: money,
    included: z.number().int().min(8).max(40),
    extra: money,
    pass: money,
  })
  .refine((p) => p.low < p.likely && p.likely < p.high, 'rango mal ordenado')
  .refine(
    (p) => p.fare < p.ticket && p.extra <= p.ticket,
    'una tarifa con descuento no puede pasar al boleto suelto',
  )
export type PassParams = z.infer<typeof passSchema>

/** Lo que sale el mes con cada forma de pago, para una cantidad de viajes. */
export function costOf(p: PassParams, option: OptionId, trips: number): number {
  switch (option) {
    case 'suelto':
      return p.ticket * trips
    case 'recargable':
      return p.card + p.fare * trips
    case 'combo':
      return p.combo + p.extra * Math.max(0, trips - p.included)
    case 'abono':
      return p.pass
  }
}

export function tripRange(p: PassParams): readonly number[] {
  return Array.from({ length: p.high - p.low + 1 }, (_, i) => p.low + i)
}

/** La más barata para esa cantidad de viajes, o nada si hay empate. */
export function cheapestAt(p: PassParams, trips: number): OptionId | undefined {
  const costs = OPTIONS.map((option) => ({
    id: option.id,
    cost: costOf(p, option.id, trips),
  })).sort((a, b) => a.cost - b.cost)
  const [best, next] = costs
  return best === undefined || next === undefined || best.cost === next.cost
    ? undefined
    : best.id
}

function worstAt(p: PassParams, trips: number): OptionId | undefined {
  const costs = OPTIONS.map((option) => ({
    id: option.id,
    cost: costOf(p, option.id, trips),
  })).sort((a, b) => b.cost - a.cost)
  const [worst, next] = costs
  return worst === undefined || next === undefined || worst.cost === next.cost
    ? undefined
    : worst.id
}

/**
 * El nivel de una elección, leído sobre todo el rango posible de viajes.
 *
 * Escrito como escalera y no como búsqueda: la mejor para los viajes que se
 * esperan es óptima; una que gana en alguna otra cantidad posible del mes es
 * una apuesta defendible a viajar distinto; la que nunca gana en ninguna
 * cantidad posible pero tampoco es la más cara sigue funcionando; y la que
 * nunca gana **y** encima es la más cara justo para los viajes que se esperan
 * es un error, no una preferencia. Una autoría además exige que esa última sea
 * peor que la óptima en todo el rango, así que llamarla error no depende de
 * haber mirado una sola cantidad.
 */
export function tierOf(p: PassParams, option: OptionId): SolutionQuality {
  const trips = tripRange(p)
  if (cheapestAt(p, p.likely) === option) return 'optimal'
  if (trips.some((n) => cheapestAt(p, n) === option)) return 'efficient'
  if (worstAt(p, p.likely) === option) return 'invalid'
  return 'functional'
}

export interface PassChoice {
  readonly optionId: OptionId
  readonly quality: SolutionQuality
}

/** Oráculo independiente: las cuatro formas de pagar, con su nivel. */
export function passChoices(p: PassParams): readonly PassChoice[] {
  return OPTIONS.map((option) => ({
    optionId: option.id,
    quality: tierOf(p, option.id),
  }))
}

/**
 * Cinco meses posibles, y no sólo cinco rangos.
 *
 * El nivel de uso es lo que decide cuál conviene, así que los meses van de uno
 * de pocos viajes a uno cargado: sin eso, la misma opción ganaría siempre y el
 * desafío se contestaría de memoria a la segunda variante.
 */
const SHAPES = [
  { id: 'mes-corto', low: 12, likely: 16, high: 24 },
  { id: 'arranque', low: 20, likely: 26, high: 34 },
  { id: 'mes-completo', low: 36, likely: 42, high: 48 },
  { id: 'con-salidas', low: 34, likely: 40, high: 52 },
  { id: 'mes-cargado', low: 44, likely: 52, high: 60 },
] as const
const TICKETS = [460, 500, 540, 580, 620, 660] as const
const FARE_DROPS = [60, 100, 140] as const
const INCLUDED = [12, 16, 20, 24] as const
const COMBO_FACTORS = [70, 85, 100, 115, 130] as const
/**
 * Cuánto cobra el combo por los viajes que no incluye.
 *
 * Que a veces cobre **más** que la tarjeta es lo que impide que el combo sea la
 * respuesta de siempre: un combo barato de entrada puede terminar caro si el
 * mes se estira, y eso es exactamente lo que el umbral tiene que hacer visible.
 */
const EXTRA_FACTORS = [90, 105, 120] as const
const PASS_FACTORS = [72, 84, 96, 108] as const
const CARD_FACTORS = [50, 100, 200] as const
const RADICES = [
  SHAPES.length,
  TICKETS.length,
  FARE_DROPS.length,
  INCLUDED.length,
  COMBO_FACTORS.length,
  PASS_FACTORS.length,
  CARD_FACTORS.length,
  EXTRA_FACTORS.length,
]
export const PASS_SPACE = spaceOf(RADICES)

/** Redondeo a la decena, que es como se escriben los precios del boleto. */
const round10 = (value: number): number => Math.round(value / 10) * 10

export function generatePass(index: number): PassParams {
  const axes = candidateAxes(index, RADICES, 1493)
  const shape = at(SHAPES, digit(axes, 0))
  const ticket = at(TICKETS, digit(axes, 1))
  const fare = ticket - at(FARE_DROPS, digit(axes, 2))
  const included = at(INCLUDED, digit(axes, 3))
  const extra = Math.min(
    ticket,
    round10((fare * at(EXTRA_FACTORS, digit(axes, 7))) / 100),
  )
  return passSchema.parse({
    shape: shape.id,
    low: shape.low,
    likely: shape.likely,
    high: shape.high,
    ticket,
    card: round10((ticket * at(CARD_FACTORS, digit(axes, 6))) / 100),
    fare,
    combo: round10((included * fare * at(COMBO_FACTORS, digit(axes, 4))) / 100),
    included,
    extra,
    pass: round10((shape.high * fare * at(PASS_FACTORS, digit(axes, 5))) / 100),
  })
}

export function passGates(p: PassParams): readonly string[] {
  const issues: string[] = []
  const choices = passChoices(p)
  issues.push(...tierWitnessIssues(choices))
  const wrong = choices.find((choice) => choice.quality === 'invalid')
  const best = choices.find((choice) => choice.quality === 'optimal')
  if (wrong === undefined)
    issues.push('ninguna opción es la más cara para los viajes esperados')
  else if (
    best !== undefined &&
    !tripRange(p).every(
      (trips) =>
        costOf(p, wrong.optionId, trips) > costOf(p, best.optionId, trips),
    )
  )
    issues.push('la opción equivocada gana en alguna cantidad del rango')
  if (choices.filter((choice) => choice.quality === 'optimal').length !== 1)
    issues.push('la mejor para los viajes esperados no es única')

  // LOCKED: la decisión depende del umbral de usos. Si la misma opción gana en
  // todo el rango posible, esto es comparar dos descuentos y no se aprueba.
  const winners = new Set(
    tripRange(p).map((trips) => cheapestAt(p, trips) ?? 'empate'),
  )
  if (winners.size < 2) issues.push('la conveniencia no cambia con los viajes')
  if (winners.has('empate')) issues.push('hay un empate dentro del rango')

  // El umbral tiene que caer adentro del rango que el mes puede tener, no en
  // una cantidad de viajes que nadie va a hacer.
  const crossings = tripRange(p).filter(
    (trips, index, all) =>
      index > 0 && cheapestAt(p, trips) !== cheapestAt(p, all[index - 1] ?? 0),
  )
  if (crossings.length === 0) issues.push('el umbral queda fuera del rango')
  return issues
}

export function evaluatePass(p: PassParams, optionId: string) {
  const option = OPTIONS.find((entry) => entry.id === optionId)
  if (option === undefined)
    return err({
      kind: 'invalid-answer' as const,
      detail: 'opción fuera de contrato',
    })

  const quality = tierOf(p, option.id)
  const best = OPTIONS.find(
    (entry) => tierOf(p, entry.id) === 'optimal',
  ) as (typeof OPTIONS)[number]
  const chosenCost = costOf(p, option.id, p.likely)
  const bestCost = costOf(p, best.id, p.likely)

  return ok(
    outcome(
      quality,
      {
        outcomeKey: `transport-pass.${p.shape}.${quality}`,
        stamp: quality === 'invalid' ? 'Caro' : 'Pagado',
        facts: [
          {
            label: `Con ${String(p.likely)} viajes`,
            value: `$${mil(chosenCost)}`,
          },
          {
            label: `Con ${String(p.high)} viajes`,
            value: `$${mil(costOf(p, option.id, p.high))}`,
          },
          {
            label: 'La más barata a esa altura',
            value: `${best.label} · $${mil(bestCost)}`,
          },
        ],
        ...(quality === 'invalid'
          ? {
              violatedConstraint: `${option.label} sale más caro que otra forma de pagar viajes cualquiera que hagas este mes.`,
            }
          : {}),
        consequence:
          quality === 'optimal'
            ? 'Con los viajes que venís haciendo, ninguna otra forma de pagar te sale menos.'
            : quality === 'efficient'
              ? 'Te conviene si viajás bastante más o bastante menos que el mes pasado; es una apuesta, no un error.'
              : quality === 'functional'
                ? 'Funciona, aunque siempre hay otra que te sale menos.'
                : 'Pagaste de más todo el mes sin ganar nada a cambio.',
      },
      {},
      [{ flag: 'y3.transport.choice', value: option.id }],
    ),
  )
}

export const passVariants = generatedSource({
  id: 'y3.transport-pass.threshold',
  version: '1',
  schema: passSchema,
  size: PASS_SPACE,
  generate: generatePass,
  gates: passGates,
})

const TRANSPORT_FAMILY = toScenarioFamilyId('transporte')

export const transportPass: ChallengeDefinition = defineChallenge<
  PassParams,
  PassParams
>({
  id: toChallengeId('y3.transport-pass'),
  family: TRANSPORT_FAMILY,
  // «checkpoint» es el rol con el que la composición agenda una secundaria.
  placement: 'checkpoint',
  variants: authoredVariantIds(passVariants.authored),
  variantSource: passVariants,
  interaction: 'decision-card',
  stages: ['year-3'],
  categories: ['quantity', 'proportions-and-percentages'],
  baseDifficulty: 2,
  cognitive: feasibilityConstruction,
  composition: {
    primaryReasoningFamily: 'ECONOMIC_PROPORTIONAL',
    interactionEngine: 'choice-compare',
    pacingClass: 'QUICK',
    chronology: 20,
  },
  scoring: {
    math: 'discrete-quality',
    team: 'none',
    aura: 'none',
    rationale:
      'La cuenta es costo fijo contra costo variable y el umbral de usos decide. No hay Equipo ni Aura: la decisión es de una persona sobre su propio mes. Tampoco hay Estilo, porque con cuatro formas de pagar cada elección tiene un solo nivel y una etiqueta de estrategia sería el resultado dicho de nuevo.',
  },
  tools: ['calculator', 'notepad'],
  generate: ({ params }) => parameters(passSchema, params),
  verify: (p) =>
    p.pass > p.fare ? [] : ['el abono cuesta menos que un viaje'],
  narrate: () => ({
    title: 'Cómo pagar el colectivo',
    setup:
      'Arranca el mes y hay que decidir cómo vas a pagar los viajes a la escuela.',
    goal: 'Elegí la forma de pagar que te deje gastando menos este mes.',
  }),
  present: (p) => ({
    kind: 'decision-card',
    data: [
      { label: 'Viajes del mes pasado', value: String(p.likely) },
      {
        label: 'Viajes posibles este mes',
        value: `${String(p.low)} a ${String(p.high)}`,
        constraint: true,
        span: 2,
      },
    ],
    options: [
      {
        id: 'suelto',
        label: 'Boleto suelto',
        detail: `$${mil(p.ticket)} cada viaje, sin pagar nada por adelantado`,
      },
      {
        id: 'recargable',
        label: 'Tarjeta recargable',
        detail: `$${mil(p.card)} la tarjeta, una vez, y después $${mil(p.fare)} cada viaje`,
      },
      {
        id: 'combo',
        label: 'Combo mensual',
        detail: `$${mil(p.combo)} con ${String(p.included)} viajes incluidos; los que siguen, $${mil(p.extra)}`,
      },
      {
        id: 'abono',
        label: 'Abono libre',
        detail: `$${mil(p.pass)} el mes, viajes sin límite`,
      },
    ],
  }),
  evaluate: (p, answer: InteractionAnswer) =>
    answer.kind === 'decision-card'
      ? evaluatePass(p, answer.optionId)
      : err({ kind: 'invalid-answer', detail: 'se esperaba una elección' }),
})

/* -------------------------------------------------------------------------
 * Repaso: costo fijo contra costo por viaje.
 * ---------------------------------------------------------------------- */

export const reviewSchema = z
  .strictObject({
    /** El abono, que se paga una vez y no mira cuánto viajás. */
    pass: money,
    /** El boleto, que se paga cada vez. */
    ticket: money,
  })
  .refine((p) => p.pass > p.ticket * 4, 'el abono se paga con cuatro viajes')
export type ReviewParams = z.infer<typeof reviewSchema>

/**
 * El primer viaje en el que el abono ya salió más barato.
 *
 * Es `parte entera + 1` y no `parte entera`: con la parte entera justa los
 * boletos todavía cuestan igual o menos, y ése es exactamente el paso que este
 * Repaso existe para nombrar.
 */
export function breakEvenTrips(p: ReviewParams): number {
  return Math.floor(p.pass / p.ticket) + 1
}

const REVIEW_TICKETS = [460, 500, 540, 580, 620, 660] as const
const REVIEW_TRIPS = [9, 12, 15, 18, 21, 24, 27, 30] as const
const REVIEW_REMAINDERS = [20, 40, 60, 80] as const
const REVIEW_RADICES = [
  REVIEW_TICKETS.length,
  REVIEW_TRIPS.length,
  REVIEW_REMAINDERS.length,
]
export const REVIEW_SPACE = spaceOf(REVIEW_RADICES)

export function generateReview(index: number): ReviewParams {
  const axes = candidateAxes(index, REVIEW_RADICES, 43)
  const ticket = at(REVIEW_TICKETS, digit(axes, 0))
  const trips = at(REVIEW_TRIPS, digit(axes, 1))
  // El resto es lo que impide que la división dé justa: con un abono múltiplo
  // exacto del boleto, la parte entera y la respuesta coinciden y el Repaso
  // dejaría de tocar el paso que vino a reparar.
  return reviewSchema.parse({
    ticket,
    pass: ticket * trips + at(REVIEW_REMAINDERS, digit(axes, 2)),
  })
}

export function reviewGates(p: ReviewParams): readonly string[] {
  const issues: string[] = []
  const exact = breakEvenTrips(p)
  if (p.pass % p.ticket === 0) issues.push('la división da justa')
  if (exact < 6 || exact > 40) issues.push('la respuesta cae fuera de escala')
  if (p.ticket * (exact - 1) >= p.pass)
    issues.push('con un viaje menos el abono ya convenía')
  if (p.ticket * exact <= p.pass)
    issues.push('en la respuesta todavía no conviene')
  return issues
}

export function evaluateReview(p: ReviewParams, value: string) {
  if (!/^\d{1,4}$/u.test(value))
    return err({
      kind: 'invalid-answer' as const,
      detail: 'se esperaba una cantidad de viajes entera',
    })
  const answered = Number(value)
  const exact = breakEvenTrips(p)
  const facts = [
    { label: 'Abono', value: `$${mil(p.pass)}` },
    { label: 'Boleto', value: `$${mil(p.ticket)}` },
    {
      label: `${String(exact)} boletos`,
      value: `$${mil(p.ticket * exact)}`,
    },
  ]
  const quality: SolutionQuality =
    answered === exact
      ? 'optimal'
      : // La parte entera de la división: la cuenta está bien hecha y lo que
        // falta es mirar que con esa cantidad los boletos todavía salen menos.
        answered === exact - 1
        ? 'functional'
        : answered === exact + 1
          ? 'efficient'
          : 'invalid'
  return ok(
    outcome(quality, {
      outcomeKey: `fixed-variable-review.${quality}`,
      stamp: quality === 'optimal' ? 'Justo' : 'Cerca',
      facts,
      ...(quality === 'optimal'
        ? {
            optimalComparison:
              'El abono no mira cuántas veces viajás; el boleto sí. Se dividen y se suma uno, porque en la parte entera justa los boletos todavía salen menos.',
          }
        : {}),
      ...(quality === 'functional'
        ? {
            violatedConstraint: `Con ${String(exact - 1)} viajes los boletos salen $${mil(p.ticket * (exact - 1))}, todavía menos que el abono.`,
          }
        : {}),
      consequence:
        quality === 'optimal'
          ? 'Ese es el viaje a partir del cual el abono empieza a rendir.'
          : 'El abono rinde un viaje más adelante de lo que dijiste.',
    }),
  )
}

export const reviewVariants = generatedSource({
  id: 'y3.fixed-variable-review.break-even',
  version: '1',
  schema: reviewSchema,
  size: REVIEW_SPACE,
  generate: generateReview,
  gates: reviewGates,
})

export const fixedVariableReview: ChallengeDefinition = defineChallenge<
  ReviewParams,
  ReviewParams
>({
  id: toChallengeId('y3.fixed-variable-review'),
  family: TRANSPORT_FAMILY,
  placement: 'recovery',
  variants: authoredVariantIds(reviewVariants.authored),
  variantSource: reviewVariants,
  interaction: 'numeric-input',
  stages: ['year-3'],
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
    interactionEngine: 'choice-compare',
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
  generate: ({ params }) => parameters(reviewSchema, params),
  verify: (p) => reviewGates(p),
  narrate: () => ({
    title: 'Lo que se paga una vez',
    setup:
      'Antes de decidir el mes que viene, una sola cuenta: el abono se paga una vez y el boleto, cada vez.',
    goal: 'Decí a partir de cuántos viajes el abono te sale más barato.',
  }),
  present: (p) => ({
    kind: 'numeric-input',
    data: [
      { label: 'Abono libre', value: `$${mil(p.pass)}`, unit: 'el mes' },
      {
        label: 'Boleto suelto',
        value: `$${mil(p.ticket)}`,
        unit: 'cada viaje',
        constraint: true,
      },
      {
        // El andamio: la pregunta se hace en dos mitades y la primera está
        // nombrada. Bajar el piso no es dar la respuesta.
        label: 'Primero',
        value: `$${mil(p.pass)} ÷ $${mil(p.ticket)}`,
        unit: 'viajes que paga el abono',
        span: 2,
      },
    ],
    unitLabel: 'viajes',
    min: '1',
    max: '99',
    step: '1',
  }),
  evaluate: (p, answer: InteractionAnswer) =>
    answer.kind === 'numeric-input'
      ? evaluateReview(p, answer.value)
      : err({ kind: 'invalid-answer', detail: 'se esperaba un número' }),
})
