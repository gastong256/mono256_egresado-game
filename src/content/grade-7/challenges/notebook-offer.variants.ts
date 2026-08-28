/**
 * Variantes del cuaderno.
 *
 * **Generada.** Precio de lista, porcentaje y descuento fijo son tres números, y
 * la decisión —cuál de las dos ofertas entra en la plata que hay— cambia con
 * cada uno.
 *
 * ## Generación por restricción
 *
 * La forma que el desafío promete es que **exactamente una oferta entre en el
 * presupuesto**. El presupuesto no es un parámetro: el desafío lo deriva a mitad
 * de camino entre los dos totales, así que basta con garantizar que los totales
 * sean distintos y que la diferencia se note. Se generan entonces:
 *
 * 1. un porcentaje que dé centavos exactos sobre el precio de lista;
 * 2. un descuento fijo que caiga cerca del porcentual pero no encima, para que
 *    comparar de memoria no alcance;
 * 3. una diferencia mínima visible, porque una diferencia de un centavo es una
 *    decisión que nadie puede tomar mirando.
 */

import {
  paramsValidator,
  variantDiagnostic,
  type CandidateContext,
  type VariantSourceSpec,
} from '@/game'

export interface NotebookParams {
  /** Precio de lista en unidades menores. */
  readonly listPriceMinor: number
  readonly percentOff: number
  readonly fixedOffMinor: number
}

/** Un peso, en unidades menores. */
const PESO = 100

/**
 * Diferencia mínima entre las dos ofertas, como fracción del precio de lista.
 *
 * Relativa y no absoluta: quinientos pesos son una decisión visible en un
 * cuaderno de mil y son un precio entero en uno de trescientos. Lo que tiene
 * que verse es la **proporción**, más un piso en pesos para que nunca sean
 * centavos.
 */
export const MIN_OFFER_GAP_RATIO = 0.04
export const MIN_OFFER_GAP_PESOS = 50

const PERCENTS = [10, 15, 20, 25, 30] as const

/** Cuánto descuenta el porcentaje, en unidades menores. */
export function percentValueOf(params: NotebookParams): number {
  return Math.round((params.listPriceMinor * params.percentOff) / 100)
}

export function percentTotalOf(params: NotebookParams): number {
  return params.listPriceMinor - percentValueOf(params)
}

export function fixedTotalOf(params: NotebookParams): number {
  return params.listPriceMinor - params.fixedOffMinor
}

function generateNotebook({ rng }: CandidateContext): NotebookParams {
  const percentOff = rng.pick(PERCENTS)
  // Precios de librería en centenas de pesos: entre 400 y 2.000. La centena es
  // lo que hace que cualquiera de los porcentajes dé pesos enteros, y un
  // descuento con centavos sueltos no es un precio que alguien escriba.
  const listPesos = rng.nextInt(3, 30) * 100
  const listPriceMinor = listPesos * PESO
  const percentPesos = (listPesos * percentOff) / 100

  // El descuento fijo se elige *alrededor* del porcentual: lo bastante lejos
  // para que la diferencia se vea, lo bastante cerca para que haya que
  // calcularla, y siempre dentro de lo que el precio permite. Los dos márgenes
  // se miden antes de elegir hacia dónde moverse, así que la construcción no
  // puede dejar un descuento en cero ni uno mayor que el cuaderno.
  const minGap = Math.max(
    MIN_OFFER_GAP_PESOS,
    Math.ceil(listPesos * MIN_OFFER_GAP_RATIO),
  )
  const roomUp = listPesos - percentPesos - MIN_OFFER_GAP_PESOS
  const roomDown = percentPesos - MIN_OFFER_GAP_PESOS
  const canUp = roomUp >= minGap
  const canDown = roomDown >= minGap

  const goUp = canUp && (!canDown || rng.chance(1, 2))
  const room = goUp ? roomUp : roomDown
  const gap = room >= minGap ? rng.nextInt(minGap, room) : minGap
  const fixedOffPesos = goUp ? percentPesos + gap : percentPesos - gap

  return { listPriceMinor, percentOff, fixedOffMinor: fixedOffPesos * PESO }
}

/**
 * Oráculo independiente.
 *
 * Recalcula los dos totales desde el precio de lista y comprueba lo único que
 * el desafío realmente promete: que las dos ofertas se distingan, que ninguna
 * quede en cero y que la diferencia se pueda ver en pantalla.
 */
const validateNotebook = paramsValidator<NotebookParams>((params, ref) => {
  const diagnostics = []
  const percentTotal = percentTotalOf(params)
  const fixedTotal = fixedTotalOf(params)
  const gap = Math.abs(percentTotal - fixedTotal)

  if ((params.listPriceMinor * params.percentOff) % 100 !== 0) {
    diagnostics.push(
      variantDiagnostic(
        'unreasonable-value',
        ref,
        `el ${String(params.percentOff)} % de ${String(params.listPriceMinor)} no da centavos exactos`,
      ),
    )
  }
  if (percentTotal <= 0 || fixedTotal <= 0) {
    diagnostics.push(
      variantDiagnostic(
        'unreasonable-value',
        ref,
        'una de las ofertas deja el precio en cero o en negativo',
      ),
    )
  }
  const requiredGap =
    Math.max(
      MIN_OFFER_GAP_PESOS,
      Math.ceil((params.listPriceMinor / PESO) * MIN_OFFER_GAP_RATIO),
    ) * PESO

  if (gap === 0) {
    diagnostics.push(
      variantDiagnostic(
        'ambiguous-optimum',
        ref,
        'las dos ofertas cuestan exactamente lo mismo',
      ),
    )
  } else if (gap < requiredGap) {
    diagnostics.push(
      variantDiagnostic(
        'trivial-decision',
        ref,
        `las ofertas se diferencian en ${String(gap / PESO)} pesos sobre ${String(params.listPriceMinor / PESO)}, que no se lee como decisión`,
      ),
    )
  }
  if (params.fixedOffMinor >= params.listPriceMinor) {
    diagnostics.push(
      variantDiagnostic(
        'unreasonable-value',
        ref,
        'el descuento fijo es mayor que el precio del cuaderno',
      ),
    )
  }
  if (params.fixedOffMinor <= 0) {
    diagnostics.push(
      variantDiagnostic(
        'unreasonable-value',
        ref,
        'el descuento fijo no descuenta nada',
      ),
    )
  }
  if (params.fixedOffMinor % PESO !== 0) {
    diagnostics.push(
      variantDiagnostic(
        'unreasonable-value',
        ref,
        'el descuento fijo tiene centavos sueltos',
      ),
    )
  }

  return diagnostics
})

const AUTHORED: readonly (NotebookParams & { readonly id: string })[] = [
  {
    id: 'precio-alto',
    listPriceMinor: 80_000_000,
    percentOff: 20,
    fixedOffMinor: 12_000_000,
  },
  {
    id: 'precio-bajo',
    listPriceMinor: 70_000_000,
    percentOff: 20,
    fixedOffMinor: 10_000_000,
  },
]

export const notebookOfferVariants: VariantSourceSpec<NotebookParams> = {
  authored: AUTHORED,
  generator: {
    id: 'notebook.offer.constraint-first',
    version: '1',
    candidateSpace: 20_000,
    generate: generateNotebook,
  },
  validators: [validateNotebook],
  canonical: (params) => ({
    listPriceMinor: params.listPriceMinor,
    percentOff: params.percentOff,
    fixedOffMinor: params.fixedOffMinor,
  }),
}
