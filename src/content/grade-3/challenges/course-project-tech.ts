/**
 * 3.º · Proyecto del Curso III (`y3.course-project-tech`) y su Repaso
 * (`y3.rate-capacity-review`).
 *
 * La feria de tecnología se arma con lo que el curso tiene, y lo que tiene es
 * compartido: una notebook que presta la escuela por un rato, un pendrive con
 * lugar libre y una hora de laboratorio con una conexión que sube tantos MB por
 * minuto. Tres cosas distintas para producir, y cada una gasta de los tres
 * recursos en proporciones distintas.
 *
 * No es el plan de datos personal de 1.º —ahí un solo recurso se repartía entre
 * usos propios—: acá los recursos son del curso y se encadenan, porque lo que
 * ocupa lugar en el pendrive es lo mismo que después hay que subir. Una
 * variante que se resuelva con una sola división no se aprueba.
 *
 * Equipo es otra cosa y se lee sólo entre planes que ya entran: quién queda sin
 * hacer nada, qué tan parejo quedó el reparto y si la persona que no tiene
 * computadora en casa quedó con la mayor parte del trabajo de edición.
 *
 * El Repaso aísla el paso que este plan da por sabido: cuánto entra en una
 * capacidad a un consumo dado.
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
  type BudgetLine,
  type ChallengeDefinition,
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
  tierWitnessIssues,
} from '@/content/authoring'
import { projectArcCallback } from '../../career-facts'

/** Quién se ofreció para qué. El dueño no cambia lo que el plan puede producir. */
export const CREW = [
  { id: 'nico', label: 'Nico', item: 'video' },
  { id: 'sofi', label: 'Sofi', item: 'entrevistas' },
  { id: 'tomi', label: 'Tomi', item: 'laminas' },
] as const

export const ITEMS = [
  {
    id: 'video',
    label: 'Videos cortos',
    max: 10,
  },
  {
    id: 'entrevistas',
    label: 'Entrevistas grabadas',
    max: 10,
  },
  {
    id: 'laminas',
    label: 'Láminas del stand',
    max: 12,
  },
] as const
export type ItemId = (typeof ITEMS)[number]['id']

const smallCount = z.number().int().min(0).max(12)
/**
 * Lo que gasta **una** pieza de una cosa, en esta variante.
 *
 * Las tasas son parámetro, no constante del módulo. Con tasas fijas en todo el
 * catálogo hay una única cosa «barata» —la misma siempre— y un orden de
 * prioridad fijo resuelve cualquier variante sin leer un número; además el
 * jugador las memoriza una vez y no vuelve a mirarlas. Con tasas por variante,
 * cuál conviene depende de **qué recurso aprieta acá**, que es el constructo.
 */
const rate = z.strictObject({
  /** Minutos de notebook que pide editar una pieza. */
  notebook: z.number().int().min(1).max(12),
  /** Lo que ocupa, en MB. Lo mismo que después hay que subir. */
  megabytes: z.number().int().min(10).max(400).multipleOf(10),
})
export const techSchema = z
  .strictObject({
    shape: z.enum(['pendrive-corto', 'laboratorio-corto', 'notebook-corta']),
    /** Minutos de notebook que la escuela presta. */
    notebookMinutes: z.number().int().min(20).max(200),
    /** MB libres en el pendrive del curso. */
    megabytes: z.number().int().min(500).max(8000).multipleOf(50),
    /** Minutos de laboratorio y lo que sube la conexión por minuto. */
    labMinutes: z.number().int().min(5).max(60),
    uploadRate: z.number().int().min(20).max(400).multipleOf(10),
    /** Lo que gasta cada cosa, en el orden de la pantalla. */
    rates: z.tuple([rate, rate, rate]),
    /** Lo que la feria pide como mínimo de cada cosa. */
    minimum: z.strictObject({
      video: smallCount,
      entrevistas: smallCount,
      laminas: smallCount,
    }),
    /** Cuántas piezas prometió llevar el curso, entre las tres cosas. */
    promised: z.number().int().min(6).max(32),
    /** Cuánta diferencia de carga entre dos personas el grupo tolera. */
    spread: z.number().int().min(4).max(30),
    /** Quién no tiene computadora en casa, y cuánta edición puede tomar. */
    tight: z.enum(['nico', 'sofi', 'tomi']),
    tightCap: z.number().int().min(4).max(30),
  })
  .refine(
    (p) =>
      p.promised > p.minimum.video + p.minimum.entrevistas + p.minimum.laminas,
    'lo prometido no supera el mínimo de la feria',
  )
export type TechParams = z.infer<typeof techSchema>

/** Cuántas piezas de cada cosa trae un plan, en el orden de la pantalla. */
export function counts(lines: readonly BudgetLine[]): readonly number[] {
  return ITEMS.map((item) => quantity(lines, item.id))
}

