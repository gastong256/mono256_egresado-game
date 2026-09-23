/**
 * 1.º · Un aula que funcione (`y1.classroom-layout`) y su Repaso
 * (`y1.scale-fit-review`).
 *
 * Geometría discreta sobre celdas. Cada objeto trae medidas reales en
 * centímetros; la escala del plano las convierte en una huella de celdas
 * enteras. El evaluador trabaja con coordenadas enteras del plano y con un
 * grafo de celdas libres para la circulación: ninguna posición de píxel ni del
 * DOM entra a este módulo.
 *
 * El aula es STRETCH por restricciones simultáneas —límites, huellas sin
 * superponerse, columnas, pasillos y puertas libres, recorrido conectado y
 * lugares suficientes—, selección de información —la altura de cada objeto no
 * importa para el piso— y construcción; no por currículo posterior. El Repaso
 * aísla representación ↔ medida real + encastre en una sola pared.
 */
import { z } from 'zod'
import {
  authoredVariantIds,
  defineChallenge,
  divide,
  err,
  fromInteger,
  ok,
  toChallengeId,
  toScenarioFamilyId,
  type InteractionAnswer,
  type SolutionQuality,
  type SpatialPlacement,
} from '@/game'
import { medida } from '@/content/numeros'
import {
  at,
  candidateAxes,
  digit,
  generatedSource,
  outcome,
  parameters,
  spaceOf,
  tierWitnessIssues,
} from '../authoring'
import { graded } from '../../grades'

const cellSchema = z.strictObject({
  x: z.number().int().min(0).max(11),
  y: z.number().int().min(0).max(7),
})
const OBJECT_IDS = [
  'stage',
  'long-table',
  'table-a',
  'table-b',
  'materials',
  'shelf',
  'box',
] as const
const objectSchema = z.strictObject({
  id: z.enum(OBJECT_IDS),
  label: z.string().min(1).max(32),
  code: z.string().min(1).max(4),
  widthCm: z.number().int().min(25).max(1200),
  depthCm: z.number().int().min(25).max(1200),
  /** Printed but irrelevant to a floor plan: part of the selection trait. */
  heightCm: z.number().int().min(10).max(250),
  seats: z.number().int().min(0).max(8),
  optional: z.boolean(),
  rotatable: z.boolean(),
})
export const layoutSchema = z
  .strictObject({
    kind: z.enum(['room', 'strip']),
    shape: z.enum([
      'central-aisle',
      'corner-door',
      'columns',
      'two-doors',
      'wall-fit',
    ]),
    width: z.number().int().min(4).max(12),
    height: z.number().int().min(1).max(8),
    cellCm: z.union([z.literal(25), z.literal(50), z.literal(100)]),
    requiredSeats: z.number().int().min(0).max(16),
    targetSeats: z.number().int().min(0).max(16),
    blocked: z.array(cellSchema).max(24),
    aisle: z.array(cellSchema).max(24),
    doors: z.array(cellSchema).max(2),
    objects: z.array(objectSchema).min(2).max(5),
  })
  .refine(
    (p) =>
      p.objects.every(
        (object) =>
          object.widthCm % p.cellCm === 0 && object.depthCm % p.cellCm === 0,
      ),
    'una medida no es un múltiplo entero de la escala',
  )
  .refine(
    (p) =>
      new Set(p.objects.map((object) => object.id)).size === p.objects.length,
    'objeto repetido',
  )
  .refine(
    (p) =>
      [...p.blocked, ...p.aisle, ...p.doors].every(
        (cell) => cell.x < p.width && cell.y < p.height,
      ),
    'celda editorial fuera del plano',
  )
  .refine((p) => p.targetSeats >= p.requiredSeats, 'ideal menor que el mínimo')
export type LayoutParams = z.infer<typeof layoutSchema>
type LayoutObject = LayoutParams['objects'][number]

const key = (x: number, y: number): string => `${String(x)},${String(y)}`

/** Footprint in cells, from real centimetres and the plan's scale. */
function footprint(
  p: LayoutParams,
  object: LayoutObject,
  rotation: 0 | 90,
): { readonly w: number; readonly h: number } {
  const across = rotation === 90 ? object.depthCm : object.widthCm
  const deep = rotation === 90 ? object.widthCm : object.depthCm
  return { w: across / p.cellCm, h: deep / p.cellCm }
}

