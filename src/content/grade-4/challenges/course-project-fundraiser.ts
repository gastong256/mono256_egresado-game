/**
 * 4.º · Proyecto del Curso IV (`y4.course-project-fundraiser`) y su Repaso
 * (`y4.margin-review`).
 *
 * El curso organiza la peña para juntar plata. Hay un costo fijo que se paga
 * exista o no la venta, tres cosas para vender con su costo y su precio, y una
 * cocina que sólo da para tanto. La decisión es cuánto preparar de cada cosa.
 *
 * Cubrir los costos y llegar al objetivo son dos cosas distintas, y ésa es la
 * matemática del año: la primera es que la cuenta no dé negativa, la segunda es
 * que sobre lo suficiente. Una variante que se resuelva mirando el margen por
 * unidad no se aprueba: la cocina es compartida, así que lo que decide es el
 * margen por minuto de cocina, y el señuelo es exactamente el otro.
 *
 * No es el umbral de usos de 3.º: allá se elegía entre formas de pagar lo
 * propio, acá se produce para un objetivo del curso con una capacidad común.
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
  type ChallengeDefinition,
  type EstiloAxis,
  type InteractionAnswer,
  type SolutionQuality,
} from '@/game'
import {
  at,
  candidateAxes,
  digit,
  generatedSource,
  mil,
  outcome,
  parameters,
  quantity,
  quantityIssues,
  spaceOf,
  styleGateIssues,
  tierWitnessIssues,
  type StyledPlan,
} from '@/content/authoring'
import { projectArcCallback } from '../../career-facts'
import { graded } from '../../grades'

/** Se vende por bandeja: los números quedan legibles y la cuenta, entera. */
export const ITEMS = [
  { id: 'panchos', label: 'Bandeja de panchos', per: 10, max: 8 },
  { id: 'tortas', label: 'Bandeja de tortas', per: 8, max: 6 },
  { id: 'bebidas', label: 'Cajón de bebidas', per: 12, max: 9 },
] as const
export type ItemId = (typeof ITEMS)[number]['id']

const money = z.number().int().min(100).max(200_000).multipleOf(100)
const item = z.strictObject({
  /** Lo que sale preparar una bandeja y lo que se cobra por ella. */
  cost: money,
  price: money,
  /** Minutos de cocina que ocupa. La cocina es de todos. */
  minutes: z.number().int().min(5).max(90).multipleOf(5),
})
export const fundraiserSchema = z
  .strictObject({
    shape: z.enum(['rinden-panchos', 'rinden-tortas', 'rinden-bebidas']),
    /** El costo fijo: se paga aunque no se venda nada. */
    fixedCost: money,
    /** Lo que el curso necesita juntar, y el colchón que quiere dejar. */
    target: money,
    reserve: money,
    /** Minutos de cocina disponibles. */
    kitchenMinutes: z.number().int().min(60).max(600).multipleOf(10),
    items: z.tuple([item, item, item]),
  })
  .refine(
    (p) => p.items.every((entry) => entry.price > entry.cost),
    'una bandeja se vende a menos de lo que cuesta',
  )
export type FundraiserParams = z.infer<typeof fundraiserSchema>

export function marginOf(p: FundraiserParams, index: number): number {
  const entry = p.items[index]
  return entry === undefined ? 0 : entry.price - entry.cost
}

export interface FundraiserOutcome {
  readonly quality: SolutionQuality
  /** Lo que queda después de pagar el costo fijo y lo que costó producir. */
  readonly profit: number
  readonly minutes: number
  readonly style?: EstiloAxis
}

/**
 * La lectura completa de una producción.
 *
 * Toda la plata en pesos enteros. La cocina se mide aparte de la plata porque
 * son dos límites distintos: uno dice cuánto podés hacer y el otro, cuánto te
 * queda.
 */
