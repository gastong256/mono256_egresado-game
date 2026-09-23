/**
 * 1.º · Datos para estos días (`y1.mobile-data`).
 *
 * Una sola relación de capacidad en una sola unidad —MB—: la cobertura escolar
 * de los días que quedan más los ratos de descanso que el jugador decide
 * financiar. CORE por D-S08-043: se construye un plan factible, nunca «el
 * mejor» plan, y los objetivos de calidad son condiciones de servicio escritas.
 *
 * Los números deciden qué planes funcionan. Cada variante trae un señuelo en el
 * que cae un plan armado sin hacer la cuenta: la opción del pedido que no
 * entra, el descanso todo en videos o el segundo video que se come la reserva.
 * Ese señuelo es parte de lo que el pipeline exige para aprobar la variante.
 */
import { z } from 'zod'
import {
  add,
  authoredVariantIds,
  compare,
  defineChallenge,
  err,
  fromInteger,
  multiply,
  ok,
  toChallengeId,
  toScenarioFamilyId,
  type BudgetLine,
  type EstiloAxis,
  type InteractionAnswer,
  type SolutionQuality,
} from '@/game'
import {
  at,
  candidateAxes,
  digit,
  feasibilityConstruction,
  generatedSource,
  grade1StylePolicy,
  mil,
  outcome,
  parameters,
  quantity,
  quantityIssues,
  spaceOf,
  styleGateIssues,
  tierWitnessIssues,
  type StyledPlan,
} from '../authoring'
import { graded } from '../../grades'

/** Public item limits. Large enough that «elegir todo» is always a failed plan. */
export const MUSIC_MAX = 24
export const VIDEO_MAX = 12

const megabytes = z.number().int().min(5).max(5000).multipleOf(5)
const common = {
  days: z.number().int().min(3).max(7),
  capacity: z.number().int().min(100).max(9000).multipleOf(5),
  /** MB of one day of course material and messages. */
  school: megabytes,
  /** MB of one music session. */
  music: megabytes,
  /** MB of one video. */
  video: megabytes,
}
export const mobileDataSchema = z.discriminatedUnion('shape', [
  /** «X videos o Y sesiones de música»: exactly one of the two fits. */
  z.strictObject({
    shape: z.literal('either-or'),
    ...common,
    videos: z.number().int().min(1).max(VIDEO_MAX),
    songs: z.number().int().min(1).max(MUSIC_MAX),
  }),
  /** «Al menos N ratos de descanso»: all music fits, all video does not. */
  z.strictObject({
    shape: z.literal('rest-total'),
    ...common,
    sessions: z.number().int().min(2).max(MUSIC_MAX),
  }),
  /** «Descanso y dejar R MB sin usar»: one video fits the reserve, two do not. */
  z.strictObject({
    shape: z.literal('keep-reserve'),
    ...common,
    reserve: megabytes,
  }),
])
export type MobileDataParams = z.infer<typeof mobileDataSchema>

const SHAPES = ['either-or', 'rest-total', 'keep-reserve'] as const
const DAYS = [4, 5, 6, 7] as const
const SCHOOL = [50, 100, 150] as const
const RATES = [
  { music: 25, video: 100 },
  { music: 40, video: 150 },
  { music: 50, video: 200 },
  { music: 50, video: 250 },
] as const
const RADICES = [SHAPES.length, DAYS.length, SCHOOL.length, RATES.length, 2]
export const MOBILE_DATA_SPACE = spaceOf(RADICES)
/**
 * El paso que recorre el espacio de candidatos.
 *
 * Tiene que ser coprimo con el tamaño —si no, no es una biyección—, pero eso no
 * alcanza: con paso 97 el resto módulo 3 quedaba igual al índice módulo 3, así
 * que **toda** dirección de forma `either-or` caía en la mitad baja del espacio
 * y heredaba siempre el mismo par de tasas y el mismo `flip`. Las once variantes
 * `either-or` del catálogo publicado eran, en los hechos, tres problemas
 * repetidos, y «llenar de videos» las resolvía a las once (MAT-CLO-003).
 *
 * 35 mantiene la biyección —288 = 2⁵·3², y 35 = 5·7— y además reparte los dos
 * dígitos lentos: en los primeros once múltiplos de 3 aparecen los cuatro pares
 * de tasas y los dos valores de `flip`.
 */
