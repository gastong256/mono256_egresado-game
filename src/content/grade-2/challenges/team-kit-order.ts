/**
 * 2.º · El pedido de pecheras (`y2.team-kit-order`).
 *
 * El curso pide las pecheras del Intercurso. Cada equipo tiene su gente
 * anotada, el proveedor tiene stock por color y el curso tiene un tope de
 * unidades. Encima hay que pedir repuestos, porque algo siempre se rompe o se
 * mancha antes de la final.
 *
 * La cuenta que decide es el reparto de esos repuestos: la regla escrita es que
 * van donde hay más gente, así que se reparten en proporción a los inscriptos y
 * no en partes iguales. El señuelo de cada variante es justamente el reparto
 * parejo, que parece razonable y no cumple lo pedido.
 *
 * No es el problema de packs y presupuesto de 7.º —acá no hay paquetes ni
 * precio— ni la capacidad en una sola unidad de 1.º. Y las categorías son
 * equipos, no talles: el pedido nunca habla de cuerpos.
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
  mil,
  outcome,
  parameters,
  quantity,
  quantityIssues,
  spaceOf,
  tierWitnessIssues,
} from '@/content/authoring'

/** Three teams keep the proportional split readable without a spreadsheet. */
export const TEAMS = [
  { id: 'verde', label: 'Equipo verde' },
  { id: 'naranja', label: 'Equipo naranja' },
  { id: 'violeta', label: 'Equipo violeta' },
] as const

const players = z.number().int().min(3).max(24)
const stock = z.number().int().min(3).max(60)
const common = {
  players: z.tuple([players, players, players]),
  stock: z.tuple([stock, stock, stock]),
  /** Spare shirts the course has to order on top of one per player. */
  spares: z.number().int().min(2).max(12),
  /** Hard ceiling of units the course can order at all. */
  cap: z.number().int().min(12).max(120),
}
export const kitOrderSchema = z.discriminatedUnion('shape', [
  /** The proportional split lands exactly, and an even split does not. */
  z.strictObject({ shape: z.literal('exact-share'), ...common }),
  /** The split leaves remainders, so the largest ones decide who gets them. */
  z.strictObject({ shape: z.literal('remainder'), ...common }),
  /** One team cannot take its whole share: its stock runs out first. */
  z.strictObject({ shape: z.literal('stock-capped'), ...common }),
])
export type KitOrderParams = z.infer<typeof kitOrderSchema>

const SHAPES = ['exact-share', 'remainder', 'stock-capped'] as const
const ROSTERS = [
  [12, 8, 4],
  [10, 6, 4],
  [9, 6, 3],
  [14, 7, 7],
  [11, 7, 6],
  [15, 9, 6],
] as const
const SPARES = [3, 4, 6, 8] as const
const RADICES = [SHAPES.length, ROSTERS.length, SPARES.length, 2, TEAMS.length]
export const KIT_ORDER_SPACE = spaceOf(RADICES)

const total = (values: readonly number[]): number =>
  values.reduce((sum, value) => sum + value, 0)

/**
 * The written rule, spelled once: spares go where the people are.
 *
 * Largest-remainder over the rosters, then whatever a team cannot take because
 * its stock ran out moves on to the next largest remainder. Deterministic and
 * total; ties break on team order, which is the order the course lists them.
 */
export function spareShare(
  rosters: readonly number[],
  spares: number,
  room: readonly number[],
): readonly number[] {
  const people = total(rosters)
  const exact = rosters.map((count) => (count * spares) / people)
  const share = exact.map((value) => Math.floor(value))
  const order = exact
    .map((value, index) => ({ index, rest: value - Math.floor(value) }))
    .sort((left, right) => right.rest - left.rest || left.index - right.index)
    .map((entry) => entry.index)
  let left = spares - total(share)
  // Hand out the remainders, skipping a team whose stock cannot hold one more.
  for (let round = 0; round < spares + rosters.length && left > 0; round++)
    for (const index of order) {
      if (left === 0) break
      if ((share[index] ?? 0) >= (room[index] ?? 0)) continue
      share[index] = (share[index] ?? 0) + 1
      left -= 1
    }
  return share
}

