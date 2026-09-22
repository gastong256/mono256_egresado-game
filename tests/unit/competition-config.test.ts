import { afterEach, describe, expect, it } from 'vitest'

import { parseServerEnvironment } from '@/config/env-schema'
import {
  CompetitionConfigurationError,
  DEFAULT_RETENTION_DAYS,
  DEFAULT_SCHOOL_YEARS,
  isCompetitionDeployment,
  readCompetitionConfiguration,
  requireCompetitionConfiguration,
} from '@/server/competition/config'
import {
  describeVersionMismatch,
  FULL_CAREER_EDITION,
  listEditions,
  resolveEdition,
} from '@/server/competition/editions'
import { setCompetitionTestContext } from '@/server/competition/runtime'
import { retentionDueAt } from '@/server/competition/retention'
import { competitionFixture } from '../helpers/competition'

/**
 * Configuración del despliegue: privacidad, credenciales y versiones.
 *
 * La regla que se prueba es una sola, en varias formas: **una competencia sin
 * responsable de los datos no arranca**. La alternativa sería renderizar un
 * aviso de privacidad con campos vacíos o con una escuela inventada, y eso es
 * peor que no tener aviso — le diría a un chico a quién reclamar y esa persona
 * no existiría.
 */

const VALID_HASH = `scrypt:131072:8:1:${'a'.repeat(32)}:${'b'.repeat(64)}`

const snapshot = { ...process.env }

function setEnvironment(values: Record<string, string | undefined>): void {
  for (const key of Object.keys(process.env)) {
    if (key.startsWith('EGRESADO_') || key === 'PARTICIPANT_IDENTITY_SECRET') {
      Reflect.deleteProperty(process.env, key)
    }
  }
  for (const [key, value] of Object.entries(values)) {
    if (value === undefined) continue
    Reflect.set(process.env, key, value)
  }
}

const COMPLETE = {
  EGRESADO_COMPETITION_SLUG: 'feria-2026',
  PARTICIPANT_IDENTITY_SECRET: 's'.repeat(40),
  EGRESADO_PRIVACY_CONTROLLER_NAME: 'Escuela Nº 1',
  EGRESADO_PRIVACY_CONTROLLER_CONTACT: 'privacidad@escuela.test',
  EGRESADO_PRIVACY_CONTROLLER_ADDRESS: 'Calle Falsa 123',
  EGRESADO_PRIVACY_NOTICE_VERSION: '1',
  EGRESADO_ORGANIZER_USERNAME: 'organizador',
  EGRESADO_ORGANIZER_PASSWORD_HASH: VALID_HASH,
}

afterEach(() => {
  for (const key of Object.keys(process.env)) {
    if (!(key in snapshot)) Reflect.deleteProperty(process.env, key)
  }
  Object.assign(process.env, snapshot)
})

describe('esquema de entorno', () => {
  it('exige entropía real en el secreto de identidad', () => {
    expect(() =>
      parseServerEnvironment({ PARTICIPANT_IDENTITY_SECRET: 'corto' }),
    ).toThrow(/PARTICIPANT_IDENTITY_SECRET/u)
    expect(() =>
      parseServerEnvironment({ PARTICIPANT_IDENTITY_SECRET: 's'.repeat(32) }),
    ).not.toThrow()
  })

  it('rechaza un digest de organizador con forma inválida', () => {
    expect(() =>
      parseServerEnvironment({
        EGRESADO_ORGANIZER_USERNAME: 'org',
        EGRESADO_ORGANIZER_PASSWORD_HASH: 'la-contraseña-en-claro',
      }),
    ).toThrow(/EGRESADO_ORGANIZER_PASSWORD_HASH/u)
  })

  it('exige usuario y digest juntos: uno solo no es una credencial', () => {
    expect(() =>
      parseServerEnvironment({ EGRESADO_ORGANIZER_USERNAME: 'org' }),
    ).toThrow(/EGRESADO_ORGANIZER_PASSWORD_HASH/u)
  })

  it('acepta un slug en minúsculas y rechaza cualquier otra cosa', () => {
    expect(() =>
      parseServerEnvironment({ EGRESADO_COMPETITION_SLUG: 'feria-2026' }),
    ).not.toThrow()
    expect(() =>
      parseServerEnvironment({ EGRESADO_COMPETITION_SLUG: 'Feria 2026' }),
    ).toThrow(/EGRESADO_COMPETITION_SLUG/u)
  })
})

