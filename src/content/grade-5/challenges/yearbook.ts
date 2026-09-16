/**
 * 5.º · El anuario (`y5.yearbook`) y su Repaso
 * (`y5.proportion-capacity-review`).
 *
 * La imprenta entrega un anuario de tantas páginas y no de una más ni una
 * menos. Cada sección tiene un mínimo pactado, una cantidad de material y una
 * capacidad por página, y una de ellas tiene tope. Repartir en partes iguales o
 * en proporción al material no cumple: los mínimos y el tope mandan.
 *
 * El contenido de cada sección lo puede cambiar la historia de la carrera —de
 * qué se acuerdan, qué fotos hay— sin cambiar la matemática, que es de páginas
 * y capacidad.
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
  quantity,
  quantityIssues,
  spaceOf,
  tierWitnessIssues,
} from '@/content/authoring'
import { friendDayCallback } from '../../career-facts'

export const SECTIONS = [
  { id: 'cursos', label: 'Fotos de los cursos', max: 12 },
  { id: 'momentos', label: 'Momentos del año', max: 12 },
  { id: 'mensajes', label: 'Mensajes y dedicatorias', max: 12 },
  { id: 'profes', label: 'Los profes', max: 12 },
] as const
export type SectionId = (typeof SECTIONS)[number]['id']

const small = z.number().int().min(0).max(40)
const section = z.strictObject({
  /** Lo que hay para publicar y cuánto entra en una página. */
  items: z.number().int().min(1).max(200),
  perPage: z.number().int().min(1).max(20),
  /** Lo pactado: páginas que la sección tiene sí o sí. */
  minimum: small,
  /** Tope de la sección, cuando lo tiene. */
  maximum: small,
})
export const yearbookSchema = z
  .strictObject({
    shape: z.enum(['tope-apretado', 'minimos-altos', 'material-desparejo']),
    /** Las páginas que imprime la imprenta: ni una más ni una menos. */
    pages: z.number().int().min(12).max(40).multipleOf(4),
    sections: z.tuple([section, section, section, section]),
  })
  .refine(
    (p) =>
      p.sections.reduce((total, entry) => total + entry.minimum, 0) <= p.pages,
    'los mínimos no entran en el anuario',
  )
  .refine(
    (p) => p.sections.every((entry) => entry.maximum >= entry.minimum),
    'una sección tiene un tope por debajo de su mínimo',
  )
export type YearbookParams = z.infer<typeof yearbookSchema>

/** Páginas que una sección necesita para publicar todo lo que tiene. */
export function pagesForAll(p: YearbookParams, index: number): number {
  const entry = p.sections[index]
  return entry === undefined ? 0 : Math.ceil(entry.items / entry.perPage)
}

/**
 * Cuántas secciones se pueden publicar enteras con las páginas que hay.
 *
 * Se resuelve mirando los subconjuntos de secciones: a las elegidas se les da
 * lo que necesitan y a las demás su mínimo. Son dieciséis combinaciones, así
 * que se enumeran; y no llama al oráculo, porque el oráculo la usa.
 */
export function bestCoverage(p: YearbookParams): number {
  let best = 0
  for (let mask = 0; mask < 1 << SECTIONS.length; mask++) {
    let pages = 0
    let fits = true
    let covered = 0
    SECTIONS.forEach((_, index) => {
      const entry = p.sections[index]
      if (entry === undefined) return
      const chosen = (mask & (1 << index)) !== 0
      const want = chosen
        ? Math.max(entry.minimum, pagesForAll(p, index))
        : entry.minimum
      if (want > entry.maximum) fits = false
      pages += want
      if (chosen) covered += 1
    })
    if (fits && pages <= p.pages) best = Math.max(best, covered)
  }
  return best
}

export interface YearbookReading {
  readonly quality: SolutionQuality
  readonly used: number
  /** Secciones cuyo material entra entero. */
  readonly covered: number
  readonly failure?: 'total' | 'minimo' | 'tope'
}

