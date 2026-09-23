/**
 * 1.º · La rueda del Día del Estudiante (`y1.student-day-challenge-wheel`).
 *
 * Posiciones equiprobables y **una** regla proporcional obligatoria sobre una
 * categoría o un par explícito de categorías (D-S08-043). La regla viaja en
 * fracción, porcentaje, «1 de cada k» o probabilidad: cuatro notaciones de la
 * misma relación conocida, no información incierta. El jugador construye la
 * distribución; la probabilidad intuitiva vuelve en la consecuencia —con n de
 * N posiciones, en N giros saldría unas n veces—. Ningún giro se sortea ni se
 * puntúa, y nada pide la distribución «más equilibrada».
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
  feasibilityConstruction,
  generatedSource,
  outcome,
  parameters,
  quantity,
  quantityIssues,
  spaceOf,
  tierWitnessIssues,
} from '../authoring'
import { graded } from '../../grades'

export const WHEEL_CATEGORIES = [
  {
    id: 'games',
    label: 'Juegos',
    code: 'Jue',
    singular: 'un juego',
    of: 'juegos',
  },
  {
    id: 'team',
    label: 'Desafíos grupales',
    code: 'Gru',
    singular: 'un desafío grupal',
    of: 'desafíos grupales',
  },
  {
    id: 'questions',
    label: 'Preguntas',
    code: 'Preg',
    singular: 'una pregunta',
    of: 'preguntas',
  },
  {
    id: 'prizes',
    label: 'Premios simbólicos',
    code: 'Prem',
    singular: 'un premio',
    of: 'premios simbólicos',
  },
  {
    id: 'rest',
    label: 'Descanso',
    code: 'Desc',
    singular: 'descanso',
    of: 'descanso',
  },
] as const
type CategoryId = (typeof WHEEL_CATEGORIES)[number]['id']
const CATEGORY_IDS = [
  'games',
  'team',
  'questions',
  'prizes',
  'rest',
] as const satisfies readonly CategoryId[]

export const wheelSchema = z
  .strictObject({
    total: z.number().int().min(8).max(24),
    rule: z.strictObject({
      comparator: z.enum(['exactly', 'at-least', 'at-most']),
      categories: z.array(z.enum(CATEGORY_IDS)).min(1).max(2),
      numerator: z.number().int().min(1).max(9),
      denominator: z.number().int().min(2).max(10),
      notation: z.enum(['fraction', 'percent', 'one-in', 'probability']),
    }),
    preference: z.enum(['two-rests', 'two-questions', 'all-kinds']),
  })
  .refine((p) => p.rule.numerator < p.rule.denominator, 'fracción impropia')
  .refine(
    (p) => (p.total * p.rule.numerator) % p.rule.denominator === 0,
    'la regla no da una cantidad entera de posiciones',
  )
  .refine(
    (p) => new Set(p.rule.categories).size === p.rule.categories.length,
    'categoría repetida en la regla',
  )
  .refine(
    (p) =>
      p.rule.notation !== 'percent' ||
      (100 * p.rule.numerator) % p.rule.denominator === 0,
    'porcentaje no entero',
  )
  .refine(
    (p) => p.rule.notation !== 'one-in' || p.rule.numerator === 1,
    '«1 de cada k» exige numerador 1',
  )
export type WheelParams = z.infer<typeof wheelSchema>
type Counts = Readonly<Record<CategoryId, number>>

const RULE_PLANS = [
  {
    comparator: 'exactly',
    categories: ['team'],
    fractions: [
      [1, 3],
      [1, 4],
      [1, 5],
    ],
  },
  {
    comparator: 'at-least',
    categories: ['games'],
    fractions: [
      [1, 4],
      [1, 3],
      [2, 5],
    ],
  },
  {
    comparator: 'at-most',
    categories: ['rest'],
    fractions: [
      [1, 6],
      [1, 5],
      [1, 4],
    ],
  },
  {
    comparator: 'exactly',
    categories: ['games', 'team'],
    fractions: [
      [1, 2],
      [2, 5],
      [3, 5],
    ],
  },
  {
    comparator: 'at-least',
    categories: ['questions'],
    fractions: [
      [1, 5],
      [1, 4],
      [1, 3],
    ],
  },
  {
    comparator: 'at-most',
    categories: ['prizes'],
    fractions: [
      [1, 10],
      [1, 6],
      [1, 5],
    ],
  },
] as const
const TOTALS = [8, 10, 12, 15, 16, 18, 20, 24] as const
const NOTATIONS = ['fraction', 'percent', 'one-in', 'probability'] as const
const PREFERENCES = ['two-rests', 'two-questions', 'all-kinds'] as const
const RADICES = [
  RULE_PLANS.length,
  3,
  TOTALS.length,
  NOTATIONS.length,
  PREFERENCES.length,
]
export const WHEEL_SPACE = spaceOf(RADICES)

/**
 * One authored rule family per shape, a fraction, a total that divides it,
 * one of the notations the fraction admits and one quality preference.
 */
