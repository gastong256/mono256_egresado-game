/**
 * 5.º · La pantalla del acto (`y5.stage-screen`).
 *
 * La pantalla del salón tiene una medida y la imagen del curso tiene otra. Casi
 * nunca son la misma forma, así que hay que elegir: dejarla entera con bandas,
 * agrandarla hasta llenar el ancho y recortar, recortar de un lado o del otro,
 * o estirarla hasta que entre.
 *
 * Arriba de la imagen está el cartel del curso, y ése es el dato que decide:
 * recortar por el medio parece lo natural y se lo come. Toda la geometría está
 * escrita en centímetros —no hace falta saber de relaciones de aspecto ni de
 * jerga de proyección—, que es el invariante `LOCKED` de esta Template.
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

export const WAYS = [
  { id: 'entera', label: 'Que entre entera, con bandas' },
  { id: 'ancho-centro', label: 'Llenar el ancho y recortar por el medio' },
  { id: 'ancho-arriba', label: 'Llenar el ancho y recortar de abajo' },
  { id: 'ancho-abajo', label: 'Llenar el ancho y recortar de arriba' },
  { id: 'sin-agrandar', label: 'Dejarla como está, chica en el medio' },
  { id: 'estirar', label: 'Estirarla hasta que entre' },
] as const
export type WayId = (typeof WAYS)[number]['id']

const size = z.number().int().min(20).max(1000)
export const screenSchema = z
  .strictObject({
    shape: z.enum(['pantalla-ancha', 'imagen-alta', 'cartel-grande']),
    /** La pantalla del salón, en centímetros. */
    screenWidth: size,
    screenHeight: size,
    /** La imagen del curso, en centímetros. */
    imageWidth: size,
    imageHeight: size,
    /** De qué lado de la imagen está el cartel. */
    bannerAt: z.enum(['arriba', 'abajo']),
    /** Centímetros de aire del lado del cartel: eso sí se puede recortar. */
    margin: z.number().int().min(0).max(100),
    /** El cartel del curso, en centímetros de alto. No se puede cortar. */
    banner: z.number().int().min(5).max(200),
  })
  .refine(
    (p) => p.margin + p.banner < p.imageHeight,
    'el cartel y su aire ocupan la imagen entera',
  )
export type ScreenParams = z.infer<typeof screenSchema>

export interface Projection {
  /** Lo que se ve en pantalla, en centímetros. */
  readonly shownWidth: number
  readonly shownHeight: number
  /** Centímetros de imagen recortados arriba y abajo. */
  readonly cutTop: number
  readonly cutBottom: number
  readonly deforms: boolean
}

/** Cómo queda la imagen en la pantalla con cada forma de proyectarla. */
export function project(p: ScreenParams, way: WayId): Projection {
  const byWidth = p.screenWidth / p.imageWidth
  const byHeight = p.screenHeight / p.imageHeight
  const round = (value: number) => Math.round(value)

  if (way === 'estirar')
    return {
      shownWidth: p.screenWidth,
      shownHeight: p.screenHeight,
      cutTop: 0,
      cutBottom: 0,
      deforms: true,
    }
  if (way === 'entera') {
    const scale = Math.min(byWidth, byHeight)
    return {
      shownWidth: round(p.imageWidth * scale),
      shownHeight: round(p.imageHeight * scale),
      cutTop: 0,
      cutBottom: 0,
      deforms: false,
    }
  }
  if (way === 'sin-agrandar')
    return {
      shownWidth: p.imageWidth,
      shownHeight: p.imageHeight,
      cutTop: 0,
      cutBottom: 0,
      deforms: false,
    }
  // Llenar el ancho: si sobra alto, se recorta. Por el medio se corta arriba y
  // abajo por igual; las otras dos eligen de qué lado sacar todo.
  const height = round(p.imageHeight * byWidth)
  const extra = Math.max(0, height - p.screenHeight)
  const cutTop =
    way === 'ancho-centro'
      ? Math.floor(extra / 2)
      : way === 'ancho-abajo'
        ? extra
        : 0
  return {
    shownWidth: p.screenWidth,
    shownHeight: Math.min(height, p.screenHeight),
    cutTop,
    cutBottom: extra - cutTop,
    deforms: false,
  }
}

/**
 * El cartel sobrevive si el recorte de arriba se queda en el aire.
 *
 * Arriba del cartel hay unos centímetros vacíos, y ésos sí se pueden cortar: la
 * cuenta es cuánto recorta cada forma de proyectar, en centímetros de pantalla,
 * contra ese aire ya agrandado por la misma escala.
 */
export function keepsBanner(p: ScreenParams, way: WayId): boolean {
  const shown = project(p, way)
  const cut = p.bannerAt === 'arriba' ? shown.cutTop : shown.cutBottom
  if (cut <= 0) return true
  const scale = p.screenWidth / p.imageWidth
  return cut <= p.margin * scale
}