export function readFundraiser(
  p: FundraiserParams,
  lines: readonly BudgetLine[],
): FundraiserOutcome {
  const counts = ITEMS.map((entry) => quantity(lines, entry.id))
  const minutes = counts.reduce(
    (total, count, index) => total + count * (p.items[index]?.minutes ?? 0),
    0,
  )
  const revenue = counts.reduce(
    (total, count, index) => total + count * (p.items[index]?.price ?? 0),
    0,
  )
  const variable = counts.reduce(
    (total, count, index) => total + count * (p.items[index]?.cost ?? 0),
    0,
  )
  const profit = revenue - variable - p.fixedCost

  // Escalera escrita: primero que la cuenta no dé negativa, después que
  // alcance el objetivo, y recién después que quede el colchón. Cubrir costos
  // y llegar al objetivo son dos niveles distintos a propósito.
  const quality: SolutionQuality =
    minutes > p.kitchenMinutes || profit < 0
      ? 'invalid'
      : profit >= p.target + p.reserve
        ? 'optimal'
        : profit >= p.target
          ? 'efficient'
          : 'functional'

  // Estilo describe la forma de la producción, nunca cuánto se juntó: dejar
  // cocina sin usar, concentrarse en una sola cosa o preparar de todo pueden
  // pasar con o sin objetivo cumplido.
  const used = counts.filter((count) => count > 0).length
  const style: EstiloAxis | undefined =
    quality === 'invalid'
      ? undefined
      : minutes * 4 < p.kitchenMinutes * 3
        ? 'improvisador'
        : used <= 1
          ? 'estratega'
          : 'aplicado'

  return { quality, profit, minutes, ...(style === undefined ? {} : { style }) }
}

export interface FundraiserPlan extends StyledPlan {
  readonly lines: readonly BudgetLine[]
  readonly profit: number
}

/** Enumeración de witnesses con el evaluador. El oráculo independiente vive en tests. */
export function fundraiserPlans(
  p: FundraiserParams,
): readonly FundraiserPlan[] {
  const plans: FundraiserPlan[] = []
  const [first, second, third] = ITEMS
  if (first === undefined || second === undefined || third === undefined)
    return plans
  for (let a = 0; a <= first.max; a++)
    for (let b = 0; b <= second.max; b++)
      for (let c = 0; c <= third.max; c++) {
        const lines = [
          { itemId: first.id, quantity: a },
          { itemId: second.id, quantity: b },
          { itemId: third.id, quantity: c },
        ]
        const read = readFundraiser(p, lines)
        plans.push({
          lines,
          quality: read.quality,
          profit: read.profit,
          ...(read.style === undefined ? {} : { style: read.style }),
        })
      }
  return plans
}

const SHAPES = ['rinden-panchos', 'rinden-tortas', 'rinden-bebidas'] as const
/**
 * Lo que sale preparar cada bandeja, por posición.
 *
 * El rango es ancho a propósito: con costos parecidos, ordenar por **precio**
 * por minuto da la misma decisión que ordenar por **margen** por minuto, y el
 * año entero se resuelve sin restar lo que cuesta preparar —que es exactamente
 * el error que `y4.margin-review` existe para reparar—. El gate lo comprueba
 * variante por variante.
 */
const COSTS = [
  [1600, 8000, 4000],
  [8000, 1600, 4000],
  [4000, 8000, 1600],
  [1600, 4000, 8000],
  [8000, 4000, 1600],
  [4000, 1600, 8000],
] as const
// De mayor a menor margen por minuto. El mayor margen por bandeja
// queda último: leer sólo el precio no resuelve la capacidad compartida.
const ORDERS = [
  [0, 1, 2],
  [1, 2, 0],
  [2, 0, 1],
  [0, 2, 1],
  [1, 0, 2],
  [2, 1, 0],
] as const
/**
 * Las seis economías de la peña: qué deja y cuánto ocupa cada bandeja.
 *
 * El índice **es** el rango por margen por minuto de cocina: la entrada 0 es
 * siempre la que más deja por minuto. Lo que cambia entre economías es cuántos
 * minutos ocupa cada rango, y ahí está la corrección de MAT-RA2-002.
 *
 * Antes los minutos eran una constante del rango —`[10, 25, 40]`, siempre
 * ascendente—, así que «ordenar por menos minutos» **era** ordenar por mayor
 * margen por minuto, en las 25 variantes publicadas y en cualquier catálogo que
 * el generador pudiera emitir. Rotar qué producto ocupaba cada rango cambiaba la
 * etiqueta, no la economía: el multiset `(margen, minutos)` era uno solo en todo
 * el catálogo. Permutar etiquetas no es diversidad económica.
 *
 * Acá el catálogo contiene seis economías de verdad distintas. En dos de ellas
 * la bandeja más rápida es también la que más deja por minuto —a veces lo barato
 * y rápido sí es lo mejor, y negarlo sería falso—; en las otras cuatro no, y en
 * dos es directamente la peor. Ninguna ordenación simple domina el catálogo.
 *
 * Dos invariantes que el gate vuelve a comprobar sobre la variante materializada:
 * el margen por minuto baja estrictamente con el rango, y la bandeja de mayor
 * margen **por unidad** nunca es la de rango 0 —ése es el señuelo declarado del
 * Intrinsic Math Gate—.
 */
