/**
 * El release vigente, y su candado.
 *
 * `currentRelease()` es la única forma en que el resto del código pregunta qué
 * se está corriendo. Devuelve el manifiesto ya parseado y comprobado contra el
 * candado, así que un proceso que arranca con un manifiesto editado a mano y sin
 * regenerar el candado **no atiende**: falla en el primer uso con el detalle de
 * la diferencia.
 *
 * El candado es un artefacto comprometido, igual que un catálogo aprobado. Es la
 * diferencia entre «la huella es la que salga» y «la huella es ésta»: sin él, el
 * manifiesto se auto-certificaría y un cambio accidental pasaría sin ruido, que
 * es precisamente lo que un congelamiento existe para impedir.
 *
 *     pnpm release:verify --update-lock     tras un cambio deliberado
 */

import lock from './fair-edition-v1.lock.json' with { type: 'json' }
import { FAIR_EDITION_V1 } from './fair-edition-v1'
import {
  releaseFingerprint,
  releaseIdentityOf,
  ReleaseManifestError,
  type ReleaseIdentity,
  type ReleaseManifest,
} from './manifest'

export interface ReleaseFingerprintLock {
  readonly releaseId: string
  readonly releaseVersion: string
  readonly releaseFingerprint: string
}

export const RELEASE_FINGERPRINT_LOCK: ReleaseFingerprintLock = lock

/**
 * En qué difieren un manifiesto y su candado, si difieren.
 *
 * Separado de `currentRelease` porque la garantía que importa es ésta y hay que
 * poder ejercitarla: un guardián que sólo corre sobre el par real del
 * repositorio —que por construcción coincide— nunca demuestra que detectaría el
 * caso que existe para detectar.
 */
export function releaseLockIssues(
  manifest: ReleaseManifest,
  lock: ReleaseFingerprintLock,
): readonly string[] {
  const computed = releaseFingerprint(manifest)
  const issues: string[] = []

  if (lock.releaseId !== manifest.releaseId) {
    issues.push(
      `el candado es de ${lock.releaseId} y el manifiesto de ${manifest.releaseId}`,
    )
  }
  if (lock.releaseVersion !== manifest.releaseVersion) {
    issues.push(
      `el candado fija ${lock.releaseVersion} y el manifiesto dice ${manifest.releaseVersion}`,
    )
  }
  if (lock.releaseFingerprint !== computed) {
    issues.push(
      `la huella computada es ${computed} y el candado fija ${lock.releaseFingerprint}; ` +
        'si el cambio es deliberado, regenerá el candado con `pnpm release:verify --update-lock`',
    )
  }

  return issues
}

let verified: ReleaseManifest | undefined

export function currentRelease(): ReleaseManifest {
  if (verified !== undefined) return verified

  const issues = releaseLockIssues(FAIR_EDITION_V1, RELEASE_FINGERPRINT_LOCK)
  if (issues.length > 0) throw new ReleaseManifestError(issues)

  verified = FAIR_EDITION_V1
  return verified
}

export function currentReleaseFingerprint(): string {
  return releaseFingerprint(currentRelease())
}

export function currentReleaseIdentity(): ReleaseIdentity {
  return releaseIdentityOf(currentRelease())
}
