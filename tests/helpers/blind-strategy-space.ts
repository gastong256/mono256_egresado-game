/**
 * El espacio de respuesta de una Template, clasificado por **capacidad**.
 *
 * La auditoría de la ronda 1 despachaba por nombre de motor y marcaba «no
 * enumerable» a todo lo que no fuera tarjeta, clasificación o entrada numérica.
 * Eso dejó 22 de 42 Templates sin métrica y esconde exactamente la clase de
 * defecto que MAT-RA-002 y MAT-RA-003 explotaban: una respuesta **constante**
 * que ignora los números de cada variante (RS-RA-AUDIT-001).
 *
 * Este módulo no pregunta «qué motor es», sino dos cosas medibles:
 *
 * 1. ¿existe un vector de respuesta con la **misma semántica** en todas las
 *    variantes aprobadas? Un `quantity-builder` cuyos ítems y máximos no cambian
 *    lo tiene; uno cuyos ítems cambian, no;
 * 2. ¿cuántos vectores hay, y entra ese número en el presupuesto medido?
 *
 * De ahí salen las cuatro categorías del contrato. Nada acá conoce el
 * identificador de una Template ni la respuesta esperada: enumerar el espacio y
 * saber cuál es la respuesta correcta son dos trabajos distintos, y mezclarlos
 * convertiría la auditoría en su propio oráculo.
 */
import type {
  InteractionAnswer,
  InteractionPresentation,
  PresentedDatum,
  SpatialPlacement,
} from '@/game'
import {
  assignmentShortcutPolicies,
  numericShortcutPolicies,
  optionShortcutPolicies,
  quantityShortcutPolicies,
  type AuditedQuantityItem,
  type NaivePolicy,
} from './blind-strategy-policies'

export {
  STRATEGY_FAMILIES,
  type NaivePolicy,
  type PolicyDerivation,
  type StrategyFamily,
} from './blind-strategy-policies'

/**
 * Presupuesto por Template: 60.000 evaluaciones matemáticas. La medición
 * reproducible (Node 24.19.0, `game:blind-audit --timing`) está registrada en
 * variant-validation-and-audit.md: cubre el máximo publicado de 54.675 (729 clasificaciones × 25 variantes × 3 posturas) sin
 * reservar millones de evaluaciones no medidas. Las posturas también cuentan.
 */
export const EVALUATION_BUDGET = 60_000

/**
 * Una respuesta constante, ya resuelta contra una variante concreta.
 *
 * «La misma respuesta» es una **coordenada semántica** —una posición, un vector
 * de cantidades, un patrón de etiquetas—, no un objeto fijo: los identificadores
 * de opción cambian entre variantes y repetir el id de la primera variante en la
 * segunda no es repetir la respuesta, es enviar algo que el juego rechaza.
 */
export interface ConstantResponse {
  readonly key: string
  readonly answer: InteractionAnswer
  /** Otras formas de la misma respuesta que sólo cambian la postura pública. */
  readonly stanceVariants: readonly InteractionAnswer[]
}

/**
 * Lo que se puede medir en una variante.
 *
 * `signature` identifica la **forma** del espacio de respuesta. Dos variantes
 * con la misma firma admiten la misma respuesta constante; si alguna difiere, no
 * existe un vector constante comparable y la Template cae en la categoría C.
 */
export interface ResponseSpace {
  readonly signature: string
  readonly cardinality?: number
  readonly evaluationsPerResponse?: number
  /** Las coordenadas del espacio, en orden estable. Ausente en categoría D. */
  readonly constantKeys?: () => readonly string[]
  /** Resuelve una coordenada contra **esta** variante. Ausente en categoría D. */
  readonly resolve?: (key: string) => ConstantResponse | undefined
  /**
   * Identificador legible de una coordenada en esta variante, cuando existe.
   *
   * Sirve para reportar «la opción `abono`» en vez de «la posición 0» cuando los
   * identificadores son estables en todo el catálogo.
   */
  readonly labelOf?: (key: string) => string | undefined
  readonly policies: readonly NaivePolicy[]
}

const product = (values: readonly number[]): number =>
  values.reduce((total, value) => total * value, 1)

/** Índice `code` del producto cartesiano de `sizes`, en orden estable. */
function digits(code: number, sizes: readonly number[]): readonly number[] {
  let rest = code
  return sizes.map((size) => {
    const digit = rest % size
    rest = Math.floor(rest / size)
    return digit
  })
}

