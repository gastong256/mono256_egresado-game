import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

import { oklchToHex, parseOklch } from '../../scripts/design/color.mjs'
import { BRAND_HEX } from '@/lib/ui/brand'

/**
 * Los tokens del sistema de diseño.
 *
 * El CSS es la fuente de verdad. Estas pruebas cuidan las dos formas en que esa
 * verdad se puede filtrar a otro lado y quedar desactualizada sin que nadie se
 * entere.
 */

const tokens = readFileSync(
  fileURLToPath(new URL('../../src/styles/tokens.css', import.meta.url)),
  'utf8',
)

function colorToken(name: string): string {
  const match = new RegExp(`--color-${name}:\\s*(oklch\\([^)]*\\))`, 'u').exec(
    tokens,
  )
  if (match?.[1] === undefined) {
    throw new Error(`no existe el token --color-${name}`)
  }
  const parsed = parseOklch(match[1])
  if (parsed === undefined) {
    throw new Error(`--color-${name} no es un OKLCH válido`)
  }
  return oklchToHex(parsed)
}

describe('los hexadecimales de marca', () => {
  it('coinciden con los tokens de los que son copia', () => {
    // El manifiesto y el `themeColor` del viewport necesitan un literal porque
    // el browser los lee antes de que exista CSS. Si la paleta cambia y estos
    // no, la barra del navegador queda de otro color que la aplicación.
    expect(BRAND_HEX.canvas).toBe(colorToken('gray-50'))
    expect(BRAND_HEX.primary).toBe(colorToken('green-600'))
    expect(BRAND_HEX.ink).toBe(colorToken('gray-900'))
  })
})

describe('la paleta por defecto de Tailwind', () => {
  it('queda apagada para que no se cuele un color ajeno', () => {
    // Sin esto, `bg-blue-500` sigue funcionando y el sistema de diseño pasa a
    // ser una sugerencia. Ver ADR-015.
    expect(tokens).toContain('--color-*: initial;')
  })

  it('apaga también las escalas de texto y radio que el sistema reemplaza', () => {
    expect(tokens).toContain('--text-*: initial;')
    expect(tokens).toContain('--radius-*: initial;')
    expect(tokens).toContain('--shadow-*: initial;')
  })
})
