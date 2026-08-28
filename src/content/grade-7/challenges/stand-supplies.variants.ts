/**
 * Variantes del stand.
 *
 * **Generada.** Los packs son el catálogo del kiosco y son copy —«Caja x12» se
 * lee, no se calcula—, así que quedan fijos. Lo que se genera es la decisión:
 * cuántas porciones hacen falta y con cuánta plata.
 *
 * ## Generación por restricción
 *
 * El desafío promete que la combinación óptima existe, entra en el presupuesto,
 * y que gastar de más es posible. Así que se elige primero cuántas porciones, se
 * resuelve el mínimo costo con un oráculo, y recién entonces se elige un
 * presupuesto que lo cubra dejando margen para elegir mal — pero no tanto como
 * para que cualquier combinación sirva.
 *
 * ## Oráculo independiente
 *
 * El desafío resuelve el mínimo costo con programación dinámica. Acá se resuelve
 * por **enumeración exhaustiva** de las cantidades posibles de cada pack. Es
 * otro algoritmo con la misma respuesta: si el primero tuviera un error, el
 * segundo no lo repetiría.
 */

import {
  paramsValidator,
  variantDiagnostic,
  type CandidateContext,
  type VariantSourceSpec,
} from '@/game'

export interface StandParams {
  readonly servingsNeeded: number
  readonly budgetMinor: number
}

export interface StandPack {
  readonly id: string
  readonly label: string
  readonly servings: number
  readonly priceMinor: number
  readonly maxQuantity: number
}

/** El catálogo del kiosco. Contenido autorado, no parámetro. */
export const STAND_PACKS: readonly StandPack[] = [
  {
    id: 'suelto',
    label: 'Alfajor suelto',
    servings: 1,
    priceMinor: 90_000,
    maxQuantity: 12,
  },
  {
    id: 'pack-6',
    label: 'Pack x6',
    servings: 6,
    priceMinor: 480_000,
    maxQuantity: 8,
  },
  {
    id: 'caja-12',
    label: 'Caja x12',
    servings: 12,
    priceMinor: 900_000,
    maxQuantity: 5,
  },
]

/**
 * Costo mínimo para cubrir las porciones pedidas, por enumeración exhaustiva.
 *
 * Recorre las 13 × 9 × 6 combinaciones posibles. Es deliberadamente el camino
 * lento: su valor está en no compartir ni una línea con la programación dinámica
 * que usa el desafío.
 */
export function minimumCostByEnumeration(
  servingsNeeded: number,
  packs: readonly StandPack[] = STAND_PACKS,
): number {
  let best = Number.POSITIVE_INFINITY

  const walk = (index: number, servings: number, cost: number): void => {
    if (cost >= best) return
    if (servings >= servingsNeeded) {
      best = cost
      return
    }
    const pack = packs[index]
    if (pack === undefined) return

    for (let quantity = 0; quantity <= pack.maxQuantity; quantity += 1) {
      walk(
        index + 1,
        servings + pack.servings * quantity,
        cost + pack.priceMinor * quantity,
      )
    }
  }

  walk(0, 0, 0)
  return best
}

function generateStand({ rng }: CandidateContext): StandParams {
  const servingsNeeded = rng.nextInt(10, 48)
  const optimal = minimumCostByEnumeration(servingsNeeded)

  // El presupuesto cubre el óptimo y deja entre un 5 % y un 25 % de aire: hay
  // margen para elegir peor, y no tanto como para que cualquier compra entre.
  const slackPercent = rng.nextInt(4, 28)
  const budgetMinor =
    Math.ceil((optimal * (100 + slackPercent)) / 100 / 5_000) * 5_000

  return { servingsNeeded, budgetMinor }
}

const validateStand = paramsValidator<StandParams>((params, ref) => {
  const diagnostics = []
  const capacity = STAND_PACKS.reduce(
    (total, pack) => total + pack.servings * pack.maxQuantity,
    0,
  )

  if (params.servingsNeeded > capacity) {
    diagnostics.push(
      variantDiagnostic(
        'no-valid-solution',
        ref,
        `piden ${String(params.servingsNeeded)} porciones y el stock llega a ${String(capacity)}`,
      ),
    )
    return diagnostics
  }

  const optimal = minimumCostByEnumeration(params.servingsNeeded)

  if (!Number.isFinite(optimal)) {
    diagnostics.push(
      variantDiagnostic(
        'no-valid-solution',
        ref,
        'ninguna combinación llega a las porciones pedidas',
      ),
    )
    return diagnostics
  }
  if (optimal > params.budgetMinor) {
    diagnostics.push(
      variantDiagnostic(
        'no-valid-solution',
        ref,
        `la mejor compra cuesta ${String(optimal)} y el presupuesto es ${String(params.budgetMinor)}`,
      ),
    )
  }
  // Comprar todo suelto tiene que ser inasequible o al menos peor: si entrara
  // en el presupuesto, no habría nada que optimizar.
  const allSingles = params.servingsNeeded * 90_000
  if (allSingles <= optimal) {
    diagnostics.push(
      variantDiagnostic(
        'trivial-decision',
        ref,
        'comprar suelto ya es lo óptimo, así que no hay nada que decidir',
      ),
    )
  }
  if (params.servingsNeeded < 6) {
    diagnostics.push(
      variantDiagnostic(
        'trivial-decision',
        ref,
        `${String(params.servingsNeeded)} porciones se resuelven sin pensar`,
      ),
    )
  }
  if (params.budgetMinor % 5_000 !== 0) {
    diagnostics.push(
      variantDiagnostic(
        'unreasonable-value',
        ref,
        'el presupuesto no es una cifra redonda',
      ),
    )
  }

  return diagnostics
})

const AUTHORED: readonly (StandParams & { readonly id: string })[] = [
  { id: 'porciones-24', servingsNeeded: 24, budgetMinor: 2_400_000 },
  { id: 'porciones-20', servingsNeeded: 20, budgetMinor: 2_100_000 },
]

export const standSuppliesVariants: VariantSourceSpec<StandParams> = {
  authored: AUTHORED,
  generator: {
    id: 'stand.supplies.constraint-first',
    version: '1',
    candidateSpace: 20_000,
    generate: generateStand,
  },
  validators: [validateStand],
  canonical: (params) => ({
    servingsNeeded: params.servingsNeeded,
    budgetMinor: params.budgetMinor,
  }),
}
