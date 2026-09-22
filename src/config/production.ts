import 'server-only'

import { getServerEnvironment, type ServerEnvironment } from './env.server'

/**
 * Qué tiene que ser cierto de la configuración antes de abrir una feria.
 *
 * El esquema de entorno responde «¿esta variable tiene la forma correcta?».
 * Esto responde la otra pregunta, que es la que decide un GO: **¿esta
 * configuración es de producción, o es la de la máquina de alguien copiada a un
 * servidor?** Son distintas, y la segunda no se puede contestar con un `z.string()`:
 * `http://localhost:3000` es una URL perfectamente válida y es exactamente el
 * valor que no puede estar en producción.
 *
 * ## Por qué no hay `SESSION_SECRET`
 *
 * Porque no existe una sesión firmada que proteger. Una sesión de participante
 * es un token opaco de 32 bytes de aleatoriedad criptográfica del que la base
 * guarda sólo el SHA-256; no lleva datos adentro, así que no hay nada que
 * firmar y no hay una clave cuya rotación invalide algo. Agregar la variable
 * para que la lista se vea completa habría creado un secreto que nadie usa y que
 * alguien, más adelante, habría creído que protegía algo.
 *
 * ## Por qué los datos del responsable se revisan acá
 *
 * El aviso de privacidad nombra a quién reclamarle acceso, rectificación o
 * supresión. Un aviso con una institución de mentira es peor que no tener aviso:
 * le dice a un chico de trece años a quién reclamar, y esa persona no existe.
 * El esquema ya exige que el campo esté; lo que se agrega acá es que no sea un
 * placeholder, que es la forma real en que ese campo queda mal.
 */

export interface ProductionConfigurationIssue {
  readonly variable: string
  readonly problem: string
}

/**
 * Valores que sólo aparecen cuando alguien copió el `.env.example` y no lo
 * completó. La lista es corta y literal a propósito: una heurística amplia
 * rechazaría el nombre real de una escuela que se llame «Ejemplo», y un falso
 * positivo el día del despliegue cuesta más que el falso negativo que evita.
 */
const PLACEHOLDERS = [
  'changeme',
  'cambiame',
  'placeholder',
  'todo',
  'tbd',
  'xxx',
  'example.com',
  'ejemplo.com',
  'your-institution',
  'nombre-de-la-escuela',
  'test',
  'prueba',
]

function looksLikePlaceholder(value: string): boolean {
  const normalized = value.trim().toLowerCase()
  return PLACEHOLDERS.some(
    (token) => normalized === token || normalized.includes(token),
  )
}

/**
 * Entropía aproximada de un secreto, en bits, por variedad de caracteres.
 *
 * No pretende medir aleatoriedad —ninguna función puede hacerlo sobre una sola
 * cadena—, sino descartar lo que evidentemente no la tiene: treinta y dos veces
 * la misma letra pasa `min(32)` y no protege nada.
 */
function distinctCharacters(value: string): number {
  return new Set(value).size
}

function checkSecret(
  variable: string,
  value: string | undefined,
  minimumLength: number,
  issues: ProductionConfigurationIssue[],
): void {
  if (value === undefined) {
    issues.push({ variable, problem: 'falta' })
    return
  }
  if (value.length < minimumLength) {
    issues.push({
      variable,
      problem: `necesita al menos ${String(minimumLength)} caracteres y tiene ${String(value.length)}`,
    })
  }
  if (distinctCharacters(value) < 12) {
    issues.push({
      variable,
      problem:
        'no parece aleatorio: muy pocos caracteres distintos. Generalo con `openssl rand -base64 48`',
    })
  }
  if (looksLikePlaceholder(value)) {
    issues.push({ variable, problem: 'sigue siendo el valor de ejemplo' })
  }
}

function checkPresentText(
  variable: string,
  value: string | undefined,
  issues: ProductionConfigurationIssue[],
): void {
  if (value === undefined || value.trim().length === 0) {
    issues.push({ variable, problem: 'falta' })
    return
  }
  if (looksLikePlaceholder(value)) {
    issues.push({
      variable,
      problem:
        'sigue siendo un valor de ejemplo: el aviso de privacidad lo publica tal cual',
    })
  }
}

