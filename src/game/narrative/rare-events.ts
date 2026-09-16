/**
 * Eventos raros.
 *
 * Un evento raro cambia la historia de una carrera sin cambiar sus
 * oportunidades: no agrega un beat, no mueve el techo de FairScore, no decide
 * si alguien egresa y no otorga Prestige por aparecer. Lo que hace es que dos
 * runs con el mismo plan se cuenten distinto.
 *
 * La selección es determinista y verificable, que es la regla de producto:
 *
 * ```text
 * misma seed + mismas políticas + mismo estado = misma presencia rara
 * ```
 *
 * Primero la elegibilidad —condiciones sobre carrera, historial y flags—, y
 * recién después el sorteo, en un substream propio direccionado por etapa,
 * índice de evento e identidad del evento. Así agregar un evento raro no
 * desplaza el resultado de los que ya existían, y el presupuesto de la carrera
 * se aplica en orden canónico.
 */
import type { ChallengeId } from '../core/branded'
import type { StageId } from '../progression/stages'
import type { StoryletCondition } from './conditions'
import { evaluateCondition, type NarrativeContext } from './conditions'
import { createRng } from '../random/rng'
import type { RunSeed } from '../core/branded'

/** Bandas de rareza. La probabilidad de cada una la fija la política. */
export const RARE_BANDS = ['UNCOMMON', 'RARE', 'VERY_RARE'] as const
export type RareBand = (typeof RARE_BANDS)[number]

/**
 * Qué hace un evento raro cuando aparece.
 *
 * `narrative-only` cambia lo que se cuenta y nada más. `variant-modifier`
 * cambia **qué variante aprobada** de la misma Template se juega: el beat, la
 * plantilla, su ruta de Repaso y su techo competitivo quedan donde estaban, y
 * lo que cambia es la situación concreta. No hay un tratamiento que agregue
 * beats ni oportunidades, porque ninguno sería legal.
 */
export const RARE_TREATMENTS = ['narrative-only', 'variant-modifier'] as const
export type RareTreatment = (typeof RARE_TREATMENTS)[number]

export interface RareEventDefinition {
  readonly id: string
  readonly stage: StageId
  /** La Template en la que puede aparecer. Nunca crea un beat propio. */
  readonly hostTemplate: ChallengeId
  readonly band: RareBand
  readonly treatment: RareTreatment
  /** Elegibilidad sobre carrera, historial y flags. Se evalúa antes del sorteo. */
  readonly requires: StoryletCondition
  /** Lo que se cuenta cuando aparece. Presentación, nunca matemática. */
  readonly note: { readonly title: string; readonly text: string }
  /** Prioridad editorial para desempatar saliencia; no afecta la selección. */
  readonly salienceRank: number
}

export interface RarePolicy {
  readonly id: string
  readonly version: string
  /** False hasta que un Teacher Gate apruebe la calibración. */
  readonly official: boolean
  /** Probabilidad por banda, en milésimas: 150 = 15 %. */
  readonly chancePerMille: Readonly<Record<RareBand, number>>
  /** Techo de la carrera. Se aplica en orden canónico, nunca por sorteo. */
  readonly budget: {
    /** Eventos raros en toda la carrera. */
    readonly events: number
    /** Eventos que modifican un beat puntuable. */
    readonly scoring: number
    readonly veryRare: number
  }
}

/** Lo que quedó registrado de un evento raro que apareció. */
export interface RareOccurrence {
  readonly id: string
  readonly stage: StageId
  readonly eventIndex: number
  readonly band: RareBand
  readonly treatment: RareTreatment
}

/**
 * Calibración v1 recomendada.
 *
 * Los números son los del diseño de producto: 15 / 7,5 / 2 por ciento, con un
 * techo de dos eventos por carrera, uno solo que toque un beat puntuable y uno
 * solo muy raro. Versionada y `official: false`: es calibración, no una
 * constante del motor.
 */
