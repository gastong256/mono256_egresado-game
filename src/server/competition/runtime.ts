import 'server-only'

import { getServerEnvironment } from '@/config/env.server'
import { InMemoryCompetitionStore } from '@/server/persistence/competition/memory-store'
import { SupabaseCompetitionStore } from '@/server/persistence/competition/supabase-store'
import type { CompetitionStore } from '@/server/persistence/competition/store'
import type { CompetitionRow } from '@/server/persistence/competition/rows'
import { systemClock, type Clock } from './clock'
import {
  readCompetitionConfiguration,
  type CompetitionDeploymentConfig,
} from './config'
import { createRateLimiter, type RateLimiter } from './rate-limit'

/**
 * La raíz de composición de la competencia.
 *
 * Un solo lugar decide qué implementación de persistencia se usa, qué reloj se
 * lee y de dónde sale la configuración. Todo lo demás —servicios, rutas— recibe
 * esas piezas como argumentos, que es lo que permite probarlas con un store en
 * memoria y un reloj fijo sin un solo `vi.mock`.
 *
 * El contexto se arma por pedido y no se cachea entre pedidos: en un entorno
 * serverless una instancia sobrevive a varias solicitudes, y guardar acá algo
 * que dependa del jugador sería filtrarlo al siguiente.
 */

export interface CompetitionContext {
  readonly store: CompetitionStore
  readonly clock: Clock
  readonly config: CompetitionDeploymentConfig
  readonly rateLimiter: RateLimiter
}

let testOverride: Pick<CompetitionContext, 'store' | 'clock'> | undefined

/**
 * Reemplaza store y reloj, sólo fuera de producción.
 *
 * Es el mecanismo de inyección que las pruebas de integración usan en lugar de
 * una ruta de test o un parámetro secreto: no existe una URL que lo active, y
 * en un build de producción la función se niega a hacer nada. Lo que un test
 * necesita es determinismo, no una puerta.
 */
export function setCompetitionTestContext(
  override: Pick<CompetitionContext, 'store' | 'clock'> | undefined,
): void {
  if (getServerEnvironment().NODE_ENV === 'production') {
    throw new Error(
      'El contexto de competencia no se puede reemplazar en producción',
    )
  }
  testOverride = override
}

export function createCompetitionStore(): CompetitionStore {
  const environment = getServerEnvironment()
  const hasDatabase =
    Boolean(environment.SUPABASE_SECRET_KEY) &&
    Boolean(
      environment.SUPABASE_INTERNAL_URL ?? environment.NEXT_PUBLIC_SUPABASE_URL,
    )
  return hasDatabase
    ? new SupabaseCompetitionStore()
    : new InMemoryCompetitionStore()
}

/**
 * Arma el contexto, o `undefined` si el despliegue no declara competencia.
 *
 * Lanza —y no devuelve `undefined`— cuando la competencia está declarada pero
 * le falta configuración de privacidad: esa diferencia importa. "No hay
 * competencia" es un estado legítimo del producto; "hay competencia y no
 * sabemos quién responde por los datos" es un despliegue que no debería
 * atender.
 */
export function createCompetitionContext(): CompetitionContext | undefined {
  const config = readCompetitionConfiguration()
  if (config === undefined) return undefined

  const store = testOverride?.store ?? createCompetitionStore()
  const clock = testOverride?.clock ?? systemClock

  return { store, clock, config, rateLimiter: createRateLimiter(store, clock) }
}

/** La edición activa del despliegue, por slug. */
export async function loadActiveCompetition(
  context: CompetitionContext,
): Promise<CompetitionRow | undefined> {
  return context.store.findCompetitionBySlug(context.config.slug)
}
