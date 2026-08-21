import { afterEach, describe, expect, it } from 'vitest'

import { isDevelopmentHarnessEnabled } from '@/server/development/harness-access'

/**
 * The harness route must not exist on a deployment by default.
 *
 * The gate is asserted here rather than end-to-end because proving the closed
 * case in a browser would need a second server started without the opt-in.
 */

const originalNodeEnv = process.env['NODE_ENV']
const originalOptIn = process.env['EGRESADO_DEV_HARNESS']

function setEnvironment(nodeEnv: string, optIn: string | undefined): void {
  Reflect.set(process.env, 'NODE_ENV', nodeEnv)
  if (optIn === undefined) {
    Reflect.deleteProperty(process.env, 'EGRESADO_DEV_HARNESS')
  } else {
    Reflect.set(process.env, 'EGRESADO_DEV_HARNESS', optIn)
  }
}

afterEach(() => {
  setEnvironment(originalNodeEnv ?? 'test', originalOptIn)
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
})
