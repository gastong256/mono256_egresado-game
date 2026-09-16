/**
 * Los eventos raros de la carrera.
 *
 * Uno por año, con el tratamiento que su diseño aprobó. Ninguno agrega un beat,
 * mueve un techo de FairScore ni otorga Prestige por aparecer: lo que hacen es
 * que dos carreras con el mismo plan no se cuenten igual.
 *
 * La elegibilidad de los cuatro es **contextual y no de desempeño**: piden que
 * el año ya se haya presentado, nunca que al jugador le esté yendo bien. Un
 * evento raro que apareciera más seguido para quien viene ganando sería
 * exactamente el «win-more» que los guardrails prohíben.
 */
import { toChallengeId, toStoryletId, type RareEventDefinition } from '@/game'

export const careerRareEvents: readonly RareEventDefinition[] = [
  {
    id: 'rare.y1.power-outage',
    stage: 'year-1',
    hostTemplate: toChallengeId('y1.course-project-expo'),
    band: 'UNCOMMON',
    treatment: 'narrative-only',
    requires: { kind: 'flag-set', flag: 'y1.project.context-established' },
    note: {
      title: 'Se cortó la luz',
      text: 'Media hora antes de la expo se corta la luz en el ala del salón. Alguien trae la lámpara del pasillo y el proyecto se muestra igual, con menos brillo y más gente amontonada alrededor de la mesa.',
    },
    salienceRank: 40,
  },
  {
    id: 'rare.y2.missing-player',
    stage: 'year-2',
    hostTemplate: toChallengeId('y2.intercurso-plan'),
    band: 'RARE',
    treatment: 'variant-modifier',
    requires: { kind: 'storylet-seen', storyletId: toStoryletId('y2.intro') },
    note: {
      title: 'Falta alguien',
      text: 'A la mañana del Intercurso avisan que falta uno del curso. El plan que estaba pensado ya no es el que hay que armar: con esta gente y estos turnos, hay que rehacerlo.',
    },
    salienceRank: 60,
  },
  {
    id: 'rare.y3.offline-project',
    stage: 'year-3',
    hostTemplate: toChallengeId('y3.course-project-tech'),
    band: 'RARE',
    treatment: 'variant-modifier',
    requires: { kind: 'storylet-seen', storyletId: toStoryletId('y3.intro') },
    note: {
      title: 'Se cayó internet',
      text: 'La escuela se quedó sin internet justo esta semana. Los recursos son otros y la combinación que servía la semana pasada ya no sirve.',
    },
    salienceRank: 60,
  },
  {
    id: 'rare.y5.five-minutes-before-act',
    stage: 'year-5',
    hostTemplate: toChallengeId('y5.stage-screen'),
    band: 'RARE',
    treatment: 'narrative-only',
    requires: { kind: 'storylet-seen', storyletId: toStoryletId('y5.intro') },
    note: {
      title: 'Cinco minutos antes',
      text: 'Cinco minutos antes del acto, el proyector se apaga solo dos veces seguidas. Alguien lo desenchufa y lo vuelve a enchufar; arranca. La decisión de cómo proyectar sigue siendo la misma, con más gente mirando.',
    },
    salienceRank: 70,
  },
]