export function readYearbook(
  p: YearbookParams,
  lines: readonly BudgetLine[],
): YearbookReading {
  const counts = SECTIONS.map((entry) => quantity(lines, entry.id))
  const used = counts.reduce((total, value) => total + value, 0)
  const below = counts.some(
    (value, index) => value < (p.sections[index]?.minimum ?? 0),
  )
  const above = counts.some(
    (value, index) => value > (p.sections[index]?.maximum ?? 0),
  )
  const covered = counts.filter(
    (value, index) => value >= pagesForAll(p, index),
  ).length

  const failure =
    used !== p.pages
      ? ('total' as const)
      : below
        ? ('minimo' as const)
        : above
          ? ('tope' as const)
          : undefined

  // Escalera escrita: primero que el anuario sea exactamente el que imprime la
  // imprenta y respete lo pactado, y después cuántas secciones entran enteras
  // contra las que **se podían** publicar enteras con esas páginas. No entra
  // todo: ése es el punto del desafío.
  const quality: SolutionQuality =
    failure !== undefined
      ? 'invalid'
      : covered >= bestCoverage(p)
        ? 'optimal'
        : covered >= 1
          ? 'efficient'
          : 'functional'

  return {
    quality,
    used,
    covered,
    ...(failure === undefined ? {} : { failure }),
  }
}

export interface YearbookPlan {
  readonly lines: readonly BudgetLine[]
  readonly quality: SolutionQuality
  readonly covered: number
}

/**
 * Oráculo independiente sobre todos los repartos que suman exactamente.
 *
 * Enumera las cuatro secciones hasta su tope y se queda con los que dan el
 * total exacto. Nunca llama al evaluador.
 */
export function yearbookPlans(p: YearbookParams): readonly YearbookPlan[] {
  const plans: YearbookPlan[] = []
  const caps = SECTIONS.map((entry, index) =>
    Math.min(entry.max, p.sections[index]?.maximum ?? entry.max),
  )
  for (let a = 0; a <= (caps[0] ?? 0); a++)
    for (let b = 0; b <= (caps[1] ?? 0); b++)
      for (let c = 0; c <= (caps[2] ?? 0); c++) {
        const d = p.pages - a - b - c
        if (d < 0 || d > (caps[3] ?? 0)) continue
        const lines = SECTIONS.map((entry, index) => ({
          itemId: entry.id,
          quantity: [a, b, c, d][index] ?? 0,
        }))
        const read = readYearbook(p, lines)
        plans.push({ lines, quality: read.quality, covered: read.covered })
      }
  return plans
}

const SHAPES = ['tope-apretado', 'minimos-altos', 'material-desparejo'] as const
const PAGES = [16, 20, 24] as const
const ITEMS = [
  [48, 30, 60, 18],
  [36, 44, 24, 30],
  [60, 24, 36, 40],
] as const
const PER_PAGE = [
  [6, 4, 12, 3],
  [8, 6, 10, 4],
  [6, 8, 8, 5],
] as const
const MINIMUMS = [
  [3, 2, 2, 1],
  [2, 3, 3, 2],
  [4, 2, 1, 2],
] as const
const RADICES = [
  SHAPES.length,
  PAGES.length,
  ITEMS.length,
  PER_PAGE.length,
  MINIMUMS.length,
]
export const YEARBOOK_SPACE = spaceOf(RADICES)

export function generateYearbook(index: number): YearbookParams {
  const axes = candidateAxes(index, RADICES, 47)
  const shape = at(SHAPES, digit(axes, 0))
  const pages = at(PAGES, digit(axes, 1))
  const items = at(ITEMS, digit(axes, 2))
  const perPage = at(PER_PAGE, digit(axes, 3))
  const minimums = at(MINIMUMS, digit(axes, 4))
  // Los mínimos suben sólo mientras entren en el anuario: pactar más páginas
  // de las que la imprenta entrega no es una situación, es un error.
  const room = pages - minimums.reduce((total, value) => total + value, 0)
  const bump = room >= SECTIONS.length * 2 ? 2 : 0
  return yearbookSchema.parse({
    shape,
    pages,
    sections: SECTIONS.map((_, position) => {
      const material = items[position] ?? 30
      const capacity = perPage[position] ?? 6
      const needed = Math.ceil(material / capacity)
      // La forma dice qué aprieta, y cada una tiene su firma visible: un tope
      // por debajo de lo que la sección necesita, mínimos altos, o material muy
      // desparejo entre secciones.
      const maximum =
        shape === 'tope-apretado' && position === 0
          ? Math.max(1, needed - 1)
          : 12
      return {
        items:
          shape === 'material-desparejo' && position === 2
            ? material * 2
            : material,
        perPage: capacity,
        minimum:
          shape === 'minimos-altos'
            ? Math.min(maximum, (minimums[position] ?? 2) + bump)
            : Math.min(maximum, minimums[position] ?? 2),
        maximum,
      }
    }),
  })
}

