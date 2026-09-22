/**
 * ¿Esta configuración alcanza para abrir una feria?
 *
 *     pnpm release:preflight
 *
 * Es el mismo contrato que el arranque exige cuando `EGRESADO_ENVIRONMENT` no
 * es `local`, disponible como comando para poder contestarlo **antes** de
 * desplegar en vez de descubrirlo en el log del deploy.
 *
 * Nunca imprime un valor. Cada línea nombra una variable y qué le falta, que es
 * todo lo que hace falta para arreglarla: la salida de este comando termina
 * pegada en un chat de organización más veces de las que a nadie le gustaría, y
 * un secreto impreso «para verificar» es un secreto quemado.
 */

import { loadCompetitionEnvironment } from '../competition/environment'
import { getServerEnvironment } from '@/config/env.server'
import {
  deploymentEnvironment,
  productionConfigurationIssues,
} from '@/config/production'
import { currentRelease, releaseFingerprint } from '@/release'

loadCompetitionEnvironment()

const environment = getServerEnvironment()
const target = deploymentEnvironment(environment)
const release = currentRelease()

process.stdout.write(
  [
    `RELEASE PREFLIGHT — ${release.releaseName} ${release.releaseVersion}`,
    `  huella   ${releaseFingerprint(release)}`,
    `  entorno  ${target}`,
    '',
  ].join('\n'),
)

const issues = productionConfigurationIssues(environment)

if (issues.length === 0) {
  process.stdout.write(
    target === 'local'
      ? 'La configuración satisface el contrato de producción (y este entorno ni siquiera lo exige).\n'
      : 'La configuración satisface el contrato de producción.\n',
  )
  process.exit(0)
}

process.stdout.write(
  [
    `${String(issues.length)} ${issues.length === 1 ? 'problema' : 'problemas'}:`,
    ...issues.map((issue) => `  ✗ ${issue.variable}: ${issue.problem}`),
    '',
  ].join('\n'),
)

if (target === 'local') {
  process.stdout.write(
    'Entorno `local`: no bloquea nada acá, y bloquearía el arranque en staging o producción.\n',
  )
  process.exit(0)
}

process.exit(1)