function metres(centimetres: number): string {
  return medida(divide(fromInteger(centimetres), fromInteger(100)), 2)
}

const ROOM_SHAPES = [
  'central-aisle',
  'corner-door',
  'columns',
  'two-doors',
] as const
const ROOM_SIZES = [
  [7, 5],
  [8, 5],
  [7, 6],
  [8, 6],
] as const
const ROOM_CELLS = [50, 100] as const
const SEATINGS = [
  { long: 4, small: 2, required: 6, target: 8 },
  { long: 4, small: 2, required: 4, target: 6 },
  { long: 6, small: 2, required: 8, target: 10 },
] as const
const ROOM_RADICES = [ROOM_SHAPES.length, ROOM_SIZES.length, 2, 3, 2]
export const LAYOUT_SPACE = spaceOf(ROOM_RADICES)

export function generateLayout(index: number): LayoutParams {
  const axes = candidateAxes(index, ROOM_RADICES, 35)
  const shape = at(ROOM_SHAPES, digit(axes, 0))
  const [width, height] = at(ROOM_SIZES, digit(axes, 1))
  const cellCm = at(ROOM_CELLS, digit(axes, 2))
  const seating = at(SEATINGS, digit(axes, 3))
  const mirrored = digit(axes, 4) === 1
  const flip = (cell: { readonly x: number; readonly y: number }) => ({
    x: mirrored ? width - 1 - cell.x : cell.x,
    y: cell.y,
  })
  const middle = Math.floor(width / 2)
  const row = Math.floor(height / 2)
  const cells = {
    'central-aisle': {
      aisle: Array.from({ length: height }, (_, y) => ({ x: middle, y })),
      doors: [
        { x: middle, y: 0 },
        { x: middle, y: height - 1 },
      ],
      blocked: [],
    },
    'corner-door': {
      aisle: [
        { x: 1, y: 0 },
        { x: 2, y: 0 },
        { x: 2, y: 1 },
        { x: 2, y: 2 },
      ],
      doors: [{ x: 0, y: 0 }],
      blocked: [],
    },
    columns: {
      aisle: [],
      doors: [{ x: 0, y: height - 1 }],
      blocked: [
        { x: 2, y: 2 },
        { x: width - 3, y: 2 },
      ],
    },
    'two-doors': {
      aisle: [],
      doors: [
        { x: 0, y: row },
        { x: width - 1, y: row },
      ],
      blocked: [],
    },
  }[shape]
  return layoutSchema.parse({
    kind: 'room',
    shape,
    width,
    height,
    cellCm,
    requiredSeats: seating.required,
    targetSeats: seating.target,
    blocked: cells.blocked.map(flip),
    aisle: cells.aisle.map(flip),
    doors: cells.doors.map(flip),
    objects: [
      {
        id: 'stage',
        label: 'Zona de presentación',
        code: 'P',
        widthCm: 2 * cellCm,
        depthCm: 2 * cellCm,
        heightCm: 20,
        seats: 0,
        optional: false,
        rotatable: false,
      },
      {
        id: 'long-table',
        label: 'Mesa larga',
        code: 'L',
        widthCm: 3 * cellCm,
        depthCm: cellCm,
        heightCm: 75,
        seats: seating.long,
        optional: true,
        rotatable: true,
      },
      {
        id: 'table-a',
        label: 'Mesa A',
        code: 'A',
        widthCm: 2 * cellCm,
        depthCm: cellCm,
        heightCm: 75,
        seats: seating.small,
        optional: true,
        rotatable: true,
      },
      {
        id: 'table-b',
        label: 'Mesa B',
        code: 'B',
        widthCm: 2 * cellCm,
        depthCm: cellCm,
        heightCm: 75,
        seats: seating.small,
        optional: true,
        rotatable: true,
      },
      {
        id: 'materials',
        label: 'Caja de materiales',
        code: 'M',
        widthCm: cellCm,
        depthCm: cellCm,
        heightCm: 40,
        seats: 0,
        optional: true,
        rotatable: false,
      },
    ],
  })
}