export function yearbookGates(p: YearbookParams): readonly string[] {
  const issues: string[] = []
  const plans = yearbookPlans(p)
  issues.push(...tierWitnessIssues(plans))

  const valid = plans.filter((plan) => plan.quality !== 'invalid')
  if (valid.length === 0) issues.push('ningún reparto cierra')

  // El material no puede entrar entero en todas las secciones a la vez, o no
  // habría nada que decidir; y tienen que poder entrar al menos dos, o la
  // escalera se queda sin escalones.
  const needed = SECTIONS.reduce(
    (total, _, index) => total + pagesForAll(p, index),
    0,
  )
  if (needed <= p.pages) issues.push('el material entra entero sin decidir')
  if (bestCoverage(p) < 2)
    issues.push('con esas páginas no entran dos secciones enteras')

  // Señuelos: el reparto en partes iguales y el proporcional al material no
  // pueden ser la respuesta, porque entonces los mínimos y el tope sobran.
  const equal = Math.floor(p.pages / SECTIONS.length)
  const equalLines = SECTIONS.map((entry, index) => ({
    itemId: entry.id,
    quantity: index === 0 ? p.pages - equal * (SECTIONS.length - 1) : equal,
  }))
  if (readYearbook(p, equalLines).quality === 'optimal')
    issues.push('repartir en partes iguales ya es lo mejor')
  const material = SECTIONS.reduce(
    (total, _, index) => total + (p.sections[index]?.items ?? 0),
    0,
  )
  let assigned = 0
  const proportional = SECTIONS.map((entry, index) => {
    const share =
      index === SECTIONS.length - 1
        ? p.pages - assigned
        : Math.round(((p.sections[index]?.items ?? 0) / material) * p.pages)
    assigned += share
    return { itemId: entry.id, quantity: Math.max(0, share) }
  })
  if (readYearbook(p, proportional).quality === 'optimal')
    issues.push('el reparto proporcional ya es lo mejor')
  return issues
}

export function evaluateYearbook(
  p: YearbookParams,
  lines: readonly BudgetLine[],
) {
  const malformed = quantityIssues(
    lines,
    SECTIONS.map((entry) => ({ id: entry.id, maxQuantity: entry.max })),
  )
  if (malformed.length > 0)
    return err({ kind: 'invalid-answer' as const, detail: malformed[0] ?? '' })

  const read = readYearbook(p, lines)
  const short = SECTIONS.find(
    (entry, index) =>
      quantity(lines, entry.id) < (p.sections[index]?.minimum ?? 0),
  )
  const over = SECTIONS.find(
    (entry, index) =>
      quantity(lines, entry.id) > (p.sections[index]?.maximum ?? 0),
  )
  return ok(
    outcome(
      read.quality,
      {
        outcomeKey: `yearbook.${p.shape}.${read.quality}`,
        stamp: read.quality === 'invalid' ? 'No imprime' : 'Anuario',
        facts: [
          {
            label: 'Páginas usadas',
            value: `${String(read.used)} de ${String(p.pages)}`,
          },
          {
            label: 'Secciones completas',
            value: `${String(read.covered)} de ${String(SECTIONS.length)}`,
          },
        ],
        ...(read.quality === 'invalid'
          ? {
              violatedConstraint:
                read.failure === 'total'
                  ? `La imprenta entrega ${String(p.pages)} páginas exactas y el reparto suma ${String(read.used)}.`
                  : read.failure === 'minimo'
                    ? `${short?.label ?? 'Una sección'} quedó por debajo de lo pactado.`
                    : `${over?.label ?? 'Una sección'} se pasó de su tope.`,
            }
          : {}),
        consequence:
          read.quality === 'invalid'
            ? 'Con ese reparto el anuario no se puede mandar a imprimir.'
            : read.quality === 'optimal'
              ? 'Entró todo lo que había juntado el curso.'
              : 'El anuario sale, aunque algo del material quedó afuera.',
      },
      {},
      [{ flag: 'y5.yearbook.outcome', value: read.quality }],
    ),
  )
}

export const yearbookVariants = generatedSource({
  id: 'y5.yearbook.pages',
  version: '1',
  schema: yearbookSchema,
  size: YEARBOOK_SPACE,
  generate: generateYearbook,
  gates: yearbookGates,
})

