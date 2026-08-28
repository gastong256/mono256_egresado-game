/**
 * Scenario families of the 7.º grade content set.
 *
 * A family is the situation the player recognises — the bus, the mural, the
 * stand — and it groups every cognitive structure that situation can host. It
 * says nothing about which school year uses it: the same family can appear in
 * several years, and each template inside it declares its own eligibility.
 *
 * These six exist because the first playable slice authored six situations.
 * **This is not the final scenario inventory of Egresado**, and the year each
 * one currently belongs to is a consequence of that first slice, not a decision.
 * Both remain open; see `docs/07-reference/open-questions.md`.
 */

import { toScenarioFamilyId, type ScenarioFamilyDefinition } from '@/game'

export const BUS_FAMILY = toScenarioFamilyId('bus')
export const MURAL_FAMILY = toScenarioFamilyId('mural')
export const NOTEBOOK_FAMILY = toScenarioFamilyId('notebook')
export const GROUP_PROJECT_FAMILY = toScenarioFamilyId('group-project')
export const SCHOOL_FAIR_FAMILY = toScenarioFamilyId('school-fair')
export const MAY_25_FAMILY = toScenarioFamilyId('may-25')

export const grade7Families: readonly ScenarioFamilyDefinition[] = [
  {
    id: BUS_FAMILY,
    labelKey: 'family.bus',
    summary: 'Llegar a horario cuando el transporte no coopera.',
  },
  {
    id: MURAL_FAMILY,
    labelKey: 'family.mural',
    summary: 'Cubrir una superficie con materiales que se venden por envase.',
  },
  {
    id: NOTEBOOK_FAMILY,
    labelKey: 'family.notebook',
    summary: 'Comparar ofertas reales con un presupuesto que no da para todo.',
  },
  {
    id: GROUP_PROJECT_FAMILY,
    labelKey: 'family.group-project',
    summary:
      'Repartir un trabajo entre personas con tiempos y fuerzas distintas.',
  },
  {
    id: SCHOOL_FAIR_FAMILY,
    labelKey: 'family.school-fair',
    summary: 'Armar un stand con packs, requisitos mínimos y plata contada.',
  },
  {
    id: MAY_25_FAMILY,
    labelKey: 'family.may-25',
    summary: 'El acto: matemática en público, donde lo memorable pesa.',
  },
]