const STRIP_CELLS = [25, 50, 100] as const
const STRIP_SETS = [
  [3, 2, 1],
  [4, 2, 2],
  [3, 3, 1],
  [5, 2, 1],
] as const
const STRIP_RADICES = [STRIP_CELLS.length, STRIP_SETS.length, 2]
export const SCALE_REVIEW_SPACE = spaceOf(STRIP_RADICES)

/**
 * One wall, three objects measured in real centimetres, one scale.
 *
 * The three fit exactly, or with one spare cell: including everything is
 * possible only by converting each length and packing without gaps.
 */
export function generateScaleReview(index: number): LayoutParams {
  const axes = candidateAxes(index, STRIP_RADICES, 5)
  const cellCm = at(STRIP_CELLS, digit(axes, 0))
  const [main, shelf, box] = at(STRIP_SETS, digit(axes, 1))
  const spare = digit(axes, 2)
  return layoutSchema.parse({
    kind: 'strip',
    shape: 'wall-fit',
    width: main + shelf + box + spare,
    height: 1,
    cellCm,
    requiredSeats: 0,
    targetSeats: 0,
    blocked: [],
    aisle: [],
    doors: [],
    objects: [
      {
        id: 'long-table',
        label: 'Mesa de la muestra',
        code: 'M',
        widthCm: main * cellCm,
        depthCm: cellCm,
        heightCm: 75,
        seats: 0,
        optional: false,
        rotatable: false,
      },
      {
        id: 'shelf',
        label: 'Estante',
        code: 'E',
        widthCm: shelf * cellCm,
        depthCm: cellCm,
        heightCm: 180,
        seats: 0,
        optional: true,
        rotatable: false,
      },
      {
        id: 'box',
        label: 'Caja',
        code: 'C',
        widthCm: box * cellCm,
        depthCm: cellCm,
        heightCm: 40,
        seats: 0,
        optional: true,
        rotatable: false,
      },
    ],
  })
}

interface Rect {
  readonly object: LayoutObject
  readonly x: number
  readonly y: number
  readonly w: number
  readonly h: number
}

interface Inspection {
  readonly violations: readonly string[]
  readonly rects: readonly Rect[]
  readonly seats: number
  readonly connected: boolean
}

/** The evaluator's view: a map of occupied cells and a breadth-first walk. */
function inspect(
  p: LayoutParams,
  placements: readonly SpatialPlacement[],
): Inspection {
  const violations: string[] = []
  const occupied = new Map<string, string>()
  const forbidden = new Set(
    [...p.blocked, ...p.aisle, ...p.doors].map((cell) => key(cell.x, cell.y)),
  )
  const rects: Rect[] = []
  for (const object of p.objects) {
    const placement = placements.find((entry) => entry.objectId === object.id)
    if (placement === undefined) {
      if (!object.optional) violations.push(`Falta ${object.label}.`)
      continue
    }
    const { w, h } = footprint(p, object, placement.rotation)
    if (placement.x + w > p.width || placement.y + h > p.height)
      violations.push(`${object.label} se sale del plano.`)
    for (let dy = 0; dy < h; dy++)
      for (let dx = 0; dx < w; dx++) {
        const cell = key(placement.x + dx, placement.y + dy)
        if (occupied.has(cell))
          violations.push(`${object.label} se superpone con otro objeto.`)
        if (forbidden.has(cell))
          violations.push(
            `${object.label} ocupa una columna, un pasillo o una puerta.`,
          )
        occupied.set(cell, object.id)
      }
    rects.push({ object, x: placement.x, y: placement.y, w, h })
  }
  const seats = rects.reduce((total, rect) => total + rect.object.seats, 0)
  if (seats < p.requiredSeats)
    violations.push(
      `Hay ${String(seats)} lugares y hacen falta ${String(p.requiredSeats)}.`,
    )

  let connected = true
  if (p.doors.length > 0) {
    const walls = new Set(p.blocked.map((cell) => key(cell.x, cell.y)))
    const open = (x: number, y: number) =>
      x >= 0 &&
      y >= 0 &&
      x < p.width &&
      y < p.height &&
      !walls.has(key(x, y)) &&
      !occupied.has(key(x, y))
    const reached = new Set<string>()
    const queue = p.doors.slice(0, 1).filter((door) => open(door.x, door.y))
    for (let i = 0; i < queue.length; i++) {
      const cell = queue[i]
      if (cell === undefined || reached.has(key(cell.x, cell.y))) continue
      reached.add(key(cell.x, cell.y))
      for (const [dx, dy] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ] as const)
        if (open(cell.x + dx, cell.y + dy))
          queue.push({ x: cell.x + dx, y: cell.y + dy })
    }
    if (p.doors.some((door) => !reached.has(key(door.x, door.y)))) {
      connected = false
      violations.push('Las puertas quedaron desconectadas.')
    }
    for (const rect of rects) {
      const around = [
        ...Array.from({ length: rect.w }, (_, i) => [
          [rect.x + i, rect.y - 1],
          [rect.x + i, rect.y + rect.h],
        ]).flat(),
        ...Array.from({ length: rect.h }, (_, i) => [
          [rect.x - 1, rect.y + i],
          [rect.x + rect.w, rect.y + i],
        ]).flat(),
      ]
      if (!around.some(([x, y]) => reached.has(key(x ?? -1, y ?? -1)))) {
        connected = false
        violations.push(
          `No se puede llegar a ${rect.object.label} desde la puerta.`,
        )
      }
    }
  }
  return { violations: [...new Set(violations)], rects, seats, connected }
}

