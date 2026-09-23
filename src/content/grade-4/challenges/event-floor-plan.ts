/**
 * 4.º · El salón del evento (`y4.event-floor-plan`) y su Repaso
 * (`y4.spatial-capacity-review`).
 *
 * El salón tiene una puerta, un pasillo que no se puede tapar y una cantidad
 * de gente que va a venir. Hay que ubicar el escenario, las mesas y lo que
 * entre.
 *
 * Dos cosas deciden y las dos son estructurales. La **capacidad**: las mesas
 * que se pongan tienen que sentar a toda la gente, así que a veces poner una
 * mesa más no es un lujo sino la única forma de que el plano sea válido. Y la
 * **circulación**: cada cosa tiene que quedar pegada a un espacio libre que se
 * pueda llegar caminando desde la puerta. Un plano donde todo entre pero deje
 * una mesa encerrada no sirve, y ésa es la diferencia con el encastre de 1.º.
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
  type GridCell,
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
import { graded } from '../../grades'

export const ZONES = [
  {
    id: 'escenario',
    label: 'Escenario',
    code: 'E',
    width: 3,
    height: 2,
    seats: 0,
    optional: false,
    rotatable: true,
  },
  {
    id: 'mesa-a',
    label: 'Mesas del fondo',
    code: 'M1',
    width: 2,
    height: 2,
    seats: 8,
    optional: true,
    rotatable: false,
  },
  {
    id: 'mesa-b',
    label: 'Mesas del medio',
    code: 'M2',
    width: 2,
    height: 2,
    seats: 8,
    optional: true,
    rotatable: false,
  },
  {
    id: 'mesa-c',
    label: 'Mesas de la ventana',
    code: 'M3',
    width: 2,
    height: 2,
    seats: 8,
    optional: true,
    rotatable: false,
  },
  {
    id: 'barra',
    label: 'Barra',
    code: 'B',
    width: 3,
    height: 1,
    seats: 0,
    optional: true,
    rotatable: true,
  },
] as const
export type ZoneId = (typeof ZONES)[number]['id']

const coordinate = z.number().int().min(0).max(11)
const cell = z.strictObject({ x: coordinate, y: coordinate })
export const floorSchema = z
  .strictObject({
    shape: z.enum(['salon-angosto', 'puerta-al-medio', 'con-columnas']),
    width: z.number().int().min(6).max(10),
    height: z.number().int().min(5).max(8),
    cellCentimeters: z.number().int().min(50).max(150).multipleOf(50),
    /** Cuánta gente viene. Las mesas puestas tienen que sentarla. */
    guests: z.number().int().min(8).max(40),
    /** La puerta y el pasillo que sale de ella: no se tapan. */
    door: cell,
    corridor: z.array(cell).min(1).max(8),
    /** Columnas u obstáculos del salón. */
    blocked: z.array(cell).max(4),
  })
  .refine(
    (p) =>
      p.door.x < p.width &&
      p.door.y < p.height &&
      p.corridor.every((entry) => entry.x < p.width && entry.y < p.height),
    'la puerta o el pasillo caen fuera del salón',
  )
export type FloorParams = z.infer<typeof floorSchema>

type Zone = (typeof ZONES)[number]

export function footprint(
  zone: Zone,
  rotation: 0 | 90,
): { readonly w: number; readonly h: number } {
  return rotation === 90
    ? { w: zone.height, h: zone.width }
    : { w: zone.width, h: zone.height }
}

function cellsOf(zone: Zone, placement: SpatialPlacement): readonly GridCell[] {
  const { w, h } = footprint(zone, placement.rotation)
  const cells: GridCell[] = []
  for (let dy = 0; dy < h; dy++)
    for (let dx = 0; dx < w; dx++)
      cells.push({ x: placement.x + dx, y: placement.y + dy })
  return cells
}

const key = (cell: GridCell): string => `${String(cell.x)},${String(cell.y)}`

/**
 * Las celdas que ocupan las zonas ubicadas hasta ahora.
 *
 * Separado de la lectura completa porque la búsqueda necesita preguntar por la
 * geometría de un plano a medio armar, donde todavía faltan zonas obligatorias.
 */
