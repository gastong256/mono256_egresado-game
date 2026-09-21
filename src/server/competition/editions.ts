import 'server-only'

import {
  ACTION_LOG_VERSION,
  ENGINE_VERSION,
  SNAPSHOT_SCHEMA_VERSION,
  candidateFairScorePolicy,
  isOk,
  type EngineDependencies,
  type RunDescriptor,
} from '@/game'
import {
  createFullCareerDependencies,
  createFullCareerRunDescriptor,
  FULL_CAREER_RULESET_VERSION,
} from '@/content/full-career'
import {
  GRADE_5_CONTENT_VERSION,
  GRADE_5_VARIANT_CATALOG_VERSION,
} from '@/content/grade-5/versions'
import type { PinnedVersions } from '@/server/persistence/competition/rows'

/**
 * Qué ediciones de juego puede correr una competencia, y bajo qué versiones.
 *
 * El registro resuelve **por identidad exacta**. No hay `latest`, y eso no es
 * una precaución teórica: un intento emitido el sábado a la mañana y enviado a
 * la tarde tiene que verificarse contra el mismo motor, la misma ruleset, el
 * mismo catálogo y la misma política de score con los que se jugó. Si alguna
 * versión cambió, el servidor **no adivina** — rechaza el envío con un código
 * tipado, que es la respuesta honesta.
 *
 * Hoy hay una sola edición: la carrera completa de nueve beats que STAGE-08
 * cerró. El registro existe igual porque la forma de la garantía no depende de
 * cuántas entradas tenga, y porque una segunda edición no debería poder
 * agregarse sin declarar su tupla.
 */

export interface CompetitionEdition {
  readonly id: string
  readonly label: string
  readonly versions: PinnedVersions
  readonly createDependencies: () => EngineDependencies
  /**
   * Emite el descriptor de un intento.
   *
   * Recibe la seed **de la edición** —compartida por todos los intentos— y el
   * `runId` propio del intento. La dificultad es fija y el plan sale de la
   * seed, así que dos participantes reciben exactamente el mismo juego.
   */
  readonly createDescriptor: (
    seed: string,
    runId: string,
  ) => RunDescriptor | undefined
}

export const FULL_CAREER_EDITION: CompetitionEdition = {
  id: 'full-career',
  label: 'Carrera completa 7.º → 5.º',
  versions: {
    engineVersion: ENGINE_VERSION,
    rulesetVersion: FULL_CAREER_RULESET_VERSION,
    contentVersion: GRADE_5_CONTENT_VERSION,
    variantCatalogVersion: GRADE_5_VARIANT_CATALOG_VERSION,
    scoreVersion: candidateFairScorePolicy.version,
    actionLogVersion: ACTION_LOG_VERSION,
    snapshotVersion: SNAPSHOT_SCHEMA_VERSION,
  },
  createDependencies: createFullCareerDependencies,
  createDescriptor: (seed, runId) => {
    const built = createFullCareerRunDescriptor(seed, { runId, mode: 'fair' })
    return isOk(built) ? built.value : undefined
  },
}

const EDITIONS: readonly CompetitionEdition[] = [FULL_CAREER_EDITION]

export function listEditions(): readonly CompetitionEdition[] {
  return EDITIONS
}

function versionsMatch(left: PinnedVersions, right: PinnedVersions): boolean {
  return (
    left.engineVersion === right.engineVersion &&
    left.rulesetVersion === right.rulesetVersion &&
    left.contentVersion === right.contentVersion &&
    left.variantCatalogVersion === right.variantCatalogVersion &&
    left.scoreVersion === right.scoreVersion &&
    left.actionLogVersion === right.actionLogVersion &&
    left.snapshotVersion === right.snapshotVersion
  )
}

/**
 * Encuentra la edición que implementa exactamente esta tupla.
 *
 * Devolver `undefined` es la respuesta correcta cuando el servidor ya no tiene
 * esas versiones: el intento no se puede verificar, y decirlo es mejor que
 * puntuarlo contra otras reglas.
 */
export function resolveEdition(
  versions: PinnedVersions,
): CompetitionEdition | undefined {
  return EDITIONS.find((edition) => versionsMatch(edition.versions, versions))
}

/**
 * Qué versión de la tupla difiere. Para el código de rechazo y el log.
 *
 * Nombra un solo campo —el primero que no coincide— porque es lo que un
 * organizador necesita para entender qué se movió, y enumerar los siete sólo
 * agregaría ruido cuando en la práctica se mueve uno.
 */
export function describeVersionMismatch(
  expected: PinnedVersions,
  received: PinnedVersions,
): string | undefined {
  const fields: readonly (keyof PinnedVersions)[] = [
    'engineVersion',
    'rulesetVersion',
    'contentVersion',
    'variantCatalogVersion',
    'scoreVersion',
    'actionLogVersion',
    'snapshotVersion',
  ]
  for (const field of fields) {
    if (expected[field] !== received[field]) {
      return `${field}: esperaba ${String(expected[field])}, recibió ${String(received[field])}`
    }
  }
  return undefined
}