function qualityOf(p: LayoutParams, found: Inspection): SolutionQuality {
  if (found.violations.length > 0) return 'invalid'
  if (p.kind === 'strip') {
    const extras = found.rects.filter((rect) => rect.object.optional).length
    return extras === 2 ? 'optimal' : extras === 1 ? 'efficient' : 'functional'
  }
  if (found.seats < p.targetSeats) return 'functional'
  return found.rects.some((rect) => rect.object.id === 'materials')
    ? 'optimal'
    : 'efficient'
}

/**
 * Independent oracle for any placement set.
 *
 * A character matrix, a depth-first stack and its own ladder: no code shared
 * with `inspect`. Property tests compare the two on arbitrary answers.
 */
export function layoutOracle(
  p: LayoutParams,
  placements: readonly SpatialPlacement[],
): SolutionQuality {
  const board = Array.from({ length: p.height }, () =>
    Array.from({ length: p.width }, () => '.'),
  )
  for (const cell of p.blocked) board[cell.y]![cell.x] = '#'
  const reserved = new Set([...p.aisle, ...p.doors].map((c) => c.y * 100 + c.x))
  let seats = 0
  const boxes: {
    x: number
    y: number
    w: number
    h: number
    optional: boolean
    id: string
  }[] = []
  for (const object of p.objects) {
    const placed = placements.find((entry) => entry.objectId === object.id)
    if (placed === undefined) {
      if (!object.optional) return 'invalid'
      continue
    }
    const w =
      (placed.rotation === 90 ? object.depthCm : object.widthCm) / p.cellCm
    const h =
      (placed.rotation === 90 ? object.widthCm : object.depthCm) / p.cellCm
    if (
      placed.x < 0 ||
      placed.y < 0 ||
      placed.x + w > p.width ||
      placed.y + h > p.height
    )
      return 'invalid'
    for (let y = placed.y; y < placed.y + h; y++)
      for (let x = placed.x; x < placed.x + w; x++) {
        if (board[y]![x] !== '.' || reserved.has(y * 100 + x)) return 'invalid'
        board[y]![x] = 'o'
      }
    seats += object.seats
    boxes.push({
      x: placed.x,
      y: placed.y,
      w,
      h,
      optional: object.optional,
      id: object.id,
    })
  }
  if (seats < p.requiredSeats) return 'invalid'
  const firstDoor = p.doors[0]
  if (firstDoor !== undefined) {
    const seen = board.map((line) => line.map(() => false))
    const stack = [firstDoor]
    while (stack.length > 0) {
      const { x, y } = stack.pop()!
      if (x < 0 || y < 0 || x >= p.width || y >= p.height) continue
      if (seen[y]![x] || board[y]![x] !== '.') continue
      seen[y]![x] = true
      stack.push(
        { x: x + 1, y },
        { x: x - 1, y },
        { x, y: y + 1 },
        { x, y: y - 1 },
      )
    }
    if (p.doors.some((door) => !seen[door.y]?.[door.x])) return 'invalid'
    const touches = (b: (typeof boxes)[number]) => {
      for (let x = b.x; x < b.x + b.w; x++)
        if (seen[b.y - 1]?.[x] === true || seen[b.y + b.h]?.[x] === true)
          return true
      for (let y = b.y; y < b.y + b.h; y++)
        if (seen[y]?.[b.x - 1] === true || seen[y]?.[b.x + b.w] === true)
          return true
      return false
    }
    if (!boxes.every(touches)) return 'invalid'
  }
  if (p.kind === 'strip') {
    const extras = boxes.filter((b) => b.optional).length
    return extras > 1 ? 'optimal' : extras > 0 ? 'efficient' : 'functional'
  }
  if (seats < p.targetSeats) return 'functional'
  return boxes.some((b) => b.id === 'materials') ? 'optimal' : 'efficient'
}

