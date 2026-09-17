/**
 * 5.º · El viaje de egresados (`y5.final-trip-or-event`) y su Repaso
 * (`y5.multi-option-comparison-review`).
 *
 * El curso junta plata todo el año en un fondo común y ahora hay cuatro
 * paquetes sobre la mesa. El precio es sólo uno de los datos: también están los
 * días que el colegio deja, los lugares que tiene cada paquete —tienen que
 * entrar todos— y lo que cada uno incluye.
 *
 * **La plata es del curso, nunca de una persona.** El desafío no pregunta ni
 * infiere qué puede pagar nadie: el fondo es un número de la situación, igual
 * que los días o los lugares.
 *
 * Por eso no es la oferta de notebooks de 7.º con números más grandes: ahí
 * ganaba el más barato y acá el más barato puede no entrar, y una variante
 * donde alcance con mirar el precio no se aprueba.
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
  generatedSource,
  mil,
  outcome,
  parameters,
  spaceOf,
  tierWitnessIssues,
} from '@/content/authoring'

export const PACKAGES = [
  { id: 'costa', label: 'Cinco días a la costa' },
  { id: 'sierra', label: 'Cuatro días a las sierras' },
  { id: 'ciudad', label: 'Tres días en la ciudad' },
  { id: 'quinta', label: 'Fin de semana en una quinta' },
] as const
export type PackageId = (typeof PACKAGES)[number]['id']

/** Lo que el curso pidió que estuviera incluido. */
export const INCLUSIONS = [
  { id: 'micro', label: 'micro' },
  { id: 'comidas', label: 'comidas' },
] as const

const money = z.number().int().min(1000).max(5_000_000).multipleOf(500)
const offer = z.strictObject({
  cost: money,
  days: z.number().int().min(1).max(10),
  places: z.number().int().min(5).max(60),
  micro: z.boolean(),
  comidas: z.boolean(),
})
export const tripSchema = z
  .strictObject({
    shape: z.enum(['fondo-corto', 'pocos-dias', 'curso-grande']),
    /** El fondo del curso, los días que deja el colegio y cuántos son. */
    fund: money,
    freeDays: z.number().int().min(2).max(10),
    course: z.number().int().min(8).max(45),
    /** Lo que el curso quiere dejar para la despedida. */
    reserve: money,
    offers: z.tuple([offer, offer, offer, offer]),
  })
  .refine((p) => p.reserve < p.fund, 'la reserva se come el fondo entero')
export type TripParams = z.infer<typeof tripSchema>

export function feasible(p: TripParams, index: number): boolean {
  const offer = p.offers[index]
  return (
    offer !== undefined &&
    offer.cost <= p.fund &&
    offer.days <= p.freeDays &&
    offer.places >= p.course
  )
}

/** Cuál de los tres datos lo deja afuera, si alguno. */
export function blockedBy(
  p: TripParams,
  index: number,
): 'fondo' | 'dias' | 'lugares' | undefined {
  const offer = p.offers[index]
  if (offer === undefined) return undefined
  if (offer.cost > p.fund) return 'fondo'
  if (offer.days > p.freeDays) return 'dias'
  if (offer.places < p.course) return 'lugares'
  return undefined
}

export function includesWhatWasAsked(p: TripParams, index: number): boolean {
  const offer = p.offers[index]
  return offer !== undefined && offer.micro && offer.comidas
}

/**
 * El nivel de una elección, con la escalera escrita.
 *
 * Primero que el paquete se pueda hacer —plata, días y lugares—, después que
 * traiga lo que el curso pidió, y recién después que deje la reserva de la
 * despedida.
 */
export function tierOf(p: TripParams, index: number): SolutionQuality {
  if (!feasible(p, index)) return 'invalid'
  if (!includesWhatWasAsked(p, index)) return 'functional'
  return (p.offers[index]?.cost ?? 0) <= p.fund - p.reserve
    ? 'optimal'
    : 'efficient'
}

export interface TripChoice {
  readonly packageId: PackageId
  readonly quality: SolutionQuality
}

/** Oráculo independiente: los cuatro paquetes, con su nivel. */
export function tripChoices(p: TripParams): readonly TripChoice[] {
  return PACKAGES.map((entry, index) => ({
    packageId: entry.id,
    quality: tierOf(p, index),
  }))
}

