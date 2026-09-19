/**
 * La familia finita de atajos de baja complejidad (RS-CLO-AUDIT-001).
 *
 * Un atajo es una **política reutilizable**: una regla de una o dos operaciones
 * que un jugador puede aplicar a cualquier variante sin resolver el constructo
 * matemático, usando únicamente lo que la pantalla imprime. La ronda 2 sólo
 * medía respuestas **absolutas** —constantes y fracciones del máximo—, y por eso
 * no podía ver «copiar el objetivo» ni «empezar por la bandeja de menos
 * minutos», que derrotaban a las dos Templates que existía para arreglar
 * (MAT-RA2-003).
 *
 * Las ocho familias de acá son el cierre: se implementan una vez, de forma
 * genérica sobre la presentación, y no se agregan más dentro del sprint. Lo que
 * exija un solucionador, varios pasos del razonamiento buscado o estrategia
 * experta **no es un atajo** y no se modela acá.
 *
 * Frontera de información, idéntica a la del jugador: estas políticas leen
 * `InteractionPresentation` y nada más. No ven parámetros, no consultan el
 * evaluador para elegir, no llaman a un solucionador y no conocen ningún
 * `templateId`. Construyen una respuesta; la auditoría la evalúa **después**.
 */
import type {
  InteractionAnswer,
  InteractionPresentation,
  PresentedDatum,
} from '@/game'
import {
  figuresIn,
  figuresOfDatum,
  figuresOfOption,
  figuresOfUnit,
  normalizeUnit,
  parseRateUnit,
  unitsOf,
  type Figure,
} from './blind-strategy-reading'

/**
 * Las ocho familias canónicas del cierre de STAGE-08.
 *
 * El orden **es** el de complejidad creciente: cuando dos políticas producen la
 * misma respuesta, el atajo se atribuye a la familia más simple, que es la
 * descripción más honesta del exploit.
 */
export const STRATEGY_FAMILIES = [
  'CONSTANT',
  'NORMALIZED',
  'VISIBLE_COPY',
  'TARGET_RELATIVE',
  'RESOURCE_RELATIVE',
  'FIXED_PRIORITY',
  'SIMPLE_GREEDY',
  'DOMAIN_NAIVE',
] as const
export type StrategyFamily = (typeof STRATEGY_FAMILIES)[number]

const FAMILY_RANK = new Map<StrategyFamily, number>(
  STRATEGY_FAMILIES.map((family, index) => [family, index]),
)

/** Una política ingenua: determinista, y ciega a la respuesta esperada. */
export interface NaivePolicy {
  readonly name: string
  readonly family: StrategyFamily
  readonly answer: InteractionAnswer
}

/**
 * Una regla, un nombre, en toda variante.
 *
 * Dos reglas distintas pueden aterrizar en la misma respuesta en **una**
 * variante y separarse en la siguiente —«la mitad del máximo» y «copiar el
 * objetivo» coinciden a veces—, así que colapsarlas por respuesta rompería la
 * medición: la regla desaparecería de esa variante y dejaría de ser comparable
 * en todo el catálogo. Acá sólo se colapsan nombres repetidos, con la familia
 * **más simple** que los produce; el costo de evaluar respuestas iguales lo
 * resuelve la memoria de la auditoría, no esta lista.
 */
function byName(policies: readonly NaivePolicy[]): readonly NaivePolicy[] {
  const best = new Map<string, NaivePolicy>()
  for (const policy of policies) {
    const current = best.get(policy.name)
    if (
      current === undefined ||
      (FAMILY_RANK.get(policy.family) ?? 0) <
        (FAMILY_RANK.get(current.family) ?? 0)
    )
      best.set(policy.name, policy)
  }
  return [...best.values()].sort((a, b) => a.name.localeCompare(b.name))
}

/* -------------------------------------------------------------------------
 * Cantidades y presupuesto
 * ---------------------------------------------------------------------- */

