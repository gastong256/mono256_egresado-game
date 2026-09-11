/**
 * Variant catalog tooling.
 *
 * Three verbs over the same pipeline:
 *
 *     pnpm game:variants build     rebuild the committed catalog artifact
 *     pnpm game:variants check     rebuild in memory and refuse any drift
 *     pnpm game:variants audit     sweep a large candidate space and report
 *
 * `check` is the fast one and belongs in the standard gate: it proves the
 * committed catalog is exactly what today's code produces, and that every entry
 * still validates. `audit` is the slow one and is run when generators change or
 * before a content freeze.
 */

import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'

import {
  auditVariantCatalog,
  buildVariantCatalog,
  hasNoErrors,
  serializeCatalog,
  verifyCatalogIntegrity,
  type ApprovedVariantCatalog,
} from '../../src/game'
import { createGrade7Dependencies } from '../../src/content/grade-7'
import { createGrade1Catalog } from '../../src/content/grade-1/registry'
import {
  GRADE_1_CONTENT_VERSION,
  GRADE_1_VARIANT_CATALOG_VERSION,
} from '../../src/content/grade-1/versions'
import {
  GRADE_7_CONTENT_VERSION,
  GRADE_7_VARIANT_CATALOG_VERSION,
} from '../../src/content/grade-7/versions'

/**
 * Una versión de catálogo, un archivo.
 *
 * El nombre lleva la versión adentro porque una versión publicada no se edita:
 * agregar contenido produce la siguiente, y la anterior queda como estaba.
 */
const CATALOG_PATH = path.join(
  'src',
  'content',
  'grade-7',
  `variant-catalog.${GRADE_7_VARIANT_CATALOG_VERSION}.json`,
)

/** What the committed artifact is built from. Changing it changes the catalog. */
const BUILD = {
  catalogVersion: GRADE_7_VARIANT_CATALOG_VERSION,
  contentVersion: GRADE_7_CONTENT_VERSION,
  candidatesPerTemplate: 400,
  approvalTarget: 24,
} as const

function numberArg(argv: readonly string[], flag: string): number | undefined {
  const raw = argv.find((entry) => entry.startsWith(`${flag}=`))
  if (raw === undefined) return undefined
  const parsed = Number.parseInt(raw.slice(flag.length + 1), 10)
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : undefined
}

function write(line: string): void {
  process.stdout.write(`${line}\n`)
}

function main(): void {
  const argv = process.argv.slice(2)
  const command = argv.find((entry) => !entry.startsWith('-')) ?? 'check'
  const grade1 = argv.includes('--content=grade-1')
  const contentCatalog = grade1
    ? createGrade1Catalog()
    : createGrade7Dependencies().catalog
  const build = grade1
    ? {
        ...BUILD,
        contentVersion: GRADE_1_CONTENT_VERSION,
        catalogVersion: GRADE_1_VARIANT_CATALOG_VERSION,
      }
    : BUILD
  const catalogPath = grade1
    ? path.join(
        'src',
        'content',
        'grade-1',
        `variant-catalog.${GRADE_1_VARIANT_CATALOG_VERSION}.json`,
      )
    : CATALOG_PATH

  if (command === 'build' || command === 'check') {
    const { catalog, report } = buildVariantCatalog(contentCatalog, build)
    const serialized = serializeCatalog(catalog)

    write('Egresado variant catalog')
    write(`  catalog       ${catalog.catalogVersion}`)
    write(`  content       ${catalog.contentVersion}`)
    write(`  attempted     ${String(report.attempted)}`)
    write(`  approved      ${String(report.approved)}`)
    write(`  rejected      ${String(report.rejected)}`)
    write(`  duplicates    ${String(report.duplicates)}`)

    if (command === 'build') {
      writeFileSync(catalogPath, serialized, 'utf8')
      write(`  written       ${catalogPath}`)
      return
    }

    const committed = readFileSync(catalogPath, 'utf8')
    if (committed !== serialized) {
      write('')
      write(
        `The committed catalog is not what this code produces. Run: pnpm game:variants build`,
      )
      process.exitCode = 1
      return
    }

    const parsed: unknown = JSON.parse(committed)
    const issues = verifyCatalogIntegrity(
      contentCatalog,
      parsed as ApprovedVariantCatalog,
      { contentVersion: build.contentVersion },
    )
    for (const issue of issues) {
      write(
        `  ${issue.severity}: ${issue.code} ${issue.subject} — ${issue.message}`,
      )
    }
    if (!hasNoErrors(issues)) {
      process.exitCode = 1
      return
    }
    write('  integrity     ok')
    return
  }

  if (command === 'audit') {
    const candidates = numberArg(argv, '--candidates') ?? 10_000
    const approvals = numberArg(argv, '--approve') ?? 2_000
    const { catalog, report } = buildVariantCatalog(contentCatalog, {
      catalogVersion: `${build.catalogVersion}-audit`,
      contentVersion: build.contentVersion,
      candidatesPerTemplate: candidates,
      approvalTarget: approvals,
    })
    const audit = auditVariantCatalog(contentCatalog, catalog, report)

    write('Egresado variant audit')
    write(`  candidates/template  ${String(candidates)}`)
    write(`  attempted            ${String(audit.attempted)}`)
    write(`  approved             ${String(audit.approved)}`)
    write(`  rejected             ${String(audit.rejected)}`)
    write(`  duplicates           ${String(audit.duplicates)}`)
    write('')

    for (const template of audit.templates) {
      write(
        `  ${template.templateId} [${template.source}] approved=${String(template.approved)} distinct=${String(template.distinctProblems)} rejected=${(template.rejectionRate * 100).toFixed(1)}% dup=${(template.duplicateRate * 100).toFixed(1)}%`,
      )
      const positions = template.optionPositions
      if (positions !== undefined) {
        write(
          `      answer positions ${JSON.stringify(positions.byIndex)} distinct answers ${String(positions.distinctAnswers)}`,
        )
      }
      const codes = Object.entries(template.rejectionsByCode)
      if (codes.length > 0) {
        write(`      rejections ${JSON.stringify(Object.fromEntries(codes))}`)
      }
    }

    write('')
    if (audit.findings.length === 0) {
      write('  findings             none')
    }
    for (const finding of audit.findings) {
      write(
        `  ${finding.severity}: ${finding.code} ${finding.subject} — ${finding.message}`,
      )
    }
    if (!hasNoErrors(audit.findings)) {
      process.exitCode = 1
    }
    return
  }

  write(`unknown command: ${command}`)
  process.exitCode = 2
}

main()
