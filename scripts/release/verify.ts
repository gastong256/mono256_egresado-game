/**
 * Verificación del release candidate.
 *
 *     pnpm release:verify
 *     pnpm release:verify -- --update-lock     tras un cambio deliberado
 *
 * Qué comprueba, y por qué cada cosa.
 *
 * El manifiesto de `src/release/` **declara** las identidades y las huellas del
 * release; este script las **recomputa desde la fuente** y compara. Esa es la
 * única dirección en la que un congelamiento prueba algo: un manifiesto que
 * derivara sus valores del código diría siempre la verdad y no detectaría nada.
 *
 * No re-audita la matemática. Eso ya lo hacen `pnpm game:score`,
 * `pnpm game:blind-audit` y la suite de contenido, y repetirlos acá sólo haría
 * el gate más lento sin agregar una garantía. Lo que se comprueba es que lo que
 * esos gates aprobaron es exactamente lo que el release publica.
 */

import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { resolve } from 'node:path'

import {
  ACTION_LOG_VERSION,
  ENGINE_VERSION,
  SNAPSHOT_SCHEMA_VERSION,
  canonicalize,
  competitiveScorePolicyIssues,
  competitiveScorePolicies,
  isOk,
  prestigeOpportunityIssues,
  prestigePolicyIssues,
  resolveCompetitiveScorePolicy,
  RNG_ALGORITHM,
  scorePolicyDifferences,
  serializeCatalog,
  sha256Hex,
  type ApprovedVariantCatalog,
} from '@/game'
import {
  FULL_CAREER_RULESET_VERSION,
  createFullCareerDependencies,
  createFullCareerRunDescriptor,
} from '@/content/full-career'
import { careerPrestigeOpportunities } from '@/content/career-closing'
import { grade1VariantCatalog } from '@/content/grade-1'
import { grade2VariantCatalog } from '@/content/grade-2'
import { grade3VariantCatalog } from '@/content/grade-3'
import { grade4VariantCatalog } from '@/content/grade-4'
import { grade5VariantCatalog } from '@/content/grade-5'
import { rankEntries } from '@/lib/competition'
import { FAIR_EDITION_V1 } from '@/release/fair-edition-v1'
import { releaseFingerprint } from '@/release/manifest'
import { RELEASE_FINGERPRINT_LOCK } from '@/release/current'
import {
  FULL_CAREER_EDITION,
  listEditions,
} from '@/server/competition/editions'

const updateLock = process.argv.includes('--update-lock')
const manifest = FAIR_EDITION_V1
const failures: string[] = []
const checks: string[] = []

function check(label: string, problem: string | undefined): void {
  if (problem === undefined) {
    checks.push(label)
    return
  }
  failures.push(`${label}: ${problem}`)
}

function expect(label: string, actual: unknown, declared: unknown): void {
  check(
    label,
    actual === declared
      ? undefined
      : `el código dice ${String(actual)} y el manifiesto ${String(declared)}`,
  )
}

// ---------------------------------------------------------------------------
// 1. Motor
// ---------------------------------------------------------------------------

expect('engine.engineVersion', ENGINE_VERSION, manifest.engine.engineVersion)
expect(
  'engine.actionLogVersion',
  ACTION_LOG_VERSION,
  manifest.engine.actionLogVersion,
)
expect(
  'engine.snapshotVersion',
  SNAPSHOT_SCHEMA_VERSION,
  manifest.engine.snapshotVersion,
)
expect('engine.rngAlgorithm', RNG_ALGORITHM, manifest.engine.rngAlgorithm)

// ---------------------------------------------------------------------------
// 2. Ruleset y contenido de la edición
// ---------------------------------------------------------------------------

const dependencies = createFullCareerDependencies()
expect(
  'edition.rulesetVersion',
  FULL_CAREER_RULESET_VERSION,
  manifest.edition.rulesetVersion,
)
expect(
  'edition.rulesetId',
  String(dependencies.ruleset.id),
  manifest.edition.rulesetId,
)
expect(
  'edition.contentVersion',
  dependencies.ruleset.contentVersion,
  manifest.edition.contentVersion,
)