export function usage(p: TechParams, lines: readonly BudgetLine[]) {
  const pieces = counts(lines)
  const notebook = pieces.reduce(
    (total, count, index) => total + count * (p.rates[index]?.notebook ?? 0),
    0,
  )
  const megabytes = pieces.reduce(
    (total, count, index) => total + count * (p.rates[index]?.megabytes ?? 0),
    0,
  )
  return {
    pieces,
    notebook,
    megabytes,
    total: pieces.reduce((a, b) => a + b, 0),
  }
}

/** Minutos enteros de laboratorio que pide subir todo lo producido. */
export function uploadMinutes(p: TechParams, megabytes: number): number {
  return Math.ceil(megabytes / p.uploadRate)
}

/** Cuántas piezas por debajo de lo prometido todavía cuentan como buen stand. */
const SHORTFALL = 2

export interface TechOutcome {
  readonly quality: SolutionQuality
  /** Piezas producidas en total. */
  readonly total: number
  /** Acuerdos del grupo cumplidos, 0 a 3. Sólo entre planes que entran. */
  readonly team: number
  /** Qué recurso se pasó, si se pasó alguno. */
  readonly over?: 'notebook' | 'pendrive' | 'laboratorio' | 'minimo'
}

/**
 * La lectura completa de un plan, con su propia aritmética.
 *
 * Math primero y solo: los tres recursos compartidos, el mínimo de la feria y
 * cuántas piezas entran. Equipo se lee después, sobre los mismos números pero
 * mirando de quién es cada cosa, y nunca cambia la calidad.
 *
 * Lo prometido es un **total**, no un vector. Antes la pantalla imprimía lo
 * prometido de cada cosa y los presupuestos se derivaban del costo de ese plan,
 * así que copiar los tres números era siempre válido y siempre óptimo: la
 * respuesta estaba escrita en la consigna (MAT-RA2-001). Ahora el número que se
 * ve es cuánto hay que llevar **en total**; repartirlo entre tres cosas que
 * gastan distinto de tres recursos distintos es el trabajo.
 */
export function readTech(
  p: TechParams,
  lines: readonly BudgetLine[],
): TechOutcome {
  const { pieces, notebook, megabytes, total } = usage(p, lines)
  const upload = uploadMinutes(p, megabytes)

  const over =
    notebook > p.notebookMinutes
      ? ('notebook' as const)
      : megabytes > p.megabytes
        ? ('pendrive' as const)
        : upload > p.labMinutes
          ? ('laboratorio' as const)
          : ITEMS.some(
                (item, index) => (pieces[index] ?? 0) < p.minimum[item.id],
              )
            ? ('minimo' as const)
            : undefined

  const quality: SolutionQuality =
    over !== undefined
      ? 'invalid'
      : total >= p.promised
        ? 'optimal'
        : total + SHORTFALL >= p.promised
          ? 'efficient'
          : 'functional'

  // Equipo: los mismos números, leídos por dueño.
  const loadOf = (crewId: string) => {
    const owner = CREW.find((person) => person.id === crewId)
    const index = ITEMS.findIndex((entry) => entry.id === owner?.item)
    return index < 0
      ? 0
      : (pieces[index] ?? 0) * (p.rates[index]?.notebook ?? 0)
  }
  const loads = CREW.map((person) => loadOf(person.id))
  const everyone = loads.every((load) => load > 0)
  const even = Math.max(...loads) - Math.min(...loads) <= p.spread
  const tight = loadOf(p.tight) <= p.tightCap
  const team =
    quality === 'invalid' ? 0 : [everyone, even, tight].filter(Boolean).length

  return {
    quality,
    total,
    team,
    ...(over === undefined ? {} : { over }),
  }
}

export interface TechPlan {
  readonly lines: readonly BudgetLine[]
  readonly quality: SolutionQuality
  readonly team: number
  readonly over?: TechOutcome['over']
}

/** Enumeración de witnesses con el evaluador. El oráculo independiente vive en tests. */
export function techPlans(p: TechParams): readonly TechPlan[] {
  const plans: TechPlan[] = []
  const [video, entrevistas, laminas] = ITEMS
  if (video === undefined || entrevistas === undefined || laminas === undefined)
    return plans
  for (let a = 0; a <= video.max; a++)
    for (let b = 0; b <= entrevistas.max; b++)
      for (let c = 0; c <= laminas.max; c++) {
        const lines = [
          { itemId: video.id, quantity: a },
          { itemId: entrevistas.id, quantity: b },
          { itemId: laminas.id, quantity: c },
        ]
        const read = readTech(p, lines)
        plans.push({
          lines,
          quality: read.quality,
          team: read.team,
          ...(read.over === undefined ? {} : { over: read.over }),
        })
      }
  return plans
}

const SHAPES = [
  'pendrive-corto',
  'laboratorio-corto',
  'notebook-corta',
] as const

