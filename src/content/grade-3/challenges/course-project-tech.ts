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
    label: 'Minutos de video',
    /** Minutos de notebook que pide editar un minuto de video. */
    notebook: 4,
    /** Lo que ocupa, en MB. Lo mismo que después hay que subir. */
    megabytes: 350,
    max: 10,
  },
  {
    id: 'entrevistas',
    label: 'Entrevistas grabadas',
    notebook: 1,
    megabytes: 60,
    max: 10,
  },
  {
    id: 'laminas',
    label: 'Láminas del stand',
    notebook: 3,
    megabytes: 20,
    max: 12,
  },
] as const
export type ItemId = (typeof ITEMS)[number]['id']

const smallCount = z.number().int().min(0).max(12)
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
    /** Lo que la feria pide como mínimo, y lo que el curso prometió. */
    minimum: z.strictObject({
      video: smallCount,
      entrevistas: smallCount,
      laminas: smallCount,
    }),
    target: z.strictObject({
      video: smallCount,
      entrevistas: smallCount,
      laminas: smallCount,
    }),
    /** Cuánta diferencia de carga entre dos personas el grupo tolera. */
    spread: z.number().int().min(4).max(30),
    /** Quién no tiene computadora en casa, y cuánta edición puede tomar. */
    tight: z.enum(['nico', 'sofi', 'tomi']),
    tightCap: z.number().int().min(4).max(30),
  })
  .refine(
    (p) =>
      (['video', 'entrevistas', 'laminas'] as const).every(
        (item) => p.target[item] >= p.minimum[item],
      ),
    'lo prometido queda por debajo del mínimo',
  )
export type TechParams = z.infer<typeof techSchema>

export function usage(lines: readonly BudgetLine[]) {
  const counts = ITEMS.map((item) => ({
    item,
    count: quantity(lines, item.id),
  }))
  const notebook = counts.reduce(
    (total, entry) => total + entry.count * entry.item.notebook,
    0,
  )
  const megabytes = counts.reduce(
    (total, entry) => total + entry.count * entry.item.megabytes,
    0,
  )
  return { counts, notebook, megabytes }
}

/** Minutos enteros de laboratorio que pide subir todo lo producido. */
export function uploadMinutes(p: TechParams, megabytes: number): number {
  return Math.ceil(megabytes / p.uploadRate)
}

export interface TechOutcome {
  readonly quality: SolutionQuality
  /** Acuerdos del grupo cumplidos, 0 a 3. Sólo entre planes que entran. */
  readonly team: number
  /** Qué recurso se pasó, si se pasó alguno. */
  readonly over?: 'notebook' | 'pendrive' | 'laboratorio' | 'minimo'
}

/**
 * La lectura completa de un plan, con su propia aritmética.
 *
 * Math primero y solo: los tres recursos compartidos y los mínimos de la feria.
 * Equipo se lee después, sobre los mismos números pero mirando de quién es cada
 * cosa, y nunca cambia la calidad.
 */
