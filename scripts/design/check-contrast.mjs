#!/usr/bin/env node
/**
 * Gate de contraste del sistema de diseño.
 *
 * Lee la paleta de `tokens.css` y los tokens semánticos de `theme.css`, resuelve
 * cada rol hasta su color real y verifica las combinaciones que el producto usa
 * de verdad contra los mínimos de WCAG 2.2.
 *
 * Esto existe porque «se ve oscuro» no es una medición. Un verde de marca puede
 * parecer suficientemente oscuro y quedarse en 4,27:1 con texto blanco; el gate
 * lo dice antes de que llegue a una pantalla.
 *
 * La fuente de verdad es el CSS. Este script no define ningún color: si alguien
 * mueve un token y rompe una combinación, falla acá.
 */

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import {
  contrastRatio,
  isOutOfGamut,
  oklchToHex,
  parseOklch,
} from './color.mjs'

const root = new URL('../../', import.meta.url)
const read = (relative) =>
  readFileSync(fileURLToPath(new URL(relative, root)), 'utf8')

/** `--color-green-600: oklch(...)` → paleta primitiva. */
function readPalette(css) {
  const palette = new Map()
  for (const [, name, value] of css.matchAll(
    /--color-([a-z0-9-]+):\s*(oklch\([^)]*\))/gu,
  )) {
    const parsed = parseOklch(value)
    if (parsed !== undefined) palette.set(name, parsed)
  }
  return palette
}

/** `--primary: var(--color-green-600)` → rol semántico. */
function readSemantics(css) {
  const semantics = new Map()
  for (const [, name, target] of css.matchAll(
    /^\s{2}--([a-z0-9-]+):\s*var\(--color-([a-z0-9-]+)\);/gmu,
  )) {
    semantics.set(name, target)
  }
  return semantics
}

const palette = readPalette(read('src/styles/tokens.css'))
const semantics = readSemantics(read('src/styles/theme.css'))

// El blanco no está en OKLCH en el CSS; acá se representa exacto.
palette.set('white', { l: 1, c: 0, h: 0 })

function resolve(role) {
  const target = semantics.get(role)
  if (target === undefined) {
    throw new Error(`el rol semántico "${role}" no existe en theme.css`)
  }
  const color = palette.get(target)
  if (color === undefined) {
    throw new Error(
      `el rol "${role}" apunta a --color-${target}, que no existe`,
    )
  }
  return { color, target }
}

/**
 * Las combinaciones que el producto pinta de verdad.
 *
 * 4,5 para texto normal; 3 para texto grande y para contorno de un control
 * (contraste no textual). Lo que no está acá es porque no se usa: agregar una
 * combinación nueva a la UI significa agregarla también a esta lista.
 */
const PAIRS = [
  [4.5, 'foreground', 'canvas'],
  [4.5, 'foreground', 'surface'],
  [4.5, 'foreground', 'surface-muted'],
  [4.5, 'foreground-muted', 'canvas'],
  [4.5, 'foreground-muted', 'surface'],
  [4.5, 'foreground-muted', 'surface-muted'],
  [4.5, 'primary-foreground', 'primary'],
  [4.5, 'primary-foreground', 'primary-hover'],
  [4.5, 'primary-foreground', 'primary-active'],
  [4.5, 'accent-foreground', 'accent'],
  [4.5, 'accent-foreground', 'accent-hover'],
  [4.5, 'danger-foreground', 'danger'],
  [4.5, 'danger-foreground', 'danger-hover'],
  [4.5, 'primary-subtle-foreground', 'primary-subtle'],
  [4.5, 'accent-subtle-foreground', 'accent-subtle'],
  [4.5, 'selected-foreground', 'selected-surface'],
  [4.5, 'optimal-foreground', 'optimal-surface'],
  [4.5, 'efficient-foreground', 'efficient-surface'],
  [4.5, 'functional-foreground', 'functional-surface'],
  [4.5, 'invalid-foreground', 'invalid-surface'],
  [4.5, 'data-foreground', 'surface'],
  [4.5, 'data-foreground', 'surface-muted'],
  [4.5, 'data-label', 'surface-muted'],
  [4.5, 'danger', 'surface'],
  // Contraste no textual: contornos de controles e indicadores de estado.
  [3, 'line-interactive', 'surface'],
  [3, 'line-interactive', 'canvas'],
  [3, 'line-interactive', 'surface-muted'],
  [3, 'line-selected', 'surface'],
  [3, 'line-selected', 'selected-surface'],
  [3, 'focus', 'focus-contrast'],
  [3, 'progress-fill', 'progress-track'],
  [3, 'optimal-line', 'optimal-surface'],
  [3, 'efficient-line', 'efficient-surface'],
  [3, 'functional-line', 'functional-surface'],
  [3, 'invalid-line', 'invalid-surface'],
]

let failures = 0
const lines = []

for (const [name, color] of palette) {
  if (isOutOfGamut(color)) {
    failures += 1
    lines.push(`  FUERA DE GAMUT  --color-${name} (${oklchToHex(color)})`)
  }
}

for (const [minimum, foregroundRole, backgroundRole] of PAIRS) {
  const foreground = resolve(foregroundRole)
  const background = resolve(backgroundRole)
  const ratio = contrastRatio(foreground.color, background.color)
  const ok = ratio >= minimum

  if (!ok) failures += 1
  lines.push(
    `  ${ok ? 'ok   ' : 'FALLA'} ${ratio.toFixed(2).padStart(6)}:1  (min ${String(minimum)})  ${foregroundRole} sobre ${backgroundRole}`,
  )
}

console.log('Contraste del sistema de diseño')
console.log(`  paleta      ${String(palette.size)} colores`)
console.log(`  roles       ${String(semantics.size)} tokens semánticos`)
console.log(`  pares       ${String(PAIRS.length)} combinaciones`)
console.log()

const verbose = process.argv.includes('--verbose')
for (const line of lines) {
  if (verbose || line.includes('FALLA') || line.includes('FUERA')) {
    console.log(line)
  }
}

console.log()
if (failures > 0) {
  console.error(`${String(failures)} combinaciones no llegan al mínimo.`)
  process.exit(1)
}
console.log('Todas las combinaciones cumplen WCAG 2.2 AA.')