const MOBILE_DATA_STRIDE = 35

const roundUp = (value: number, step: number): number =>
  Math.ceil(value / step) * step

/**
 * Constraint-first materialisation of one candidate address.
 *
 * The free data after the school coverage is built around the shape's decoy:
 * the infeasible option of the request, the all-video mix or the second video.
 * The authoring gates below re-check every relation with their own arithmetic.
 */
export function generateMobileData(index: number): MobileDataParams {
  const axes = candidateAxes(index, RADICES, MOBILE_DATA_STRIDE)
  const shape = at(SHAPES, digit(axes, 0))
  const days = at(DAYS, digit(axes, 1))
  const school = at(SCHOOL, digit(axes, 2))
  const { music, video } = at(RATES, digit(axes, 3))
  const flip = digit(axes, 4)
  const covered = days * school
  const base = { days, school, music, video }

  switch (shape) {
    case 'either-or': {
      if (flip === 0) {
        const videos = 2 + (days % 3)
        const free = roundUp(videos * video + 2 * music, 50)
        return mobileDataSchema.parse({
          shape,
          ...base,
          capacity: covered + free,
          videos,
          songs: Math.floor(free / music) + 1,
        })
      }
      // El aire sobre el pedido es **un video**, no una sesión de música más.
      // Con una sesión de música el único plan que cumple el pedido gasta todo
      // en música, así que ninguna forma de jugar alcanza el óptimo salvo una y
      // el gate de Estilo rechaza la variante: el catálogo se quedaba sin
      // ninguna dirección de este lado del `either-or` y «llenar de videos» lo
      // resolvía entero (MAT-CLO-003).
      const songs = 6 + 2 * (days % 3)
      const free = roundUp(songs * music + video, 50)
      return mobileDataSchema.parse({
        shape,
        ...base,
        capacity: covered + free,
        songs,
        videos: Math.floor(free / video) + 1,
      })
    }
    case 'rest-total': {
      const sessions = 4 + (days % 3)
      const videosInMix = 1 + flip
      const free = roundUp(sessions * music + videosInMix * (video - music), 50)
      return mobileDataSchema.parse({
        shape,
        ...base,
        capacity: covered + free,
        sessions,
      })
    }
    case 'keep-reserve': {
      const reserve = 100 + 50 * (days % 3)
      const free = reserve + video + (1 + flip) * music
      return mobileDataSchema.parse({
        shape,
        ...base,
        capacity: covered + free,
        reserve,
      })
    }
  }
}

/** Estilo of a valid plan: reserve, flexible mix or focused use. Never scored. */
export function mobileStyle(
  p: MobileDataParams,
  used: number,
  songs: number,
  videos: number,
): EstiloAxis {
  const margin = p.capacity - used
  if (
    margin * grade1StylePolicy.reserveDenominator >=
    p.capacity * grade1StylePolicy.reserveNumerator
  )
    return 'aplicado'
  return songs > 0 && videos > 0 ? 'improvisador' : 'estratega'
}

export interface MobilePlan extends StyledPlan {
  readonly lines: readonly BudgetLine[]
  readonly used: number
}

/**
 * Independent oracle over every plan that covers the days.
 *
 * Integer arithmetic and its own spelling of each service condition; it never
 * calls the evaluator, so an evaluator drift shows up as a disagreement.
 */