type WitnessTier = 'optimal' | 'efficient' | 'functional'

/** The tier a set of included objects reaches when it is placed validly. */
function tierOfSubset(
  p: LayoutParams,
  subset: readonly LayoutObject[],
): SolutionQuality {
  if (
    subset.some((object) => !object.optional) !==
    p.objects.some((object) => !object.optional)
  )
    return 'invalid'
  if (p.kind === 'strip') {
    const extras = subset.filter((object) => object.optional).length
    return extras === 2 ? 'optimal' : extras === 1 ? 'efficient' : 'functional'
  }
  const seats = subset.reduce((total, object) => total + object.seats, 0)
  if (seats < p.requiredSeats) return 'invalid'
  if (seats < p.targetSeats) return 'functional'
  return subset.some((object) => object.id === 'materials')
    ? 'optimal'
    : 'efficient'
}

/**
 * Bounded search for witnesses of every tier.
 *
 * Which objects are included decides the tier a valid placement reaches, so
 * the search first picks a subset for the tier it still needs and then places
 * that subset depth-first. Overlap, reserved cells and — because blocking only
 * grows as objects are added — partial connectivity prune early. Every
 * witness is confirmed by the independent oracle; the search stops once each
 * tier has enough of them or the node budget runs out, and says which.
 */
export function layoutSearch(
  p: LayoutParams,
  perTier = 2,
  budget = 60_000,
): {
  readonly witnesses: Readonly<
    Record<WitnessTier, readonly (readonly SpatialPlacement[])[]>
  >
  readonly exhausted: boolean
} {
  const witnesses: Record<WitnessTier, (readonly SpatialPlacement[])[]> = {
    optimal: [],
    efficient: [],
    functional: [],
  }
  const wanted: Record<WitnessTier, number> = {
    optimal: perTier,
    efficient: 1,
    functional: 1,
  }
  const optional = p.objects.filter((object) => object.optional)
  const mandatory = p.objects.filter((object) => !object.optional)
  let nodes = 0
  let exhausted = false

  for (let mask = (1 << optional.length) - 1; mask >= 0; mask--) {
    const subset = [
      ...mandatory,
      ...optional.filter((_, i) => (mask & (1 << i)) !== 0),
    ]
    const tier = tierOfSubset(p, subset)
    if (tier === 'invalid' || witnesses[tier].length >= wanted[tier]) continue
    const bucket = witnesses[tier]
    const visit = (
      index: number,
      placed: readonly SpatialPlacement[],
    ): void => {
      if (exhausted || bucket.length >= wanted[tier]) return
      nodes += 1
      if (nodes > budget) {
        exhausted = true
        return
      }
      const object = subset[index]
      if (object === undefined) {
        if (layoutOracle(p, placed) === tier) bucket.push(placed)
        return
      }
      const rotations: readonly (0 | 90)[] =
        object.rotatable && object.widthCm !== object.depthCm ? [0, 90] : [0]
      for (const rotation of rotations) {
        const { w, h } = footprint(p, object, rotation)
        for (let y = 0; y + h <= p.height; y++)
          for (let x = 0; x + w <= p.width; x++) {
            const next = [...placed, { objectId: object.id, x, y, rotation }]
            if (partialFits(p, next)) visit(index + 1, next)
            if (exhausted || bucket.length >= wanted[tier]) return
          }
      }
    }
    visit(0, [])
    if (exhausted) break
  }
  return { witnesses, exhausted }
}

