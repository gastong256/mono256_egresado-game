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
import { projectArcCallback } from '../../career-facts'

/** What the course may say about a claim. Two labels, one decision. */
export const CLAIM_LABELS = [
  { id: 'publish', label: 'Se puede afirmar' },
  { id: 'hold', label: 'No se puede afirmar' },
] as const

const count = z.number().int().min(1).max(200)
const counts = {
  population: count,
  answers: z.tuple([count, count, count]),
}
export const surveySchema = z.discriminatedUnion('shape', [
  /** The headline is a majority among answers and not about the whole year. */
  z.strictObject({ shape: z.literal('denominator'), ...counts }),
  /** Fewer than half the year answered, so nothing about the year is known. */
  z.strictObject({ shape: z.literal('missing-data'), ...counts }),
  /** The lead over the other option does not meet the publication rule. */
  z.strictObject({ shape: z.literal('margin'), ...counts }),
  /** Almost the whole year answered: the lead survives any silent vote. */
  z.strictObject({ shape: z.literal('high-response'), ...counts }),
])
export type SurveyShape =
  'denominator' | 'missing-data' | 'margin' | 'high-response'
export type SurveyParams = z.infer<typeof surveySchema>

export const SURVEY_OPTIONS = [
  { id: 'patio', label: 'arreglar el patio' },
  { id: 'biblioteca', label: 'renovar la biblioteca' },
  { id: 'musica', label: 'comprar equipo de música' },
] as const

/**
 * La regla de publicación del curso, única fuente del criterio.
 *
 * Una opción «le ganó» a otra sólo si le saca **más de una de cada diez**
 * respuestas. El evaluador, los witnesses y el texto de la pantalla leen esta
 * constante: antes el criterio vivía sólo en el evaluador y el jugador tenía que
 * adivinar qué contaba como «con claridad» (MAT-003).
 */
export const PUBLICATION_RULE = { oneIn: 10 } as const

/** Si una diferencia cumple la regla, con enteros: `diferencia × 10 > respuestas`. */
export function meetsPublicationRule(difference: number, answers: number) {
  return difference * PUBLICATION_RULE.oneIn > answers
}

/** La regla, en palabras y números, como la lee el jugador. */
export const PUBLICATION_RULE_TEXT = `Regla del curso: una opción le ganó a otra sólo si le saca más de 1 de cada ${String(PUBLICATION_RULE.oneIn)} respuestas.`

/** El principio de no respuesta, en palabras. */
export const WHOLE_YEAR_RULE_TEXT =
  'Sobre el nivel entero sólo vale lo que seguiría siendo cierto aunque todos los que no contestaron hubieran elegido una misma opción distinta.'