function occupiedCells(
  p: FloorParams,
  placements: readonly SpatialPlacement[],
): Map<string, string> {
  const occupied = new Map<string, string>()
  for (const placement of placements) {
    const zone = ZONES.find((entry) => entry.id === placement.objectId)
    if (zone === undefined) continue
    for (const cell of cellsOf(zone, placement))
      occupied.set(key(cell), zone.id)
  }
  return occupied
}

/** Lo que la geometría sola puede romper: salirse, pisarse o tapar lo reservado. */
function geometryFailure(
  p: FloorParams,
  placements: readonly SpatialPlacement[],
): 'fuera' | 'encima' | 'pasillo' | undefined {
  const occupied = new Set<string>()
  for (const placement of placements) {
    const zone = ZONES.find((entry) => entry.id === placement.objectId)
    if (zone === undefined) continue
    for (const cell of cellsOf(zone, placement)) {
      if (cell.x < 0 || cell.y < 0 || cell.x >= p.width || cell.y >= p.height)
        return 'fuera'
      if (occupied.has(key(cell))) return 'encima'
      occupied.add(key(cell))
    }
  }
  for (const cell of [p.door, ...p.corridor, ...p.blocked])
    if (occupied.has(key(cell))) return 'pasillo'
  return undefined
}

export interface FloorReading {
  readonly quality: SolutionQuality
  readonly seats: number
  /** Qué se rompió, para decirlo con nombre. */
  readonly failure?: 'fuera' | 'encima' | 'pasillo' | 'capacidad' | 'encerrada'
}

/**
 * La lectura completa de un plano.
 *
 * Todo en celdas enteras: acá no entra ni un píxel. La circulación se resuelve
 * caminando desde la puerta por las celdas libres, que es exactamente lo que
 * hace una persona.
 */
export function readFloor(
  p: FloorParams,
  placements: readonly SpatialPlacement[],
): FloorReading {
  const placed = placements.flatMap((placement) => {
    const zone = ZONES.find((entry) => entry.id === placement.objectId)
    return zone === undefined ? [] : [{ zone, placement }]
  })
  const seats = placed.reduce((total, entry) => total + entry.zone.seats, 0)

  const missing = ZONES.filter(
    (zone) =>
      !zone.optional && !placed.some((entry) => entry.zone.id === zone.id),
  ).length
  if (missing > 0) return { quality: 'invalid', seats, failure: 'fuera' }

  const geometry = geometryFailure(p, placements)
  if (geometry !== undefined)
    return { quality: 'invalid', seats, failure: geometry }
  const occupied = occupiedCells(p, placements)

  if (seats < p.guests)
    return { quality: 'invalid', seats, failure: 'capacidad' }

  // Circulación: se camina desde la puerta por las celdas libres, y cada zona
  // tiene que quedar pegada a alguna de ésas.
  const blocked = new Set(p.blocked.map(key))
  const free = (cell: GridCell): boolean =>
    cell.x >= 0 &&
    cell.y >= 0 &&
    cell.x < p.width &&
    cell.y < p.height &&
    !occupied.has(key(cell)) &&
    !blocked.has(key(cell))
  const seen = new Set<string>([key(p.door)])
  const queue: GridCell[] = [p.door]
  while (queue.length > 0) {
    const here = queue.shift()
    if (here === undefined) break
    for (const step of [
      { x: here.x + 1, y: here.y },
      { x: here.x - 1, y: here.y },
      { x: here.x, y: here.y + 1 },
      { x: here.x, y: here.y - 1 },
    ])
      if (free(step) && !seen.has(key(step))) {
        seen.add(key(step))
        queue.push(step)
      }
  }
  const reachable = placed.every((entry) =>
    cellsOf(entry.zone, entry.placement).some((cell) =>
      [
        { x: cell.x + 1, y: cell.y },
        { x: cell.x - 1, y: cell.y },
        { x: cell.x, y: cell.y + 1 },
        { x: cell.x, y: cell.y - 1 },
      ].some((step) => seen.has(key(step))),
    ),
  )
  if (!reachable) return { quality: 'invalid', seats, failure: 'encerrada' }

  // Escalera escrita sobre hechos del salón, no sobre cuántas zonas se
  // pusieron: primero que entre y se circule, después que sobre lugar para una
  // mesa más de la que hace falta, y recién después que entre la barra.
  const spare = seats >= p.guests + SEATS_PER_TABLE
  const bar = placed.some((entry) => entry.zone.id === 'barra')
  return {
    quality:
      spare && bar ? 'optimal' : spare || bar ? 'efficient' : 'functional',
    seats,
  }
}

