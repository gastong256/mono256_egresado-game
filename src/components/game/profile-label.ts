/**
 * Nombre de cada perfil de egreso en castellano.
 *
 * El motor identifica los perfiles con un `ProfileId` estable; el jugador los
 * conoce por su nombre. La traducción vive acá, en un solo lugar.
 *
 * Los ocho nombres salen del GDD (`docs/01-game-design/game-design-document.md`,
 * §17), que es la fuente autoritativa de game design. El handoff de diseño
 * nombra al pasar tres arquetipos que no están en esa lista —«El Rey del Último
 * Minuto», «El Vago Eficiente», «La Leyenda del Colegio»— como ilustración del
 * tono buscado; renombrar los perfiles del dominio para adoptarlos sería un
 * cambio de game design, no de presentación, y va al registro de preguntas
 * abiertas en vez de resolverse acá.
 *
 * El arquetipo es el premio del cierre, **no una quinta estadística**.
 */

import type { ProfileId } from '@/game'

const PROFILE_LABEL: Readonly<Record<ProfileId, string>> = {
  strategist: 'El Estratega',
  improviser: 'El Improvisador',
  scientist: 'El Científico',
  leader: 'El Líder',
  entrepreneur: 'El Emprendedor',
  competitor: 'El Competidor',
  balanced: 'El Equilibrado',
  survivor: 'El Superviviente',
}

export function profileLabel(profile: ProfileId): string {
  return PROFILE_LABEL[profile]
}