/** Constraint-first materialisation: the even split must never be the answer. */
export function generateKitOrder(index: number): KitOrderParams {
  const axes = candidateAxes(index, RADICES, 17)
  const shape = at(SHAPES, digit(axes, 0))
  const roster = at(ROSTERS, digit(axes, 1))
  const spares = at(SPARES, digit(axes, 2))
  const slack = digit(axes, 3)
  const people = total(roster)

  if (shape === 'exact-share') {
    // A roster whose proportions divide the spares exactly.
    const scaled = [6, 3, 3] as const
    const exactSpares = 4 + 4 * slack
    const stocks = scaled.map((count) => count + exactSpares)
    return kitOrderSchema.parse({
      shape,
      players: scaled,
      stock: stocks,
      spares: exactSpares,
      cap: total(scaled) + exactSpares,
    })
  }
  if (shape === 'remainder') {
    const stocks = roster.map((count) => count + spares)
    return kitOrderSchema.parse({
      shape,
      players: roster,
      stock: stocks,
      spares,
      cap: people + spares + slack,
    })
  }
  // stock-capped: one team cannot take its whole proportional share, so the
  // leftover moves on. Which team is limited rotates with the address; a team
  // that would get no spares anyway cannot express the shape, so the fullest
  // share takes its place.
  const share = spareShare(roster, spares, [spares, spares, spares])
  const asked = digit(axes, 4)
  const limited =
    (share[asked] ?? 0) >= 1 ? asked : share.indexOf(Math.max(...share))
  const stocks = roster.map((count, index) =>
    index === limited
      ? count + Math.max(0, (share[index] ?? 0) - 1)
      : count + spares,
  )
  return kitOrderSchema.parse({
    shape,
    players: roster,
    stock: stocks,
    spares,
    cap: people + spares + slack,
  })
}

/** Room each team has for spares once its players are covered. */
function roomOf(p: KitOrderParams): readonly number[] {
  return p.players.map((count, index) => (p.stock[index] ?? 0) - count)
}

export interface KitPlan {
  readonly lines: readonly BudgetLine[]
  readonly quality: SolutionQuality
  readonly ordered: readonly number[]
}

/**
 * Independent oracle over every order the contract admits.
 *
 * It re-derives the rule with its own arithmetic — coverage, stock, cap and the
 * proportional split — and never calls the evaluator, so a drift in either side
 * shows up as a disagreement instead of as agreement on a bug.
 */
export function kitPlans(p: KitOrderParams): readonly KitPlan[] {
  const plans: KitPlan[] = []
  const room = roomOf(p)
  const target = spareShare(p.players, p.spares, room)
  const limits = p.stock.map((value) => Math.min(value, 40))
  for (let a = 0; a <= (limits[0] ?? 0); a++)
    for (let b = 0; b <= (limits[1] ?? 0); b++)
      for (let c = 0; c <= (limits[2] ?? 0); c++) {
        const ordered = [a, b, c]
        const lines = TEAMS.map((team, index) => ({
          itemId: team.id,
          quantity: ordered[index] ?? 0,
        }))
        const covered = ordered.every(
          (value, index) => value >= (p.players[index] ?? 0),
        )
        const withinStock = ordered.every(
          (value, index) => value <= (p.stock[index] ?? 0),
        )
        const units = total(ordered)
        const spares = units - total(p.players)
        if (!covered || !withinStock || units > p.cap || spares < p.spares) {
          plans.push({ lines, ordered, quality: 'invalid' })
          continue
        }
        const extra = ordered.map(
          (value, index) => value - (p.players[index] ?? 0),
        )
        const matchesRule = extra.every(
          (value, index) => value === (target[index] ?? 0),
        )
        const spread = extra.filter((value) => value > 0).length
        plans.push({
          lines,
          ordered,
          quality: matchesRule
            ? 'optimal'
            : spread >= 2
              ? 'efficient'
              : 'functional',
        })
      }
  return plans
}

