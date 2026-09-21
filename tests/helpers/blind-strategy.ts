/**
 * Auditoría de estrategia ciega sobre un catálogo aprobado.
 *
 * Mide lo que un jugador obtiene **sin mirar los números**: responder al azar
 * (R), repetir siempre la misma respuesta completa (K) y cuántas variantes
 * comparten esa misma respuesta óptima (S). Los contratos de remediación fijan
 * techos por Template sobre esas métricas; este módulo sólo las calcula, con el
 * evaluador real de cada Template y nunca con uno paralelo.
 *
 * El espacio de respuesta lo clasifica {@link responseSpaceOf} por **capacidad**,
 * no por nombre de motor (RS-RA-AUDIT-001). Donde existe un vector constante
 * comparable y su cardinal entra en el presupuesto, se enumera **entero**; donde
 * no, se miden políticas ingenuas. Toda Template del catálogo recibe una fila con
 * su estado: ninguna queda sin auditar sin decir por qué.
 *
 * Es una medición, no un oráculo: el re-audit independiente no debe apoyarse
 * sólo en ella. Nada acá conoce la respuesta esperada de ninguna Template.
 */
import type {
  ApprovedVariantCatalog,
  ChallengeDefinition,
  EngineDependencies,
  SolutionQuality,
} from '@/game'
import { materializeVariant } from '@/game/testing'
import {
  EVALUATION_BUDGET,
  responseSpaceOf,
  STRATEGY_FAMILIES,
  type PolicyDerivation,
  type ResponseSpace,
  type StrategyFamily,
} from './blind-strategy-space'

export {
  EVALUATION_BUDGET,
  STRATEGY_FAMILIES,
  type PolicyDerivation,
  type StrategyFamily,
} from './blind-strategy-space'

/** La escala del contrato: la escalera 100/75/40/10. */
export const QUALITY_SCORE: Readonly<Record<SolutionQuality, number>> = {
  optimal: 100,
  efficient: 75,
  functional: 40,
  invalid: 10,
}

const TIERS: readonly SolutionQuality[] = [
  'optimal',
  'efficient',
  'functional',
  'invalid',
]

/** Cómo se auditó una Template. Nunca queda sin declarar. */
export type AuditMode =
  | 'AUDITED_EXHAUSTIVELY'
  | 'AUDITED_BY_POLICIES'
  | 'NOT_APPLICABLE_WITH_REASON'
  | 'BLOCKED_BY_SPACE_WITH_REASON'

/** Una política de atajo medida sobre todas las variantes de la Template. */
export interface PolicyScore {
  readonly histogram: Readonly<Record<SolutionQuality, number>>
  readonly rejected: number
  readonly name: string
  readonly family: StrategyFamily
  /** De dónde salió: de las cifras de la variante, o de la forma de la pantalla. */
  readonly derivation: PolicyDerivation
  readonly mean: number
  readonly optimal: number
}