/** Qué parte de la pantalla queda cubierta, en centímetros cuadrados. */
export function covered(p: ScreenParams, way: WayId): number {
  const shown = project(p, way)
  return shown.shownWidth * shown.shownHeight
}

/**
 * El nivel de cada forma de proyectar, con la escalera escrita.
 *
 * Deformar la imagen o comerse el cartel no son opciones. Después manda cuánta
 * pantalla queda usada: llenarla entera es lo mejor, dejar bandas chicas es
 * aceptable y proyectar en la mitad de la pantalla funciona pero se ve mal.
 */
export function tierOf(p: ScreenParams, way: WayId): SolutionQuality {
  const shown = project(p, way)
  if (shown.deforms || !keepsBanner(p, way)) return 'invalid'
  const screen = p.screenWidth * p.screenHeight
  const use = covered(p, way)
  if (use >= screen) return 'optimal'
  return use * 4 >= screen * 3 ? 'efficient' : 'functional'
}

export interface ScreenChoice {
  readonly wayId: WayId
  readonly quality: SolutionQuality
}

/** Oráculo independiente: las cinco formas, con su nivel. */
export function screenChoices(p: ScreenParams): readonly ScreenChoice[] {
  return WAYS.map((way) => ({ wayId: way.id, quality: tierOf(p, way.id) }))
}

const SHAPES = ['pantalla-ancha', 'imagen-alta', 'cartel-grande'] as const
const SCREENS = [
  { width: 320, height: 180 },
  { width: 300, height: 200 },
  { width: 360, height: 200 },
  { width: 280, height: 180 },
] as const
const IMAGE_WIDTHS = [100, 120, 140] as const
/** Qué parte de la pantalla llena la imagen si entra entera, en por ciento. */
const COVERAGE = [78, 84, 90] as const
/** Cuántos centímetros de aire le faltan al cartel para zafar del recorte. */
const SHORT_BY = [1, 2, 4] as const
const BANNERS = [12, 18, 25] as const
const SIDES = ['arriba', 'abajo'] as const
const RADICES = [
  SHAPES.length,
  SCREENS.length,
  IMAGE_WIDTHS.length,
  COVERAGE.length,
  SHORT_BY.length,
  BANNERS.length,
  SIDES.length,
]
export const SCREEN_SPACE = spaceOf(RADICES)

/**
 * La imagen se construye a partir de la pantalla, no al revés.
 *
 * Los cuatro niveles tienen que existir entre cinco formas de proyectar, y eso
 * no sale de combinar medidas al azar: se elige cuánta pantalla llena la imagen
 * si entra entera, y de ahí sale su alto. El aire arriba del cartel se calcula
 * para quedar **por debajo** de lo que recorta el corte del medio, que es lo
 * que hace que la decisión exista.
 */
export function generateScreen(index: number): ScreenParams {
  const axes = candidateAxes(index, RADICES, 1013)
  const shape = at(SHAPES, digit(axes, 0))
  const screen = at(SCREENS, digit(axes, 1))
  const width = at(IMAGE_WIDTHS, digit(axes, 2))
  const coverage = at(COVERAGE, digit(axes, 3))
  const shortBy = at(SHORT_BY, digit(axes, 4))
  const banner = at(BANNERS, digit(axes, 5))
  const bannerAt = at(SIDES, digit(axes, 6))

  const screenWidth =
    shape === 'pantalla-ancha' ? screen.width + 40 : screen.width
  const screenHeight = screen.height
  // Alto de la imagen para que, entrando entera, llene `coverage` por ciento.
  const height = Math.round(
    (width * screenHeight * 100) / (coverage * screenWidth),
  )
  const scale = screenWidth / width
  const extra = Math.max(0, Math.round(height * scale) - screenHeight)
  const cutTop = Math.floor(extra / 2)
  // El aire que tendría que haber para zafar, menos lo que le falta.
  const needed = Math.floor(cutTop / scale)
  return screenSchema.parse({
    shape,
    screenWidth,
    screenHeight,
    imageWidth: width,
    imageHeight: shape === 'imagen-alta' ? height + 6 : height,
    bannerAt,
    margin: Math.max(0, needed - shortBy),
    banner: shape === 'cartel-grande' ? banner + 8 : banner,
  })
}

