import 'server-only'

import { currentRelease, releaseIdentityOf } from '@/release'
import { readCompetitionConfiguration } from './config'
import { releaseBindingIssues } from './freeze'
import { createCompetitionStore } from './runtime'

/**
 * Salud operativa, escrita para quien está parado en la feria.
 *
 * Un `/api/health` sirve para dos cosas distintas y conviene no mezclarlas. La
 * **vida** —¿el proceso responde?— es lo que mira un balanceador, tiene que ser
 * barata y no puede depender de la base. La **disponibilidad** —¿esto puede
 * atender una competencia ahora mismo?— es lo que mira una persona a las nueve
 * de la mañana del sábado, y tiene que decir qué falta.
 *
 * Por eso hay dos perfiles y no dos endpoints: `?ready=1` agrega las
 * comprobaciones que tocan la base y la configuración, y la forma de la
 * respuesta es la misma para que un script no tenga que ramificar.
 *
 * ## Qué no sale de acá
 *
 * Ni un secreto, ni un dato de una persona, ni una URL de base de datos, ni un
 * stack trace. Un chequeo que falla dice **qué** falla, nunca con qué valor: un
 * health público que imprimiera el mensaje de error de Postgres publicaría el
 * host y el nombre de la base en el primer incidente, que es exactamente cuando
 * más gente lo está mirando.
 *
 * La identidad del release sí sale, y a propósito: sin ella, «¿qué versión está
 * desplegada?» se responde mirando un panel de deploy, y durante un incidente
 * esa es una pregunta que hay que poder contestar con `curl`.
 */

export type HealthState = 'ok' | 'degraded' | 'error'

export interface HealthCheck {
  readonly name: string
  readonly state: HealthState
  /** Legible por una persona, sin valores de configuración ni PII. */
  readonly detail?: string
}

export interface HealthReport {
  readonly status: HealthState
  readonly service: 'egresado-web'
  readonly release: {
    readonly releaseId: string
    readonly releaseVersion: string
    readonly releaseChannel: string
    readonly releaseFingerprint: string
  }
  readonly checks: readonly HealthCheck[]
}

function worst(checks: readonly HealthCheck[]): HealthState {
  if (checks.some((check) => check.state === 'error')) return 'error'
  if (checks.some((check) => check.state === 'degraded')) return 'degraded'
  return 'ok'
}

/**
 * El manifiesto cargado y con su huella intacta.
 *
 * Es la primera comprobación porque es la que decide si el resto significa
 * algo: un servidor que no puede decir qué release corre no puede afirmar que
 * su competencia corresponde a ese release.
 */
function releaseCheck(): HealthCheck {
  try {
    currentRelease()
    return { name: 'release-manifest', state: 'ok' }
  } catch {
    return {
      name: 'release-manifest',
      state: 'error',
      detail: 'el manifiesto de release no coincide con su candado',
    }
  }
}

function configurationCheck(): HealthCheck {
  try {
    const configuration = readCompetitionConfiguration()
    return configuration === undefined
      ? {
          name: 'competition-config',
          state: 'ok',
          detail: 'sin competencia declarada en este despliegue',
        }
      : { name: 'competition-config', state: 'ok' }
  } catch {
    // El mensaje de `CompetitionConfigurationError` nombra variables que faltan,
    // no valores, pero tampoco hace falta publicarlo: quien opera lo ve en el
    // log de arranque, y un health público no tiene por qué enumerar la
    // configuración de un despliegue.
    return {
      name: 'competition-config',
      state: 'error',
      detail: 'faltan variables de configuración obligatorias',
    }
  }
}

async function databaseCheck(): Promise<HealthCheck> {
  try {
    const store = createCompetitionStore()
    await store.listCompetitions()
    return { name: 'database', state: 'ok' }
  } catch {
    return {
      name: 'database',
      state: 'error',
      detail: 'la base no respondió',
    }
  }
}

async function competitionCheck(): Promise<HealthCheck> {
  let configuration
  try {
    configuration = readCompetitionConfiguration()
  } catch {
    return { name: 'competition', state: 'error', detail: 'sin configuración' }
  }
  if (configuration === undefined) {
    return { name: 'competition', state: 'ok', detail: 'sin edición activa' }
  }

  try {
    const store = createCompetitionStore()
    const competition = await store.findCompetitionBySlug(configuration.slug)
    if (competition === undefined) {
      return {
        name: 'competition',
        state: 'degraded',
        detail: 'la edición declarada todavía no existe: falta el bootstrap',
      }
    }
    const issues = releaseBindingIssues(competition)
    if (issues.length > 0) {
      return {
        name: 'competition',
        state: 'error',
        detail: `la edición no corresponde al release: ${issues
          .map((issue) => issue.field)
          .join(', ')}`,
      }
    }
    return {
      name: 'competition',
      state: 'ok',
      detail: `estado ${competition.status}`,
    }
  } catch {
    return {
      name: 'competition',
      state: 'error',
      detail: 'no se pudo leer la edición',
    }
  }
}

export async function healthReport(
  options: { readonly ready?: boolean } = {},
): Promise<HealthReport> {
  const release = releaseCheck()
  const checks: HealthCheck[] = [release]

  if (options.ready === true) {
    checks.push(
      configurationCheck(),
      await databaseCheck(),
      await competitionCheck(),
    )
  }

  let identity
  try {
    identity = releaseIdentityOf(currentRelease())
  } catch {
    // Sin manifiesto válido no hay identidad que publicar, y mentir con una
    // vacía sería peor que decir que el chequeo está en rojo.
    identity = {
      releaseId: 'unknown',
      releaseVersion: 'unknown',
      releaseChannel: 'unknown',
      releaseFingerprint: '',
    }
  }

  return {
    status: worst(checks),
    service: 'egresado-web',
    release: identity,
    checks,
  }
}