export interface BlindStrategyRow {
  readonly templateId: string
  readonly kind: string
  readonly variants: number
  readonly mode: AuditMode
  readonly category: 'A' | 'B' | 'C' | 'D'
  readonly threshold: string | undefined
  readonly histogram: Readonly<Record<SolutionQuality, number>>
  /** Por qué no se enumeró, cuando no se enumeró. Siempre presente si aplica. */
  readonly reason?: string
  /** Cardinal del espacio de respuesta por variante, cuando se pudo medir. */
  readonly cardinality?: number | undefined
  /** Costo de la enumeración exhaustiva: `cardinalidad × variantes`. */
  readonly evaluations?: number
  readonly scoreBearing: boolean
  /** `NaN` cuando no hubo enumeración exhaustiva. */
  readonly R: number
  readonly K: number
  readonly kAnswer: string
  readonly S: number
  readonly sAnswer: string
  /**
   * Políticas de atajo medidas, de mayor a menor rendimiento medio.
   *
   * Se corren en **toda** Template, también donde el espacio constante se
   * enumeró entero: una constante y una política relativa a la pantalla son dos
   * clases distintas de atajo y la segunda no se deduce de la primera
   * (MAT-RA2-003).
   */
  readonly policies: readonly PolicyScore[]
  /** Familias canónicas efectivamente evaluadas en esta Template. */
  readonly families: readonly StrategyFamily[]
  /** Variantes en las que cada nivel es alcanzable. */
  readonly reachable: Readonly<Record<SolutionQuality, number>>
  /** Nivel de cada respuesta constante en cada variante, en orden de catálogo. */
  readonly constant: ReadonlyMap<string, readonly SolutionQuality[]>
  /**
   * La misma tabla, indexada por el identificador legible de la respuesta.
   *
   * Sólo cuando ese identificador es el mismo en todas las variantes: si los ids
   * cambian, la coordenada estable es la posición y esta vista queda vacía.
   */
  readonly constantById: ReadonlyMap<string, readonly SolutionQuality[]>
  /** Cuántos vectores distintos son óptimos en alguna variante. */
  readonly optimalSignatures: number
  /** Variantes donde alguna respuesta cambió de nivel sólo por la postura. */
  readonly stanceLeaks: number
  /**
   * Profundidad real con la que se auditó la fila.
   *
   * Una fila cubierta sólo por patrones posicionales no está auditada a la
   * misma profundidad que una que además probó políticas derivadas de las
   * cifras impresas, y reportar las dos como «cubierta» exagera la cobertura
   * (MAT-FC-002).
   */
  readonly depth: CoverageDepth
  /**
   * El piso estructural: qué rinde acertar cualquier respuesta que entre.
   *
   * Sólo donde se enumeró el espacio constante entero. `min`/`max` son cuántas
   * respuestas distintas entran en la variante más pobre y en la más rica: un
   * `min` de uno o dos dice que el espacio factible es casi un punto y que
   * cualquier política que aterrice adentro cobra el piso sin optimizar nada.
   */
  readonly viable?: StructuralFloor
}

/** Cuántas respuestas entran, y qué rinde acertar una cualquiera. */
export interface StructuralFloor {
  readonly min: number
  readonly max: number
  readonly floorMean: number
  readonly floorShare: number
}

/**
 * Cuán hondo llegó la auditoría de una Template.
 *
 * El orden es de mayor a menor profundidad. `POSITIONAL_POLICIES_ONLY` y
 * `LIMITED_POLICY_COVERAGE` son declaraciones honestas de límite, no fallas:
 * decir que una fila se midió sólo con patrones de la forma de la pantalla es
 * preferible a contarla como cobertura plena.
 */
export const COVERAGE_DEPTHS = [
  'EXHAUSTIVE_AND_ATTRIBUTE',
  'EXHAUSTIVE_ONLY',
  'ATTRIBUTE_POLICIES',
  'POSITIONAL_POLICIES_ONLY',
  'LIMITED_POLICY_COVERAGE',
] as const
export type CoverageDepth = (typeof COVERAGE_DEPTHS)[number]

/** Cuántas políticas distintas hacen falta para no declarar cobertura limitada. */
const MIN_POLICIES_FOR_COVERAGE = 3

export function coverageDepthOf(
  mode: AuditMode,
  policies: readonly PolicyScore[],
): CoverageDepth {
  const attribute = policies.some((policy) => policy.derivation === 'attribute')
  if (mode === 'AUDITED_EXHAUSTIVELY')
    return attribute ? 'EXHAUSTIVE_AND_ATTRIBUTE' : 'EXHAUSTIVE_ONLY'
  if (policies.length < MIN_POLICIES_FOR_COVERAGE)
    return 'LIMITED_POLICY_COVERAGE'
  return attribute ? 'ATTRIBUTE_POLICIES' : 'POSITIONAL_POLICIES_ONLY'
}

const emptyReachable = (): Record<SolutionQuality, number> => ({
  optimal: 0,
  efficient: 0,
  functional: 0,
  invalid: 0,
})

/** Cuántas variantes admiten cada nivel, según lo que la auditoría recorrió. */
function reachableOf(
  seenByVariant: readonly ReadonlySet<SolutionQuality>[],
): Record<SolutionQuality, number> {
  const reachable = emptyReachable()
  for (const seen of seenByVariant)
    for (const tier of seen) reachable[tier] += 1
  return reachable
}

/** Cierra una medición por políticas con su tabla de niveles alcanzables. */
function withReachable<
  T extends { readonly seenByVariant: readonly ReadonlySet<SolutionQuality>[] },
>({
  seenByVariant,
  ...rest
}: T): Omit<T, 'seenByVariant'> & {
  readonly reachable: Record<SolutionQuality, number>
} {
  return { ...rest, reachable: reachableOf(seenByVariant) }
}