const SHAPES = ['fondo-corto', 'pocos-dias', 'curso-grande'] as const
const FUNDS = [280_000, 340_000, 420_000, 500_000] as const
const COURSES = [24, 28, 34] as const
const FREE_DAYS = [3, 4, 5] as const
const RESERVES = [30_000, 40_000, 60_000] as const
/**
 * Qué papel juega cada paquete, y en qué orden se reparten los papeles.
 *
 * Los cuatro niveles tienen que existir entre cuatro paquetes, así que se
 * construyen: uno no se puede hacer, uno no trae lo que el curso pidió, uno lo
 * trae justo y uno lo trae dejando la reserva. Rotar el orden es lo que impide
 * que la respuesta sea siempre el mismo destino.
 */
const ROLES = ['fuera', 'sin-todo', 'justo', 'holgado'] as const
const ROTATIONS = [0, 1, 2, 3] as const
const RADICES = [
  SHAPES.length,
  FUNDS.length,
  COURSES.length,
  FREE_DAYS.length,
  RESERVES.length,
  ROTATIONS.length,
]
export const TRIP_SPACE = spaceOf(RADICES)

export function generateTrip(index: number): TripParams {
  const axes = candidateAxes(index, RADICES, 149)
  const shape = at(SHAPES, digit(axes, 0))
  const fund = at(FUNDS, digit(axes, 1))
  const course = shape === 'curso-grande' ? 34 : at(COURSES, digit(axes, 2))
  const freeDays = shape === 'pocos-dias' ? 3 : at(FREE_DAYS, digit(axes, 3))
  const reserve = at(RESERVES, digit(axes, 4))
  const rotation = at(ROTATIONS, digit(axes, 5))
  const days = [5, 4, 3, 2]

  return tripSchema.parse({
    shape,
    fund,
    freeDays,
    course,
    reserve,
    offers: PACKAGES.map((_, position) => {
      const role = ROLES[(position + rotation) % ROLES.length] ?? 'justo'
      const nights = days[position] ?? 3
      // El que no se puede hacer falla por lo que la forma dice, y no siempre
      // por plata: ése es justamente el punto del año.
      if (role === 'fuera')
        return {
          // Nunca falla sólo por plata: lo que deja un paquete afuera es
          // siempre un dato que no es el precio, y por eso mirar el precio no
          // alcanza para descartarlo.
          cost: fund - reserve - 20_000,
          days: shape === 'pocos-dias' ? freeDays + 2 : nights,
          places: shape === 'pocos-dias' ? course + 6 : course - 4,
          micro: true,
          comidas: true,
        }
      if (role === 'sin-todo')
        return {
          cost: fund - reserve - 60_000,
          days: Math.min(nights, freeDays),
          places: course + 4,
          micro: true,
          comidas: false,
        }
      if (role === 'justo')
        return {
          cost: fund - Math.floor(reserve / 2),
          days: Math.min(nights, freeDays),
          places: course + 2,
          micro: true,
          comidas: true,
        }
      return {
        cost: fund - reserve - 40_000,
        days: Math.min(nights, freeDays),
        places: course + 8,
        micro: true,
        comidas: true,
      }
    }),
  })
}

export function tripGates(p: TripParams): readonly string[] {
  const issues: string[] = []
  const choices = tripChoices(p)
  issues.push(...tierWitnessIssues(choices))
  if (!choices.some((choice) => choice.quality === 'invalid'))
    issues.push('todos los paquetes se pueden hacer')
  if (choices.filter((choice) => choice.quality === 'optimal').length !== 1)
    issues.push('el mejor paquete no es único')

  // LOCKED: al menos dos dimensiones además del precio deciden. Una deja un
  // paquete afuera —días o lugares— y la otra separa niveles: lo que incluye.
  const reasons = new Set(
    PACKAGES.map((_, index) => blockedBy(p, index)).filter(
      (reason) => reason !== undefined,
    ),
  )
  if (!reasons.has('dias') && !reasons.has('lugares'))
    issues.push('lo único que deja un paquete afuera es el precio')
  if (
    !choices.some(
      (choice, index) =>
        choice.quality === 'functional' && !includesWhatWasAsked(p, index),
    )
  )
    issues.push('lo que incluye cada paquete no separa ningún nivel')

  // Señuelo del Intrinsic Math Gate: el más barato no puede ser la respuesta,
  // o alcanzaría con mirar el precio.
  const costs = p.offers.map((offer) => offer.cost)
  const cheapest = costs.indexOf(Math.min(...costs))
  if (tierOf(p, cheapest) === 'optimal')
    issues.push('el paquete más barato ya es el mejor')
  return issues
}

