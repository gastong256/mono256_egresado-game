import 'server-only'

/**
 * Access rule for the development engine harness.
 *
 * App routes must not read environment configuration directly, so this is the
 * server use case that decides whether the harness route exists.
 *
 * The harness is available in development, and in any other environment only
 * when `EGRESADO_DEV_HARNESS` is explicitly `true`. That opt-in is what lets the
 * end-to-end suite drive the harness against a real production build while
 * keeping it absent from a deployed site by default.
 */

import { getServerEnvironment } from '@/config/env.server'

export function isDevelopmentHarnessEnabled(): boolean {
  const environment = getServerEnvironment()

  if (environment.NODE_ENV !== 'production') {
    return true
  }

  return environment.EGRESADO_DEV_HARNESS === 'true'
}
