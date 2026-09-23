/**
 * EGRESADO FAIR EDITION V1 — el manifiesto.
 *
 * Todo lo que decide qué es esta competencia, en un solo archivo, declarado y
 * no derivado. Cambiar cualquiera de estos valores sin regenerar el candado
 * rompe `pnpm release:verify`, y cambiar el código sin cambiar el manifiesto lo
 * rompe también: la verificación recomputa las huellas desde la fuente.
 *
 * Lo que **no** está acá, y dónde está:
 *
 * ```text
 * seed de la edición        fila de la competencia, generada al hacer bootstrap
 * ventana de la feria       fila de la competencia
 * institución responsable   configuración del despliegue
 * credencial del organizador configuración del despliegue
 * proyecto/base de datos    configuración del despliegue
 * ```
 *
 * Esa separación es la del documento de congelamiento: el release congela las
 * **reglas**, la edición congela la **partida** y el despliegue aporta los
 * valores del mundo real que ningún agente puede inventar.
 */

import { parseReleaseManifest, type ReleaseManifest } from './manifest'

export const FAIR_EDITION_V1: ReleaseManifest = parseReleaseManifest({
  manifestSchemaVersion: 1,

  releaseId: 'egresado-fair-edition-v1',
  releaseName: 'Egresado Fair Edition v1',
  releaseVersion: '1.0.0-rc.3',
  releaseChannel: 'release-candidate',

  engine: {
    engineVersion: '10.0.0',
    actionLogVersion: 7,
    snapshotVersion: 8,
    rngAlgorithm: 'xoroshiro128plus',
  },

  edition: {
    editionId: 'full-career-v1',
    rulesetId: 'full-career',
    rulesetVersion: '1.0.0-full-career',
    contentVersion: '5.5.0-grade-5',
    variantCatalogVersion: 'grade-5-dev-6',
  },

  score: {
    policyId: 'fair-score-v1',
    policyVersion: '1.0.0-fair-edition-v1',
    official: true,
    scale: 10_000,
    perfectScore: 10_000,
    weights: { math: 8_500, team: 1_000, aura: 500 },
    promotedFrom: '2.0.0-post-tg1-candidate',
  },

  prestige: {
    policyId: 'prestige-dev-1',
    policyVersion: '1.0.0-candidate',
    // Cero **ofrecido**, congelado como tal. La maquinaria existe, el servidor
    // recomputa Prestige desde el replay y el ranking lo usa como segundo
    // criterio; lo que esta edición no tiene es contenido que ofrezca una
    // oportunidad competitiva (D-S08-084). Autorar una sería contenido nuevo, y
    // un congelamiento no autora contenido.
    offeredCeiling: 0,
    rankingRole: 'tiebreaker',
    // Una columna pública que dice 0 para todo el mundo no informa: ocupa ancho
    // en un teléfono y sugiere que hay algo que conseguir.
    publiclyDisplayed: false,
  },

  // Los catálogos se fijan por identidad y por huella, sin renombrarlos. Que un
  // identificador diga `dev` es historia de cómo se generó, no una promesa de
  // mutabilidad: cada versión publicada es inmutable y está validada. Republicar
  // los cinco para que el nombre se lea mejor movería 3.450 entradas y cada
  // movimiento es un riesgo de replay a cambio de nada.
  catalogs: [
    {
      catalogVersion: 'grade-5-dev-6',
      contentVersion: '5.5.0-grade-5',
      entries: 1031,
      fingerprint:
        '12c11dd8399489cdfa993374df4a1f1ac6f3705220bb0d3ef621a9d64e8d1fdd',
      // El acumulativo: `g7` a `y5`. Es el único con el que se rankea.
      competitive: true,
    },
    {
      catalogVersion: 'grade-4-dev-5',
      contentVersion: '4.4.0-grade-4',
      entries: 858,
      fingerprint:
        'a03d77cce2f47b3f60a74d3b695615065d6d288829ddf5a14343ccd685914cd9',
      competitive: false,
    },
    {
      catalogVersion: 'grade-3-dev-5',
      contentVersion: '3.4.0-grade-3',
      entries: 686,
      fingerprint:
        'e029587742313abd23c43c8a042527e63c7973bb4fb1ff099752ca7adeae9eef',
      competitive: false,
    },
    {
      catalogVersion: 'grade-2-dev-5',
      contentVersion: '2.4.0-grade-2',
      entries: 512,
      fingerprint:
        'e7df495af1aa6212abe51eedb9b7d383ae792a3c295597c5a23ce93c4948ca4d',
      competitive: false,
    },
    {
      catalogVersion: 'grade-1-dev-4',
      contentVersion: '1.3.0-grade-1',
      entries: 363,
      fingerprint:
        'ae911cabeb1cdf6438d7ec880e3802d423d61c9c4780401bcbec85356fb44aa4',
      competitive: false,
    },
  ],

  competition: {
    seedPolicy: 'shared-per-edition',
    seedValue: null,
    seedFrozenAt: 'edition-bootstrap',

    attempts: {
      perParticipant: 'unlimited',
      maxActiveAtOnce: 1,
      rankedAttempt: 'best-verified',
      lateSubmission: 'grace-window',
      defaultGraceSeconds: 300,
      abandon: 'participant-initiated',
    },

    ranking: {
      policyId: 'fair-ranking-v1',
      order: ['fairScore:desc', 'prestigeScore:desc'],
      tertiaryCriterion: null,
      ties: 'shared-rank',
      scope: 'best-verified-attempt-per-eligible-participant',
    },

    podium: {
      policyId: 'podium-by-place-v1',
      places: 3,
      tieHandling: 'whole-tie-group-enters',
    },

    frozenFields: [
      'runSeed',
      'runPlanFingerprint',
      'engineVersion',
      'rulesetVersion',
      'contentVersion',
      'variantCatalogVersion',
      'scoreVersion',
      'actionLogVersion',
      'snapshotVersion',
      'privacyNoticeVersion',
    ],
    operationalFields: ['status', 'opensAt', 'closesAt', 'resultsFrozenAt'],
  },

  privacy: {
    noticeContractVersion: 1,
    defaultRetentionDays: 120,
    documentPersistence: 'hmac-per-competition-plus-last4',
    requiredDeploymentValues: [
      'EGRESADO_PRIVACY_CONTROLLER_NAME',
      'EGRESADO_PRIVACY_CONTROLLER_CONTACT',
      'EGRESADO_PRIVACY_CONTROLLER_ADDRESS',
      'EGRESADO_PRIVACY_NOTICE_VERSION',
      'EGRESADO_PRIVACY_RETENTION_DAYS',
    ],
  },

  database: {
    schemaVersion: 2,
    migrationHead: '20260921000000_competition_fair_mode.sql',
    migrationsFingerprint:
      'faf128c4491bb0f406b520b05094e2b2345324f1e2fc049cc762232005ae214f',
  },
})
