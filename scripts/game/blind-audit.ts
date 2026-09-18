/**
 * Reporte de estrategia ciega sobre el catálogo aprobado de carrera completa.
 *
 *     pnpm game:blind-audit                 tabla Markdown de R, K y S
 *     pnpm game:blind-audit -- --coverage   matriz de cobertura de las 42 Templates
 *     pnpm game:blind-audit -- --keys       agrega la respuesta que logra K y S
 *
 * No afirma nada: sirve para registrar una línea base antes de cambiar
 * contenido y para el re-audit. Los techos del contrato viven en
 * `tests/integration/blind-strategy-audit.test.ts`.
 */
import { createFullCareerDependencies } from '../../src/content/full-career'
import { grade5VariantCatalog } from '../../src/content/grade-5'
import {
  auditBlindStrategies,
  formatBlindStrategyTable,
  formatCoverageMatrix,
} from '../../tests/helpers/blind-strategy'

const dependencies = createFullCareerDependencies()
const timing = process.argv.includes('--timing')
const measured: { template: string; milliseconds: number }[] = []
const start = performance.now()
const rows = timing
  ? [
      ...new Set(grade5VariantCatalog.entries.map((entry) => entry.templateId)),
    ].flatMap((id) => {
      const before = performance.now()
      const result = auditBlindStrategies(dependencies, grade5VariantCatalog, [
        id,
      ])
      measured.push({ template: id, milliseconds: performance.now() - before })
      return result
    })
  : auditBlindStrategies(dependencies, grade5VariantCatalog)
const elapsed = performance.now() - start
process.stdout.write(
  `Catálogo ${grade5VariantCatalog.catalogVersion} · contenido ${grade5VariantCatalog.contentVersion}\n\n`,
)
process.stdout.write(`${formatBlindStrategyTable(rows)}\n`)
if (process.argv.includes('--coverage')) {
  process.stdout.write(`\n${formatCoverageMatrix(rows)}\n`)
  const modes = new Map<string, number>()
  for (const row of rows) modes.set(row.mode, (modes.get(row.mode) ?? 0) + 1)
  process.stdout.write(
    `\n${[...modes].map(([mode, count]) => `${mode} ${String(count)}`).join(' · ')}\n`,
  )
}
if (process.argv.includes('--keys')) {
  process.stdout.write('\n')
  for (const row of rows.filter(
    (entry) => entry.mode === 'AUDITED_EXHAUSTIVELY',
  ))
    process.stdout.write(
      `${row.templateId}\n  K: ${row.kAnswer}\n  S: ${row.sAnswer}\n  fugas de postura: ${String(row.stanceLeaks)}\n`,
    )
}

if (timing) {
  process.stdout.write(
    `\nTiempo ${elapsed.toFixed(1)} ms · Node ${process.version}\n`,
  )
  for (const entry of measured.sort((a, b) => b.milliseconds - a.milliseconds))
    process.stdout.write(
      `${entry.template}: ${entry.milliseconds.toFixed(1)} ms\n`,
    )
}