const sum = (values: readonly number[]): number =>
  values.reduce((total, value) => total + value, 0)

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
  const [first = 0, second = 0, third = 0] = p.answers
  const lead = SURVEY_OPTIONS[0]?.label ?? ''
  const other = SURVEY_OPTIONS[1]?.label ?? ''
  const least = SURVEY_OPTIONS[2]?.label ?? ''
  const silent = p.population - answers
  return [
    {
      id: 'among-answers',
      label: `Entre quienes contestaron, ${lead} fue lo más elegido.`,
      detail: `${String(first)} de ${String(answers)} respuestas`,
      supported: first > second && first > third,
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
      // Cota de peor caso: aunque toda la gente que no contestó hubiera elegido
      // la misma otra opción, la primera sigue arriba (MAT-004).
      id: 'year-prefers',
      label: `El nivel entero prefiere ${lead}.`,
      detail: `${String(first)} contra ${String(Math.max(second, third))} de la segunda, y ${String(silent)} personas del nivel no contestaron`,
      supported: first - Math.max(second, third) > silent,
    },
    {
      id: 'beats-runner-up',
      label: `Entre quienes contestaron, ${lead} le ganó a ${other} según la regla del curso.`,
      detail: `${String(first)} contra ${String(second)} de ${String(answers)} respuestas`,
      supported: meetsPublicationRule(first - second, answers),
    },
    {
      id: 'least-chosen',
      label: `${least} fue lo menos elegido entre quienes contestaron.`,
      detail: `${String(third)} de ${String(answers)} respuestas`,
      supported: third < first && third < second,
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

/** El vector de verdad de las seis afirmaciones, como `TTFFTT`. */
export function surveyKey(p: SurveyParams): string {
  return surveyClaims(p)
    .map((claim) => (claim.supported ? 'T' : 'F'))
    .join('')
}

/**
 * Papeles del catálogo: forma semántica y vector de verdad que le toca a cada
 * dirección, en un ciclo de diez.
 *
 * Con dos claves en todo el catálogo, la encuesta se contestaba reconociendo la
 * forma (MAT-004). El ciclo reparte ocho claves, ninguna en más de tres de cada
 * diez direcciones, cada forma con al menos dos, y deja el contraste del
 * denominador —mayoría entre respuestas, no del nivel— en seis de cada diez.
 */
export const SURVEY_ROLES: readonly {
  readonly shape: SurveyShape
  readonly key: string
}[] = [
  { shape: 'denominator', key: 'TTFFTT' },
  { shape: 'high-response', key: 'TFFTTT' },
  { shape: 'missing-data', key: 'TTFFTF' },
  { shape: 'margin', key: 'TFFFFT' },
  { shape: 'denominator', key: 'TTFFTF' },
  { shape: 'missing-data', key: 'TFFFTF' },
  { shape: 'margin', key: 'TTFFFT' },
  { shape: 'high-response', key: 'TFFTTF' },
  { shape: 'missing-data', key: 'TTFFTT' },
  { shape: 'denominator', key: 'TTFFTF' },
]

export function surveyRoleOf(index: number) {
  return SURVEY_ROLES[Math.abs(index) % SURVEY_ROLES.length] ?? SURVEY_ROLES[0]!
}

const POPULATIONS = [80, 96, 120, 150] as const
/** Qué parte del nivel contestó, en por ciento. */
const RESPONSE_RATES = [35, 40, 45, 55, 60, 70, 88, 92, 96] as const
/** Qué parte de las respuestas se lleva la primera opción, en por ciento. */
const LEAD_SHARES = [36, 40, 44, 48, 52, 56, 60, 64] as const
/** Cuántas respuestas le saca la primera a la biblioteca. */
const GAPS = [1, 2, 3, 4, 5, 6, 8, 10, 12, 15, 18, 22] as const
/** Si la biblioteca queda segunda o tercera entre las otras dos. */
const ORDERS = [0, 1] as const
const RADICES = [
  POPULATIONS.length,
  RESPONSE_RATES.length,
  LEAD_SHARES.length,
  GAPS.length,
  ORDERS.length,
]
export const SURVEY_SPACE = spaceOf(RADICES)

function surveyAt(index: number, shape: SurveyShape): SurveyParams | undefined {
  const axes = candidateAxes(index, RADICES, 19)
  const population = at(POPULATIONS, digit(axes, 0))
  const answers = Math.round(
    (population * at(RESPONSE_RATES, digit(axes, 1))) / 100,
  )
  const first = Math.round((answers * at(LEAD_SHARES, digit(axes, 2))) / 100)
  const runnerUp = first - at(GAPS, digit(axes, 3))
  const rest = answers - first - runnerUp
  if (runnerUp < 1 || rest < 1) return undefined
  // La biblioteca es la opción con la que se compara la regla; la música, la de
  // «lo menos elegido». Cuál de las dos quedó segunda también varía.
  const [second, third] =
    digit(axes, 4) === 0 ? [runnerUp, rest] : [rest, runnerUp]
  return { shape, population, answers: [first, second, third] }
}

/** Direcciones del espacio que se miran para encontrar el papel pedido. */
const ROLE_SEARCH = 400

/**
 * Generación por papel: la primera encuesta, en un recorrido determinista del
 * espacio, con la forma y el vector de verdad de su dirección y que pasa todos
 * los gates. Si no aparece, la última probada, que el gate de papel rechaza.
 */
export function generateSurvey(index: number): SurveyParams {
  const role = surveyRoleOf(index)
  let last: SurveyParams = {
    shape: role.shape,
    population: 80,
    answers: [30, 20, 10],
  }
  for (let attempt = 0; attempt < ROLE_SEARCH; attempt++) {
    const candidate = surveyAt(
      (index * 53 + attempt * 97) % SURVEY_SPACE,
      role.shape,
    )
    if (candidate === undefined) continue
    last = candidate
    if (
      surveyKey(candidate) === role.key &&
      surveyGates(candidate).length === 0
    )
      return surveySchema.parse(candidate)
  }
  return surveySchema.parse(last)
}

/** Gate de dirección: la encuesta tiene la forma y la clave de su papel. */
export function surveyRoleGates(
  p: SurveyParams,
  index: number,
): readonly string[] {
  const role = surveyRoleOf(index)
  return p.shape === role.shape && surveyKey(p) === role.key
    ? []
    : ['la encuesta no juega el papel de su dirección']
}

/** Authoring gates. A variant that fails any of them is never approved. */
export function surveyGates(p: SurveyParams): readonly string[] {
  const issues: string[] = []
  const answers = sum(p.answers)
  const claims = surveyClaims(p)
  const truth = (id: string) =>
    claims.find((claim) => claim.id === id)?.supported === true
  const [first = 0, second = 0, third = 0] = p.answers
  const silent = p.population - answers

  if (answers >= p.population)
    issues.push('contestó más gente de la que hay en el nivel')
  // La opción que el curso quiere publicar es la más elegida, siempre.
  if (!(first > second && first > third))
    issues.push('la opción que se quiere publicar no es la más elegida')
  if (second === third) issues.push('las otras dos opciones empatan')

  const supported = claims.filter((claim) => claim.supported).length
  if (supported < 2)
    issues.push('hacen falta al menos dos afirmaciones ciertas')
  if (claims.length - supported < 2)
    issues.push(
      'hacen falta al menos dos afirmaciones que los datos no sostienen',
    )

  // Ningún borde exacto: ni la mitad justa, ni la cota del nivel justa, ni una
  // diferencia a una respuesta de cambiar la regla del curso.
  if (first * 2 === answers || first * 2 === p.population)
    issues.push('la cifra cae justo en la mitad')
  if (first - Math.max(second, third) === silent)
    issues.push('la diferencia iguala a la gente que no contestó')
  const difference = first - second
  if (
    meetsPublicationRule(difference, answers) !==
      meetsPublicationRule(difference - 1, answers) ||
    meetsPublicationRule(difference, answers) !==
      meetsPublicationRule(difference + 1, answers)
  )
    issues.push('la diferencia está a una respuesta del borde de la regla')

  // Cada forma semántica tiene su firma.
  switch (p.shape) {
    case 'denominator':
      if (answers * 2 < p.population)
        issues.push('la forma denominador pide que conteste al menos la mitad')
      if (!truth('half-of-answers') || truth('half-of-year'))
        issues.push('el denominador no cambia la respuesta: no hay cuenta')
      if (!truth('beats-runner-up'))
        issues.push('la forma denominador no discute el margen')
      break
    case 'missing-data':
      if (answers * 2 >= p.population)
        issues.push('contestó la mitad del nivel: la no respuesta no pesa')
      if (!truth('beats-runner-up'))
        issues.push('la forma de no respuesta no discute el margen')
      break
    case 'margin':
      if (truth('beats-runner-up'))
        issues.push('la diferencia con la biblioteca cumple la regla')
      break
    case 'high-response':
      if (answers * 100 < p.population * 85)
        issues.push('con respuesta alta contesta al menos el 85 % del nivel')
      if (!truth('year-prefers'))
        issues.push('con respuesta alta la ventaja sobrevive a la no respuesta')
      break
  }
  // La no respuesta tiene que poder decidir algo sobre el nivel.
  if (truth('year-prefers') && p.shape !== 'high-response')
    issues.push('sólo la respuesta alta sostiene una afirmación sobre el nivel')

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
        stamp: quality === 'invalid' ? 'Forzado' : 'Informe',
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
  version: '2',
  schema: surveySchema,
  size: SURVEY_SPACE,
  generate: generateSurvey,
  gates: surveyGates,
  addressGates: surveyRoleGates,
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
  narrate: (p, context) => ({
    title: 'Lo que dice la encuesta',
    setup: `${projectArcCallback(context.flags)}El Proyecto del Curso encuestó al nivel sobre en qué gastar lo recaudado. Contestaron ${String(sum(p.answers))} de ${String(p.population)} personas.`,
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
    instructions: `Para cada afirmación, decidí si los números de la encuesta alcanzan para publicarla. ${PUBLICATION_RULE_TEXT} ${WHOLE_YEAR_RULE_TEXT} Publicar algo que los datos no sostienen es peor que guardarse una afirmación cierta.`,
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

const REVIEW_POPULATIONS = [60, 80, 100, 120] as const
/** Qué parte del nivel contestó, en por ciento. */
const REVIEW_RATES = [25, 30, 40, 50, 60, 70, 80, 90] as const
/** Qué parte de las respuestas eligió la opción, en por ciento. */
const REVIEW_SHARES = [30, 36, 42, 46, 54, 58, 64, 70, 80, 90] as const
const REVIEW_RADICES = [
  REVIEW_POPULATIONS.length,
  REVIEW_RATES.length,
  REVIEW_SHARES.length,
]
export const REVIEW_SPACE = spaceOf(REVIEW_RADICES)

/**
 * El papel de cada dirección: qué dicen las dos cuentas del denominador.
 *
 * Con una sola respuesta correcta en todo el catálogo, el Repaso se cerraba
 * recordando el patrón «sí, no, no» (MAT-002). El ciclo reparte los tres casos
 * posibles —`TF` la cifra supera la mitad de las respuestas y no la del nivel,
 * `TT` supera las dos, `FF` no supera ninguna— y deja al contraste `TF`, que es
 * el error que el Repaso vino a reparar, en la mitad.
 */
export const REVIEW_ROLES = ['TF', 'TT', 'TF', 'FF'] as const

export function reviewRoleOf(index: number): (typeof REVIEW_ROLES)[number] {
  return REVIEW_ROLES[Math.abs(index) % REVIEW_ROLES.length] ?? 'TF'
}

function reviewAt(index: number): ReviewParams {
  const axes = candidateAxes(index, REVIEW_RADICES, 7)
  const population = at(REVIEW_POPULATIONS, digit(axes, 0))
  const answered = Math.round(
    (population * at(REVIEW_RATES, digit(axes, 1))) / 100,
  )
  const chose = Math.max(
    1,
    Math.round((answered * at(REVIEW_SHARES, digit(axes, 2))) / 100),
  )
  return reviewSchema.parse({ population, answered, chose })
}

/** Las dos cuentas del denominador, como `TF`. */
export function reviewKey(p: ReviewParams): string {
  return reviewClaims(p)
    .slice(0, 2)
    .map((claim) => (claim.supported ? 'T' : 'F'))
    .join('')
}

/**
 * Generación por papel, igual que la encuesta: el primer Repaso del recorrido
 * determinista con las dos cuentas de su dirección y que pasa los gates.
 */
export function generateReview(index: number): ReviewParams {
  const role = reviewRoleOf(index)
  let last = reviewAt(index)
  for (let attempt = 0; attempt < REVIEW_SPACE; attempt++) {
    const candidate = reviewAt((index * 11 + attempt * 13) % REVIEW_SPACE)
    last = candidate
    if (reviewKey(candidate) === role && reviewGates(candidate).length === 0)
      return candidate
  }
  return last
}

/** Gate de dirección: el Repaso tiene las dos cuentas de su papel. */
export function reviewRoleGates(
  p: ReviewParams,
  index: number,
): readonly string[] {
  return reviewKey(p) === reviewRoleOf(index)
    ? []
    : ['el Repaso no juega el papel de su dirección']
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
        stamp: quality === 'invalid' ? 'Forzado' : 'Repasado',
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
  if (p.chose > p.answered) issues.push('eligieron más de los que contestaron')
  // Ningún borde exacto: «más de la mitad» no se decide en la mitad justa.
  if (p.chose * 2 === p.answered || p.chose * 2 === p.population)
    issues.push('la cifra cae justo en la mitad')
  return issues
}

export const reviewVariants = generatedSource({
  id: 'y2.data-claim-review.denominator',
  version: '2',
  schema: reviewSchema,
  size: REVIEW_SPACE,
  generate: generateReview,
  gates: reviewGates,
  addressGates: reviewRoleGates,
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