const ECONOMIES = [
  [
    { margin: 3000, minutes: 15 },
    { margin: 4000, minutes: 25 },
    { margin: 4800, minutes: 40 },
  ],
  [
    { margin: 5000, minutes: 25 },
    { margin: 1500, minutes: 10 },
    { margin: 5400, minutes: 40 },
  ],
  [
    { margin: 5000, minutes: 20 },
    { margin: 6000, minutes: 40 },
    { margin: 1200, minutes: 10 },
  ],
  [
    { margin: 4000, minutes: 20 },
    { margin: 4800, minutes: 40 },
    { margin: 1500, minutes: 15 },
  ],
  [
    { margin: 3600, minutes: 15 },
    { margin: 5000, minutes: 25 },
    { margin: 1500, minutes: 20 },
  ],
  [
    { margin: 4500, minutes: 20 },
    { margin: 6000, minutes: 30 },
    { margin: 2400, minutes: 25 },
  ],
] as const
const FIXED = [
  8_000, 10_000, 12_000, 14_000, 16_000, 18_000, 20_000, 22_000,
] as const
const KITCHEN = [120, 150, 180, 210, 240, 270, 300] as const
const RESERVE = 6_000
/** Cuánto por debajo del techo cae el objetivo con colchón. */
const SLACKS = [1000, 2000, 3000] as const
/**
 * Papel de una dirección: qué orden económico y qué economía le tocan.
 *
 * Con paso 1 sobre una única lectura de base mixta los dígitos lentos se
 * quedaban en su primer valor durante las treinta direcciones que el barrido
 * visita, así que el catálogo publicado recorría 30 de 1296 direcciones y
 * congelaba la mitad de los ejes (MAT-RA2-005). Generar **por papel** —como ya
 * hace 3.º— lo arregla de raíz: el papel se reparte por construcción y la
 * búsqueda sólo elige magnitudes.
 *
 * La economía rota **desfasada** contra el orden: sin ese desfasaje seis
 * dividiría a seis y cada orden quedaría atado a una sola economía.
 */
const SEARCH_RADICES = [
  KITCHEN.length,
  COSTS.length,
  FIXED.length,
  SLACKS.length,
]
const SEARCH_SPACE = spaceOf(SEARCH_RADICES)
/** Coprimo con 1008 = 2⁴·3²·7: la búsqueda recorre el espacio entero. */
const SEARCH_STRIDE = 115
/** Cada dirección arranca su búsqueda en un punto distinto del espacio. */
const SEARCH_STEP = 5
const ROLE_CYCLE = ORDERS.length * ECONOMIES.length
export const FUNDRAISER_SPACE = ROLE_CYCLE * SEARCH_SPACE

export function fundraiserRoleOf(index: number): {
  readonly order: (typeof ORDERS)[number]
  readonly economy: (typeof ECONOMIES)[number]
} {
  const cycle = Math.abs(index)
  return {
    order: at(ORDERS, cycle % ORDERS.length),
    economy: at(ECONOMIES, cycle + Math.floor(cycle / ORDERS.length)),
  }
}

/**
 * Lo máximo que la peña puede dejar con la cocina que hay.
 *
 * El objetivo se calibra contra **este** techo, y no contra el mejor plan que
 * deja tres cuartos de cocina libre, que es como se calibraba antes. Esa
 * calibración vieja es la causa raíz que la ronda 2 no vio: el techo con cocina
 * libre queda muy por debajo de lo que rinde llenar la cocina, así que casi
 * cualquier producción que la llenara pasaba el objetivo con colchón —el 47 % de
 * los planes válidos era `optimal`— y cualquier reparto ciego caía adentro por
 * volumen. Con el techo real, llegar exige acercarse al óptimo, y acercarse al
 * óptimo exige el margen de contribución por minuto de cocina.
 *
 * Estilo no se tocó: un óptimo que deja cocina libre sigue siendo posible —lo
 * comprueba el gate de Estilo variante por variante—, sólo que ahora es una
 * propiedad que la variante tiene que ganarse, no una que el objetivo regala.
 */
