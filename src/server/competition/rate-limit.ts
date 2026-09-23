import 'server-only'

import type { CompetitionStore } from '@/server/persistence/competition/store'
import {
  consumeRateLimit,
  type RateLimitPolicy,
} from '@/server/security/rate-limit'
import type { Clock } from './clock'

export {
  clientFingerprint,
  type RateLimitPolicy,
} from '@/server/security/rate-limit'

/**
 * Límite de tasa por ventana fija, contado en la base.
 *
 * Una feria es una ráfaga legítima: treinta personas empiezan a la vez porque
 * el organizador dijo "ya". Los límites están calibrados para no tocar eso y sí
 * tocar lo que no se parece a una persona — un script que registra doscientas
 * identidades, o que reenvía la misma partida en bucle.
 *
 * El contador vive en Postgres y no en un mapa del proceso porque en serverless
 * hay N instancias, y N mapas independientes multiplican el límite real por N
 * justo cuando la ráfaga lo hace importar.
 *
 * La clave del balde nunca es un dato personal. Se cuenta por IP —hasheada con
 * el mismo secreto de la competencia, así que la tabla no guarda direcciones— y
 * por id de participante, que ya es un seudónimo.
 */

/**
 * Los límites por operación.
 *
 * El número de registro está calibrado contra el caso que de verdad ocurre y no
 * contra el que parece prudente. **Una escuela entera comparte una sola IP**:
 * detrás del NAT del edificio, treinta chicos anotándose cuando el organizador
 * dice «ya» son treinta registros del mismo origen en dos minutos. Un límite
 * estrecho por IP no frena a un atacante —que puede cambiar de red— y sí deja
 * afuera a media clase, que es el peor error posible el día de la feria.
 *
 * Lo que impide el abuso que importa no es este contador: es que sólo puede
 * haber **un participante por documento y edición**. Un script que invente mil
 * documentos crea mil identidades falsas que un organizador ve y descalifica;
 * lo que este límite corta es el volumen que haría lento el sistema.
 *
 * El acceso de organizador sí es estrecho: ahí hay una contraseña que probar, y
 * nadie necesita diez intentos en un cuarto de hora.
 *
 * Los límites de intento y envío se cuentan **por participante**, no por IP, así
 * que el NAT no los afecta. El envío es más ancho que la emisión porque un envío
 * puede fallar por red y reintentarse, y castigar un reintento sería castigar el
 * Wi-Fi de la escuela.
 */
export const RATE_LIMITS = {
  register: { windowSeconds: 300, limit: 60 },
  attemptStart: { windowSeconds: 300, limit: 30 },
  attemptSubmit: { windowSeconds: 300, limit: 60 },
  organizerLogin: { windowSeconds: 900, limit: 10 },
  publicState: { windowSeconds: 60, limit: 240 },
} as const satisfies Readonly<Record<string, RateLimitPolicy>>

export type RateLimitOperation = keyof typeof RATE_LIMITS

export interface RateLimiter {
  /** `true` si la operación puede seguir; `false` si ya pasó el límite. */
  allow(operation: RateLimitOperation, subject: string): Promise<boolean>
}

export function createRateLimiter(
  store: CompetitionStore,
  clock: Clock,
): RateLimiter {
  return {
    async allow(operation, subject) {
      try {
        return await consumeRateLimit(
          store,
          clock.now(),
          operation,
          subject,
          RATE_LIMITS[operation],
        )
      } catch {
        // Fail-open deliberado y acotado: si el contador no está disponible, la
        // alternativa es dejar a toda la feria afuera por una tabla auxiliar.
        // Las restricciones de dominio —una identidad por documento, un intento
        // activo, envío idempotente— siguen en pie y son las que impiden el
        // abuso que importa.
        return true
      }
    },
  }
}