const EGRESO_FAMILY = toScenarioFamilyId('egreso')

export const yearbook: ChallengeDefinition = defineChallenge<
  YearbookParams,
  YearbookParams
>({
  id: toChallengeId('y5.yearbook'),
  family: EGRESO_FAMILY,
  placement: 'checkpoint',
  variants: authoredVariantIds(yearbookVariants.authored),
  variantSource: yearbookVariants,
  interaction: 'quantity-builder',
  stages: ['year-5'],
  categories: ['quantity', 'proportions-and-percentages'],
  baseDifficulty: 3,
  cognitive: {
    steps: 2,
    constraints: 3,
    selection: 0,
    optimization: 1,
    uncertainty: 0,
    construction: 1,
  },
  composition: {
    primaryReasoningFamily: 'ALLOCATION',
    interactionEngine: 'allocate-constrain',
    pacingClass: 'MEDIUM',
    chronology: 40,
    eventCluster: 'egreso',
  },
  scoring: {
    math: 'discrete-quality',
    team: 'none',
    aura: 'none',
    rationale:
      'La cuenta es de páginas: un total exacto, mínimos pactados, un tope y cuánto material entra por página. No hay Equipo ni Aura: repartir páginas no mide a nadie.',
  },
  tools: ['calculator', 'notepad'],
  generate: ({ params }) => parameters(yearbookSchema, params),
  verify: (p) =>
    p.sections.reduce((total, entry) => total + entry.minimum, 0) <= p.pages
      ? []
      : ['los mínimos no entran en el anuario'],
  narrate: (_p, context) => ({
    title: 'El anuario',
    setup: `${friendDayCallback(context.flags)}La imprenta entrega un anuario de páginas contadas y hay más material del que entra.`,
    goal: 'Repartí las páginas entre las secciones: el total tiene que dar exacto.',
  }),
  present: (p) => ({
    kind: 'quantity-builder',
    instructions:
      'Poné cuántas páginas lleva cada sección. Tienen que sumar exactamente las que imprime la imprenta.',
    data: [
      {
        label: 'La imprenta entrega',
        value: String(p.pages),
        unit: 'páginas exactas',
        constraint: true,
        span: 2,
      },
      ...SECTIONS.map((entry, index) => ({
        label: entry.label,
        value: `${String(p.sections[index]?.minimum ?? 0)} a ${String(p.sections[index]?.maximum ?? 0)}`,
        unit: 'páginas pactadas',
      })),
    ],
    items: SECTIONS.map((entry, index) => {
      const data = p.sections[index]
      return {
        id: entry.id,
        label: entry.label,
        detail: `${String(data?.items ?? 0)} cosas para publicar · entran ${String(data?.perPage ?? 0)} por página · mínimo ${String(data?.minimum ?? 0)}, tope ${String(data?.maximum ?? 0)}`,
        maxQuantity: Math.min(entry.max, data?.maximum ?? entry.max),
      }
    }),
  }),
  evaluate: (p, answer: InteractionAnswer) =>
    answer.kind === 'quantity-builder'
      ? evaluateYearbook(p, answer.lines)
      : err({
          kind: 'invalid-answer',
          detail: 'se esperaba un reparto de páginas',
        }),
})

/* -------------------------------------------------------------------------
 * Repaso: cuántas páginas pide una sección.
 * ---------------------------------------------------------------------- */

export const proportionReviewSchema = z
  .strictObject({
    /** Lo que hay para publicar y lo que entra en una página. */
    items: z.number().int().min(5).max(200),
    perPage: z.number().int().min(2).max(20),
  })
  .refine((p) => p.items > p.perPage, 'entra todo en una página')
export type ProportionReviewParams = z.infer<typeof proportionReviewSchema>

/** Páginas enteras que hace falta reservar: la última va a medio llenar. */
export function pagesNeeded(p: ProportionReviewParams): number {
  return Math.ceil(p.items / p.perPage)
}

const REVIEW_ITEMS = [26, 34, 45, 52, 63, 75] as const
const REVIEW_PER_PAGE = [4, 6, 8, 12] as const
const REVIEW_RADICES = [REVIEW_ITEMS.length, REVIEW_PER_PAGE.length]
export const PROPORTION_REVIEW_SPACE = spaceOf(REVIEW_RADICES)

