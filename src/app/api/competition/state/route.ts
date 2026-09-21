import { handlePublicState } from '@/server/competition/api'

/**
 * Estado público de la competencia.
 *
 * Dinámica siempre: la respuesta incluye el puesto del jugador que la pide, así
 * que una versión estática o cacheada compartida le mostraría a alguien el
 * «vos» de otra persona.
 */
export const dynamic = 'force-dynamic'

export function GET(): Promise<Response> {
  return handlePublicState()
}
