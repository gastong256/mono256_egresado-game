/**
 * Shared authoring mechanics for every implemented grade.
 *
 * Not an alternate evaluator, difficulty model or scorer: each Template keeps
 * its own evaluator and its own independent oracle. What lives here is what
 * every content source needs in the same shape — strict parameters, the
 * 100/75/40/10 outcome ladder, the payload boundary for quantity plans and the
 * gate that keeps Estilo from turning into a proxy for Math quality.
 *
 * It started as the Grade-1 module and was promoted when Grade 2 needed the
 * same mechanics: one generator contract, not one per year.
 */
import { z } from 'zod'
import {
  EngineInvariantError,
  fromInteger,
  metrics,
  variantDiagnostic,
  type BudgetLine,
  type ChallengeEvaluation,
  type CognitiveProfile,
  type EstiloAxis,
  type SolutionQuality,
  type VariantSourceSpec,
} from '@/game'
import { cifra } from '@/content/numeros'

/** An integer written as it is written here: `1.250`. */
export function mil(value: number): string {
  return cifra(fromInteger(value), 0)
}

/** The element at `index`, wrapping; total over a non-empty authored list. */
export function at<L extends readonly [unknown, ...unknown[]]>(
  list: L,
  index: number,
): L[number] {
  return list[index % list.length] ?? list[0]
}

function gcd(left: number, right: number): number {
  return right === 0 ? left : gcd(right, left % right)
}

/**
 * The parameter axes behind one candidate address.
 *
 * A fixed bijective stride first, then a mixed-radix reading. Consecutive
 * addresses therefore land on different combinations of every axis, so the
 * first approvals of a sweep already vary in all of them instead of only in
 * the fastest one. Deterministic and total: address `i` always names the same
 * combination under the same generator version.
 */
export function candidateAxes(
  index: number,
  radices: readonly number[],
  stride: number,
): readonly number[] {
  const size = radices.reduce((product, radix) => product * radix, 1)
  if (gcd(stride, size) !== 1) {
    throw new EngineInvariantError(
      `candidate stride ${String(stride)} is not a bijection of ${String(size)}`,
    )
  }
  let rest = ((index % size) * stride) % size
  return radices.map((radix) => {
    const digit = rest % radix
    rest = Math.floor(rest / radix)
    return digit
  })
}

/** Reads one digit of `candidateAxes`, total by construction. */
export function digit(axes: readonly number[], position: number): number {
  return axes[position] ?? 0
}

/** Size of a candidate space with the given axes. */
export function spaceOf(radices: readonly number[]): number {
  return radices.reduce((product, radix) => product * radix, 1)
}

/**
 * D-S08-043: construct a feasible plan, no structural optimisation.
 *
 * One chained relation, two simultaneous constraints and a constructed answer:
 * load 4, which `bandOf` reads as CORE. The Templates that use it cite the
 * trait table of their design file instead of re-deriving it.
 */
export const feasibilityConstruction: CognitiveProfile = {
  steps: 1,
  constraints: 2,
  selection: 0,
  optimization: 0,
  uncertainty: 0,
  construction: 1,
}

export const semanticId = z
  .string()
  .min(1)
  .max(64)
  .regex(/^[a-zA-Z0-9._-]+$/u)
export const smallPositive = z.number().int().min(1).max(10_000)

/** The authored address is not a mathematical parameter. Everything else is strict. */
export function parameters<P extends object>(
  schema: z.ZodType<P>,
  input: P,
): P {
  const value = { ...input }
  Reflect.deleteProperty(value, 'id')
  return schema.parse(value)
}

/**
 * A generated source whose authoring gates run in the pipeline.
 *
 * `generate(index)` is a pure function of the candidate address; `gates`
 * are the Template's full authoring checks — witnesses, Intrinsic Math Gate
 * decoys, Style independence — and run where a variant is approved, not where
 * a known approved address is materialised in a browser.
 */
