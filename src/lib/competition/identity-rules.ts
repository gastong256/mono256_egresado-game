/**
 * Reglas de identidad del participante: normalización y validación puras.
 *
 * Viven en `lib` porque las necesitan los dos lados de la frontera. El
 * navegador las usa para avisar en el acto que faltan dígitos, y el servidor
 * las vuelve a aplicar sobre lo que llega por la red, que es lo único que
 * cuenta: la validación del cliente es cortesía, no control.
 *
 * Acá no hay criptografía. La derivación de la clave de identidad vive en
 * `@/server/competition/identity`, porque necesita un secreto que nunca puede
 * llegar al bundle del navegador.
 */

export const DNI_MIN_DIGITS = 7
export const DNI_MAX_DIGITS = 9

export type DniProblem = 'vacio' | 'muy-corto' | 'muy-largo' | 'sin-digitos'

/**
 * Normaliza un documento a su forma canónica.
 *
 * Se aceptan los separadores que la gente escribe —puntos, espacios, guiones—
 * porque rechazar `12.345.678` obligaría a explicar un formato en vez de
 * aceptar el que está impreso en el documento. No se valida un dígito
 * verificador: el DNI argentino no tiene uno, e inventarlo rechazaría
 * documentos reales.
 */
export function normalizeDni(raw: string): string {
  return raw.replace(/[\s.‐-―-]/gu, '')
}

export function validateDni(raw: string): DniProblem | undefined {
  const trimmed = raw.trim()
  if (trimmed.length === 0) return 'vacio'
  const normalized = normalizeDni(trimmed)
  if (!/^[0-9]+$/u.test(normalized)) return 'sin-digitos'
  if (normalized.length < DNI_MIN_DIGITS) return 'muy-corto'
  if (normalized.length > DNI_MAX_DIGITS) return 'muy-largo'
  return undefined
}

export function describeDniProblem(problem: DniProblem): string {
  switch (problem) {
    case 'vacio':
      return 'Escribí tu número de documento.'
    case 'sin-digitos':
      return 'Usá sólo números.'
    case 'muy-corto':
      return `Tiene que tener al menos ${String(DNI_MIN_DIGITS)} dígitos.`
    case 'muy-largo':
      return `Tiene como máximo ${String(DNI_MAX_DIGITS)} dígitos.`
  }
}

/** Los últimos cuatro dígitos, que son lo único del documento que se guarda. */
export function dniLast4(normalized: string): string {
  return normalized.slice(-4)
}

/**
 * Normaliza un nombre para compararlo, sin destruirlo para mostrarlo.
 *
 * Se colapsan espacios, se pasa a minúscula y se quitan las marcas
 * diacríticas **sólo en la forma de comparación**: alguien que se registró como
 * `Martín` y vuelve escribiendo `Martin` es la misma persona, y obligarlo a
 * reproducir el acento en un teclado de teléfono sería una barrera sin
 * propósito. El nombre que se guarda y se le muestra al organizador conserva
 * acentos y mayúsculas.
 */
export function normalizeFullName(raw: string): string {
  return raw.trim().replace(/\s+/gu, ' ')
}

export function fullNameComparisonKey(raw: string): string {
  return normalizeFullName(raw)
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLocaleLowerCase('es')
}

export type FullNameProblem =
  'vacio' | 'muy-corto' | 'muy-largo' | 'caracteres-invalidos'

export const FULL_NAME_MIN_LENGTH = 3
export const FULL_NAME_MAX_LENGTH = 120

export function validateFullName(raw: string): FullNameProblem | undefined {
  const value = normalizeFullName(raw)
  if (value.length === 0) return 'vacio'
  if (value.length < FULL_NAME_MIN_LENGTH) return 'muy-corto'
  if (value.length > FULL_NAME_MAX_LENGTH) return 'muy-largo'
  // Letras de cualquier alfabeto, marcas combinantes, espacios, apóstrofos y
  // guiones. No se recortan nombres legítimos: `D'Angelo`, `Ñuñez` y
  // `Martínez-Paz` son nombres, no entradas sospechosas.
  if (!/^[\p{L}\p{M} '’-]+$/u.test(value)) return 'caracteres-invalidos'
  return undefined
}

export function describeFullNameProblem(problem: FullNameProblem): string {
  switch (problem) {
    case 'vacio':
      return 'Escribí tu nombre y apellido.'
    case 'muy-corto':
      return 'Escribí tu nombre y apellido completos.'
    case 'muy-largo':
      return `Máximo ${String(FULL_NAME_MAX_LENGTH)} caracteres.`
    case 'caracteres-invalidos':
      return 'Usá sólo letras, espacios, apóstrofos o guiones.'
  }
}
