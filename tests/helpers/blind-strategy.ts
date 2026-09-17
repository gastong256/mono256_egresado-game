/**
 * Auditoría de estrategia ciega sobre un catálogo aprobado.
 *
 * Mide lo que un jugador obtiene **sin mirar los números**: responder al azar
 * (R), repetir siempre la misma respuesta completa (K) y cuántas variantes
 * comparten la misma respuesta óptima (S). La especificación de remediación
 * matemática fija techos por Template sobre estas tres métricas; este módulo
 * sólo las calcula, con el evaluador real de cada Template y nunca con uno
 * paralelo.
 *
 * Es una medición, no un oráculo: el re-audit independiente no debe apoyarse
 * sólo en ella.
 */
import type {
  ApprovedVariantCatalog,
  ChallengeDefinition,
  EngineDependencies,
  InteractionAnswer,
  SolutionQuality,
} from '@/game'
import { materializeVariant } from '@/game/testing'

/** La escala del contrato: la escalera 100/75/40/10. */
export const QUALITY_SCORE: Readonly<Record<SolutionQuality, number>> = {
  optimal: 100,
  efficient: 75,
  functional: 40,
  invalid: 10,
}

/** Más respuestas que esto por variante no se enumeran. */
export const MAX_CLASSIFICATION_ANSWERS = 50_000
/** Un rango numérico más ancho que esto no se enumera. */
export const MAX_NUMERIC_VALUES = 5_000

const TIERS: readonly SolutionQuality[] = [
  'optimal',
  'efficient',
  'functional',
  'invalid',
]

interface CandidateAnswer {
  /** La misma respuesta en todas las variantes, por identificador. */
  readonly byId: string
  /** La misma respuesta por posición, para cuando los ids cambian. */
  readonly byPosition: string
  readonly answer: InteractionAnswer
  /** Otras variantes de la respuesta que sólo cambian la postura pública. */
  readonly stanceVariants: readonly InteractionAnswer[]
}

export interface BlindStrategyRow {
  readonly templateId: string
  readonly kind: string
  readonly variants: number
  readonly enumerable: boolean
  readonly reason?: string
  /** Si K y S se calcularon por posición porque los ids cambian. */
  readonly byPosition: boolean
  readonly R: number
  readonly K: number
  readonly kAnswer: string
  readonly S: number
  readonly sAnswer: string
  /** Variantes en las que cada nivel es alcanzable. */
  readonly reachable: Readonly<Record<SolutionQuality, number>>
  /** Nivel de cada respuesta constante en cada variante, en orden de catálogo. */
  readonly constant: ReadonlyMap<string, readonly SolutionQuality[]>
  /** Variantes donde alguna respuesta cambió de nivel sólo por la postura. */
  readonly stanceLeaks: number
}

function answersOf(
  view: ReturnType<ReturnType<ChallengeDefinition['materialize']>['present']>,
): { readonly answers: readonly CandidateAnswer[]; readonly reason?: string } {
  if (view.kind === 'decision-card' || view.kind === 'timeline') {
    return {
      answers: view.options.map((option, position) => ({
        byId: option.id,
        byPosition: `#${String(position)}`,
        answer: { kind: view.kind, optionId: option.id } as InteractionAnswer,
        stanceVariants: [],
      })),
    }
  }
  if (view.kind === 'classification') {
    const labels = view.labels.map((label) => label.id)
    const total = labels.length ** view.statements.length
    if (total > MAX_CLASSIFICATION_ANSWERS)
      return { answers: [], reason: `${String(total)} clasificaciones` }
    const stances = view.stance?.options.map((option) => option.id) ?? []
    const answers: CandidateAnswer[] = []
    for (let mask = 0; mask < total; mask++) {
      let rest = mask
      const entries = view.statements.map((statement) => {
        const labelId = labels[rest % labels.length] ?? ''
        rest = Math.floor(rest / labels.length)
        return { statementId: statement.id, labelId }
      })
      const withStance = (stance: string | undefined): InteractionAnswer => ({
        kind: 'classification',
        entries,
        ...(stance === undefined ? {} : { stance }),
      })
      answers.push({
        byId: entries.map((e) => `${e.statementId}=${e.labelId}`).join(','),
        byPosition: entries
          .map((e, i) => `#${String(i)}=${e.labelId}`)
          .join(','),
        answer: withStance(stances[0]),
        stanceVariants: stances.slice(1).map(withStance),
      })
    }
    return { answers }
  }
  if (view.kind === 'numeric-input') {
    const min = Number(view.min)
    const max = Number(view.max)
    const step = Number(view.step)
    if (!Number.isInteger(min) || !Number.isInteger(max) || step !== 1)
      return { answers: [], reason: 'rango numérico no entero' }
    if (max - min + 1 > MAX_NUMERIC_VALUES)
      return {
        answers: [],
        reason: `rango de ${String(max - min + 1)} valores`,
      }
    return {
      answers: Array.from({ length: max - min + 1 }, (_, i) => {
        const value = String(min + i)
        return {
          byId: value,
          byPosition: value,
          answer: { kind: 'numeric-input', value },
          stanceVariants: [],
        }
      }),
    }
  }
  return { answers: [], reason: `motor ${view.kind} no enumerable` }
}

/**
 * R, K y S de cada Template del catálogo cuyo espacio de respuestas es finito.
 *
 * Las variantes se recorren en el orden del catálogo y las respuestas en el
 * orden de presentación: la salida es determinista.
 */