/** Lo que sienta una mesa. El margen de capacidad se mide en mesas enteras. */
export const SEATS_PER_TABLE = 8

/**
 * Búsqueda acotada de witnesses de cada nivel.
 *
 * Qué zonas entran decide el nivel que un plano válido puede alcanzar, así que
 * primero se elige el subconjunto y después se lo ubica en profundidad. El
 * presupuesto de nodos existe para que un plano imposible no cuelgue la
 * autoría: si se agota, la variante se rechaza en vez de aprobarse a medias.
 */
export function floorSearch(
  p: FloorParams,
  budget = 6_000,
): {
  readonly witnesses: Readonly<
    Record<'optimal' | 'efficient' | 'functional', readonly SpatialPlacement[]>
  >
  readonly exhausted: boolean
} {
  const witnesses: Record<
    'optimal' | 'efficient' | 'functional',
    readonly SpatialPlacement[]
  > = { optimal: [], efficient: [], functional: [] }
  const stage = ZONES.filter((zone) => zone.seats === 0 && zone.id !== 'barra')
  const tables = ZONES.filter((zone) => zone.seats > 0)
  const bar = ZONES.filter((zone) => zone.id === 'barra')
  // Cuántas mesas hacen falta para sentar a la gente, y cuántas para que sobre
  // una. El subconjunto de cada nivel sale de ahí, así que la búsqueda no
  // recorre combinaciones que nunca podrían dar ese nivel.
  const needed = Math.ceil(p.guests / SEATS_PER_TABLE)
  const subsets = {
    functional: [...stage, ...tables.slice(0, needed)],
    efficient: [...stage, ...tables.slice(0, needed + 1)],
    optimal: [...stage, ...tables.slice(0, needed + 1), ...bar],
  } as const

  let exhausted = false
  for (const tier of ['functional', 'efficient', 'optimal'] as const) {
    const subset = subsets[tier]
    if (subset.length > ZONES.length) continue
    let nodes = 0
    const visit = (
      index: number,
      placed: readonly SpatialPlacement[],
    ): boolean => {
      if (nodes > budget) {
        exhausted = true
        return false
      }
      nodes += 1
      const zone = subset[index]
      if (zone === undefined) {
        if (readFloor(p, placed).quality !== tier) return false
        witnesses[tier] = placed
        return true
      }
      const rotations: readonly (0 | 90)[] = zone.rotatable ? [0, 90] : [0]
      for (const rotation of rotations) {
        const { w, h } = footprint(zone, rotation)
        for (let y = 0; y + h <= p.height; y++)
          for (let x = 0; x + w <= p.width; x++) {
            const next = [...placed, { objectId: zone.id, x, y, rotation }]
            // Poda: salirse, pisarse o tapar el pasillo no se arregla
            // agregando zonas. La capacidad y la circulación no se podan acá:
            // las dos pueden cambiar con lo que falta.
            if (geometryFailure(p, next) !== undefined) continue
            if (visit(index + 1, next)) return true
            if (exhausted) return false
          }
      }
      return false
    }
    visit(0, [])
    if (exhausted) break
  }
  return { witnesses, exhausted }
}

