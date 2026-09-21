import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { GameContainer } from '@/components/game/game-container'
import { isDevelopmentHarnessEnabled } from '@/server/development/harness-access'

/**
 * El recorrido de 7.º, como superficie de desarrollo.
 *
 * Vivía en `/jugar` cuando el producto público era una partida local de un año.
 * Con la competencia, el único lugar público donde se juega es `/`, y una
 * segunda puerta que también dijera «jugar» sería una forma de jugar distinta a
 * la que se está puntuando: sin emisión del servidor, sin intento registrado y
 * sin ranking.
 *
 * Sigue existiendo porque el slice de 7.º es contenido real y su cobertura vale;
 * lo que cambió es quién puede abrirlo. Como el resto de `/dev`, fuera de
 * desarrollo devuelve 404 salvo que el servidor active la opción explícitamente.
 */
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: '7.º grado — herramienta de desarrollo',
  robots: { index: false, follow: false },
}

export default function Grade7DevelopmentPage() {
  if (!isDevelopmentHarnessEnabled()) {
    notFound()
  }

  return <GameContainer />
}
