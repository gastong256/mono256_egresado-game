import 'server-only'

import {
  createHash,
  randomBytes,
  randomUUID,
  scrypt as scryptCallback,
  timingSafeEqual,
} from 'node:crypto'
import { promisify } from 'node:util'

/**
 * Tokens de sesión y credencial de organizador.
 *
 * Una sesión de participante es un token opaco: 32 bytes de aleatoriedad
 * criptográfica, sin un solo dato adentro. No lleva el nickname, no lleva el
 * id de la fila y no lleva nada firmado que el cliente pueda leer — si llevara
 * el id, un token robado seguiría diciendo a quién pertenece incluso después
 * de revocarlo.
 *
 * Lo que se guarda en la base es el SHA-256 del token, no el token. Es la misma
 * razón por la que una contraseña no se guarda: quien lea la tabla de sesiones
 * no puede hacerse pasar por nadie. El digest alcanza porque el token ya tiene
 * 256 bits de entropía, así que no hay diccionario que recorrer; una
 * contraseña de organizador sí necesita un KDF lento, y usa scrypt.
 */

/*
 * `promisify` no conserva la sobrecarga con opciones de `scrypt`, y sin
 * opciones se usarían los parámetros por defecto de Node —`N = 16384`—, que
 * están por debajo de lo que OWASP recomienda hoy. Se tipa la forma
 * promisificada a mano para no perder el costo configurado.
 */
const scrypt = promisify(scryptCallback) as (
  password: string,
  salt: Buffer,
  keylen: number,
  options: { N: number; r: number; p: number; maxmem: number },
) => Promise<Buffer>

export const PARTICIPANT_SESSION_COOKIE = 'egresado_participant'
export const ORGANIZER_SESSION_COOKIE = 'egresado_organizer'

/** Treinta días: sobrevive a la feria sin volverse una credencial permanente. */
export const PARTICIPANT_SESSION_DAYS = 30
/** Ocho horas: una jornada de organizador, no un acceso indefinido. */
export const ORGANIZER_SESSION_HOURS = 8

export function createOpaqueToken(): string {
  return randomBytes(32).toString('base64url')
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token, 'utf8').digest('hex')
}

export function createRunIdentifier(): string {
  return randomUUID()
}

/**
 * Deriva la contraseña del organizador.
 *
 * Los parámetros son los de OWASP para scrypt —`N = 2^17`, `r = 8`, `p = 1`—,
 * y viajan dentro del digest para que subirlos más adelante no invalide las
 * credenciales ya emitidas.
 *
 * El separador es `:` y no el `$` de la convención de Unix por una razón
 * concreta: este digest vive en un archivo `.env`, y los cargadores de esos
 * archivos expanden `$nombre` como una variable. Un digest con `$` seguido de
 * letras llega truncado al servidor y la credencial deja de funcionar sin que
 * nadie entienda por qué. `:` no lo expande nadie.
 */
const SCRYPT_N = 131_072
const SCRYPT_R = 8
const SCRYPT_P = 1
const SCRYPT_KEY_LENGTH = 32

export async function hashOrganizerPassword(password: string): Promise<string> {
  const salt = randomBytes(16)
  const derived = await scrypt(password, salt, SCRYPT_KEY_LENGTH, {
    N: SCRYPT_N,
    r: SCRYPT_R,
    p: SCRYPT_P,
    maxmem: 256 * 1024 * 1024,
  })
  return [
    'scrypt',
    String(SCRYPT_N),
    String(SCRYPT_R),
    String(SCRYPT_P),
    salt.toString('hex'),
    derived.toString('hex'),
  ].join(':')
}

export async function verifyOrganizerPassword(
  password: string,
  digest: string,
): Promise<boolean> {
  const parts = digest.split(':')
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false
  const [, rawN, rawR, rawP, saltHex, expectedHex] = parts
  if (
    rawN === undefined ||
    rawR === undefined ||
    rawP === undefined ||
    saltHex === undefined ||
    expectedHex === undefined
  ) {
    return false
  }

  const expected = Buffer.from(expectedHex, 'hex')
  const derived = await scrypt(
    password,
    Buffer.from(saltHex, 'hex'),
    expected.length,
    {
      N: Number(rawN),
      r: Number(rawR),
      p: Number(rawP),
      maxmem: 256 * 1024 * 1024,
    },
  )

  return (
    derived.length === expected.length && timingSafeEqual(derived, expected)
  )
}
