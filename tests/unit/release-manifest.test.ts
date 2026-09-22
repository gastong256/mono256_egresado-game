import { describe, expect, it } from 'vitest'

import {
  currentRelease,
  currentReleaseIdentity,
  parseReleaseManifest,
  releaseFingerprint,
  releaseLockIssues,
  ReleaseManifestError,
  RELEASE_FINGERPRINT_LOCK,
  FAIR_EDITION_V1,
} from '@/release'
import {
  ACTION_LOG_VERSION,
  ENGINE_VERSION,
  officialFairScorePolicy,
  RNG_ALGORITHM,
  SNAPSHOT_SCHEMA_VERSION,
} from '@/game'
import { FULL_CAREER_RULESET_VERSION } from '@/content/full-career'
import {
  GRADE_5_CONTENT_VERSION,
  GRADE_5_VARIANT_CATALOG_VERSION,
} from '@/content/grade-5/versions'

/**
 * El manifiesto de release, como contrato.
 *
 * `pnpm release:verify` recomputa las huellas pesadas desde el contenido y las
 * migraciones; eso vive en un script porque tarda y porque necesita leer el
 * disco. Lo que se prueba acá es lo barato y lo que tiene que fallar **en la
 * suite**: que el manifiesto se parsea, que su huella es determinista, que el
 * candado la fija, y que un cambio de una versión congelada rompe algo visible.
 */

describe('el manifiesto se parsea y se sella', () => {
  it('carga y coincide con su candado', () => {
    const release = currentRelease()
    expect(release).toBe(FAIR_EDITION_V1)
    expect(releaseFingerprint(release)).toBe(
      RELEASE_FINGERPRINT_LOCK.releaseFingerprint,
    )
    expect(RELEASE_FINGERPRINT_LOCK.releaseId).toBe(release.releaseId)
    expect(RELEASE_FINGERPRINT_LOCK.releaseVersion).toBe(release.releaseVersion)
  })

  it('el candado del repositorio no tiene una sola diferencia', () => {
    expect(
      releaseLockIssues(currentRelease(), RELEASE_FINGERPRINT_LOCK),
    ).toEqual([])
  })

  it('detecta una huella que no corresponde, y dice cómo regenerarla', () => {
    // El caso que el candado existe para encontrar: alguien edita el
    // manifiesto y no regenera la huella. Sin esto, el manifiesto se
    // autocertificaría y el cambio pasaría sin ruido.
    const issues = releaseLockIssues(currentRelease(), {
      ...RELEASE_FINGERPRINT_LOCK,
      releaseFingerprint: '0'.repeat(64),
    })
    expect(issues).toHaveLength(1)
    expect(issues[0]).toContain('release:verify --update-lock')
  })

  it('detecta un candado de otro release o de otra versión', () => {
    expect(
      releaseLockIssues(currentRelease(), {
        ...RELEASE_FINGERPRINT_LOCK,
        releaseId: 'otro-release',
      }),
    ).toHaveLength(1)
    expect(
      releaseLockIssues(currentRelease(), {
        ...RELEASE_FINGERPRINT_LOCK,
        releaseVersion: '2.0.0',
      }),
    ).toHaveLength(1)
  })

  it('reporta las tres diferencias juntas cuando el candado es de otro artefacto', () => {
    expect(
      releaseLockIssues(currentRelease(), {
        releaseId: 'otro',
        releaseVersion: '9.9.9',
        releaseFingerprint: '0'.repeat(64),
      }),
    ).toHaveLength(3)
  })

  it('un cambio en cualquier campo congelado rompe el candado vigente', () => {
    // El guardián de inmutabilidad, ejercitado sobre cada familia de versiones
    // que el release fija. Mover cualquiera sin regenerar el candado tiene que
    // ser imposible de no notar.
    const manifest = currentRelease()
    const mutations = [
      { ...manifest, engine: { ...manifest.engine, engineVersion: '11.0.0' } },
      {
        ...manifest,
        edition: { ...manifest.edition, rulesetVersion: '2.0.0-otra' },
      },
      {
        ...manifest,
        edition: {
          ...manifest.edition,
          variantCatalogVersion: 'grade-5-dev-7',
        },
      },
      {
        ...manifest,
        score: { ...manifest.score, policyVersion: '2.0.0-recalibrada' },
      },
      {
        ...manifest,
        prestige: { ...manifest.prestige, offeredCeiling: 40 },
      },
      {
        ...manifest,
        database: {
          ...manifest.database,
          migrationHead: '20270101000000_x.sql',
        },
      },
    ]
    for (const mutated of mutations) {
      expect(
        releaseLockIssues(
          parseReleaseManifest(mutated),
          RELEASE_FINGERPRINT_LOCK,
        ),
      ).not.toEqual([])
    }
  })

  it('la huella es determinista y no depende del orden de las claves', () => {
    const manifest = currentRelease()
    const reordered = parseReleaseManifest(
      JSON.parse(
        JSON.stringify(Object.fromEntries(Object.entries(manifest).reverse())),
      ),
    )
    expect(releaseFingerprint(reordered)).toBe(releaseFingerprint(manifest))
  })

  it('la huella cambia si cambia cualquier versión congelada', () => {
    const manifest = currentRelease()
    const moved = parseReleaseManifest({
      ...manifest,
      edition: { ...manifest.edition, contentVersion: '5.5.1-grade-5' },
    })
    expect(releaseFingerprint(moved)).not.toBe(releaseFingerprint(manifest))
  })

  it('rechaza un manifiesto con un campo de más', () => {
    expect(() =>
      parseReleaseManifest({ ...currentRelease(), deployedBy: 'alguien' }),
    ).toThrow(ReleaseManifestError)
  })

  it('rechaza una política de score no oficial', () => {
    const manifest = currentRelease()
    expect(() =>
      parseReleaseManifest({
        ...manifest,
        score: { ...manifest.score, official: false },
      }),
    ).toThrow(ReleaseManifestError)
  })
})