function bestProfit(
  items: FundraiserParams['items'],
  kitchen: number,
  fixed: number,
): number {
  let best = -fixed
  for (let a = 0; a <= ITEMS[0].max; a++)
    for (let b = 0; b <= ITEMS[1].max; b++)
      for (let c = 0; c <= ITEMS[2].max; c++) {
        const counts = [a, b, c]
        const minutes = items.reduce(
          (sum, item, i) => sum + item.minutes * (counts[i] ?? 0),
          0,
        )
        if (minutes > kitchen) continue
        const profit = items.reduce(
          (sum, item, i) => sum + (item.price - item.cost) * (counts[i] ?? 0),
          -fixed,
        )
        best = Math.max(best, profit)
      }
  return best
}

/** La producción que reparte la cocina en partes iguales, sin mirar márgenes. */
export function evenKitchenSplit(p: FundraiserParams): readonly BudgetLine[] {
  const share = Math.floor(p.kitchenMinutes / ITEMS.length)
  return ITEMS.map((entry, index) => ({
    itemId: entry.id,
    quantity: Math.min(
      entry.max,
      Math.floor(share / (p.items[index]?.minutes ?? 1)),
    ),
  }))
}

/** La producción que llena la cocina empezando por donde `order` dice. */
export function fillKitchen(
  p: FundraiserParams,
  order: readonly number[],
): readonly BudgetLine[] {
  const counts = ITEMS.map(() => 0)
  let left = p.kitchenMinutes
  for (const position of order) {
    const minutes = p.items[position]?.minutes ?? 1
    const take = Math.min(ITEMS[position]?.max ?? 0, Math.floor(left / minutes))
    counts[position] = take
    left -= take * minutes
  }
  return ITEMS.map((entry, index) => ({
    itemId: entry.id,
    quantity: counts[index] ?? 0,
  }))
}

/**
 * La variante de una dirección: su papel, y la primera magnitud que lo sostiene.
 *
 * El papel —orden económico y economía— lo fija la dirección. Lo que se busca
 * son las magnitudes: cuánta cocina hay, cuánto cuesta cada bandeja, cuánto es
 * el costo fijo y qué tan ajustado queda el objetivo. La primera combinación que
 * pasa todos los gates es la variante; si no aparece ninguna, devuelve la última
 * probada y el gate la rechaza.
 */
export function generateFundraiser(index: number): FundraiserParams {
  const { order, economy } = fundraiserRoleOf(index)
  const shape = at(SHAPES, order[0])
  let last: FundraiserParams | undefined
  for (let attempt = 0; attempt < SEARCH_SPACE; attempt++) {
    const axes = candidateAxes(
      index * SEARCH_STEP + attempt,
      SEARCH_RADICES,
      SEARCH_STRIDE,
    )
    const kitchenMinutes = at(KITCHEN, digit(axes, 0))
    const costs = at(COSTS, digit(axes, 1))
    const fixedCost = at(FIXED, digit(axes, 2))
    const slack = at(SLACKS, digit(axes, 3))
    const items = ITEMS.map((_, position) => {
      const rank = order.findIndex((item) => item === position)
      const cost = costs[position] ?? costs[0]
      const tray = economy[rank] ?? economy[0]
      return { cost, price: cost + tray.margin, minutes: tray.minutes }
    }) as FundraiserParams['items']
    const ceiling = bestProfit(items, kitchenMinutes, fixedCost)
    const candidate = fundraiserSchema.safeParse({
      shape,
      fixedCost,
      reserve: RESERVE,
      kitchenMinutes,
      items,
      target: Math.max(
        1000,
        Math.floor((ceiling - RESERVE - slack) / 1000) * 1000,
      ),
    })
    if (!candidate.success) continue
    last = candidate.data
    if (fundraiserGates(candidate.data).length === 0) return candidate.data
  }
  if (last === undefined)
    throw new Error(`sin variante para la dirección ${String(index)}`)
  return last
}

/**
 * Gate de dirección: la variante juega la economía que su dirección nombra.
 *
 * Sin esto el catálogo podría aprobar veinticinco variantes de la misma
 * economía —que es exactamente lo que pasó en la ronda 2— y la diversidad
 * quedaría librada a lo que el barrido produjera. Con esto, el prefijo publicado
 * rota las seis por construcción.
 */
