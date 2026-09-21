import { describe, expect, it } from 'vitest'

import {
  describeDniProblem,
  describeFullNameProblem,
  describeNicknameProblem,
  dniLast4,
  fullNameComparisonKey,
  nicknameKey,
  normalizeDni,
  normalizeFullName,
  normalizeNickname,
  validateDni,
  validateFullName,
  validateNickname,
} from '@/lib/competition'
import {
  deriveIdentityKey,
  identityKeysMatch,
} from '@/server/competition/identity'
import {
  hashOrganizerPassword,
  hashToken,
  createOpaqueToken,
  verifyOrganizerPassword,
} from '@/server/competition/tokens'

/**
 * Identidad de participante: normalización, derivación y credenciales.
 *
 * Lo que se prueba acá no es que las funciones corran, sino las tres promesas
 * que el aviso de privacidad le hace a un chico: que escribir el documento con
 * puntos o sin puntos es lo mismo, que volver desde otro teléfono lo reconoce, y
 * que de lo que se guarda no se puede volver al número.
 */

describe('normalización de documento', () => {
  it('acepta los separadores que la gente escribe', () => {
    for (const written of [
      '12.345.678',
      '12 345 678',
      '12-345-678',
      ' 12345678 ',
      '12.345.678',
    ]) {
      expect(normalizeDni(written.trim())).toBe('12345678')
    }
  })

  it('rechaza lo que no es un documento, con un motivo legible', () => {
    expect(validateDni('')).toBe('vacio')
    expect(validateDni('12A45678')).toBe('sin-digitos')
    expect(validateDni('123')).toBe('muy-corto')
    expect(validateDni('1234567890')).toBe('muy-largo')
    expect(validateDni('12.345.678')).toBeUndefined()
    // Un documento de siete dígitos es real y frecuente en adultos mayores;
    // rechazarlo sería inventar un formato que el documento no tiene.
    expect(validateDni('1234567')).toBeUndefined()

    for (const problem of [
      'vacio',
      'sin-digitos',
      'muy-corto',
      'muy-largo',
    ] as const) {
      expect(describeDniProblem(problem).length).toBeGreaterThan(5)
    }
  })

  it('guarda exactamente los últimos cuatro dígitos', () => {
    expect(dniLast4('12345678')).toBe('5678')
    expect(dniLast4('1234567')).toBe('4567')
  })
})

describe('clave de identidad derivada', () => {
  const secret = 'un-secreto-de-servidor-suficientemente-largo-0123'

  it('es estable para la misma persona en la misma edición', () => {
    const first = deriveIdentityKey(secret, 'edicion-a', '12345678')
    const second = deriveIdentityKey(secret, 'edicion-a', '12345678')
    expect(first).toBe(second)
    expect(first).toMatch(/^[0-9a-f]{64}$/u)
  })

  it('cambia entre ediciones, así que dos ferias no se pueden cruzar', () => {
    expect(deriveIdentityKey(secret, 'edicion-a', '12345678')).not.toBe(
      deriveIdentityKey(secret, 'edicion-b', '12345678'),
    )
  })

  it('cambia con el secreto, que es lo que la vuelve irreversible', () => {
    // Sin esta propiedad la derivación sería un hash público de un espacio de
    // 10^8 valores, es decir, el documento escrito de otra forma.
    expect(deriveIdentityKey(secret, 'e', '12345678')).not.toBe(
      deriveIdentityKey(`${secret}-otro`, 'e', '12345678'),
    )
  })

  it('no contiene el documento en ninguna forma reconocible', () => {
    const key = deriveIdentityKey(secret, 'edicion-a', '12345678')
    expect(key).not.toContain('12345678')
    expect(key).not.toContain('5678')
  })

  it('compara en tiempo constante y sin falsos positivos', () => {
    const key = deriveIdentityKey(secret, 'e', '12345678')
    expect(identityKeysMatch(key, key)).toBe(true)
    expect(identityKeysMatch(key, key.replace(/.$/u, '0'))).toBe(
      key.endsWith('0'),
    )
    expect(identityKeysMatch(key, 'corto')).toBe(false)
  })
})

