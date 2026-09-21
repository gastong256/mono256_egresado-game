import 'server-only'

import { createHmac, timingSafeEqual } from 'node:crypto'

/**
 * La clave de identidad de un participante, derivada y nunca reversible.
 *
 * El DNI se pide una sola vez, se normaliza y se convierte acá en una clave
 * derivada con HMAC-SHA-256 bajo un secreto que vive fuera de la base. Lo que
 * se persiste es esa clave y los últimos cuatro dígitos; el número completo no
 * queda en ninguna fila, en ningún log y en ninguna respuesta.
 *
 * Por qué HMAC y no SHA-256 a secas: un DNI argentino tiene del orden de 10⁸
 * valores posibles. Un hash rápido sin clave se recorre entero en segundos, así
 * que no es una seudonimización — es el mismo dato escrito de otra forma. El
 * secreto es lo que convierte la derivación en algo que alguien con la base,
 * pero sin el secreto, no puede deshacer.
 *
 * Por qué entra el id de la competencia: la misma persona en dos ediciones
 * produce claves distintas, así que dos bases no se pueden cruzar para
 * reconstruir un historial que nadie pidió. Es minimización por construcción,
 * no por política.
 *
 * Rotar el secreto invalida todas las claves derivadas: un participante ya
 * registrado dejaría de encontrarse a sí mismo. Por eso el secreto no se rota
 * durante una edición abierta, y por eso rotarlo entre ediciones no cuesta
 * nada — las claves de una edición vieja no se vuelven a consultar.
 */

export function deriveIdentityKey(
  secret: string,
  competitionId: string,
  normalizedDni: string,
): string {
  return createHmac('sha256', secret)
    .update(`${competitionId}:${normalizedDni}`, 'utf8')
    .digest('hex')
}

/**
 * Comparación en tiempo constante de dos digests hexadecimales.
 *
 * La búsqueda normal es un índice único en la base y no pasa por acá. Esto
 * existe para las comparaciones que el código hace a mano, donde un `===`
 * filtraría por tiempo cuántos caracteres coinciden.
 */
export function identityKeysMatch(left: string, right: string): boolean {
  const a = Buffer.from(left, 'utf8')
  const b = Buffer.from(right, 'utf8')
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}
