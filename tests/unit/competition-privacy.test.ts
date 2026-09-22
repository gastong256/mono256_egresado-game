import { describe, expect, it } from 'vitest'

import {
  csvCell,
  exportFilename,
  exportParticipantsCsv,
} from '@/server/competition/export'
import {
  toPrivateParticipant,
  toPublicLeaderboard,
  toPublicSummary,
} from '@/server/competition/dto'
import {
  FORBIDDEN_LOG_FIELDS,
  type CompetitionLogFields,
} from '@/server/competition/logging'
import { buildPrivacyNotice } from '@/server/competition/privacy-notice'
import type { CompetitionDeploymentConfig } from '@/server/competition/config'
import type {
  AttemptRow,
  BestAttemptRow,
  CompetitionRow,
  ParticipantRow,
} from '@/server/persistence/competition/rows'
import { competitionFixture } from '../helpers/competition'

/**
 * La frontera entre lo público y lo privado de un menor.
 *
 * Este archivo existe para que un cambio futuro que filtre un dato personal
 * falle acá y no en una feria. Prueba el dato concreto —el nombre de Ana, su
 * documento, su año— contra cada salida del sistema: la respuesta pública, el
 * CSV, el log y el aviso.
 */

const ANA = {
  fullName: 'Ana Belén Ramírez',
  dni: '38123456',
  last4: '3456',
  year: '4.º',
  nickname: 'Anita',
}

function participantRow(
  overrides: Partial<ParticipantRow> = {},
): ParticipantRow {
  return {
    id: 'p1',
    competitionId: 'c1',
    publicNickname: ANA.nickname,
    nicknameKey: 'anita',
    nicknameHidden: false,
    fullNamePrivate: ANA.fullName,
    schoolYearPrivate: ANA.year,
    divisionPrivate: 'B',
    identityHmac: 'a'.repeat(64),
    dniLast4Private: ANA.last4,
    status: 'ELIGIBLE',
    statusReason: undefined,
    identityVerifiedAt: undefined,
    privacyNoticeVersion: '1',
    anonymizedAt: undefined,
    createdAt: '2026-10-03T15:00:00.000Z',
    updatedAt: '2026-10-03T15:00:00.000Z',
    ...overrides,
  }
}

function bestRow(): BestAttemptRow {
  return {
    competitionId: 'c1',
    participantId: 'p1',
    attemptId: 'attempt-1',
    publicNickname: ANA.nickname,
    nicknameHidden: false,
    verifiedFairScore: 8123,
    verifiedPrestigeScore: 12,
    verifiedAt: '2026-10-03T16:00:00.000Z',
  }
}

/** Todo lo que jamás puede aparecer en una respuesta pública. */
const PRIVATE_VALUES = [
  ANA.fullName,
  'Ana',
  'Ramírez',
  ANA.dni,
  ANA.last4,
  ANA.year,
  'p1',
  'attempt-1',
  'a'.repeat(64),
]

describe('respuesta pública del ranking', () => {
  it('no puede serializar un solo dato privado', () => {
    const board = toPublicLeaderboard([bestRow()], {
      maxRank: 3,
      viewerParticipantId: 'p1',
    })
    const serialized = JSON.stringify(board)

    for (const value of PRIVATE_VALUES) {
      expect(serialized).not.toContain(value)
    }
    expect(serialized).toContain(ANA.nickname)
  })

  it('expone exactamente cuatro campos por entrada, y ninguno de más', () => {
    const board = toPublicLeaderboard([bestRow()], { maxRank: 3 })
    expect([...Object.keys(board.entries[0] ?? {})].sort()).toEqual([
      'fairScore',
      'isYou',
      'nickname',
      'rank',
    ])
  })

  it('no publica la seed ni la huella del plan de la edición', () => {
    const competition: CompetitionRow = {
      id: 'c1',
      ...competitionFixture(),
    }
    const summary = JSON.stringify(toPublicSummary(competition))
    expect(summary).not.toContain(competition.runSeed)
    expect(summary).not.toContain(competition.runPlanFingerprint)
  })

  it('presenta DRAFT y ARCHIVED sin contar el trabajo interno del organizador', () => {
    expect(
      toPublicSummary({ id: 'c1', ...competitionFixture({ status: 'DRAFT' }) })
        .status,
    ).toBe('upcoming')
    expect(
      toPublicSummary({
        id: 'c1',
        ...competitionFixture({ status: 'ARCHIVED' }),
      }).status,
    ).toBe('closed')
  })
})