/**
 * Todo lo que impediría abrir una competencia real, en una sola pasada.
 *
 * Devuelve la lista entera y no el primer problema: quien está configurando un
 * despliegue quiere arreglar los seis de una vez, no descubrirlos de a uno en
 * seis reinicios.
 */
export function productionConfigurationIssues(
  environment: ServerEnvironment = getServerEnvironment(),
): readonly ProductionConfigurationIssue[] {
  const issues: ProductionConfigurationIssue[] = []

  // 1. Origen canónico. Se compara contra el `Origin` de cada pedido que
  //    cambia estado, así que un `localhost` acá no es cosmético: rompe la
  //    comprobación de origen en cuanto el dominio real no coincide.
  const appUrl = environment.NEXT_PUBLIC_APP_URL
  try {
    const url = new URL(appUrl)
    if (url.protocol !== 'https:') {
      issues.push({
        variable: 'NEXT_PUBLIC_APP_URL',
        problem: 'un despliegue público tiene que ser https',
      })
    }
    if (
      url.hostname === 'localhost' ||
      url.hostname === '127.0.0.1' ||
      url.hostname === '[::1]' ||
      url.hostname.endsWith('.local')
    ) {
      issues.push({
        variable: 'NEXT_PUBLIC_APP_URL',
        problem: 'apunta a una máquina local',
      })
    }
    if (
      url.pathname !== '/' ||
      url.search !== '' ||
      looksLikePlaceholder(url.hostname)
    ) {
      issues.push({
        variable: 'NEXT_PUBLIC_APP_URL',
        problem:
          'debe ser el origen real, sin ruta, query ni dominio de ejemplo',
      })
    }
  } catch {
    issues.push({ variable: 'NEXT_PUBLIC_APP_URL', problem: 'no es una URL' })
  }

  // 2. Base de datos. Sin la clave secreta el BFF caería al store en memoria,
  //    que pierde todo al reiniciar el proceso — y lo haría en silencio.
  if (environment.SUPABASE_SECRET_KEY === undefined) {
    issues.push({
      variable: 'SUPABASE_SECRET_KEY',
      problem: 'falta: sin ella la competencia corre en memoria y se pierde',
    })
  }
  if (
    environment.SUPABASE_INTERNAL_URL === undefined &&
    environment.NEXT_PUBLIC_SUPABASE_URL === undefined
  ) {
    issues.push({
      variable: 'SUPABASE_INTERNAL_URL',
      problem: 'falta la URL del proyecto',
    })
  }

  // 3. Edición activa.
  if (environment.EGRESADO_COMPETITION_SLUG === undefined) {
    issues.push({
      variable: 'EGRESADO_COMPETITION_SLUG',
      problem: 'falta: el despliegue no declara qué edición atiende',
    })
  }

  // 4. Secretos.
  checkSecret(
    'PARTICIPANT_IDENTITY_SECRET',
    environment.PARTICIPANT_IDENTITY_SECRET,
    32,
    issues,
  )

  // 5. Organizador. El costo de scrypt viaja dentro del digest, así que se
  //    puede comprobar sin derivar nada.
  const digest = environment.EGRESADO_ORGANIZER_PASSWORD_HASH
  if (environment.EGRESADO_ORGANIZER_USERNAME === undefined) {
    issues.push({ variable: 'EGRESADO_ORGANIZER_USERNAME', problem: 'falta' })
  }
  if (digest === undefined) {
    issues.push({
      variable: 'EGRESADO_ORGANIZER_PASSWORD_HASH',
      problem: 'falta',
    })
  } else {
    const [, rawCost, rawR, rawP, salt, hash] = digest.split(':')
    const cost = Number(rawCost)
    if (
      ![65_536, 131_072].includes(cost) ||
      rawR !== '8' ||
      rawP !== '1' ||
      !/^[0-9a-f]{32}$/u.test(salt ?? '') ||
      !/^[0-9a-f]{64}$/u.test(hash ?? '')
    ) {
      issues.push({
        variable: 'EGRESADO_ORGANIZER_PASSWORD_HASH',
        problem:
          'requiere scrypt N=65536 o 131072, r=8, p=1, salt de 16 bytes y hash de 32 bytes; regeneralo con `pnpm competition:organizer:hash`',
      })
    }
  }

  // 6. Responsable de los datos.
  checkPresentText(
    'EGRESADO_PRIVACY_CONTROLLER_NAME',
    environment.EGRESADO_PRIVACY_CONTROLLER_NAME,
    issues,
  )
  checkPresentText(
    'EGRESADO_PRIVACY_CONTROLLER_CONTACT',
    environment.EGRESADO_PRIVACY_CONTROLLER_CONTACT,
    issues,
  )
  checkPresentText(
    'EGRESADO_PRIVACY_CONTROLLER_ADDRESS',
    environment.EGRESADO_PRIVACY_CONTROLLER_ADDRESS,
    issues,
  )
  if (environment.EGRESADO_PRIVACY_NOTICE_VERSION === undefined) {
    issues.push({
      variable: 'EGRESADO_PRIVACY_NOTICE_VERSION',
      problem: 'falta',
    })
  }
  const retention = environment.EGRESADO_PRIVACY_RETENTION_DAYS
  if (retention === undefined || retention < 1 || retention > 3650) {
    issues.push({
      variable: 'EGRESADO_PRIVACY_RETENTION_DAYS',
      problem: 'debe declararse explícitamente en 1..3650',
    })
  }

  // 7. La compuerta de desarrollo, apagada. Con competencia configurada `/dev`
  //    ya no abre aunque esté en `true`, pero una variable encendida por
  //    arrastre dice que el `.env` se copió sin revisarlo, y eso hay que verlo.
  if (environment.EGRESADO_DEV_HARNESS === 'true') {
    issues.push({
      variable: 'EGRESADO_DEV_HARNESS',
      problem: 'está encendida en un despliegue de producción',
    })
  }

  return issues
}