export const candidateRarePolicy: RarePolicy = {
  id: 'rare-dev-1',
  version: '1.0.0-candidate',
  official: false,
  chancePerMille: { UNCOMMON: 150, RARE: 75, VERY_RARE: 20 },
  budget: { events: 2, scoring: 1, veryRare: 1 },
}

export function rarePolicyIssues(policy: RarePolicy): readonly string[] {
  const issues: string[] = []
  if (policy.id.trim() === '' || policy.version.trim() === '')
    issues.push('rare policy needs identity and version')
  for (const band of RARE_BANDS) {
    const chance = policy.chancePerMille[band]
    if (!Number.isSafeInteger(chance) || chance < 0 || chance > 1000)
      issues.push(`invalid chance for ${band}`)
  }
  const budgets = [
    policy.budget.events,
    policy.budget.scoring,
    policy.budget.veryRare,
  ]
  if (budgets.some((value) => !Number.isSafeInteger(value) || value < 0))
    issues.push('invalid rare budget')
  if (policy.budget.scoring > policy.budget.events)
    issues.push('scoring budget exceeds the career budget')
  return issues
}

export function rareEventIssues(event: RareEventDefinition): readonly string[] {
  const issues: string[] = []
  if (!/^rare\.[a-z0-9][a-z0-9.-]{0,63}$/u.test(event.id))
    issues.push(`invalid rare event id: ${event.id}`)
  if (!RARE_BANDS.includes(event.band)) issues.push('unknown rare band')
  if (!RARE_TREATMENTS.includes(event.treatment))
    issues.push('unknown rare treatment')
  if (event.note.title.trim() === '' || event.note.text.trim() === '')
    issues.push('a rare event has to have something to tell')
  if (!Number.isSafeInteger(event.salienceRank) || event.salienceRank < 0)
    issues.push('invalid salience rank')
  return issues
}

/** Lo que el presupuesto de la carrera ya consumió. */
export function rareBudgetLeft(
  policy: RarePolicy,
  occurrences: readonly RareOccurrence[],
): { events: number; scoring: number; veryRare: number } {
  return {
    events: policy.budget.events - occurrences.length,
    scoring:
      policy.budget.scoring -
      occurrences.filter((entry) => entry.treatment === 'variant-modifier')
        .length,
    veryRare:
      policy.budget.veryRare -
      occurrences.filter((entry) => entry.band === 'VERY_RARE').length,
  }
}

/**
 * El evento raro que aparece en este beat, si alguno.
 *
 * Orden canónico: los candidatos se ordenan por id, se descartan los que no son
 * elegibles o no entran en el presupuesto, y cada uno sortea en su propia
 * dirección. El primero que sale es el que aparece; a lo sumo uno por beat.
 */
export function selectRareEvent(input: {
  readonly seed: RunSeed
  readonly stage: StageId
  readonly eventIndex: number
  readonly templateId: ChallengeId
  readonly events: readonly RareEventDefinition[]
  readonly policy: RarePolicy
  readonly occurred: readonly RareOccurrence[]
  readonly context: NarrativeContext
}): RareOccurrence | undefined {
  const left = rareBudgetLeft(input.policy, input.occurred)
  if (left.events <= 0) return undefined

  const candidates = [...input.events]
    .filter(
      (event) =>
        event.stage === input.stage &&
        event.hostTemplate === input.templateId &&
        !input.occurred.some((entry) => entry.id === event.id),
    )
    .sort((left, right) =>
      left.id < right.id ? -1 : left.id > right.id ? 1 : 0,
    )

  for (const event of candidates) {
    if (event.treatment === 'variant-modifier' && left.scoring <= 0) continue
    if (event.band === 'VERY_RARE' && left.veryRare <= 0) continue
    if (!evaluateCondition(event.requires, input.context)) continue
    const rng = createRng(input.seed, [
      'rare-events',
      input.stage,
      input.eventIndex,
      event.id,
    ])
    if (!rng.chance(input.policy.chancePerMille[event.band], 1000)) continue
    return {
      id: event.id,
      stage: input.stage,
      eventIndex: input.eventIndex,
      band: event.band,
      treatment: event.treatment,
    }
  }
  return undefined
}