export function generateWheel(index: number): WheelParams {
  const axes = candidateAxes(index, RADICES, 1111)
  const plan = at(RULE_PLANS, digit(axes, 0))
  const [numerator, denominator] = at(plan.fractions, digit(axes, 1))
  const totals = TOTALS.filter((total) => total % denominator === 0)
  const notations = NOTATIONS.filter(
    (notation) =>
      (notation !== 'percent' || (100 * numerator) % denominator === 0) &&
      (notation !== 'one-in' || numerator === 1),
  )
  return wheelSchema.parse({
    total: totals[digit(axes, 2) % totals.length] ?? 20,
    rule: {
      comparator: plan.comparator,
      categories: [...plan.categories],
      numerator,
      denominator,
      notation: notations[digit(axes, 3) % notations.length] ?? 'fraction',
    },
    preference: at(PREFERENCES, digit(axes, 4)),
  })
}

function byId(id: CategoryId) {
  return (
    WHEEL_CATEGORIES.find((category) => category.id === id) ??
    WHEEL_CATEGORIES[0]
  )
}

/** Positions the rule is about: one category or the sum of a pair. */
function ruleCount(p: WheelParams, counts: Counts): number {
  return p.rule.categories.reduce((sum, id) => sum + counts[id], 0)
}

/** Cross-multiplied, so the comparison never divides. */
function followsRule(p: WheelParams, share: number): boolean {
  const left = share * p.rule.denominator
  const right = p.total * p.rule.numerator
  switch (p.rule.comparator) {
    case 'exactly':
      return left === right
    case 'at-least':
      return left >= right
    case 'at-most':
      return left <= right
  }
}

function preferenceMet(p: WheelParams, counts: Counts, kinds: number): boolean {
  switch (p.preference) {
    case 'two-rests':
      return counts.rest >= 2
    case 'two-questions':
      return counts.questions >= 2
    case 'all-kinds':
      return kinds === WHEEL_CATEGORIES.length
  }
}

function kindsOf(counts: Counts): number {
  return CATEGORY_IDS.filter((id) => counts[id] > 0).length
}

function gcd(left: number, right: number): number {
  return right === 0 ? left : gcd(right, left % right)
}

/** `4/12 = 1/3`, `3/12 = 25 %`: the reduced form, in the rule's notation. */
function shareText(p: WheelParams, share: number): string {
  const raw = `${String(share)}/${String(p.total)}`
  if (p.rule.notation === 'percent' && (100 * share) % p.total === 0)
    return `${raw} = ${String((100 * share) / p.total)} %`
  const divisor = gcd(share, p.total)
  return divisor > 1 && share > 0
    ? `${raw} = ${String(share / divisor)}/${String(p.total / divisor)}`
    : raw
}

