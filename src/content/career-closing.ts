/**
 * El cierre de la carrera: hitos de display, Prestige ofrecido y escenas
 * icónicas.
 *
 * ## Prestige: el techo ofrecido de esta edición es cero, y está escrito
 *
 * El modelo admite 100 puntos en tres tracks. Esta edición **no ofrece
 * ninguno**, y no es una omisión: toda evidencia que hoy existe en el contenido
 * ya la cobró otra dimensión —la matemática paga Math, la postura pública paga
 * Aura, el reparto paga Equipo— o está excluida por contrato: aparecer en un
 * evento raro, necesitar o cerrar un Repaso, arrastrar una previa, terminar la
 * carrera y la identidad de Estilo sólo pueden ser badges.
 *
 * Autorar una oportunidad competitiva pediría una acción **nueva** del jugador
 * que hoy no existe, y eso es diseño de producto con consecuencias
 * competitivas, no autoría de contenido. La regla canónica para este caso es
 * explícita: si una oportunidad no existe en la edición, no se inventan puntos
 * ni se normaliza para llegar a 100; el techo ofrecido queda explícito y es el
 * mismo para todos. Eso es exactamente lo que hace esta lista vacía.
 */
import {
  type MilestoneDefinition,
  type PrestigeOpportunity,
  type RunState,
} from '@/game'

/** Ninguna oportunidad de Prestige en esta edición. El techo ofrecido es 0. */
export const careerPrestigeOpportunities: readonly PrestigeOpportunity[] = []

const playedAll = (state: RunState): boolean =>
  new Set(state.history.map((entry) => entry.stage)).size >= 6

export const careerMilestones: readonly MilestoneDefinition[] = [
  {
    id: 'milestone.graduated',
    label: 'Egresado',
    detail: 'Terminaste los seis años.',
    prestigeEligible: false,
    earned: (state) => state.completion?.graduated === true && playedAll(state),
  },
  {
    id: 'milestone.perfect-year',
    label: 'Un año redondo',
    detail: 'Un año entero resuelto de la mejor manera posible.',
    prestigeEligible: false,
    earned: (state) => {
      const byStage = new Map<string, boolean>()
      for (const entry of state.history) {
        if (entry.challengeId === undefined || entry.recovery === true) continue
        const previous = byStage.get(entry.stage)
        byStage.set(
          entry.stage,
          (previous ?? true) && entry.quality === 'optimal',
        )
      }
      return [...byStage.values()].some(Boolean)
    },
  },
  {
    id: 'milestone.came-back',
    label: 'Volviste',
    detail: 'Un año te dejó debiendo algo y lo cerraste igual.',
    prestigeEligible: false,
    earned: (state) => state.progression.history.length > 0,
  },
  {
    id: 'milestone.saw-something-rare',
    label: 'Estuviste ahí',
    detail: 'Te tocó algo que no le pasa a todas las carreras.',
    prestigeEligible: false,
    earned: (state) => state.rare.length > 0,
  },
  {
    id: 'milestone.style-identity',
    label: 'Una forma propia',
    detail: 'Tu manera de resolver quedó marcada.',
    prestigeEligible: false,
    earned: (state) => state.career.estiloEvidence >= 6,
  },
]

/**
 * Las escenas que el año quiere que se recuerden.
 *
 * Son los eventos icónicos de la línea narrativa: el acto de 7.º, el Día del
 * Estudiante, el Intercurso, el Día del Amigo, el evento escolar y el egreso.
 * Que una escena sea icónica no la hace puntuable ni obligatoria: sólo pesa
 * cuando el cierre elige qué recordar.
 */
export const iconicStorylets: readonly string[] = [
  'g7.may-25',
  'y1.scene.student-day-challenge-wheel',
  'y2.scene.intercurso-plan',
  'y3.scene.friend-day',
  'y4.scene.school-event-flow',
  'y5.scene.final-trip-or-event',
]