/**
 * Lo que gasta cada cosa, por **papel**: barata en minutos, barata en MB, y
 * la del medio.
 *
 * Los tres papeles son incomparables a propósito —ninguno gasta menos que otro
 * en las dos cosas a la vez—, así que cuál conviene depende de qué recurso
 * aprieta en esta variante. Sin esa incomparabilidad habría una cosa mejor
 * siempre y un orden de prioridad fijo resolvería el catálogo entero.
 */
const RATE_SETS = [
  [
    { notebook: 5, megabytes: 40 },
    { notebook: 1, megabytes: 300 },
    { notebook: 3, megabytes: 120 },
  ],
  [
    { notebook: 4, megabytes: 60 },
    { notebook: 1, megabytes: 250 },
    { notebook: 2, megabytes: 150 },
  ],
  [
    { notebook: 6, megabytes: 30 },
    { notebook: 2, megabytes: 200 },
    { notebook: 3, megabytes: 90 },
  ],
] as const
/** Qué papel le toca a cada cosa. Rota, así que la cosa barata no es siempre la misma. */
const ROTATIONS = [
  [0, 1, 2],
  [1, 2, 0],
  [2, 0, 1],
] as const
const NOTEBOOKS = [24, 30, 36, 42, 48, 60, 72, 90] as const
const MEGABYTES = [500, 700, 900, 1100, 1400, 1800, 2200] as const
const UPLOADS = [80, 120, 180, 240] as const
const LABS = [5, 6, 8, 10, 12, 16] as const
const MINIMUMS = [
  { video: 1, entrevistas: 1, laminas: 2 },
  { video: 2, entrevistas: 1, laminas: 1 },
  { video: 1, entrevistas: 2, laminas: 2 },
] as const
const SPREADS = [8, 12, 16] as const
const TIGHTS = ['nico', 'sofi', 'tomi'] as const

const SEARCH_RADICES = [
  RATE_SETS.length,
  NOTEBOOKS.length,
  MEGABYTES.length,
  UPLOADS.length,
  LABS.length,
  MINIMUMS.length,
  SPREADS.length,
  TIGHTS.length,
]
const SEARCH_SPACE = spaceOf(SEARCH_RADICES)
/** Coprimo con 36.450 = 2·3⁶·5²: la búsqueda recorre el espacio entero. */
const SEARCH_STRIDE = 1237
/** Cada dirección arranca su búsqueda en un punto distinto del espacio. */
const SEARCH_STEP = 11
/**
 * Cuántas magnitudes se prueban por dirección antes de rendirse.
 *
 * El espacio de búsqueda es grande y el gate caro; sin cota, una dirección sin
 * solución costaría treinta y seis mil enumeraciones. Con cota, una dirección
 * sin solución se rechaza y el barrido sigue.
 */
const MAX_ATTEMPTS = 320
/** Papeles del catálogo: tres cuellos de botella por tres rotaciones de tasas. */
const ROLE_CYCLE = SHAPES.length * ROTATIONS.length
export const TECH_SPACE = ROLE_CYCLE * SEARCH_SPACE

/**
 * El papel de una dirección: qué recurso aprieta y cómo se reparten las tasas.
 *
 * La rotación avanza **desfasada** contra el cuello de botella, así que un mismo
 * recurso escaso aparece con repartos de tasas distintos (D-S08-108).
 */
export function techRoleOf(index: number): {
  readonly shape: (typeof SHAPES)[number]
  readonly rotation: (typeof ROTATIONS)[number]
} {
  const cycle = Math.abs(index)
  return {
    shape: at(SHAPES, cycle % SHAPES.length),
    rotation: at(ROTATIONS, cycle + Math.floor(cycle / SHAPES.length)),
  }
}

/**
 * Cuántas piezas entran como máximo, y en cuántos repartos distintos.
 *
 * Recorrido entero en aritmética entera, sin asignar un objeto por plan: es la
 * cuenta que la búsqueda del generador hace cientos de veces por dirección.
 */
function ceilingOf(
  rates: TechParams['rates'],
  notebookMinutes: number,
  megabyteCap: number,
  minimum: Readonly<Record<ItemId, number>>,
): {
  readonly best: number
  readonly valid: number
  /** Cuántos repartos válidos llegan a `threshold` piezas o más. */
  readonly ways: (threshold: number) => number
} {
  const floors = ITEMS.map((item) => minimum[item.id])
  const totals: number[] = []
  let best = -1
  for (let a = floors[0] ?? 0; a <= ITEMS[0].max; a++)
    for (let b = floors[1] ?? 0; b <= ITEMS[1].max; b++)
      for (let c = floors[2] ?? 0; c <= ITEMS[2].max; c++) {
        const notebook =
          a * rates[0].notebook + b * rates[1].notebook + c * rates[2].notebook
        if (notebook > notebookMinutes) continue
        const used =
          a * rates[0].megabytes +
          b * rates[1].megabytes +
          c * rates[2].megabytes
        if (used > megabyteCap) continue
        const total = a + b + c
        totals.push(total)
        if (total > best) best = total
      }
  return {
    best,
    valid: totals.length,
    ways: (threshold) => totals.filter((total) => total >= threshold).length,
  }
}

