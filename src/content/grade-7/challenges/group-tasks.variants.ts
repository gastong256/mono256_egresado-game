/**
 * Variantes del trabajo grupal.
 *
 * **Autorada, y a propósito.** Acá los parámetros *son* el contenido: Lucas,
 * Mateo y Vos tienen nombre, horas y afinidades porque el desafío trata de
 * repartir trabajo entre personas concretas. Generar rosters produciría gente
 * sin nombre o nombres sacados de una bolsa, que es escribir contenido con un
 * generador en vez de escribirlo.
 *
 * El espacio útil además es chico: con tres personas y tres tareas hay pocas
 * configuraciones que sean a la vez resolubles y no obvias, y encontrarlas es
 * trabajo de autoría.
 *
 * Autorada **no** quiere decir confiable. Estas variantes pasan por el mismo
 * pipeline que las generadas —validación, huella, deduplicación, catálogo— y su
 * oráculo es una búsqueda exhaustiva sobre todas las asignaciones posibles.
 */

import {
  paramsValidator,
  variantDiagnostic,
  type VariantSourceSpec,
} from '@/game'

export interface GroupMember {
  readonly id: string
  readonly name: string
  readonly hoursFree: number
  /** Afinidad por tarea, de 1 a 3. */
  readonly skill: Readonly<Record<string, number>>
}

export interface GroupParams {
  readonly members: readonly GroupMember[]
}

/** Las tareas del proyecto. Fijas: son la consigna, no un parámetro. */
export const GROUP_TASK_IDS = [
  'investigacion',
  'diseno',
  'presentacion',
  'maqueta',
] as const

/** Horas que pide cada tarea. Espejo de la consigna del desafío. */
export const TASK_HOURS: Readonly<Record<string, number>> = {
  investigacion: 5,
  diseno: 3,
  presentacion: 2,
  maqueta: 6,
}

/**
 * Mejor afinidad total alcanzable, por búsqueda exhaustiva.
 *
 * El desafío reparte **una tarea por persona**, así que el oráculo recorre las
 * permutaciones de integrantes sobre tareas y devuelve la afinidad del mejor
 * reparto en el que a nadie le piden más horas de las que tiene. Devuelve `-1`
 * si ninguno es factible. No comparte código con el evaluador del desafío.
 */
export function bestFeasibleAffinity(params: GroupParams): number {
  const tasks = [...GROUP_TASK_IDS]
  const members = params.members
  let best = -1

  const walk = (
    index: number,
    taken: readonly boolean[],
    affinity: number,
  ): void => {
    const task = tasks[index]
    if (task === undefined) {
      best = Math.max(best, affinity)
      return
    }

    for (const [position, member] of members.entries()) {
      if (taken[position] === true) continue
      if (member.hoursFree < (TASK_HOURS[task] ?? 0)) continue
      const next = [...taken]
      next[position] = true
      walk(index + 1, next, affinity + (member.skill[task] ?? 0))
    }
  }

  walk(
    0,
    members.map(() => false),
    0,
  )
  return best
}

const validateGroup = paramsValidator<GroupParams>((params, ref) => {
  const diagnostics = []

  if (params.members.length === 0) {
    return [variantDiagnostic('no-valid-solution', ref, 'el grupo está vacío')]
  }

  if (
    new Set(params.members.map((member) => member.id)).size !==
    params.members.length
  ) {
    diagnostics.push(
      variantDiagnostic(
        'duplicate-option',
        ref,
        'dos integrantes comparten id',
      ),
    )
  }

  const best = bestFeasibleAffinity(params)
  if (best < 0) {
    diagnostics.push(
      variantDiagnostic(
        'no-valid-solution',
        ref,
        'ningún reparto cubre las cuatro tareas dentro de las horas de cada uno',
      ),
    )
  }

  const skills = params.members.flatMap((member) =>
    GROUP_TASK_IDS.map((task) => member.skill[task] ?? 0),
  )
  if (new Set(skills).size === 1) {
    diagnostics.push(
      variantDiagnostic(
        'trivial-decision',
        ref,
        'todos tienen la misma afinidad en todo, así que repartir da igual',
      ),
    )
  }
  if (skills.some((value) => value < 1 || value > 3)) {
    diagnostics.push(
      variantDiagnostic(
        'unreasonable-value',
        ref,
        'una afinidad está fuera de la escala de 1 a 3',
      ),
    )
  }
  for (const member of params.members) {
    if (member.hoursFree < 1 || member.hoursFree > 12) {
      diagnostics.push(
        variantDiagnostic(
          'unreasonable-value',
          ref,
          `${member.name} declara ${String(member.hoursFree)} horas libres`,
        ),
      )
    }
  }

  return diagnostics
})

const AUTHORED: readonly (GroupParams & { readonly id: string })[] = [
  {
    id: 'equipo-a',
    members: [
      {
        id: 'lucas',
        name: 'Lucas',
        hoursFree: 6,
        skill: { investigacion: 1, diseno: 1, presentacion: 1, maqueta: 3 },
      },
      {
        id: 'sofia',
        name: 'Sofía',
        hoursFree: 5,
        skill: { investigacion: 3, diseno: 1, presentacion: 2, maqueta: 1 },
      },
      {
        id: 'mateo',
        name: 'Mateo',
        hoursFree: 4,
        skill: { investigacion: 2, diseno: 3, presentacion: 1, maqueta: 1 },
      },
      {
        id: 'vos',
        name: 'Vos',
        hoursFree: 3,
        skill: { investigacion: 1, diseno: 2, presentacion: 3, maqueta: 2 },
      },
    ],
  },
  {
    id: 'equipo-b',
    members: [
      {
        id: 'lucas',
        name: 'Lucas',
        hoursFree: 7,
        skill: { investigacion: 2, diseno: 1, presentacion: 1, maqueta: 3 },
      },
      {
        id: 'sofia',
        name: 'Sofía',
        hoursFree: 6,
        skill: { investigacion: 3, diseno: 2, presentacion: 1, maqueta: 1 },
      },
      {
        id: 'mateo',
        name: 'Mateo',
        hoursFree: 3,
        skill: { investigacion: 1, diseno: 3, presentacion: 2, maqueta: 1 },
      },
      {
        id: 'vos',
        name: 'Vos',
        hoursFree: 2,
        skill: { investigacion: 1, diseno: 1, presentacion: 3, maqueta: 1 },
      },
    ],
  },
]

export const groupTasksVariants: VariantSourceSpec<GroupParams> = {
  authored: AUTHORED,
  validators: [validateGroup],
  canonical: (params) => ({
    members: params.members.map((member) => ({
      id: member.id,
      hoursFree: member.hoursFree,
      skill: member.skill,
    })),
  }),
}
