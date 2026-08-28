/**
 * Variantes del mural.
 *
 * **Generada.** Ancho, alto y rendimiento por litro son tres números sin copy
 * adentro, y la decisión que sostienen —qué envase alcanza— cambia por completo
 * al moverlos.
 *
 * ## Generación inversa
 *
 * El desafío promete una forma: **algún envase no alcanza, alguno sí, y el más
 * chico que alcanza es único**. Generar dimensiones al azar y después mirar si
 * eso pasó habría dejado la promesa librada a la suerte, así que se genera al
 * revés:
 *
 * 1. se elige el envase que queremos que sea la respuesta;
 * 2. de ahí sale el intervalo de litros necesarios que lo hace el mínimo
 *    suficiente —para la lata de 2 L, más de 1 y hasta 2—;
 * 3. multiplicando por el rendimiento, el intervalo de área;
 * 4. recién entonces se buscan ancho y alto legibles cuyo producto caiga adentro.
 *
 * Las dimensiones salen de listas de medidas que una pared de escuela puede
 * tener, con un decimal como mucho, así que el área nunca pasa de dos decimales.
 */

import {
  paramsValidator,
  variantDiagnostic,
  type CandidateContext,
  type VariantSourceSpec,
} from '@/game'

export interface MuralParams {
  /** Ancho de la pared en metros, como decimal escrito. */
  readonly width: string
  readonly height: string
  /** Metros cuadrados que cubre un litro. */
  readonly coverage: number
}

/** Los envases de la pinturería. Son catálogo de local, no parámetro. */
export const TIN_LITRES = [1, 2, 4] as const

const COVERAGES = [5, 6, 8, 10, 12] as const

/** Medidas creíbles de una pared, en décimos de metro para no usar flotantes. */
const WIDTHS_DECI = [
  25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90,
] as const
const HEIGHTS_DECI = [20, 21, 22, 23, 24, 25, 26, 27, 28, 30, 32] as const

function formatMetres(deci: number): string {
  const whole = Math.trunc(deci / 10)
  const tenth = deci % 10
  return tenth === 0 ? String(whole) : `${String(whole)}.${String(tenth)}`
}

/**
 * Litros necesarios, en centésimas de litro, con enteros.
 *
 * `ancho × alto` en décimos da el área en centésimas de m²; dividida por el
 * rendimiento da los litros en las mismas centésimas. Sin flotantes en ningún
 * paso, que es lo que hace que la comparación con los envases sea exacta.
 */
export function requiredCentilitres(params: MuralParams): number {
  const widthDeci = Math.round(Number(params.width) * 10)
  const heightDeci = Math.round(Number(params.height) * 10)
  return Math.round((widthDeci * heightDeci) / params.coverage)
}

function generateMural({ rng }: CandidateContext): MuralParams {
  const coverage = rng.pick(COVERAGES)
  // La lata de 1 L nunca puede ser la respuesta: si alcanzara, alcanzarían
  // todas y la decisión desaparecería.
  const targetIndex = rng.nextInt(1, TIN_LITRES.length - 1)
  const target = TIN_LITRES[targetIndex] ?? 2
  const previous = TIN_LITRES[targetIndex - 1] ?? 1

  // Área que hace de `target` el envase mínimo suficiente, en centésimas de m².
  const lowerExclusive = previous * coverage * 100
  const upperInclusive = target * coverage * 100

  const pairs = WIDTHS_DECI.flatMap((widthDeci) =>
    HEIGHTS_DECI.map((heightDeci) => ({
      widthDeci,
      heightDeci,
      areaCenti: widthDeci * heightDeci,
    })),
  ).filter(
    (pair) =>
      pair.areaCenti > lowerExclusive && pair.areaCenti <= upperInclusive,
  )

  const chosen = pairs.length > 0 ? rng.pick(pairs) : undefined
  if (chosen === undefined) {
    // No hay pared legible en ese intervalo. Devolver algo inválido sería
    // mentir; el candidato se descarta con la forma más chica posible y la
    // validación lo rechaza con un motivo legible.
    return { width: '0', height: '0', coverage }
  }

  return {
    width: formatMetres(chosen.widthDeci),
    height: formatMetres(chosen.heightDeci),
    coverage,
  }
}

/**
 * Oráculo independiente.
 *
 * Clasifica cada envase por su cuenta, en centésimas de litro y con enteros, sin
 * pasar por los racionales del desafío.
 */
const validateMural = paramsValidator<MuralParams>((params, ref) => {
  const diagnostics = []
  const width = Number(params.width)
  const height = Number(params.height)

  if (!(width > 0) || !(height > 0) || !(params.coverage > 0)) {
    return [
      variantDiagnostic(
        'unreasonable-value',
        ref,
        `pared de ${params.width} × ${params.height} con rendimiento ${String(params.coverage)}`,
      ),
    ]
  }

  const required = requiredCentilitres(params)
  const sufficient = TIN_LITRES.filter((litres) => litres * 100 >= required)

  if (sufficient.length === 0) {
    diagnostics.push(
      variantDiagnostic(
        'no-valid-solution',
        ref,
        `hacen falta ${String(required / 100)} L y el envase más grande tiene 4`,
      ),
    )
  }
  if (sufficient.length === TIN_LITRES.length) {
    diagnostics.push(
      variantDiagnostic(
        'trivial-decision',
        ref,
        'todos los envases alcanzan, así que elegir da igual',
      ),
    )
  }
  if (width > 12 || height > 4) {
    diagnostics.push(
      variantDiagnostic(
        'unreasonable-value',
        ref,
        `una pared de ${params.width} × ${params.height} m no es un mural de escuela`,
      ),
    )
  }
  return diagnostics
})

const AUTHORED: readonly (MuralParams & { readonly id: string })[] = [
  { id: 'pared-6x24', width: '6', height: '2.4', coverage: 8 },
  { id: 'pared-5x24', width: '5', height: '2.4', coverage: 8 },
]

export const muralPaintVariants: VariantSourceSpec<MuralParams> = {
  authored: AUTHORED,
  generator: {
    id: 'mural.coverage.reverse',
    version: '1',
    candidateSpace: 20_000,
    generate: generateMural,
  },
  validators: [validateMural],
  canonical: (params) => ({
    width: params.width,
    height: params.height,
    coverage: params.coverage,
  }),
}