/**
 * Un ítem de cantidades como lo ve la auditoría.
 *
 * `quantity-builder` imprime un `detail` con las tasas y `budget-builder` un
 * `unitPrice`: las dos son la misma cosa —el texto donde están los números de
 * ese ítem— y acá entran normalizadas, sin que el resto del módulo sepa de qué
 * motor vienen.
 */
export interface AuditedQuantityItem {
  readonly id: string
  readonly label: string
  readonly maxQuantity: number
  readonly detail: string
}

/** Una capacidad impresa y lo que cada ítem le consume, en la misma unidad. */
interface ResourceModel {
  readonly label: string
  readonly unit: string
  readonly budget: number
  readonly costs: readonly number[]
}

/** Un valor por ítem que la pantalla permite calcular en un paso. */
interface ValueVector {
  readonly label: string
  readonly values: readonly number[]
}

/** Tope de modelos y de valores: la enumeración queda acotada y determinista. */
const MAX_MODELS = 8
const MAX_VALUES = 8

const clamp = (value: number, max: number): number =>
  Math.max(0, Math.min(max, Number.isFinite(value) ? Math.trunc(value) : 0))

/** Las cifras de la unidad `unit` que **todos** los ítems imprimen, por turno. */
function costSlots(
  itemFigures: readonly (readonly Figure[])[],
  unit: string,
): readonly (readonly number[])[] {
  const perItem = itemFigures.map((figures) => figuresOfUnit(figures, unit))
  const depth = Math.min(...perItem.map((list) => list.length))
  return Array.from({ length: Math.max(0, depth) }, (_, slot) =>
    perItem.map((list) => list[slot] ?? 0),
  )
}

/**
 * Las capacidades que la pantalla declara, con su consumo por ítem.
 *
 * Una capacidad es un dato marcado como restricción. Cuando además hay una tasa
 * impresa —`MB por minuto`—, una capacidad en la unidad de abajo se convierte a
 * la de arriba: ésa es la relación encadenada que el jugador tiene que usar, y
 * está a la vista.
 */
function resourceModels(
  data: readonly PresentedDatum[],
  itemFigures: readonly (readonly Figure[])[],
): readonly ResourceModel[] {
  const units = [...new Set(itemFigures.flatMap((figures) => unitsOf(figures)))]
  const slotsByUnit = new Map<string, readonly (readonly number[])[]>(
    units.map((unit) => [unit, costSlots(itemFigures, unit)]),
  )
  const rates = data.flatMap((datum) => {
    const rate = parseRateUnit(datum.unit)
    const amount = figuresIn(datum.value)[0]?.amount
    return rate === undefined || amount === undefined || amount <= 0
      ? []
      : [{ label: datum.label, rate, amount }]
  })

  const models: ResourceModel[] = []
  const push = (
    label: string,
    unit: string,
    budget: number,
    slotIndex: number,
  ) => {
    const costs = slotsByUnit.get(unit)?.[slotIndex]
    if (costs === undefined || costs.every((cost) => cost <= 0)) return
    if (budget <= 0) return
    models.push({ label, unit, budget, costs })
  }

  for (const datum of data) {
    if (datum.constraint !== true) continue
    const figure = figuresOfDatum(datum)[0]
    if (figure === undefined) continue
    const direct = slotsByUnit.get(figure.unit)
    if (direct !== undefined)
      direct.forEach((_, slot) =>
        push(
          direct.length === 1
            ? datum.label
            : `${datum.label} #${String(slot + 1)}`,
          figure.unit,
          figure.amount,
          slot,
        ),
      )
    for (const { label, rate, amount } of rates) {
      if (rate.per !== figure.unit) continue
      const converted = slotsByUnit.get(rate.produced)
      if (converted === undefined) continue
      converted.forEach((_, slot) =>
        push(
          `${datum.label} a ${rate.produced} (${label})`,
          rate.produced,
          figure.amount * amount,
          slot,
        ),
      )
    }
  }
  return models.slice(0, MAX_MODELS)
}