export function mobilePlans(p: MobileDataParams): readonly MobilePlan[] {
  const plans: MobilePlan[] = []
  for (let songs = 0; songs <= MUSIC_MAX; songs++)
    for (let videos = 0; videos <= VIDEO_MAX; videos++) {
      const used = p.days * p.school + songs * p.music + videos * p.video
      const lines = [
        { itemId: 'school', quantity: p.days },
        { itemId: 'music', quantity: songs },
        { itemId: 'video', quantity: videos },
      ]
      if (used > p.capacity) {
        plans.push({ lines, used, quality: 'invalid' })
        continue
      }
      const rest = songs + videos
      let asked: boolean
      if (p.shape === 'either-or')
        asked = !(videos < p.videos && songs < p.songs)
      else if (p.shape === 'rest-total') asked = rest - p.sessions >= 0
      else asked = rest >= 1 && p.capacity - p.reserve - used >= 0
      plans.push({
        lines,
        used,
        quality: rest === 0 ? 'functional' : asked ? 'optimal' : 'efficient',
        style: mobileStyle(p, used, songs, videos),
      })
    }
  return plans
}

/** Authoring gates. A variant that fails any of them is never approved. */
export function mobileGates(p: MobileDataParams): readonly string[] {
  const free = p.capacity - p.days * p.school
  if (free <= 0) return ['la cobertura escolar no entra en los datos']
  const plans = mobilePlans(p)
  const issues = [...tierWitnessIssues(plans), ...styleGateIssues(plans)]
  if (plans.filter((plan) => plan.quality === 'optimal').length < 2)
    issues.push('una sola forma de cumplir el pedido')

  // Intrinsic Math Gate: the numbers change which plan satisfies the request.
  switch (p.shape) {
    case 'either-or': {
      const videosFit = p.videos * p.video <= free
      const songsFit = p.songs * p.music <= free
      if (videosFit === songsFit)
        issues.push(
          'el pedido tiene que ofrecer una opción que entra y otra que no',
        )
      break
    }
    case 'rest-total':
      if (p.sessions * p.video <= free)
        issues.push('todo el descanso en videos también entra: no hay cuenta')
      if (p.sessions * p.music > free)
        issues.push('ni siquiera todo en música entra')
      if ((p.sessions - 1) * p.music + p.video > free)
        issues.push('ninguna mezcla con videos entra')
      break
    case 'keep-reserve':
      if (2 * p.video <= free - p.reserve)
        issues.push('dos videos respetan la reserva: no hay señuelo')
      if (p.video + p.music > free - p.reserve)
        issues.push('ninguna mezcla respeta la reserva')
      break
  }
  if (
    p.days * p.school + MUSIC_MAX * p.music + VIDEO_MAX * p.video <=
    p.capacity
  )
    issues.push('elegir todo entra: el límite no decide nada')
  return issues
}

/** Runtime structural check of an approved address; the gates ran at approval. */
function verifyMobile(p: MobileDataParams): readonly string[] {
  return p.capacity > p.days * p.school
    ? []
    : ['la cobertura escolar no entra en los datos']
}

function requestText(p: MobileDataParams): string {
  switch (p.shape) {
    case 'either-or':
      return `ver ${String(p.videos)} videos o escuchar ${String(p.songs)} sesiones de música (con una de las dos alcanza).`
    case 'rest-total':
      return `juntar al menos ${String(p.sessions)} ratos de descanso en total, entre música y videos.`
    case 'keep-reserve':
      return `tener algún rato de descanso y dejar al menos ${mil(p.reserve)} MB sin usar por si hay videollamada del grupo.`
  }
}

/** Whether the explicit request holds, spelled the evaluator's way. */
function requestMet(
  p: MobileDataParams,
  songs: number,
  videos: number,
  used: number,
): boolean {
  switch (p.shape) {
    case 'either-or':
      return videos >= p.videos || songs >= p.songs
    case 'rest-total':
      return songs + videos >= p.sessions
    case 'keep-reserve':
      return songs + videos > 0 && used + p.reserve <= p.capacity
  }
}