const SHAPES = ['salon-angosto', 'puerta-al-medio', 'con-columnas'] as const
const SIZES = [
  { width: 8, height: 6 },
  { width: 9, height: 6 },
  { width: 7, height: 7 },
  { width: 6, height: 5 },
] as const
const DOORS = [
  { x: 0, y: 2 },
  { x: 4, y: 0 },
  { x: 0, y: 0 },
] as const
const GUESTS = [8, 16, 24] as const
const BLOCKS = [
  [],
  [{ x: 3, y: 3 }],
  [
    { x: 5, y: 1 },
    { x: 5, y: 4 },
  ],
] as const
const CELL_CM = [100, 150] as const
const RADICES = [
  SHAPES.length,
  SIZES.length,
  DOORS.length,
  GUESTS.length,
  BLOCKS.length,
  CELL_CM.length,
]
export const FLOOR_SPACE = spaceOf(RADICES)

export function generateFloor(index: number): FloorParams {
  const axes = candidateAxes(index, RADICES, 175)
  const shape = at(SHAPES, digit(axes, 0))
  const size = at(SIZES, digit(axes, 1))
  const door = at(DOORS, digit(axes, 2))
  const guests = at(GUESTS, digit(axes, 3))
  // La forma decide la firma del salón: angosto, con la puerta al medio del
  // lado largo, o con columnas en el medio. Ninguna se muestra, así que dos
  // formas que produjeran el mismo salón serían el mismo salón dos veces.
  const width =
    shape === 'salon-angosto' ? Math.max(6, size.width - 1) : size.width
  const height = shape === 'salon-angosto' ? size.height : size.height
  const placedDoor =
    shape === 'puerta-al-medio'
      ? { x: 0, y: Math.floor(height / 2) }
      : { x: Math.min(door.x, width - 1), y: Math.min(door.y, height - 1) }
  // El pasillo sale de la puerta hacia adentro y no se puede tapar.
  const corridor =
    placedDoor.x === 0
      ? [
          { x: 1, y: placedDoor.y },
          { x: 2, y: placedDoor.y },
        ]
      : [
          { x: placedDoor.x, y: 1 },
          { x: placedDoor.x, y: 2 },
        ]
  return floorSchema.parse({
    shape,
    width,
    height,
    cellCentimeters: at(CELL_CM, digit(axes, 5)),
    guests,
    door: placedDoor,
    corridor,
    blocked: (shape === 'con-columnas'
      ? [
          { x: 3, y: 2 },
          { x: 5, y: 3 },
        ]
      : at(BLOCKS, digit(axes, 4))
    )
      .filter((entry) => entry.x < width && entry.y < height)
      .map((entry) => ({ ...entry })),
  })
}

export function floorGates(p: FloorParams): readonly string[] {
  const issues: string[] = []
  const found = floorSearch(p)
  if (found.exhausted) return ['la búsqueda de witnesses se quedó sin nodos']
  const tiers = (['optimal', 'efficient', 'functional'] as const).map(
    (tier) => ({
      quality: found.witnesses[tier].length > 0 ? tier : ('invalid' as const),
    }),
  )
  issues.push(...tierWitnessIssues(tiers))

  // LOCKED: la capacidad decide. El plano mínimo tiene que quedarse corto si
  // se le saca una mesa, o contar los lugares no haría falta.
  const minimum = found.witnesses.functional
  if (minimum.length > 0) {
    const tables = minimum.filter((placement) => {
      const zone = ZONES.find((entry) => entry.id === placement.objectId)
      return zone !== undefined && zone.seats > 0
    })
    const dropped = tables[tables.length - 1]
    const withoutOne =
      dropped === undefined
        ? minimum
        : minimum.filter((placement) => placement !== dropped)
    if (readFloor(p, withoutOne).failure !== 'capacidad')
      issues.push('sacar una mesa no deja el salón corto de lugares')
  }

  // El pasillo tiene que estar donde estorbe: sin celdas reservadas adentro
  // del salón, la circulación es decorado.
  if (p.corridor.length === 0) issues.push('el salón no tiene pasillo')

  // Y tapar el pasillo tiene que invalidar el plano de verdad.
  const corridorCell = p.corridor[0] ?? p.door
  const blockedCorridor = geometryFailure(p, [
    { objectId: 'mesa-a', x: corridorCell.x, y: corridorCell.y, rotation: 0 },
  ])
  if (blockedCorridor !== 'pasillo' && blockedCorridor !== 'fuera')
    issues.push('tapar el pasillo no invalida el plano')
  return issues
}