describe('vista privada del organizador', () => {
  it('lleva lo que hace falta para reconocer a una persona, y nada más', () => {
    const view = toPrivateParticipant(participantRow(), [])
    expect(view.fullName).toBe(ANA.fullName)
    expect(view.dniLast4).toBe(ANA.last4)
    // La clave derivada no sale ni siquiera para el organizador: no le sirve
    // para nada y su única función posible sería cruzar bases.
    expect(JSON.stringify(view)).not.toContain('a'.repeat(64))
    expect(JSON.stringify(view)).not.toContain(ANA.dni)
  })

  it('cuenta sólo los intentos verificados que siguen valiendo', () => {
    const attempts: AttemptRow[] = [
      { ...attemptRow('VERIFIED', 8000) },
      {
        ...attemptRow('VERIFIED', 9500),
        invalidatedAt: '2026-10-03T17:00:00Z',
      },
      { ...attemptRow('REJECTED', undefined) },
    ]
    const view = toPrivateParticipant(participantRow(), attempts)
    expect(view.attempts).toBe(3)
    expect(view.verifiedAttempts).toBe(1)
    expect(view.bestFairScore).toBe(8000)
  })
})

function attemptRow(
  status: AttemptRow['status'],
  fair: number | undefined,
): AttemptRow {
  return {
    id: `a-${String(fair ?? 0)}`,
    competitionId: 'c1',
    participantId: 'p1',
    attemptNumber: 1,
    status,
    runId: 'run-1',
    seed: 'seed',
    runPlanFingerprint: 'fp',
    engineVersion: '10.0.0',
    rulesetVersion: 'r',
    contentVersion: 'c',
    variantCatalogVersion: 'v',
    scoreVersion: 's',
    actionLogVersion: 7,
    snapshotVersion: 8,
    startedAt: '2026-10-03T15:00:00.000Z',
    submittedAt: undefined,
    verifiedAt: undefined,
    actionLog: undefined,
    submissionDigest: undefined,
    verifiedFairScore: fair,
    verifiedPrestigeScore: 0,
    verifiedSummary: undefined,
    rejectionCode: undefined,
    invalidatedAt: undefined,
    invalidatedReason: undefined,
  }
}

describe('exportación del organizador', () => {
  const dashboard = {
    competition: {
      id: 'c1',
      slug: 'feria',
      name: 'Feria',
      status: 'CLOSED' as const,
      opensAt: undefined,
      closesAt: undefined,
      submissionGraceSeconds: 300,
      runSeed: 'seed',
      runPlanFingerprint: 'fp',
      privacyNoticeVersion: '1',
      retentionDays: 120,
      resultsFrozenAt: undefined,
    },
    participants: [
      {
        ...toPrivateParticipant(participantRow(), [
          attemptRow('VERIFIED', 8123),
        ]),
        rank: 1,
        attemptDetail: [],
      },
    ],
  }

  it('incluye lo que el organizador necesita para entregar un premio', () => {
    const csv = exportParticipantsCsv(dashboard)
    expect(csv).toContain(ANA.fullName)
    expect(csv).toContain(ANA.last4)
    expect(csv).toContain(ANA.year)
    expect(csv).toContain(ANA.nickname)
  })

  it('no incluye la clave de identidad, tokens ni logs de acciones', () => {
    const csv = exportParticipantsCsv(dashboard)
    expect(csv).not.toContain('a'.repeat(64))
    expect(csv).not.toContain('identityHmac')
    expect(csv).not.toContain('actionLog')
    expect(csv).not.toContain(ANA.dni)
  })

  it('neutraliza una fórmula escondida en un alias', () => {
    // Un alias que empieza con `=` lo ejecuta la planilla al abrir el archivo.
    // Es texto de un chico de trece años: el caso más probable no es un ataque
    // sino alguien probando qué pasa.
    expect(csvCell('=1+1')).toBe('"\'=1+1"')
    expect(csvCell('+A1')).toBe('"\'+A1"')
    expect(csvCell('-2')).toBe('"\'-2"')
    expect(csvCell('@SUM(A1)')).toBe('"\'@SUM(A1)"')
    expect(csvCell('Sofi')).toBe('"Sofi"')
  })

  it('escapa comillas y saca caracteres de control', () => {
    expect(csvCell('di "hola"')).toBe('"di ""hola"""')
    expect(csvCell('a\nb')).toBe('"a b"')
  })

  it('nombra el archivo por edición y fecha', () => {
    expect(exportFilename('feria', new Date('2026-10-03T16:00:00Z'))).toBe(
      'egresado-feria-2026-10-03.csv',
    )
  })
})

