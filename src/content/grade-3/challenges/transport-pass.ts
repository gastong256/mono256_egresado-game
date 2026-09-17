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
      'pocos-viajes',
      'mes-corto',
      'arranque',
      'mes-completo',
      'con-salidas',
      'mes-cargado',
    ]),
    /** Viajes posibles del mes y los del mes pasado, que es la referencia. */
    low: z.number().int().min(1).max(80),
    likely: z.number().int().min(1).max(80),
    high: z.number().int().min(1).max(80),
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
 * Seis meses posibles, y no sólo seis rangos.
 *
 * El nivel de uso es lo que decide cuál conviene, así que los meses van de uno
 * de muy pocos viajes a uno cargado. El de pocos viajes existe para que pagar
 * por viaje pueda ser lo más barato: sin él, el catálogo enseñaría que el
 * boleto suelto nunca conviene, que es la regla contraria a la del umbral
 * (MAT-001).
 */
const SHAPES = [
  { id: 'pocos-viajes', low: 4, likely: 7, high: 11 },
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
/**
 * El abono se cotiza en viajes de tarjeta, y esa cotización es de la ciudad.
 *
 * Antes salía del tope de viajes del jugador, así que el abono quedaba casi
 * siempre a la par de la tarjeta en el extremo alto del mes y «siempre abono»
 * rendía 78 sin mirar un número. Un precio no depende de cuánto va a viajar
 * quien lo paga.
 */
const PASS_TRIPS = [14, 20, 28, 36, 44] as const
/** Lo que sale la tarjeta una vez, en porcentaje de un boleto. */
const CARD_FACTORS = [100, 200, 300, 400] as const
export const PASS_RADICES: readonly number[] = [
  SHAPES.length,
  TICKETS.length,
  FARE_DROPS.length,
  INCLUDED.length,
  COMBO_FACTORS.length,
  PASS_TRIPS.length,
  CARD_FACTORS.length,
  EXTRA_FACTORS.length,
]
export const PASS_SPACE = spaceOf(PASS_RADICES)
export const PASS_STRIDE = 1493

/** Redondeo a la decena, que es como se escriben los precios del boleto. */
const round10 = (value: number): number => Math.round(value / 10) * 10

/**
 * Los precios de una dirección del espacio, sin mirar qué forma de pago gana.
 *
 * Ningún precio sale de `low`, `likely` ni `high`: la forma del mes es un eje y
 * los precios son otros.
 */
export function passPricesAt(index: number): PassParams {
  const axes = candidateAxes(index, PASS_RADICES, PASS_STRIDE)
  const shape = at(SHAPES, digit(axes, 0))
  const ticket = at(TICKETS, digit(axes, 1))
  const fare = ticket - at(FARE_DROPS, digit(axes, 2))
  const included = at(INCLUDED, digit(axes, 3))
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
    extra: Math.min(
      ticket,
      round10((fare * at(EXTRA_FACTORS, digit(axes, 7))) / 100),
    ),
    pass: round10(at(PASS_TRIPS, digit(axes, 5)) * fare),
  })
}

/**
 * Qué forma de pago tiene que ser la óptima en cada dirección.
 *
 * Rota con la dirección, así que las primeras aprobaciones del catálogo reparten
 * el óptimo entre las cuatro en vez de dejarlo a lo que el espacio produzca más
 * seguido.
 */
export function roleOf(index: number): OptionId {
  return at(
    ['suelto', 'recargable', 'combo', 'abono'] as const,
    Math.abs(index) % 4,
  )
}

/** Cuántas direcciones del espacio se miran para encontrar un mes del papel pedido. */
const ROLE_SEARCH = 97

/**
 * Generación por papel: la primera combinación de precios, en un recorrido
 * determinista del espacio, donde la forma de pago del papel es la más barata
 * para los viajes esperados y la variante pasa todos los gates. Si no aparece,
 * devuelve la última probada y el gate de papel la rechaza.
 */