/** Los valores por ítem que se leen en un paso: cada cifra y cada diferencia. */
function valueVectors(
  itemFigures: readonly (readonly Figure[])[],
): readonly ValueVector[] {
  const vectors: ValueVector[] = [
    { label: 'unidades', values: itemFigures.map(() => 1) },
  ]
  const units = [...new Set(itemFigures.flatMap((figures) => unitsOf(figures)))]
  for (const unit of units) {
    const slots = costSlots(itemFigures, unit)
    slots.forEach((values, slot) => {
      vectors.push({
        label: slots.length === 1 ? unit : `${unit} #${String(slot + 1)}`,
        values,
      })
    })
    // La diferencia entre dos cifras de la misma unidad: «lo que deja cada
    // bandeja» es precio menos costo, y las dos están impresas.
    for (let later = 1; later < slots.length; later++)
      for (let earlier = 0; earlier < later; earlier++) {
        const values = (slots[later] ?? []).map(
          (value, index) => value - (slots[earlier]?.[index] ?? 0),
        )
        if (values.every((value) => value > 0))
          vectors.push({
            label: `${unit} #${String(later + 1)} − #${String(earlier + 1)}`,
            values,
          })
      }
  }
  return vectors.slice(0, MAX_VALUES)
}

/** Llena en el orden dado sin pasarse de ninguna capacidad impresa. */
function fillInOrder(
  items: readonly AuditedQuantityItem[],
  models: readonly ResourceModel[],
  order: readonly number[],
  start: readonly number[],
): readonly number[] {
  const counts = items.map((item, index) =>
    clamp(start[index] ?? 0, item.maxQuantity),
  )
  const used = models.map((model) =>
    model.costs.reduce(
      (total, cost, index) => total + cost * (counts[index] ?? 0),
      0,
    ),
  )
  for (const index of order) {
    const item = items[index]
    if (item === undefined) continue
    for (;;) {
      if ((counts[index] ?? 0) >= item.maxQuantity) break
      const fits = models.every(
        (model, position) =>
          (used[position] ?? 0) + (model.costs[index] ?? 0) <= model.budget,
      )
      if (!fits) break
      counts[index] = (counts[index] ?? 0) + 1
      models.forEach((model, position) => {
        used[position] = (used[position] ?? 0) + (model.costs[index] ?? 0)
      })
    }
  }
  return counts
}

/**
 * Orden por `value / cost` descendente, con multiplicación cruzada entera.
 *
 * Sin división y sin coma: `a` va antes que `b` si `v_a · c_b > v_b · c_a`. Un
 * costo nulo con valor positivo va primero; los empates se rompen por posición,
 * así que el orden es total y determinista.
 */
function ratioOrder(
  values: readonly number[],
  costs: readonly number[],
  descending: boolean,
): readonly number[] {
  const indices = values.map((_, index) => index)
  const free = (index: number) =>
    (costs[index] ?? 0) === 0 && (values[index] ?? 0) > 0
  return indices.sort((left, right) => {
    if (free(left) !== free(right)) return free(left) === descending ? -1 : 1
    const cross =
      (values[right] ?? 0) * (costs[left] ?? 0) -
      (values[left] ?? 0) * (costs[right] ?? 0)
    const ordered = descending ? cross : -cross
    return ordered === 0 ? left - right : ordered
  })
}

/** Orden por una magnitud impresa, ascendente o descendente. */
function plainOrder(
  values: readonly number[],
  descending: boolean,
): readonly number[] {
  return values
    .map((_, index) => index)
    .sort((left, right) => {
      const delta = (values[right] ?? 0) - (values[left] ?? 0)
      const ordered = descending ? delta : -delta
      return ordered === 0 ? left - right : ordered
    })
}