/** Authoring gates. A variant that fails any of them is never approved. */
export function kitGates(p: KitOrderParams): readonly string[] {
  const issues: string[] = []
  const people = total(p.players)
  const room = roomOf(p)
  if (room.some((value) => value < 0))
    issues.push('un equipo no tiene stock ni para su propia gente')
  if (p.cap < people + p.spares)
    issues.push('el tope no alcanza para cubrir a todos y los repuestos')
  if (total(room) < p.spares)
    issues.push('el stock total no alcanza para los repuestos pedidos')

  const plans = kitPlans(p)
  issues.push(...tierWitnessIssues(plans))
  const target = spareShare(p.players, p.spares, room)
  if (total(target) !== p.spares)
    issues.push('el reparto proporcional no coloca todos los repuestos')

  // Intrinsic Math Gate: the even split is the plan a player writes without
  // doing the proportion, and it must not be the one the rule asks for.
  const even = p.players.map(() => Math.floor(p.spares / TEAMS.length))
  let rest = p.spares - total(even)
  for (let index = 0; index < even.length && rest > 0; index++, rest--)
    even[index] = (even[index] ?? 0) + 1
  if (even.every((value, index) => value === (target[index] ?? 0)))
    issues.push('el reparto parejo coincide con el proporcional: no hay cuenta')

  if (new Set(p.players).size === 1)
    issues.push(
      'los tres equipos tienen la misma gente: la proporción no dice nada',
    )
  if (plans.filter((plan) => plan.quality === 'optimal').length !== 1)
    issues.push('el reparto pedido tiene que ser exactamente uno')
  return issues
}

/** Runtime structural check of an approved address; the gates ran at approval. */
function verifyKitOrder(p: KitOrderParams): readonly string[] {
  return p.cap >= total(p.players) + p.spares
    ? []
    : ['el tope no alcanza para cubrir a todos y los repuestos']
}

export function evaluateKitOrder(
  p: KitOrderParams,
  lines: readonly BudgetLine[],
) {
  const items = TEAMS.map((team, index) => ({
    id: team.id,
    maxQuantity: p.stock[index] ?? 0,
  }))
  const issues = quantityIssues(lines, items)
  if (issues.length > 0)
    return err({ kind: 'invalid-answer' as const, detail: issues[0] ?? '' })

  const ordered = TEAMS.map((team) => quantity(lines, team.id))
  const room = roomOf(p)
  const target = spareShare(p.players, p.spares, room)
  const units = total(ordered)
  const people = total(p.players)
  const spares = units - people
  const uncovered = TEAMS.map((team, index) => ({
    team,
    missing: (p.players[index] ?? 0) - (ordered[index] ?? 0),
  })).filter((entry) => entry.missing > 0)
  const overStock = TEAMS.map((team, index) => ({
    team,
    over: (ordered[index] ?? 0) - (p.stock[index] ?? 0),
  })).filter((entry) => entry.over > 0)

  const extra = ordered.map((value, index) => value - (p.players[index] ?? 0))
  const matchesRule =
    uncovered.length === 0 &&
    extra.every((value, index) => value === (target[index] ?? 0))
  const spread = extra.filter((value) => value > 0).length
  const quality: SolutionQuality =
    uncovered.length > 0 ||
    overStock.length > 0 ||
    units > p.cap ||
    spares < p.spares
      ? 'invalid'
      : matchesRule
        ? 'optimal'
        : spread >= 2
          ? 'efficient'
          : 'functional'

  const violated =
    uncovered[0] !== undefined
      ? `${uncovered[0].team.label}: faltan ${String(uncovered[0].missing)} pecheras para su gente.`
      : overStock[0] !== undefined
        ? `${overStock[0].team.label}: el proveedor tiene ${String(p.stock[TEAMS.indexOf(overStock[0].team)] ?? 0)}.`
        : units > p.cap
          ? `El pedido son ${mil(units)} pecheras y el tope es ${mil(p.cap)}.`
          : `Los repuestos suman ${String(Math.max(0, spares))} y hacen falta ${String(p.spares)}.`

  return ok(
    outcome(
      quality,
      {
        outcomeKey: `team-kit-order.${p.shape}.${quality}`,
        stamp:
          quality === 'invalid'
            ? uncovered.length > 0
              ? 'Faltan'
              : 'No entra'
            : 'Pedido',
        facts: [
          ...TEAMS.map((team, index) => ({
            label: team.label,
            value: `${String(ordered[index] ?? 0)} = ${String(p.players[index] ?? 0)} + ${String(extra[index] ?? 0)} de repuesto`,
          })),
          {
            label: 'Total',
            value: `${String(units)} de ${String(p.cap)} como máximo`,
          },
          {
            label: 'Repuestos',
            value: `${String(Math.max(0, spares))} de ${String(p.spares)} pedidos`,
          },
        ],
        ...(quality === 'invalid' ? { violatedConstraint: violated } : {}),
        ...(quality === 'optimal' || quality === 'efficient'
          ? {
              optimalComparison: `Repartidos según la gente de cada equipo: ${TEAMS.map(
                (team, index) => `${team.label} ${String(target[index] ?? 0)}`,
              ).join(' · ')}.`,
            }
          : {}),
        consequence:
          quality === 'optimal'
            ? 'Cuando se rompe una pechera hay repuesto en el equipo que más lo necesita.'
            : quality === 'invalid'
              ? 'Con ese pedido alguien se queda sin pechera el día del Intercurso.'
              : 'El pedido entra, pero los repuestos no quedan donde hay más gente.',
      },
      {},
      [{ flag: 'y2.kit.outcome', value: quality }],
    ),
  )
}