/** Placement so far is still extendable: fits, and nothing is cut off yet. */
function partialFits(
  p: LayoutParams,
  placed: readonly SpatialPlacement[],
): boolean {
  const found = inspect(p, placed)
  return found.violations.every(
    (text) => text.startsWith('Falta ') || text.startsWith('Hay '),
  )
}

export function layoutWitness(
  p: LayoutParams,
  quality: 'optimal' | 'efficient' | 'functional',
): readonly SpatialPlacement[] {
  const witness = layoutSearch(p).witnesses[quality][0]
  if (witness === undefined)
    throw new Error(`no ${quality} witness for this layout`)
  return witness
}

/** A row-major packing that ignores aisles, doors and circulation. */
function naivePacking(p: LayoutParams): readonly SpatialPlacement[] {
  const placed: SpatialPlacement[] = []
  for (const object of p.objects) {
    const { w, h } = footprint(p, object, 0)
    search: for (let y = 0; y + h <= p.height; y++)
      for (let x = 0; x + w <= p.width; x++) {
        const next = [
          ...placed,
          { objectId: object.id, x, y, rotation: 0 as const },
        ]
        const overlaps = inspect(
          { ...p, aisle: [], doors: [], requiredSeats: 0 },
          next,
        ).violations.some((text) => /superpone|se sale|columna/u.test(text))
        if (!overlaps) {
          placed.push({ objectId: object.id, x, y, rotation: 0 })
          break search
        }
      }
  }
  return placed
}

export function layoutGates(p: LayoutParams): readonly string[] {
  const search = layoutSearch(p)
  const issues: string[] = []
  if (search.exhausted)
    issues.push('búsqueda de witnesses agotada: variante no probada')
  const plans = [
    ...search.witnesses.optimal.map(() => ({ quality: 'optimal' as const })),
    ...search.witnesses.efficient.map(() => ({
      quality: 'efficient' as const,
    })),
    ...search.witnesses.functional.map(() => ({
      quality: 'functional' as const,
    })),
  ]
  issues.push(...tierWitnessIssues(plans))
  if (search.witnesses.optimal.length < 2)
    issues.push('una sola disposición óptima')
  // Intrinsic Math Gate: area alone does not decide; the plan's rules do. On a
  // single wall a tight packing *is* the answer, so there the decoy is spacing.
  if (p.kind === 'room' && layoutOracle(p, naivePacking(p)) === 'optimal')
    issues.push(
      'apilar todo en orden ya es óptimo: las reglas del espacio no deciden',
    )
  if (p.kind === 'strip') {
    const gapped: SpatialPlacement[] = []
    let x = 0
    for (const object of p.objects) {
      gapped.push({ objectId: object.id, x, y: 0, rotation: 0 })
      x += object.widthCm / p.cellCm + 1
    }
    if (layoutOracle(p, gapped) !== 'invalid')
      issues.push(
        'las tres cosas con espacio entre ellas también entran: no hay encastre',
      )
  }
  return issues
}

function verifyLayout(p: LayoutParams): readonly string[] {
  return p.objects.some((object) => !object.optional)
    ? []
    : ['falta el objeto principal']
}

