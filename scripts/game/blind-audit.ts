/**
 * Reporte de estrategia ciega sobre el catálogo aprobado de carrera completa.
 *
 *     pnpm game:blind-audit                 tabla Markdown de R, K y S
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
} from '../../tests/helpers/blind-strategy'

const rows = auditBlindStrategies(
  createFullCareerDependencies(),
  grade5VariantCatalog,
)
process.stdout.write(
  `Catálogo ${grade5VariantCatalog.catalogVersion} · contenido ${grade5VariantCatalog.contentVersion}\n\n`,
)
process.stdout.write(`${formatBlindStrategyTable(rows)}\n`)
if (process.argv.includes('--keys')) {
  process.stdout.write('\n')
  for (const row of rows.filter((entry) => entry.enumerable))
    process.stdout.write(
      `${row.templateId}\n  K: ${row.kAnswer}\n  S: ${row.sAnswer}\n  fugas de postura: ${String(row.stanceLeaks)}\n`,
    )
}
