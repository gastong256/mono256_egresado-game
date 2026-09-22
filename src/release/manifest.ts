/**
 * El contrato del manifiesto de release.
 *
 * Un manifiesto es la respuesta ejecutable a una sola pregunta: **¿con qué
 * reglas exactas se jugó esta competencia?** El exit gate del congelamiento la
 * formula así a propósito —«¿puede un tercero reconstruir con qué reglas exactas
 * se jugó?»—, y hasta acá la respuesta estaba repartida entre un registro de
 * ediciones, seis constantes de contenido, dos políticas de score, un runbook y
 * la memoria de quien lo armó. Esto la junta en un dato, la parsea como a
 * cualquier otra entrada de borde y la sella con una huella.
 *
 * ## Por qué es data y no código
 *
 * El manifiesto **no importa** el motor, el contenido ni los catálogos. Declara
 * sus identidades y sus huellas como literales, y `pnpm release:verify`
 * recomputa cada una desde la fuente y compara. Esa dirección importa: si el
 * manifiesto derivara sus valores del código, diría siempre la verdad y no
 * probaría nada — un catálogo regenerado cambiaría la huella y el manifiesto la
 * seguiría sin quejarse. Declarándolos, un cambio de contenido rompe la
 * verificación, que es exactamente lo que un congelamiento tiene que hacer.
 *
 * Como efecto secundario, el módulo es liviano y puro: no arrastra un megabyte
 * de catálogos a ningún bundle por el solo hecho de nombrar una versión.
 *
 * ## Qué no entra
 *
 * Ningún secreto y ningún dato personal. Tampoco los valores operativos que
 * cambian por despliegue —la seed de la edición, el nombre de la institución,
 * los horarios—: de ésos el manifiesto congela el **contrato** (que la seed es
 * una y compartida, que el responsable es obligatorio) y deja el valor donde
 * tiene que estar, que es la configuración del evento.
 */

import { canonicalize, sha256Hex } from '@/game'
import { z } from 'zod'

const identifier = z.string().regex(/^[a-z0-9][a-z0-9.-]{0,63}$/u)
const versionString = z.string().min(1).max(64)
const fingerprint = z.string().regex(/^[0-9a-f]{64}$/u)

const catalogSchema = z.object({
  /** Identidad inmutable del catálogo aprobado, tal como la declara el artefacto. */
  catalogVersion: versionString,
  contentVersion: versionString,
  entries: z.int().min(1),
  /** SHA-256 de la serialización canónica del artefacto comprometido. */
  fingerprint,
  /** Si esta edición **rankea** con él, o si sólo se conserva para desarrollo. */
  competitive: z.boolean(),
})