export function evaluateTrip(p: TripParams, optionId: string) {
  const index = PACKAGES.findIndex((entry) => entry.id === optionId)
  if (index < 0)
    return err({
      kind: 'invalid-answer' as const,
      detail: 'paquete fuera de contrato',
    })

  const quality = tierOf(p, index)
  const offer = p.offers[index]
  const best = PACKAGES.find((_, other) => tierOf(p, other) === 'optimal')
  const reason = blockedBy(p, index)

  return ok(
    outcome(
      quality,
      {
        outcomeKey: `final-trip.${p.shape}.${quality}`,
        stamp: quality === 'invalid' ? 'No se puede' : 'Reservado',
        facts: [
          { label: 'Sale', value: `$${mil(offer?.cost ?? 0)}` },
          { label: 'Fondo del curso', value: `$${mil(p.fund)}` },
          {
            label: 'Días',
            value: `${String(offer?.days ?? 0)} de ${String(p.freeDays)}`,
          },
          {
            label: 'Lugares',
            value: `${String(offer?.places ?? 0)} para ${String(p.course)}`,
          },
        ],
        ...(quality === 'invalid'
          ? {
              violatedConstraint:
                reason === 'fondo'
                  ? 'No alcanza el fondo del curso.'
                  : reason === 'dias'
                    ? 'El colegio no da tantos días.'
                    : 'No hay lugares para todo el curso.',
            }
          : {}),
        consequence:
          quality === 'invalid'
            ? 'Con ese paquete el viaje no se puede reservar.'
            : quality === 'functional'
              ? `Se puede hacer, pero hay que poner aparte ${
                  offer?.micro === false && offer.comidas === false
                    ? 'el micro y las comidas'
                    : offer?.micro === false
                      ? 'el micro'
                      : 'las comidas'
                }.`
              : quality === 'efficient'
                ? 'Entra todo lo que el curso pidió, aunque el fondo queda al límite.'
                : `Entra todo y sobra para la despedida${
                    best === undefined ? '' : ''
                  }.`,
      },
      {},
      [{ flag: 'y5.trip.choice', value: optionId }],
    ),
  )
}

export const tripVariants = generatedSource({
  id: 'y5.final-trip.packages',
  version: '1',
  schema: tripSchema,
  size: TRIP_SPACE,
  generate: generateTrip,
  gates: tripGates,
})

const EGRESO_FAMILY = toScenarioFamilyId('egreso')

export const finalTripOrEvent: ChallengeDefinition = defineChallenge<
  TripParams,
  TripParams
