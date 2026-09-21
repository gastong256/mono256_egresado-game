import { afterEach, describe, expect, it } from 'vitest'

import { isDevelopmentHarnessEnabled } from '@/server/development/harness-access'

/**
 * The harness route must not exist on a deployment by default.
 *
 * The gate is asserted here rather than end-to-end because proving the closed
 * case in a browser would need a second server started without the opt-in.
 *
 * STAGE-09 adds a third state: a deployment that runs a competition closes the
 * `/dev` routes outright, opt-in included. A harness run could never enter the
 * ranking — issuing and verification both live on the server — but a seed
 * picker sitting at the same address where students are competing makes the
 * public product ambiguous, and the public product has to be one thing.
 */

const originalNodeEnv = process.env['NODE_ENV']
const originalOptIn = process.env['EGRESADO_DEV_HARNESS']
const originalSlug = process.env['EGRESADO_COMPETITION_SLUG']

function assign(key: string, value: string | undefined): void {
  if (value === undefined) {
    Reflect.deleteProperty(process.env, key)
  } else {
    Reflect.set(process.env, key, value)
  }
}

function setEnvironment(
  nodeEnv: string,
  optIn: string | undefined,
  competitionSlug: string | undefined = undefined,
): void {
  Reflect.set(process.env, 'NODE_ENV', nodeEnv)
  assign('EGRESADO_DEV_HARNESS', optIn)
  assign('EGRESADO_COMPETITION_SLUG', competitionSlug)
}

afterEach(() => {
  setEnvironment(originalNodeEnv ?? 'test', originalOptIn, originalSlug)
})

describe('development harness gate', () => {
  it('is open outside production', () => {
    setEnvironment('development', undefined)
    expect(isDevelopmentHarnessEnabled()).toBe(true)

    setEnvironment('test', undefined)
    expect(isDevelopmentHarnessEnabled()).toBe(true)
  })

  it('is closed in production unless explicitly opted in', () => {
    setEnvironment('production', undefined)
    expect(isDevelopmentHarnessEnabled()).toBe(false)

    setEnvironment('production', 'false')
    expect(isDevelopmentHarnessEnabled()).toBe(false)

    setEnvironment('production', 'true')
    expect(isDevelopmentHarnessEnabled()).toBe(true)
  })

  it('is closed in production with a competition, opt-in included', () => {
    // El opt-in es una variable de entorno, y una variable de entorno se copia
    // de un `.env` a otro. Un despliegue de feria con el harness encendido por
    // arrastre no podría falsear un puntaje, pero sí pondría una pantalla que
    // elige seed y contenido en la misma dirección donde se está compitiendo.
    setEnvironment('production', 'true', 'feria-2026')
    expect(isDevelopmentHarnessEnabled()).toBe(false)

    setEnvironment('production', undefined, 'feria-2026')
    expect(isDevelopmentHarnessEnabled()).toBe(false)
  })

  it('stays open for development even with a competition configured', () => {
    // En la máquina de quien desarrolla, la competencia local y el harness
    // conviven: no hay chicos jugando y sí hay contenido que revisar.
    setEnvironment('development', undefined, 'feria-local')
    expect(isDevelopmentHarnessEnabled()).toBe(true)
  })
})
