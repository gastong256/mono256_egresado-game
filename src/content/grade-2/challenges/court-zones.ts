/**
 * 2.º · Las postas de la cancha (`y2.court-zones`).
 *
 * El Intercurso arma postas en la cancha y hay que decidir dónde va cada una.
 * Lo que decide no es el tamaño de las cosas —eso fue el aula de 1.º— sino la
 * distancia: cuánto tienen que separarse entre sí para no pisarse, cuánto
 * despegarse de la línea de banda y qué queda dentro del sector techado.
 *
 * La geometría es de zonas y distancias sobre celdas enteras: separación de
 * Chebyshev, márgenes contra el borde y pertenencia a una región. Nada de
 * píxeles llega al evaluador.
 */
import { z } from 'zod'
import {
  authoredVariantIds,
  defineChallenge,
  err,
  ok,
  toChallengeId,
  toScenarioFamilyId,
  type InteractionAnswer,
  type SolutionQuality,
  type SpatialPlacement,
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

export const POSTS = [
  { id: 'saque', label: 'Posta de saque', code: 'S' },
  { id: 'pases', label: 'Posta de pases', code: 'P' },
  { id: 'tiros', label: 'Posta de tiros', code: 'T' },
] as const

const side = z.number().int().min(5).max(16)
export const courtSchema = z.discriminatedUnion('shape', [
  /** Separation is what binds: the court is roomy but the posts crowd. */
  z.strictObject({
    shape: z.literal('separation'),
    width: side,
    height: side,
    margin: z.number().int().min(1).max(2),
    apart: z.number().int().min(2).max(5),
    cellCentimeters: z.number().int().min(50).max(200).multipleOf(50),
  }),
  /** The safety margin against the sideline is what binds. */
  z.strictObject({
    shape: z.literal('margin'),
    width: side,
    height: side,
    margin: z.number().int().min(2).max(3),
    apart: z.number().int().min(2).max(4),
    cellCentimeters: z.number().int().min(50).max(200).multipleOf(50),
  }),
  /** One post has to sit inside the covered sector, which is small. */
  z.strictObject({
    shape: z.literal('covered'),
    width: side,
    height: side,
    margin: z.number().int().min(1).max(2),
    apart: z.number().int().min(2).max(4),
    cellCentimeters: z.number().int().min(50).max(200).multipleOf(50),
    covered: z.number().int().min(2).max(4),
  }),
])
export type CourtParams = z.infer<typeof courtSchema>

const SHAPES = ['separation', 'margin', 'covered'] as const
const SIDES = [
  [12, 8],
  [12, 9],
  [14, 8],
  [12, 10],
] as const
const CELLS = [50, 100, 150] as const
const RADICES = [SHAPES.length, SIDES.length, CELLS.length, 2]
export const COURT_SPACE = spaceOf(RADICES)

export function generateCourt(index: number): CourtParams {
  const axes = candidateAxes(index, RADICES, 13)
  const shape = at(SHAPES, digit(axes, 0))
  const [width = 8, height = 6] = at(SIDES, digit(axes, 1))
  const cellCentimeters = at(CELLS, digit(axes, 2))
  const tight = digit(axes, 3)

  if (shape === 'margin')
    // Two cells of sideline is as much as a court this size can give away and
    // still leave room for three posts two cells apart.
    return courtSchema.parse({
      shape,
      width,
      height,
      margin: 2,
      apart: 2 + tight,
      cellCentimeters,
    })
  if (shape === 'covered')
    return courtSchema.parse({
      shape,
      width,
      height,
      margin: 1,
      apart: 2 + tight,
      cellCentimeters,
      covered: 2 + tight,
    })
  return courtSchema.parse({
    shape,
    width,
    height,
    margin: 1,
    apart: 2 + tight,
    cellCentimeters,
  })
}

/** Cells a post may legally occupy: inside the safety margin. */
export function playable(p: CourtParams): readonly { x: number; y: number }[] {
  const cells: { x: number; y: number }[] = []
  for (let x = p.margin; x < p.width - p.margin; x++)
    for (let y = p.margin; y < p.height - p.margin; y++) cells.push({ x, y })
  return cells
}

/** The covered sector, top-left corner of the court, when the shape has one. */
export function coveredCells(
  p: CourtParams,
): readonly { x: number; y: number }[] {
  if (p.shape !== 'covered') return []
  return playable(p).filter(
    (cell) => cell.x < p.margin + p.covered && cell.y < p.margin + p.covered,
  )
}

const chebyshev = (
  a: { x: number; y: number },
  b: { x: number; y: number },
): number => Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y))