/**
 * Cuánto por debajo del tope está lo que el curso promete.
 *
 * Uno, no cero. Prometer exactamente el máximo entero convertiría el beat en
 * «encontrá el óptimo de un programa entero», que está por encima del perfil
 * cognitivo declarado —dos pasos, una optimización— y por encima de 3.º. Con un
 * punto de aire, el reparto bien pensado llega y el reparto apurado queda en
 * `efficient`, que es la escalera que la ficha del año pide.
 */
const AMBITION = 1

/**
 * Cuántos MB se pueden usar de verdad: los que hay en el pendrive o los que la
 * conexión llega a subir en el rato de laboratorio, lo que sea menor.
 *
 * Ésa es la dependencia encadenada del beat, y el paso que el Repaso repara:
 * un rato de laboratorio **es** un tope de MB una vez que se lo multiplica por
 * lo que sube la conexión por minuto.
 */
export function megabyteCapOf(
  p: Pick<TechParams, 'megabytes' | 'labMinutes' | 'uploadRate'>,
): number {
  return Math.min(p.megabytes, p.uploadRate * p.labMinutes)
}

/** Qué recurso aprieta: el único que, aflojado solo, deja producir más piezas. */
function bindingOf(
  p: Pick<
    TechParams,
    | 'rates'
    | 'notebookMinutes'
    | 'megabytes'
    | 'labMinutes'
    | 'uploadRate'
    | 'minimum'
  >,
): (typeof SHAPES)[number] | undefined {
  const cap = megabyteCapOf(p)
  const base = ceilingOf(p.rates, p.notebookMinutes, cap, p.minimum).best
  if (base < 0) return undefined
  const byNotebook =
    ceilingOf(p.rates, p.notebookMinutes * 2, cap, p.minimum).best - base
  const byMegabytes =
    ceilingOf(p.rates, p.notebookMinutes, cap * 2, p.minimum).best - base
  if (byNotebook === byMegabytes) return undefined
  if (byNotebook > byMegabytes)
    return byNotebook > 0 ? 'notebook-corta' : undefined
  if (byMegabytes <= 0) return undefined
  // Dentro de los MB, cuál de los dos topes es el que manda tiene que ser
  // estricto: con empate, aflojar uno solo no cambia nada y el papel no existe.
  const uploadable = p.uploadRate * p.labMinutes
  if (p.megabytes === uploadable) return undefined
  return p.megabytes < uploadable ? 'pendrive-corto' : 'laboratorio-corto'
}

/**
 * La variante de una dirección: su papel, y la primera magnitud que lo sostiene.
 *
 * Nada acá deriva un presupuesto del costo de una respuesta. Los tres recursos
 * salen de listas fijas y lo prometido sale de **cuánto se puede producir con
 * ellos**, que es una consecuencia, no un insumo. Ésa es la diferencia con la
 * ronda 2, donde los presupuestos se construían alrededor del plan objetivo y
 * por eso ese plan entraba siempre.
 */
export function generateTech(index: number): TechParams {
  const { shape, rotation } = techRoleOf(index)
  let last: TechParams | undefined
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const axes = candidateAxes(
      index * SEARCH_STEP + attempt,
      SEARCH_RADICES,
      SEARCH_STRIDE,
    )
    const profiles = at(RATE_SETS, digit(axes, 0))
    const rateAt = (position: number) =>
      profiles[rotation[position] ?? 0] ?? profiles[0]
    const rates: TechParams['rates'] = [rateAt(0), rateAt(1), rateAt(2)]
    const notebookMinutes = at(NOTEBOOKS, digit(axes, 1))
    const megabytes = at(MEGABYTES, digit(axes, 2))
    const uploadRate = at(UPLOADS, digit(axes, 3))
    const labMinutes = at(LABS, digit(axes, 4))
    const minimum = at(MINIMUMS, digit(axes, 5))
    const spread = at(SPREADS, digit(axes, 6))
    const floor = minimum.video + minimum.entrevistas + minimum.laminas
    const { best } = ceilingOf(
      rates,
      notebookMinutes,
      Math.min(megabytes, uploadRate * labMinutes),
      minimum,
    )
    // Sin aire entre el piso de la feria y el tope no hay tres niveles.
    if (best - AMBITION <= floor + SHORTFALL) continue
    const candidate = techSchema.safeParse({
      shape,
      notebookMinutes,
      megabytes,
      labMinutes,
      uploadRate,
      rates,
      minimum,
      promised: best - AMBITION,
      spread,
      tight: at(TIGHTS, digit(axes, 7)),
      tightCap: spread + 4,
    })
    if (!candidate.success) continue
    last = candidate.data
    if (techGates(candidate.data).length === 0) return candidate.data
  }
  if (last === undefined)
    throw new Error(`sin variante para la dirección ${String(index)}`)
  return last
}