// ---------------------------------------------------------------------------
// 3. Catálogos: identidad, tamaño y huella recomputada
// ---------------------------------------------------------------------------

const catalogsByVersion = new Map<string, ApprovedVariantCatalog>(
  [
    grade1VariantCatalog,
    grade2VariantCatalog,
    grade3VariantCatalog,
    grade4VariantCatalog,
    grade5VariantCatalog,
  ].map((catalog) => [catalog.catalogVersion, catalog]),
)

for (const declared of manifest.catalogs) {
  const catalog = catalogsByVersion.get(declared.catalogVersion)
  if (catalog === undefined) {
    failures.push(
      `catalogs.${declared.catalogVersion}: el manifiesto lo fija y el repositorio no lo publica`,
    )
    continue
  }
  expect(
    `catalogs.${declared.catalogVersion}.contentVersion`,
    catalog.contentVersion,
    declared.contentVersion,
  )
  expect(
    `catalogs.${declared.catalogVersion}.entries`,
    catalog.entries.length,
    declared.entries,
  )
  expect(
    `catalogs.${declared.catalogVersion}.fingerprint`,
    sha256Hex(serializeCatalog(catalog)),
    declared.fingerprint,
  )
}

const competitiveCatalogs = manifest.catalogs.filter(
  (entry) => entry.competitive,
)
check(
  'catalogs.competitive',
  competitiveCatalogs.length === 1 &&
    competitiveCatalogs[0]?.catalogVersion ===
      manifest.edition.variantCatalogVersion
    ? undefined
    : 'exactamente un catálogo tiene que rankear, y tiene que ser el de la edición',
)

// ---------------------------------------------------------------------------
// 4. Política de score: existe, es oficial y no movió un número
// ---------------------------------------------------------------------------

const resolved = resolveCompetitiveScorePolicy(manifest.score.policyId)
if (!isOk(resolved)) {
  failures.push(
    `score.policyId: ${manifest.score.policyId} no está en el registro de políticas`,
  )
} else {
  const official = resolved.value
  expect('score.policyVersion', official.version, manifest.score.policyVersion)
  check(
    'score.official',
    official.official ? undefined : 'la política del release no es oficial',
  )
  expect(
    'score.weights.math',
    official.weights.math,
    manifest.score.weights.math,
  )
  expect(
    'score.weights.team',
    official.weights.team,
    manifest.score.weights.team,
  )
  expect(
    'score.weights.aura',
    official.weights.aura,
    manifest.score.weights.aura,
  )

  const issues = competitiveScorePolicyIssues(official)
  check(
    'score.structuralIssues',
    issues.length === 0 ? undefined : issues.join('; '),
  )

  const promoted = resolveCompetitiveScorePolicy(manifest.score.promotedFrom)
  if (!isOk(promoted)) {
    failures.push(
      `score.promotedFrom: ${manifest.score.promotedFrom} ya no se puede resolver, así que la equivalencia no se puede probar`,
    )
  } else {
    // El corazón de la oficialización: la promoción copió, no recalibró.
    const differences = scorePolicyDifferences(promoted.value, official)
    check(
      'score.equivalence',
      differences.length === 0
        ? undefined
        : `la promoción cambió la calibración: ${differences.join('; ')}`,
    )
    check(
      'score.promotedFromPreserved',
      promoted.value.official === false
        ? undefined
        : 'la candidata de la que se promovió fue editada en su lugar',
    )
  }
}

// Ninguna versión publicada puede desaparecer: un intento emitido bajo una
// calibración se verifica bajo esa calibración o no se verifica.
for (const required of ['1.0.0-candidate', '2.0.0-post-tg1-candidate']) {
  check(
    `score.registry.${required}`,
    competitiveScorePolicies.some((policy) => policy.version === required)
      ? undefined
      : 'una versión publicada desapareció del registro',
  )
}

// ---------------------------------------------------------------------------
// 5. Prestige: el techo ofrecido de v1
// ---------------------------------------------------------------------------