function fractionWords(p: WheelParams): string {
  const { numerator, denominator } = p.rule
  switch (p.rule.notation) {
    case 'percent':
      return `el ${String((100 * numerator) / denominator)} % de la rueda`
    case 'one-in':
      return `1 de cada ${String(denominator)} posiciones`
    case 'fraction':
    case 'probability':
      return `${String(numerator)}/${String(denominator)} de la rueda`
  }
}

/** The mandatory rule, written for the player. */
export function wheelRuleText(p: WheelParams): string {
  const categories = p.rule.categories.map(byId)
  if (p.rule.notation === 'probability') {
    const what = categories.map((category) => category.singular).join(' o ')
    const comparator = {
      exactly: 'exactamente',
      'at-least': 'al menos',
      'at-most': 'como máximo',
    }[p.rule.comparator]
    return `La probabilidad de que salga ${what} tiene que ser ${comparator} ${String(p.rule.numerator)}/${String(p.rule.denominator)}.`
  }
  const comparator = {
    exactly: 'Exactamente',
    'at-least': 'Al menos',
    'at-most': 'Como máximo',
  }[p.rule.comparator]
  const verb = p.rule.comparator === 'at-most' ? 'puede' : 'tiene que'
  const who =
    categories.length === 1
      ? (categories[0]?.of ?? '')
      : `${categories.map((category) => category.of).join(' y ')} sumados`
  return `${comparator} ${fractionWords(p)} ${verb} ser de ${who}.`
}

function preferenceText(p: WheelParams): string {
  switch (p.preference) {
    case 'two-rests':
      return 'al menos 2 descansos'
    case 'two-questions':
      return 'al menos 2 posiciones de preguntas'
    case 'all-kinds':
      return 'que estén los cinco tipos de actividad'
  }
}

function countsOf(lines: readonly BudgetLine[]): Counts {
  return {
    games: quantity(lines, 'games'),
    team: quantity(lines, 'team'),
    questions: quantity(lines, 'questions'),
    prizes: quantity(lines, 'prizes'),
    rest: quantity(lines, 'rest'),
  }
}

export interface WheelPlan {
  readonly lines: readonly BudgetLine[]
  readonly quality: SolutionQuality
}

/**
 * Independent oracle: every complete distribution of the positions.
 *
 * Its own spelling of rule, variety and preference, over plain integers.
 */
export function wheelPlans(p: WheelParams): readonly WheelPlan[] {
  const plans: WheelPlan[] = []
  const target = (p.total * p.rule.numerator) / p.rule.denominator
  for (let games = 0; games <= p.total; games++)
    for (let team = 0; team <= p.total - games; team++)
      for (let questions = 0; questions <= p.total - games - team; questions++)
        for (
          let prizes = 0;
          prizes <= p.total - games - team - questions;
          prizes++
        ) {
          const rest = p.total - games - team - questions - prizes
          const counts = [games, team, questions, prizes, rest]
          const named: Record<string, number> = {
            games,
            team,
            questions,
            prizes,
            rest,
          }
          const share = p.rule.categories
            .map((id) => named[id] ?? 0)
            .reduce((sum, value) => sum + value, 0)
          const ruled =
            p.rule.comparator === 'exactly'
              ? share === target
              : p.rule.comparator === 'at-least'
                ? share >= target
                : share <= target
          const kinds = counts.filter((count) => count !== 0).length
          const preferred =
            p.preference === 'all-kinds'
              ? kinds === 5
              : p.preference === 'two-rests'
                ? rest > 1
                : questions > 1
          plans.push({
            lines: CATEGORY_IDS.map((itemId, i) => ({
              itemId,
              quantity: counts[i] ?? 0,
            })),
            quality: !ruled
              ? 'invalid'
              : kinds < 3
                ? 'functional'
                : preferred
                  ? 'optimal'
                  : 'efficient',
          })
        }
  return plans
}

/** The as-even-as-possible split a player could type without reading the rule. */
function evenSplit(total: number): readonly BudgetLine[] {
  return CATEGORY_IDS.map((itemId, i) => ({
    itemId,
    quantity:
      Math.floor(total / CATEGORY_IDS.length) +
      (i < total % CATEGORY_IDS.length ? 1 : 0),
  }))
}