/** Permutaciones de posiciones, en orden lexicográfico y acotadas. */
function permutations(size: number): readonly (readonly number[])[] {
  if (size > 4) return [Array.from({ length: size }, (_, index) => index)]
  const result: number[][] = []
  const walk = (prefix: readonly number[], left: readonly number[]) => {
    if (left.length === 0) {
      result.push([...prefix])
      return
    }
    left.forEach((value, index) =>
      walk(
        [...prefix, value],
        left.filter((_, position) => position !== index),
      ),
    )
  }
  walk(
    [],
    Array.from({ length: size }, (_, index) => index),
  )
  return result
}

/** Los vectores que la pantalla deja copiar sin ninguna operación. */
function copyVectors(
  data: readonly PresentedDatum[],
  items: readonly AuditedQuantityItem[],
  itemFigures: readonly (readonly Figure[])[],
): readonly { readonly label: string; readonly counts: readonly number[] }[] {
  const vectors: { label: string; counts: readonly number[] }[] = []

  // Una fila por ítem: `Láminas del stand · 3 / 8`. El k-ésimo número de cada
  // fila es un vector completo, y tipearlo no cuesta ninguna cuenta.
  const rows = items.map((item) =>
    data.filter((datum) => datum.label === item.label),
  )
  if (rows.every((list) => list.length === 1)) {
    const figures = rows.map(([datum]) =>
      datum === undefined ? [] : figuresOfDatum(datum),
    )
    const depth = Math.min(...figures.map((list) => list.length))
    for (let slot = 0; slot < depth; slot++)
      vectors.push({
        label:
          depth === 1
            ? 'el número de la fila de cada ítem'
            : `el ${String(slot + 1)}.º número de la fila de cada ítem`,
        counts: figures.map((list, index) =>
          clamp(list[slot]?.amount ?? 0, items[index]?.maxQuantity ?? 0),
        ),
      })
  }

  // Un número suelto de la pantalla, tipeado en todas las casillas.
  for (const datum of data) {
    if (items.some((item) => item.label === datum.label)) continue
    const figures = figuresOfDatum(datum)
    if (figures.length !== 1) continue
    const amount = figures[0]?.amount ?? 0
    vectors.push({
      label: `«${datum.label}» en todas las casillas`,
      counts: items.map((item) => clamp(amount, item.maxQuantity)),
    })
  }

  // Un número del detalle de cada ítem, tipeado en su propia casilla.
  const units = [...new Set(itemFigures.flatMap((figures) => unitsOf(figures)))]
  for (const unit of units) {
    const slots = costSlots(itemFigures, unit)
    slots.forEach((values, slot) => {
      vectors.push({
        label:
          slots.length === 1
            ? `el número «${unit}» del detalle de cada ítem`
            : `el ${String(slot + 1)}.º número «${unit}» del detalle de cada ítem`,
        counts: values.map((value, index) =>
          clamp(value, items[index]?.maxQuantity ?? 0),
        ),
      })
    })
  }
  return vectors
}

/** Reparto de un presupuesto en proporciones fijas, sin mirar rendimiento. */
function sharePatterns(size: number): readonly {
  readonly label: string
  readonly shares: readonly number[]
}[] {
  const equal = Array.from({ length: size }, () => 1)
  const patterns = [{ label: 'partes iguales', shares: equal }]
  for (let index = 0; index < size; index++)
    patterns.push({
      label: `mitad al ${String(index + 1)}.º, resto en partes iguales`,
      shares: equal.map((_, position) => (position === index ? size - 1 : 1)),
    })
  return patterns
}

/**
 * Las políticas de atajo de un espacio de cantidades.
 *
 * Genéricas por construcción: salen de la presentación, no del dominio. Una
 * Template que no imprima capacidades no recibe políticas de recurso, y una que
 * no imprima una fila por ítem no recibe copias por fila: la cobertura de cada
 * fila dice qué familias se pudieron evaluar.
 */