export const kitOrderVariants = generatedSource({
  id: 'y2.team-kit-order.proportional-spares',
  version: '1',
  schema: kitOrderSchema,
  size: KIT_ORDER_SPACE,
  generate: generateKitOrder,
  gates: kitGates,
})

export const teamKitOrder = defineChallenge<KitOrderParams, KitOrderParams>({
  id: toChallengeId('y2.team-kit-order'),
  family: toScenarioFamilyId('team-kit'),
  placement: 'checkpoint',
  variants: authoredVariantIds(kitOrderVariants.authored),
  variantSource: kitOrderVariants,
  interaction: 'quantity-builder',
  stages: ['year-2'],
  categories: ['quantity', 'proportions-and-percentages'],
  baseDifficulty: 2,
  cognitive: feasibilityConstruction,
  composition: {
    primaryReasoningFamily: 'ALLOCATION',
    interactionEngine: 'allocate-constrain',
    pacingClass: 'QUICK',
    chronology: 20,
  },
  scoring: {
    math: 'discrete-quality',
    team: 'none',
    aura: 'none',
    rationale:
      'Math mide cobertura, stock, tope y el reparto proporcional de los repuestos. No hay evidencia de Equipo ni de Aura: el pedido es una cuenta del curso, no una negociación.',
  },
  tools: ['calculator'],
  generate: ({ params }) => parameters(kitOrderSchema, params),
  verify: verifyKitOrder,
  narrate: (p) => ({
    title: 'Las pecheras del Intercurso',
    setup: `Se anotaron ${String(total(p.players))} personas en tres equipos y hay que encargar las pecheras. El proveedor tiene stock por color y el curso puede pedir ${String(p.cap)} en total.`,
    goal: `Que nadie quede sin pechera y que sobren al menos ${String(p.spares)} de repuesto, repartidas según cuánta gente tiene cada equipo.`,
  }),
  present: (p) => ({
    kind: 'quantity-builder',
    data: [
      { label: 'Anotados', value: String(total(p.players)), unit: 'personas' },
      {
        label: 'Tope del curso',
        value: String(p.cap),
        unit: 'pecheras',
        constraint: true,
      },
      {
        label: 'Repuestos',
        value: String(p.spares),
        unit: 'mínimo',
        constraint: true,
      },
    ],
    items: TEAMS.map((team, index) => ({
      id: team.id,
      label: team.label,
      detail: `${String(p.players[index] ?? 0)} anotados · hay ${String(p.stock[index] ?? 0)} en stock`,
      maxQuantity: p.stock[index] ?? 0,
    })),
    instructions:
      'Elegí cuántas pecheras pedir de cada equipo. Cada persona anotada necesita la suya, y los repuestos van repartidos según cuánta gente tiene cada equipo.',
  }),
  evaluate: (p, answer: InteractionAnswer) =>
    answer.kind === 'quantity-builder'
      ? evaluateKitOrder(p, answer.lines)
      : err({
          kind: 'invalid-answer',
          detail: 'se esperaba un pedido de cantidades',
        }),
})
