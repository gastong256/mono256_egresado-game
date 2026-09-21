import 'server-only'

/**
 * Regla de acceso a las superficies de desarrollo.
 *
 * Todo lo que vive bajo `/dev` —el harness del motor, la referencia del sistema
 * de diseño, la revisión docente, el recorrido de 7.º— existe para desarrollar
 * y revisar, no para jugar la competencia. Ninguna de esas rutas emite un
 * intento, así que una partida hecha ahí no puede entrar al ranking ni por
 * error; lo que esta función decide es si la ruta **existe**.
 *
 * Hay tres estados, y el tercero es el que STAGE-09 agrega:
 *
 * 1. Fuera de producción, están disponibles. Es la máquina de quien desarrolla.
 * 2. En producción, no existen salvo que `EGRESADO_DEV_HARNESS` esté en `true`.
 *    Ese opt-in es lo que permite ejercitar el harness contra un build de
 *    producción durante los tests de navegador.
 * 3. En producción **con una competencia configurada**, no existen y punto. El
 *    opt-in no alcanza.
 *
 * El tercero existe porque el opt-in es una variable de entorno, y una variable
 * de entorno se copia de un `.env` a otro. Un despliegue de feria con el harness
 * encendido por arrastre no podría falsear un puntaje —la emisión y la
 * verificación siguen del lado del servidor— pero sí pondría, en la misma
 * dirección donde los chicos están compitiendo, una pantalla que elige seed y
 * contenido. Esa ambigüedad es el problema: el producto público tiene que ser
 * una sola cosa. Cuando hay competencia, la puerta no se puede abrir.
 */

import { getServerEnvironment } from '@/config/env.server'

export function isDevelopmentHarnessEnabled(): boolean {
  const environment = getServerEnvironment()

  if (environment.NODE_ENV !== 'production') {
    return true
  }

  if (environment.EGRESADO_COMPETITION_SLUG !== undefined) {
    return false
  }

  return environment.EGRESADO_DEV_HARNESS === 'true'
}