/**
 * Para qué sirve este despliegue.
 *
 * Se lee de `EGRESADO_ENVIRONMENT`; sin ella, `NODE_ENV=production` vale
 * `production` y todo lo demás vale `local`. El default inseguro sería el otro:
 * un despliegue real que no declara nada tiene que quedar con las
 * comprobaciones puestas, no sin ellas.
 */
export function deploymentEnvironment(
  environment: ServerEnvironment = getServerEnvironment(),
): 'local' | 'staging' | 'production' {
  return (
    environment.EGRESADO_ENVIRONMENT ??
    (environment.NODE_ENV === 'production' ? 'production' : 'local')
  )
}

/** Si este despliegue tiene que satisfacer el contrato de producción. */
export function enforcesProductionConfiguration(
  environment: ServerEnvironment = getServerEnvironment(),
): boolean {
  return deploymentEnvironment(environment) !== 'local'
}

export class ProductionConfigurationError extends Error {
  readonly issues: readonly ProductionConfigurationIssue[]

  constructor(issues: readonly ProductionConfigurationIssue[]) {
    super(
      [
        'La configuración de producción no está completa:',
        ...issues.map((issue) => `  - ${issue.variable}: ${issue.problem}`),
      ].join('\n'),
    )
    this.name = 'ProductionConfigurationError'
    this.issues = issues
  }
}

/**
 * Falla el arranque si esta configuración no puede sostener una feria.
 *
 * El mensaje nombra variables y problemas, nunca valores: un log de arranque
 * suele terminar en un panel que mira más gente de la que debería ver un
 * secreto, y «PARTICIPANT_IDENTITY_SECRET: no parece aleatorio» dice todo lo que
 * hace falta para arreglarlo sin imprimirlo.
 */
export function assertProductionConfiguration(
  environment: ServerEnvironment = getServerEnvironment(),
): void {
  const issues = productionConfigurationIssues(environment)
  if (issues.length > 0) throw new ProductionConfigurationError(issues)
}
