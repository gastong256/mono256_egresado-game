#!/usr/bin/env node
/**
 * Guardarraíl del sistema de diseño.
 *
 * Impide que una pantalla vuelva a decidir por su cuenta un color, un tamaño de
 * texto o un radio. La defensa principal ya está en el CSS —la paleta por
 * defecto de Tailwind está apagada, así que `bg-blue-500` directamente no
 * existe—, pero eso no cubre un hexadecimal escrito a mano ni el uso de la
 * paleta cruda en una pantalla.
 *
 * Es a propósito un script corto con reglas contadas y no un plugin de ESLint:
 * el objetivo es atajar las cuatro formas conocidas de deriva, no auditar
 * estética.
 */

import { readFileSync } from 'node:fs'
import { globSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const root = new URL('../../', import.meta.url)
const rootPath = fileURLToPath(root)

/**
 * Dónde rige cada regla.
 *
 * La capa de tema (`src/styles`) es la dueña de los valores crudos, y la vitrina
 * de desarrollo tiene que poder mostrar la paleta primitiva: son las dos únicas
 * excepciones, y son excepciones de ubicación, no de criterio.
 */
const PRODUCT_GLOBS = ['src/app/**/*.{ts,tsx}', 'src/components/**/*.{ts,tsx}']
const EXEMPT = ['src/components/dev/']

const UTILITY_PREFIX =
  '(?:bg|text|border|outline|ring|fill|stroke|accent|divide|placeholder|caret|shadow|from|via|to)'

/** Los pigmentos de `tokens.css`. Una pantalla consume roles, no pigmentos. */
const PIGMENTS = [
  'paper(?:-grid|-sunken)?',
  'graphite',
  'hairline',
  'ink-(?:900|700|500)',
  'bottle-(?:050|600|800)',
  'tartan-(?:050|600)',
  'lime-(?:300|400)',
  'slate-(?:300|500|600|800|900)',
  'void',
  'neon-(?:400|500)',
  'coral-400',
  'ash-400',
].join('|')

const RULES = [
  {
    id: 'paleta-cruda',
    // `bg-bottle-600` en una pantalla en lugar de `bg-green`.
    pattern: new RegExp(`\\b${UTILITY_PREFIX}-(?:${PIGMENTS})\\b`, 'gu'),
    message:
      'usa un pigmento directamente; consumí un token semántico (bg-canvas, text-ink-label, border-rule, bg-green…)',
  },
  {
    id: 'color-arbitrario',
    // Un color escrito a mano no pasa por el gate de contraste.
    pattern: /#[0-9a-fA-F]{3,8}\b|\b(?:rgb|rgba|hsl|hsla|oklch|oklab)\(/gu,
    message:
      'escribe un color a mano; definilo como token en src/styles y consumilo por su nombre',
  },
  {
    id: 'escala-tipografica-ajena',
    // Las escalas por defecto están apagadas: si aparecen, no generan nada.
    pattern: /\btext-(?:xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl|8xl|9xl)\b/gu,
    message:
      'usa un tamaño de Tailwind que este proyecto apagó; elegí un rol (text-body, text-display, text-data…)',
  },
  {
    id: 'radio-ajeno',
    // El radio es 0 en todo el sistema v0.2. No hay excepciones y no hay una
    // escala de radios: si aparece `rounded-`, la pantalla dejó de ser Egresado.
    pattern: /\brounded(?:-[a-z0-9[\]]+)*\b/gu,
    message:
      'el radio del sistema es 0; una tarjeta redondeada rompe la geometría de impreso de v0.2',
  },
  {
    id: 'sombra-ajena',
    // La profundidad la da el peso del borde y el contraste de fondo. La única
    // excepción es el resplandor de Aura, que no es sombra sino luz.
    pattern: /\bshadow-(?!aura)[a-z0-9[\]-]+\b/gu,
    message:
      'el sistema no usa sombras; la única excepción es text-shadow-aura dentro del bloque negro',
  },
]

const files = PRODUCT_GLOBS.flatMap((pattern) =>
  globSync(pattern, { cwd: rootPath }),
)
  .filter((file) => !EXEMPT.some((prefix) => file.startsWith(prefix)))
  .sort()

const findings = []

for (const file of files) {
  const source = readFileSync(fileURLToPath(new URL(file, root)), 'utf8')
  const lines = source.split('\n')

  for (const rule of RULES) {
    lines.forEach((line, index) => {
      // Un comentario puede nombrar una regla para explicarla; lo que importa
      // es el código.
      const trimmed = line.trim()
      if (trimmed.startsWith('*') || trimmed.startsWith('//')) return

      for (const match of line.matchAll(rule.pattern)) {
        findings.push({
          file,
          line: index + 1,
          rule: rule.id,
          match: match[0],
          message: rule.message,
        })
      }
    })
  }
}

console.log('Guardarraíl del sistema de diseño')
console.log(`  archivos    ${String(files.length)}`)
console.log(`  reglas      ${String(RULES.length)}`)
console.log(`  hallazgos   ${String(findings.length)}`)
console.log()

for (const finding of findings) {
  console.error(
    `  ${finding.file}:${String(finding.line)}  [${finding.rule}] "${finding.match}" — ${finding.message}`,
  )
}

if (findings.length > 0) {
  process.exit(1)
}

console.log('Ninguna pantalla decide colores, tamaños ni radios por su cuenta.')