interface Instance {
  readonly variantId: string
  readonly instance: ReturnType<ChallengeDefinition['materialize']>
  readonly view: ReturnType<
    ReturnType<ChallengeDefinition['materialize']>['present']
  >
}

function evaluateTier(
  templateId: string,
  variantId: string,
  instance: Instance['instance'],
  answer: Parameters<Instance['instance']['evaluate']>[0],
  strict: boolean,
): SolutionQuality | undefined {
  const result = instance.evaluate(answer, [])
  if (result.ok) return result.value.quality
  if (strict)
    throw new Error(
      `${templateId}/${variantId}: respuesta enumerada rechazada (${result.error.kind})`,
    )
  // Una política puede proponer algo malformado para ese motor —no hacer nada,
  // por ejemplo—. Eso no es un nivel: es una respuesta que el juego no acepta.
  return undefined
}

/** Enumeración exhaustiva de respuestas constantes sobre todas las variantes. */
function auditExhaustively(
  templateId: string,
  instances: readonly Instance[],
  spaces: readonly ResponseSpace[],
  keys: readonly string[],
): Pick<
  BlindStrategyRow,
  | 'R'
  | 'K'
  | 'kAnswer'
  | 'S'
  | 'sAnswer'
  | 'constant'
  | 'constantById'
  | 'stanceLeaks'
  | 'optimalSignatures'
  | 'histogram'
  | 'viable'
