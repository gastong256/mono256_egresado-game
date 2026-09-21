import 'server-only'

/**
 * El reloj, inyectado.
 *
 * La hora que decide si una competencia está abierta es la del servidor y sólo
 * la del servidor. Pasarla como dependencia es lo que permite probar los bordes
 * —un segundo antes de abrir, un segundo después de cerrar, el envío dentro de
 * la tolerancia— sin esperar a que el reloj de la máquina llegue ahí, y lo que
 * hace imposible que un `Date.now()` perdido adentro de un servicio lea la hora
 * del cliente por accidente.
 */
export interface Clock {
  now(): Date
}

export const systemClock: Clock = {
  now: () => new Date(),
}

export function fixedClock(instant: Date | string): Clock {
  const value = typeof instant === 'string' ? new Date(instant) : instant
  return { now: () => new Date(value.getTime()) }
}
