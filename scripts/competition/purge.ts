/**
 * Purga los datos privados de una edición vencida.
 *
 *     pnpm competition:privacy:purge            informa qué haría
 *     pnpm competition:privacy:purge -- --apply aplica si la retención venció
 *     pnpm competition:privacy:purge -- --apply --force   aplica igual
 *
 * Qué se va y qué queda. Se van nombre, año, división y últimos cuatro dígitos
 * —todo lo que identifica a una persona— y se revocan sus sesiones. Quedan el
 * alias, el puntaje verificado y la evidencia de replay, que no identifican a
 * nadie y permiten que el ranking de la feria siga siendo legible después.
 *
 * `--force` existe porque a veces los premios se entregan antes de que venza la
 * retención y el organizador prefiere no conservar los datos más tiempo del
 * necesario. Es explícito porque el riesgo es real en la otra dirección: sin
 * nombre ni últimos cuatro dígitos ya no se puede verificar a un ganador que
 * reclama después.
 *
 * Sin `--apply` no escribe nada. Es lo que permite mirar la fecha de
 * vencimiento y cuántos participantes hay antes de decidir.
 */

import { loadCompetitionEnvironment } from './environment'
import { systemClock } from '@/server/competition/clock'
import { requireCompetitionConfiguration } from '@/server/competition/config'
import { planPurge, purgeCompetition } from '@/server/competition/retention'
import { createCompetitionStore } from '@/server/competition/runtime'

const apply = process.argv.includes('--apply')
const force = process.argv.includes('--force')

loadCompetitionEnvironment()

const config = requireCompetitionConfiguration()
const store = createCompetitionStore()
const competition = await store.findCompetitionBySlug(config.slug)

if (competition === undefined) {
  process.stderr.write(`No existe la edición "${config.slug}".\n`)
  process.exit(1)
}

const dependencies = { store, clock: systemClock }
const plan = await planPurge(dependencies, competition)

process.stdout.write(
  [
    `Edición: ${competition.slug} (${competition.status})`,
    `  cierre: ${competition.closesAt ?? 'sin fecha de cierre'}`,
    `  retención: ${String(competition.retentionDays)} días`,
    `  vence: ${plan.dueAt ?? 'no calculable sin fecha de cierre'}`,
    `  participantes: ${String(plan.participants)} (${String(plan.alreadyAnonymized)} ya anonimizados)`,
    `  elegible para purgar: ${plan.eligible ? 'sí' : 'todavía no'}`,
    '',
  ].join('\n'),
)

if (!apply) {
  process.stdout.write('Sin --apply no se escribe nada.\n')
  process.exit(0)
}

if (!plan.eligible && !force) {
  process.stderr.write(
    'La retención todavía no venció. Usá --force sólo si los premios ya se entregaron.\n',
  )
  process.exit(1)
}

const result = await purgeCompetition(dependencies, competition, {
  actor: 'script:competition:privacy:purge',
  ...(force ? { force: true } : {}),
})

process.stdout.write(
  `Anonimizados ${String(result.anonymized)} participantes; ` +
    `${String(result.sessionsRevoked)} sesiones revocadas.\n`,
)