> & { readonly seenByVariant: readonly ReadonlySet<SolutionQuality>[] } {
  const n = instances.length
  const constant = new Map<string, SolutionQuality[]>()
  const seenByVariant: Set<SolutionQuality>[] = []
  let randomTotal = 0
  let stanceLeaks = 0
  const optimalSignatures = new Set<string>()
  // Piso estructural: qué rinde acertar **cualquier** respuesta que entre. Una
  // Template cuyo espacio factible es casi un punto regala ese piso a cualquier
  // política que aterrice adentro, y sin medirlo no se puede distinguir un
  // atajo de la geometría de la escalera (MAT-FC-003).
  const viableByVariant: number[] = []
  let viableTotal = 0
  let viableOptimal = 0
  let viableCount = 0

  instances.forEach(({ variantId, instance }, index) => {
    const space = spaces[index]
    const seen = new Set<SolutionQuality>()
    let sum = 0
    let counted = 0
    let leaked = false
    let viable = 0
    let viableSum = 0
    let viableOpt = 0
    for (const key of keys) {
      // La coordenada se resuelve contra ESTA variante: los identificadores de
      // opción cambian entre variantes y la respuesta constante es la posición.
      const candidate = space?.resolve?.(key)
      if (candidate === undefined) continue
      const quality = evaluateTier(
        templateId,
        variantId,
        instance,
        candidate.answer,
        true,
      )
      if (quality === undefined) continue
      for (const other of candidate.stanceVariants) {
        const again = instance.evaluate(other, [])
        if (!again.ok || again.value.quality !== quality) leaked = true
      }
      if (quality === 'optimal') optimalSignatures.add(key)
      if (quality !== 'invalid') {
        viable += 1
        viableSum += QUALITY_SCORE[quality]
        if (quality === 'optimal') viableOpt += 1
      }
      seen.add(quality)
      sum += QUALITY_SCORE[quality]
      counted += 1
      const list = constant.get(key) ?? []
      list.push(quality)
      constant.set(key, list)
    }
    if (leaked) stanceLeaks += 1
    randomTotal += counted === 0 ? 0 : sum / counted
    seenByVariant.push(seen)
    viableByVariant.push(viable)
    viableTotal += viableSum
    viableOptimal += viableOpt
  })

  let K = -1
  let kAnswer = ''
  let S = -1
  let sAnswer = ''
  for (const [key, qualities] of constant) {
    if (qualities.length !== n) continue
    const mean = qualities.reduce((t, q) => t + QUALITY_SCORE[q], 0) / n
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
  // Vista por identificador legible, sólo si es el mismo en todas las variantes.
  const constantById = new Map<string, readonly SolutionQuality[]>()
  const labels = keys.map((key) =>
    spaces
      .map((space) => space.labelOf?.(key))
      .filter((id) => id !== undefined),
  )
  const stableLabels =
    labels.length > 0 &&
    labels.every(
      (ids) => ids.length === instances.length && new Set(ids).size === 1,
    )
  if (stableLabels)
    keys.forEach((key, index) => {
      const id = labels[index]?.[0]
      const qualities = constant.get(key)
      if (id !== undefined && qualities !== undefined && qualities.length === n)
        constantById.set(id, qualities)
    })

  viableCount = viableByVariant.reduce((total, count) => total + count, 0)
  const histogram = emptyReachable()
  for (const quality of constant.get(kAnswer) ?? []) histogram[quality] += 1
  return {
    histogram,
    ...(viableByVariant.length === 0
      ? {}
      : {
          viable: {
            min: Math.min(...viableByVariant),
            max: Math.max(...viableByVariant),
            floorMean: viableCount === 0 ? 0 : viableTotal / viableCount,
            floorShare: viableCount === 0 ? 0 : viableOptimal / viableCount,
          },
        }),
    R: randomTotal / n,
    K,
    kAnswer,
    S,
    sAnswer,
    seenByVariant,
    constant: new Map([...constant].filter(([, q]) => q.length === n)),
    constantById,
    stanceLeaks,
    optimalSignatures: optimalSignatures.size,
  }
}

/**
 * Políticas de atajo: deterministas, y ciegas a la respuesta esperada.
 *
 * Una política sólo puntúa cuando **todas** las variantes la ofrecen: si una
 * pantalla no imprime la fila que otra sí imprime, «la misma regla» no existe
 * en todo el catálogo y promediar sobre un subconjunto inventaría un atajo que
 * un jugador no podría reusar. Ésas se descartan y se cuentan aparte.
 */
function auditByPolicies(
  templateId: string,
  instances: readonly Instance[],
): Pick<BlindStrategyRow, 'policies' | 'families'> & {
  readonly seenByVariant: readonly ReadonlySet<SolutionQuality>[]
} {
  const seenByVariant: Set<SolutionQuality>[] = []
  const totals = new Map<
    string,
    {
      family: StrategyFamily
      derivation: PolicyDerivation
      sum: number
      optimal: number
      rejected: number
      applied: number
      histogram: Record<SolutionQuality, number>
    }
  >()
  for (const { variantId, instance, view } of instances) {
    const space = responseSpaceOf(view)
    const seen = new Set<SolutionQuality>()
    // Dos reglas distintas pueden proponer la misma respuesta en esta variante.
    // Evaluarla una vez y reusar el nivel no cambia ninguna métrica y mantiene
    // el costo de las políticas muy por debajo del de la enumeración.
    const memo = new Map<string, SolutionQuality | undefined>()
    for (const policy of space?.policies ?? []) {
      const key = JSON.stringify(policy.answer)
      const evaluated = memo.has(key)
        ? memo.get(key)
        : evaluateTier(templateId, variantId, instance, policy.answer, false)
      memo.set(key, evaluated)
      const quality = evaluated ?? 'invalid'
      seen.add(quality)
      const entry = totals.get(policy.name) ?? {
        family: policy.family,
        derivation: policy.derivation,
        sum: 0,
        optimal: 0,
        rejected: 0,
        applied: 0,
        histogram: emptyReachable(),
      }
      if (evaluated === undefined) entry.rejected += 1
      entry.applied += 1
      entry.histogram[quality] += 1
      entry.sum += QUALITY_SCORE[quality]
      if (quality === 'optimal') entry.optimal += 1
      totals.set(policy.name, entry)
    }
    seenByVariant.push(seen)
  }
  const complete = [...totals].filter(
    ([, entry]) => entry.applied === instances.length,
  )
  const policies = complete
    .map(([name, entry]) => ({
      name,
      family: entry.family,
      derivation: entry.derivation,
      mean: entry.sum / instances.length,
      optimal: entry.optimal,
      rejected: entry.rejected,
      histogram: entry.histogram,
    }))
    .sort((a, b) => b.mean - a.mean || a.name.localeCompare(b.name))
  const present = new Set(complete.map(([, entry]) => entry.family))
  return {
    policies,
    families: STRATEGY_FAMILIES.filter((family) => present.has(family)),
    seenByVariant,
  }
}

/**
 * R, K y S de cada Template del catálogo, con su modo de auditoría.
 *
 * Las variantes se recorren en el orden del catálogo y las respuestas en el
 * orden que declara el espacio: la salida es determinista.
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
    if (template === undefined)
      throw new Error(`Template ausente: ${templateId}`)

    const instances: Instance[] = variantIds.map((variantId) => {
      const instance = materializeVariant(template, {
        variantId: variantId as never,
        seed: 'blind-strategy-audit',
      })
      return { variantId, instance, view: instance.present([]) }
    })
    const first = instances[0]
    if (first === undefined) continue
    const kind = first.view.kind
    // Un Repaso no aporta evidencia competitiva (ADR-024), así que su K no es
    // un exploit de puntaje aunque sea alto. Todo lo demás puntúa: `scoring.math`
    // nunca es `'none'` por contrato.
    const scoreBearing = template.placement !== 'recovery'
    const base = {
      templateId,
      threshold: CONTRACT_THRESHOLDS[templateId],
      histogram: emptyReachable(),
      kind,
      variants: instances.length,
      scoreBearing,
      R: Number.NaN,
      K: Number.NaN,
      kAnswer: '',
      S: Number.NaN,
      sAnswer: '',
      policies: [] as readonly PolicyScore[],
      families: [] as readonly StrategyFamily[],
      constant: new Map<string, readonly SolutionQuality[]>(),
      constantById: new Map<string, readonly SolutionQuality[]>(),
      optimalSignatures: 0,
      stanceLeaks: 0,
      depth: 'LIMITED_POLICY_COVERAGE' as CoverageDepth,
    }

    const spaces = instances.map((entry) => responseSpaceOf(entry.view))
    const unsupported = spaces.some((space) => space === undefined)
    if (unsupported || spaces[0] === undefined) {
      rows.push({
        ...base,
        mode: 'BLOCKED_BY_SPACE_WITH_REASON',
        category: 'D',
        reason: `la auditoría no sabe describir el espacio de respuesta de ${kind}`,
        reachable: emptyReachable(),
      })
      continue
    }

    const signatures = new Set(spaces.map((space) => space?.signature))
    const cardinality = spaces[0].cardinality
    const evaluations =
      (cardinality ?? Number.POSITIVE_INFINITY) *
      spaces.reduce(
        (sum, space) => sum + (space?.evaluationsPerResponse ?? 1),
        0,
      )
    const hasConstants = spaces.every(
      (space) =>
        space?.constantKeys !== undefined && space.resolve !== undefined,
    )

    // Categoría C: la forma del espacio cambia entre variantes, así que «la
    // misma respuesta» no significa lo mismo en dos variantes y no existe un
    // vector constante comparable.
    if (hasConstants && signatures.size > 1) {
      rows.push({
        ...base,
        mode: 'AUDITED_BY_POLICIES' as const,
        category: 'C',
        reason: `el espacio de respuesta cambia entre variantes (${String(signatures.size)} formas distintas): no hay respuesta constante comparable`,
        cardinality,
        ...withReachable(auditByPolicies(templateId, instances)),
      })
      continue
    }

    // Categoría B: hay vector constante, pero enumerarlo excede el presupuesto.
    if (hasConstants && evaluations > EVALUATION_BUDGET) {
      rows.push({
        ...base,
        mode: 'AUDITED_BY_POLICIES' as const,
        category: 'B',
        reason: `espacio de ${String(cardinality)} respuestas por variante: ${String(evaluations)} evaluaciones exceden el presupuesto de ${String(EVALUATION_BUDGET)}`,
        cardinality,
        evaluations,
        ...withReachable(auditByPolicies(templateId, instances)),
      })
      continue
    }

    // Categoría D: motores de construcción, sin vector constante comparable.
    if (!hasConstants) {
      rows.push({
        ...base,
        mode: 'AUDITED_BY_POLICIES' as const,
        category: 'D',
        reason: `${kind} nombra posiciones, personas u horarios de cada variante: no hay respuesta constante comparable`,
        cardinality,
        ...withReachable(auditByPolicies(templateId, instances)),
      })
      continue
    }

    // Categoría A: enumeración exhaustiva del espacio constante **y** políticas
    // relativas a la pantalla. Enumerar constantes no cubre «copiar el número
    // que la variante imprime»: son dos clases distintas de atajo.
    const keys = spaces[0].constantKeys?.() ?? []
    const exhaustive = auditExhaustively(
      templateId,
      instances,
      spaces as readonly ResponseSpace[],
      keys,
    )
    const { seenByVariant, ...byPolicies } = auditByPolicies(
      templateId,
      instances,
    )
    rows.push({
      ...base,
      mode: 'AUDITED_EXHAUSTIVELY',
      category: 'A',
      reason:
        'coordenadas semánticas estables; espacio completo dentro del presupuesto',
      cardinality,
      evaluations,
      ...exhaustive,
      ...byPolicies,
      families: ['CONSTANT', ...byPolicies.families],
      reachable: reachableOf(
        exhaustive.seenByVariant.map(
          (seen, index) => new Set([...seen, ...(seenByVariant[index] ?? [])]),
        ),
      ),
    })
  }
  // La profundidad se decide al final y en un solo lugar, sobre lo que cada
  // fila **efectivamente** midió: así no puede quedar declarada de más.
  return rows.map((row) => ({
    ...row,
    depth: coverageDepthOf(row.mode, row.policies),
  }))
}

// Contratos particulares: no participan del descubrimiento del espacio.
const CONTRACT_THRESHOLDS: Readonly<Record<string, string>> = {
  'y3.course-project-tech': 'RS-RA-002: K ≤ 65; S ≤ 35 %',
  'y4.course-project-fundraiser': 'RS-RA-003: K ≤ 65; S ≤ 35 %',
  'y3.transport-pass': 'K ≤ R + 10; S ≤ 40 %',
  'y2.data-claim-review': 'K ≤ 75; S ≤ 60 %',
  'y2.course-project-survey': 'K ≤ 60; S ≤ 35 %',
  'y2.standings-claim': 'K ≤ 65; S ≤ 35 %',
  'y5.stage-screen': 'K ≤ 78; S ≤ 40 %',
  'y5.course-project-final': 'K ≤ 65; S ≤ 35 %',
  'y5.next-step-options': 'K ≤ 65; S ≤ 35 %',
  'g7.mural-paint': 'K ≤ 73',
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

/** Tabla Markdown estable de R/K/S, para los reportes y el re-audit. */
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
      row.mode === 'AUDITED_EXHAUSTIVELY'
        ? `| \`${row.templateId}\` | ${row.kind} | ${String(row.variants)} | ${one(row.R)} | ${one(row.K)} | ${percent(row.S)} | ${formatReachable(row)} |`
        : `| \`${row.templateId}\` | ${row.kind} | ${String(row.variants)} | — | — | — | ${row.mode}: ${row.reason ?? ''} |`,
    )
  }
  return lines.join('\n')
}