export function fundraiserRoleGates(
  p: FundraiserParams,
  index: number,
): readonly string[] {
  const { order, economy } = fundraiserRoleOf(index)
  const issues: string[] = []
  order.forEach((position, rank) => {
    const tray = p.items[position]
    const expected = economy[rank]
    if (
      tray === undefined ||
      expected === undefined ||
      tray.price - tray.cost !== expected.margin ||
      tray.minutes !== expected.minutes
    )
      issues.push('la variante no juega la economía de su dirección')
  })
  return [...new Set(issues)]
}

/**
 * Gates baratos: los que no necesitan enumerar el espacio entero.
 *
 * Van primero y cortan. La búsqueda del generador prueba cientos de magnitudes
 * por dirección y la enumeración de 630 planes es lo caro; casi todas las
 * candidatas mueren acá, sin pagarla.
 */
function fundraiserShapeIssues(p: FundraiserParams): readonly string[] {
  const issues: string[] = []
  const ceiling = bestProfit(p.items, p.kitchenMinutes, p.fixedCost)
  if (ceiling - p.target - p.reserve > Math.max(...SLACKS))
    issues.push('el objetivo con colchón queda lejos del techo de la cocina')
  if (p.target < 4000)
    issues.push('el objetivo es demasiado chico para decidir nada')

  // La cocina tiene que apretar: si entra todo, no hay nada que decidir.
  const everything = ITEMS.map((entry) => ({
    itemId: entry.id,
    quantity: entry.max,
  }))
  if (readFundraiser(p, everything).quality !== 'invalid')
    issues.push('la cocina alcanza para todo')

  // Señuelo del Intrinsic Math Gate: el mejor margen por bandeja no puede ser
  // el mejor margen por minuto de cocina, o la decisión se toma sin mirar la
  // capacidad compartida.
  const byUnit = ITEMS.map((_, index) => marginOf(p, index))
  const bestUnit = byUnit.indexOf(Math.max(...byUnit))
  const byMinute = [0, 1, 2].sort(
    (a, b) =>
      marginOf(p, b) * (p.items[a]?.minutes ?? 1) -
        marginOf(p, a) * (p.items[b]?.minutes ?? 1) || a - b,
  )
  if (bestUnit === byMinute[0])
    issues.push('el mejor margen por bandeja ya es el mejor por minuto')

  // El margen por minuto tiene que ordenar de verdad: dos bandejas empatadas
  // dejarían la decisión indeterminada y el techo del contrato sin sentido.
  // Comparación cruzada entera, sin división ni coma.
  for (let rank = 1; rank < byMinute.length; rank++) {
    const better = byMinute[rank - 1] ?? 0
    const worse = byMinute[rank] ?? 0
    if (
      marginOf(p, better) * (p.items[worse]?.minutes ?? 1) <=
      marginOf(p, worse) * (p.items[better]?.minutes ?? 1)
    )
      issues.push('dos bandejas dejan lo mismo por minuto de cocina')
  }

  // Intrinsic Math Gate, la otra mitad: **repartir la cocina en partes
  // iguales** —sin calcular un solo margen— no puede alcanzar el objetivo con
  // colchón. Si alcanzara, el año se resolvería llenando la cocina y el margen
  // de contribución por minuto, que es el constructo, no haría falta
  // (MAT-RA2-002, estrategia de reemplazo hallada dentro del sprint).
  if (readFundraiser(p, evenKitchenSplit(p)).quality === 'optimal')
    issues.push('repartir la cocina en partes iguales ya alcanza el objetivo')

  return issues
}

export function fundraiserGates(p: FundraiserParams): readonly string[] {
  const shape = fundraiserShapeIssues(p)
  if (shape.length > 0) return shape

  const issues: string[] = []
  const plans = fundraiserPlans(p)
  issues.push(...tierWitnessIssues(plans), ...styleGateIssues(plans))

  // LOCKED: cubrir costos y llegar al objetivo son condiciones distintas, y
  // las dos tienen que ser alcanzables por separado.
  const covers = plans.filter(
    (plan) => plan.quality === 'functional' && plan.profit >= 0,
  )
  if (covers.length === 0)
    issues.push('no hay producción que sólo cubra costos')
  if (!plans.some((plan) => plan.quality === 'optimal'))
    issues.push('el objetivo con colchón es inalcanzable')

  // Y llegar tiene que ser exigente. Si la mayoría de las producciones que
  // entran ya dejan el colchón, el objetivo no mide nada y cualquier plan
  // ciego cae adentro por volumen.
  const optimal = plans.filter((plan) => plan.quality === 'optimal')
  const viable = plans.filter((plan) => plan.quality !== 'invalid')
  if (optimal.length * 5 > viable.length)
    issues.push('más de un quinto de las producciones válidas ya es óptima')
  return issues
}

