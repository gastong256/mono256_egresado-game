import {
  createContentCatalog,
  toScenarioFamilyId,
  type ChallengeDefinition,
  type CompositionMetadata,
  type ScenarioFamilyDefinition,
} from '@/game'
import { grade7Challenges, grade7Families } from '@/content/grade-7'
import { studentDayWheel } from './challenges/student-day-challenge-wheel'
import { mobileData } from './challenges/mobile-data'
import { courseProjectExpo } from './challenges/course-project-expo'
import {
  rehearsalSchedule,
  scheduleReview,
} from './challenges/rehearsal-schedule'
import { classroomLayout, scaleFitReview } from './challenges/classroom-layout'

export const grade1Challenges: readonly ChallengeDefinition[] = [
  mobileData,
  courseProjectExpo,
  classroomLayout,
  rehearsalSchedule,
  studentDayWheel,
  scheduleReview,
  scaleFitReview,
]
export const grade1Families: readonly ScenarioFamilyDefinition[] = [
  {
    id: toScenarioFamilyId('mobile-data'),
    labelKey: 'family.mobile-data',
    summary: 'Organizar datos para actividades necesarias y descanso.',
  },
  {
    id: toScenarioFamilyId('course-project'),
    labelKey: 'family.course-project',
    summary: 'Construir el Proyecto del Curso y su forma de trabajar.',
  },
  {
    id: toScenarioFamilyId('classroom-space'),
    labelKey: 'family.classroom-space',
    summary: 'Hacer que los objetos entren y el espacio se pueda recorrer.',
  },
  {
    id: toScenarioFamilyId('rehearsal-planning'),
    labelKey: 'family.rehearsal-planning',
    summary: 'Encadenar compromisos con traslados y ventanas.',
  },
  {
    id: toScenarioFamilyId('student-day'),
    labelKey: 'family.student-day',
    summary: 'Armar actividades para el Día del Estudiante.',
  },
]
/** Overlay belongs to the new content set, never mutates Grade-7 definitions or traits. */
const grade7Axes: Readonly<Record<string, CompositionMetadata>> = {
  'g7.bus-timing': {
    primaryReasoningFamily: 'TEMPORAL',
    interactionEngine: 'timeline-schedule',
    pacingClass: 'QUICK',
  },
  'g7.bus-latest-departure': {
    primaryReasoningFamily: 'TEMPORAL',
    interactionEngine: 'timeline-schedule',
    pacingClass: 'QUICK',
  },
  'g7.bus-travel-review': {
    primaryReasoningFamily: 'TEMPORAL',
    interactionEngine: 'timeline-schedule',
    pacingClass: 'QUICK',
  },
  'g7.may-25-act': {
    primaryReasoningFamily: 'LOGIC_CLASSIFICATION',
    interactionEngine: 'grid-select-classify',
    pacingClass: 'MEDIUM',
  },
  'g7.mural-paint': {
    primaryReasoningFamily: 'SPATIAL',
    interactionEngine: 'spatial-graph',
    pacingClass: 'MEDIUM',
  },
  'g7.notebook-offer': {
    primaryReasoningFamily: 'ECONOMIC_PROPORTIONAL',
    interactionEngine: 'choice-compare',
    pacingClass: 'QUICK',
  },
  'g7.group-tasks': {
    primaryReasoningFamily: 'ALLOCATION',
    interactionEngine: 'allocate-constrain',
    pacingClass: 'DEEP',
  },
  'g7.stand-supplies': {
    primaryReasoningFamily: 'ECONOMIC_PROPORTIONAL',
    interactionEngine: 'allocate-constrain',
    pacingClass: 'MEDIUM',
  },
}
export function createGrade1Catalog() {
  const previous = grade7Challenges.map((template) => {
    const composition = grade7Axes[template.id]
    if (composition === undefined)
      throw new Error(`missing Grade-7 composition axis: ${template.id}`)
    return { ...template, composition }
  })
  return createContentCatalog(
    [...grade7Families, ...grade1Families],
    [...previous, ...grade1Challenges],
  )
}
