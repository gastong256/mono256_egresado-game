/**
 * Exportación de resultados de una edición.
 *
 *     pnpm ops:export                       a stdout, sin datos privados
 *     pnpm ops:export -- --private          con nombre, año y últimos 4
 *     pnpm ops:export -- --out=resultados.csv
 *
 * Es el otro artefacto de respaldo, y responde a una necesidad distinta de la
 * del dump. Un `pg_dump` sirve para **restaurar el sistema**; esto sirve para
 * **conservar el resultado** cuando el sistema ya no exista: una escuela que
 * quiera saber en 2029 quién ganó en 2026 no va a levantar un Postgres.
 *
 * Por eso reutiliza el CSV del organizador en lugar de escribir uno nuevo. Ese
 * archivo ya resolvió lo que un formato de resultados tiene que resolver —qué
 * columnas hacen falta para entregar un premio, y la neutralización de fórmulas
 * en un alias escrito por un chico de trece años—, y una segunda implementación
 * sólo se desincronizaría de la primera.
 *
 * El default es **sin datos privados**. Un archivo con nombre y documento de
 * ciento veinte menores no se produce por omisión: se pide, y quien lo pide
 * sabe que después tiene que guardarlo como lo que es.
 */

import { writeFileSync } from 'node:fs'

import { loadCompetitionEnvironment } from '../competition/environment'
import { systemClock } from '@/server/competition/clock'
import { requireCompetitionConfiguration } from '@/server/competition/config'
import {
  exportFilename,
  exportParticipantsCsv,
} from '@/server/competition/export'
import { loadOrganizerDashboard } from '@/server/competition/organizer'
import { createCompetitionStore } from '@/server/competition/runtime'
import { currentRelease, releaseFingerprint } from '@/release'

function argument(name: string): string | undefined {
  const prefix = `--${name}=`
  const found = process.argv.find((value) => value.startsWith(prefix))
  return found?.slice(prefix.length)
}

loadCompetitionEnvironment()

const includePrivate = process.argv.includes('--private')
const config = requireCompetitionConfiguration()
const store = createCompetitionStore()
const competition = await store.findCompetitionBySlug(config.slug)

if (competition === undefined) {
  process.stderr.write(`No existe la edición "${config.slug}".\n`)
  process.exit(1)
}

const release = currentRelease()
const dashboard = await loadOrganizerDashboard(
  { store, clock: systemClock, config },
  competition,
)

/**
 * Sin `--private`, los campos privados se vacían antes de formatear.
 *
 * Se vacían en lugar de quitar la columna: un archivo con el mismo encabezado
 * siempre se lee con la misma planilla, y una columna vacía dice «esto existe y
 * no te lo estoy dando», que es más claro que una columna ausente.
 */
const rows = includePrivate
  ? dashboard.participants
  : dashboard.participants.map((participant) => ({
      ...participant,
      fullName: undefined,
      schoolYear: undefined,
      division: undefined,
      dniLast4: undefined,
    }))

const csv = exportParticipantsCsv({ ...dashboard, participants: rows })

/**
 * El encabezado de procedencia.
 *
 * Tres líneas de comentario antes del CSV con la edición, la seed y la huella
 * del release. Es lo que convierte un archivo de puntajes en evidencia: sin
 * ellas, dentro de tres años nadie puede decir bajo qué reglas se produjeron
 * esos números, que es justamente la pregunta que el congelamiento existe para
 * contestar.
 */
const provenance = [
  `# edicion=${competition.slug} estado=${competition.status}`,
  `# release=${release.releaseId}@${release.releaseVersion} huella=${releaseFingerprint(release)}`,
  `# motor=${competition.engineVersion} ruleset=${competition.rulesetVersion} contenido=${competition.contentVersion} catalogo=${competition.variantCatalogVersion} score=${competition.scoreVersion}`,
  `# seed=${competition.runSeed} plan=${competition.runPlanFingerprint}`,
  `# privado=${includePrivate ? 'si' : 'no'} exportado=${systemClock.now().toISOString()}`,
  '',
].join('\r\n')

const document = `${provenance}${csv}`
const out = argument('out')

if (out === undefined) {
  process.stdout.write(document)
} else {
  writeFileSync(out, document, { encoding: 'utf8', mode: 0o600, flag: 'wx' })
  process.stdout.write(
    [
      `Exportado a ${out}`,
      `  ${String(rows.length)} participantes · ${includePrivate ? 'CON' : 'sin'} datos privados`,
      includePrivate
        ? '  Contiene datos personales de menores. Guardalo donde corresponda y borralo cuando deje de hacer falta.'
        : `  Nombre sugerido para el archivo público: ${exportFilename(competition.slug, systemClock.now())}`,
      '',
    ].join('\n'),
  )
}
