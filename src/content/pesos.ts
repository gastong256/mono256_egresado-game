/**
 * Precios en pesos, escritos como se escriben acá.
 *
 * El motor formatea dinero en una forma canónica y neutral —`24000.00`— porque
 * su salida entra en estado determinista y no puede depender de una locale.
 * Cómo se le muestra un precio a un estudiante argentino es una decisión de
 * producto, y por eso vive en el contenido.
 *
 * Los separadores están escritos a mano, sin `Intl`: la salida tiene que ser
 * idéntica en cualquier dispositivo, y una tabla de locales del sistema no da
 * esa garantía.
 */

import { formatMoney, money } from '@/game'

/**
 * Formatea una cantidad en unidades menores como precio.
 *
 * Los precios del juego son pesos enteros, así que los centavos sólo aparecen
 * si realmente los hay.
 */
export function pesos(minorUnits: number): string {
  const canonical = formatMoney(money(minorUnits))
  const negative = canonical.startsWith('-')
  const [whole = '0', cents = '00'] = (
    negative ? canonical.slice(1) : canonical
  ).split('.')

  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/gu, '.')
  const decimals = cents === '00' ? '' : `,${cents}`

  return `${negative ? '-' : ''}$ ${grouped}${decimals}`
}