/**
 * Matriz de cobertura: una fila por Template del catálogo, con su modo, su
 * cardinal y la mejor estrategia ciega que se le encontró.
 */
export function formatCoverageMatrix(
  rows: readonly BlindStrategyRow[],
): string {
  const lines = [
    '| Template | Motor | N | Puntuable | Categoría | Estado | Profundidad | Cardinal | Mejor estrategia ciega | Métrica | Histograma o/e/f/i | Piso estructural | Umbral contractual | Razón |',
    '|---|---|---|---|---|---|---|---|---|---|---|---|---|---|',
  ]
  for (const row of [...rows].sort((a, b) =>
    a.templateId.localeCompare(b.templateId),
  )) {
    const best =
      row.mode === 'AUDITED_EXHAUSTIVELY'
        ? `constante \`${row.kAnswer}\``
        : (row.policies[0]?.name ?? '—')
    const metric =
      row.mode === 'AUDITED_EXHAUSTIVELY'
        ? `K ${one(row.K)} · S ${percent(row.S)}`
        : row.policies[0] === undefined
          ? '—'
          : `política ${row.policies[0].mean.toFixed(1)} · óptima en ${String(row.policies[0].optimal)}/${String(row.variants)} · rechazadas ${String(row.policies[0].rejected)}`
    const histogram =
      row.mode === 'AUDITED_EXHAUSTIVELY'
        ? row.histogram
        : row.policies[0]?.histogram
    const floor =
      row.viable === undefined
        ? '—'
        : `${String(row.viable.min)}–${String(row.viable.max)} entran · ${one(row.viable.floorMean)} · ${percent(row.viable.floorShare)}`
    lines.push(
      `| \`${row.templateId}\` | ${row.kind} | ${String(row.variants)} | ${row.scoreBearing ? 'sí' : 'no'} | ${row.category} | ${row.mode} | ${row.depth} | ${row.cardinality === undefined ? '—' : String(row.cardinality)} | ${best} | ${metric} | ${histogram === undefined ? '—' : TIERS.map((tier) => histogram[tier]).join('/')} | ${floor} | ${row.threshold ?? 'sin techo; sólo medición'} | ${row.reason ?? '—'} |`,
    )
  }
  return lines.join('\n')
}
