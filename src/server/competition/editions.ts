import 'server-only'

import {
  ACTION_LOG_VERSION,
  ENGINE_VERSION,
  SNAPSHOT_SCHEMA_VERSION,
  candidateFairScorePolicy,
  isOk,
  officialFairScorePolicy,
  type CompetitiveScorePolicy,
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
 * Hay dos entradas y difieren en un solo campo. `full-career-v1` es la edición
 * de **Egresado Fair Edition v1**: la carrera completa de nueve beats bajo la
 * política de score oficial `fair-score-v1`, y es la única que
 * `pnpm competition:bootstrap` crea. `full-career-tg1-candidate` es la edición
 * de STAGE-09, bajo la candidata `fair-score-dev-2`; se conserva **sólo para
 * verificar lo ya emitido**. Sin ella, una competencia creada antes del FREEZE
 * dejaría de resolver y todos sus intentos en curso se volverían inenviables —
 * borrar la entrada no arreglaría nada, sólo perdería la evidencia.
 *
 * Las dos calibraciones producen números idénticos: la promoción copió y no
 * recalibró, y `pnpm release:verify` lo comprueba campo por campo. La razón de
 * que sean dos identidades y no una es que un resultado publicado tiene que
 * decir, por sí solo, si se produjo bajo una calibración de competencia o bajo
 * una de desarrollo.
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

function fullCareerEdition(
  id: string,
  label: string,
  competitiveScore: CompetitiveScorePolicy,
): CompetitionEdition {
  return {
    id,
    label,
    versions: {
      engineVersion: ENGINE_VERSION,
      rulesetVersion: FULL_CAREER_RULESET_VERSION,
      contentVersion: GRADE_5_CONTENT_VERSION,
      variantCatalogVersion: GRADE_5_VARIANT_CATALOG_VERSION,
      scoreVersion: competitiveScore.version,
      actionLogVersion: ACTION_LOG_VERSION,
      snapshotVersion: SNAPSHOT_SCHEMA_VERSION,
    },
    createDependencies: () =>
      createFullCareerDependencies({ competitiveScore }),
    createDescriptor: (seed, runId) => {
      const built = createFullCareerRunDescriptor(seed, {
        runId,
        mode: 'fair',
        competitiveScore,
      })
      return isOk(built) ? built.value : undefined
    },
  }
}

/** La edición de Fair Edition v1. La única que una competencia nueva usa. */
export const FULL_CAREER_EDITION: CompetitionEdition = fullCareerEdition(
  'full-career-v1',
  'Carrera completa 7.º → 5.º · Fair Edition v1',
  officialFairScorePolicy,
)

/**
 * La edición de STAGE-09, previa al FREEZE.
 *
 * No se emite: `startAttempt` resuelve la edición por la tupla que la fila de
 * la competencia congeló, así que sólo aparece para las competencias que ya
 * existían. Una competencia nueva nace con la tupla oficial.
 */
export const FULL_CAREER_TG1_CANDIDATE_EDITION: CompetitionEdition =
  fullCareerEdition(
    'full-career-tg1-candidate',
    'Carrera completa 7.º → 5.º · candidata post-TG1 (histórica)',
    candidateFairScorePolicy,
  )

const EDITIONS: readonly CompetitionEdition[] = [
  FULL_CAREER_EDITION,
  FULL_CAREER_TG1_CANDIDATE_EDITION,
]

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
