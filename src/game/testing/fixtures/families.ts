/**
 * Scenario families of the development content set.
 *
 * Fixtures exist to exercise the engine, so these families are chosen to cover
 * the shapes the content model has to support rather than to describe a real
 * school year. `school-data` is the interesting one: it holds two templates with
 * genuinely different cognitive structures — comparing a chart and judging a
 * sample — which is what a family is for.
 */

import { toScenarioFamilyId } from '../../core/branded'
import type { ScenarioFamilyDefinition } from '../../challenges/content-model'

export const DEV_BUS_FAMILY = toScenarioFamilyId('bus')
export const DEV_MURAL_FAMILY = toScenarioFamilyId('mural')
export const DEV_NOTEBOOK_FAMILY = toScenarioFamilyId('notebook')
export const DEV_STUDY_FAMILY = toScenarioFamilyId('study')
export const DEV_GROUP_PROJECT_FAMILY = toScenarioFamilyId('group-project')
export const DEV_TRIP_FAMILY = toScenarioFamilyId('trip')
export const DEV_SCHOOL_DATA_FAMILY = toScenarioFamilyId('school-data')

export const developmentFamilies: readonly ScenarioFamilyDefinition[] = [
  { id: DEV_BUS_FAMILY, labelKey: 'family.bus', summary: 'Llegar a horario.' },
  {
    id: DEV_MURAL_FAMILY,
    labelKey: 'family.mural',
    summary: 'Cubrir una superficie comprando por envase.',
  },
  {
    id: DEV_NOTEBOOK_FAMILY,
    labelKey: 'family.notebook',
    summary: 'Comparar ofertas con plata contada.',
  },
  {
    id: DEV_STUDY_FAMILY,
    labelKey: 'family.study',
    summary: 'Repartir el tiempo de estudio que hay.',
  },
  {
    id: DEV_GROUP_PROJECT_FAMILY,
    labelKey: 'family.group-project',
    summary: 'Repartir un trabajo entre personas distintas.',
  },
  {
    id: DEV_TRIP_FAMILY,
    labelKey: 'family.trip',
    summary: 'Financiar y planificar una salida.',
  },
  {
    id: DEV_SCHOOL_DATA_FAMILY,
    labelKey: 'family.school-data',
    summary: 'Leer los datos que produce la escuela y decidir con ellos.',
  },
]