export function evaluateFloor(
  p: FloorParams,
  placements: readonly SpatialPlacement[],
) {
  if (
    new Set(placements.map((entry) => entry.objectId)).size !==
      placements.length ||
    placements.some(
      (entry) => !ZONES.some((zone) => zone.id === entry.objectId),
    )
  )
    return err({
      kind: 'invalid-answer' as const,
      detail: 'zona repetida o fuera de contrato',
    })

  const read = readFloor(p, placements)
  return ok(
    outcome(
      read.quality,
      {
        outcomeKey: `event-floor-plan.${p.shape}.${read.quality}`,
        stamp: read.quality === 'invalid' ? 'No entra' : 'Armado',
        facts: [
          { label: 'Vienen', value: `${String(p.guests)} personas` },
          { label: 'Sientan', value: `${String(read.seats)} personas` },
          {
            label: 'Zonas puestas',
            value: String(placements.length),
          },
        ],
        ...(read.quality === 'invalid'
          ? {
              violatedConstraint:
                read.failure === 'capacidad'
                  ? `Las mesas puestas sientan ${String(read.seats)} y vienen ${String(p.guests)}.`
                  : read.failure === 'pasillo'
                    ? 'Algo quedó encima de la puerta, del pasillo o de una columna.'
                    : read.failure === 'encerrada'
                      ? 'Una zona quedó encerrada: no se llega caminando desde la puerta.'
                      : read.failure === 'encima'
                        ? 'Dos zonas quedaron una encima de la otra.'
                        : 'Falta una zona o algo quedó fuera del salón.',
            }
          : {}),
        consequence:
          read.quality === 'invalid'
            ? 'Con ese plano el salón no se puede usar así.'
            : read.quality === 'optimal'
              ? 'Entra todo el mundo, se circula y encima entraron las dos zonas de más.'
              : 'El salón funciona: la gente entra, se sienta y puede moverse.',
      },
      {},
      [{ flag: 'y4.floorPlan.outcome', value: read.quality }],
    ),
  )
}

export const floorVariants = generatedSource({
  id: 'y4.event-floor-plan.capacity',
  version: '1',
  schema: floorSchema,
  size: FLOOR_SPACE,
  generate: generateFloor,
  gates: floorGates,
})

const EVENT_FAMILY = toScenarioFamilyId('evento-escolar')

const eventFloorPlanDefinition: ChallengeDefinition = defineChallenge<
  FloorParams,
  FloorParams
>({
  id: toChallengeId('y4.event-floor-plan'),
  family: EVENT_FAMILY,
  placement: 'anchor',
  variants: authoredVariantIds(floorVariants.authored),
  variantSource: floorVariants,
  interaction: 'spatial-layout',
  stages: ['year-4'],
  categories: ['space-and-shape', 'optimization-and-constraints'],
  baseDifficulty: 4,
  // Dos relaciones encadenadas —celdas que son capacidad, y capacidad que
  // decide qué zonas entran—, tres restricciones a la vez, elegir qué zonas
  // van, optimizar la ubicación y construir la respuesta: carga 8, STRETCH.
  cognitive: {
    steps: 2,
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
    chronology: 50,
    eventCluster: 'evento-escolar',
  },
  scoring: {
    math: 'discrete-quality',
    team: 'none',
    aura: 'none',
    rationale:
      'La cuenta es área, capacidad y circulación: cuánta gente sientan las mesas que entran y si se llega caminando a cada zona. No hay Equipo ni Aura: ubicar mesas no es un gesto social.',
  },
  tools: ['notepad', 'ruler'],
  generate: ({ params }) => parameters(floorSchema, params),
  verify: (p) => (p.corridor.length > 0 ? [] : ['el salón no tiene pasillo']),
  narrate: () => ({
    title: 'El salón del evento',
    setup:
      'El salón tiene una puerta, un pasillo que no se puede tapar y gente que va a venir a sentarse.',
    goal: 'Ubicá las zonas: que entren todos, que se pueda circular y que entre lo que se pueda de más.',
  }),
  present: (p) => ({
    kind: 'spatial-layout',
    instructions:
      'Elegí dónde va cada zona. El pasillo de la puerta queda libre siempre.',
    data: [
      {
        label: 'Vienen',
        value: String(p.guests),
        unit: 'personas',
        constraint: true,
      },
      { label: 'Cada mesa sienta', value: '8', unit: 'personas' },
      {
        label: 'Salón',
        value: `${String(p.width)} × ${String(p.height)}`,
        unit: `celdas de ${String(p.cellCentimeters)} cm`,
        span: 2,
      },
    ],
    width: p.width,
    height: p.height,
    cellCentimeters: p.cellCentimeters,
    blocked: p.blocked.map((cell) => ({ x: cell.x, y: cell.y })),
    clearance: p.corridor.map((cell) => ({ x: cell.x, y: cell.y })),
    entrances: [{ x: p.door.x, y: p.door.y }],
    objects: ZONES.map((zone) => ({
      id: zone.id,
      label: zone.label,
      code: zone.code,
      widthCells: zone.width,
      heightCells: zone.height,
      detail:
        zone.seats > 0
          ? `${String(zone.width)} × ${String(zone.height)} · sienta ${String(zone.seats)}`
          : `${String(zone.width)} × ${String(zone.height)} · no sienta gente`,
      rotatable: zone.rotatable,
      optional: zone.optional,
    })),
  }),
  evaluate: (p, answer: InteractionAnswer) =>
    answer.kind === 'spatial-layout'
      ? evaluateFloor(p, answer.placements)
      : err({ kind: 'invalid-answer', detail: 'se esperaba un plano' }),
})

