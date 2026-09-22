import 'server-only'

import { currentRelease, type ReleaseManifest } from '@/release'
import type { CompetitionRow } from '@/server/persistence/competition/rows'
import { competitionError, type CompetitionError } from './errors'

/**
 * El vínculo entre una edición y el release congelado.
 *
 * ## Por qué no hay un estado `FROZEN` nuevo
 *
 * Los campos competitivos de una competencia **ya son inmutables**, y no por
 * disciplina: `CompetitionStore.updateCompetition` sólo acepta `status`,
 * `opensAt`, `closesAt` y `resultsFrozenAt`. No existe una ruta, una acción de
 * organizador ni un método del puerto que cambie la seed, la huella del plan,
 * la tupla de versiones o la versión del aviso de privacidad. Agregar un estado
 * `FROZEN` para prohibir lo que el tipo ya no permite expresar sería ceremonia:
 * un segundo lugar donde declarar la misma verdad, y por lo tanto un segundo
 * lugar del que puede quedar desincronizada.
 *
 * Lo que faltaba era la otra mitad: los campos son inmutables **desde que la
 * fila existe**, pero nada comprobaba que lo que se congeló al crearla fuera el
 * release que el servidor implementa. Una edición creada antes del FREEZE, o
 * creada contra una rama, tiene una tupla perfectamente estable que
 * sencillamente no es la de Fair Edition v1 — y abrirla dejaría a los chicos
 * jugando una competencia que el release no describe.
 *
 * Eso es lo que esta pieza decide, y lo decide en el único momento donde
 * importa: **abrir**. Una edición se puede crear, revisar y archivar sin
 * coincidir con el release; lo que no se puede es ponerla a recibir partidas.
 *
 * ## Por qué al abrir y no al emitir
 *
 * Emitir ya tiene su propia comprobación, más estricta y más tardía: el intento
 * se emite contra la tupla de la fila y la huella del plan se recomputa. Repetir
 * acá esa verificación no agregaría seguridad. Lo que agrega abrir es el momento
 * **operativo**: el organizador está mirando la pantalla, todavía no hay nadie
 * jugando, y un error de configuración se arregla con un bootstrap en vez de con
 * una competencia anulada a mitad de camino.
 */

/** Qué columna no coincide con el release, y en qué. */
export interface ReleaseBindingIssue {
  readonly field: string
  readonly expected: string
  readonly found: string
}

export function releaseBindingIssues(
  competition: CompetitionRow,
  release: ReleaseManifest = currentRelease(),
): readonly ReleaseBindingIssue[] {
  const issues: ReleaseBindingIssue[] = []
  const compare = (field: string, expected: string, found: string): void => {
    if (expected !== found) issues.push({ field, expected, found })
  }

  compare(
    'engineVersion',
    release.engine.engineVersion,
    competition.engineVersion,
  )
  compare(
    'actionLogVersion',
    String(release.engine.actionLogVersion),
    String(competition.actionLogVersion),
  )
  compare(
    'snapshotVersion',
    String(release.engine.snapshotVersion),
    String(competition.snapshotVersion),
  )
  compare(
    'rulesetVersion',
    release.edition.rulesetVersion,
    competition.rulesetVersion,
  )
  compare(
    'contentVersion',
    release.edition.contentVersion,
    competition.contentVersion,
  )
  compare(
    'variantCatalogVersion',
    release.edition.variantCatalogVersion,
    competition.variantCatalogVersion,
  )
  compare('scoreVersion', release.score.policyVersion, competition.scoreVersion)

  // La seed es configuración de la edición, no del release, así que no se
  // compara con nada: lo que se exige es que exista y que traiga la huella del
  // plan que produjo. Una fila sin huella no se puede verificar contra nada.
  if (competition.runSeed.trim().length === 0) {
    issues.push({
      field: 'runSeed',
      expected: 'una seed compartida de la edición',
      found: '(vacía)',
    })
  }
  if (competition.runPlanFingerprint.trim().length === 0) {
    issues.push({
      field: 'runPlanFingerprint',
      expected: 'la huella del plan que la seed compone',
      found: '(vacía)',
    })
  }
  if (competition.privacyNoticeVersion.trim().length === 0) {
    issues.push({
      field: 'privacyNoticeVersion',
      expected: 'la versión del aviso vigente al crear la edición',
      found: '(vacía)',
    })
  }
  if (competition.retentionDays < 1 || competition.retentionDays > 3650) {
    issues.push({
      field: 'retentionDays',
      expected: '1..3650',
      found: String(competition.retentionDays),
    })
  }

  return issues
}

/**
 * Si esta edición se puede abrir bajo el release que corre este servidor.
 *
 * Devuelve el error tipado en lugar de lanzar: el organizador tiene que ver un
 * código y un detalle, no una excepción, y el detalle nombra el primer campo
 * que no coincide porque enumerar los siete sólo agrega ruido cuando en la
 * práctica se mueve uno.
 */
export function canOpenCompetition(
  competition: CompetitionRow,
  release: ReleaseManifest = currentRelease(),
): CompetitionError | undefined {
  const issues = releaseBindingIssues(competition, release)
  const first = issues[0]
  if (first === undefined) return undefined
  return competitionError(
    'COMPETITION_NOT_CONFIGURED',
    `la edición no corresponde a ${release.releaseId} ${release.releaseVersion}: ` +
      `${first.field} esperaba ${first.expected} y tiene ${first.found}` +
      (issues.length > 1 ? ` (+${String(issues.length - 1)} más)` : ''),
  )
}

/** Las columnas que ninguna operación de organizador puede mover. */
export function frozenCompetitionFields(
  release: ReleaseManifest = currentRelease(),
): readonly string[] {
  return release.competition.frozenFields
}

/** Las que sí, y son las únicas que `updateCompetition` acepta. */
export function operationalCompetitionFields(
  release: ReleaseManifest = currentRelease(),
): readonly string[] {
  return release.competition.operationalFields
}