export function generateProportionReview(
  index: number,
): ProportionReviewParams {
  const axes = candidateAxes(index, REVIEW_RADICES, 11)
  return proportionReviewSchema.parse({
    items: at(REVIEW_ITEMS, digit(axes, 0)),
    perPage: at(REVIEW_PER_PAGE, digit(axes, 1)),
  })
}

export function proportionReviewGates(
  p: ProportionReviewParams,
): readonly string[] {
  const issues: string[] = []
  // Si la división da justa, redondear para abajo y para arriba dan lo mismo y
  // el Repaso deja de tocar el paso que vino a reparar.
  if (p.items % p.perPage === 0) issues.push('la división da justa')
  if (pagesNeeded(p) > 20) issues.push('la respuesta cae fuera de escala')
  return issues
}

export function evaluateProportionReview(
  p: ProportionReviewParams,
  value: string,
) {
  if (!/^\d{1,3}$/u.test(value))
    return err({
      kind: 'invalid-answer' as const,
      detail: 'se esperaba una cantidad entera de páginas',
    })
  const answered = Number(value)
  const exact = pagesNeeded(p)
  const quality: SolutionQuality =
    answered === exact
      ? 'optimal'
      : // Quedarse con la parte entera: lo que sobra también necesita su
        // página, aunque la deje a medio llenar.
        answered === exact - 1
        ? 'functional'
        : answered === exact + 1
          ? 'efficient'
          : 'invalid'
  return ok(
    outcome(quality, {
      outcomeKey: `proportion-capacity-review.${quality}`,
      stamp: quality === 'optimal' ? 'Justo' : 'Cerca',
      facts: [
        { label: 'Para publicar', value: String(p.items) },
        { label: 'Entran por página', value: String(p.perPage) },
        {
          label: `${String(exact - 1)} páginas`,
          value: `${String((exact - 1) * p.perPage)} cosas`,
        },
      ],
      ...(quality === 'optimal'
        ? {
            optimalComparison:
              'Se divide y se sube al entero: lo que sobra no se tira, necesita su propia página aunque quede a medio llenar.',
          }
        : {}),
      ...(quality === 'functional'
        ? {
            violatedConstraint: `Con ${String(exact - 1)} páginas entran ${String((exact - 1) * p.perPage)} y hay ${String(p.items)}.`,
          }
        : {}),
      consequence:
        quality === 'optimal'
          ? 'Con eso ya sabés cuánto pedirle a la sección.'
          : 'Contar una página de menos deja material afuera del anuario.',
    }),
  )
}

export const proportionReviewVariants = generatedSource({
  id: 'y5.proportion-capacity-review.pages',
  version: '1',
  schema: proportionReviewSchema,
  size: PROPORTION_REVIEW_SPACE,
  generate: generateProportionReview,
  gates: proportionReviewGates,
})

export const proportionCapacityReview: ChallengeDefinition = defineChallenge<
  ProportionReviewParams,
  ProportionReviewParams
>({
  id: toChallengeId('y5.proportion-capacity-review'),
  family: EGRESO_FAMILY,
  placement: 'recovery',
  variants: authoredVariantIds(proportionReviewVariants.authored),
  variantSource: proportionReviewVariants,
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
    primaryReasoningFamily: 'ALLOCATION',
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
  generate: ({ params }) => parameters(proportionReviewSchema, params),
  verify: (p) => proportionReviewGates(p),
  narrate: () => ({
    title: 'Cuántas páginas pide',
    setup: 'Antes de volver al anuario, una sola cuenta con una sección.',
    goal: 'Decí cuántas páginas hay que reservarle.',
  }),
  present: (p) => ({
    kind: 'numeric-input',
    data: [
      { label: 'Para publicar', value: String(p.items), constraint: true },
      { label: 'Entran por página', value: String(p.perPage) },
      {
        label: 'Primero',
        value: `${String(p.items)} ÷ ${String(p.perPage)}`,
        unit: 'y lo que sobra también ocupa',
        span: 2,
      },
    ],
    unitLabel: 'páginas',
    min: '0',
    max: '99',
    step: '1',
  }),
  evaluate: (p, answer: InteractionAnswer) =>
    answer.kind === 'numeric-input'
      ? evaluateProportionReview(p, answer.value)
      : err({ kind: 'invalid-answer', detail: 'se esperaba un número' }),
})