export function generatedSource<P extends object>(input: {
  readonly id: string
  readonly version: string
  readonly schema: z.ZodType<P>
  readonly size: number
  readonly generate: (index: number) => P
  readonly gates: (params: P) => readonly string[]
}): VariantSourceSpec<P> {
  return {
    authored: [{ id: 'reference', ...input.generate(0) }],
    generator: {
      id: input.id,
      version: input.version,
      candidateSpace: input.size,
      generate: ({ index }) => input.schema.parse(input.generate(index)),
    },
    canonical: (params) => parameters(input.schema, params),
    validators: [
      ({ params, ref }) => {
        let parsed: P
        try {
          parsed = parameters(input.schema, params)
        } catch {
          return [
            variantDiagnostic(
              'unreasonable-value',
              ref,
              'parámetros fuera del schema estricto',
            ),
          ]
        }
        return input
          .gates(parsed)
          .map((issue) => variantDiagnostic('template-invariant', ref, issue))
      },
    ],
  }
}

/** Malformed payload ≠ mathematically INVALID: duplicates/unknown IDs are rejected. */
export function quantityIssues(
  lines: readonly BudgetLine[],
  items: readonly {
    readonly id: string
    readonly maxQuantity: number
  }[],
): readonly string[] {
  if (new Set(lines.map((line) => line.itemId)).size !== lines.length)
    return ['cantidades duplicadas']
  return lines.flatMap((line) => {
    const item = items.find((entry) => entry.id === line.itemId)
    return item === undefined ||
      !Number.isSafeInteger(line.quantity) ||
      line.quantity < 0 ||
      line.quantity > item.maxQuantity
      ? [`cantidad fuera de contrato: ${line.itemId}`]
      : []
  })
}

export function quantity(lines: readonly BudgetLine[], id: string): number {
  return lines.find((line) => line.itemId === id)?.quantity ?? 0
}

/** The canonical 100/75/40/10 ladder, as legacy reasoning metrics. */
export function outcome(
  quality: SolutionQuality,
  feedback: ChallengeEvaluation['feedback'],
  careerEffects: ChallengeEvaluation['careerEffects'] = {},
  flagEffects: ChallengeEvaluation['flagEffects'] = [],
): ChallengeEvaluation {
  const performance = {
    optimal: 1,
    efficient: 0.75,
    functional: 0.4,
    invalid: 0.1,
  }[quality]
  return {
    quality,
    feedback,
    careerEffects,
    flagEffects,
    metrics: metrics({
      precision: performance,
      efficiency: performance,
      risk: 0,
    }),
  }
}

/** One plan of an oracle, with the strategy it would express. */
export interface StyledPlan {
  readonly quality: SolutionQuality
  /** Absent for INVALID: a failed answer never labels a player's identity. */
  readonly style?: EstiloAxis
}

/**
 * Estilo describes a strategy; it may never announce a result.
 *
 * Checked over every plan an oracle enumerates: an OPTIMAL result can be
 * reached with at least two different strategies, every strategy a valid plan
 * can express shows up under at least two quality tiers — so no label means
 * «you got the best result» or «you could not have» — and INVALID labels
 * nothing. Otherwise a Style label would be a second, softer copy of Math
 * quality.
 */
export function styleGateIssues(
  plans: readonly StyledPlan[],
): readonly string[] {
  const issues: string[] = []
  const tiersByAxis = new Map<EstiloAxis, Set<SolutionQuality>>()
  for (const plan of plans) {
    if (plan.quality === 'invalid') {
      if (plan.style !== undefined)
        issues.push('una respuesta inválida no puede etiquetar estilo')
      continue
    }
    if (plan.style === undefined) continue
    const tiers = tiersByAxis.get(plan.style) ?? new Set<SolutionQuality>()
    tiers.add(plan.quality)
    tiersByAxis.set(plan.style, tiers)
  }
  const optimalAxes = [...tiersByAxis].filter(([, tiers]) =>
    tiers.has('optimal'),
  )
  if (optimalAxes.length < 2)
    issues.push('los planes óptimos no admiten estrategias distintas')
  for (const [axis, tiers] of tiersByAxis)
    if (tiers.size < 2)
      issues.push(`el estilo ${axis} aparece con un solo nivel de resultado`)
  return [...new Set(issues)]
}

/** Distinct witnesses for the three non-invalid tiers, the minimum an evaluator must reach. */
export function tierWitnessIssues(
  plans: readonly { readonly quality: SolutionQuality }[],
): readonly string[] {
  return (['optimal', 'efficient', 'functional'] as const).flatMap((quality) =>
    plans.some((plan) => plan.quality === quality)
      ? []
      : [`falta un plan ${quality} alcanzable`],
  )
}
