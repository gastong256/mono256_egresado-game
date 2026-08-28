import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

import { contrastRatio, parseHex } from '../../scripts/design/color.mjs'
import { BRAND_HEX } from '@/lib/ui/brand'

/**
 * Los tokens del sistema de diseño.
 *
 * El CSS es la fuente de verdad. Estas pruebas cuidan las formas en que esa
 * verdad se puede filtrar a otro lado y quedar desactualizada sin que nadie se
 * entere, y las dos invariantes de v0.2 que no son cuestión de gusto: radio 0 y
 * sin sombras.
 */

const tokens = readFileSync(
  fileURLToPath(new URL('../../src/styles/tokens.css', import.meta.url)),
  'utf8',
)

const theme = readFileSync(
  fileURLToPath(new URL('../../src/styles/theme.css', import.meta.url)),
  'utf8',
)

const base = readFileSync(
  fileURLToPath(new URL('../../src/styles/base.css', import.meta.url)),
  'utf8',
)

function colorToken(name: string): string {
  const match = new RegExp(
    `--color-${name}:\\s*(#[0-9a-fA-F]{3,8})\\s*;`,
    'u',
  ).exec(tokens)
  if (match?.[1] === undefined) {
    throw new Error(`no existe el token --color-${name}`)
  }
  return match[1].toLowerCase()
}

describe('los hexadecimales de marca', () => {
  it('coinciden con los tokens de los que son copia', () => {
    // El manifiesto y el `themeColor` del viewport necesitan un literal porque
    // el browser los lee antes de que exista CSS. Si la paleta cambia y estos
    // no, la barra del navegador queda de otro color que la aplicación.
    expect(BRAND_HEX.canvas).toBe(colorToken('paper'))
    expect(BRAND_HEX.green).toBe(colorToken('bottle-600'))
    expect(BRAND_HEX.ink).toBe(colorToken('ink-900'))
  })
})

describe('la paleta por defecto de Tailwind', () => {
  it('queda apagada para que no se cuele un color ajeno', () => {
    // Sin esto, `bg-blue-500` sigue funcionando y el sistema de diseño pasa a
    // ser una sugerencia. Ver ADR-015.
    expect(tokens).toContain('--color-*: initial;')
  })

  it('apaga también las escalas de texto, radio y sombra que v0.2 no usa', () => {
    expect(tokens).toContain('--text-*: initial;')
    // Radio 0 siempre y ninguna sombra: apagar las dos escalas es lo que hace
    // que `rounded-lg` y `shadow-md` directamente no existan.
    expect(tokens).toContain('--radius-*: initial;')
    expect(tokens).toContain('--shadow-*: initial;')
  })

  it('no define ningún radio propio', () => {
    // La única mención de radio en el sistema es la que lo apaga.
    const radii = [...tokens.matchAll(/--radius-[a-z0-9-]+:/gu)]
    expect(radii).toHaveLength(0)
  })
})

describe('la superficie del juego', () => {
  it('define la cuadrícula como una utilidad y no por pantalla', () => {
    // `.eg-canvas` es el cambio de una línea que hace que algo se vea como
    // Egresado. Si cada pantalla la reescribiera, dejaría de ser un sistema.
    expect(base).toContain('@utility eg-canvas')
    expect(base).toContain('var(--grid-cell)')
  })

  it('tiene una sola regla de foco, y es negra', () => {
    expect(base).toContain(':focus-visible')
    expect(base).toContain('var(--focus-ring)')
    expect(theme).toContain('--focus-ring: var(--color-ink-900);')
  })

  it('lleva las cinco duraciones a 1 ms bajo prefers-reduced-motion', () => {
    const block = base.slice(base.indexOf('@media (prefers-reduced-motion'))
    for (const duration of [
      'select',
      'enter',
      'resolve',
      'progress',
      'celebrate',
    ]) {
      expect(block).toContain(`--duration-${duration}: 1ms;`)
    }
  })
})

describe('las reglas de color que el sistema se auto-impone', () => {
  it('mantiene el verde de Aura fuera del papel, porque ahí fallaría', () => {
    // No es una preferencia estética: es la razón por la que Aura vive dentro de
    // la única superficie negra del sistema.
    const auraGain = parseHex(colorToken('neon-400'))
    const canvas = parseHex(colorToken('paper'))
    const auraSurface = parseHex(colorToken('void'))
    expect(auraGain).toBeDefined()
    expect(canvas).toBeDefined()
    expect(auraSurface).toBeDefined()
    if (!auraGain || !canvas || !auraSurface) return

    expect(contrastRatio(auraGain, canvas)).toBeLessThan(4.5)
    expect(contrastRatio(auraGain, auraSurface)).toBeGreaterThanOrEqual(4.5)
  })

  it('sostiene el piso de 5,6:1 para las etiquetas de 9–11 px', () => {
    // Nota histórica: en dos rondas anteriores este token falló AA a 4,1–4,4:1.
    // #5A5F5C es el piso; no aclararlo.
    const label = parseHex(colorToken('ink-500'))
    const canvas = parseHex(colorToken('paper'))
    expect(label).toBeDefined()
    expect(canvas).toBeDefined()
    if (!label || !canvas) return

    expect(contrastRatio(label, canvas)).toBeGreaterThanOrEqual(5.5)
  })
})
