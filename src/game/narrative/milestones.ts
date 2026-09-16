/**
 * Hitos de carrera.
 *
 * Todos los que este módulo contrata son **display-only**: reconocen algo que
 * pasó y no valen Prestige. Eso no es una limitación de la implementación sino
 * la regla de producto: matemática perfecta, usar o cerrar un Repaso, arrastrar
 * una previa, que apareciera un evento raro, terminar la carrera y la identidad
 * de Estilo pueden ser badges y nada más, porque su evidencia ya la cobró otra
 * dimensión o no es una acción independiente.
 *
 * El tipo lo dice en la firma: `prestigeEligible` es literal `false`. Un hito
 * que quisiera valer Prestige no se declara acá, se declara como oportunidad de
 * Prestige con su evidencia y su razón de independencia.
 */
import type { RunState } from '../runs/state'

export interface MilestoneDefinition {
  readonly id: string
  readonly label: string
  readonly detail: string
  /** Literal: estos hitos nunca son competitivos. */
  readonly prestigeEligible: false
  readonly earned: (state: RunState) => boolean
}

export interface Milestone {
  readonly id: string
  readonly label: string
  readonly detail: string
}

export function milestoneIssues(
  definitions: readonly MilestoneDefinition[],
): readonly string[] {
  const issues: string[] = []
  const ids = new Set<string>()
  for (const entry of definitions) {
    if (ids.has(entry.id)) issues.push(`duplicate milestone: ${entry.id}`)
    ids.add(entry.id)
    if (entry.label.trim() === '' || entry.detail.trim() === '')
      issues.push(`${entry.id} has nothing to show`)
  }
  return issues
}

/** Los hitos que una carrera desbloqueó, en orden canónico por id. */
export function earnedMilestones(
  state: RunState,
  definitions: readonly MilestoneDefinition[],
): readonly Milestone[] {
  return [...definitions]
    .sort((left, right) =>
      left.id < right.id ? -1 : left.id > right.id ? 1 : 0,
    )
    .filter((entry) => entry.earned(state))
    .map((entry) => ({
      id: entry.id,
      label: entry.label,
      detail: entry.detail,
    }))
}