export const releaseManifestSchema = z
  .object({
    manifestSchemaVersion: z.literal(1),

    releaseId: identifier,
    releaseName: z.string().min(1).max(120),
    releaseVersion: versionString,
    releaseChannel: z.enum(['release-candidate', 'release']),

    engine: z.object({
      engineVersion: versionString,
      actionLogVersion: z.int().min(1),
      snapshotVersion: z.int().min(1),
      rngAlgorithm: z.string().min(1).max(64),
    }),

    edition: z.object({
      editionId: identifier,
      rulesetId: z.string().min(1).max(64),
      rulesetVersion: versionString,
      contentVersion: versionString,
      variantCatalogVersion: versionString,
    }),

    score: z.object({
      policyId: identifier,
      policyVersion: versionString,
      official: z.literal(true),
      scale: z.literal(10_000),
      perfectScore: z.literal(10_000),
      weights: z.object({
        math: z.int(),
        team: z.int(),
        aura: z.int(),
      }),
      /** La identidad que esta promoción copió, sin recalibrar. */
      promotedFrom: versionString,
    }),

    prestige: z.object({
      policyId: identifier,
      policyVersion: versionString,
      /** Lo que la edición **ofrece**. Cero es una decisión, no una omisión. */
      offeredCeiling: z.int().min(0),
      rankingRole: z.enum(['tiebreaker', 'unused']),
      publiclyDisplayed: z.boolean(),
    }),

    catalogs: z.array(catalogSchema).min(1),

    competition: z.object({
      seedPolicy: z.literal('shared-per-edition'),
      /**
       * `null` cuando la seed es configuración de la edición y no del release.
       *
       * Es el caso de v1: la seed se genera una vez, con aleatoriedad
       * criptográfica, al crear la edición, y queda en su fila junto con la
       * huella del plan que produce. Ponerla acá obligaría a publicar un
       * artefacto nuevo por feria y, peor, haría que dos ferias distintas
       * jugaran la misma partida.
       */
      seedValue: z.string().min(1).max(128).nullable(),
      seedFrozenAt: z.enum(['release', 'edition-bootstrap']),

      attempts: z.object({
        perParticipant: z.literal('unlimited'),
        maxActiveAtOnce: z.literal(1),
        rankedAttempt: z.literal('best-verified'),
        lateSubmission: z.literal('grace-window'),
        defaultGraceSeconds: z.int().min(0),
        abandon: z.literal('participant-initiated'),
      }),

      ranking: z.object({
        policyId: identifier,
        order: z.array(z.string().min(1)).min(1),
        tertiaryCriterion: z.null(),
        ties: z.literal('shared-rank'),
        scope: z.literal('best-verified-attempt-per-eligible-participant'),
      }),

      podium: z.object({
        policyId: identifier,
        places: z.int().min(1),
        tieHandling: z.literal('whole-tie-group-enters'),
      }),

      /**
       * Columnas de la fila de competencia que el congelamiento vuelve
       * inmutables. Es la lista que `assertFrozenCompetitionFields` comprueba.
       */
      frozenFields: z.array(z.string().min(1)).min(1),
      /** Lo que un organizador sí puede mover después de congelar. */
      operationalFields: z.array(z.string().min(1)).min(1),
    }),

    privacy: z.object({
      noticeContractVersion: z.int().min(1),
      defaultRetentionDays: z.int().min(1).max(3650),
      documentPersistence: z.literal('hmac-per-competition-plus-last4'),
      /** Nombres, nunca valores: los valores son del despliegue. */
      requiredDeploymentValues: z.array(z.string().min(1)).min(1),
    }),

    database: z.object({
      schemaVersion: z.int().min(1),
      migrationHead: z.string().min(1).max(160),
      /** SHA-256 sobre las migraciones ordenadas, nombre incluido. */
      migrationsFingerprint: fingerprint,
    }),
  })
  .strict()

export type ReleaseManifest = z.output<typeof releaseManifestSchema>

export class ReleaseManifestError extends Error {
  readonly issues: readonly string[]

  constructor(issues: readonly string[]) {
    super(`Manifiesto de release inválido: ${issues.join('; ')}`)
    this.name = 'ReleaseManifestError'
    this.issues = issues
  }
}

export function parseReleaseManifest(value: unknown): ReleaseManifest {
  const parsed = releaseManifestSchema.safeParse(value)
  if (!parsed.success) {
    throw new ReleaseManifestError(
      parsed.error.issues.map(
        (issue) => `${issue.path.join('.')}: ${issue.message}`,
      ),
    )
  }
  return parsed.data
}

/**
 * La huella determinista del release.
 *
 * SHA-256 sobre la serialización canónica del manifiesto entero. No lleva la
 * fecha de build, la rama, el commit ni el nombre de la máquina: un artefacto
 * reproducible tiene que dar la misma huella hoy y dentro de un año, y el commit
 * es de todos modos la procedencia de la fuente, que ya la cuenta git.
 *
 * Incluir el commit tendría además un problema circular: el archivo que lo
 * declara vive en ese commit.
 */
export function releaseFingerprint(manifest: ReleaseManifest): string {
  return sha256Hex(canonicalize(manifest))
}

/** Lo que el release publica sin riesgo: identidad, nunca configuración. */
export interface ReleaseIdentity {
  readonly releaseId: string
  readonly releaseVersion: string
  readonly releaseChannel: string
  readonly releaseFingerprint: string
}

export function releaseIdentityOf(manifest: ReleaseManifest): ReleaseIdentity {
  return {
    releaseId: manifest.releaseId,
    releaseVersion: manifest.releaseVersion,
    releaseChannel: manifest.releaseChannel,
    releaseFingerprint: releaseFingerprint(manifest),
  }
}