>({
  id: toChallengeId('y5.final-trip-or-event'),
  family: EGRESO_FAMILY,
  placement: 'anchor',
  variants: authoredVariantIds(tripVariants.authored),
  variantSource: tripVariants,
  interaction: 'decision-card',
  stages: ['year-5'],
  categories: ['quantity', 'proportions-and-percentages'],
  baseDifficulty: 4,
  // Dos relaciones encadenadas, tres restricciones sostenidas a la vez y
  // elegir entre paquetes que no se ordenan por un solo número: carga 8.
  cognitive: {
    steps: 2,
    constraints: 3,
    selection: 1,
    optimization: 1,
    uncertainty: 0,
    construction: 1,
  },
  composition: {
    primaryReasoningFamily: 'ECONOMIC_PROPORTIONAL',
    interactionEngine: 'choice-compare',
    pacingClass: 'MEDIUM',
    chronology: 20,
    eventCluster: 'egreso',
  },
  scoring: {
    math: 'discrete-quality',
    team: 'none',
    aura: 'none',
    rationale:
      'La cuenta compara paquetes contra el fondo del curso, los días que deja el colegio y los lugares que hacen falta. La plata es del curso y nunca de una persona: el desafío no pregunta ni infiere qué puede pagar nadie.',
  },
  tools: ['calculator', 'notepad'],
  generate: ({ params }) => parameters(tripSchema, params),
  verify: (p) =>
    p.reserve < p.fund ? [] : ['la reserva se come el fondo entero'],
  narrate: () => ({
    title: 'El viaje',
    setup:
      'El curso juntó plata todo el año y hay cuatro paquetes sobre la mesa. El colegio da unos días y tienen que entrar todos.',
    goal: 'Elegí el paquete que el curso puede hacer con lo que juntó.',
  }),
  present: (p) => ({
    kind: 'decision-card',
    data: [
      { label: 'Fondo del curso', value: `$${mil(p.fund)}`, constraint: true },
      {
        label: 'Días que da el colegio',
        value: String(p.freeDays),
        constraint: true,
      },
      { label: 'Son', value: `${String(p.course)} personas`, constraint: true },
      {
        label: 'Quieren dejar para la despedida',
        value: `$${mil(p.reserve)}`,
        span: 2,
      },
    ],
    options: PACKAGES.map((entry, index) => {
      const offer = p.offers[index]
      const included = [
        offer?.micro === true ? 'micro' : '',
        offer?.comidas === true ? 'comidas' : '',
      ].filter((text) => text !== '')
      return {
        id: entry.id,
        label: entry.label,
        detail: `$${mil(offer?.cost ?? 0)} · ${String(offer?.days ?? 0)} días · ${String(offer?.places ?? 0)} lugares · incluye ${included.join(' y ') || 'nada'}`,
      }
    }),
  }),
  evaluate: (p, answer: InteractionAnswer) =>
    answer.kind === 'decision-card'
      ? evaluateTrip(p, answer.optionId)
      : err({ kind: 'invalid-answer', detail: 'se esperaba una elección' }),
})

/* -------------------------------------------------------------------------
 * Repaso: comparar cuando el precio no es el único dato.
 * ---------------------------------------------------------------------- */

export const comparisonReviewSchema = z
  .strictObject({
    /** Lo que sale el paquete para todo el curso, sin el micro. */
    packagePrice: money,
    /** El micro, que se cobra por persona. */
    perPerson: z.number().int().min(500).max(20_000).multipleOf(500),
    people: z.number().int().min(8).max(45),
  })
  .refine((p) => p.people >= 2, 'el micro se cobra a una sola persona')
export type ComparisonReviewParams = z.infer<typeof comparisonReviewSchema>

/** Lo que sale de verdad el paquete: lo del paquete más el micro de cada uno. */
export function totalWithBus(p: ComparisonReviewParams): number {
  return p.packagePrice + p.perPerson * p.people
}

const REVIEW_PRICES = [180_000, 240_000, 300_000, 360_000] as const
const REVIEW_PER_PERSON = [2_500, 4_000, 5_500, 7_000] as const
const REVIEW_PEOPLE = [18, 24, 28, 32] as const
const REVIEW_RADICES = [
  REVIEW_PRICES.length,
  REVIEW_PER_PERSON.length,
  REVIEW_PEOPLE.length,
]
export const COMPARISON_REVIEW_SPACE = spaceOf(REVIEW_RADICES)

export function generateComparisonReview(
  index: number,
): ComparisonReviewParams {
  const axes = candidateAxes(index, REVIEW_RADICES, 29)
  return comparisonReviewSchema.parse({
    packagePrice: at(REVIEW_PRICES, digit(axes, 0)),
    perPerson: at(REVIEW_PER_PERSON, digit(axes, 1)),
    people: at(REVIEW_PEOPLE, digit(axes, 2)),
  })
}

export function comparisonReviewGates(
  p: ComparisonReviewParams,
): readonly string[] {
  const issues: string[] = []
  // Si el micro de uno solo ya fuera el total, el señuelo —sumarlo una vez—
  // dejaría de ser un error distinguible.
  if (p.people < 2) issues.push('el micro se cobra a una sola persona')
  if (p.perPerson * p.people < p.packagePrice / 10)
    issues.push('el micro no mueve la cuenta')
  return issues
}

