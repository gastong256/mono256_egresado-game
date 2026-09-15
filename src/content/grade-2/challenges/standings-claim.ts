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

const SHAPES = ['settled', 'open', 'eliminated'] as const
const BASES = [
  [12, 9, 7, 4],
  [15, 11, 8, 5],
  [10, 9, 8, 3],
  [14, 10, 6, 6],
  [13, 12, 5, 4],
] as const
const PER_WIN = [2, 3] as const
const RADICES = [SHAPES.length, BASES.length, PER_WIN.length, 3]
export const STANDINGS_SPACE = spaceOf(RADICES)

/** Most and least each team can finish with, in integer points. */
export function bounds(p: StandingsParams) {
  return CLAIM_TEAMS.map((_, index) => {
    const base = p.points[index] ?? 0
    const left = p.remaining[index] ?? 0
    return { min: base, max: base + left * p.perWin }
  })
}

export function generateStandings(index: number): StandingsParams {
  const axes = candidateAxes(index, RADICES, 11)
  const shape = at(SHAPES, digit(axes, 0))
  const base = at(BASES, digit(axes, 1))
  const perWin = at(PER_WIN, digit(axes, 2))
  const spread = digit(axes, 3)

  if (shape === 'settled') {
    // Nobody can reach the leader: everyone else has too little left.
    const left = [1, 1, 1, 1]
    const lead = (base[1] ?? 0) + 1 * perWin + 1 + spread
    return standingsSchema.parse({
      shape,
      points: [lead, base[1] ?? 0, base[2] ?? 0, base[3] ?? 0],
      remaining: left,
      perWin,
    })
  }
  if (shape === 'eliminated') {
    // The last team cannot catch the leader's current points any more.
    const left = [2, 2, 2, 1]
    const lead = (base[0] ?? 0) + 4 + spread
    return standingsSchema.parse({
      shape,
      points: [lead, base[1] ?? 0, base[2] ?? 0, base[3] ?? 0],
      remaining: left,
      perWin,
    })
  }
  const left = [2 + spread, 3, 3, 3]
  return standingsSchema.parse({
    shape,
    points: [...base],
    remaining: left,
    perWin,
  })
}

export interface StandingClaim {
  readonly id: string
  readonly label: string
  readonly detail: string
  readonly truth: 'seguro' | 'posible' | 'imposible'
}

/**
 * The claims, resolved with integer bounds.
 *
 * A team is champion for sure when its floor beats everyone's ceiling, and it
 * is out when its ceiling cannot reach someone's floor. Everything else is
 * still possible, which is the category players collapse first.
 */
export function standingClaims(p: StandingsParams): readonly StandingClaim[] {
  const limits = bounds(p)
  const claimFor = (index: number): 'seguro' | 'posible' | 'imposible' => {
    const own = limits[index]
    if (own === undefined) return 'imposible'
    const others = limits.filter((_, position) => position !== index)
    if (others.every((other) => own.min > other.max)) return 'seguro'
    if (others.some((other) => other.min > own.max)) return 'imposible'
    return 'posible'
  }
  /** Whether one team can still end above another, with the same bounds. */
  const above = (left: number, right: number): StandingClaim['truth'] => {
    const one = limits[left]
    const other = limits[right]
    if (one === undefined || other === undefined) return 'imposible'
    if (one.min > other.max) return 'seguro'
    if (other.min > one.max) return 'imposible'
    return 'posible'
  }
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
      truth: claimFor(0),
    },
    {
      id: 'd-first',
      label: `${CLAIM_TEAMS[3].label} termina primero.`,
      detail: detailOf(3),
      truth: claimFor(3),
    },
    {
      id: 'b-over-c',
      label: `${CLAIM_TEAMS[1].label} termina arriba de ${CLAIM_TEAMS[2].label}.`,
      detail: `${detailOf(1)} · ${detailOf(2)}`,
      truth: above(1, 2),
    },
    {
      id: 'c-over-a',
      label: `${CLAIM_TEAMS[2].label} termina arriba de ${CLAIM_TEAMS[0].label}.`,
      detail: `${detailOf(2)} · ${detailOf(0)}`,
      truth: above(2, 0),
    },
  ]
}

/** How exposed a public stance is, given what the table actually allows. */
export function stanceRisk(p: StandingsParams, stance: string): number {
  const champion = standingClaims(p).some((claim) => claim.truth === 'seguro')
  if (stance === 'campeones') return champion ? 0 : 1
  if (stance === 'tabla') return 0.2
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
      stamp: quality === 'invalid' ? 'Cuenta forzada' : 'Tabla leída',
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
  version: '1',
  schema: standingsSchema,
  size: STANDINGS_SPACE,
  generate: generateStandings,
  gates: standingsGates,
})

export const standingsClaim = defineChallenge<StandingsParams, StandingsParams>(
  {
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
      setup: `Faltan partidos y el curso quiere publicar algo. Cada partido ganado suma ${String(p.perWin)} puntos.`,
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
  },
)
