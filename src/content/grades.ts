import {
  ok,
  type ChallengeDefinition,
  type MaterializedChallenge,
  type SolutionQuality,
} from '@/game'

/**
 * La nota de cada situación.
 *
 * Toda situación ordinaria de la carrera pone una nota en el legajo según cómo
 * salió: 10 si fue Óptima, 8 si Resuelta, 6 si Parcial y 4 si Insuficiente.
 * Es la escala de un boletín argentino —el 4 es un aplazo, el 6 es «justo»—,
 * así que quien resuelve todo mal egresa igual (el egreso lo garantiza la
 * progresión, no el Promedio) pero con un promedio que lo dice.
 *
 * Antes sólo la expo de 1.º ponía nota, con su propia escala; una carrera
 * entera terminaba con una nota o con ninguna, y el Promedio no reflejaba
 * ninguna otra situación. La regla pasa a ser de contenido y no de cada
 * Template: una sola tabla, una sola escala.
 *
 * Los Repasos no ponen nota. Cierran lo que el año debía y no borran el
 * resultado original (ADR-024); una nota de Repaso sería una segunda
 * oportunidad de subir el Promedio por haber fallado.
 *
 * Nada de esto toca el FairScore, que no lee el Promedio, ni el action log:
 * la nota es un efecto de carrera derivado de la calidad, y la calidad ya
 * estaba en el estado.
 */
export const GRADE_BY_QUALITY: Readonly<Record<SolutionQuality, number>> = {
  optimal: 10,
  efficient: 8,
  functional: 6,
  invalid: 4,
}

export function gradeFor(quality: SolutionQuality): number {
  return GRADE_BY_QUALITY[quality]
}

const gradedIds = new Set<string>()

/** Si una Template pone nota por esta regla. Para tests de cobertura. */
export function isGraded(templateId: string): boolean {
  return gradedIds.has(templateId)
}

/**
 * Una Template ordinaria con nota por calidad.
 *
 * Envuelve `materialize` y, dentro de cada instancia, `evaluate`: el
 * evaluador de la Template decide calidad, feedback, métricas y sus propios
 * efectos, y esta capa agrega —o reemplaza— la nota. Que sea el último paso es
 * lo que garantiza que las 32 Templates ordinarias usen la misma escala aunque
 * alguna hubiera autorado la suya.
 */
export function graded(definition: ChallengeDefinition): ChallengeDefinition {
  gradedIds.add(String(definition.id))
  return {
    ...definition,
    materialize(ref, context): MaterializedChallenge {
      const instance = definition.materialize(ref, context)
      return {
        ...instance,
        evaluate(answer, revealed) {
          const result = instance.evaluate(answer, revealed)
          if (!result.ok) return result
          return ok({
            ...result.value,
            careerEffects: {
              ...result.value.careerEffects,
              grade: gradeFor(result.value.quality),
            },
          })
        },
      }
    },
  }
}