/**
 * Cantidades y presupuesto: el vector de cantidades **es** la respuesta.
 *
 * La firma incluye los máximos porque son parte del espacio: si una variante
 * ofrece otro tope, «la misma respuesta» ya no significa lo mismo.
 */
function quantitySpace(
  kind: 'quantity-builder' | 'budget-builder',
  data: readonly PresentedDatum[],
  items: readonly AuditedQuantityItem[],
): ResponseSpace {
  const sizes = items.map((item) => item.maxQuantity + 1)
  const lines = (counts: readonly number[]) =>
    items.map((item, index) => ({
      itemId: item.id,
      quantity: counts[index] ?? 0,
    }))
  const answerOf = (counts: readonly number[]): InteractionAnswer =>
    ({ kind, lines: lines(counts) }) as InteractionAnswer
  return {
    signature: `${kind}:${items.map((item) => `${item.id}<=${String(item.maxQuantity)}`).join(',')}`,
    cardinality: product(sizes),
    constantKeys: () =>
      Array.from({ length: product(sizes) }, (_, code) =>
        digits(code, sizes).join('-'),
      ),
    resolve: (key) => {
      const counts = key.split('-').map(Number)
      if (
        counts.length !== items.length ||
        counts.some(
          (n, i) => !Number.isInteger(n) || n < 0 || n >= (sizes[i] ?? 0),
        )
      )
        return undefined
      return { key, answer: answerOf(counts), stanceVariants: [] }
    },
    policies: quantityShortcutPolicies(kind, data, items),
  }
}

/** Una opción entre varias: el espacio son las opciones presentadas. */
function optionSpace(
  kind:
    | 'decision-card'
    | 'timeline'
    | 'chart-interpretation'
    | 'information-request',
  options: readonly {
    readonly id: string
    readonly label: string
    readonly detail?: string
  }[],
): ResponseSpace {
  const answerOf = (id: string): InteractionAnswer =>
    ({ kind, optionId: id }) as InteractionAnswer
  return {
    signature: `${kind}:${String(options.length)}`,
    cardinality: options.length,
    constantKeys: () => options.map((_, position) => `#${String(position)}`),
    resolve: (key) => {
      const option = options[Number(key.slice(1))]
      return option === undefined
        ? undefined
        : { key, answer: answerOf(option.id), stanceVariants: [] }
    },
    labelOf: (key) => options[Number(key.slice(1))]?.id,
    policies: optionShortcutPolicies(kind, options),
  }
}

/** Clasificar enunciados con etiquetas: el espacio es `etiquetas ^ enunciados`. */
function classificationSpace(
  view: Extract<InteractionPresentation, { kind: 'classification' }>,
): ResponseSpace {
  const labels = view.labels.map((label) => label.id)
  const stances = view.stance?.options.map((option) => option.id) ?? []
  const sizes = view.statements.map(() => labels.length)
  const withStance = (
    entries: readonly { statementId: string; labelId: string }[],
    stance: string | undefined,
  ): InteractionAnswer =>
    ({
      kind: 'classification',
      entries,
      ...(stance === undefined ? {} : { stance }),
    }) as InteractionAnswer
  const entriesOf = (picks: readonly number[]) =>
    view.statements.map((statement, index) => ({
      statementId: statement.id,
      labelId: labels[picks[index] ?? 0] ?? '',
    }))
  const uniform = (labelIndex: number) => entriesOf(sizes.map(() => labelIndex))
  return {
    signature: `classification:${String(view.statements.length)}:${labels.join(',')}`,
    evaluationsPerResponse: Math.max(1, stances.length),
    cardinality: product(sizes),
    constantKeys: () =>
      Array.from({ length: product(sizes) }, (_, code) =>
        digits(code, sizes).join(''),
      ),
    resolve: (key) => {
      const picks = [...key].map(Number)
      if (picks.length !== sizes.length) return undefined
      return {
        key,
        answer: withStance(entriesOf(picks), stances[0]),
        stanceVariants: stances
          .slice(1)
          .map((stance) => withStance(entriesOf(picks), stance)),
      }
    },
    labelOf: (key) => {
      const picks = [...key].map(Number)
      if (picks.length !== sizes.length) return undefined
      return entriesOf(picks)
        .map((entry) => `${entry.statementId}=${entry.labelId}`)
        .join(',')
    },
    policies: [
      ...labels.map((label, index) => ({
        family: 'NORMALIZED' as const,
        name: `todo «${label}»`,
        derivation: 'positional' as const,
        answer: withStance(uniform(index), stances[0]),
      })),
      {
        family: 'FIXED_PRIORITY' as const,
        name: 'primer patrón válido',
        derivation: 'positional' as const,
        answer: withStance(
          entriesOf(sizes.map((_, i) => i % labels.length)),
          stances[0],
        ),
      },
    ],
  }
}