/** Gate de dirección: la variante juega el papel que le toca en el reparto. */
export function techRoleGates(p: TechParams, index: number): readonly string[] {
  const { shape, rotation } = techRoleOf(index)
  const issues: string[] = []
  if (p.shape !== shape)
    issues.push('la variante no aprieta el recurso de su dirección')
  const profiles = RATE_SETS.find((set) =>
    rotation.every(
      (profile, position) =>
        set[profile]?.notebook === p.rates[position]?.notebook &&
        set[profile]?.megabytes === p.rates[position]?.megabytes,
    ),
  )
  if (profiles === undefined)
    issues.push('la variante no reparte las tasas como su dirección')
  return issues
}

/**
 * Gates baratos: los que no necesitan enumerar el espacio con un objeto por plan.
 *
 * Van primero y cortan. La búsqueda prueba cientos de magnitudes por dirección
 * y casi todas mueren acá, sin pagar la enumeración de witnesses.
 */
function techShapeIssues(p: TechParams): readonly string[] {
  const issues: string[] = []
  const { best, ways, valid } = ceilingOf(
    p.rates,
    p.notebookMinutes,
    megabyteCapOf(p),
    p.minimum,
  )
  if (best < 0) return ['ningún plan entra']
  if (best - AMBITION !== p.promised)
    issues.push('lo prometido no sale del tope de piezas de la variante')

  // El mínimo de la feria tiene que dejar lugar a los tres niveles: si llegar
  // al mínimo ya deja a dos piezas de lo prometido, `functional` no existe.
  const floor = p.minimum.video + p.minimum.entrevistas + p.minimum.laminas
  if (floor + SHORTFALL >= p.promised)
    issues.push('el mínimo de la feria ya alcanza lo prometido')

  // Llegar tiene que ser exigente: si muchos repartos llegan a lo prometido,
  // lo prometido no mide nada y cualquier plan ciego cae adentro por volumen.
  const reaching = ways(p.promised)
  if (reaching * 5 > valid)
    issues.push('demasiados repartos llegan a lo prometido')
  if (reaching < 2) issues.push('un solo reparto llega a lo prometido')

  // LOCKED: más de un recurso decide. El que aprieta acá tiene que ser uno solo
  // y el de la dirección; con uno solo apretando siempre, esto es una división.
  if (bindingOf(p) !== p.shape)
    issues.push('el recurso que aprieta no es el de la variante')

  // Y tiene que apretar de verdad: producir el máximo de todo no puede entrar.
  const everything = ITEMS.map((item) => ({
    itemId: item.id,
    quantity: item.max,
  }))
  if (readTech(p, everything).quality !== 'invalid')
    issues.push('los recursos alcanzan para todo')
  return issues
}

export function techGates(p: TechParams): readonly string[] {
  const shape = techShapeIssues(p)
  if (shape.length > 0) return shape

  const issues: string[] = []
  const plans = techPlans(p)
  issues.push(...tierWitnessIssues(plans))

  const valid = plans.filter((plan) => plan.quality !== 'invalid')
  if (valid.length === 0) issues.push('ningún plan entra')

  // LOCKED: más de un recurso o dependencia. Cada uno tiene que poder ser el
  // que se pasa por sí solo; con uno solo apretando esto es una división.
  const binding = new Set(
    plans.flatMap((plan) => (plan.over === undefined ? [] : [plan.over])),
  )
  binding.delete('minimo')
  if (binding.size < 2)
    issues.push('un solo recurso decide: el plan es una división')

  // Equipo: varios planes Math-válidos con consecuencias distintas.
  const teamsAmongOptimal = new Set(
    plans.filter((plan) => plan.quality === 'optimal').map((plan) => plan.team),
  )
  if (teamsAmongOptimal.size < 2)
    issues.push('todos los planes óptimos dejan el mismo Equipo')
  if (!valid.some((plan) => plan.team === 3))
    issues.push('ningún plan válido cumple los tres acuerdos')
  // Witness del máximo competitivo: tiene que existir una respuesta que sea
  // Math óptima **y** deje el Equipo máximo. Sin eso, una carrera que sacara
  // esta variante no podría llegar al tope de FairScore por más que jugara
  // perfecto, y dos carreras tendrían techos distintos.
  if (!plans.some((plan) => plan.quality === 'optimal' && plan.team === 3))
    issues.push('ninguna respuesta óptima deja el Equipo máximo')
  if (!valid.some((plan) => plan.team <= 1))
    issues.push('ningún plan válido descuida los acuerdos')
  return issues
}

