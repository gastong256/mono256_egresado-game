/**
 * 5.º · La pantalla del acto (`y5.stage-screen`).
 *
 * La pantalla del salón tiene una medida y la imagen del curso tiene otra. Casi
 * nunca son la misma forma, así que hay que elegir: dejarla entera con bandas,
 * agrandarla hasta llenar el ancho y recortar —por el medio, sólo de arriba o
 * sólo de abajo—, dejarla como está o estirarla hasta que entre.
 *
 * Dos datos deciden: **arriba** está el cartel del curso y **abajo** la fecha
 * del acto, cada uno con su alto y con los centímetros de aire que tiene de su
 * lado. Ese aire es lo único que se puede recortar. Como los tres recortes
 * llenan la pantalla igual, lo que los separa es de qué lado sacan lo que sobra:
 * la decisión es comparar cuánto recorta cada uno contra el aire de ese lado.
 *
 * Toda la geometría está escrita en centímetros —no hace falta saber de
 * relaciones de aspecto ni de jerga de proyección—, que es el invariante
 * `LOCKED` de esta Template, y todas las comparaciones son entre enteros
 * (ADR-013): una escala nunca se redondea antes de decidir.
 */
import { z } from 'zod'
import {
  authoredVariantIds,
  defineChallenge,
  err,
  ok,
  toChallengeId,
  toScenarioFamilyId,
  type InteractionAnswer,
  type SolutionQuality,
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

export const WAYS = [
  { id: 'entera', label: 'Que entre entera, con bandas a los costados' },
  { id: 'ancho-centro', label: 'Llenar el ancho y recortar mitad y mitad' },
  { id: 'ancho-arriba', label: 'Llenar el ancho y recortar sólo de arriba' },
  { id: 'ancho-abajo', label: 'Llenar el ancho y recortar sólo de abajo' },
  { id: 'sin-agrandar', label: 'Dejarla como está, chica en el medio' },
  { id: 'estirar', label: 'Estirarla hasta que entre' },
] as const
export type WayId = (typeof WAYS)[number]['id']

/** Los tres recortes: llenan el ancho y sacan lo que sobra de alto. */
export const CROPS: readonly WayId[] = [
  'ancho-centro',
  'ancho-arriba',
  'ancho-abajo',
]

const size = z.number().int().min(20).max(1000)
const centimetres = z.number().int().min(1).max(200)
export const screenSchema = z
  .strictObject({
    /** De qué lado —o de ninguno— alcanza el aire para recortar. */
    shape: z.enum(['aire-parejo', 'aire-arriba', 'aire-abajo', 'sin-aire']),
    /** La pantalla del salón, en centímetros. */
    screenWidth: size,
    screenHeight: size,
    /** La imagen del curso, en centímetros. */
    imageWidth: size,
    imageHeight: size,
    /** El cartel del curso, arriba de todo, con su aire por encima. */
    banner: centimetres,
    bannerAir: centimetres,
    /** La fecha del acto, abajo de todo, con su aire por debajo. */
    date: centimetres,
    dateAir: centimetres,
  })
  .refine(
    (p) => p.bannerAir + p.banner + p.date + p.dateAir < p.imageHeight,
    'el cartel, la fecha y su aire ocupan la imagen entera',
  )
  .refine(
    (p) => p.imageWidth <= p.screenWidth && p.imageHeight <= p.screenHeight,
    'la imagen no entra en la pantalla ni siquiera sin agrandar',
  )
export type ScreenParams = z.infer<typeof screenSchema>

/**
 * Lo que sobra de alto al llenar el ancho, en centímetros de imagen × ancho de
 * pantalla.
 *
 * Se guarda multiplicado para que cada comparación siga siendo entre enteros:
 * `overflow(p) ≤ aire × anchoDePantalla` es «el recorte entra en el aire».
 */
export function overflow(p: ScreenParams): number {
  return p.imageHeight * p.screenWidth - p.screenHeight * p.imageWidth
}

/** Cuánto recorta cada forma de proyectar de cada lado, en la misma escala. */
export function cuts(
  p: ScreenParams,
  way: WayId,
): { readonly top: number; readonly bottom: number } {
  const extra = Math.max(0, overflow(p))
  if (way === 'ancho-centro') return { top: extra, bottom: extra }
  if (way === 'ancho-arriba') return { top: 2 * extra, bottom: 0 }
  if (way === 'ancho-abajo') return { top: 0, bottom: 2 * extra }
  return { top: 0, bottom: 0 }
}

/**
 * Si una forma de proyectar deja enteros el cartel y la fecha.
 *
 * El recorte de cada lado se compara con el aire de ese lado agrandado por la
 * misma escala. Todo está multiplicado por dos y por el ancho de pantalla, así
 * que «la mitad de lo que sobra» no pierde ni medio centímetro.
 */
export function keepsProtected(p: ScreenParams, way: WayId): boolean {
  if (way === 'estirar') return false
  const cut = cuts(p, way)
  return (
    cut.top <= 2 * p.bannerAir * p.screenWidth &&
    cut.bottom <= 2 * p.dateAir * p.screenWidth
  )
}

/** Cuánta pantalla usa cada forma, como fracción exacta `num / den`. */
export function screenShare(
  p: ScreenParams,
  way: WayId,
): { readonly num: number; readonly den: number } {
  if (way === 'estirar' || CROPS.includes(way)) return { num: 1, den: 1 }
  if (way === 'entera')
    // Entra entera escalada por el alto: la imagen es más alta de forma.
    return {
      num: p.imageWidth * p.screenHeight,
      den: p.imageHeight * p.screenWidth,
    }
  return {
    num: p.imageWidth * p.imageHeight,
    den: p.screenWidth * p.screenHeight,
  }
}

const compare = (
  a: { readonly num: number; readonly den: number },
  b: { readonly num: number; readonly den: number },
) => a.num * b.den - b.num * a.den

/** Si una fracción llega a tres cuartos de la pantalla, exacto. */
export function reachesThreeQuarters(share: {
  readonly num: number
  readonly den: number
}): boolean {
  return share.num * 4 >= share.den * 3
}

/**
 * El nivel de cada forma de proyectar.
 *
 * Deformar la imagen o cortar el cartel o la fecha son errores. Entre las que
 * quedan manda cuánta pantalla usan: la que más usa es la mejor —llenarla si
 * algún recorte respeta los dos aires, la imagen entera si ninguno lo hace—,
 * usar al menos tres cuartos es aceptable y menos que eso funciona pero se ve
 * chica.
 */
export function tierOf(p: ScreenParams, way: WayId): SolutionQuality {
  if (!keepsProtected(p, way)) return 'invalid'
  const valid = WAYS.filter((entry) => keepsProtected(p, entry.id))
  const best = valid.reduce(
    (current, entry) =>
      compare(screenShare(p, entry.id), current) > 0
        ? screenShare(p, entry.id)
        : current,
    { num: 0, den: 1 },
  )
  const share = screenShare(p, way)
  if (compare(share, best) === 0) return 'optimal'
  return reachesThreeQuarters(share) ? 'efficient' : 'functional'
}

export interface ScreenChoice {
  readonly wayId: WayId
  readonly quality: SolutionQuality
}

/** Witnesses de las seis formas; comparte tierOf, no es un oráculo independiente. */
export function screenChoices(p: ScreenParams): readonly ScreenChoice[] {
  return WAYS.map((way) => ({ wayId: way.id, quality: tierOf(p, way.id) }))
}

/** Los recortes que respetan los dos elementos protegidos. */
export function validCrops(p: ScreenParams): readonly WayId[] {
  return CROPS.filter((way) => keepsProtected(p, way))
}

/** La forma que el catálogo le pide a esta dirección. */
export function shapeOf(p: ScreenParams): ScreenParams['shape'] {
  const valid = validCrops(p)
  if (valid.length === 0) return 'sin-aire'
  if (valid.includes('ancho-centro')) return 'aire-parejo'
  return valid.includes('ancho-arriba') ? 'aire-arriba' : 'aire-abajo'
}

/**
 * «Recortar todo del lado que tiene más aire»: el atajo que la Template tiene
 * que castigar más de la mitad de las veces.
 */
export function moreAirSide(p: ScreenParams): WayId | undefined {
  if (p.bannerAir === p.dateAir) return undefined
  return p.bannerAir > p.dateAir ? 'ancho-arriba' : 'ancho-abajo'
}

const SCREENS = [
  { width: 320, height: 180 },
  { width: 300, height: 200 },
  { width: 360, height: 200 },
  { width: 280, height: 180 },
  { width: 340, height: 190 },
  { width: 400, height: 225 },
] as const
const IMAGE_WIDTHS = [150, 170, 190, 210, 230, 250] as const
/** Cuánto sobra de alto al llenar el ancho, en centésimos del alto de pantalla. */
const OVERFLOWS = [16, 20, 25, 30, 36, 44] as const
/** El alto del cartel y de la fecha, en centímetros. */
const BANNERS = [10, 14, 18] as const
const DATES = [8, 12, 16] as const
const RADICES = [
  SCREENS.length,
  IMAGE_WIDTHS.length,
  OVERFLOWS.length,
  BANNERS.length,
  DATES.length,
]
export const SCREEN_SPACE = spaceOf(RADICES)
const SCREEN_STRIDE = 197
/** Cada dirección recorre el espacio desde su propio arranque. */
const SEARCH_STEP = 79

/**
 * El papel que juega cada dirección del catálogo.
 *
 * La pantalla del acto tiene un piso de estrategia ciega: «entera» siempre es
 * válida y, donde algún recorte vale, la escalera la deja en `efficient`. El
 * techo probado es `K = 78` sobre veinticinco variantes, y sólo se alcanza con
 * un reparto exacto: tres variantes sin recorte válido —una de ellas con la
 * imagen casi tan grande como la pantalla, para que «sin agrandar» no tenga
 * siempre el mismo nivel—, diez de recorte por el medio y doce de un solo lado.
 * Ver D-S08-116.
 */
export const SCREEN_ROLES = [
  'aire-parejo',
  'aire-arriba',
  'sin-aire-grande',
  'aire-abajo',
  'aire-parejo',
  'aire-arriba',
  'aire-parejo',
  'aire-abajo',
  'aire-parejo',
  'aire-arriba',
  'sin-aire',
  'aire-abajo',
  'aire-parejo',
  'aire-arriba',
  'aire-parejo',
  'aire-abajo',
  'aire-parejo',
  'aire-arriba',
  'sin-aire',
  'aire-abajo',
  'aire-parejo',
  'aire-arriba',
  'aire-parejo',
  'aire-abajo',
  'aire-parejo',
] as const
export type ScreenRole = (typeof SCREEN_ROLES)[number]

export function screenRoleOf(index: number): ScreenRole {
  return SCREEN_ROLES[Math.abs(index) % SCREEN_ROLES.length] ?? SCREEN_ROLES[0]
}

/** La geometría de una dirección, antes de repartir el aire. */
function geometryAt(index: number) {
  const axes = candidateAxes(index, RADICES, SCREEN_STRIDE)
  const screen = at(SCREENS, digit(axes, 0))
  const imageWidth = at(IMAGE_WIDTHS, digit(axes, 1))
  const overflowPercent = at(OVERFLOWS, digit(axes, 2))
  const banner = at(BANNERS, digit(axes, 3))
  const date = at(DATES, digit(axes, 4))
  // El alto de la imagen sale de cuánto queremos que sobre al llenar el ancho:
  // sobra `overflowPercent` por ciento del alto de pantalla, medido en la
  // pantalla, así que en centímetros de imagen es esa parte dividida por la
  // escala.
  const scaledHeight = (screen.height * (100 + overflowPercent)) / 100
  const imageHeight = Math.round((scaledHeight * imageWidth) / screen.width)
  return {
    screenWidth: screen.width,
    screenHeight: screen.height,
    imageWidth,
    imageHeight,
    banner,
    date,
  }
}

/**
 * El aire de cada lado que hace que la dirección juegue su papel.
 *
 * Todo se decide contra lo que sobra: recortar de un solo lado saca el doble
 * que recortar mitad y mitad. El aire se elige cerca del borde que decide, que
 * es lo que vuelve la cuenta obligatoria y lo que hace pasar a IM-1.
 */
function airsFor(
  role: ScreenRole,
  geometry: ReturnType<typeof geometryAt>,
  attempt: number,
): { readonly bannerAir: number; readonly dateAir: number } {
  const extra = Math.max(
    1,
    geometry.imageHeight * geometry.screenWidth -
      geometry.screenHeight * geometry.imageWidth,
  )
  const width = geometry.screenWidth
  // Lo que hace falta para cada recorte, en centímetros de aire.
  const forSide = extra / width
  const forHalf = forSide / 2
  const tight = (value: number) => Math.max(1, Math.ceil(value))
  const short = (value: number) => Math.max(1, Math.floor(value) - attempt)
  switch (role) {
    case 'aire-arriba':
      // Arriba entra el recorte entero; abajo no llega ni a la mitad.
      return { bannerAir: tight(forSide), dateAir: short(forHalf) }
    case 'aire-abajo':
      return { bannerAir: short(forHalf), dateAir: tight(forSide) }
    case 'aire-parejo': {
      // Los dos aires alcanzan para la mitad, ninguno para el lado entero.
      const half = tight(forHalf) + (attempt % 2)
      const other = tight(forHalf) + ((attempt + 1) % 2)
      return { bannerAir: half, dateAir: other }
    }
    default:
      // Ningún recorte entra: ni el de un lado, ni el del medio.
      return { bannerAir: short(forSide), dateAir: short(forHalf) }
  }
}

export function generateScreen(index: number): ScreenParams {
  const role = screenRoleOf(index)
  let last: ScreenParams | undefined
  for (let attempt = 0; attempt < SCREEN_SPACE; attempt++) {
    // Cada dirección arranca en un punto distinto del espacio y avanza de a
    // uno, así que dos direcciones del mismo papel no caen en la misma
    // geometría salvo que el espacio se agote.
    const geometry = geometryAt((index * SEARCH_STEP + attempt) % SCREEN_SPACE)
    const airs = airsFor(role, geometry, index % 3)
    const candidate = screenSchema.safeParse({
      shape:
        role === 'sin-aire' || role === 'sin-aire-grande' ? 'sin-aire' : role,
      ...geometry,
      ...airs,
    })
    if (!candidate.success) continue
    last = candidate.data
    if (
      screenRoleGates(candidate.data, index).length === 0 &&
      screenGates(candidate.data).length === 0
    )
      return candidate.data
  }
  if (last === undefined)
    throw new Error(`sin variante para la dirección ${String(index)}`)
  return last
}

/** Gate de dirección: la variante juega el papel que le toca en el reparto. */
export function screenRoleGates(
  p: ScreenParams,
  index: number,
): readonly string[] {
  const role = screenRoleOf(index)
  const issues: string[] = []
  const wanted = role === 'sin-aire-grande' ? 'sin-aire' : role
  if (shapeOf(p) !== wanted)
    issues.push('la variante no juega el papel de su dirección')
  // Una sola dirección del ciclo trae la imagen casi tan grande como la
  // pantalla: es la que hace que «sin agrandar» no tenga siempre el mismo
  // nivel (punto 8).
  const big = reachesThreeQuarters(screenShare(p, 'sin-agrandar'))
  if (role === 'sin-aire-grande' && !big)
    issues.push('esta dirección tiene que dejar «sin agrandar» aceptable')
  if (role === 'sin-aire' && big)
    issues.push('«sin agrandar» sólo es aceptable en su propia dirección')
  return issues
}

export function screenGates(p: ScreenParams): readonly string[] {
  const issues: string[] = []
  const choices = screenChoices(p)
  const crops = validCrops(p)

  // Witness: estricto salvo la excepción estrecha de D-S08-114, que sólo vale
  // donde ningún recorte es válido y donde, por lo tanto, el nivel que falta no
  // existe en el espacio matemático de la variante.
  issues.push(
    ...tierWitnessIssues(
      choices,
      crops.length === 0 ? 'allowOneMissingIntermediate' : 'strict',
    ),
  )
  if (!choices.some((choice) => choice.quality === 'invalid'))
    issues.push('ninguna forma de proyectar queda mal')

  if (choices.filter((choice) => choice.quality === 'optimal').length !== 1)
    issues.push('la mejor forma de proyectar no es única')
  // Estirar nunca puede ser una respuesta razonable.
  if (tierOf(p, 'estirar') !== 'invalid')
    issues.push('estirar la imagen no quedó como error')
  // La imagen tiene que ser más alta de forma que la pantalla: es lo que hace
  // que llenar el ancho deje algo para recortar.
  if (overflow(p) <= 0)
    issues.push('llenar el ancho no deja nada para recortar')
  // Y no puede tener la misma forma que la pantalla, o no hay nada que elegir.
  if (p.screenWidth * p.imageHeight === p.screenHeight * p.imageWidth)
    issues.push('la imagen tiene la misma forma que la pantalla')

  // Punto 10: «entera» nunca queda a menos de cinco puntos porcentuales del
  // 75 %, para que el nivel de esa respuesta no se decida en el filo.
  const whole = screenShare(p, 'entera')
  if (whole.num * 20 > whole.den * 14 && whole.num * 5 < whole.den * 4)
    issues.push('la pantalla que usa la imagen entera queda pegada al 75 %')

  // IM-1: si el aire del lado que decide cambia ±15 %, la validez de algún
  // recorte tiene que cambiar. Sin eso, el dato es decorado.
  if (!perturbationChangesValidity(p))
    issues.push('el aire no está cerca de lo que haría falta para recortar')

  return issues
}

/** IM-1 exacto: ±15 % del aire de cada lado, sin float. */
function perturbationChangesValidity(p: ScreenParams): boolean {
  const base = CROPS.map((way) => keepsProtected(p, way)).join('')
  for (const factor of [115, 85]) {
    const moved = CROPS.map((way) => {
      const cut = cuts(p, way)
      return (
        cut.top * 100 <= 2 * p.bannerAir * factor * p.screenWidth &&
        cut.bottom * 100 <= 2 * p.dateAir * factor * p.screenWidth
      )
    }).join('')
    if (moved !== base) return true
  }
  return false
}

export function evaluateScreen(p: ScreenParams, optionId: string) {
  const way = WAYS.find((entry) => entry.id === optionId)
  if (way === undefined)
    return err({
      kind: 'invalid-answer' as const,
      detail: 'forma de proyectar fuera de contrato',
    })

  const quality = tierOf(p, way.id)
  const share = screenShare(p, way.id)
  const cut = cuts(p, way.id)
  const usedPercent = Math.round((share.num * 100) / share.den)
  const eaten =
    cut.top > 2 * p.bannerAir * p.screenWidth
      ? 'el cartel del curso'
      : 'la fecha del acto'

  return ok(
    outcome(
      quality,
      {
        outcomeKey: `stage-screen.${p.shape}.${quality}`,
        stamp: quality === 'invalid' ? 'Cortada' : 'Proyectada',
        facts: [
          {
            label: 'Pantalla usada',
            value: `${String(usedPercent)} %`,
          },
          {
            label: 'Aire arriba',
            value: `${String(p.bannerAir)} cm sobre el cartel`,
          },
          {
            label: 'Aire abajo',
            value: `${String(p.dateAir)} cm bajo la fecha`,
          },
        ],
        ...(quality === 'invalid'
          ? {
              violatedConstraint:
                way.id === 'estirar'
                  ? 'Estirada, la imagen queda deformada.'
                  : `Ese recorte se come ${eaten}.`,
            }
          : {}),
        consequence:
          quality === 'invalid'
            ? 'Así no se puede proyectar en el acto.'
            : quality === 'optimal'
              ? validCrops(p).length === 0
                ? 'Es lo más grande que se puede proyectar sin cortar nada.'
                : 'Llena la pantalla, y el cartel y la fecha quedan enteros.'
              : quality === 'efficient'
                ? 'Se ve grande, con bandas a los costados.'
                : 'Se ve, pero queda chica en el medio de la pantalla.',
      },
      {},
      [{ flag: 'y5.screen.choice', value: way.id }],
    ),
  )
}

export const screenVariants = generatedSource({
  id: 'y5.stage-screen.fit',
  version: '2',
  schema: screenSchema,
  size: SCREEN_SPACE,
  generate: generateScreen,
  gates: screenGates,
  addressGates: screenRoleGates,
})

const stageScreenDefinition = defineChallenge<ScreenParams, ScreenParams>({
  id: toChallengeId('y5.stage-screen'),
  family: toScenarioFamilyId('egreso'),
  placement: 'anchor',
  variants: authoredVariantIds(screenVariants.authored),
  variantSource: screenVariants,
  interaction: 'decision-card',
  stages: ['year-5'],
  categories: ['space-and-shape', 'proportions-and-percentages'],
  baseDifficulty: 4,
  // Tres relaciones encadenadas —cuánto se agranda, cuánto sobra de alto y
  // cuánto de eso saca cada recorte—, dos restricciones sostenidas a la vez
  // —el cartel y la fecha—, elegir entre seis formas y comparar cuánta pantalla
  // queda usada: carga 8, que `bandOf` lee como STRETCH.
  cognitive: {
    steps: 3,
    constraints: 2,
    selection: 1,
    optimization: 1,
    uncertainty: 0,
    construction: 1,
  },
  composition: {
    primaryReasoningFamily: 'SPATIAL',
    interactionEngine: 'choice-compare',
    pacingClass: 'QUICK',
    chronology: 50,
    eventCluster: 'egreso',
  },
  scoring: {
    math: 'discrete-quality',
    team: 'none',
    aura: 'none',
    rationale:
      'La cuenta es de escala y recorte: cuánto se agranda la imagen para llenar la pantalla y de qué lado sale lo que sobra. Toda la geometría está dada en centímetros. No hay Equipo ni Aura.',
  },
  tools: ['calculator', 'ruler'],
  generate: ({ params }) => parameters(screenSchema, params),
  verify: (p) =>
    p.banner + p.date < p.imageHeight
      ? []
      : ['el cartel y la fecha ocupan la imagen entera'],
  narrate: () => ({
    title: 'La pantalla del acto',
    setup:
      'La imagen del curso se proyecta en la pantalla del salón, y no tienen la misma forma. Arriba de la imagen está el cartel del curso y abajo, la fecha del acto.',
    goal: 'Elegí cómo proyectarla para que se vea lo más grande posible, sin deformarla y sin cortar el cartel ni la fecha.',
  }),
  present: (p) => ({
    kind: 'decision-card',
    data: [
      {
        label: 'Pantalla',
        value: `${String(p.screenWidth)} × ${String(p.screenHeight)}`,
        unit: 'cm',
        constraint: true,
      },
      {
        label: 'Imagen',
        value: `${String(p.imageWidth)} × ${String(p.imageHeight)}`,
        unit: 'cm',
      },
      {
        label: 'Cartel del curso',
        value: `${String(p.banner)} cm`,
        unit: `arriba de todo, con ${String(p.bannerAir)} cm de aire encima`,
        constraint: true,
        span: 2,
      },
      {
        label: 'Fecha del acto',
        value: `${String(p.date)} cm`,
        unit: `abajo de todo, con ${String(p.dateAir)} cm de aire debajo`,
        constraint: true,
        span: 2,
      },
    ],
    // El detalle dice el tamaño que queda en pantalla y nada más: cuánto recorta
    // de cada lado, y si el cartel o la fecha sobreviven, es la cuenta que el
    // jugador tiene que hacer (punto 11).
    options: WAYS.map((way) => {
      const share = screenShare(p, way.id)
      const shownWidth =
        way.id === 'entera'
          ? Math.round((p.imageWidth * p.screenHeight) / p.imageHeight)
          : way.id === 'sin-agrandar'
            ? p.imageWidth
            : p.screenWidth
      const shownHeight =
        way.id === 'entera'
          ? p.screenHeight
          : way.id === 'sin-agrandar'
            ? p.imageHeight
            : p.screenHeight
      return {
        id: way.id,
        label: way.label,
        detail:
          way.id === 'estirar'
            ? `queda de ${String(p.screenWidth)} × ${String(p.screenHeight)} cm, deformada`
            : `queda de ${String(shownWidth)} × ${String(shownHeight)} cm · ${String(
                Math.round((share.num * 100) / share.den),
              )} % de la pantalla`,
      }
    }),
  }),
  evaluate: (p, answer: InteractionAnswer) =>
    answer.kind === 'decision-card'
      ? evaluateScreen(p, answer.optionId)
      : err({ kind: 'invalid-answer', detail: 'se esperaba una elección' }),
})

/** Con nota por calidad (10/8/6/4). Ver `src/content/grades.ts`. */
export const stageScreen = graded(stageScreenDefinition)