export function evaluateFundraiser(
  p: FundraiserParams,
  lines: readonly BudgetLine[],
) {
  const malformed = quantityIssues(
    lines,
    ITEMS.map((entry) => ({ id: entry.id, maxQuantity: entry.max })),
  )
  if (malformed.length > 0)
    return err({ kind: 'invalid-answer' as const, detail: malformed[0] ?? '' })

  const read = readFundraiser(p, lines)
  return ok(
    outcome(
      read.quality,
      {
        outcomeKey: `course-project-fundraiser.${p.shape}.${read.quality}`,
        stamp: read.quality === 'invalid' ? 'No cierra' : 'Peña',
        facts: [
          { label: 'Costo fijo', value: `$${mil(p.fixedCost)}` },
          {
            label: 'Cocina',
            value: `${String(read.minutes)} de ${String(p.kitchenMinutes)} min`,
          },
          { label: 'Queda', value: `$${mil(read.profit)}` },
          { label: 'Objetivo', value: `$${mil(p.target)}` },
        ],
        ...(read.quality === 'invalid'
          ? {
              violatedConstraint:
                read.minutes > p.kitchenMinutes
                  ? 'La cocina no da para preparar todo eso.'
                  : 'Con esa producción el curso pone plata en vez de juntarla.',
            }
          : {}),
        consequence:
          read.quality === 'invalid'
            ? read.minutes > p.kitchenMinutes
              ? 'La cocina no alcanza para preparar esa producción.'
              : 'La peña termina costando plata.'
            : read.quality === 'functional'
              ? 'Se cubren los costos, pero no alcanza para lo que el curso necesita.'
              : read.quality === 'efficient'
                ? 'Se llega al objetivo, pero falta para el colchón.'
                : 'Se llega al objetivo y queda un colchón por si algo sale mal.',
      },
      read.style === undefined
        ? {}
        : { estilo: { axis: read.style, amount: 8 } },
      [
        { flag: 'y4.fundraiser.outcome', value: read.quality },
        ...(read.style === undefined
          ? []
          : [{ flag: 'y4.fundraiser.strategy', value: read.style }]),
      ],
    ),
  )
}

export const fundraiserVariants = generatedSource({
  id: 'y4.course-project-fundraiser.margin',
  // 3: seis economías reales en vez de una sola permutada, y un paso de
  // recorrido que las reparte en el prefijo publicado (MAT-RA2-002/005).
  version: '3',
  schema: fundraiserSchema,
  size: FUNDRAISER_SPACE,
  generate: generateFundraiser,
  gates: fundraiserGates,
  addressGates: fundraiserRoleGates,
})

const PROJECT_FAMILY = toScenarioFamilyId('course-project')

const courseProjectFundraiserDefinition: ChallengeDefinition = defineChallenge<
  FundraiserParams,
  FundraiserParams