export function generatePass(index: number): PassParams {
  const role = roleOf(index)
  let last = passPricesAt(index)
  for (let attempt = 0; attempt < ROLE_SEARCH; attempt++) {
    const candidate = passPricesAt((index * 31 + attempt * 7919) % PASS_SPACE)
    last = candidate
    if (
      cheapestAt(candidate, candidate.likely) === role &&
      mathGates(candidate).length === 0
    )
      return candidate
  }
  return last
}

/**
 * Diferencia mínima visible, en `likely`, entre la más barata y la segunda:
 * cien pesos o el 2 % del costo de la más barata, lo que sea mayor. Debajo de
 * eso el nivel depende de precisión de cuenta y no del umbral.
 */
export function likelyGap(p: PassParams): {
  readonly gap: number
  readonly cheapest: number
} {
  const costs = OPTIONS.map((option) => costOf(p, option.id, p.likely)).sort(
    (a, b) => a - b,
  )
  const cheapest = costs[0] ?? 0
  return { gap: (costs[1] ?? cheapest) - cheapest, cheapest }
}

function mathGates(p: PassParams): readonly string[] {
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

  const { gap, cheapest } = likelyGap(p)
  if (gap < 100 || gap * 50 < cheapest)
    issues.push('la más barata le saca muy poco a la segunda')
  return issues
}

/**
 * Gate de dirección: la óptima es la del papel que le toca a esa dirección.
 */
export function passRoleGates(p: PassParams, index: number): readonly string[] {
  return cheapestAt(p, p.likely) === roleOf(index)
    ? []
    : ['la óptima no es la del papel de esta dirección']
}

/** Los gates matemáticos, sin el papel: lo que toda variante tiene que cumplir. */
export function passGates(p: PassParams): readonly string[] {
  return mathGates(p)
}

/**
 * Hacia dónde gana una forma de pago que no es la óptima: las cantidades del
 * rango, por debajo y por encima de los viajes esperados, en las que es la más
 * barata. Es lo que el feedback `efficient` tiene que decir, calculado de la
 * variante y nunca escrito de antemano.
 */
export function winningSides(
  p: PassParams,
  option: OptionId,
): { readonly below?: number; readonly above?: number } {
  const wins = tripRange(p).filter((trips) => cheapestAt(p, trips) === option)
  const below = wins.filter((trips) => trips < p.likely)
  const above = wins.filter((trips) => trips > p.likely)
  return {
    ...(below.length > 0 ? { below: Math.max(...below) } : {}),
    ...(above.length > 0 ? { above: Math.min(...above) } : {}),
  }
}

/** La frase de apuesta de una opción `efficient`, con la dirección real. */
export function efficientConsequence(p: PassParams, option: OptionId): string {
  const { below, above } = winningSides(p, option)
  const fewer =
    below === undefined ? undefined : `viajás ${String(below)} veces o menos`
  const more =
    above === undefined ? undefined : `viajás ${String(above)} veces o más`
  const when =
    fewer !== undefined && more !== undefined
      ? `${fewer}, o si ${more}`
      : (fewer ?? more ?? '')
  return `Te conviene si este mes ${when}; es una apuesta, no un error.`
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
              ? efficientConsequence(p, option.id)
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
  version: '2',
  schema: passSchema,
  size: PASS_SPACE,
  generate: generatePass,
  gates: passGates,
  addressGates: passRoleGates,
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
      'Arranca el mes y hay que decidir cómo vas a pagar los viajes a la escuela. Los viajes del mes pasado son tu mejor estimación; el rango dice cuánto puede cambiar este mes.',
    goal: 'Elegí la forma de pagar que te deje gastando menos si este mes viajás como el pasado.',
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
      // La dirección del error sale de la respuesta: antes una sola frase le
      // decía «más adelante» también a quien se había pasado (MAT-AJ-NEW-003).
      consequence:
        quality === 'optimal'
          ? 'Ese es el viaje a partir del cual el abono empieza a rendir.'
          : answered < exact
            ? 'El abono empieza a rendir más adelante de lo que dijiste.'
            : 'El abono ya rinde desde antes de lo que dijiste.',
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
