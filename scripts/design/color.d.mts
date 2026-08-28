/**
 * Tipos de `color.mjs`.
 *
 * El script es JavaScript porque lo corren los gates sin pasar por un
 * transpilador. Los tipos viven acá para que también se pueda importar desde un
 * test de TypeScript sin perder el chequeo.
 */

export interface Rgb {
  readonly r: number
  readonly g: number
  readonly b: number
}

export function parseHex(value: string): Rgb | undefined
export function toHex(color: Rgb): string
export function relativeLuminance(color: Rgb): number
export function contrastRatio(foreground: Rgb, background: Rgb): number
