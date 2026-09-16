/**
 * Cómo se compone una partida normal de 7.º grado.
 *
 * Hasta acá 7.º tenía una sola forma de jugarse: el arco completo de ocho
 * eventos y seis situaciones. Eso es una **demostración** —y desde STAGE-04
 * está declarado como tal—, no lo que un jugador juega dentro de una carrera de
 * seis años. Este módulo agrega la otra forma: el año compuesto, con el
 * presupuesto de uno o dos beats ordinarios que [ADR-019](../../../docs/03-architecture/adr/ADR-019-scenario-family-template-variant.md)
 * fija.
 *
 * Las dos conviven a propósito. La demo existe para que alguien vea el producto
 * entero en una pantalla; la partida compuesta existe para que seis años entren
 * en una sesión. Fundirlas habría obligado a elegir cuál de las dos se pierde.
 *
 * ## Por qué el año compuesto no puede jugar cualquier plantilla
 *
 * El arco de 7.º es una cadena: cada storylet pide haber visto al anterior. Con
 * la apertura y dos beats, lo que el año alcanza es el colectivo y después el
 * acto —el mural, el cuaderno, el trabajo grupal y el stand viven más adelante
 * en la cadena y una partida corta no llega—. Esa restricción es de contenido,
 * no del compositor, así que se declara como dato: `hostableTemplates`.
 *
 * No es una carencia que esta etapa deba tapar. Es exactamente la clase de cosa
 * que el inventario de escenarios —abierto— tiene que resolver cuando decida qué
 * contenido va en qué año.
 */

import {
  stageCompositionPolicy,
  toChallengeId,
  candidateDifficultyCostPolicy,
  PUBLISHED_OBJECTIVES_V1,
  type CompositionPolicy,
} from '@/game'

/**
 * Las plantillas que la cadena narrativa de 7.º alcanza en una partida corta.
 *
 * Derivadas del arco, no elegidas: después de la apertura el único storylet
 * elegible es el del colectivo, y después de ése, el del acto.
 */
export const GRADE_7_HOSTABLE_TEMPLATES = [
  toChallengeId('g7.bus-timing'),
  toChallengeId('g7.bus-latest-departure'),
  toChallengeId('g7.may-25-act'),
] as const

/**
 * La política con la que se compone 7.º.
 *
 * Un objetivo de 250 centésimas con tolerancia 110 admite tanto el año de un
 * beat como el de dos, y prefiere el de dos: un año con una sola decisión es
 * legal y no es lo que se quiere cuando hay contenido para más.
 *
 * Todos estos números son `RECOMENDADA` y van al Teacher Gate. Ninguno afirma
 * que dos beats sea la cantidad correcta para un chico de doce años.
 */
export const grade7CompositionPolicy: CompositionPolicy = {
  id: 'grade-7-composed',
  version: '1.0.0-candidate',
  official: false,
  costPolicy: candidateDifficultyCostPolicy,
  objectives: [...PUBLISHED_OBJECTIVES_V1],
  stages: [
    stageCompositionPolicy('grade-7', {
      difficulty: { target: 250, tolerance: 110 },
      // La apertura del año. El resto de los eventos son los beats compuestos.
      narrativeBeats: 1,
      hostableTemplates: [...GRADE_7_HOSTABLE_TEMPLATES],
    }),
  ],
}