export function quantityShortcutPolicies(
  kind: 'quantity-builder' | 'budget-builder',
  data: readonly PresentedDatum[],
  items: readonly AuditedQuantityItem[],
): readonly NaivePolicy[] {
  const answerOf = (counts: readonly number[]): InteractionAnswer =>
    ({
      kind,
      lines: items.map((item, index) => ({
        itemId: item.id,
        quantity: clamp(counts[index] ?? 0, item.maxQuantity),
      })),
    }) as InteractionAnswer
  const maxima = items.map((item) => item.maxQuantity)
  const zeros = items.map(() => 0)
  const itemFigures = items.map((item) => figuresIn(item.detail))
  const models = resourceModels(data, itemFigures)
  const values = valueVectors(itemFigures)
  const copies = copyVectors(data, items, itemFigures)
  const policies: NaivePolicy[] = []
  const add = (
    family: StrategyFamily,
    name: string,
    counts: readonly number[],
  ) => policies.push({ family, name, answer: answerOf(counts) })

  // NORMALIZED — fracciones del máximo presentado.
  for (const [numerator, denominator, label] of [
    [0, 1, 'nada'],
    [1, 4, 'un cuarto del máximo'],
    [1, 2, 'la mitad del máximo'],
    [3, 4, 'tres cuartos del máximo'],
    [1, 1, 'todo al máximo'],
  ] as const)
    add(
      'NORMALIZED',
      label,
      maxima.map((max) => Math.floor((max * numerator) / denominator)),
    )
  add(
    'NORMALIZED',
    'proporciones iguales al menor máximo',
    items.map(() => Math.min(...maxima)),
  )

  // VISIBLE_COPY y TARGET_RELATIVE — la pantalla como respuesta.
  for (const { label, counts } of copies) {
    add('VISIBLE_COPY', `copiar ${label}`, counts)
    for (const [transform, name] of [
      [(value: number) => value - 1, 'menos 1'],
      [(value: number) => value + 1, 'más 1'],
      [(value: number) => Math.floor(value / 2), 'por la mitad'],
      [(value: number) => Math.ceil((value * 3) / 4), 'por tres cuartos'],
      [(value: number) => value * 2, 'por el doble'],
    ] as const)
      add(
        'TARGET_RELATIVE',
        `${label}, ${name}`,
        counts.map((value, index) =>
          clamp(transform(value), maxima[index] ?? 0),
        ),
      )
  }

  // RESOURCE_RELATIVE — fracciones y repartos fijos de una capacidad impresa.
  for (const model of models) {
    for (const [numerator, denominator] of [
      [1, 4],
      [1, 2],
      [3, 4],
      [1, 1],
    ] as const)
      add(
        'RESOURCE_RELATIVE',
        `${String((numerator * 100) / denominator)} % de «${model.label}», repartido por consumo`,
        model.costs.map((cost, index) =>
          cost <= 0
            ? 0
            : clamp(
                Math.floor(
                  (model.budget * numerator) /
                    (denominator * items.length * cost),
                ),
                maxima[index] ?? 0,
              ),
        ),
      )
    for (const { label, shares } of sharePatterns(items.length)) {
      const total = shares.reduce((sum, share) => sum + share, 0)
      add(
        'RESOURCE_RELATIVE',
        `«${model.label}» en ${label}`,
        model.costs.map((cost, index) =>
          cost <= 0
            ? 0
            : clamp(
                Math.floor(
                  (model.budget * (shares[index] ?? 0)) / (total * cost),
                ),
                maxima[index] ?? 0,
              ),
        ),
      )
    }
  }

  // Dos lecturas de «hasta dónde llenar»: mirando **una** capacidad —la que el
  // jugador decidió que aprieta— y mirando **todas** las impresas. Las dos son
  // reusables; la primera es más ingenua y la segunda más cuidadosa, y medir
  // sólo una de ellas subestimaría la clase.
  const scopes: readonly {
    readonly label: string
    readonly limits: readonly ResourceModel[]
  }[] = [
    ...models.map((model) => ({
      label: `«${model.label}»`,
      limits: [model],
    })),
    ...(models.length > 1
      ? [{ label: 'sin pasarse de ningún límite', limits: models }]
      : []),
    // Una pantalla que no imprime ninguna capacidad igual admite llenar en un
    // orden fijo: ahí el único tope es el de cada casilla.
    ...(models.length === 0
      ? [{ label: 'hasta el máximo de cada casilla', limits: [] }]
      : []),
  ]

  // FIXED_PRIORITY — un orden de ítems fijo, con y sin piso copiado.
  const floors: readonly {
    readonly label: string
    readonly counts: readonly number[]
  }[] = [{ label: '', counts: zeros }, ...copies.slice(0, 1)]
  for (const scope of scopes)
    for (const order of permutations(items.length))
      for (const floor of floors)
        add(
          'FIXED_PRIORITY',
          `llenar ${scope.label} en prioridad ${order.map((index) => String(index + 1)).join('>')}${floor.label === '' ? '' : ` desde ${floor.label}`}`,
          fillInOrder(items, scope.limits, order, floor.counts),
        )

  // SIMPLE_GREEDY — una razón visible, un orden, llenar.
  for (const scope of scopes)
    for (const value of values) {
      for (const model of scope.limits.length === 1 ? scope.limits : models) {
        add(
          'SIMPLE_GREEDY',
          `llenar ${scope.label} por mayor ${value.label} por ${model.unit} de «${model.label}»`,
          fillInOrder(
            items,
            scope.limits,
            ratioOrder(value.values, model.costs, true),
            zeros,
          ),
        )
        add(
          'SIMPLE_GREEDY',
          `llenar ${scope.label} por menor ${value.label} por ${model.unit} de «${model.label}»`,
          fillInOrder(
            items,
            scope.limits,
            ratioOrder(value.values, model.costs, false),
            zeros,
          ),
        )
      }
      add(
        'SIMPLE_GREEDY',
        `llenar ${scope.label} por mayor ${value.label}`,
        fillInOrder(items, scope.limits, plainOrder(value.values, true), zeros),
      )
      add(
        'SIMPLE_GREEDY',
        `llenar ${scope.label} por menor ${value.label}`,
        fillInOrder(
          items,
          scope.limits,
          plainOrder(value.values, false),
          zeros,
        ),
      )
    }

  // DOMAIN_NAIVE — un solo ítem, todo lo que esa capacidad permita.
  for (const scope of scopes)
    items.forEach((item, index) =>
      add(
        'DOMAIN_NAIVE',
        `sólo «${item.label}» en ${scope.label}, hasta donde entre`,
        fillInOrder(items, scope.limits, [index], zeros),
      ),
    )

  return byName(policies)
}

