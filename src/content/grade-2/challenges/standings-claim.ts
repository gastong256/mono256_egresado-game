/**
 * 2.º · La tabla del Intercurso (`y2.standings-claim`).
 *
 * Con los puntos de hoy y los partidos que faltan, algunas cosas ya están
 * decididas, otras dependen de cómo salga todo y otras no pueden pasar. El
 * jugador separa esas tres categorías, que es una cuenta: máximo alcanzable
 * contra mínimo asegurado, con enteros.
 *
 * Y después está la otra decisión, que no es la misma: qué publica el curso.
 * Acertar la tabla no da Aura —eso sería cobrar dos veces la misma cuenta—; la
 * Aura sale de si la postura pública se sostiene con lo que la tabla permite
 * afirmar. Un curso puede leer bien la tabla y salir a cantar un campeonato que
 * todavía no tiene, o leerla mal y publicar algo prudente.
 *
 * Por eso las dos acciones viajan en campos distintos de la respuesta y se
 * miden con canales distintos: `quality` para la clasificación, `risk` para la
 * exposición de la postura.
 */
import { z } from 'zod'
import {
  authoredVariantIds,
  defineChallenge,
  err,
  metrics,
  ok,
  performanceFromRatio,
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
import { graded } from '../../grades'

export const STANDING_LABELS = [
  { id: 'seguro', label: 'Ya está asegurado' },
  { id: 'posible', label: 'Puede pasar' },
  { id: 'imposible', label: 'Ya no puede pasar' },
] as const

/** What the course publishes. A separate decision from reading the table. */
export const STANCES = [
  { id: 'campeones', label: 'Publicar que el Intercurso ya es nuestro' },
  { id: 'tabla', label: 'Publicar la tabla y lo que falta jugar' },
  { id: 'silencio', label: 'No publicar nada hasta que termine' },
] as const

export const CLAIM_TEAMS = [
  { id: 'a', label: '2.º A' },
  { id: 'b', label: '2.º B' },
  { id: 'c', label: '2.º C' },
  { id: 'd', label: '2.º D' },
] as const

const points = z.number().int().min(0).max(60)
export const standingsSchema = z.discriminatedUnion('shape', [
  /** The leader cannot be caught any more. */
  z.strictObject({
    shape: z.literal('settled'),
    points: z.tuple([points, points, points, points]),
    remaining: z.tuple([points, points, points, points]),
    perWin: z.number().int().min(2).max(3),
  }),
  /** Nobody is safe and several teams can still reach the top. */
  z.strictObject({
    shape: z.literal('open'),
    points: z.tuple([points, points, points, points]),
    remaining: z.tuple([points, points, points, points]),
    perWin: z.number().int().min(2).max(3),
  }),
  /** At least one team can no longer reach the top. */
  z.strictObject({
    shape: z.literal('eliminated'),
    points: z.tuple([points, points, points, points]),
    remaining: z.tuple([points, points, points, points]),
    perWin: z.number().int().min(2).max(3),
  }),
])
export type StandingsParams = z.infer<typeof standingsSchema>

/** Most and least each team can finish with, in integer points. */
export function bounds(p: StandingsParams) {
  return CLAIM_TEAMS.map((_, index) => {
    const base = p.points[index] ?? 0
    const left = p.remaining[index] ?? 0
    return { min: base, max: base + left * p.perWin }
  })
}

export type Truth = 'seguro' | 'posible' | 'imposible'

/** Las cuatro afirmaciones: quién termina primero y quién termina arriba de quién. */
export const CLAIM_SHAPES = [
  { id: 'a-first', kind: 'first', team: 0 },
  { id: 'd-first', kind: 'first', team: 3 },
  { id: 'b-over-c', kind: 'above', team: 1, other: 2 },
  { id: 'c-over-a', kind: 'above', team: 2, other: 0 },
] as const

/**
 * Categoría de cada afirmación por cotas de cada curso, con «terminar arriba»
 * **estricto**: empatar no es terminar arriba (MAT-AJ-NEW-005).
 *
 * - seguro: el mínimo propio supera el máximo del otro;
 * - imposible: el máximo propio no supera el mínimo del otro;
 * - posible: el resto.
 *
 * `tiesCountAsAbove` lee el empate al revés; sólo lo usa el gate que rechaza las
 * tablas donde esa lectura cambiaría alguna categoría.
 */
export function independentTruths(
  p: StandingsParams,
  tiesCountAsAbove = false,
): readonly Truth[] {
  const limits = bounds(p)
  const beats = (a: number, b: number) => (tiesCountAsAbove ? a >= b : a > b)
  const above = (left: number, right: number): Truth => {
    const one = limits[left]
    const other = limits[right]
    if (one === undefined || other === undefined) return 'imposible'
    if (beats(one.min, other.max)) return 'seguro'
    if (!beats(one.max, other.min)) return 'imposible'
    return 'posible'
  }
  const first = (team: number): Truth => {
    const own = limits[team]
    if (own === undefined) return 'imposible'
    const others = limits.filter((_, position) => position !== team)
    if (others.every((other) => beats(own.min, other.max))) return 'seguro'
    if (others.some((other) => !beats(own.max, other.min))) return 'imposible'
    return 'posible'
  }
  return CLAIM_SHAPES.map((claim) =>
    claim.kind === 'first' ? first(claim.team) : above(claim.team, claim.other),
  )
}

/** Los partidos posibles entre los cuatro cursos, como pares de posiciones. */
const PAIRS = [
  [0, 1],
  [0, 2],
  [0, 3],
  [1, 2],
  [1, 3],
  [2, 3],
] as const

/**
 * Todos los fixtures entre los cuatro cursos compatibles con los partidos que
 * le faltan a cada uno: cuántas veces se enfrenta cada par.
 */
export function fixturesOf(remaining: readonly number[]): readonly number[][] {
  const fixtures: number[][] = []
  const counts = PAIRS.map(() => 0)
  const visit = (pair: number, left: readonly number[]) => {
    if (pair === PAIRS.length) {
      if (left.every((value) => value === 0)) fixtures.push([...counts])
      return
    }
    const [a, b] = PAIRS[pair] ?? [0, 0]
    const most = Math.min(left[a] ?? 0, left[b] ?? 0)
    for (let times = 0; times <= most; times++) {
      counts[pair] = times
      const next = [...left]
      next[a] = (next[a] ?? 0) - times
      next[b] = (next[b] ?? 0) - times
      visit(pair + 1, next)
    }
    counts[pair] = 0
  }
  visit(0, remaining)
  return fixtures
}

/**
 * Categoría de cada afirmación bajo un fixture concreto, enumerando todo
 * resultado: cada partido lo gana uno de los dos y suma `perWin`.
 */
export function jointTruths(
  p: StandingsParams,
  fixture: readonly number[],
): readonly Truth[] {
  const games = fixture.flatMap((times, pair) =>
    Array.from({ length: times }, () => PAIRS[pair] ?? ([0, 0] as const)),
  )
  const finals: number[][] = []
  for (let mask = 0; mask < 2 ** games.length; mask++) {
    const points: number[] = [...p.points]
    games.forEach(([a, b], game) => {
      const winner = (mask >> game) % 2 === 1 ? a : b
      points[winner] = (points[winner] ?? 0) + p.perWin
    })
    finals.push(points)
  }
  const truthOf = (holds: (points: readonly number[]) => boolean): Truth =>
    finals.every(holds)
      ? 'seguro'
      : finals.some(holds)
        ? 'posible'
        : 'imposible'
  return CLAIM_SHAPES.map((claim) =>
    claim.kind === 'first'
      ? truthOf((points) =>
          points.every(
            (value, position) =>
              position === claim.team || (points[claim.team] ?? 0) > value,
          ),
        )
      : truthOf(
          (points) => (points[claim.team] ?? 0) > (points[claim.other] ?? 0),
        ),
  )
}

const SHAPES = ['settled', 'open', 'eliminated'] as const
const POINTS = [3, 5, 6, 8, 9, 11, 12, 14] as const
const REMAINING = [0, 1, 2, 3] as const
const PER_WIN = [2, 3] as const
const RADICES = [
  POINTS.length,
  POINTS.length,
  POINTS.length,
  POINTS.length,
  REMAINING.length,
  REMAINING.length,
  REMAINING.length,
  REMAINING.length,
  PER_WIN.length,
]
export const STANDINGS_SPACE = spaceOf(RADICES)

/** Tope de partidos pendientes en toda la tabla: la enumeración es chica. */
const MAX_GAMES = 5

function tableAt(index: number): StandingsParams | undefined {
  const axes = candidateAxes(index, RADICES, 1009)
  const points = [0, 1, 2, 3].map((team) => at(POINTS, digit(axes, team)))
  const remaining: number[] = [0, 1, 2, 3].map((team) =>
    at(REMAINING, digit(axes, 4 + team)),
  )
  const total = remaining.reduce((sum, value) => sum + value, 0)
  if (total === 0 || total % 2 === 1 || total / 2 > MAX_GAMES) return undefined
  const perWin = at(PER_WIN, digit(axes, 8))
  const truths = independentTruths({
    shape: 'open',
    points: points as [number, number, number, number],
    remaining: remaining as [number, number, number, number],
    perWin,
  })
  // Las formas: alguien ya ganó; ninguno ganó y alguno ya no puede terminar
  // primero; o los dos que se nombran para el primer puesto siguen en carrera.
  const shape = truths.includes('seguro')
    ? 'settled'
    : truths[0] === 'imposible' || truths[1] === 'imposible'
      ? 'eliminated'
      : 'open'
  const parsed = standingsSchema.safeParse({
    shape,
    points,
    remaining,
    perWin,
  })
  return parsed.success ? parsed.data : undefined
}

/**
 * Papeles del catálogo: la forma que le toca a cada dirección, rotando. Sin
 * rotación, las primeras aprobaciones de un barrido quedan en la forma que el
 * espacio produce más seguido.
 */
export function standingsRoleOf(index: number): (typeof SHAPES)[number] {
  return at(SHAPES, Math.abs(index) % SHAPES.length)
}

/** Direcciones del espacio que se miran para encontrar el papel pedido. */
const ROLE_SEARCH = 800

/**
 * Generación por papel: la primera tabla, en un recorrido determinista del
 * espacio, con la forma de su dirección y que pasa todos los gates.
 */
export function generateStandings(index: number): StandingsParams {
  const role = standingsRoleOf(index)
  let last: StandingsParams = {
    shape: role,
    points: [12, 9, 7, 4],
    remaining: [1, 1, 1, 1],
    perWin: 2,
  }
  for (let attempt = 0; attempt < ROLE_SEARCH; attempt++) {
    const candidate = tableAt((index * 61 + attempt * 7919) % STANDINGS_SPACE)
    if (candidate === undefined) continue
    last = candidate
    if (candidate.shape === role && standingsGates(candidate).length === 0)
      return candidate
  }
  return last
}

/** Gate de dirección: la tabla tiene la forma de su papel. */
export function standingsRoleGates(
  p: StandingsParams,
  index: number,
): readonly string[] {
  return p.shape === standingsRoleOf(index)
    ? []
    : ['la tabla no juega el papel de su dirección']
}

export interface StandingClaim {
  readonly id: string
  readonly label: string
  readonly detail: string
  readonly truth: Truth
}

/**
 * The claims, resolved with integer bounds and strict «above».
 *
 * A team is champion for sure when its floor beats everyone's ceiling, and it
 * is out when its ceiling cannot beat someone's floor. Everything else is still
 * possible, which is the category players collapse first. The authoring gates
 * guarantee that reasoning about the tournament among the four courses gives the
 * same categories.
 */
export function standingClaims(p: StandingsParams): readonly StandingClaim[] {
  const truths = independentTruths(p)
  const detailOf = (index: number) =>
    `${String(p.points[index] ?? 0)} puntos y le quedan ${String(p.remaining[index] ?? 0)} partidos`

  // Mixed claims on purpose: if every statement asked about first place, a
  // settled table would turn the other three into «imposible» at once and
  // there would be nothing left to decide.
  return [
    {
      id: 'a-first',
      label: `${CLAIM_TEAMS[0].label} termina primero.`,
      detail: detailOf(0),
      truth: truths[0] ?? 'imposible',
    },
    {
      id: 'd-first',
      label: `${CLAIM_TEAMS[3].label} termina primero.`,
      detail: detailOf(3),
      truth: truths[1] ?? 'imposible',
    },
    {
      id: 'b-over-c',
      label: `${CLAIM_TEAMS[1].label} termina arriba de ${CLAIM_TEAMS[2].label}.`,
      detail: `${detailOf(1)} · ${detailOf(2)}`,
      truth: truths[2] ?? 'imposible',
    },
    {
      id: 'c-over-a',
      label: `${CLAIM_TEAMS[2].label} termina arriba de ${CLAIM_TEAMS[0].label}.`,
      detail: `${detailOf(2)} · ${detailOf(0)}`,
      truth: truths[3] ?? 'imposible',
    },
  ]
}

/** How exposed a public stance is, given what the table actually allows. */
export function stanceRisk(p: StandingsParams, stance: string): number {
  const champion = standingClaims(p).some((claim) => claim.truth === 'seguro')
  // Toda tabla tiene una postura que no expone al curso: cantar el campeonato
  // cuando está asegurado, y publicar la tabla cuando no. Si ninguna llegara a
  // cero, la variante tendría un techo de Aura inalcanzable y dos carreras
  // competirían con máximos distintos.
  if (stance === 'campeones') return champion ? 0 : 1
  if (stance === 'tabla') return champion ? 0.2 : 0
  return 0.5
}

export interface StandingsPlan {
  readonly entries: readonly ClassificationEntry[]
  readonly stance: string
  readonly quality: SolutionQuality
  readonly risk: number
}

/**
 * Independent oracle over classifications and stances.
 *
 * It recomputes the bounds itself and never calls the evaluator. Classification
 * and stance are enumerated together precisely so a drift that leaked one into
 * the other would show up here as a disagreement.
 */
export function standingsPlans(p: StandingsParams): readonly StandingsPlan[] {
  const claims = standingClaims(p)
  const plans: StandingsPlan[] = []
  const labels = STANDING_LABELS.map((label) => label.id)
  const combinations = labels.length ** claims.length
  for (let mask = 0; mask < combinations; mask++) {
    let rest = mask
    const entries = claims.map((claim) => {
      const labelId = labels[rest % labels.length] ?? 'posible'
      rest = Math.floor(rest / labels.length)
      return { statementId: claim.id, labelId }
    })
    const wrongCertainty = claims.filter(
      (claim, position) =>
        entries[position]?.labelId === 'seguro' && claim.truth !== 'seguro',
    ).length
    const wrong = claims.filter(
      (claim, position) => entries[position]?.labelId !== claim.truth,
    ).length
    const quality: SolutionQuality =
      wrongCertainty > 0
        ? 'invalid'
        : wrong === 0
          ? 'optimal'
          : wrong === 1
            ? 'efficient'
            : 'functional'
    for (const stance of STANCES)
      plans.push({
        entries,
        stance: stance.id,
        quality,
        risk: stanceRisk(p, stance.id),
      })
  }
  return plans
}

export function standingsGates(p: StandingsParams): readonly string[] {
  const issues: string[] = []
  // Witness del máximo de Aura: alguna postura tiene que dejar riesgo cero. Sin
  // eso, la variante tendría un techo competitivo inalcanzable y dos carreras
  // competirían con máximos distintos.
  if (!STANCES.some((stance) => stanceRisk(p, stance.id) === 0))
    issues.push('ninguna postura llega al máximo de Aura')
  const claims = standingClaims(p)
  const truths = new Set(claims.map((claim) => claim.truth))

  if (p.shape === 'settled' && !truths.has('seguro'))
    issues.push('nadie tiene el primer puesto asegurado')
  if (p.shape === 'open' && truths.has('seguro'))
    issues.push('con la tabla abierta nadie puede tener el puesto asegurado')
  if (p.shape === 'eliminated' && !truths.has('imposible'))
    issues.push('ningún equipo quedó sin chances')
  if (!truths.has('posible'))
    issues.push('sin nada por definir la tabla no se lee, se mira')
  if (truths.size < 2)
    issues.push('todas las afirmaciones caen en la misma categoría')

  // Intrinsic Math Gate: the points left have to change the reading. With one
  // more round for everyone, at least one claim must change category.
  const stretched = standingsSchema.parse({
    ...p,
    remaining: p.remaining.map((value) => value + 1) as [
      number,
      number,
      number,
      number,
    ],
  })
  const after = standingClaims(stretched)
  if (claims.every((claim, index) => claim.truth === after[index]?.truth))
    issues.push('los partidos que faltan no cambian ninguna categoría')

  // El torneo es entre estos cuatro cursos: cada curso no puede tener más
  // partidos pendientes que los otros tres juntos, y la suma es par.
  const total = p.remaining.reduce((sum, value) => sum + value, 0)
  if (total % 2 === 1)
    issues.push('los partidos que faltan no forman un fixture')
  if (p.remaining.some((value) => value * 2 > total))
    issues.push('un curso tiene más partidos pendientes que los otros juntos')

  // Gate de modelo (MAT-005): pensar cada curso por separado da lo mismo que
  // pensar el torneo entero, con cualquier fixture y cualquier resultado.
  const independent = independentTruths(p)
  const fixtures = fixturesOf(p.remaining)
  if (fixtures.length === 0) issues.push('no hay fixture posible')
  if (
    fixtures.some((fixture) =>
      jointTruths(p, fixture).some(
        (truth, index) => truth !== independent[index],
      ),
    )
  )
    issues.push(
      'las cotas por curso no coinciden con el torneo entre los cuatro',
    )

  // Empate (MAT-AJ-NEW-005): ninguna categoría depende de cómo se lea un empate.
  const tieReading = independentTruths(p, true)
  if (tieReading.some((truth, index) => truth !== independent[index]))
    issues.push('una categoría cambia si el empate cuenta como terminar arriba')

  issues.push(...tierWitnessIssues(standingsPlans(p)))
  return issues
}

export function evaluateStandings(
  p: StandingsParams,
  entries: readonly ClassificationEntry[],
  stance: string | undefined,
) {
  const claims = standingClaims(p)
  if (
    stance === undefined ||
    !STANCES.some((option) => option.id === stance) ||
    entries.length !== claims.length ||
    new Set(entries.map((entry) => entry.statementId)).size !==
      entries.length ||
    entries.some(
      (entry) =>
        !claims.some((claim) => claim.id === entry.statementId) ||
        !STANDING_LABELS.some((label) => label.id === entry.labelId),
    )
  )
    return err({
      kind: 'invalid-answer' as const,
      detail: 'faltan la clasificación completa o la decisión del curso',
    })

  const wrongCertainty = claims.filter((claim) =>
    entries.some(
      (entry) =>
        entry.statementId === claim.id &&
        entry.labelId === 'seguro' &&
        claim.truth !== 'seguro',
    ),
  )
  const wrong = claims.filter((claim) =>
    entries.some(
      (entry) =>
        entry.statementId === claim.id && entry.labelId !== claim.truth,
    ),
  )
  const quality: SolutionQuality =
    wrongCertainty.length > 0
      ? 'invalid'
      : wrong.length === 0
        ? 'optimal'
        : wrong.length === 1
          ? 'efficient'
          : 'functional'

  // The public stance is measured on its own terms: what the table allows the
  // course to say, never whether the player classified it correctly.
  const risk = stanceRisk(p, stance)
  const champion = claims.some((claim) => claim.truth === 'seguro')
  const auraPoints =
    stance === 'campeones'
      ? champion
        ? 300
        : -300
      : stance === 'tabla'
        ? 150
        : 0

  const base = outcome(
    quality,
    {
      outcomeKey: `standings-claim.${p.shape}.${quality}`,
      stamp: quality === 'invalid' ? 'Forzada' : 'Leída',
      facts: [
        ...CLAIM_TEAMS.map((team, index) => ({
          label: team.label,
          value: `${String(p.points[index] ?? 0)} pts · quedan ${String(p.remaining[index] ?? 0)}`,
        })),
        { label: 'Cada partido ganado', value: `${String(p.perWin)} puntos` },
      ],
      ...(quality === 'invalid' && wrongCertainty[0] !== undefined
        ? {
            violatedConstraint: `«${wrongCertainty[0].label}» todavía no está asegurado: con los partidos que faltan puede no pasar.`,
          }
        : {}),
      consequence:
        stance === 'campeones' && !champion
          ? 'El curso salió a cantar un campeonato que todavía no tiene, y el Intercurso sigue.'
          : stance === 'campeones'
            ? 'El curso lo publicó y los números lo respaldan.'
            : stance === 'tabla'
              ? 'La tabla queda publicada con lo que falta jugar: cualquiera puede comprobarla.'
              : 'El curso prefirió esperar al final para decir algo.',
    },
    { aura: auraPoints },
    [
      { flag: 'y2.standings.outcome', value: quality },
      { flag: 'y2.standings.stance', value: stance },
    ],
  )
  return ok({
    ...base,
    metrics: metrics({ ...base.metrics, risk }),
  })
}

export const standingsVariants = generatedSource({
  id: 'y2.standings-claim.bounds',
  version: '2',
  schema: standingsSchema,
  size: STANDINGS_SPACE,
  generate: generateStandings,
  gates: standingsGates,
  addressGates: standingsRoleGates,
})

const standingsClaimDefinition = defineChallenge<
  StandingsParams,
  StandingsParams
>({
  id: toChallengeId('y2.standings-claim'),
  family: toScenarioFamilyId('intercurso'),
  placement: 'checkpoint',
  variants: authoredVariantIds(standingsVariants.authored),
  variantSource: standingsVariants,
  interaction: 'classification',
  stages: ['year-2'],
  categories: ['patterns-and-relations', 'probability-and-uncertainty'],
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
    primaryReasoningFamily: 'LOGIC_CLASSIFICATION',
    interactionEngine: 'choice-compare',
    pacingClass: 'QUICK',
    chronology: 60,
    eventCluster: 'intercurso',
  },
  scoring: {
    math: 'discrete-quality',
    team: 'none',
    // La postura pública viaja por `risk` justamente para que no se confunda
    // con la calidad de la clasificación: son dos decisiones distintas y el
    // agregador lee dos canales distintos.
    aura: ({ metrics: evidence }) => performanceFromRatio(1 - evidence.risk),
    rationale:
      'Math mide separar lo asegurado de lo posible y lo imposible con los puntos que faltan. Aura mide si lo que el curso publica se sostiene con esa misma tabla, y se calcula sólo desde la decisión pública: leer bien la tabla nunca concede Aura por sí solo.',
  },
  tools: ['calculator'],
  generate: ({ params }) => parameters(standingsSchema, params),
  verify: (p) =>
    p.points.every(
      (value, index) => value >= 0 && (p.remaining[index] ?? 0) >= 0,
    )
      ? []
      : ['la tabla tiene valores negativos'],
  narrate: (p) => ({
    title: 'La tabla del Intercurso',
    setup: `Faltan partidos entre estos cuatro cursos y el curso quiere publicar algo. Cada partido lo gana uno de los dos, y el que gana suma ${String(p.perWin)} puntos.`,
    goal: 'Separá lo que ya está asegurado de lo que puede pasar y de lo que ya no, y decidí qué publica el curso.',
  }),
  present: (p) => ({
    kind: 'classification',
    data: [
      ...CLAIM_TEAMS.map((team, index) => ({
        label: team.label,
        value: String(p.points[index] ?? 0),
        unit: `pts · ${String(p.remaining[index] ?? 0)} por jugar`,
      })),
      {
        label: 'Cada victoria',
        value: String(p.perWin),
        unit: 'puntos',
        constraint: true,
      },
    ],
    statements: standingClaims(p).map((claim) => ({
      id: claim.id,
      label: claim.label,
      detail: claim.detail,
    })),
    labels: STANDING_LABELS.map((label) => ({
      id: label.id,
      label: label.label,
    })),
    stance: {
      prompt: '¿Qué publica el curso hoy?',
      options: STANCES.map((option) => ({
        id: option.id,
        label: option.label,
      })),
    },
    instructions:
      'Mirá cuánto puede sumar cada equipo con los partidos que le quedan. Después decidí qué publica el curso: es otra decisión, y no depende de cuántas categorías acertaste.',
  }),
  evaluate: (p, answer: InteractionAnswer) =>
    answer.kind === 'classification'
      ? evaluateStandings(p, answer.entries, answer.stance)
      : err({
          kind: 'invalid-answer',
          detail: 'se esperaba una clasificación',
        }),
})

/** Con nota por calidad (10/8/6/4). Ver `src/content/grades.ts`. */
export const standingsClaim = graded(standingsClaimDefinition)
