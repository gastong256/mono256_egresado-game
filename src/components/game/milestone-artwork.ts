import type { StageId } from '@/game'

/**
 * Arte de interludios, separado de las escenas de desafío. Sólo presentación:
 * no depende de puntajes ni añade pasos, precargas o datos al estado de la run.
 * Cada año conserva su lámina al abrir y al cerrar; el birrete es del egreso.
 */
export const MILESTONE_ARTWORK: Readonly<Record<StageId, string>> = {
  'grade-7': '/assets/milestones/school.webp',
  'year-1': '/assets/milestones/books.webp',
  'year-2': '/assets/milestones/geometry.webp',
  'year-3': '/assets/milestones/planner.webp',
  'year-4': '/assets/milestones/project.webp',
  'year-5': '/assets/milestones/memories.webp',
  graduation: '/assets/milestones/graduation.webp',
}
