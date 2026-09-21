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
  dimensionKey,
  dimensionLabel,
  dimensionsOf,
  figuresIn,
  figuresOfDatum,
  figuresOfDimension,
  figuresOfOption,
  figuresOfUnit,
  labelNames,
  normalizeUnit,
  parseRateUnit,
  unitsOf,
  type Dimension,
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

/**
 * De dónde sale una política: de las cifras de la variante, o de la forma de la
 * pantalla.
 *
 * `attribute` lee lo que la pantalla imprime **para esta variante** —costos,
 * capacidades, horas, estrellas— y por eso se adapta a cada una. `positional`
 * sale de la forma: la primera opción, el orden presentado, todo o nada.
 *
 * La distinción existe porque una fila «cubierta» sólo por políticas
 * posicionales no está auditada a la misma profundidad que una que además probó
 * las derivadas de atributos, y reportar las dos igual exagera la cobertura
 * (MAT-FC-002).
 */
export type PolicyDerivation = 'attribute' | 'positional'

/** Una política ingenua: determinista, y ciega a la respuesta esperada. */
export interface NaivePolicy {
  readonly name: string
  readonly family: StrategyFamily
  readonly derivation: PolicyDerivation
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

/** Una capacidad impresa y lo que cada ítem le consume, en la misma magnitud. */
interface ResourceModel {
  readonly label: string
  readonly unit: string
  /** La magnitud semántica que este modelo mide, no sólo su unidad impresa. */
  readonly dimension: Dimension
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

/** Las magnitudes que los ítems imprimen, sin repetir y en orden de lectura. */
function dimensionsIn(
  itemFigures: readonly (readonly Figure[])[],
): readonly Dimension[] {
  return [
    ...new Map(
      itemFigures
        .flatMap((figures) => dimensionsOf(figures))
        .map((dimension) => [dimensionKey(dimension), dimension]),
    ).values(),
  ]
}

/**
 * Las cifras de la magnitud `dimension` que **todos** los ítems imprimen.
 *
 * Por magnitud y no por unidad: si la pantalla dice «min de notebook», esos
 * minutos no son los mismos que los de otra capacidad impresa en minutos, y
 * mezclarlos ata un costo a un presupuesto ajeno (MAT-FC-001).
 */
function costSlots(
  itemFigures: readonly (readonly Figure[])[],
  dimension: Dimension,
): readonly (readonly number[])[] {
  const perItem = itemFigures.map((figures) =>
    figuresOfDimension(figures, dimension),
  )
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
  const dimensions = dimensionsIn(itemFigures)
  const slotsByDimension = new Map<string, readonly (readonly number[])[]>(
    dimensions.map((dimension) => [
      dimensionKey(dimension),
      costSlots(itemFigures, dimension),
    ]),
  )
  const rates = data.flatMap((datum) => {
    const rate = parseRateUnit(datum.unit)
    const amount = figuresIn(datum.value)[0]?.amount
    return rate === undefined || amount === undefined || amount <= 0
      ? []
      : [{ label: datum.label, rate, amount }]
  })

  const constraints = data.filter((datum) => datum.constraint === true)
  /**
   * Las magnitudes de `unit` que la pantalla **sí** deja desambiguar.
   *
   * Una magnitud con recurso nombrado —«min de notebook»— sólo se ata a la
   * capacidad cuya etiqueta nombra ese recurso. Si ninguna la nombra, la
   * pantalla no dice de quién es y se vuelve al comportamiento por unidad: la
   * corrección nunca puede **perder** una restricción real.
   */
  const claims = new Map<string, boolean>(
    dimensions.map((dimension) => [
      dimensionKey(dimension),
      dimension.of !== '' &&
        constraints.some(
          (datum) =>
            figuresOfDatum(datum)[0]?.unit === dimension.unit &&
            labelNames(datum.label, dimension.of),
        ),
    ]),
  )

  const models: ResourceModel[] = []
  const push = (
    label: string,
    dimension: Dimension,
    budget: number,
    slotIndex: number,
  ) => {
    const costs = slotsByDimension.get(dimensionKey(dimension))?.[slotIndex]
    if (costs === undefined || costs.every((cost) => cost <= 0)) return
    if (budget <= 0) return
    models.push({ label, unit: dimension.unit, dimension, budget, costs })
  }

  /** Las magnitudes que esta capacidad puede medir, ya desambiguadas. */
  const boundTo = (datum: PresentedDatum, unit: string) =>
    dimensions.filter((dimension) => {
      if (dimension.unit !== unit) return false
      if (claims.get(dimensionKey(dimension)) !== true) return true
      return labelNames(datum.label, dimension.of)
    })

  for (const datum of data) {
    if (datum.constraint !== true) continue
    const figure = figuresOfDatum(datum)[0]
    if (figure === undefined) continue
    for (const dimension of boundTo(datum, figure.unit)) {
      const direct = slotsByDimension.get(dimensionKey(dimension)) ?? []
      direct.forEach((_, slot) =>
        push(
          direct.length === 1
            ? datum.label
            : `${datum.label} #${String(slot + 1)}`,
          dimension,
          figure.amount,
          slot,
        ),
      )
    }
    for (const { label, rate, amount } of rates) {
      if (rate.per !== figure.unit) continue
      for (const dimension of dimensions) {
        if (dimension.unit !== rate.produced) continue
        const converted = slotsByDimension.get(dimensionKey(dimension)) ?? []
        converted.forEach((_, slot) =>
          push(
            `${datum.label} a ${rate.produced} (${label})`,
            dimension,
            figure.amount * amount,
            slot,
          ),
        )
      }
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
  for (const dimension of dimensionsIn(itemFigures)) {
    const name = dimensionLabel(dimension)
    const slots = costSlots(itemFigures, dimension)
    slots.forEach((values, slot) => {
      vectors.push({
        label: slots.length === 1 ? name : `${name} #${String(slot + 1)}`,
        values,
      })
    })
    // La diferencia entre dos cifras de la misma magnitud: «lo que deja cada
    // bandeja» es precio menos costo, y las dos están impresas.
    for (let later = 1; later < slots.length; later++)
      for (let earlier = 0; earlier < later; earlier++) {
        const values = (slots[later] ?? []).map(
          (value, index) => value - (slots[earlier]?.[index] ?? 0),
        )
        if (values.every((value) => value > 0))
          vectors.push({
            label: `${name} #${String(later + 1)} − #${String(earlier + 1)}`,
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
  for (const dimension of dimensionsIn(itemFigures)) {
    const name = dimensionLabel(dimension)
    const slots = costSlots(itemFigures, dimension)
    slots.forEach((values, slot) => {
      vectors.push({
        label:
          slots.length === 1
            ? `el número «${name}» del detalle de cada ítem`
            : `el ${String(slot + 1)}.º número «${name}» del detalle de cada ítem`,
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
  ) =>
    policies.push({
      family,
      name,
      // `NORMALIZED` es una fracción de la forma de la pantalla y no compara
      // magnitudes entre ítems; el resto sí lee las cifras de la variante —el
      // detalle de cada ítem, las capacidades del encabezado— y se adapta a
      // ellas.
      derivation: family === 'NORMALIZED' ? 'positional' : 'attribute',
      answer: answerOf(counts),
    })

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
 * Tableros de asignación
 * ---------------------------------------------------------------------- */

/** Una persona o una tarea, como la pantalla la imprime. */
export interface AuditedAssignee {
  readonly id: string
  readonly label: string
  readonly detail: string
}

/** La primera cifra del detalle, que es la magnitud que la fila anuncia. */
function leadingAmount(detail: string): number | undefined {
  return figuresIn(detail)[0]?.amount
}

/**
 * Cuánto vale una tarea para una persona, según lo que la fila de esa persona
 * imprime **al lado del nombre de la tarea**.
 *
 * `Investigación ★★★` vale 3 y `Diseño ★` vale 1: la marca repetida es la
 * escala que la pantalla usa. Un número escrito ahí también sirve. Si la fila
 * no nombra la tarea, no hay valor y la política no se ofrece.
 */
function ratingFor(detail: string, taskLabel: string): number | undefined {
  // Las etiquetas compuestas —`Fútbol · mañana`— se anuncian por su primer
  // tramo, que es como la fila de la persona las nombra.
  const head = (taskLabel.split('·')[0] ?? '').trim()
  if (head === '') return undefined
  const at = detail.toLowerCase().indexOf(head.toLowerCase())
  if (at < 0) return undefined
  const rest = detail.slice(at + head.length)
  const number = /^[^\p{L}\d]*(\d+)/u.exec(rest)
  if (number?.[1] !== undefined) return Number(number[1])
  const marks = /^\s*(\S)\1*/u.exec(rest)
  return marks?.[0] === undefined ? undefined : marks[0].trim().length
}

/** Orden total por una magnitud leída, con la posición como desempate. */
function byAmount(
  amounts: readonly (number | undefined)[],
  descending: boolean,
): readonly number[] {
  return amounts
    .map((_, index) => index)
    .sort((left, right) => {
      const a = amounts[left] ?? 0
      const b = amounts[right] ?? 0
      return (descending ? b - a : a - b) || left - right
    })
}

/**
 * Atajos de un tablero de asignación derivados de lo que la pantalla imprime.
 *
 * Hasta el cierre, este motor sólo recibía patrones posicionales —cíclica,
 * equilibrada, preservar el orden—, así que una regla de una sola magnitud
 * visible quedaba sin medir aunque la pantalla la ofreciera en bandeja
 * (MAT-FC-002). Estas leen las cifras y las marcas de cada fila, y nada más:
 * no conocen la respuesta esperada ni el identificador de la Template.
 *
 * La respuesta nombra, para cada tarea, a quién le toca. Una persona no se
 * repite: estas políticas reparten, no duplican.
 */
export function assignmentShortcutPolicies(
  agents: readonly AuditedAssignee[],
  tasks: readonly AuditedAssignee[],
  answerOf: (
    pick: (taskIndex: number) => string | undefined,
  ) => InteractionAnswer,
): readonly NaivePolicy[] {
  if (agents.length === 0 || tasks.length === 0) return []
  const policies: NaivePolicy[] = []
  const add = (
    family: StrategyFamily,
    name: string,
    pick: readonly (number | undefined)[],
  ) =>
    policies.push({
      family,
      name,
      derivation: 'attribute',
      answer: answerOf((index) => {
        const agent = pick[index]
        return agent === undefined ? undefined : agents[agent]?.id
      }),
    })

  const agentAmounts = agents.map((agent) => leadingAmount(agent.detail))
  const taskAmounts = tasks.map((task) => leadingAmount(task.detail))
  const everyAgent = agentAmounts.every((amount) => amount !== undefined)
  const everyTask = taskAmounts.every((amount) => amount !== undefined)

  // Emparejar por magnitud: la fila que más anuncia con la tarea que más pide,
  // y los tres cruces restantes. Una sola comparación por lado.
  if (everyAgent && everyTask)
    for (const agentsFirst of [true, false])
      for (const tasksFirst of [true, false]) {
        const orderedAgents = byAmount(agentAmounts, agentsFirst)
        const orderedTasks = byAmount(taskAmounts, tasksFirst)
        const pick: (number | undefined)[] = tasks.map(() => undefined)
        orderedTasks.forEach((task, rank) => {
          pick[task] = orderedAgents[rank]
        })
        add(
          'SIMPLE_GREEDY',
          `la persona de ${agentsFirst ? 'mayor' : 'menor'} cifra a la tarea de ${tasksFirst ? 'mayor' : 'menor'} cifra`,
          pick,
        )
      }

  // La primera persona a la que la cifra le alcanza, tarea por tarea. Es el
  // «primer hueco» del tablero: una comparación, sin buscar el mejor reparto.
  if (everyAgent && everyTask) {
    const taken = new Set<number>()
    const pick = tasks.map((_, index) => {
      const need = taskAmounts[index] ?? 0
      const found = agents.findIndex(
        (_agent, position) =>
          !taken.has(position) && (agentAmounts[position] ?? 0) >= need,
      )
      if (found < 0) return undefined
      taken.add(found)
      return found
    })
    add('SIMPLE_GREEDY', 'la primera persona a la que le alcanza', pick)
  }

  // Por lo que cada fila dice que se le da a cada tarea. Sin mirar capacidad.
  const ratings = agents.map((agent) =>
    tasks.map((task) => ratingFor(agent.detail, task.label)),
  )
  const rated = ratings.every((row) =>
    row.every((value) => value !== undefined),
  )
  if (rated)
    for (const best of [true, false]) {
      const taken = new Set<number>()
      const pick = tasks.map((_, task) => {
        const order = byAmount(
          agents.map((_agent, agent) => ratings[agent]?.[task]),
          best,
        ).filter((agent) => !taken.has(agent))
        const chosen = order[0]
        if (chosen === undefined) return undefined
        taken.add(chosen)
        return chosen
      })
      add(
        'SIMPLE_GREEDY',
        `cada tarea a quien ${best ? 'mejor' : 'peor'} la hace`,
        pick,
      )
    }
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
      // El rango es la forma del control, no una cifra del enunciado.
      derivation: 'positional',
      answer: answerOf(
        min + Math.floor(((max - min) * numerator) / denominator),
      ),
    })
  for (const amount of figures)
    if (inRange(amount))
      policies.push({
        family: 'VISIBLE_COPY',
        name: `copiar el número ${String(amount)} de la pantalla`,
        derivation: 'attribute',
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
            derivation: 'attribute',
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
      derivation: 'positional',
      answer: answerOf(first.id),
    })
  if (last !== undefined && options.length > 1)
    policies.push({
      family: 'FIXED_PRIORITY',
      name: 'la última opción',
      derivation: 'positional',
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
          derivation: 'attribute',
          answer: answerOf(option.id),
        })
      }
    }
  }
  return byName(policies)
}

/** Cifras de una etiqueta suelta, para las familias que las necesiten. */
export { figuresIn, normalizeUnit }