>({
  id: toChallengeId('y4.course-project-fundraiser'),
  family: PROJECT_FAMILY,
  placement: 'anchor',
  variants: authoredVariantIds(fundraiserVariants.authored),
  variantSource: fundraiserVariants,
  interaction: 'quantity-builder',
  stages: ['year-4'],
  categories: ['quantity', 'proportions-and-percentages'],
  baseDifficulty: 3,
  cognitive: {
    steps: 2,
    constraints: 2,
    selection: 0,
    optimization: 1,
    uncertainty: 0,
    construction: 1,
  },
  composition: {
    primaryReasoningFamily: 'ECONOMIC_PROPORTIONAL',
    interactionEngine: 'allocate-constrain',
    pacingClass: 'MEDIUM',
    chronology: 20,
    recurringArc: 'PROJECT',
  },
  scoring: {
    math: 'discrete-quality',
    team: 'none',
    aura: 'none',
    rationale:
      'La cuenta es costo fijo, costo variable, ingreso y capacidad compartida contra un objetivo del curso. No hay Equipo ni Aura: nadie reparte tareas acá. Estilo describe la forma de la producción y es señal de carrera, nunca puntaje.',
  },
  tools: ['calculator', 'notepad'],
  generate: ({ params }) => parameters(fundraiserSchema, params),
  verify: (p) =>
    p.items.every((entry) => entry.price > entry.cost)
      ? []
      : ['una bandeja se vende a menos de lo que cuesta'],
  narrate: (_p, context) => ({
    title: 'La peña',
    setup: `${projectArcCallback(context.flags)}El curso alquila el salón para la peña y hay que decidir cuánto preparar de cada cosa.`,
    goal: 'Armá la producción: primero, no perder plata; después, llegar al objetivo; y lo mejor, llegar con el colchón.',
  }),
  present: (p) => ({
    kind: 'quantity-builder',
    instructions:
      'Poné cuántas bandejas prepara el curso: todo lo que se prepara se vende. No perder plata es cubrir los costos —el punto de equilibrio—: que lo que dejan las bandejas vendidas alcance para pagar el costo fijo.',
    data: [
      {
        label: 'Costo fijo',
        value: `$${mil(p.fixedCost)}`,
        constraint: true,
      },
      {
        label: 'Cocina',
        value: String(p.kitchenMinutes),
        unit: 'minutos',
        constraint: true,
      },
      { label: 'Objetivo', value: `$${mil(p.target)}` },
      { label: 'Colchón que quieren', value: `$${mil(p.reserve)}` },
    ],
    items: ITEMS.map((entry, index) => {
      const data = p.items[index]
      return {
        id: entry.id,
        label: entry.label,
        detail: `cuesta $${mil(data?.cost ?? 0)} · se vende a $${mil(data?.price ?? 0)} · ocupa ${String(data?.minutes ?? 0)} min`,
        maxQuantity: entry.max,
      }
    }),
  }),
  evaluate: (p, answer: InteractionAnswer) =>
    answer.kind === 'quantity-builder'
      ? evaluateFundraiser(p, answer.lines)
      : err({
          kind: 'invalid-answer',
          detail: 'se esperaba un plan de producción',
        }),
})

/** Con nota por calidad (10/8/6/4). Ver `src/content/grades.ts`. */
export const courseProjectFundraiser = graded(courseProjectFundraiserDefinition)

/* -------------------------------------------------------------------------
 * Repaso: cubrir el costo fijo.
 * ---------------------------------------------------------------------- */

export const marginReviewSchema = z
  .strictObject({
    /** Lo que se paga una vez, exista o no la venta. */
    fixedCost: money,
    /** Lo que cuesta preparar una bandeja y lo que se cobra por ella. */
    cost: money,
    price: money,
  })
  .refine((p) => p.price > p.cost, 'la bandeja se vende a pérdida')
export type MarginReviewParams = z.infer<typeof marginReviewSchema>

/** Bandejas enteras que hay que vender para dejar de perder plata. */
export function traysToBreakEven(p: MarginReviewParams): number {
  return Math.ceil(p.fixedCost / (p.price - p.cost))
}

const REVIEW_FIXED = [9_000, 12_000, 15_000, 18_000, 24_000] as const
const REVIEW_COSTS = [2_500, 3_000, 3_500, 4_000] as const
const REVIEW_MARGINS = [1_500, 2_000, 2_500, 3_000] as const
const REVIEW_RADICES = [
  REVIEW_FIXED.length,
  REVIEW_COSTS.length,
  REVIEW_MARGINS.length,
]
export const MARGIN_REVIEW_SPACE = spaceOf(REVIEW_RADICES)

export function generateMarginReview(index: number): MarginReviewParams {
  const axes = candidateAxes(index, REVIEW_RADICES, 31)
  const cost = at(REVIEW_COSTS, digit(axes, 1))
  return marginReviewSchema.parse({
    fixedCost: at(REVIEW_FIXED, digit(axes, 0)),
    cost,
    price: cost + at(REVIEW_MARGINS, digit(axes, 2)),
  })
}

export function marginReviewGates(p: MarginReviewParams): readonly string[] {
  const issues: string[] = []
  const exact = traysToBreakEven(p)
  // El señuelo de este Repaso es dividir por el precio en vez de por lo que
  // deja cada bandeja. Si las dos cuentas dan lo mismo, el Repaso no toca el
  // paso que vino a reparar.
  if (Math.ceil(p.fixedCost / p.price) === exact)
    issues.push('dividir por el precio da la misma respuesta')
  if (exact < 3 || exact > 20) issues.push('la respuesta cae fuera de escala')
  return issues
}

