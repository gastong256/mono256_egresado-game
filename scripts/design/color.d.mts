/**
 * Tipos de `color.mjs`.
 *
 * El script es JavaScript porque lo corren los gates sin pasar por un
 * transpilador. Los tipos viven acá para que también se pueda importar desde un
 * test de TypeScript sin perder el chequeo.
 */

export interface Oklch {
  readonly l: number
  readonly c: number
  readonly h: number
}

export function parseOklch(value: string): Oklch | undefined
export function oklchToLinearRgb(color: Oklch): {
  r: number
  g: number
  b: number
}
export function isOutOfGamut(color: Oklch, tolerance?: number): boolean
export function oklchToHex(color: Oklch): string
export function relativeLuminance(color: Oklch): number
export function contrastRatio(foreground: Oklch, background: Oklch): number