export function screenGates(p: ScreenParams): readonly string[] {
  const issues: string[] = []
  const choices = screenChoices(p)
  issues.push(...tierWitnessIssues(choices))

  if (choices.filter((choice) => choice.quality === 'optimal').length !== 1)
    issues.push('la mejor forma de proyectar no es única')
  // Estirar nunca puede ser una respuesta razonable.
  if (tierOf(p, 'estirar') !== 'invalid')
    issues.push('estirar la imagen no quedó como error')
  // La imagen tiene que ser más alta de forma que la pantalla: es lo que hace
  // que llenar el ancho sobre alto y haya algo que recortar.
  if (p.imageHeight * p.screenWidth <= p.screenHeight * p.imageWidth)
    issues.push('llenar el ancho no deja nada para recortar')
  // LOCKED del año: el cartel tiene que decidir algo. Si recortar por el medio
  // no lo toca, el dato es decorado y la Template es un encastre.
  if (keepsBanner(p, 'ancho-centro'))
    issues.push('recortar por el medio no toca el cartel')
  // Y no puede ser obvio: el aire que hay tiene que estar cerca del que haría
  // falta, o se contesta sin hacer la cuenta.
  const scale = p.screenWidth / p.imageWidth
  if (project(p, 'ancho-centro').cutTop > (p.margin + 8) * scale)
    issues.push('el recorte se pasa tanto que no hay nada que calcular')
  // Y la imagen no puede tener la misma forma que la pantalla, o no hay nada
  // que elegir.
  if (p.screenWidth * p.imageHeight === p.screenHeight * p.imageWidth)
    issues.push('la imagen tiene la misma forma que la pantalla')
  return issues
}

export function evaluateScreen(p: ScreenParams, optionId: string) {
  const way = WAYS.find((entry) => entry.id === optionId)
  if (way === undefined)
    return err({
      kind: 'invalid-answer' as const,
      detail: 'forma de proyectar fuera de contrato',
    })

  const quality = tierOf(p, way.id)
  const shown = project(p, way.id)
  const screen = p.screenWidth * p.screenHeight
  const use = covered(p, way.id)

  return ok(
    outcome(
      quality,
      {
        outcomeKey: `stage-screen.${p.shape}.${quality}`,
        stamp: quality === 'invalid' ? 'Cortada' : 'Proyectada',
        facts: [
          {
            label: 'Se ve',
            value: `${String(shown.shownWidth)} × ${String(shown.shownHeight)} cm`,
          },
          {
            label: 'Pantalla usada',
            value: `${String(Math.round((use / screen) * 100))} %`,
          },
          {
            label: 'Recorte',
            value:
              shown.cutTop + shown.cutBottom === 0
                ? 'nada'
                : `${String(shown.cutTop)} cm arriba · ${String(shown.cutBottom)} cm abajo`,
          },
        ],
        ...(quality === 'invalid'
          ? {
              violatedConstraint: shown.deforms
                ? 'Estirada, la imagen queda deformada.'
                : 'El recorte de arriba se come el cartel del curso.',
            }
          : {}),
        consequence:
          quality === 'invalid'
            ? 'Así no se puede proyectar en el acto.'
            : quality === 'optimal'
              ? 'Llena la pantalla y el cartel queda entero.'
              : quality === 'efficient'
                ? 'Se ve bien, con unas bandas al costado.'
                : 'Se ve, pero queda media pantalla vacía.',
      },
      {},
      [{ flag: 'y5.screen.choice', value: way.id }],
    ),
  )
}

export const screenVariants = generatedSource({
  id: 'y5.stage-screen.fit',
  version: '1',
  schema: screenSchema,
  size: SCREEN_SPACE,
  generate: generateScreen,
  gates: screenGates,
})

export const stageScreen = defineChallenge<ScreenParams, ScreenParams>({
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
  // cuánto de eso se recorta—, dos restricciones sostenidas a la vez —no
  // deformar y no tocar el cartel—, elegir entre cinco formas y comparar cuánta
  // pantalla queda usada: carga 8, que `bandOf` lee como STRETCH.
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
      'La cuenta es de escala y recorte: cuánto se agranda la imagen para llenar la pantalla y qué queda afuera. Toda la geometría está dada en centímetros. No hay Equipo ni Aura.',
  },
  tools: ['calculator', 'ruler'],
  generate: ({ params }) => parameters(screenSchema, params),
  verify: (p) =>
    p.banner < p.imageHeight ? [] : ['el cartel ocupa la imagen entera'],
  narrate: () => ({
    title: 'La pantalla del acto',
    setup:
      'La imagen del curso se proyecta en la pantalla del salón, y no tienen la misma forma.',
    goal: 'Elegí cómo proyectarla sin comerte el cartel del curso.',
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
        unit: `${p.bannerAt} de todo, con ${String(p.margin)} cm de aire`,
        constraint: true,
        span: 2,
      },
    ],
    options: WAYS.map((way) => {
      const shown = project(p, way.id)
      return {
        id: way.id,
        label: way.label,
        detail:
          way.id === 'estirar'
            ? `queda de ${String(p.screenWidth)} × ${String(p.screenHeight)} cm, deformada`
            : `queda de ${String(shown.shownWidth)} × ${String(shown.shownHeight)} cm`,
      }
    }),
  }),
  evaluate: (p, answer: InteractionAnswer) =>
    answer.kind === 'decision-card'
      ? evaluateScreen(p, answer.optionId)
      : err({ kind: 'invalid-answer', detail: 'se esperaba una elección' }),
})