/** The arithmetic of the decoy, shown after the decision, never before. */
function decoyText(p: MobileDataParams, free: number): string {
  switch (p.shape) {
    case 'either-or':
      return p.videos * p.video > free
        ? `${String(p.videos)} videos pedían ${mil(p.videos * p.video)} MB y, después del curso, quedaban ${mil(free)} MB.`
        : `${String(p.songs)} sesiones de música pedían ${mil(p.songs * p.music)} MB y, después del curso, quedaban ${mil(free)} MB.`
    case 'rest-total':
      return `Todo en videos no entraba: ${String(p.sessions)} × ${String(p.video)} MB = ${mil(p.sessions * p.video)} MB, y quedaban ${mil(free)} MB.`
    case 'keep-reserve':
      return `Un segundo video rompía la reserva: para descanso había ${mil(free - p.reserve)} MB.`
  }
}

export function evaluateMobileData(
  p: MobileDataParams,
  lines: readonly BudgetLine[],
) {
  const issues = quantityIssues(lines, [
    { id: 'school', maxQuantity: p.days },
    { id: 'music', maxQuantity: MUSIC_MAX },
    { id: 'video', maxQuantity: VIDEO_MAX },
  ])
  if (issues.length > 0)
    return err({ kind: 'invalid-answer' as const, detail: issues.join('; ') })

  const school = quantity(lines, 'school')
  const songs = quantity(lines, 'music')
  const videos = quantity(lines, 'video')
  // Exact arithmetic in the authority path; the integer is only for display.
  const exact = add(
    add(
      multiply(fromInteger(school), fromInteger(p.school)),
      multiply(fromInteger(songs), fromInteger(p.music)),
    ),
    multiply(fromInteger(videos), fromInteger(p.video)),
  )
  const fits = compare(exact, fromInteger(p.capacity)) <= 0
  const used = school * p.school + songs * p.music + videos * p.video
  const covered = school === p.days
  const rest = songs + videos
  const free = p.capacity - p.days * p.school

  const quality: SolutionQuality =
    !covered || !fits
      ? 'invalid'
      : rest === 0
        ? 'functional'
        : requestMet(p, songs, videos, used)
          ? 'optimal'
          : 'efficient'
  const axis =
    quality === 'invalid' ? undefined : mobileStyle(p, used, songs, videos)

  const consequence =
    quality === 'invalid'
      ? !covered
        ? 'Un día queda sin material del curso: justo el que traía la consigna del proyecto. Primero van los días de curso; el descanso, con lo que sobre.'
        : `A mitad de semana te quedás sin datos: el plan se pasa por ${mil(used - p.capacity)} MB y el material del curso deja de bajar.`
      : quality === 'functional'
        ? 'El curso queda cubierto, pero no te dejaste ningún rato de descanso, y entraba.'
        : quality === 'efficient'
          ? p.shape === 'rest-total'
            ? `Juntaste ${String(rest)} ratos de descanso; el pedido era ${String(p.sessions)}.`
            : p.shape === 'keep-reserve'
              ? `Hay descanso, pero te quedan ${mil(p.capacity - used)} MB y querías guardar ${mil(p.reserve)}.`
              : 'Hay descanso, pero no llegaste a ninguna de las dos opciones del pedido.'
          : `Material cubierto, pedido cumplido y te quedan ${mil(p.capacity - used)} MB.`

  return ok(
    outcome(
      quality,
      {
        outcomeKey: `mobile-data.${p.shape}.${quality}`,
        stamp:
          quality === 'invalid'
            ? covered
              ? 'Sin datos'
              : 'Falta el curso'
            : 'Plan armado',
        facts: [
          {
            label: 'Material del curso',
            value: `${String(school)} × ${String(p.school)} MB = ${mil(school * p.school)} MB`,
          },
          {
            label: 'Música',
            value: `${String(songs)} × ${String(p.music)} MB = ${mil(songs * p.music)} MB`,
          },
          {
            label: 'Videos',
            value: `${String(videos)} × ${String(p.video)} MB = ${mil(videos * p.video)} MB`,
          },
          { label: 'Total', value: `${mil(used)} de ${mil(p.capacity)} MB` },
          ...(fits
            ? [{ label: 'Sobran', value: `${mil(p.capacity - used)} MB` }]
            : []),
        ],
        ...(quality === 'invalid'
          ? {
              violatedConstraint: !covered
                ? `Faltan ${String(p.days - school)} días de material del curso.`
                : `El plan usa ${mil(used)} MB y hay ${mil(p.capacity)} MB.`,
            }
          : {}),
        ...(quality === 'optimal' || quality === 'efficient'
          ? { optimalComparison: decoyText(p, free) }
          : {}),
        consequence,
      },
      axis === undefined
        ? {}
        : { estilo: { axis, amount: grade1StylePolicy.evidence } },
      [
        { flag: 'y1.mobile.outcome', value: quality },
        ...(axis === undefined
          ? []
          : [{ flag: 'y1.mobile.strategy', value: axis }]),
      ],
    ),
  )
}

