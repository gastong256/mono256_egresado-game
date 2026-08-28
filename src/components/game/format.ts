/**
 * Cómo se escriben los números de Egresado.
 *
 * El motor produce valores canónicos y neutrales porque su salida entra en
 * estado determinista y no puede depender de una locale. Cómo se le muestra un
 * número a un estudiante argentino es una decisión de producto, y por eso vive
 * en la capa de presentación.
 *
 * Los separadores están escritos a mano, sin `Intl`: la salida tiene que ser
 * idéntica en cualquier dispositivo, y una tabla de locales del sistema no da
 * esa garantía. La plata sigue su propio camino en `src/content/pesos.ts`.
 */

/** Punto de miles, como se escribe acá. */
function group(digits: string): string {
  return digits.replace(/\B(?=(\d{3})+(?!\d))/gu, '.')
}

/**
 * Promedio: un decimal, coma decimal, siempre los dos dígitos.
 *
 * `8` se escribe `8,0`. Un promedio sin decimal se lee como un entero suelto y
 * pierde la forma de nota.
 */
export function formatPromedio(value: number): string {
  return value.toFixed(1).replace('.', ',')
}

/** Equipo: cifra sola, sin barra y sin «sobre 100». */
export function formatEquipo(value: number): string {
  return String(Math.round(value))
}

/**
 * Aura: signo explícito y punto de miles.
 *
 * El signo va siempre, incluso en positivo: es lo que distingue un puntaje con
 * signo de un contador. El negativo usa el menos tipográfico `−` (U+2212) y no
 * un guion, porque a 32 px un guion se lee como un renglón.
 */
export function formatAura(value: number): string {
  const points = Math.round(value)
  const sign = points < 0 ? '−' : '+'
  return `${sign}${group(String(Math.abs(points)))}`
}

/** Porcentaje con espacio antes del signo, como se escribe en castellano. */
export function formatPercent(value: number): string {
  return `${String(Math.round(value))} %`
}

/** El guion largo con el que se dibuja una dimensión todavía sin establecer. */
export const NOT_ESTABLISHED = '—'
