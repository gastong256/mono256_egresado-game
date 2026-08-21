import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { DevelopmentHarness } from '@/components/game/development-harness'
import { isDevelopmentHarnessEnabled } from '@/server/development/harness-access'

/**
 * Development engine harness route.
 *
 * Available in development, and elsewhere only when the server opt-in is set.
 * Every other environment gets a 404, so the harness cannot be reached on a
 * deployment by guessing the path.
 *
 * The route is dynamic because its existence depends on server configuration
 * that must not be baked into a static page.
 */
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Motor de juego — herramienta de desarrollo',
  robots: { index: false, follow: false },
}

export default async function DevelopmentGameEnginePage({
  searchParams,
}: {
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  if (!isDevelopmentHarnessEnabled()) {
    notFound()
  }

  const params = await searchParams
  const raw = params['seed']
  const requested = Array.isArray(raw) ? raw[0] : raw
  // Seeds are opaque; anything outside the accepted character set falls back to
  // a stable default rather than reaching the engine.
  const seed =
    typeof requested === 'string' && /^[A-Za-z0-9._:-]{1,64}$/u.test(requested)
      ? requested
      : 'harness-default'

  return <DevelopmentHarness initialSeed={seed} />
}