export const mobileDataVariants = generatedSource({
  id: 'y1.mobile-data.capacity-decoys',
  // 2: paso de recorrido que descorrelaciona la forma de las tasas y del flip
  // (MAT-CLO-003). El espacio es el mismo; qué dirección da qué variante, no.
  version: '2',
  schema: mobileDataSchema,
  size: MOBILE_DATA_SPACE,
  generate: generateMobileData,
  gates: mobileGates,
})

const mobileDataDefinition = defineChallenge<
  MobileDataParams,
  MobileDataParams
>({
  id: toChallengeId('y1.mobile-data'),
  family: toScenarioFamilyId('mobile-data'),
  placement: 'checkpoint',
  variants: authoredVariantIds(mobileDataVariants.authored),
  variantSource: mobileDataVariants,
  interaction: 'quantity-builder',
  stages: ['year-1'],
  categories: ['time-and-rates', 'quantity'],
  baseDifficulty: 2,
  cognitive: feasibilityConstruction,
  composition: {
    primaryReasoningFamily: 'ECONOMIC_PROPORTIONAL',
    interactionEngine: 'allocate-constrain',
    pacingClass: 'QUICK',
    chronology: 10,
  },
  scoring: {
    math: 'discrete-quality',
    team: 'none',
    aura: 'none',
    rationale:
      'Math mide cobertura escolar, capacidad y el pedido de servicio escrito. Estilo describe reserva, mezcla o uso ajustado entre planes válidos y no aporta competencia.',
  },
  tools: ['calculator'],
  generate: ({ params }) => parameters(mobileDataSchema, params),
  verify: verifyMobile,
  narrate: (p) => ({
    title: 'Datos para estos días',
    setup: `Faltan ${String(p.days)} días para que se renueven los datos del celular y te quedan ${mil(p.capacity)} MB. Cada día llegan el material y los mensajes del curso; con lo que sobre, algo de descanso.`,
    goal: `Cubrí los ${String(p.days)} días de curso sin pasarte. Pedido opcional: ${requestText(p)}`,
  }),
  present: (p) => ({
    kind: 'quantity-builder',
    data: [
      { label: 'Quedan', value: String(p.days), unit: 'días de clase' },
      {
        label: 'Datos disponibles',
        value: mil(p.capacity),
        unit: 'MB',
        constraint: true,
      },
    ],
    items: [
      {
        id: 'school',
        label: 'Material y mensajes del curso',
        detail: `${String(p.school)} MB por día`,
        maxQuantity: p.days,
      },
      {
        id: 'music',
        label: 'Música',
        detail: `${String(p.music)} MB por sesión`,
        maxQuantity: MUSIC_MAX,
      },
      {
        id: 'video',
        label: 'Videos',
        detail: `${String(p.video)} MB por video`,
        maxQuantity: VIDEO_MAX,
      },
    ],
    instructions:
      'Elegí cuántas veces entra cada uso. Cada sesión de material cubre un día de curso. Música y videos son opcionales, y no hace falta gastar todo.',
  }),
  evaluate: (p, answer: InteractionAnswer) =>
    answer.kind === 'quantity-builder'
      ? evaluateMobileData(p, answer.lines)
      : err({
          kind: 'invalid-answer',
          detail: 'se esperaba un plan de cantidades',
        }),
})

/** Con nota por calidad (10/8/6/4). Ver `src/content/grades.ts`. */
export const mobileData = graded(mobileDataDefinition)