export function evaluateTech(p: TechParams, lines: readonly BudgetLine[]) {
  const malformed = quantityIssues(
    lines,
    ITEMS.map((item) => ({ id: item.id, maxQuantity: item.max })),
  )
  if (malformed.length > 0)
    return err({ kind: 'invalid-answer' as const, detail: malformed[0] ?? '' })

  const read = readTech(p, lines)
  const { notebook, megabytes } = usage(p, lines)
  const upload = uploadMinutes(p, megabytes)
  const base = outcome(
    read.quality,
    {
      outcomeKey: `course-project-tech.${p.shape}.${read.quality}`,
      stamp: read.quality === 'invalid' ? 'No entra' : 'Listo',
      facts: [
        {
          label: 'Notebook',
          value: `${String(notebook)} de ${String(p.notebookMinutes)} min`,
        },
        {
          label: 'Pendrive',
          value: `${mil(megabytes)} de ${mil(p.megabytes)} MB`,
        },
        {
          label: 'Subida',
          value: `${String(upload)} de ${String(p.labMinutes)} min`,
        },
        {
          label: 'Piezas',
          value: `${String(read.total)} de ${String(p.promised)} prometidas`,
        },
        { label: 'Acuerdos del grupo', value: `${String(read.team)} de 3` },
      ],
      ...(read.quality === 'invalid'
        ? {
            violatedConstraint:
              read.over === 'notebook'
                ? 'La notebook no da para editar todo eso.'
                : read.over === 'pendrive'
                  ? 'No hay lugar en el pendrive.'
                  : read.over === 'laboratorio'
                    ? 'La hora de laboratorio no alcanza para subirlo.'
                    : 'Falta algo de lo que la feria pide como mínimo.',
          }
        : {}),
      consequence:
        read.quality === 'invalid'
          ? 'El stand llega a la feria con una parte sin terminar.'
          : read.quality === 'optimal'
            ? 'Entraron las piezas que el curso había prometido llevar.'
            : 'El stand se arma, aunque llegó con menos piezas de las prometidas.',
    },
    {},
    [{ flag: 'y3.projectTech.outcome', value: read.quality }],
  )
  return ok({
    ...base,
    metrics: metrics({ ...base.metrics, efficiency: read.team / 3 }),
    careerEffects: {
      ...base.careerEffects,
      ...(read.quality === 'invalid' ? {} : { equipo: read.team - 1 }),
    },
  })
}

export const techVariants = generatedSource({
  id: 'y3.course-project-tech.resources',
  // 3: lo prometido es un total y las tasas son parámetro; los presupuestos ya
  // no se derivan del costo de ninguna respuesta (MAT-RA2-001).
  version: '3',
  schema: techSchema,
  size: TECH_SPACE,
  generate: generateTech,
  gates: techGates,
  addressGates: techRoleGates,
})

const PROJECT_FAMILY = toScenarioFamilyId('course-project')

export const courseProjectTech: ChallengeDefinition = defineChallenge<
  TechParams,
  TechParams