export interface CourtPlan {
  readonly placements: readonly SpatialPlacement[]
  readonly quality: SolutionQuality
  readonly spread: number
}

/**
 * The separation the best legal layout reaches.
 *
 * Descending search with an early return instead of enumerating every layout:
 * the first separation that admits three posts is the answer, and the answer is
 * usually large, so this stops almost immediately. Same result as the full
 * enumeration, which the tests check.
 */
export function bestSpread(p: CourtParams): number {
  const cells = playable(p)
  const covered = coveredCells(p)
  const anchors = p.shape === 'covered' ? covered : cells
  const ceiling = Math.max(p.width, p.height)
  for (let s = ceiling; s >= 0; s--)
    for (const first of anchors) {
      const far = cells.filter((cell) => chebyshev(first, cell) >= s)
      for (const [index, second] of far.entries())
        for (const third of far.slice(index + 1))
          if (chebyshev(second, third) >= s) return s
    }
  return 0
}

/**
 * Independent oracle over every placement of the three posts.
 *
 * The court is small on purpose, so this enumerates the whole legal space with
 * its own distance arithmetic instead of trusting the evaluator's.
 */
export function courtPlans(p: CourtParams): readonly CourtPlan[] {
  const cells = playable(p)
  const covered = coveredCells(p)
  const plans: CourtPlan[] = []
  for (const first of cells)
    for (const second of cells)
      for (const third of cells) {
        const spots = [first, second, third]
        const placements = POSTS.map((post, index) => ({
          objectId: post.id,
          x: spots[index]?.x ?? 0,
          y: spots[index]?.y ?? 0,
          rotation: 0 as const,
        }))
        const distinct =
          new Set(spots.map((spot) => `${String(spot.x)}:${String(spot.y)}`))
            .size === spots.length
        const spread = Math.min(
          chebyshev(first, second),
          chebyshev(first, third),
          chebyshev(second, third),
        )
        const coveredOk =
          p.shape !== 'covered' ||
          covered.some((cell) => cell.x === first.x && cell.y === first.y)
        if (!distinct || spread < p.apart || !coveredOk) {
          plans.push({ placements, quality: 'invalid', spread })
          continue
        }
        plans.push({ placements, quality: 'functional', spread })
      }
  return plans.map((plan) =>
    plan.quality === 'invalid'
      ? plan
      : { ...plan, quality: tierOf(p, plan.spread) },
  )
}

/**
 * The written ladder: the asked separation, one more, two more.
 *
 * Declared conditions rather than a global optimum on purpose. Searching the
 * whole court to grade one answer would put an exhaustive enumeration inside
 * the evaluator, and the authoring gates already prove that two extra cells are
 * reachable in every approved variant.
 */
export function tierOf(p: CourtParams, spread: number): SolutionQuality {
  if (spread < p.apart) return 'invalid'
  if (spread >= p.apart + 2) return 'optimal'
  if (spread === p.apart + 1) return 'efficient'
  return 'functional'
}