describe('el manifiesto describe el código que corre', () => {
  it('fija el motor, el action log, el snapshot y el generador', () => {
    const { engine } = currentRelease()
    expect(engine.engineVersion).toBe(ENGINE_VERSION)
    expect(engine.actionLogVersion).toBe(ACTION_LOG_VERSION)
    expect(engine.snapshotVersion).toBe(SNAPSHOT_SCHEMA_VERSION)
    expect(engine.rngAlgorithm).toBe(RNG_ALGORITHM)
  })

  it('fija la ruleset, el contenido y el catálogo de la edición', () => {
    const { edition } = currentRelease()
    expect(edition.rulesetVersion).toBe(FULL_CAREER_RULESET_VERSION)
    expect(edition.contentVersion).toBe(GRADE_5_CONTENT_VERSION)
    expect(edition.variantCatalogVersion).toBe(GRADE_5_VARIANT_CATALOG_VERSION)
  })

  it('fija la política de score oficial', () => {
    const { score } = currentRelease()
    expect(score.policyId).toBe(officialFairScorePolicy.id)
    expect(score.policyVersion).toBe(officialFairScorePolicy.version)
    expect(score.perfectScore).toBe(10_000)
  })

  it('pinea exactamente un catálogo competitivo, y es el de la edición', () => {
    const release = currentRelease()
    const competitive = release.catalogs.filter((entry) => entry.competitive)
    expect(competitive).toHaveLength(1)
    expect(competitive[0]?.catalogVersion).toBe(
      release.edition.variantCatalogVersion,
    )
  })

  it('no nombra un catálogo mutable', () => {
    for (const catalog of currentRelease().catalogs) {
      expect(catalog.catalogVersion).not.toMatch(/latest|current|head/iu)
      expect(catalog.fingerprint).toMatch(/^[0-9a-f]{64}$/u)
    }
  })
})

describe('Prestige v1', () => {
  it('congela el techo ofrecido en cero y lo deja fuera de la vista pública', () => {
    const { prestige } = currentRelease()
    expect(prestige.offeredCeiling).toBe(0)
    expect(prestige.rankingRole).toBe('tiebreaker')
    expect(prestige.publiclyDisplayed).toBe(false)
  })
})

describe('la seed compartida', () => {
  it('es política del release y valor de la edición', () => {
    const { competition } = currentRelease()
    expect(competition.seedPolicy).toBe('shared-per-edition')
    expect(competition.seedValue).toBeNull()
    expect(competition.seedFrozenAt).toBe('edition-bootstrap')
  })
})

describe('el manifiesto no es un lugar para configuración', () => {
  const serialized = JSON.stringify(FAIR_EDITION_V1)

  it.each([
    'secret',
    'password',
    'token',
    'postgres',
    'supabase',
    'sb_secret',
    'dni',
    '@',
  ])('no contiene «%s»', (needle) => {
    expect(serialized.toLowerCase()).not.toContain(needle.toLowerCase())
  })

  it('nombra las variables de privacidad requeridas sin traer sus valores', () => {
    const { privacy } = currentRelease()
    expect(privacy.requiredDeploymentValues).toContain(
      'EGRESADO_PRIVACY_CONTROLLER_NAME',
    )
    for (const variable of privacy.requiredDeploymentValues) {
      expect(variable).toMatch(/^[A-Z][A-Z0-9_]+$/u)
    }
  })
})

describe('la identidad operativa', () => {
  it('publica id, versión, canal y huella, y nada más', () => {
    expect(Object.keys(currentReleaseIdentity()).sort()).toEqual([
      'releaseChannel',
      'releaseFingerprint',
      'releaseId',
      'releaseVersion',
    ])
  })

  it('declara el canal de candidato, no el de release final', () => {
    expect(currentRelease().releaseChannel).toBe('release-candidate')
  })
})