/* -------------------------------------------------------------------------
 * Entrada numérica
 * ---------------------------------------------------------------------- */

/** Cuántas cifras de la pantalla se combinan de a pares. Cota determinista. */
const MAX_NUMERIC_FIGURES = 6

/**
 * Atajos de una entrada numérica: tipear un número que está a la vista, o el
 * resultado de una cuenta obvia entre dos de ellos.
 *
 * La enumeración exhaustiva del rango ya cubre toda constante; lo que agrega
 * esto es lo **relativo a la variante**, que es justamente lo que una constante
 * no puede expresar.
 */
export function numericShortcutPolicies(
  view: Extract<InteractionPresentation, { kind: 'numeric-input' }>,
): readonly NaivePolicy[] {
  const min = Number(view.min)
  const max = Number(view.max)
  if (!Number.isInteger(min) || !Number.isInteger(max)) return []
  const answerOf = (value: number): InteractionAnswer => ({
    kind: 'numeric-input',
    value: String(value),
  })
  const inRange = (value: number) =>
    Number.isSafeInteger(value) && value >= min && value <= max
  const figures = [
    ...new Set(
      view.data.flatMap((datum) =>
        figuresOfDatum(datum).map((figure) => figure.amount),
      ),
    ),
  ].slice(0, MAX_NUMERIC_FIGURES)

  const policies: NaivePolicy[] = []
  for (const [numerator, denominator, label] of [
    [0, 1, 'el mínimo del rango'],
    [1, 2, 'el medio del rango'],
    [1, 1, 'el máximo del rango'],
  ] as const)
    policies.push({
      family: 'NORMALIZED',
      name: label,
      answer: answerOf(
        min + Math.floor(((max - min) * numerator) / denominator),
      ),
    })
  for (const amount of figures)
    if (inRange(amount))
      policies.push({
        family: 'VISIBLE_COPY',
        name: `copiar el número ${String(amount)} de la pantalla`,
        answer: answerOf(amount),
      })
  for (const left of figures)
    for (const right of figures) {
      if (left === right) continue
      for (const [compute, label] of [
        [(a: number, b: number) => a + b, '+'],
        [(a: number, b: number) => a - b, '−'],
        [(a: number, b: number) => a * b, '×'],
        [
          (a: number, b: number) => (b === 0 ? Number.NaN : Math.floor(a / b)),
          '÷ (piso)',
        ],
        [
          (a: number, b: number) => (b === 0 ? Number.NaN : Math.ceil(a / b)),
          '÷ (techo)',
        ],
      ] as const) {
        const value = compute(left, right)
        if (inRange(value))
          policies.push({
            family: 'DOMAIN_NAIVE',
            name: `${String(left)} ${label} ${String(right)}`,
            answer: answerOf(value),
          })
      }
    }
  return byName(policies)
}