export function evaluateMarginReview(p: MarginReviewParams, value: string) {
  if (!/^\d{1,4}$/u.test(value))
    return err({
      kind: 'invalid-answer' as const,
      detail: 'se esperaba una cantidad entera de bandejas',
    })
  const answered = Number(value)
  const exact = traysToBreakEven(p)
  const byPrice = Math.ceil(p.fixedCost / p.price)
  const quality: SolutionQuality =
    answered === exact
      ? 'optimal'
      : // Dividir por el precio: la cuenta está bien hecha sobre un número que
        // no es el que queda, porque preparar cada bandeja también cuesta.
        answered === byPrice
        ? 'functional'
        : Math.abs(answered - exact) === 1
          ? 'efficient'
          : 'invalid'
  return ok(
    outcome(quality, {
      outcomeKey: `margin-review.${quality}`,
      stamp: quality === 'optimal' ? 'Justo' : 'Cerca',
      facts: [
        { label: 'Costo fijo', value: `$${mil(p.fixedCost)}` },
        { label: 'Cada bandeja deja', value: `$${mil(p.price - p.cost)}` },
        {
          label: `${String(exact)} bandejas dejan`,
          value: `$${mil(exact * (p.price - p.cost))}`,
        },
      ],
      ...(quality === 'optimal'
        ? {
            optimalComparison:
              'De cada bandeja no queda el precio: queda el precio menos lo que costó prepararla. El costo fijo se cubre con eso.',
          }
        : {}),
      ...(quality === 'functional'
        ? {
            violatedConstraint: `Cada bandeja se vende a $${mil(p.price)}, pero deja $${mil(p.price - p.cost)}: preparar también cuesta.`,
          }
        : {}),
      consequence:
        quality === 'optimal'
          ? 'Recién a partir de ahí la peña empieza a juntar.'
          : answered < exact
            ? 'Con esa cuenta el curso cree que ya cubrió y todavía está poniendo plata.'
            : 'El costo fijo ya se cubría con menos bandejas de las que dijiste.',
    }),
  )
}

export const marginReviewVariants = generatedSource({
  id: 'y4.margin-review.break-even',
  version: '1',
  schema: marginReviewSchema,
  size: MARGIN_REVIEW_SPACE,
  generate: generateMarginReview,
  gates: marginReviewGates,
})

export const marginReview: ChallengeDefinition = defineChallenge<
  MarginReviewParams,
  MarginReviewParams
>({
  id: toChallengeId('y4.margin-review'),
  family: PROJECT_FAMILY,
  placement: 'recovery',
  variants: authoredVariantIds(marginReviewVariants.authored),
  variantSource: marginReviewVariants,
  interaction: 'numeric-input',
  stages: ['year-4'],
  categories: ['quantity'],
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
    primaryReasoningFamily: 'ECONOMIC_PROPORTIONAL',
    interactionEngine: 'allocate-constrain',
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
  generate: ({ params }) => parameters(marginReviewSchema, params),
  verify: (p) => marginReviewGates(p),
  narrate: () => ({
    title: 'Lo que deja cada bandeja',
    setup:
      'Antes de volver a la peña, una sola cuenta: cuánto hay que vender para dejar de perder.',
    goal: 'Decí cuántas bandejas cubren el costo fijo.',
  }),
  present: (p) => ({
    kind: 'numeric-input',
    data: [
      { label: 'Costo fijo', value: `$${mil(p.fixedCost)}`, constraint: true },
      {
        label: 'Cuesta preparar',
        value: `$${mil(p.cost)}`,
        unit: 'la bandeja',
      },
      { label: 'Se vende a', value: `$${mil(p.price)}`, unit: 'la bandeja' },
      {
        label: 'Primero',
        value: `$${mil(p.price)} − $${mil(p.cost)}`,
        unit: 'lo que deja cada una',
        span: 2,
      },
    ],
    unitLabel: 'bandejas',
    min: '0',
    max: '99',
    step: '1',
  }),
  evaluate: (p, answer: InteractionAnswer) =>
    answer.kind === 'numeric-input'
      ? evaluateMarginReview(p, answer.value)
      : err({ kind: 'invalid-answer', detail: 'se esperaba un número' }),
})