export function evaluateLayout(
  p: LayoutParams,
  placements: readonly SpatialPlacement[],
) {
  if (
    new Set(placements.map((entry) => entry.objectId)).size !==
      placements.length ||
    placements.length > p.objects.length ||
    placements.some(
      (entry) =>
        !p.objects.some((object) => object.id === entry.objectId) ||
        !Number.isSafeInteger(entry.x) ||
        !Number.isSafeInteger(entry.y) ||
        entry.x < 0 ||
        entry.y < 0 ||
        entry.x > 11 ||
        entry.y > 7 ||
        (entry.rotation !== 0 && entry.rotation !== 90) ||
        (entry.rotation === 90 &&
          p.objects.find((object) => object.id === entry.objectId)
            ?.rotatable !== true),
    )
  )
    return err({
      kind: 'invalid-answer' as const,
      detail: 'ubicación fuera del contrato',
    })

  const found = inspect(p, placements)
  const quality = qualityOf(p, found)
  const room = p.kind === 'room'
  const extras = found.rects.filter((rect) => rect.object.optional).length

  return ok(
    outcome(
      quality,
      {
        outcomeKey: `layout.${p.kind}.${quality}`,
        stamp: quality === 'invalid' ? 'No encastra' : 'Espacio listo',
        facts: [
          { label: 'Escala', value: `1 celda = ${String(p.cellCm)} cm` },
          ...found.rects.map((rect) => ({
            label: rect.object.label,
            value: `(${String(rect.x)}, ${String(rect.y)}) · ${String(rect.w)} × ${String(rect.h)} celdas = ${String(rect.object.widthCm)} × ${String(rect.object.depthCm)} cm`,
          })),
          ...(room
            ? [
                {
                  label: 'Lugares',
                  value: `${String(found.seats)} (mínimo ${String(p.requiredSeats)}, ideal ${String(p.targetSeats)})`,
                },
                {
                  label: 'Recorrido',
                  value: found.connected ? 'libre desde la puerta' : 'cortado',
                },
              ]
            : []),
        ],
        ...(quality === 'invalid'
          ? { violatedConstraint: found.violations.join(' ') }
          : {}),
        consequence:
          quality === 'invalid'
            ? 'Las medidas y el recorrido marcan dónde ajustar: un objeto no puede pisar otro, salirse del plano ni cortar el paso.'
            : room
              ? quality === 'functional'
                ? `La expo entra con ${String(found.seats)} lugares; el ideal eran ${String(p.targetSeats)}.`
                : quality === 'efficient'
                  ? 'Entran todos los lugares; la caja de materiales quedó afuera.'
                  : 'Entran todos los lugares, la caja y el paso libre. Hay más de una disposición posible.'
              : extras === 2
                ? p.width ===
                  p.objects.reduce(
                    (total, object) => total + object.widthCm / p.cellCm,
                    0,
                  )
                  ? 'Entran las tres cosas: la cuenta en celdas cerró justo.'
                  : 'Entran las tres cosas, y sobra una celda: la cuenta en celdas cierra.'
                : extras === 1
                  ? 'Entran la mesa y una cosa más.'
                  : 'La mesa entra; el estante y la caja quedaron afuera.',
      },
      {},
      room
        ? [
            { flag: 'y1.layout.outcome', value: quality },
            { flag: 'y1.layout.accessible', value: quality !== 'invalid' },
          ]
        : [{ flag: 'y1.layout.review-outcome', value: quality }],
    ),
  )
}

const roomVariants = generatedSource({
  id: 'y1.layout.cell-graphs',
  version: '1',
  schema: layoutSchema,
  size: LAYOUT_SPACE,
  generate: generateLayout,
  gates: layoutGates,
})
const reviewVariants = generatedSource({
  id: 'y1.scale-review.wall-fit',
  version: '1',
  schema: layoutSchema,
  size: SCALE_REVIEW_SPACE,
  generate: generateScaleReview,
  gates: layoutGates,
})