>({
  id: toChallengeId('y3.course-project-tech'),
  family: PROJECT_FAMILY,
  placement: 'anchor',
  variants: authoredVariantIds(techVariants.authored),
  variantSource: techVariants,
  interaction: 'quantity-builder',
  stages: ['year-3'],
  categories: ['time-and-rates', 'optimization-and-constraints'],
  baseDifficulty: 3,
  cognitive: {
    steps: 2,
    constraints: 3,
    selection: 0,
    optimization: 1,
    uncertainty: 0,
    construction: 1,
  },
  composition: {
    primaryReasoningFamily: 'ALLOCATION',
    interactionEngine: 'allocate-constrain',
    pacingClass: 'MEDIUM',
    chronology: 30,
    recurringArc: 'PROJECT',
  },
  scoring: {
    math: 'discrete-quality',
    team: ({ metrics: evidence }) => performanceFromRatio(evidence.efficiency),
    aura: 'none',
    rationale:
      'Math mide que la producción entre en los tres recursos compartidos y llegue a lo que la feria pide. Equipo mide los acuerdos del grupo sobre el mismo plan pero mirando de quién es cada cosa, así que un plan que aprovecha todo puede dejar a alguien sin hacer nada y no cobra por eso dos veces.',
  },
  tools: ['calculator', 'notepad'],
  generate: ({ params }) => parameters(techSchema, params),
  verify: (p) =>
    p.uploadRate * p.labMinutes * 4 >= p.megabytes
      ? []
      : ['el laboratorio no alcanza ni para una parte del pendrive'],
  narrate: (_p, context) => ({
    title: 'Proyecto del Curso: la feria de tecnología',
    setup: `${projectArcCallback(context.flags)}La feria es el viernes y el curso tiene que armar el stand con la notebook prestada, el pendrive y una hora de laboratorio.`,
    goal: 'Decidí cuántas piezas hacer de cada cosa: que entren en los recursos, que lleguen a lo prometido y que el grupo trabaje parejo.',
  }),
  present: (p) => ({
    kind: 'quantity-builder',
    instructions:
      'Poné cuántas piezas va a producir el curso de cada cosa. Lo que ocupa el pendrive es lo mismo que después hay que subir.',
    data: [
      {
        label: 'Notebook prestada',
        value: String(p.notebookMinutes),
        unit: 'minutos',
        constraint: true,
      },
      {
        label: 'Lugar en el pendrive',
        value: mil(p.megabytes),
        unit: 'MB',
        constraint: true,
      },
      {
        label: 'Laboratorio',
        value: String(p.labMinutes),
        unit: 'minutos',
        constraint: true,
      },
      {
        label: 'La conexión sube',
        value: mil(p.uploadRate),
        unit: 'MB por minuto',
      },
      // Lo que el curso prometió: un total, entre las tres cosas. Está a la
      // vista porque es la consigna; no es la respuesta, porque cómo se reparte
      // entre tres cosas que gastan distinto es justamente lo que hay que
      // decidir.
      {
        label: 'El curso prometió',
        value: String(p.promised),
        unit: 'piezas en total',
        span: 2,
      },
      // Y el piso de cada cosa, que la feria pide sí o sí.
      ...ITEMS.map((item) => ({
        label: item.label,
        value: String(p.minimum[item.id]),
        unit: 'pide la feria',
      })),
    ],
    items: ITEMS.map((item, index) => {
      const owner = CREW.find((person) => person.item === item.id)
      const rate = p.rates[index]
      return {
        id: item.id,
        label: item.label,
        detail: `${String(rate?.notebook ?? 0)} min de notebook · ${mil(rate?.megabytes ?? 0)} MB cada una · la arma ${owner?.label ?? ''}`,
        maxQuantity: item.max,
      }
    }),
  }),
  evaluate: (p, answer: InteractionAnswer) =>
    answer.kind === 'quantity-builder'
      ? evaluateTech(p, answer.lines)
      : err({
          kind: 'invalid-answer',
          detail: 'se esperaba un plan de producción',
        }),
})

/* -------------------------------------------------------------------------
 * Repaso: cuánto entra a este consumo.
 * ---------------------------------------------------------------------- */

export const rateReviewSchema = z
  .strictObject({
    /** Qué se está midiendo: el lugar del pendrive o el rato de laboratorio. */
    kind: z.enum(['pendrive', 'laboratorio']),
    /** La capacidad disponible: MB libres, o minutos de laboratorio. */
    capacity: z.number().int().min(12).max(6000),
    /** Lo que gasta una unidad: MB por minuto de video, o minutos por video. */
    perUnit: z.number().int().min(2).max(600),
  })
  .refine((p) => p.capacity > p.perUnit * 2, 'no entran ni dos')
export type RateReviewParams = z.infer<typeof rateReviewSchema>

/** Unidades **enteras** que entran: media unidad no entra. */
export function fitsWhole(p: RateReviewParams): number {
  return Math.floor(p.capacity / p.perUnit)
}

/**
 * Las dos caras de la misma cuenta, cada una en su escala.
 *
 * En el pendrive se miden MB contra los MB que ocupa un minuto de video; en el
 * laboratorio, minutos contra los minutos que tarda un video en subir. La
 * matemática es la misma —cuántos enteros entran— y por eso el Repaso es uno
 * solo, pero los números de cada una son los de su unidad.
 */
const CAPACITIES = [900, 1200, 1500, 1800, 2100, 2400, 3000, 3600] as const
const PER_UNIT = [120, 150, 180, 250, 300, 350] as const
const LAB_CAPACITIES = [22, 26, 32, 38, 44, 50, 56, 62] as const
const LAB_PER_UNIT = [3, 4, 5, 6, 7, 8] as const
const KINDS = ['pendrive', 'laboratorio'] as const
const RATE_RADICES = [KINDS.length, CAPACITIES.length, PER_UNIT.length]
export const RATE_REVIEW_SPACE = spaceOf(RATE_RADICES)

export function generateRateReview(index: number): RateReviewParams {
  const axes = candidateAxes(index, RATE_RADICES, 29)
  const kind = at(KINDS, digit(axes, 0))
  return rateReviewSchema.parse({
    kind,
    capacity:
      kind === 'pendrive'
        ? at(CAPACITIES, digit(axes, 1))
        : at(LAB_CAPACITIES, digit(axes, 1)),
    perUnit:
      kind === 'pendrive'
        ? at(PER_UNIT, digit(axes, 2))
        : at(LAB_PER_UNIT, digit(axes, 2)),
  })
}

