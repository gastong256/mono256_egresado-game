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

const RULES = [
  {
    id: 'paleta-cruda',
    // `bg-green-600` en una pantalla en lugar de `bg-primary`.
    pattern:
      /\b(?:bg|text|border|outline|ring|fill|stroke|accent|divide|placeholder|from|via|to)-(?:green|red|gray)-(?:50|100|200|300|400|500|600|700|800|900|950)\b/gu,
    message:
      'usa la paleta primitiva directamente; consumí un token semántico (bg-primary, text-foreground-muted, border-line…)',
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
      'usa un tamaño de Tailwind que este proyecto apagó; elegí un rol (text-body, text-heading, text-data…)',
  },
  {
    id: 'radio-ajeno',
    pattern: /\brounded-(?:xs|sm|md|lg|xl|2xl|3xl|4xl)\b/gu,
    message:
      'usa un radio de Tailwind que este proyecto apagó; elegí rounded-control, rounded-surface, rounded-card o rounded-pill',
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