describe('configuración de competencia', () => {
  it('sin slug no hay competencia, y eso es un estado legítimo', () => {
    setEnvironment({})
    expect(isCompetitionDeployment()).toBe(false)
    expect(readCompetitionConfiguration()).toBeUndefined()
  })

  it('falla nombrando exactamente lo que falta', () => {
    setEnvironment({ EGRESADO_COMPETITION_SLUG: 'feria-2026' })
    try {
      readCompetitionConfiguration()
      throw new Error('debería haber fallado')
    } catch (error) {
      expect(error).toBeInstanceOf(CompetitionConfigurationError)
      const missing = (error as CompetitionConfigurationError).missing
      expect(missing).toContain('PARTICIPANT_IDENTITY_SECRET')
      expect(missing).toContain('EGRESADO_PRIVACY_CONTROLLER_NAME')
      expect(missing).toContain('EGRESADO_PRIVACY_CONTROLLER_CONTACT')
      expect(missing).toContain('EGRESADO_PRIVACY_CONTROLLER_ADDRESS')
    }
  })

  it('no arranca con el responsable a medias', () => {
    setEnvironment({
      ...COMPLETE,
      EGRESADO_PRIVACY_CONTROLLER_CONTACT: undefined,
    })
    expect(() => requireCompetitionConfiguration()).toThrow(
      CompetitionConfigurationError,
    )
  })

  it('usa la progresión del juego y 120 días si no se declaran otros', () => {
    setEnvironment(COMPLETE)
    const config = requireCompetitionConfiguration()
    expect(config.schoolYears).toEqual([...DEFAULT_SCHOOL_YEARS])
    expect(config.privacy.retentionDays).toBe(DEFAULT_RETENTION_DAYS)
    expect(config.schoolDivisions).toEqual([])
  })

  it('acepta la progresión y las divisiones de otra escuela', () => {
    setEnvironment({
      ...COMPLETE,
      EGRESADO_SCHOOL_YEARS: ' 1er año , 2do año ,3er año ',
      EGRESADO_SCHOOL_DIVISIONS: 'A,B,C',
      EGRESADO_PRIVACY_RETENTION_DAYS: '30',
    })
    const config = requireCompetitionConfiguration()
    expect(config.schoolYears).toEqual(['1er año', '2do año', '3er año'])
    expect(config.schoolDivisions).toEqual(['A', 'B', 'C'])
    expect(config.privacy.retentionDays).toBe(30)
  })
})

describe('registro de ediciones', () => {
  it('resuelve por identidad exacta de la tupla', () => {
    expect(resolveEdition(FULL_CAREER_EDITION.versions)?.id).toBe(
      'full-career-v1',
    )
  })

  it('no resuelve «la más parecida» cuando una versión cambió', () => {
    // Puntuar contra una ruleset distinta de la que se jugó sería peor que
    // rechazar: el jugador recibiría un número que no corresponde a su partida.
    for (const field of [
      'engineVersion',
      'rulesetVersion',
      'contentVersion',
      'variantCatalogVersion',
      'scoreVersion',
    ] as const) {
      expect(
        resolveEdition({
          ...FULL_CAREER_EDITION.versions,
          [field]: 'otra-cosa',
        }),
      ).toBeUndefined()
    }
    expect(
      resolveEdition({ ...FULL_CAREER_EDITION.versions, actionLogVersion: 99 }),
    ).toBeUndefined()
  })

  it('nombra la primera diferencia, que es lo que un organizador necesita', () => {
    expect(
      describeVersionMismatch(FULL_CAREER_EDITION.versions, {
        ...FULL_CAREER_EDITION.versions,
        contentVersion: 'vieja',
      }),
    ).toContain('contentVersion')
    expect(
      describeVersionMismatch(
        FULL_CAREER_EDITION.versions,
        FULL_CAREER_EDITION.versions,
      ),
    ).toBeUndefined()
  })

  it('declara toda la tupla que el replay necesita', () => {
    const edition = listEditions()[0]
    expect([...Object.keys(edition?.versions ?? {})].sort()).toEqual([
      'actionLogVersion',
      'contentVersion',
      'engineVersion',
      'rulesetVersion',
      'scoreVersion',
      'snapshotVersion',
      'variantCatalogVersion',
    ])
  })

  it('emite en modo fair, con dificultad fija y plan atado a la seed', () => {
    const first = FULL_CAREER_EDITION.createDescriptor('una-seed', 'run-uno')
    const second = FULL_CAREER_EDITION.createDescriptor('una-seed', 'run-dos')
    expect(first?.mode).toBe('fair')
    expect(first?.difficulty).toBe('fixed')
    expect(first?.planFingerprint).toBe(second?.planFingerprint)
    expect(first?.runId).not.toBe(second?.runId)
  })
})

describe('retención', () => {
  it('vence a los días declarados después del cierre', () => {
    expect(
      retentionDueAt({
        id: 'c',
        ...competitionFixture({
          closesAt: '2026-10-03T18:00:00.000Z',
          retentionDays: 30,
        }),
      }),
    ).toBe('2026-11-02T18:00:00.000Z')
  })

  it('no vence nunca si la edición no declaró cierre', () => {
    expect(
      retentionDueAt({
        id: 'c',
        ...competitionFixture({ closesAt: undefined }),
      }),
    ).toBeUndefined()
  })
})

describe('inyección de contexto para pruebas', () => {
  it('no existe en producción: no hay puerta que abrir', () => {
    const original = process.env['NODE_ENV']
    Reflect.set(process.env, 'NODE_ENV', 'production')
    try {
      expect(() => {
        setCompetitionTestContext(undefined)
      }).toThrow(/producción/u)
    } finally {
      Reflect.set(process.env, 'NODE_ENV', original ?? 'test')
    }
  })
})
