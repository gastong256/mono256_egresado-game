/**
 * El alias público.
 *
 * Es el único identificador de una persona que el producto publica, así que
 * tiene dos requisitos que no se parecen: tiene que poder escribirse con el
 * nombre real de un estudiante argentino —acentos, ñ, espacios— y tiene que
 * ser comparable de forma estable para que dos personas no compartan alias
 * dentro de una edición.
 *
 * La normalización de comparación no es la de presentación. Lo que se muestra
 * conserva mayúsculas y acentos; lo que decide unicidad es la forma plegada.
 */

export const NICKNAME_MIN_LENGTH = 2
export const NICKNAME_MAX_LENGTH = 24

export type NicknameProblem =
  'vacio' | 'muy-corto' | 'muy-largo' | 'caracteres-invalidos' | 'reservado'

/**
 * Palabras que el producto no publica como alias.
 *
 * Es una lista corta y deliberada, no un servicio de moderación: cubre los
 * nombres que harían pasar a alguien por el sistema o por la organización, más
 * los insultos más comunes del español rioplatense que un chico de trece años
 * escribe para probar. Lo que se escape de acá lo resuelve un organizador
 * ocultando el alias, que es la herramienta correcta para un juicio que
 * ninguna lista puede automatizar.
 */
const RESERVED_FRAGMENTS = [
  'admin',
  'administrador',
  'organizador',
  'moderador',
  'egresado oficial',
  'sistema',
  'jugador oculto',
  'null',
  'undefined',
]

const BLOCKED_FRAGMENTS = [
  'puto',
  'puta',
  'conchuda',
  'concha de',
  'pija',
  'forro',
  'boludo',
  'pelotudo',
  'mogolico',
  'mogólico',
  'retrasado',
  'nazi',
  'hitler',
  'violador',
]

/** Colapsa espacios y recorta los extremos. `"  Sofi  "` y `"Sofi"` son el mismo alias. */
export function normalizeNickname(raw: string): string {
  return raw.normalize('NFC').trim().replace(/\s+/gu, ' ')
}

/**
 * La forma que decide unicidad.
 *
 * Se pliega el caso y se quitan las marcas diacríticas, así que `Martín`,
 * `martin` y `MARTIN` son el mismo alias dentro de una edición. Es
 * deliberadamente más estricto que la presentación: dos aliases que sólo se
 * distinguen por un acento son indistinguibles en una pantalla de ranking.
 */
export function nicknameKey(raw: string): string {
  return normalizeNickname(raw)
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLocaleLowerCase('es')
}

export function validateNickname(raw: string): NicknameProblem | undefined {
  const value = normalizeNickname(raw)

  if (value.length === 0) return 'vacio'
  if (value.length < NICKNAME_MIN_LENGTH) return 'muy-corto'
  if (value.length > NICKNAME_MAX_LENGTH) return 'muy-largo'
  if (!/^[\p{L}\p{N}\p{M} '’_-]+$/u.test(value)) return 'caracteres-invalidos'

  const key = nicknameKey(value)
  const collapsed = key.replace(/[\s'’_-]+/gu, '')
  for (const fragment of [...RESERVED_FRAGMENTS, ...BLOCKED_FRAGMENTS]) {
    const target = fragment.replace(/[\s'’_-]+/gu, '')
    if (collapsed.includes(target)) {
      return 'reservado'
    }
  }

  return undefined
}

export function describeNicknameProblem(problem: NicknameProblem): string {
  switch (problem) {
    case 'vacio':
      return 'Escribí un alias para aparecer en el ranking.'
    case 'muy-corto':
      return `Poné al menos ${String(NICKNAME_MIN_LENGTH)} caracteres.`
    case 'muy-largo':
      return `Máximo ${String(NICKNAME_MAX_LENGTH)} caracteres.`
    case 'caracteres-invalidos':
      return 'Usá sólo letras, números, espacios o guiones.'
    case 'reservado':
      return 'Ese alias no se puede usar. Probá con otro.'
  }
}
