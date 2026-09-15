/**
 * 2.º · La encuesta del Proyecto del Curso (`y2.course-project-survey`).
 *
 * El curso encuestó al nivel y ahora quiere publicar los resultados. La cuenta
 * que decide no es el porcentaje: es sobre cuánta gente se calcula. Una misma
 * cifra sostiene una afirmación sobre quienes respondieron y no sostiene la
 * misma afirmación sobre el nivel entero.
 *
 * Cada variante trae tres errores distintos esperándolo: el denominador que
 * cambia si se mira al nivel o a los que contestaron, la gente que no contestó
 * y una diferencia demasiado chica para afirmar que una opción le ganó a otra.
 *
 * Es self-contained: se entiende y se resuelve sin haber jugado el Proyecto del
 * Curso de 1.º. Si esa historia existe, cambia el texto, nunca la matemática.
 */
import { z } from 'zod'
import {
  authoredVariantIds,
  defineChallenge,
  err,
  ok,
  toChallengeId,
  toScenarioFamilyId,
  type ClassificationEntry,
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

/** What the course may say about a claim. Two labels, one decision. */
export const CLAIM_LABELS = [
  { id: 'publish', label: 'Se puede afirmar' },
  { id: 'hold', label: 'No se puede afirmar' },
] as const

const count = z.number().int().min(1).max(200)
export const surveySchema = z.discriminatedUnion('shape', [
  /** The headline is true among answers and false about the whole year. */
  z.strictObject({
    shape: z.literal('denominator'),
    population: count,
    answers: z.tuple([count, count, count]),
  }),
  /** So many people did not answer that the year's preference is unknown. */
  z.strictObject({
    shape: z.literal('missing-data'),
    population: count,
    answers: z.tuple([count, count, count]),
  }),
  /** The gap between the first two options is inside the margin. */
  z.strictObject({
    shape: z.literal('margin'),
    population: count,
    answers: z.tuple([count, count, count]),
  }),
])
export type SurveyParams = z.infer<typeof surveySchema>

export const SURVEY_OPTIONS = [
  { id: 'patio', label: 'arreglar el patio' },
  { id: 'biblioteca', label: 'renovar la biblioteca' },
  { id: 'musica', label: 'comprar equipo de música' },
] as const

const SHAPES = ['denominator', 'missing-data', 'margin'] as const
const POPULATIONS = [80, 96, 120, 150] as const
const SPLITS = [
  [24, 10, 6],
  [26, 12, 7],
  [30, 14, 8],
  [22, 18, 5],
  [28, 20, 9],
  [25, 23, 6],
] as const
const RADICES = [SHAPES.length, POPULATIONS.length, SPLITS.length, 2]
export const SURVEY_SPACE = spaceOf(RADICES)

const sum = (values: readonly number[]): number =>
  values.reduce((total, value) => total + value, 0)

/**
 * Constraint-first materialisation.
 *
 * Every shape keeps the leading option above half of the answers — that is the
 * headline the course wants to publish — and then bends one relation: the year
 * denominator, the people who never answered, or the gap with the runner-up.
 */
export function generateSurvey(index: number): SurveyParams {
  const axes = candidateAxes(index, RADICES, 19)
  const shape = at(SHAPES, digit(axes, 0))
  const population = at(POPULATIONS, digit(axes, 1))
  const split = at(SPLITS, digit(axes, 2))
  const nudge = digit(axes, 3)

  if (shape === 'margin') {
    // Second option within one or two answers of the first.
    const first = (split[0] ?? 20) + nudge
    const second = first - 1
    const third = split[2] ?? 5
    return surveySchema.parse({
      shape,
      population,
      answers: [first, second, third],
    })
  }
  if (shape === 'missing-data') {
    // Fewer than half the year answered, so nothing about the year is known.
    const scaled = split.map((value) => value + nudge)
    return surveySchema.parse({ shape, population, answers: scaled })
  }
  const scaled = split.map((value, position) =>
    position === 0 ? (split[0] ?? 20) + 2 + nudge : value,
  )
  return surveySchema.parse({ shape, population, answers: scaled })
}

/** A claim the course wants to publish, with the truth the data gives it. */
export interface SurveyClaim {
  readonly id: string
  readonly label: string
  readonly detail: string
  readonly supported: boolean
}

/**
 * The claims, derived from the numbers with integer arithmetic.
 *
 * Percentages are never rounded into a boolean: every comparison is written as
 * a product, so `24 de 40` beats half without a float ever appearing.
 */
export function surveyClaims(p: SurveyParams): readonly SurveyClaim[] {
  const answers = sum(p.answers)
  const [first = 0, second = 0] = p.answers
  const lead = SURVEY_OPTIONS[0]?.label ?? ''
  const runnerUp = SURVEY_OPTIONS[1]?.label ?? ''
  const least = SURVEY_OPTIONS[2]?.label ?? ''
  const silent = p.population - answers
  return [
    {
      id: 'among-answers',
      label: `Entre quienes contestaron, ${lead} fue lo más elegido.`,
      detail: `${String(first)} de ${String(answers)} respuestas`,
      supported: first > second && first >= (p.answers[2] ?? 0),
    },
    {
      id: 'half-of-answers',
      label: `Más de la mitad de quienes contestaron eligió ${lead}.`,
      detail: `${String(first)} de ${String(answers)} respuestas`,
      supported: first * 2 > answers,
    },
    {
      id: 'half-of-year',
      label: `Más de la mitad del nivel eligió ${lead}.`,
      detail: `${String(first)} de ${String(p.population)} del nivel`,
      supported: first * 2 > p.population,
    },
    {
      id: 'year-prefers',
      label: `El nivel entero prefiere ${lead}.`,
      detail: `${String(silent)} personas del nivel no contestaron`,
      supported: false,
    },
    {
      id: 'beats-runner-up',
      label: `${lead} le ganó a ${runnerUp} con claridad.`,
      detail: `${String(first)} contra ${String(second)} respuestas`,
      supported: (first - second) * 10 > answers,
    },
    {
      id: 'least-chosen',
      label: `${least} fue lo menos elegido entre quienes contestaron.`,
      detail: `${String(p.answers[2] ?? 0)} de ${String(answers)} respuestas`,
      supported: (p.answers[2] ?? 0) < first && (p.answers[2] ?? 0) < second,
    },
  ]
}

export interface SurveyPlan {
  readonly entries: readonly ClassificationEntry[]
  readonly quality: SolutionQuality
}

/**
 * Independent oracle over every way of labelling the claims.
 *
 * It recomputes each claim from the parameters with its own arithmetic and
 * never calls the evaluator: publishing something the data contradicts is the
 * failure, and missing a supported claim only costs precision.
 */
export function surveyPlans(p: SurveyParams): readonly SurveyPlan[] {
  const claims = surveyClaims(p)
  const plans: SurveyPlan[] = []
  const totalCombinations = 2 ** claims.length
  for (let mask = 0; mask < totalCombinations; mask++) {
    const entries = claims.map((claim, position) => ({
      statementId: claim.id,
      labelId: (mask >> position) % 2 === 1 ? 'publish' : 'hold',
    }))
    const published = claims.filter(
      (claim, position) => (mask >> position) % 2 === 1,
    )
    const falsePublished = published.filter((claim) => !claim.supported).length
    const missed = claims.filter(
      (claim, position) => claim.supported && (mask >> position) % 2 === 0,
    ).length
    plans.push({
      entries,
      quality:
        falsePublished > 0
          ? 'invalid'
          : missed === 0
            ? 'optimal'
            : missed === 1
              ? 'efficient'
              : 'functional',
    })
  }
  return plans
}

/** Authoring gates. A variant that fails any of them is never approved. */
export function surveyGates(p: SurveyParams): readonly string[] {
  const issues: string[] = []
  const answers = sum(p.answers)
  const claims = surveyClaims(p)
  const [first = 0, second = 0, third = 0] = p.answers

  if (answers >= p.population)
    issues.push('contestó más gente de la que hay en el nivel')
  if (first < second || first < third)
    issues.push('la opción que se quiere publicar no es la más elegida')
  // Una mayoría entre las respuestas es lo que hace interesante al denominador.
  // La forma `margin` es justamente la que no la tiene: ahí lo que se discute
  // es si una pluralidad ajustada alcanza para decir que una opción ganó.
  if (p.shape !== 'margin' && !(first * 2 > answers))
    issues.push('el titular ni siquiera pasa la mitad de las respuestas')

  const supported = claims.filter((claim) => claim.supported).length
  if (supported < 2)
    issues.push('hacen falta al menos dos afirmaciones ciertas')
  if (claims.length - supported < 2)
    issues.push(
      'hacen falta al menos dos afirmaciones que los datos no sostienen',
    )

  // Intrinsic Math Gate: the denominator has to change the answer, so the
  // headline holds among answers and fails about the whole year.
  const amongAnswers = claims.find((claim) => claim.id === 'half-of-answers')
  const amongYear = claims.find((claim) => claim.id === 'half-of-year')
  if (p.shape !== 'margin') {
    if (amongAnswers?.supported !== true || amongYear?.supported !== false)
      issues.push('el denominador no cambia la respuesta: no hay cuenta')
  } else if (amongAnswers?.supported === true) {
    issues.push('con margen ajustado el titular no puede ser mayoría')
  }

  if (p.shape === 'margin') {
    const close = claims.find((claim) => claim.id === 'beats-runner-up')
    if (close?.supported !== false)
      issues.push('la diferencia con la segunda no es chica')
    const leads = claims.find((claim) => claim.id === 'among-answers')
    if (leads?.supported !== true)
      issues.push('la opción del titular no encabeza las respuestas')
  }
  if (p.shape === 'missing-data' && answers * 2 >= p.population)
    issues.push('contestó la mitad del nivel: la no respuesta no pesa')

  issues.push(...tierWitnessIssues(surveyPlans(p)))
  return issues
}

function verifySurvey(p: SurveyParams): readonly string[] {
  return sum(p.answers) < p.population
    ? []
    : ['contestó más gente de la que hay en el nivel']
}

export function evaluateSurvey(
  p: SurveyParams,
  entries: readonly ClassificationEntry[],
) {
  const claims = surveyClaims(p)
  if (
    new Set(entries.map((entry) => entry.statementId)).size !== entries.length
  )
    return err({
      kind: 'invalid-answer' as const,
      detail: 'afirmación repetida',
    })
  for (const entry of entries) {
    if (!claims.some((claim) => claim.id === entry.statementId))
      return err({
        kind: 'invalid-answer' as const,
        detail: `afirmación desconocida: ${entry.statementId}`,
      })
    if (!CLAIM_LABELS.some((label) => label.id === entry.labelId))
      return err({
        kind: 'invalid-answer' as const,
        detail: `etiqueta desconocida: ${entry.labelId}`,
      })
  }
  if (entries.length !== claims.length)
    return err({
      kind: 'invalid-answer' as const,
      detail: 'faltan afirmaciones por clasificar',
    })

  const published = claims.filter((claim) =>
    entries.some(
      (entry) => entry.statementId === claim.id && entry.labelId === 'publish',
    ),
  )
  const falsePublished = published.filter((claim) => !claim.supported)
  const missed = claims.filter(
    (claim) =>
      claim.supported && !published.some((entry) => entry.id === claim.id),
  )
  const quality: SolutionQuality =
    falsePublished.length > 0
      ? 'invalid'
      : missed.length === 0
        ? 'optimal'
        : missed.length === 1
          ? 'efficient'
          : 'functional'

  const answers = sum(p.answers)
  return ok(
    outcome(
      quality,
      {
        outcomeKey: `course-project-survey.${p.shape}.${quality}`,
        stamp: quality === 'invalid' ? 'Dato forzado' : 'Informe listo',
        facts: [
          {
            label: 'Respondieron',
            value: `${String(answers)} de ${String(p.population)} del nivel`,
          },
          ...SURVEY_OPTIONS.map((option, position) => ({
            label: option.label,
            value: `${String(p.answers[position] ?? 0)} respuestas`,
          })),
          {
            label: 'Sin contestar',
            value: `${String(p.population - answers)} personas`,
          },
        ],
        ...(quality === 'invalid' && falsePublished[0] !== undefined
          ? {
              violatedConstraint: `Los datos no sostienen «${falsePublished[0].label}» (${falsePublished[0].detail}).`,
            }
          : {}),
        ...(quality === 'efficient' && missed[0] !== undefined
          ? {
              optimalComparison: `También se podía afirmar «${missed[0].label}».`,
            }
          : {}),
        consequence:
          quality === 'optimal'
            ? 'El informe dice exactamente lo que la encuesta sostiene, y nadie puede discutirlo con los mismos números.'
            : quality === 'invalid'
              ? 'Alguien del nivel va a mirar los números y el curso va a tener que salir a corregir el informe.'
              : 'El informe es honesto, aunque se guarda cosas que los datos sí permitían decir.',
      },
      {},
      [{ flag: 'y2.survey.outcome', value: quality }],
    ),
  )
}

export const surveyVariants = generatedSource({
  id: 'y2.course-project-survey.denominator-claims',
  version: '1',
  schema: surveySchema,
  size: SURVEY_SPACE,
  generate: generateSurvey,
  gates: surveyGates,
})

export const courseProjectSurvey = defineChallenge<SurveyParams, SurveyParams>({
  id: toChallengeId('y2.course-project-survey'),
  family: toScenarioFamilyId('course-project'),
  placement: 'anchor',
  variants: authoredVariantIds(surveyVariants.authored),
  variantSource: surveyVariants,
  interaction: 'classification',
  stages: ['year-2'],
  categories: ['proportions-and-percentages', 'probability-and-uncertainty'],
  baseDifficulty: 3,
  cognitive: {
    steps: 2,
    constraints: 2,
    selection: 1,
    optimization: 0,
    uncertainty: 1,
    construction: 0,
  },
  composition: {
    primaryReasoningFamily: 'DATA_UNCERTAINTY',
    interactionEngine: 'choice-compare',
    pacingClass: 'MEDIUM',
    chronology: 30,
    recurringArc: 'PROJECT',
  },
  scoring: {
    math: 'discrete-quality',
    team: 'none',
    aura: 'none',
    rationale:
      'Math mide qué afirmaciones sostienen los datos, con el denominador correcto y la gente que no contestó. No hay Equipo ni Aura: publicar un informe honesto es la cuenta, no una negociación ni una pose pública.',
  },
  tools: ['calculator'],
  generate: ({ params }) => parameters(surveySchema, params),
  verify: verifySurvey,
  narrate: (p) => ({
    title: 'Lo que dice la encuesta',
    setup: `El Proyecto del Curso encuestó al nivel sobre en qué gastar lo recaudado. Contestaron ${String(sum(p.answers))} de ${String(p.population)} personas.`,
    goal: 'Decidí qué puede publicar el curso y qué no, con estos números.',
  }),
  present: (p) => ({
    kind: 'classification',
    data: [
      { label: 'Nivel', value: String(p.population), unit: 'personas' },
      {
        label: 'Respondieron',
        value: String(sum(p.answers)),
        unit: 'personas',
        constraint: true,
      },
      ...SURVEY_OPTIONS.map((option, position) => ({
        label: option.label,
        value: String(p.answers[position] ?? 0),
        unit: 'respuestas',
      })),
    ],
    statements: surveyClaims(p).map((claim) => ({
      id: claim.id,
      label: claim.label,
      detail: claim.detail,
    })),
    labels: CLAIM_LABELS.map((label) => ({ id: label.id, label: label.label })),
    instructions:
      'Para cada afirmación, decidí si los números de la encuesta alcanzan para publicarla. Publicar algo que los datos no sostienen es peor que guardarse una afirmación cierta.',
  }),
  evaluate: (p, answer: InteractionAnswer) =>
    answer.kind === 'classification'
      ? evaluateSurvey(p, answer.entries)
      : err({
          kind: 'invalid-answer',
          detail: 'se esperaba una clasificación',
        }),
})

/**
 * Repaso · Sobre cuánta gente (`y2.data-claim-review`).
 *
 * Aísla el paso donde estuvo el error: elegir el denominador. No repite la
 * encuesta entera —no hay margen ni no-respuesta que pesar—, sólo la misma
 * cifra leída sobre quienes contestaron y sobre el nivel. Más corta que lo que
 * repara, como pide ADR-024, y fuera de FairScore por su rol.
 */
export const reviewSchema = z.strictObject({
  population: count,
  answered: count,
  chose: count,
})
export type ReviewParams = z.infer<typeof reviewSchema>

const REVIEW_RADICES = [4, 4, 3]
export const REVIEW_SPACE = spaceOf(REVIEW_RADICES)

export function generateReview(index: number): ReviewParams {
  const axes = candidateAxes(index, REVIEW_RADICES, 7)
  const population = at([60, 80, 100, 120] as const, digit(axes, 0))
  const answered = Math.round(
    (population * at([25, 30, 40, 50] as const, digit(axes, 1))) / 100,
  )
  // Above half of the answers and below half of the year: the whole point.
  const chose = Math.floor(answered / 2) + 1 + digit(axes, 2)
  return reviewSchema.parse({ population, answered, chose })
}

export function reviewClaims(p: ReviewParams): readonly SurveyClaim[] {
  return [
    {
      id: 'of-answers',
      label: 'Más de la mitad de quienes contestaron lo eligió.',
      detail: `${String(p.chose)} de ${String(p.answered)} respuestas`,
      supported: p.chose * 2 > p.answered,
    },
    {
      id: 'of-year',
      label: 'Más de la mitad del nivel lo eligió.',
      detail: `${String(p.chose)} de ${String(p.population)} del nivel`,
      supported: p.chose * 2 > p.population,
    },
    {
      id: 'unknown',
      label: 'Sabemos qué eligió quien no contestó.',
      detail: `${String(p.population - p.answered)} personas no contestaron`,
      supported: false,
    },
  ]
}

export function evaluateReview(
  p: ReviewParams,
  entries: readonly ClassificationEntry[],
) {
  const claims = reviewClaims(p)
  if (
    entries.length !== claims.length ||
    new Set(entries.map((entry) => entry.statementId)).size !==
      entries.length ||
    entries.some(
      (entry) =>
        !claims.some((claim) => claim.id === entry.statementId) ||
        !CLAIM_LABELS.some((label) => label.id === entry.labelId),
    )
  )
    return err({
      kind: 'invalid-answer' as const,
      detail: 'clasificación incompleta o fuera de contrato',
    })

  const wrong = claims.filter((claim) =>
    entries.some(
      (entry) =>
        entry.statementId === claim.id &&
        (entry.labelId === 'publish') !== claim.supported,
    ),
  )
  const published = claims.filter((claim) =>
    entries.some(
      (entry) => entry.statementId === claim.id && entry.labelId === 'publish',
    ),
  )
  const falsePublished = published.filter((claim) => !claim.supported)
  const quality: SolutionQuality =
    falsePublished.length > 0
      ? 'invalid'
      : wrong.length === 0
        ? 'optimal'
        : wrong.length === 1
          ? 'efficient'
          : 'functional'

  return ok(
    outcome(
      quality,
      {
        outcomeKey: `data-claim-review.${quality}`,
        stamp: quality === 'invalid' ? 'Dato forzado' : 'Repasado',
        facts: [
          {
            label: 'Contestaron',
            value: `${String(p.answered)} de ${String(p.population)}`,
          },
          { label: 'Lo eligieron', value: `${String(p.chose)} respuestas` },
          {
            label: 'Sobre las respuestas',
            value: `${String(p.chose)} de ${String(p.answered)}`,
          },
          {
            label: 'Sobre el nivel',
            value: `${String(p.chose)} de ${String(p.population)}`,
          },
        ],
        optimalComparison:
          'La misma cifra cambia de significado según sobre cuánta gente se calcule.',
        consequence:
          quality === 'optimal'
            ? 'Queda claro de dónde sale cada porcentaje.'
            : 'Conviene volver a mirar sobre cuánta gente se está calculando.',
      },
      {},
      [{ flag: 'y2.survey.review-outcome', value: quality }],
    ),
  )
}

export function reviewGates(p: ReviewParams): readonly string[] {
  const issues: string[] = []
  if (p.answered >= p.population) issues.push('contestaron más de los que hay')
  if (!(p.chose * 2 > p.answered))
    issues.push('la cifra no supera la mitad de las respuestas')
  if (p.chose * 2 > p.population)
    issues.push('la cifra también supera la mitad del nivel: no hay contraste')
  if (p.chose > p.answered) issues.push('eligieron más de los que contestaron')
  return issues
}

export const reviewVariants = generatedSource({
  id: 'y2.data-claim-review.denominator',
  version: '1',
  schema: reviewSchema,
  size: REVIEW_SPACE,
  generate: generateReview,
  gates: reviewGates,
})

export const dataClaimReview = defineChallenge<ReviewParams, ReviewParams>({
  id: toChallengeId('y2.data-claim-review'),
  family: toScenarioFamilyId('course-project'),
  placement: 'recovery',
  variants: authoredVariantIds(reviewVariants.authored),
  variantSource: reviewVariants,
  interaction: 'classification',
  stages: ['year-2'],
  categories: ['proportions-and-percentages'],
  baseDifficulty: 1,
  cognitive: {
    steps: 1,
    constraints: 1,
    selection: 1,
    optimization: 0,
    uncertainty: 0,
    construction: 0,
  },
  composition: {
    primaryReasoningFamily: 'DATA_UNCERTAINTY',
    interactionEngine: 'choice-compare',
    pacingClass: 'QUICK',
  },
  scoring: {
    math: 'discrete-quality',
    team: 'none',
    aura: 'none',
    rationale:
      'Repaso: aísla el denominador y queda fuera de FairScore por su rol de recuperación.',
  },
  tools: ['calculator'],
  generate: ({ params }) => parameters(reviewSchema, params),
  verify: (p) =>
    p.chose <= p.answered ? [] : ['eligieron más de los que contestaron'],
  narrate: (p) => ({
    title: 'Sobre cuánta gente',
    setup: `De ${String(p.population)} personas del nivel contestaron ${String(p.answered)}, y ${String(p.chose)} eligieron la misma opción.`,
    goal: 'Decidí qué se puede afirmar con esa cifra.',
  }),
  present: (p) => ({
    kind: 'classification',
    data: [
      { label: 'Nivel', value: String(p.population), unit: 'personas' },
      {
        label: 'Contestaron',
        value: String(p.answered),
        unit: 'personas',
        constraint: true,
      },
      {
        label: 'Eligieron esa opción',
        value: String(p.chose),
        unit: 'respuestas',
      },
    ],
    statements: reviewClaims(p).map((claim) => ({
      id: claim.id,
      label: claim.label,
      detail: claim.detail,
    })),
    labels: CLAIM_LABELS.map((label) => ({ id: label.id, label: label.label })),
    instructions:
      'La misma cifra puede sostener una afirmación y no sostener otra. Mirá sobre cuánta gente se calcula cada una.',
  }),
  evaluate: (p, answer: InteractionAnswer) =>
    answer.kind === 'classification'
      ? evaluateReview(p, answer.entries)
      : err({
          kind: 'invalid-answer',
          detail: 'se esperaba una clasificación',
        }),
})