/* -------------------------------------------------------------------------
 * Opciones
 * ---------------------------------------------------------------------- */

/**
 * Atajos de un espacio de opciones: elegir siempre por una cifra impresa.
 *
 * «La más barata», «la más larga», «la primera». La enumeración exhaustiva de
 * opciones cubre toda constante posicional, pero no cubre elegir **en función
 * de los números de esta variante**, que es lo que un jugador reusa.
 */
export function optionShortcutPolicies(
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
): readonly NaivePolicy[] {
  const answerOf = (id: string): InteractionAnswer =>
    ({ kind, optionId: id }) as InteractionAnswer
  const policies: NaivePolicy[] = []
  const first = options[0]
  const last = options[options.length - 1]
  if (first !== undefined)
    policies.push({
      family: 'FIXED_PRIORITY',
      name: 'la primera opción',
      answer: answerOf(first.id),
    })
  if (last !== undefined && options.length > 1)
    policies.push({
      family: 'FIXED_PRIORITY',
      name: 'la última opción',
      answer: answerOf(last.id),
    })

  const figures = options.map((option) => figuresOfOption(option))
  const units = [...new Set(figures.flatMap((list) => unitsOf(list)))]
  for (const unit of units) {
    const perOption = figures.map((list) => figuresOfUnit(list, unit))
    const depth = Math.min(...perOption.map((list) => list.length))
    for (let slot = 0; slot < depth; slot++) {
      const amounts = perOption.map((list) => list[slot] ?? 0)
      for (const descending of [false, true]) {
        const pick = plainOrder(amounts, descending)[0]
        const option = pick === undefined ? undefined : options[pick]
        if (option === undefined) continue
        policies.push({
          family: 'SIMPLE_GREEDY',
          name: `la opción con ${descending ? 'mayor' : 'menor'} «${unit}${depth === 1 ? '' : ` #${String(slot + 1)}`}»`,
          answer: answerOf(option.id),
        })
      }
    }
  }
  return byName(policies)
}

/** Cifras de una etiqueta suelta, para las familias que las necesiten. */
export { figuresIn, normalizeUnit }