const prestigePolicy = dependencies.prestige?.policy
if (prestigePolicy === undefined) {
  failures.push('prestige: la edición no declara política')
} else {
  expect('prestige.policyId', prestigePolicy.id, manifest.prestige.policyId)
  expect(
    'prestige.policyVersion',
    prestigePolicy.version,
    manifest.prestige.policyVersion,
  )
  const issues = [
    ...prestigePolicyIssues(prestigePolicy),
    ...prestigeOpportunityIssues(careerPrestigeOpportunities, prestigePolicy),
  ]
  check('prestige.issues', issues.length === 0 ? undefined : issues.join('; '))
  const offered = careerPrestigeOpportunities.reduce(
    (total, opportunity) => total + opportunity.points,
    0,
  )
  expect('prestige.offeredCeiling', offered, manifest.prestige.offeredCeiling)
}

// ---------------------------------------------------------------------------
// 6. La edición de competencia fija exactamente la tupla del release
// ---------------------------------------------------------------------------

expect(
  'competition.editionId',
  FULL_CAREER_EDITION.id,
  manifest.edition.editionId,
)
const pinned = FULL_CAREER_EDITION.versions
expect(
  'competition.engineVersion',
  pinned.engineVersion,
  manifest.engine.engineVersion,
)
expect(
  'competition.rulesetVersion',
  pinned.rulesetVersion,
  manifest.edition.rulesetVersion,
)
expect(
  'competition.contentVersion',
  pinned.contentVersion,
  manifest.edition.contentVersion,
)
expect(
  'competition.variantCatalogVersion',
  pinned.variantCatalogVersion,
  manifest.edition.variantCatalogVersion,
)
expect(
  'competition.scoreVersion',
  pinned.scoreVersion,
  manifest.score.policyVersion,
)
expect(
  'competition.actionLogVersion',
  pinned.actionLogVersion,
  manifest.engine.actionLogVersion,
)
expect(
  'competition.snapshotVersion',
  pinned.snapshotVersion,
  manifest.engine.snapshotVersion,
)

check(
  'competition.editions.distinct',
  new Set(listEditions().map((edition) => canonicalize(edition.versions)))
    .size === listEditions().length
    ? undefined
    : 'dos ediciones declaran la misma tupla, así que `resolveEdition` es ambigua',
)

// La edición tiene que poder emitir. Una seed que no compone un plan sería una
// competencia que nadie puede jugar, y descubrirlo el día de la feria es tarde.
const probe = createFullCareerRunDescriptor('release-verify-probe', {
  runId: '00000000-0000-4000-8000-000000000000',
  mode: 'fair',
})
check(
  'competition.issuable',
  isOk(probe) ? undefined : 'la edición no compone un plan de carrera completa',
)
if (isOk(probe)) {
  expect(
    'competition.descriptorScoreVersion',
    probe.value.scoreVersion,
    manifest.score.policyVersion,
  )
}

// ---------------------------------------------------------------------------
// 7. Ranking y podio: el manifiesto describe lo que el comparador hace
// ---------------------------------------------------------------------------

{
  const ranked = rankEntries([
    { participantId: 'a', fairScore: 100, prestigeScore: 0 },
    { participantId: 'b', fairScore: 100, prestigeScore: 0 },
    { participantId: 'c', fairScore: 90, prestigeScore: 0 },
    { participantId: 'd', fairScore: 80, prestigeScore: 0 },
  ])
  const places = ranked.map((entry) => entry.rank).join(',')
  check(
    'ranking.sharedRank',
    places === '1,1,3,4'
      ? undefined
      : `los puestos compartidos dan ${places} y el manifiesto declara empate compartido`,
  )

  const prestigeBreak = rankEntries([
    { participantId: 'a', fairScore: 100, prestigeScore: 0 },
    { participantId: 'b', fairScore: 100, prestigeScore: 5 },
  ])
  check(
    'ranking.prestigeTiebreaker',
    prestigeBreak[0]?.result.participantId === 'b'
      ? undefined
      : 'Prestige no está actuando como segundo criterio',
  )
}

// ---------------------------------------------------------------------------
// 8. Base de datos: cabeza de migración y checksum del conjunto
// ---------------------------------------------------------------------------