export function courtGates(p: CourtParams): readonly string[] {
  const issues: string[] = []
  const cells = playable(p)
  if (cells.length < 6)
    issues.push('la zona jugable no tiene lugar para tres postas')
  const plans = courtPlans(p)
  const legal = plans.filter((plan) => plan.quality !== 'invalid')
  if (legal.length === 0) issues.push('no hay ninguna ubicación legal')
  issues.push(...tierWitnessIssues(plans))

  const best = bestSpread(p)
  if (best < p.apart + 2)
    issues.push('la cancha no permite alcanzar la separación del nivel óptimo')

  // Intrinsic Math Gate: putting the posts in a row along one side has to fail,
  // which is the layout somebody draws without measuring anything.
  const row = cells.slice(0, POSTS.length)
  if (row.length === POSTS.length) {
    const spread = Math.min(
      chebyshev(row[0]!, row[1]!),
      chebyshev(row[0]!, row[2]!),
      chebyshev(row[1]!, row[2]!),
    )
    if (spread >= p.apart)
      issues.push('las postas en fila ya cumplen: la distancia no decide')
  }
  if (p.shape === 'covered' && coveredCells(p).length === 0)
    issues.push('el sector techado quedó fuera de la zona jugable')
  return issues
}

export function evaluateCourt(
  p: CourtParams,
  placements: readonly SpatialPlacement[],
) {
  if (
    placements.length !== POSTS.length ||
    new Set(placements.map((entry) => entry.objectId)).size !==
      placements.length ||
    placements.some(
      (entry) => !POSTS.some((post) => post.id === entry.objectId),
    )
  )
    return err({
      kind: 'invalid-answer' as const,
      detail: 'faltan postas o hay una repetida',
    })

  const spots = POSTS.map((post) => {
    const found = placements.find((entry) => entry.objectId === post.id)
    return { x: found?.x ?? 0, y: found?.y ?? 0 }
  })
  const inside = spots.every(
    (spot) =>
      spot.x >= p.margin &&
      spot.y >= p.margin &&
      spot.x < p.width - p.margin &&
      spot.y < p.height - p.margin,
  )
  const distinct =
    new Set(spots.map((spot) => `${String(spot.x)}:${String(spot.y)}`)).size ===
    spots.length
  const spread = Math.min(
    chebyshev(spots[0]!, spots[1]!),
    chebyshev(spots[0]!, spots[2]!),
    chebyshev(spots[1]!, spots[2]!),
  )
  const covered = coveredCells(p)
  const coveredOk =
    p.shape !== 'covered' ||
    covered.some((cell) => cell.x === spots[0]!.x && cell.y === spots[0]!.y)

  const quality: SolutionQuality =
    !inside || !distinct || !coveredOk ? 'invalid' : tierOf(p, spread)

  return ok(
    outcome(
      quality,
      {
        outcomeKey: `court-zones.${p.shape}.${quality}`,
        stamp: quality === 'invalid' ? 'No entra' : 'Armada',
        facts: [
          {
            label: 'Cancha',
            value: `${String(p.width)} × ${String(p.height)} celdas de ${String(p.cellCentimeters)} cm`,
          },
          { label: 'Separación pedida', value: `${String(p.apart)} celdas` },
          { label: 'Separación lograda', value: `${String(spread)} celdas` },
          { label: 'Margen con la línea', value: `${String(p.margin)} celdas` },
        ],
        ...(quality === 'invalid'
          ? {
              violatedConstraint: !inside
                ? `Alguna posta quedó a menos de ${String(p.margin)} celdas de la línea.`
                : !distinct
                  ? 'Dos postas quedaron en la misma celda.'
                  : !coveredOk
                    ? 'La posta de saque tiene que quedar en el sector techado.'
                    : `Las postas quedaron a ${String(spread)} celdas y se pidieron ${String(p.apart)}.`,
            }
          : {}),
        ...(quality === 'optimal' || quality === 'efficient'
          ? {
              optimalComparison: `Con ${String(p.apart + 2)} celdas de separación las tres colas quedan sueltas.`,
            }
          : {}),
        consequence:
          quality === 'optimal'
            ? 'Las postas quedan con dos celdas o más de separación sobre lo pedido y ninguna cola se mezcla con otra.'
            : quality === 'invalid'
              ? 'Con esa distribución dos postas se pisan y la posta de saque termina jugando contra la pared.'
              : 'Las postas entran, aunque quedan más juntas de lo que la cancha permitía.',
      },
      {},
      [{ flag: 'y2.court.outcome', value: quality }],
    ),
  )
}

