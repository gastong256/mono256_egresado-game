/**
 * Números escritos como se escriben acá.
 *
 * El motor formatea en una forma canónica y neutral —`14.40`— porque su salida
 * entra en estado determinista y no puede depender de una locale. Cómo se le
 * muestra una medida a un estudiante argentino es una decisión de producto, y
 * por eso vive en el contenido, al lado de `pesos.ts` y por la misma razón.
 *
 * Los separadores están escritos a mano, sin `Intl`: la salida tiene que ser
 * idéntica en cualquier dispositivo, y una tabla de locales del sistema no da
 * esa garantía.
 */

import { formatDecimal, type Rational } from '@/game'

/** Punto de miles, como se escribe acá. */
function group(digits: string): string {
  return digits.replace(/\B(?=(\d{3})+(?!\d))/gu, '.')
}

/**
 * Un decimal canónico, reescrito en castellano.
 *
 * `14.40` → `14,40`. Coma decimal y punto de miles: al revés de como llega.
 */
export function decimal(canonical: string): string {
  const negative = canonical.startsWith('-')
  const unsigned = negative ? canonical.slice(1) : canonical
  const [whole = '0', fraction] = unsigned.split('.')
  const body =
    fraction === undefined ? group(whole) : `${group(whole)},${fraction}`
  return negative ? `−${body}` : body
}

/**
 * Una cantidad del motor, escrita en castellano con la precisión pedida.
 *
 * Conserva los ceros de cola: `14,40 m²` y `0,20 L` son resultados de una cuenta
 * y ahí la precisión *es* el punto — recortarlos diría que la cuenta dio redonda
 * cuando no dio.
 */
export function cifra(value: Rational, decimals: number): string {
  return decimal(formatDecimal(value, decimals))
}

/**
 * Una medida, con la precisión que necesita y ni un decimal más.
 *
 * Una pared de `6 × 2,4` metros se escribe así y no `6,0 × 2,4`: el cero de más
 * sugiere una precisión que la medida no tiene, y en una caja de dato de 21 px
 * es un dígito que compite con el que importa. La superficie sí conserva sus dos
 * decimales, y para eso está `cifra`.
 */
export function medida(value: Rational, decimals: number): string {
  const written = cifra(value, decimals)
  // Se recorta sólo la cola de ceros, nunca un dígito significativo.
  return written.includes(',') ? written.replace(/,?0+$/u, '') : written
}