describe('registro operativo', () => {
  it('no tiene un campo donde poner un dato personal', () => {
    // El tipo es cerrado: la comprobación es que ninguno de los nombres
    // prohibidos sea una clave válida de `CompetitionLogFields`.
    const allowed: (keyof CompetitionLogFields)[] = [
      'event',
      'outcome',
      'code',
      'competitionId',
      'participantId',
      'attemptId',
      'requestId',
      'durationMs',
      'detail',
    ]
    for (const forbidden of FORBIDDEN_LOG_FIELDS) {
      expect(allowed).not.toContain(forbidden)
    }
  })
})

describe('aviso de privacidad', () => {
  const config: CompetitionDeploymentConfig = {
    slug: 'feria-2026',
    identitySecret: 'x'.repeat(40),
    privacy: {
      name: 'Escuela Nº 1',
      contact: 'privacidad@escuela.test',
      address: 'Calle Falsa 123',
      noticeVersion: '2',
      retentionDays: 90,
    },
    schoolYears: ['1.º'],
    schoolDivisions: [],
    organizer: { username: 'org', passwordHash: 'scrypt:1:2:3:aa:bb' },
  }

  it('renderiza al responsable desde la configuración, sin inventar nada', () => {
    const notice = buildPrivacyNotice(config)
    const text = JSON.stringify(notice)
    expect(text).toContain('Escuela Nº 1')
    expect(text).toContain('privacidad@escuela.test')
    expect(text).toContain('Calle Falsa 123')
    expect(text).toContain('90 días')
    expect(notice.version).toBe('2')
  })

  it('dice que sólo el alias es público', () => {
    const notice = buildPrivacyNotice(config)
    expect(notice.summary.join(' ')).toContain('únicamente tu alias')
  })

  it('afirma que el documento completo no se guarda, y eso es cierto', () => {
    // La afirmación del aviso y la implementación tienen que coincidir. Si
    // alguna vez se guardara el documento, este test y los de identidad
    // tendrían que fallar juntos.
    const notice = buildPrivacyNotice(config)
    expect(notice.summary.join(' ')).toContain('últimos cuatro dígitos')

    const stored = participantRow()
    expect(JSON.stringify(stored)).not.toContain(ANA.dni)
    expect(stored.dniLast4Private).toBe(ANA.last4)
    expect(stored).not.toHaveProperty('dni')
  })

  it('no menciona un consentimiento que resuelva la base legal', () => {
    // El control del formulario es un reconocimiento de lectura. Afirmar que
    // una tilde resuelve el tratamiento sería decir algo que este código no
    // puede sostener: la base legal la define la institución.
    const notice = buildPrivacyNotice(config)
    expect(notice.acknowledgement.toLowerCase()).toContain('leí')
    expect(notice.acknowledgement.toLowerCase()).not.toContain('consiento')
    expect(notice.acknowledgement.toLowerCase()).not.toContain('autorizo')
  })
})