export const courtVariants = generatedSource({
  id: 'y2.court-zones.distances',
  version: '1',
  schema: courtSchema,
  size: COURT_SPACE,
  generate: generateCourt,
  gates: courtGates,
})

export const courtZones = defineChallenge<CourtParams, CourtParams>({
  id: toChallengeId('y2.court-zones'),
  family: toScenarioFamilyId('court-space'),
  placement: 'anchor',
  variants: authoredVariantIds(courtVariants.authored),
  variantSource: courtVariants,
  interaction: 'spatial-layout',
  stages: ['year-2'],
  categories: ['space-and-shape', 'optimization-and-constraints'],
  baseDifficulty: 4,
  cognitive: {
    steps: 3,
    constraints: 3,
    selection: 1,
    optimization: 1,
    uncertainty: 0,
    construction: 1,
  },
  composition: {
    primaryReasoningFamily: 'SPATIAL',
    interactionEngine: 'spatial-graph',
    pacingClass: 'DEEP',
    chronology: 70,
    eventCluster: 'intercurso',
  },
  scoring: {
    math: 'discrete-quality',
    team: 'none',
    aura: 'none',
    rationale:
      'Math mide distancias entre postas, margen con la línea y pertenencia al sector techado. No hay Equipo ni Aura: armar la cancha es una cuenta de geometría, no un acuerdo ni una pose.',
  },
  tools: ['calculator', 'ruler'],
  generate: ({ params }) => parameters(courtSchema, params),
  verify: (p) =>
    playable(p).length >= POSTS.length
      ? []
      : ['la zona jugable no tiene lugar para tres postas'],
  narrate: (p) => ({
    title: 'Las postas de la cancha',
    setup: `La cancha del Intercurso mide ${String(p.width)} × ${String(p.height)} celdas de ${String(p.cellCentimeters)} cm y hay que armar tres postas.`,
    goal: `Separalas al menos ${String(p.apart)} celdas entre sí y dejá ${String(p.margin)} de margen con la línea. Si llegás a ${String(p.apart + 2)} de separación, las colas no se mezclan.`,
  }),
  present: (p) => ({
    kind: 'spatial-layout',
    data: [
      {
        label: 'Separación mínima',
        value: String(p.apart),
        unit: 'celdas',
        constraint: true,
      },
      {
        label: 'Margen con la línea',
        value: String(p.margin),
        unit: 'celdas',
        constraint: true,
      },
      ...(p.shape === 'covered'
        ? [
            {
              label: 'Sector techado',
              value: String(p.covered),
              unit: 'celdas de lado',
            },
          ]
        : []),
    ],
    width: p.width,
    height: p.height,
    cellCentimeters: p.cellCentimeters,
    blocked: [],
    clearance: [],
    entrances: coveredCells(p).map((cell) => ({ x: cell.x, y: cell.y })),
    objects: POSTS.map((post, index) => ({
      id: post.id,
      label: post.label,
      code: post.code,
      widthCells: 1,
      heightCells: 1,
      detail:
        index === 0 && p.shape === 'covered'
          ? 'tiene que quedar en el sector techado'
          : `a ${String(p.apart)} celdas o más de las otras`,
      rotatable: false,
      optional: false,
    })),
    instructions:
      'Elegí la celda de cada posta. Lo que decide es la distancia: entre postas y con la línea de banda.',
  }),
  evaluate: (p, answer: InteractionAnswer) =>
    answer.kind === 'spatial-layout'
      ? evaluateCourt(p, answer.placements)
      : err({
          kind: 'invalid-answer',
          detail: 'se esperaba un plano de postas',
        }),
})