export function rateReviewGates(p: RateReviewParams): readonly string[] {
  const issues: string[] = []
  const whole = fitsWhole(p)
  // Que la división dé justa borraría el paso que el Repaso viene a reparar:
  // el redondeo para abajo dejaría de distinguirse del redondeo para arriba.
  if (p.capacity % p.perUnit === 0) issues.push('la división da justa')
  if (whole < 3 || whole > 20) issues.push('la respuesta cae fuera de escala')
  return issues
}

export function evaluateRateReview(p: RateReviewParams, value: string) {
  if (!/^\d{1,4}$/u.test(value))
    return err({
      kind: 'invalid-answer' as const,
      detail: 'se esperaba una cantidad entera',
    })
  const answered = Number(value)
  const whole = fitsWhole(p)
  const unit = p.kind === 'pendrive' ? 'minutos de video' : 'videos'
  const quality: SolutionQuality =
    answered === whole
      ? 'optimal'
      : // Redondear para arriba: la cuenta está bien y lo que falta es que el
        // último pedazo no entra entero.
        answered === whole + 1
        ? 'functional'
        : answered === whole - 1
          ? 'efficient'
          : 'invalid'
  return ok(
    outcome(quality, {
      outcomeKey: `rate-capacity-review.${p.kind}.${quality}`,
      stamp: quality === 'optimal' ? 'Justo' : 'Cerca',
      facts: [
        { label: 'Disponible', value: mil(p.capacity) },
        { label: 'Cada uno gasta', value: mil(p.perUnit) },
        {
          label: `${String(whole)} × ${mil(p.perUnit)}`,
          value: mil(whole * p.perUnit),
        },
      ],
      ...(quality === 'optimal'
        ? {
            optimalComparison:
              'Se divide lo que hay por lo que gasta cada uno, y se baja al entero: el pedazo que sobra no alcanza para uno más.',
          }
        : {}),
      ...(quality === 'functional'
        ? {
            violatedConstraint: `${String(whole + 1)} × ${mil(p.perUnit)} son ${mil((whole + 1) * p.perUnit)}, más de lo que hay.`,
          }
        : {}),
      consequence:
        quality === 'optimal'
          ? `Con eso ya sabés cuántos ${unit} podés contar.`
          : answered > whole
            ? 'Contar de más es justo lo que hace que después no entre.'
            : 'Entra más de lo que contaste: queda lugar sin usar.',
    }),
  )
}

export const rateReviewVariants = generatedSource({
  id: 'y3.rate-capacity-review.fits',
  version: '1',
  schema: rateReviewSchema,
  size: RATE_REVIEW_SPACE,
  generate: generateRateReview,
  gates: rateReviewGates,
})

export const rateCapacityReview: ChallengeDefinition = defineChallenge<
  RateReviewParams,
  RateReviewParams
>({
  id: toChallengeId('y3.rate-capacity-review'),
  family: PROJECT_FAMILY,
  placement: 'recovery',
  variants: authoredVariantIds(rateReviewVariants.authored),
  variantSource: rateReviewVariants,
  interaction: 'numeric-input',
  stages: ['year-3'],
  categories: ['quantity', 'time-and-rates'],
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
    primaryReasoningFamily: 'ALLOCATION',
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
  generate: ({ params }) => parameters(rateReviewSchema, params),
  verify: (p) => rateReviewGates(p),
  narrate: (p) => ({
    title: 'Cuánto entra',
    setup:
      p.kind === 'pendrive'
        ? 'Antes de volver al stand, una sola cuenta con el pendrive.'
        : 'Antes de volver al stand, una sola cuenta con el rato de laboratorio.',
    goal: 'Decí cuántos enteros entran.',
  }),
  present: (p) => ({
    kind: 'numeric-input',
    data:
      p.kind === 'pendrive'
        ? [
            {
              label: 'Lugar libre',
              value: mil(p.capacity),
              unit: 'MB',
              constraint: true,
            },
            {
              label: 'Un minuto de video ocupa',
              value: mil(p.perUnit),
              unit: 'MB',
            },
            {
              label: 'Primero',
              value: `${mil(p.capacity)} ÷ ${mil(p.perUnit)}`,
              unit: 'y después, sólo lo entero',
              span: 2,
            },
          ]
        : [
            {
              label: 'Laboratorio',
              value: String(p.capacity),
              unit: 'minutos',
              constraint: true,
            },
            {
              label: 'Subir un video tarda',
              value: String(p.perUnit),
              unit: 'minutos',
            },
            {
              label: 'Primero',
              value: `${String(p.capacity)} ÷ ${String(p.perUnit)}`,
              unit: 'y después, sólo lo entero',
              span: 2,
            },
          ],
    unitLabel: p.kind === 'pendrive' ? 'minutos de video' : 'videos',
    min: '0',
    max: '99',
    step: '1',
  }),
  evaluate: (p, answer: InteractionAnswer) =>
    answer.kind === 'numeric-input'
      ? evaluateRateReview(p, answer.value)
      : err({ kind: 'invalid-answer', detail: 'se esperaba un número' }),
})