/** Entrada numérica: el espacio es el rango presentado. */
function numericSpace(
  view: Extract<InteractionPresentation, { kind: 'numeric-input' }>,
): ResponseSpace | undefined {
  const min = Number(view.min)
  const max = Number(view.max)
  const step = Number(view.step)
  if (!Number.isInteger(min) || !Number.isInteger(max) || step !== 1)
    return undefined
  const answerOf = (value: number): InteractionAnswer => ({
    kind: 'numeric-input',
    value: String(value),
  })
  return {
    signature: `numeric-input:${String(min)}..${String(max)}`,
    cardinality: max - min + 1,
    constantKeys: () =>
      Array.from({ length: max - min + 1 }, (_, offset) =>
        String(min + offset),
      ),
    resolve: (key) => {
      const value = Number(key)
      return Number.isInteger(value) && value >= min && value <= max
        ? { key, answer: answerOf(value), stanceVariants: [] }
        : undefined
    },
    policies: numericShortcutPolicies(view),
  }
}

/**
 * Espacios de construcción: no existe un vector constante comparable, porque la
 * respuesta nombra posiciones, personas, horarios o paradas de **esta** variante.
 * Se miden con políticas, que es lo único que se puede repetir sin mirar los
 * números.
 */
function constructionSpace(
  view: InteractionPresentation,
): ResponseSpace | undefined {
  if (view.kind === 'assignment-board') {
    const agents = view.agents.map((agent) => agent.id)
    const tasks = view.tasks.map((task) => task.id)
    const answerOf = (
      pick: (index: number) => string | undefined,
    ): InteractionAnswer => ({
      kind: 'assignment-board',
      assignments: tasks.flatMap((taskId, index) => {
        const agentId = pick(index)
        return agentId === undefined ? [] : [{ agentId, taskId }]
      }),
    })
    return {
      signature: `assignment-board:${agents.join(',')}:${tasks.join(',')}`,
      constantKeys: () =>
        Array.from({ length: (agents.length + 1) ** tasks.length }, (_, code) =>
          digits(
            code,
            tasks.map(() => agents.length + 1),
          ).join('-'),
        ),
      resolve: (key) => {
        const picks = key.split('-').map(Number)
        return {
          key,
          answer: answerOf((index) => agents[(picks[index] ?? 0) - 1]),
          stanceVariants: [],
        }
      },
      cardinality: (agents.length + 1) ** tasks.length,
      policies: [
        // Derivadas de lo que la pantalla imprime en cada fila: las cifras y
        // las marcas. Sin ellas este motor quedaba cubierto sólo por patrones
        // posicionales (MAT-FC-002).
        ...assignmentShortcutPolicies(
          view.agents.map((agent) => ({
            id: agent.id,
            label: agent.label,
            detail: agent.detail ?? '',
          })),
          view.tasks.map((task) => ({
            id: task.id,
            label: task.label,
            detail: task.detail ?? '',
          })),
          answerOf,
        ),
        {
          family: 'NORMALIZED' as const,
          name: 'nada asignado',
          derivation: 'positional' as const,
          answer: { kind: 'assignment-board', assignments: [] },
        },
        ...(agents[0] === undefined
          ? []
          : [
              {
                family: 'FIXED_PRIORITY' as const,
                name: 'todo a la primera persona',
                derivation: 'positional' as const,
                answer: answerOf(() => agents[0]!),
              },
            ]),
        {
          family: 'FIXED_PRIORITY' as const,
          name: 'cíclica',
          derivation: 'positional' as const,
          answer: answerOf((index) => agents[index % agents.length] ?? ''),
        },
        {
          family: 'FIXED_PRIORITY' as const,
          name: 'equilibrada',
          derivation: 'positional' as const,
          answer: answerOf(
            (index) =>
              agents[Math.floor((index * agents.length) / tasks.length)] ?? '',
          ),
        },
        {
          family: 'FIXED_PRIORITY' as const,
          name: 'preservar el orden',
          derivation: 'positional' as const,
          answer: answerOf((index) =>
            index < agents.length
              ? (agents[index] ?? '')
              : (agents[agents.length - 1] ?? ''),
          ),
        },
      ],
    }
  }
  if (view.kind === 'schedule-builder') {
    const starts = (index: number) => view.activities[index]?.startMinutes ?? []
    const placements = (pick: (index: number) => number | undefined) =>
      view.activities.flatMap((activity, index) => {
        const startMinute = pick(index)
        return startMinute === undefined
          ? []
          : [{ activityId: activity.id, startMinute }]
      })
    const answerOf = (
      pick: (index: number) => number | undefined,
    ): InteractionAnswer => ({
      kind: 'schedule-builder',
      placements: placements(pick),
    })
    /**
     * Agenda en el orden que dicta una magnitud impresa: la duración.
     *
     * Es la única razón visible que este motor ofrece por actividad, y hasta el
     * cierre no se medía ninguna (MAT-FC-002). Cada actividad toma el primer
     * horario que le queda disponible al avanzar el reloj.
     */
    const byDuration = (longestFirst: boolean) => {
      const order = view.activities
        .map((_activity, index) => index)
        .sort((left, right) => {
          const a = view.activities[left]?.durationMinutes ?? 0
          const b = view.activities[right]?.durationMinutes ?? 0
          return (longestFirst ? b - a : a - b) || left - right
        })
      const chosen = new Map<number, number>()
      let clock = view.span.from
      for (const index of order) {
        const activity = view.activities[index]
        if (activity === undefined) continue
        const start =
          activity.startMinutes.find((minute) => minute >= clock) ??
          activity.startMinutes[0]
        if (start === undefined) continue
        chosen.set(index, start)
        clock = start + activity.setupMinutes + activity.durationMinutes
      }
      return chosen
    }
    const shortestFirst = byDuration(false)
    const longestFirst = byDuration(true)

    let cursor = view.span.from
    const sequential = view.activities.map((activity) => {
      const start =
        activity.startMinutes.find((minute) => minute >= cursor) ??
        activity.startMinutes[0]
      cursor =
        (start ?? cursor) + activity.setupMinutes + activity.durationMinutes
      return start
    })
    return {
      signature: `schedule-builder:${String(view.activities.length)}`,
      cardinality: product(
        view.activities.map((activity) => activity.startMinutes.length + 1),
      ),
      policies: [
        {
          family: 'NORMALIZED' as const,
          name: 'agenda vacía',
          derivation: 'positional' as const,
          answer: { kind: 'schedule-builder', placements: [] },
        },
        {
          family: 'SIMPLE_GREEDY' as const,
          name: 'la más corta primero',
          derivation: 'attribute' as const,
          answer: answerOf((index) => shortestFirst.get(index)),
        },
        {
          family: 'SIMPLE_GREEDY' as const,
          name: 'la más larga primero',
          derivation: 'attribute' as const,
          answer: answerOf((index) => longestFirst.get(index)),
        },
        {
          family: 'DOMAIN_NAIVE' as const,
          name: 'lo más temprano posible',
          derivation: 'positional' as const,
          answer: answerOf((index) => starts(index)[0]),
        },
        {
          family: 'DOMAIN_NAIVE' as const,
          name: 'lo más tarde posible',
          derivation: 'positional' as const,
          answer: answerOf((index) => starts(index).at(-1)),
        },
        {
          family: 'DOMAIN_NAIVE' as const,
          name: 'sólo lo obligatorio, temprano',
          derivation: 'positional' as const,
          answer: answerOf((index) =>
            view.activities[index]?.optional === true
              ? undefined
              : starts(index)[0],
          ),
        },
        {
          family: 'FIXED_PRIORITY' as const,
          name: 'preservar el orden',
          derivation: 'positional' as const,
          answer: answerOf((index) => sequential[index]),
        },
        {
          family: 'DOMAIN_NAIVE' as const,
          name: 'repartido uniforme',
          derivation: 'positional' as const,
          answer: answerOf((index) => {
            const activity = view.activities[index]!
            const last =
              view.span.to - activity.setupMinutes - activity.durationMinutes
            const target =
              view.span.from +
              ((last - view.span.from) * index) /
                Math.max(1, view.activities.length - 1)
            return [...starts(index)].sort(
              (a, b) => Math.abs(a - target) - Math.abs(b - target) || a - b,
            )[0]
          }),
        },
      ],
    }
  }
  if (view.kind === 'spatial-layout') {
    const objects = view.objects
    const rowMajor = (only: (index: number) => boolean) => {
      let x = 0
      let y = 0
      let rowHeight = 0
      return objects.flatMap((object, index) => {
        if (!only(index)) return []
        if (x + object.widthCells > view.width) {
          x = 0
          y += rowHeight
          rowHeight = 0
        }
        const placement = { objectId: object.id, x, y, rotation: 0 as const }
        x += object.widthCells
        rowHeight = Math.max(rowHeight, object.heightCells)
        return [placement]
      })
    }
    // Greedy sin backtracking ni evaluador: usa sólo la geometría visible.
    const firstFit = (
      order: 'presentado' | 'menor' | 'mayor',
    ): SpatialPlacement[] => {
      const occupied = new Set(
        [...view.blocked, ...view.clearance, ...view.entrances].map(
          (cell) => `${cell.x},${cell.y}`,
        ),
      )
      const area = (object: (typeof objects)[number]) =>
        object.widthCells * object.heightCells
      const ordered =
        order === 'presentado'
          ? objects
          : [...objects].sort((a, b) =>
              order === 'menor' ? area(a) - area(b) : area(b) - area(a),
            )
      const placements: SpatialPlacement[] = []
      for (const object of ordered) {
        let placed = false
        for (let y = 0; y < view.height && !placed; y++) {
          for (let x = 0; x < view.width && !placed; x++) {
            for (const rotation of (object.rotatable
              ? [0, 90]
              : [0]) as readonly (0 | 90)[]) {
              const width =
                rotation === 0 ? object.widthCells : object.heightCells
              const height =
                rotation === 0 ? object.heightCells : object.widthCells
              if (x + width > view.width || y + height > view.height) continue
              const cells = Array.from(
                { length: width * height },
                (_, i) => `${x + (i % width)},${y + Math.floor(i / width)}`,
              )
              if (cells.some((cell) => occupied.has(cell))) continue
              cells.forEach((cell) => occupied.add(cell))
              placements.push({ objectId: object.id, x, y, rotation })
              placed = true
              break
            }
          }
        }
      }
      return placements
    }
    return {
      signature: `spatial-layout:${String(view.width)}x${String(view.height)}:${String(objects.length)}`,
      // No declarar un cardinal parcial: hay omisiones y rotaciones, además
      // de posiciones. Aquí se mide por políticas, no se enumera ese espacio.
      policies: [
        {
          family: 'NORMALIZED' as const,
          name: 'plano vacío',
          derivation: 'positional' as const,
          answer: { kind: 'spatial-layout', placements: [] },
        },
        {
          family: 'DOMAIN_NAIVE' as const,
          name: 'fila a fila',
          derivation: 'positional' as const,
          answer: {
            kind: 'spatial-layout',
            placements: rowMajor(() => true),
          },
        },
        {
          family: 'DOMAIN_NAIVE' as const,
          name: 'empaque desde el origen',
          derivation: 'positional' as const,
          answer: {
            kind: 'spatial-layout',
            placements: objects.map((object) => ({
              objectId: object.id,
              x: 0,
              y: 0,
              rotation: 0,
            })),
          },
        },
        {
          family: 'DOMAIN_NAIVE' as const,
          name: 'misma orientación',
          derivation: 'positional' as const,
          answer: { kind: 'spatial-layout', placements: rowMajor(() => true) },
        },
        {
          family: 'SIMPLE_GREEDY' as const,
          name: 'primer hueco',
          derivation: 'attribute' as const,
          answer: {
            kind: 'spatial-layout',
            placements: firstFit('presentado'),
          },
        },
        {
          family: 'SIMPLE_GREEDY' as const,
          name: 'huella mínima',
          derivation: 'attribute' as const,
          answer: { kind: 'spatial-layout', placements: firstFit('menor') },
        },
        {
          family: 'SIMPLE_GREEDY' as const,
          name: 'huella máxima',
          derivation: 'attribute' as const,
          answer: { kind: 'spatial-layout', placements: firstFit('mayor') },
        },
        {
          family: 'DOMAIN_NAIVE' as const,
          name: 'sólo lo obligatorio, fila a fila',
          derivation: 'positional' as const,
          answer: {
            kind: 'spatial-layout',
            placements: rowMajor((index) => objects[index]?.optional !== true),
          },
        },
      ],
    }
  }
  if (view.kind === 'route-builder') {
    const points = view.points
    const answerOf = (stops: readonly string[]): InteractionAnswer => ({
      kind: 'route-builder',
      stops,
    })
    const nearest = () => {
      const left = [...points]
      const order: string[] = []
      let x = view.origin.x
      let y = view.origin.y
      while (left.length > 0) {
        let best = 0
        let bestDistance = Number.POSITIVE_INFINITY
        left.forEach((point, index) => {
          const distance = Math.abs(point.x - x) + Math.abs(point.y - y)
          if (distance < bestDistance) {
            bestDistance = distance
            best = index
          }
        })
        const [picked] = left.splice(best, 1)
        if (picked === undefined) break
        order.push(picked.id)
        x = picked.x
        y = picked.y
      }
      return order
    }
    return {
      signature: `route-builder:${String(points.length)}`,
      // n! sólo contaría recorridos completos y ocultaría las omisiones.
      // El cardinal no se declara hasta modelar el dominio entero.
      policies: [
        {
          family: 'NORMALIZED' as const,
          name: 'sin paradas',
          derivation: 'positional' as const,
          answer: answerOf([]),
        },
        {
          family: 'FIXED_PRIORITY' as const,
          name: 'orden presentado',
          derivation: 'positional' as const,
          answer: answerOf(points.map((point) => point.id)),
        },
        {
          family: 'FIXED_PRIORITY' as const,
          name: 'orden inverso',
          derivation: 'positional' as const,
          answer: answerOf([...points].reverse().map((point) => point.id)),
        },
        {
          family: 'DOMAIN_NAIVE' as const,
          name: 'sólo las obligatorias, orden presentado',
          derivation: 'positional' as const,
          answer: answerOf(
            points.filter((point) => !point.optional).map((point) => point.id),
          ),
        },
        {
          family: 'SIMPLE_GREEDY' as const,
          name: 'vecino más cercano',
          derivation: 'attribute' as const,
          answer: answerOf(nearest()),
        },
      ],
    }
  }
  if (view.kind === 'number-grid') {
    const rounds = view.rounds
    const answerOf = (
      pick: (numbers: readonly number[]) => readonly number[],
    ): InteractionAnswer => ({
      kind: 'number-grid',
      rounds: rounds.map((round) => ({
        roundId: round.id,
        numbers: pick(round.numbers),
      })),
    })
    return {
      signature: `number-grid:${rounds.map((round) => String(round.numbers.length)).join(',')}`,
      cardinality: product(rounds.map((round) => 2 ** round.numbers.length)),
      policies: [
        {
          family: 'NORMALIZED' as const,
          name: 'sin rondas',
          derivation: 'positional' as const,
          answer: { kind: 'number-grid', rounds: [] },
        },
        {
          family: 'NORMALIZED' as const,
          name: 'marcar todo',
          derivation: 'positional' as const,
          answer: answerOf((numbers) => [...numbers]),
        },
        {
          family: 'NORMALIZED' as const,
          name: 'no marcar nada',
          derivation: 'positional' as const,
          answer: answerOf(() => []),
        },
        {
          family: 'FIXED_PRIORITY' as const,
          name: 'primer patrón válido (primera celda)',
          derivation: 'positional' as const,
          answer: answerOf((numbers) => numbers.slice(0, 1)),
        },
      ],
    }
  }
  return undefined
}

/**
 * El espacio de respuesta de una presentación, o `undefined` cuando esta
 * auditoría todavía no sabe medirlo. Ese caso se reporta como
 * `BLOCKED_BY_SPACE_WITH_REASON`: nunca se silencia.
 */
export function responseSpaceOf(
  view: InteractionPresentation,
): ResponseSpace | undefined {
  switch (view.kind) {
    case 'decision-card':
    case 'timeline':
    case 'chart-interpretation':
    case 'information-request':
      return optionSpace(view.kind, view.options)
    case 'classification':
      return classificationSpace(view)
    case 'numeric-input':
      return numericSpace(view)
    case 'quantity-builder':
      return quantitySpace(view.kind, view.data, view.items)
    case 'budget-builder':
      // Un `budget-builder` imprime el precio unitario donde el otro imprime
      // las tasas: es el mismo texto por ítem, con otro nombre de campo.
      return quantitySpace(
        view.kind,
        view.data,
        view.items.map((item) => ({ ...item, detail: item.unitPrice })),
      )
    default:
      return constructionSpace(view)
  }
}