export function wheelGates(p: WheelParams): readonly string[] {
  const plans = wheelPlans(p)
  const issues = [...tierWitnessIssues(plans)]
  if (plans.filter((plan) => plan.quality === 'optimal').length < 2)
    issues.push('una sola distribución óptima')

  // Intrinsic Math Gate: the rule changes which usable wheels are valid.
  const binding = plans.some((plan) => {
    const counts = countsOf(plan.lines)
    const kinds = kindsOf(counts)
    return (
      kinds >= 3 &&
      preferenceMet(p, counts, kinds) &&
      !followsRule(p, ruleCount(p, counts))
    )
  })
  if (!binding)
    issues.push('la regla no descarta ninguna rueda variada: no decide nada')

  const even = evenSplit(p.total)
  const evenQuality = plans.find((plan) =>
    plan.lines.every((line, i) => line.quantity === (even[i]?.quantity ?? -1)),
  )?.quality
  if (evenQuality === 'optimal')
    issues.push('el reparto parejo sin leer la regla ya es óptimo')

  const target = (p.total * p.rule.numerator) / p.rule.denominator
  if (target < 1 || target > p.total - 2)
    issues.push('la regla deja sin lugar para la variedad')
  return issues
}

function verifyWheel(p: WheelParams): readonly string[] {
  return (p.total * p.rule.numerator) % p.rule.denominator === 0
    ? []
    : ['la regla no da una cantidad entera de posiciones']
}

export function evaluateWheel(p: WheelParams, lines: readonly BudgetLine[]) {
  const issues = quantityIssues(
    lines,
    CATEGORY_IDS.map((id) => ({ id, maxQuantity: p.total })),
  )
  if (issues.length > 0)
    return err({ kind: 'invalid-answer' as const, detail: issues.join('; ') })

  const counts = countsOf(lines)
  const total = CATEGORY_IDS.reduce((sum, id) => sum + counts[id], 0)
  const share = ruleCount(p, counts)
  const kinds = kindsOf(counts)
  const complete = total === p.total
  const ruled = followsRule(p, share)
  const quality: SolutionQuality =
    !complete || !ruled
      ? 'invalid'
      : kinds < 3
        ? 'functional'
        : preferenceMet(p, counts, kinds)
          ? 'optimal'
          : 'efficient'
  const what = p.rule.categories.map((id) => byId(id).singular).join(' o ')

  return ok(
    outcome(
      quality,
      {
        outcomeKey: `student-day-wheel.${quality}`,
        stamp: quality === 'invalid' ? 'Falta ajustar' : 'Rueda armada',
        facts: [
          {
            label: 'Posiciones',
            value: `${String(total)} de ${String(p.total)}`,
          },
          ...WHEEL_CATEGORIES.map((category) => ({
            label: category.label,
            value: `${String(counts[category.id])} de ${String(p.total)}`,
          })),
          ...(complete
            ? [{ label: 'Regla del curso', value: shareText(p, share) }]
            : []),
        ],
        ...(quality === 'invalid'
          ? {
              violatedConstraint: !complete
                ? `La rueda necesita exactamente ${String(p.total)} posiciones.`
                : wheelRuleText(p),
            }
          : {}),
        consequence: !complete
          ? `La rueda tiene ${String(p.total)} posiciones y tu reparto usa ${String(total)}: así no se puede girar parejo.`
          : !ruled
            ? `Con ${shareText(p, share)} no se cumple la regla del curso. Hay que mover posiciones antes de girar.`
            : quality === 'functional'
              ? `La rueda funciona, pero con ${String(kinds)} ${kinds === 1 ? 'tipo' : 'tipos'} de actividad cada giro se parece al anterior.`
              : quality === 'efficient'
                ? `Cumple la regla y tiene variedad; faltó ${preferenceText(p)}.`
                : `Cumple la regla, tiene variedad y ${preferenceText(p)}. En ${String(p.total)} giros, ${what} saldría unas ${String(share)} veces. Otros repartos también sirven.`,
      },
      {},
      [
        { flag: 'y1.student-day.outcome', value: quality },
        { flag: 'y1.student-day.kinds', value: kinds },
      ],
    ),
  )
}

