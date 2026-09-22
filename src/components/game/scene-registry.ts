import type { PublicChallengeView } from '@/game'

/**
 * Qué ilustración acompaña a cada situación.
 *
 * Es un mapa de **presentación**: vive en la capa de componentes y no toca el
 * motor, el contenido ni las huellas. Una Template se identifica por su id y
 * el registro le asigna, como mucho, una escena; el estado de la run no sabe
 * que la imagen existe, y una run jugada sin imágenes es exactamente la misma
 * run.
 *
 * La granularidad es la del inventario RC3: una escena por **situación
 * visual**, no por Template ni por Variant. Las dos preguntas del colectivo
 * comparten la parada; el salón, la cola y los turnos del evento comparten el
 * salón antes de abrir. Eso mantiene el pack en veinticuatro imágenes para
 * veintiocho Templates públicas.
 *
 * Los Repasos no figuran a propósito. Un Repaso vuelve sobre una situación que
 * el año ya mostró, y arriba de su desafío ya van las notas de lo que practica y
 * lo que sólo comenta: una segunda copia de la misma ilustración sumaría scroll
 * sin agregar contexto. Tampoco figuran las Templates de 7.º que la carrera
 * pública no alcanza —mural, cuaderno, trabajo grupal y stand—: no tienen arte
 * y no lo tendrán hasta que haya una decisión de producto que las incluya.
 *
 * Los derivados viven en `public/assets/scenes/`; los originales, su
 * procedencia y la matriz de reconciliación quedan documentados fuera del
 * runtime (`.tmp/rc3-branding/`).
 */

/** Ruta pública de cada escena, por id de asset del manifiesto RC3. */
const SCENES = {
  'scenario.g7.bus': '/assets/scenes/g7-bus.webp',
  'scenario.g7.may-25': '/assets/scenes/g7-may-25.webp',
  'scenario.y1.classroom': '/assets/scenes/y1-classroom.webp',
  'scenario.y1.expo': '/assets/scenes/y1-expo.webp',
  'scenario.y1.mobile-data': '/assets/scenes/y1-mobile-data.webp',
  'scenario.y1.rehearsal': '/assets/scenes/y1-rehearsal.webp',
  'scenario.y1.wheel': '/assets/scenes/y1-wheel.webp',
  'scenario.y2.survey': '/assets/scenes/y2-survey.webp',
  'scenario.y2.court': '/assets/scenes/y2-court.webp',
  'scenario.y2.intercurso': '/assets/scenes/y2-intercurso.webp',
  'scenario.y2.team-kit': '/assets/scenes/y2-team-kit.webp',
  'scenario.y3.tech': '/assets/scenes/y3-tech.webp',
  'scenario.y3.friend': '/assets/scenes/y3-friend.webp',
  'scenario.y3.route': '/assets/scenes/y3-route.webp',
  'scenario.y3.transport': '/assets/scenes/y3-transport.webp',
  'scenario.y3.week': '/assets/scenes/y3-week.webp',
  'scenario.y4.fundraiser': '/assets/scenes/y4-fundraiser.webp',
  'scenario.y4.event': '/assets/scenes/y4-event.webp',
  'scenario.y4.represent': '/assets/scenes/y4-represent.webp',
  'scenario.y5.final-project': '/assets/scenes/y5-final-project.webp',
  'scenario.y5.trip': '/assets/scenes/y5-trip.webp',
  'scenario.y5.screen': '/assets/scenes/y5-screen.webp',
  'scenario.y5.yearbook': '/assets/scenes/y5-yearbook.webp',
  'scenario.y5.next-step': '/assets/scenes/y5-next-step.webp',
} as const satisfies Record<string, `/assets/scenes/${string}.webp`>

export type SceneAssetId = keyof typeof SCENES

/**
 * Template pública → escena.
 *
 * Sólo Templates ordinarias que la carrera pública puede componer. Un id que no
 * está acá no tiene imagen, y eso es un estado válido: la situación se muestra
 * como siempre, con su prosa, sus datos y su interacción.
 */
const TEMPLATE_SCENES: Readonly<Record<string, SceneAssetId>> = {
  // 7.º — sólo lo que la cadena narrativa alcanza en una carrera.
  'g7.bus-timing': 'scenario.g7.bus',
  'g7.bus-latest-departure': 'scenario.g7.bus',
  'g7.may-25-act': 'scenario.g7.may-25',
  // 1.º
  'y1.classroom-layout': 'scenario.y1.classroom',
  'y1.course-project-expo': 'scenario.y1.expo',
  'y1.mobile-data': 'scenario.y1.mobile-data',
  'y1.rehearsal-schedule': 'scenario.y1.rehearsal',
  'y1.student-day-challenge-wheel': 'scenario.y1.wheel',
  // 2.º
  'y2.course-project-survey': 'scenario.y2.survey',
  'y2.court-zones': 'scenario.y2.court',
  'y2.intercurso-plan': 'scenario.y2.intercurso',
  'y2.standings-claim': 'scenario.y2.intercurso',
  'y2.team-kit-order': 'scenario.y2.team-kit',
  // 3.º
  'y3.course-project-tech': 'scenario.y3.tech',
  'y3.friend-day': 'scenario.y3.friend',
  'y3.route-plan': 'scenario.y3.route',
  'y3.transport-pass': 'scenario.y3.transport',
  'y3.week-planner': 'scenario.y3.week',
  // 4.º
  'y4.course-project-fundraiser': 'scenario.y4.fundraiser',
  'y4.event-floor-plan': 'scenario.y4.event',
  'y4.school-event-flow': 'scenario.y4.event',
  'y4.shift-coverage': 'scenario.y4.event',
  'y4.represent-class': 'scenario.y4.represent',
  // 5.º
  'y5.course-project-final': 'scenario.y5.final-project',
  'y5.final-trip-or-event': 'scenario.y5.trip',
  'y5.stage-screen': 'scenario.y5.screen',
  'y5.yearbook': 'scenario.y5.yearbook',
  'y5.next-step-options': 'scenario.y5.next-step',
}

export interface SceneArtwork {
  /** Id del asset en el manifiesto RC3, para trazabilidad. */
  readonly asset: SceneAssetId
  /** Ruta pública del derivado optimizado. */
  readonly src: string
}

/** La escena de una Template, si tiene. */
export function sceneForTemplate(templateId: string): SceneArtwork | undefined {
  const asset = TEMPLATE_SCENES[templateId]
  return asset === undefined ? undefined : { asset, src: SCENES[asset] }
}

/**
 * La escena de la situación en pantalla, si le corresponde una.
 *
 * Un beat de Repaso no lleva imagen aunque su Template la tuviera: ya trae sus
 * notas arriba y vuelve sobre un lugar que el año acaba de mostrar.
 */
export function sceneForChallenge(
  view: PublicChallengeView,
): SceneArtwork | undefined {
  if (view.review !== undefined) {
    return undefined
  }
  return sceneForTemplate(view.ref.templateId)
}

/** Todas las Templates con escena, para verificar cobertura contra el catálogo. */
export function templatesWithScene(): readonly string[] {
  return Object.keys(TEMPLATE_SCENES)
}

/** Todas las escenas registradas, para verificar que sus archivos existan. */
export function registeredScenes(): readonly SceneArtwork[] {
  return (Object.keys(SCENES) as SceneAssetId[]).map((asset) => ({
    asset,
    src: SCENES[asset],
  }))
}