export function readTech(
  p: TechParams,
  lines: readonly BudgetLine[],
): TechOutcome {
  const { counts, notebook, megabytes } = usage(lines)
  const upload = uploadMinutes(p, megabytes)
  const countOf = (id: ItemId) =>
    counts.find((entry) => entry.item.id === id)?.count ?? 0

  const over =
    notebook > p.notebookMinutes
      ? ('notebook' as const)
      : megabytes > p.megabytes
        ? ('pendrive' as const)
        : upload > p.labMinutes
          ? ('laboratorio' as const)
          : (['video', 'entrevistas', 'laminas'] as const).some(
                (item) => countOf(item) < p.minimum[item],
              )
            ? ('minimo' as const)
            : undefined

  const promised = (['video', 'entrevistas', 'laminas'] as const).filter(
    (item) => countOf(item) >= p.target[item],
  ).length

  const quality: SolutionQuality =
    over !== undefined
      ? 'invalid'
      : promised >= 3
        ? 'optimal'
        : promised >= 2
          ? 'efficient'
          : 'functional'

  // Equipo: los mismos números, leídos por dueño.
  const loadOf = (crewId: string) => {
    const owner = CREW.find((person) => person.id === crewId)
    const item = ITEMS.find((entry) => entry.id === owner?.item)
    return item === undefined ? 0 : countOf(item.id) * item.notebook
  }
  const loads = CREW.map((person) => loadOf(person.id))
  const everyone = loads.every((load) => load > 0)
  const even = Math.max(...loads) - Math.min(...loads) <= p.spread
  const tight = loadOf(p.tight) <= p.tightCap
  const team =
    quality === 'invalid' ? 0 : [everyone, even, tight].filter(Boolean).length

  return {
    quality,
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
 * Lo que la feria pide de cada cosa.
 *
 * Antes eran tres mínimos por dos pasos: **seis** objetivos en todo el espacio,
 * cuyo supremo componente a componente era `(5, 4, 6)` —muy dentro de los
 * máximos `(10, 10, 12)` que ofrece la pantalla—. Un vector por encima de ese
 * supremo cumplía **todos** los objetivos que el generador podía emitir, en
 * cualquier catálogo que se sorteara de él, y sólo los topes de recurso podían
 * frenarlo: «video 4 · entrevistas 4 · láminas 6» rendía K 95,8 sin leer un dato
 * (MAT-RA-002).
 *
 * Doce objetivos que se **cruzan** —cada uno pide mucho de una cosa y poco de
 * otra— sacan el supremo del alcance de cualquier plan que además entre en los
 * presupuestos, y con eso ninguna respuesta reusable domina el catálogo
 * (RS-RA-002, criterios 1 a 3).
 */
const TARGETS = [
  { video: 2, entrevistas: 2, laminas: 3 },
  { video: 5, entrevistas: 7, laminas: 6 },
  { video: 2, entrevistas: 7, laminas: 3 },
  { video: 6, entrevistas: 6, laminas: 5 },
  { video: 3, entrevistas: 2, laminas: 8 },
  { video: 4, entrevistas: 4, laminas: 4 },
  { video: 5, entrevistas: 2, laminas: 7 },
  { video: 2, entrevistas: 5, laminas: 8 },
  { video: 6, entrevistas: 7, laminas: 3 },
  { video: 3, entrevistas: 6, laminas: 6 },
  { video: 4, entrevistas: 3, laminas: 5 },
  { video: 2, entrevistas: 6, laminas: 4 },
] as const
/** Cuánto menos que lo prometido acepta la feria como mínimo. */
const DROPS = [
  { video: 1, entrevistas: 1, laminas: 2 },
  { video: 2, entrevistas: 1, laminas: 1 },
  { video: 1, entrevistas: 2, laminas: 1 },
] as const
const RATES = [120, 180, 240] as const
const SPREADS = [8, 12, 16] as const
const TIGHTS = ['nico', 'sofi', 'tomi'] as const

/** Los ejes que la generación por papel busca una vez fijado el papel. */
const SEARCH_RADICES = [
  DROPS.length,
  RATES.length,
  SPREADS.length,
  TIGHTS.length,
]
const SEARCH_SPACE = spaceOf(SEARCH_RADICES)
const SEARCH_STRIDE = 29
/** Cada dirección arranca su búsqueda en un punto distinto del espacio. */
const SEARCH_STEP = 7
/** Papeles del catálogo: doce objetivos por tres cuellos de botella. */
const ROLE_CYCLE = TARGETS.length * SHAPES.length
export const TECH_SPACE = ROLE_CYCLE * SEARCH_SPACE

/** Lo que cuesta un plan en minutos de notebook. */
function notebookCost(counts: Readonly<Record<ItemId, number>>): number {
  return ITEMS.reduce(
    (total, item) => total + counts[item.id] * item.notebook,
    0,
  )
}

/** Lo que ocupa un plan en MB, que es también lo que hay que subir. */
function megabyteCost(counts: Readonly<Record<ItemId, number>>): number {
  return ITEMS.reduce(
    (total, item) => total + counts[item.id] * item.megabytes,
    0,
  )
}

/**
 * El papel de una dirección: qué pide la feria y qué recurso aprieta.
 *
 * El objetivo rota con el índice y el cuello de botella rota **desplazado**, así
 * que un mismo objetivo aparece con recursos escasos distintos. Sin ese desfasaje
 * el resto de tres dividiría a doce y cada objetivo quedaría atado a un único
 * cuello de botella (D-S08-108).
 */
export function techRoleOf(index: number): {
  readonly target: (typeof TARGETS)[number]
  readonly shape: (typeof SHAPES)[number]
} {
  const cycle = Math.abs(index)
  return {
    target: at(TARGETS, cycle % TARGETS.length),
    shape: at(SHAPES, cycle + Math.floor(cycle / TARGETS.length)),
  }
}

/**
 * Los tres presupuestos de una variante, atados al costo de lo prometido.
 *
 * El recurso que aprieta recibe poco aire sobre el plan objetivo y los otros dos
 * reciben bastante. Eso es lo que vuelve la cuenta obligatoria: pasarse de lo
 * prometido en el ítem caro se sale del presupuesto que aprieta, y cuál es el
 * ítem caro depende de qué recurso escasea en **esta** variante. El aire nunca
 * es cero: el plan objetivo no puede ser el único válido (RS-RA-002, criterio 4).
 */
function budgetsFor(
  shape: (typeof SHAPES)[number],
  target: Readonly<Record<ItemId, number>>,
  uploadRate: number,
): {
  readonly notebookMinutes: number
  readonly megabytes: number
  readonly labMinutes: number
} {
  const TIGHT_NOTEBOOK = 4
  const LOOSE_NOTEBOOK = 8
  const TIGHT_MEGABYTES = 150
  const LOOSE_MEGABYTES = 600
  const LOOSE_LAB = 6
  const megabytes =
    Math.ceil(
      (megabyteCost(target) +
        (shape === 'pendrive-corto' ? TIGHT_MEGABYTES : LOOSE_MEGABYTES)) /
        50,
    ) * 50
  return {
    notebookMinutes:
      notebookCost(target) +
      (shape === 'notebook-corta' ? TIGHT_NOTEBOOK : LOOSE_NOTEBOOK),
    megabytes,
    labMinutes:
      Math.ceil((megabyteCost(target) + TIGHT_MEGABYTES) / uploadRate) +
      (shape === 'laboratorio-corto' ? 0 : LOOSE_LAB),
  }
}

/**
 * Generación por papel: la primera combinación de holgura, tasa y acuerdos que,
 * con el objetivo y el cuello de botella de su dirección, pasa todos los gates.
 * Si no aparece ninguna, devuelve la última probada y el gate de papel la
 * rechaza.
 */
export function generateTech(index: number): TechParams {
  const { target, shape } = techRoleOf(index)
  let last: TechParams | undefined
  for (let attempt = 0; attempt < SEARCH_SPACE; attempt++) {
    const axes = candidateAxes(
      index * SEARCH_STEP + attempt,
      SEARCH_RADICES,
      SEARCH_STRIDE,
    )
    const drop = at(DROPS, digit(axes, 0))
    const uploadRate = at(RATES, digit(axes, 1))
    const spread = at(SPREADS, digit(axes, 2))
    const candidate = techSchema.safeParse({
      shape,
      ...budgetsFor(shape, target, uploadRate),
      uploadRate,
      minimum: {
        video: Math.max(0, target.video - drop.video),
        entrevistas: Math.max(0, target.entrevistas - drop.entrevistas),
        laminas: Math.max(0, target.laminas - drop.laminas),
      },
      target,
      spread,
      tight: at(TIGHTS, digit(axes, 3)),
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
  const { target, shape } = techRoleOf(index)
  const issues: string[] = []
  if (p.shape !== shape)
    issues.push('la variante no aprieta el recurso de su dirección')
  if (
    p.target.video !== target.video ||
    p.target.entrevistas !== target.entrevistas ||
    p.target.laminas !== target.laminas
  )
    issues.push('la variante no pide lo que su dirección promete')
  return issues
}

export function techGates(p: TechParams): readonly string[] {
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

  // Y tienen que apretar de verdad: el plan que la feria pide al máximo no
  // puede entrar, o no habría nada que repartir.
  const everything = ITEMS.map((item) => ({
    itemId: item.id,
    quantity: item.max,
  }))
  if (readTech(p, everything).quality !== 'invalid')
    issues.push('los recursos alcanzan para todo')

  // El supremo de todos los objetivos no puede ser un plan admisible: evita
  // resolver cualquier variante aumentando siempre las tres cantidades.
  const supremum = ITEMS.map((item) => ({
    itemId: item.id,
    quantity: Math.max(...TARGETS.map((target) => target[item.id])),
  }))
  if (readTech(p, supremum).quality !== 'invalid')
    issues.push('el supremo de objetivos entra en los recursos')

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
  const { notebook, megabytes } = usage(lines)
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
            ? 'Entró todo lo que el curso había prometido llevar.'
            : 'El stand se arma, aunque algo de lo prometido quedó afuera.',
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
  // 2: objetivos cruzados y presupuestos atados al costo de lo prometido
  // (RS-RA-002). El espacio del generador cambió, así que la versión sube.
  version: '2',
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
    p.uploadRate * p.labMinutes >= p.megabytes / 4
      ? []
      : ['el laboratorio no alcanza ni para una parte del pendrive'],
  narrate: (_p, context) => ({
    title: 'Proyecto del Curso: la feria de tecnología',
    setup: `${projectArcCallback(context.flags)}La feria es el viernes y el curso tiene que armar el stand con la notebook prestada, el pendrive y una hora de laboratorio.`,
    goal: 'Decidí cuánto hacer de cada cosa: que entre en los recursos y que el grupo trabaje parejo.',
  }),
  present: (p) => ({
    kind: 'quantity-builder',
    instructions:
      'Poné cuánto va a producir el curso de cada cosa. Lo que ocupa el pendrive es lo mismo que después hay que subir.',
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
      // Lo que la feria pide y lo que el curso prometió, uno por cosa: el
      // mínimo primero y lo prometido después, que es el orden en el que se
      // decide.
      ...ITEMS.map((item) => ({
        label: item.label,
        value: `${String(p.minimum[item.id])} / ${String(p.target[item.id])}`,
        unit: 'pide / prometió',
      })),
    ],
    items: ITEMS.map((item) => {
      const owner = CREW.find((person) => person.item === item.id)
      return {
        id: item.id,
        label: item.label,
        detail: `${String(item.notebook)} min de notebook · ${mil(item.megabytes)} MB cada uno · lo arma ${owner?.label ?? ''}`,
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