export const wheelVariants = generatedSource({
  id: 'y1.student-day.rule-distributions',
  version: '1',
  schema: wheelSchema,
  size: WHEEL_SPACE,
  generate: generateWheel,
  gates: wheelGates,
})

function ruleDatum(p: WheelParams) {
  const comparator = {
    exactly: 'Exactamente',
    'at-least': 'Al menos',
    'at-most': 'Como máximo',
  }[p.rule.comparator]
  const value =
    p.rule.notation === 'percent'
      ? `${String((100 * p.rule.numerator) / p.rule.denominator)} %`
      : p.rule.notation === 'one-in'
        ? `1 de cada ${String(p.rule.denominator)}`
        : `${String(p.rule.numerator)}/${String(p.rule.denominator)}`
  return {
    label: `Regla · ${comparator.toLowerCase()}`,
    value,
    unit: p.rule.categories.map((id) => byId(id).of).join(' + '),
    constraint: true,
  }
}

const studentDayWheelDefinition = defineChallenge<WheelParams, WheelParams>({
  id: toChallengeId('y1.student-day-challenge-wheel'),
  family: toScenarioFamilyId('student-day'),
  placement: 'anchor',
  variants: authoredVariantIds(wheelVariants.authored),
  variantSource: wheelVariants,
  interaction: 'quantity-builder',
  stages: ['year-1'],
  categories: ['proportions-and-percentages', 'probability-and-uncertainty'],
  baseDifficulty: 2,
  cognitive: feasibilityConstruction,
  composition: {
    primaryReasoningFamily: 'DATA_UNCERTAINTY',
    interactionEngine: 'grid-select-classify',
    pacingClass: 'QUICK',
    chronology: 50,
  },
  scoring: {
    math: 'discrete-quality',
    team: 'none',
    aura: 'none',
    rationale:
      'Math mide el total exacto, la regla proporcional y los pedidos de variedad explícitos. No hay optimización, Equipo, Aura ni giro aleatorio puntuable.',
  },
  tools: ['calculator'],
  generate: ({ params }) => parameters(wheelSchema, params),
  verify: verifyWheel,
  narrate: (p) => ({
    title: 'La rueda del curso',
    setup:
      'El curso arma una rueda para decidir qué toca en cada vuelta del Día del Estudiante; cada posición tiene la misma posibilidad de salir.',
    goal: `Completá las ${String(p.total)} posiciones. ${wheelRuleText(p)} Pedido de calidad: al menos tres tipos de actividad y ${preferenceText(p)}.`,
  }),
  present: (p) => ({
    kind: 'quantity-builder',
    positions: p.total,
    data: [
      {
        label: 'Posiciones iguales',
        value: String(p.total),
        constraint: true,
      },
      ruleDatum(p),
    ],
    items: WHEEL_CATEGORIES.map((category) => ({
      id: category.id,
      label: category.label,
      code: category.code,
      detail: 'Cada posición, la misma posibilidad',
      maxQuantity: p.total,
    })),
    instructions:
      'Repartí las posiciones con los botones o escribiendo la cantidad. La rueda muestra lo que vas armando; no dice si cumple la regla.',
  }),
  evaluate: (p, answer: InteractionAnswer) =>
    answer.kind === 'quantity-builder'
      ? evaluateWheel(p, answer.lines)
      : err({
          kind: 'invalid-answer',
          detail: 'se esperaba una distribución de posiciones',
        }),
})

/** Con nota por calidad (10/8/6/4). Ver `src/content/grades.ts`. */
export const studentDayWheel = graded(studentDayWheelDefinition)