/** Con nota por calidad (10/8/6/4). Ver `src/content/grades.ts`. */
export const eventFloorPlan = graded(eventFloorPlanDefinition)

/* -------------------------------------------------------------------------
 * Repaso: cuánta gente entra en el espacio que queda.
 * ---------------------------------------------------------------------- */

export const capacityReviewSchema = z
  .strictObject({
    width: z.number().int().min(5).max(12),
    height: z.number().int().min(4).max(10),
    /** Celdas que no se pueden usar: pasillo, puerta y columnas. */
    reserved: z.number().int().min(2).max(20),
  })
  .refine(
    (p) => p.reserved < p.width * p.height - 8,
    'no queda casi nada libre',
  )
export type CapacityReviewParams = z.infer<typeof capacityReviewSchema>

/** Mesas enteras que entran en lo que queda libre, y la gente que sientan. */
export function seatsThatFit(p: CapacityReviewParams): number {
  return Math.floor((p.width * p.height - p.reserved) / 4) * SEATS_PER_TABLE
}

const REVIEW_WIDTHS = [6, 7, 8, 9] as const
const REVIEW_HEIGHTS = [5, 6, 7] as const
const REVIEW_RESERVED = [3, 5, 6, 8] as const
const REVIEW_RADICES = [
  REVIEW_WIDTHS.length,
  REVIEW_HEIGHTS.length,
  REVIEW_RESERVED.length,
]
export const CAPACITY_REVIEW_SPACE = spaceOf(REVIEW_RADICES)

export function generateCapacityReview(index: number): CapacityReviewParams {
  const axes = candidateAxes(index, REVIEW_RADICES, 23)
  return capacityReviewSchema.parse({
    width: at(REVIEW_WIDTHS, digit(axes, 0)),
    height: at(REVIEW_HEIGHTS, digit(axes, 1)),
    reserved: at(REVIEW_RESERVED, digit(axes, 2)),
  })
}

export function capacityReviewGates(
  p: CapacityReviewParams,
): readonly string[] {
  const issues: string[] = []
  const free = p.width * p.height - p.reserved
  // Si las celdas reservadas no cambian la cuenta, el Repaso deja de tocar el
  // paso que vino a reparar: olvidarse del pasillo daría lo mismo.
  if (Math.floor(free / 4) === Math.floor((p.width * p.height) / 4))
    issues.push('olvidarse de lo reservado da la misma respuesta')
  if (seatsThatFit(p) < 16) issues.push('entran muy pocas mesas')
  return issues
}