function layoutTemplate(review: boolean) {
  const variants = review ? reviewVariants : roomVariants
  return defineChallenge<LayoutParams, LayoutParams>({
    id: toChallengeId(review ? 'y1.scale-fit-review' : 'y1.classroom-layout'),
    family: toScenarioFamilyId('classroom-space'),
    placement: review ? 'recovery' : 'anchor',
    variants: authoredVariantIds(variants.authored),
    variantSource: variants,
    interaction: 'spatial-layout',
    stages: ['year-1'],
    categories: ['space-and-shape', 'proportions-and-percentages'],
    baseDifficulty: review ? 2 : 4,
    cognitive: review
      ? {
          steps: 1,
          constraints: 2,
          selection: 0,
          optimization: 0,
          uncertainty: 0,
          construction: 1,
        }
      : {
          steps: 3,
          constraints: 3,
          selection: 1,
          optimization: 0,
          uncertainty: 0,
          construction: 1,
        },
    composition: {
      primaryReasoningFamily: 'SPATIAL',
      interactionEngine: 'spatial-graph',
      pacingClass: review ? 'QUICK' : 'DEEP',
      chronology: 30,
    },
    scoring: {
      math: 'discrete-quality',
      team: 'none',
      aura: 'none',
      rationale: review
        ? 'Repaso de escala y encastre fuera del plan ordinario: no aporta evidencia competitiva.'
        : 'Math mide escala, huellas, límites, pasos reservados, recorrido desde la puerta y lugares; no lee coordenadas de pantalla, Equipo ni Aura.',
    },
    tools: ['ruler'],
    generate: ({ params }) => parameters(layoutSchema, params),
    verify: verifyLayout,
    narrate: (p) => ({
      title: review ? 'Repaso: medir y encastrar' : 'Un aula que funcione',
      setup: review
        ? `Una pared de ${metres(p.width * p.cellCm)} m, dibujada con 1 celda = ${String(p.cellCm)} cm. Pasá cada medida a celdas antes de ubicar.`
        : 'La exposición va en el aula: un lugar para presentar, mesas para quienes miran y paso libre desde la puerta. No alcanza con que el área total dé.',
      goal: review
        ? 'Ubicá la mesa de la muestra. Si entran, sumá el estante y la caja, sin superponer ni pasarte de la pared.'
        : `Ubicá la zona de presentación y las mesas que hagan falta para al menos ${String(p.requiredSeats)} lugares; el ideal son ${String(p.targetSeats)}. No ocupes columnas, pasillos marcados ni puertas, y que se pueda llegar a cada cosa desde la puerta. Si entra, sumá la caja de materiales.`,
    }),
    present: (p) => ({
      kind: 'spatial-layout',
      width: p.width,
      height: p.height,
      cellCentimeters: p.cellCm,
      blocked: p.blocked,
      clearance: p.aisle,
      entrances: p.doors,
      data: [
        {
          label: review ? 'Pared' : 'Aula',
          value: review
            ? metres(p.width * p.cellCm)
            : `${metres(p.width * p.cellCm)} × ${metres(p.height * p.cellCm)}`,
          unit: 'm',
        },
        {
          label: 'Escala',
          value: String(p.cellCm),
          unit: 'cm por celda',
          constraint: true,
        },
        ...(review
          ? []
          : [
              {
                label: 'Lugares',
                value: String(p.requiredSeats),
                unit: `mínimo · ideal ${String(p.targetSeats)}`,
                constraint: true,
              },
            ]),
      ],
      instructions: review
        ? 'Marcá qué incluís y elegí dónde empieza cada objeto (X). En esta pared nada se gira. El plano dibuja lo que elegís; no dice si cumple antes de confirmar.'
        : 'Marcá qué incluís y elegí la esquina superior izquierda de cada objeto (X, Y). Las mesas se pueden girar 90°. El plano dibuja lo que elegís; no dice si cumple antes de confirmar.',
      objects: p.objects.map((object) => ({
        id: object.id,
        label: object.label,
        code: object.code,
        widthCells: object.widthCm / p.cellCm,
        heightCells: object.depthCm / p.cellCm,
        optional: object.optional,
        rotatable: object.rotatable,
        detail: `${String(object.widthCm)} × ${String(object.depthCm)} cm · ${String(object.heightCm)} cm de alto${object.seats > 0 ? ` · ${String(object.seats)} lugares` : ''}`,
      })),
    }),
    evaluate: (p, answer: InteractionAnswer) =>
      answer.kind === 'spatial-layout'
        ? evaluateLayout(p, answer.placements)
        : err({
            kind: 'invalid-answer',
            detail: 'se esperaba una disposición espacial',
          }),
  })
}

/** Con nota por calidad (10/8/6/4). Ver `src/content/grades.ts`. */
export const classroomLayout = graded(layoutTemplate(false))
export const scaleFitReview = layoutTemplate(true)