const migrationsDirectory = resolve('supabase/migrations')
const migrations = readdirSync(migrationsDirectory)
  .filter((entry) => entry.endsWith('.sql'))
  .sort()
const head = migrations.at(-1)
expect('database.migrationHead', head, manifest.database.migrationHead)
expect(
  'database.schemaVersion',
  migrations.length,
  manifest.database.schemaVersion,
)

const migrationsDigest = createHash('sha256')
for (const file of migrations) {
  migrationsDigest
    .update(`${file}\n`)
    .update(
      readFileSync(resolve(migrationsDirectory, file), 'utf8').replace(
        /\r\n/gu,
        '\n',
      ),
    )
}
expect(
  'database.migrationsFingerprint',
  migrationsDigest.digest('hex'),
  manifest.database.migrationsFingerprint,
)

// ---------------------------------------------------------------------------
// 9. La versión del paquete nombra el mismo release
// ---------------------------------------------------------------------------

const packageJson = JSON.parse(
  readFileSync(resolve('package.json'), 'utf8'),
) as { version?: unknown }
expect('package.version', packageJson.version, manifest.releaseVersion)

// ---------------------------------------------------------------------------
// 10. La huella, contra el candado
// ---------------------------------------------------------------------------

const computed = releaseFingerprint(manifest)

if (updateLock) {
  if (failures.length > 0) {
    process.stderr.write(
      'No se regenera el candado con verificaciones en rojo: arreglá primero lo de abajo.\n',
    )
  } else {
    writeFileSync(
      resolve('src/release/fair-edition-v1.lock.json'),
      `${JSON.stringify(
        {
          releaseId: manifest.releaseId,
          releaseVersion: manifest.releaseVersion,
          releaseFingerprint: computed,
        },
        null,
        2,
      )}\n`,
      'utf8',
    )
    process.stdout.write(`Candado regenerado: ${computed}\n`)
  }
} else {
  expect(
    'release.fingerprint',
    computed,
    RELEASE_FINGERPRINT_LOCK.releaseFingerprint,
  )
  expect(
    'release.lock.releaseId',
    manifest.releaseId,
    RELEASE_FINGERPRINT_LOCK.releaseId,
  )
  expect(
    'release.lock.releaseVersion',
    manifest.releaseVersion,
    RELEASE_FINGERPRINT_LOCK.releaseVersion,
  )
}

// ---------------------------------------------------------------------------
// Reporte
// ---------------------------------------------------------------------------

if (failures.length > 0) {
  process.stderr.write(
    [
      '',
      `RELEASE VERIFY — FAILED (${String(failures.length)} de ${String(
        failures.length + checks.length,
      )})`,
      '',
      ...failures.map((failure) => `  ✗ ${failure}`),
      '',
    ].join('\n'),
  )
  process.exit(1)
}

process.stdout.write(
  [
    `RELEASE VERIFY — ${manifest.releaseName} ${manifest.releaseVersion} (${manifest.releaseChannel})`,
    `  huella        ${computed}`,
    `  motor         ${manifest.engine.engineVersion} · action log ${String(
      manifest.engine.actionLogVersion,
    )} · snapshot ${String(manifest.engine.snapshotVersion)}`,
    `  edición       ${manifest.edition.editionId} · ruleset ${manifest.edition.rulesetVersion}`,
    `  contenido     ${manifest.edition.contentVersion} · catálogo ${manifest.edition.variantCatalogVersion}`,
    `  score         ${manifest.score.policyId}@${manifest.score.policyVersion} (oficial, promovida de ${manifest.score.promotedFrom})`,
    `  prestige      ${manifest.prestige.policyId}@${manifest.prestige.policyVersion} · techo ofrecido ${String(
      manifest.prestige.offeredCeiling,
    )}`,
    `  seed          ${manifest.competition.seedPolicy} · valor en la edición`,
    `  esquema       ${manifest.database.migrationHead}`,
    `  ${String(checks.length)} comprobaciones en verde`,
    '',
  ].join('\n'),
)
