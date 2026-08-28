#!/usr/bin/env node
/**
 * Gate de contraste del sistema de diseño.
 *
 * Lee la paleta de `tokens.css` y los tokens semánticos de `theme.css`, resuelve
 * cada rol hasta su color real y verifica las combinaciones que el producto usa
 * de verdad contra los mínimos de WCAG 2.2.
 *
 * Esto existe porque «se ve oscuro» no es una medición. En dos rondas anteriores
 * del sistema el token de etiqueta falló AA a 4,1–4,4:1 pareciendo
 * suficientemente gris; el gate lo dice antes de que llegue a una pantalla.
 *
 * La fuente de verdad es el CSS. Este script no define ningún color: si alguien
 * mueve un token y rompe una combinación, falla acá.
 */

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { contrastRatio, parseHex } from './color.mjs'

const root = new URL('../../', import.meta.url)
const read = (relative) =>
  readFileSync(fileURLToPath(new URL(relative, root)), 'utf8')

/** `--color-bottle-600: #1B6B3A` → paleta primitiva. */
function readPalette(css) {
  const palette = new Map()
  for (const [, name, value] of css.matchAll(
    /--color-([a-z0-9-]+):\s*(#[0-9a-fA-F]{3,8})\s*;/gu,
  )) {
    const parsed = parseHex(value)
    if (parsed !== undefined) palette.set(name, parsed)
  }
  return palette
}

/** `--green: var(--color-bottle-600)` → rol semántico. */
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
  // Tinta sobre las tres superficies de papel.
  [4.5, 'ink', 'canvas'],
  [4.5, 'ink', 'surface'],
  [4.5, 'ink', 'canvas-sunken'],
  [4.5, 'ink-secondary', 'canvas'],
  [4.5, 'ink-secondary', 'surface'],
  [4.5, 'ink-secondary', 'canvas-sunken'],
  // El piso del sistema: 5,6:1 para etiquetas de 9–11 px. No aclararlo.
  [4.5, 'ink-label', 'canvas'],
  [4.5, 'ink-label', 'surface'],
  [4.5, 'ink-label', 'canvas-sunken'],

  // Estado y marca de corrección, como texto sobre papel.
  [4.5, 'green', 'canvas'],
  [4.5, 'green', 'surface'],
  [4.5, 'red', 'canvas'],
  [4.5, 'red', 'surface'],
  [4.5, 'green-deep', 'green-tint'],

  // El primario y su deshabilitado.
  [4.5, 'on-action', 'action'],
  [4.5, 'on-action', 'action-hover'],
  [4.5, 'on-action-disabled', 'action-disabled'],

  // Texto blanco sobre relleno: pestaña del panel, chips, glifo de resultado.
  [4.5, 'outcome-optimal', 'canvas'],
  [4.5, 'outcome-partial', 'canvas'],
  [4.5, 'outcome-insufficient', 'canvas'],

  // La superficie de decisión.
  [4.5, 'on-decision', 'decision'],
  [4.5, 'on-decision', 'decision-raised'],
  [4.5, 'on-decision-strong', 'decision'],
  [4.5, 'on-decision-muted', 'decision'],
  [4.5, 'on-decision-muted', 'decision-raised'],
  /*
    El primario deshabilitado dentro del bloque oscuro. WCAG 2.2 exime a los
    controles inactivos del mínimo de texto (SC 1.4.3, «Incidental»), así que
    acá se sostiene el piso no textual de 3:1 en lugar de 4,5. El disabled nunca
    es la única explicación: la línea de consigna dice qué falta.
  */
  [3, 'on-action-disabled-dark', 'action-disabled-dark'],
  [4.5, 'on-selected-box', 'selected-box'],

  // Aura, la única isla negra. Su verde sobre papel fallaría, y por eso la
  // regla de que vive sólo acá se auto-impone.
  [4.5, 'aura-gain', 'aura-surface'],
  [4.5, 'aura-loss', 'aura-surface'],
  [4.5, 'aura-label', 'aura-surface'],

  // Contraste no textual: bordes de control e indicadores de estado.
  [3, 'rule-strong', 'canvas'],
  [3, 'rule-strong', 'surface'],
  [3, 'progress-done', 'canvas'],
  [3, 'progress-current', 'canvas'],
  /*
    `progress-pending` y `estilo-reference` no están en esta lista a propósito.
    Las dos son andamiaje: la celda pendiente y el triángulo de referencia no
    portan información que no esté también escrita —«Evento 3 de 7» y los tres
    porcentajes del label del triángulo—, y los estados que sí informan se
    distinguen por forma (relleno · contorno de 2 px · regla de 1 px). Subirles
    el contraste las convertiría en ruido que compite con el dato.
  */
  [3, 'focus-ring', 'canvas'],
  [3, 'focus-ring', 'action'],
  [3, 'focus-ring-inverse', 'decision'],
  [3, 'decision-rule', 'decision'],
  [3, 'decision-rule-hover', 'decision'],
  [3, 'aura-bracket', 'aura-surface'],
  [3, 'estilo-axis', 'surface'],
]

let failures = 0
const lines = []

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
console.log(`  pigmentos   ${String(palette.size)}`)
console.log(`  roles       ${String(semantics.size)}`)
console.log(`  pares       ${String(PAIRS.length)}`)
console.log()
for (const line of lines) {
  console.log(line)
}
console.log()

if (failures > 0) {
  console.error(
    `${String(failures)} combinación(es) por debajo del mínimo de WCAG 2.2.`,
  )
  process.exit(1)
}

console.log('Todas las combinaciones que el producto pinta llegan al mínimo.')