describe('nombre completo', () => {
  it('conserva acentos y mayúsculas para mostrar', () => {
    expect(normalizeFullName('  María  Ñáñez  ')).toBe('María Ñáñez')
  })

  it('compara sin acentos ni caso, para que volver no dependa del teclado', () => {
    expect(fullNameComparisonKey('María Ñáñez')).toBe(
      fullNameComparisonKey('maria nanez'),
    )
    expect(fullNameComparisonKey('Ana Pérez')).not.toBe(
      fullNameComparisonKey('Ana Gómez'),
    )
  })

  it('acepta nombres reales con apóstrofos y guiones', () => {
    expect(validateFullName("Lucía D'Angelo")).toBeUndefined()
    expect(validateFullName('Juan Martínez-Paz')).toBeUndefined()
    expect(validateFullName('Ana')).toBeUndefined()
    expect(validateFullName('')).toBe('vacio')
    expect(validateFullName('A')).toBe('muy-corto')
    expect(validateFullName('Ana <script>')).toBe('caracteres-invalidos')
    expect(describeFullNameProblem('vacio')).toContain('nombre')
  })
})

describe('alias público', () => {
  it('colapsa espacios y conserva lo que el jugador escribió', () => {
    expect(normalizeNickname('  Sofi   la  crack ')).toBe('Sofi la crack')
  })

  it('decide unicidad sin caso ni acentos', () => {
    expect(nicknameKey('Martín')).toBe(nicknameKey('MARTIN'))
    expect(nicknameKey('Martín')).toBe(nicknameKey('martin'))
    expect(nicknameKey('Sofi')).not.toBe(nicknameKey('Sofía'))
  })

  it('acepta un nombre argentino y rechaza lo que rompería la pantalla', () => {
    expect(validateNickname('Ñoño 23')).toBeUndefined()
    expect(validateNickname('Lu-Ana')).toBeUndefined()
    expect(validateNickname('a')).toBe('muy-corto')
    expect(validateNickname('x'.repeat(25))).toBe('muy-largo')
    expect(validateNickname('<b>hola</b>')).toBe('caracteres-invalidos')
    expect(validateNickname('')).toBe('vacio')
  })

  it('bloquea suplantación e insultos evidentes, incluso disfrazados', () => {
    expect(validateNickname('Admin')).toBe('reservado')
    expect(validateNickname('organizador')).toBe('reservado')
    expect(validateNickname('Jugador oculto')).toBe('reservado')
    // La comparación pliega separadores, así que un guion en el medio no
    // convierte un insulto en un alias distinto.
    expect(validateNickname('pelo-tudo')).toBe('reservado')
    expect(validateNickname('P3lotudo')).toBeUndefined()
    expect(describeNicknameProblem('reservado')).toContain('no se puede usar')
  })
})

describe('tokens de sesión y credencial de organizador', () => {
  it('emite tokens opacos distintos, sin nada adentro', () => {
    const first = createOpaqueToken()
    const second = createOpaqueToken()
    expect(first).not.toBe(second)
    expect(first).toMatch(/^[A-Za-z0-9_-]{40,}$/u)
  })

  it('guarda el digest y no el token', () => {
    const token = createOpaqueToken()
    const digest = hashToken(token)
    expect(digest).toMatch(/^[0-9a-f]{64}$/u)
    expect(digest).not.toContain(token)
    expect(hashToken(token)).toBe(digest)
  })

  it('deriva la contraseña del organizador con sal propia', async () => {
    const digest = await hashOrganizerPassword('una-contraseña-larga')
    const otro = await hashOrganizerPassword('una-contraseña-larga')
    expect(digest).not.toBe(otro)
    expect(digest).not.toContain('una-contraseña-larga')
    expect(await verifyOrganizerPassword('una-contraseña-larga', digest)).toBe(
      true,
    )
    expect(await verifyOrganizerPassword('otra-cosa', digest)).toBe(false)
  }, 20_000)

  it('no usa `$` como separador: un .env lo expandiría', async () => {
    // El cargador de `.env` trata `$nombre` como una variable y lo reemplaza
    // por vacío. Un digest con `$` seguido de letras llegaría truncado al
    // servidor y la credencial dejaría de funcionar sin explicación.
    const digest = await hashOrganizerPassword('una-contraseña-larga')
    expect(digest).not.toContain('$')
    expect(digest.split(':')).toHaveLength(6)
  }, 20_000)

  it('rechaza un digest con forma inválida en vez de romperse', async () => {
    expect(await verifyOrganizerPassword('x', 'no-es-un-digest')).toBe(false)
    expect(await verifyOrganizerPassword('x', 'scrypt:1:2:3')).toBe(false)
  })
})
