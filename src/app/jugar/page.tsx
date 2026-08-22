import type { Metadata } from 'next'

import { GameContainer } from '@/components/game/game-container'

/**
 * La partida.
 *
 * La ruta es un Server Component mínimo: sólo monta la frontera de cliente del
 * juego. El recorrido —nombre, año, resumen— es estado del motor, no
 * navegación, así que no hay una URL por desafío.
 */

export const metadata: Metadata = {
  title: 'Jugar — Egresado',
  description: 'Tu 7.º grado en Egresado.',
}

export default function PlayPage() {
  return <GameContainer />
}
