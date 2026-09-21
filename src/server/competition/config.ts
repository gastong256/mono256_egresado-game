import 'server-only'

import { getServerEnvironment } from '@/config/env.server'

/**
 * Configuración de la competencia y del responsable de los datos.
 *
 * Dos cosas distintas viven acá, y conviene no confundirlas. La **edición** —su
 * seed, sus versiones, su ventana— es una fila de la base, porque cambia por
 * evento y tiene que quedar auditada. Lo que está acá es lo que el **despliegue**
 * declara: qué edición es la activa, con qué secreto se derivan las identidades
 * y quién es el responsable del tratamiento de los datos.
 *
 * Esa última parte no es decorado legal. La nota de privacidad dice a quién
 * reclamarle acceso, rectificación o supresión; si esos datos no están
 * configurados, el producto no puede escribir una nota honesta. Por eso el
 * arranque falla con un error de configuración en vez de renderizar un aviso
 * con el nombre de una escuela inventada.
 */

export class CompetitionConfigurationError extends Error {
  readonly missing: readonly string[]

  constructor(missing: readonly string[]) {
    super(
      `La competencia no está configurada: falta ${missing.join(', ')}. ` +
        'Completá esas variables de entorno antes de abrir la competencia.',
    )
    this.name = 'CompetitionConfigurationError'
    this.missing = missing
  }
}

export interface PrivacyControllerConfig {
  /** Quién responde por los datos. Nunca se inventa: sale del despliegue. */
  readonly name: string
  readonly contact: string
  readonly address: string
  readonly noticeVersion: string
  readonly retentionDays: number
}

export interface CompetitionDeploymentConfig {
  readonly slug: string
  readonly identitySecret: string
  readonly privacy: PrivacyControllerConfig
  readonly schoolYears: readonly string[]
  readonly schoolDivisions: readonly string[]
  readonly organizer: {
    readonly username: string
    readonly passwordHash: string
  }
}

/**
 * Años/cursos por defecto.
 *
 * Coinciden con la progresión que el juego recorre porque la feria es de esa
 * escuela, no porque el juego decida la escuela. Un despliegue con otra
 * progresión declara `EGRESADO_SCHOOL_YEARS` y el formulario la usa sin tocar
 * una línea de código.
 */
export const DEFAULT_SCHOOL_YEARS = [
  '7.º',
  '1.º',
  '2.º',
  '3.º',
  '4.º',
  '5.º',
] as const

/** Retención por defecto: la feria, su verificación y el reclamo posterior. */
export const DEFAULT_RETENTION_DAYS = 120

function splitList(raw: string | undefined): readonly string[] {
  if (raw === undefined) return []
  return raw
    .split(',')
    .map((value) => value.trim())
    .filter((value) => value.length > 0)
}

/**
 * Lee la configuración, sin exigirla.
 *
 * Devuelve `undefined` cuando el despliegue no declara competencia: un entorno
 * de desarrollo que sólo quiere levantar el juego no tiene por qué inventar un
 * responsable de datos.
 */
export function readCompetitionConfiguration():
  CompetitionDeploymentConfig | undefined {
  const environment = getServerEnvironment()
  const slug = environment.EGRESADO_COMPETITION_SLUG
  if (slug === undefined) return undefined

  const missing: string[] = []
  const secret = environment.PARTICIPANT_IDENTITY_SECRET
  if (secret === undefined) missing.push('PARTICIPANT_IDENTITY_SECRET')
  const name = environment.EGRESADO_PRIVACY_CONTROLLER_NAME
  if (name === undefined) missing.push('EGRESADO_PRIVACY_CONTROLLER_NAME')
  const contact = environment.EGRESADO_PRIVACY_CONTROLLER_CONTACT
  if (contact === undefined) missing.push('EGRESADO_PRIVACY_CONTROLLER_CONTACT')
  const address = environment.EGRESADO_PRIVACY_CONTROLLER_ADDRESS
  if (address === undefined) missing.push('EGRESADO_PRIVACY_CONTROLLER_ADDRESS')
  const noticeVersion = environment.EGRESADO_PRIVACY_NOTICE_VERSION
  if (noticeVersion === undefined)
    missing.push('EGRESADO_PRIVACY_NOTICE_VERSION')
  const username = environment.EGRESADO_ORGANIZER_USERNAME
  const passwordHash = environment.EGRESADO_ORGANIZER_PASSWORD_HASH
  if (username === undefined || passwordHash === undefined) {
    missing.push('EGRESADO_ORGANIZER_USERNAME/EGRESADO_ORGANIZER_PASSWORD_HASH')
  }

  if (
    missing.length > 0 ||
    secret === undefined ||
    name === undefined ||
    contact === undefined ||
    address === undefined ||
    noticeVersion === undefined ||
    username === undefined ||
    passwordHash === undefined
  ) {
    throw new CompetitionConfigurationError(missing)
  }

  const years = splitList(environment.EGRESADO_SCHOOL_YEARS)

  return {
    slug,
    identitySecret: secret,
    privacy: {
      name,
      contact,
      address,
      noticeVersion,
      retentionDays:
        environment.EGRESADO_PRIVACY_RETENTION_DAYS ?? DEFAULT_RETENTION_DAYS,
    },
    schoolYears: years.length > 0 ? years : [...DEFAULT_SCHOOL_YEARS],
    schoolDivisions: splitList(environment.EGRESADO_SCHOOL_DIVISIONS),
    organizer: { username, passwordHash },
  }
}

/** Como la anterior, pero para los caminos que no pueden seguir sin ella. */
export function requireCompetitionConfiguration(): CompetitionDeploymentConfig {
  const configuration = readCompetitionConfiguration()
  if (configuration === undefined) {
    throw new CompetitionConfigurationError(['EGRESADO_COMPETITION_SLUG'])
  }
  return configuration
}

/** Si el despliegue declara una competencia, sin construir la configuración. */
export function isCompetitionDeployment(): boolean {
  return getServerEnvironment().EGRESADO_COMPETITION_SLUG !== undefined
}