export function evaluateComparisonReview(
  p: ComparisonReviewParams,
  value: string,
) {
  if (!/^\d{1,9}$/u.test(value))
    return err({
      kind: 'invalid-answer' as const,
      detail: 'se esperaba un total entero en pesos',
    })
  const answered = Number(value)
  const exact = totalWithBus(p)
  const once = p.packagePrice + p.perPerson
  const quality: SolutionQuality =
    answered === exact
      ? 'optimal'
      : // Sumar el micro una sola vez: la cuenta está bien armada sobre un
        // precio que es por persona y se trató como si fuera del curso.
        answered === once
        ? 'functional'
        : Math.abs(answered - exact) <= p.perPerson
          ? 'efficient'
          : 'invalid'
  return ok(
    outcome(quality, {
      outcomeKey: `multi-option-comparison-review.${quality}`,
      stamp: quality === 'optimal' ? 'Justo' : 'Cerca',
      facts: [
        { label: 'El paquete', value: `$${mil(p.packagePrice)}` },
        {
          label: 'El micro',
          value: `$${mil(p.perPerson)} por persona`,
        },
        {
          label: `${String(p.people)} × $${mil(p.perPerson)}`,
          value: `$${mil(p.perPerson * p.people)}`,
        },
      ],
      ...(quality === 'optimal'
        ? {
            optimalComparison:
              'Un precio por persona se multiplica por cuántos son antes de sumarlo al precio del paquete.',
          }
        : {}),
      ...(quality === 'functional'
        ? {
            violatedConstraint: `El micro son $${mil(p.perPerson)} por cada uno, y son ${String(p.people)}.`,
          }
        : {}),
      consequence:
        quality === 'optimal'
          ? 'Con ese total ya se pueden comparar los paquetes de verdad.'
          : answered < exact
            ? 'Ese total deja afuera parte del micro: comparar precios que no incluyen lo mismo es lo que hace que después falte plata.'
            : 'Ese total suma de más: con el micro de cada uno, el paquete sale menos.',
    }),
  )
}

export const comparisonReviewVariants = generatedSource({
  id: 'y5.multi-option-comparison-review.total',
  version: '1',
  schema: comparisonReviewSchema,
  size: COMPARISON_REVIEW_SPACE,
  generate: generateComparisonReview,
  gates: comparisonReviewGates,
})

export const multiOptionComparisonReview: ChallengeDefinition = defineChallenge<
  ComparisonReviewParams,
  ComparisonReviewParams
>({
  id: toChallengeId('y5.multi-option-comparison-review'),
  family: EGRESO_FAMILY,
  placement: 'recovery',
  variants: authoredVariantIds(comparisonReviewVariants.authored),
  variantSource: comparisonReviewVariants,
  interaction: 'numeric-input',
  stages: ['year-5'],
  categories: ['quantity', 'proportions-and-percentages'],
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
  generate: ({ params }) => parameters(comparisonReviewSchema, params),
  verify: (p) => comparisonReviewGates(p),
  narrate: () => ({
    title: 'Lo que no está incluido',
    setup:
      'Antes de volver a los paquetes, una sola cuenta: el que parece más barato no incluye el micro.',
    goal: 'Decí cuánto sale ese paquete en total.',
  }),
  present: (p) => ({
    kind: 'numeric-input',
    data: [
      {
        label: 'El paquete',
        value: `$${mil(p.packagePrice)}`,
        constraint: true,
      },
      {
        label: 'El micro',
        value: `$${mil(p.perPerson)}`,
        unit: 'por persona',
        constraint: true,
      },
      { label: 'Son', value: String(p.people), unit: 'personas' },
      {
        label: 'Primero',
        value: `${String(p.people)} × $${mil(p.perPerson)}`,
        unit: 'y después se suma al paquete',
        span: 2,
      },
    ],
    unitLabel: 'pesos',
    min: '0',
    max: '9999999',
    step: '1',
  }),
  evaluate: (p, answer: InteractionAnswer) =>
    answer.kind === 'numeric-input'
      ? evaluateComparisonReview(p, answer.value)
      : err({ kind: 'invalid-answer', detail: 'se esperaba un número' }),
})