export function auditBlindStrategies(
  dependencies: EngineDependencies,
  catalog: ApprovedVariantCatalog,
  only?: readonly string[],
): readonly BlindStrategyRow[] {
  const byTemplate = new Map<string, string[]>()
  for (const entry of catalog.entries) {
    const list = byTemplate.get(entry.templateId) ?? []
    list.push(entry.variantId)
    byTemplate.set(entry.templateId, list)
  }

  const rows: BlindStrategyRow[] = []
  for (const [templateId, variantIds] of byTemplate) {
    if (only !== undefined && !only.includes(templateId)) continue
    const template = dependencies.catalog.template(templateId as never)
    if (template === undefined) continue

    const byId = new Map<string, SolutionQuality[]>()
    const byPosition = new Map<string, SolutionQuality[]>()
    const reachable: Record<SolutionQuality, number> = {
      optimal: 0,
      efficient: 0,
      functional: 0,
      invalid: 0,
    }
    let kind = ''
    let reason: string | undefined
    let randomTotal = 0
    let idSignature: string | undefined
    let idsStable = true
    let stanceLeaks = 0

    for (const variantId of variantIds) {
      const instance = materializeVariant(template, {
        variantId: variantId as never,
        seed: 'blind-strategy-audit',
      })
      const view = instance.present([])
      kind = view.kind
      const { answers, reason: skipped } = answersOf(view)
      if (skipped !== undefined) {
        reason = skipped
        break
      }
      const signature = answers.map((a) => a.byId).join('|')
      if (idSignature === undefined) idSignature = signature
      else if (idSignature !== signature) idsStable = false

      const seen = new Set<SolutionQuality>()
      let sum = 0
      let leaked = false
      for (const candidate of answers) {
        const result = instance.evaluate(candidate.answer, [])
        if (!result.ok)
          throw new Error(
            `${templateId}/${variantId}: respuesta enumerada rechazada (${result.error.kind})`,
          )
        const quality = result.value.quality
        for (const other of candidate.stanceVariants) {
          const again = instance.evaluate(other, [])
          if (!again.ok || again.value.quality !== quality) leaked = true
        }
        seen.add(quality)
        sum += QUALITY_SCORE[quality]
        for (const [map, key] of [
          [byId, candidate.byId],
          [byPosition, candidate.byPosition],
        ] as const) {
          const list = map.get(key) ?? []
          list.push(quality)
          map.set(key, list)
        }
      }
      if (leaked) stanceLeaks += 1
      randomTotal += sum / answers.length
      for (const tier of seen) reachable[tier] += 1
    }

    const n = variantIds.length
    if (reason !== undefined) {
      rows.push({
        templateId,
        kind,
        variants: n,
        enumerable: false,
        reason,
        byPosition: false,
        R: Number.NaN,
        K: Number.NaN,
        kAnswer: '',
        S: Number.NaN,
        sAnswer: '',
        reachable,
        constant: new Map(),
        stanceLeaks: 0,
      })
      continue
    }

    const source = idsStable ? byId : byPosition
    const constant = new Map(
      [...source].filter(([, qualities]) => qualities.length === n),
    )
    let K = -1
    let kAnswer = ''
    let S = -1
    let sAnswer = ''
    for (const [key, qualities] of constant) {
      const mean =
        qualities.reduce((total, q) => total + QUALITY_SCORE[q], 0) / n
      if (mean > K) {
        K = mean
        kAnswer = key
      }
      const share = qualities.filter((q) => q === 'optimal').length / n
      if (share > S) {
        S = share
        sAnswer = key
      }
    }
    rows.push({
      templateId,
      kind,
      variants: n,
      enumerable: true,
      byPosition: !idsStable,
      R: randomTotal / n,
      K,
      kAnswer,
      S,
      sAnswer,
      reachable,
      constant,
      stanceLeaks,
    })
  }
  return rows
}

const one = (value: number) => (Number.isNaN(value) ? '—' : value.toFixed(1))
const percent = (value: number) =>
  Number.isNaN(value) ? '—' : `${(value * 100).toFixed(1)} %`

/** Niveles alcanzables, como «o 25 · e 25 · f 0 · i 25». */
export function formatReachable(
  row: Pick<BlindStrategyRow, 'reachable'>,
): string {
  return TIERS.map(
    (tier) => `${tier[0] ?? ''} ${String(row.reachable[tier])}`,
  ).join(' · ')
}

/** Tabla Markdown estable, para el reporte de remediación y el re-audit. */
export function formatBlindStrategyTable(
  rows: readonly BlindStrategyRow[],
): string {
  const lines = [
    '| Template | Motor | Var. | R | K | S | Niveles alcanzables (variantes) |',
    '|---|---|---|---|---|---|---|',
  ]
  for (const row of [...rows].sort((a, b) =>
    a.templateId.localeCompare(b.templateId),
  )) {
    lines.push(
      row.enumerable
        ? `| \`${row.templateId}\` | ${row.kind}${row.byPosition ? ' (por posición)' : ''} | ${String(row.variants)} | ${one(row.R)} | ${one(row.K)} | ${percent(row.S)} | ${formatReachable(row)} |`
        : `| \`${row.templateId}\` | ${row.kind} | ${String(row.variants)} | — | — | — | no enumerable: ${row.reason ?? ''} |`,
    )
  }
  return lines.join('\n')
}