export function evaluateCapacityReview(p: CapacityReviewParams, value: string) {
  if (!/^\d{1,4}$/u.test(value))
    return err({
      kind: 'invalid-answer' as const,
      detail: 'se esperaba una cantidad entera de personas',
    })
  const answered = Number(value)
  const exact = seatsThatFit(p)
  const ignoringReserved =
    Math.floor((p.width * p.height) / 4) * SEATS_PER_TABLE
  const quality: SolutionQuality =
    answered === exact
      ? 'optimal'
      : // Contar el salón entero, sin descontar el pasillo: la cuenta está
        // bien hecha sobre un espacio que no existe.
        answered === ignoringReserved
        ? 'functional'
        : Math.abs(answered - exact) <= SEATS_PER_TABLE
          ? 'efficient'
          : 'invalid'
  return ok(
    outcome(quality, {
      outcomeKey: `spatial-capacity-review.${quality}`,
      stamp: quality === 'optimal' ? 'Justo' : 'Cerca',
      facts: [
        {
          label: 'Salón',
          value: `${String(p.width)} × ${String(p.height)} = ${String(p.width * p.height)}`,
        },
        { label: 'Reservado', value: String(p.reserved) },
        {
          label: 'Queda libre',
          value: String(p.width * p.height - p.reserved),
        },
      ],
      ...(quality === 'optimal'
        ? {
            optimalComparison:
              'Primero se descuenta lo que no se puede usar, después se ve cuántas mesas enteras entran, y recién ahí se cuenta la gente.',
          }
        : {}),
      ...(quality === 'functional'
        ? {
            violatedConstraint: `El pasillo, la puerta y las columnas ocupan ${String(p.reserved)} celdas que no se pueden usar.`,
          }
        : {}),
      consequence:
        quality === 'optimal'
          ? 'Con eso ya sabés cuánta gente podés sentar.'
          : answered > exact
            ? 'Contar de más deja gente parada el día del evento.'
            : 'Entra más gente de la que contaste: quedan lugares sin usar.',
    }),
  )
}

export const capacityReviewVariants = generatedSource({
  id: 'y4.spatial-capacity-review.fits',
  version: '1',
  schema: capacityReviewSchema,
  size: CAPACITY_REVIEW_SPACE,
  generate: generateCapacityReview,
  gates: capacityReviewGates,
})

export const spatialCapacityReview: ChallengeDefinition = defineChallenge<
  CapacityReviewParams,
  CapacityReviewParams
>({
  id: toChallengeId('y4.spatial-capacity-review'),
  family: EVENT_FAMILY,
  placement: 'recovery',
  variants: authoredVariantIds(capacityReviewVariants.authored),
  variantSource: capacityReviewVariants,
  interaction: 'numeric-input',
  stages: ['year-4'],
  categories: ['space-and-shape', 'quantity'],
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
    primaryReasoningFamily: 'SPATIAL',
    interactionEngine: 'spatial-graph',
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
  generate: ({ params }) => parameters(capacityReviewSchema, params),
  verify: (p) => capacityReviewGates(p),
  narrate: () => ({
    title: 'Cuánta gente entra',
    setup:
      'Antes de volver al plano, una sola cuenta: cuánto espacio queda de verdad.',
    goal: 'Decí cuánta gente se puede sentar.',
  }),
  present: (p) => ({
    kind: 'numeric-input',
    data: [
      {
        label: 'Salón',
        value: `${String(p.width)} × ${String(p.height)}`,
        unit: 'celdas',
      },
      {
        label: 'Pasillo y columnas',
        value: String(p.reserved),
        unit: 'celdas que no se usan',
        constraint: true,
      },
      {
        label: 'Cada mesa',
        value: '4 celdas',
        unit: `sienta ${String(SEATS_PER_TABLE)} personas`,
        span: 2,
      },
    ],
    unitLabel: 'personas',
    min: '0',
    max: '400',
    step: '1',
  }),
  evaluate: (p, answer: InteractionAnswer) =>
    answer.kind === 'numeric-input'
      ? evaluateCapacityReview(p, answer.value)
      : err({ kind: 'invalid-answer', detail: 'se esperaba un número' }),
})
