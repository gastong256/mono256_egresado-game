/**
 * Crea la edición de competencia del despliegue.
 *
 *     pnpm competition:bootstrap
 *     pnpm competition:bootstrap -- --name="Feria 2026" --opens=2026-10-03T13:00:00-03:00 \
 *                                   --closes=2026-10-03T18:00:00-03:00 --status=UPCOMING
 *     pnpm competition:bootstrap -- --seed=feria2026   (seed explícita, para tests)
 *
 * Qué hace, y por qué así.
 *
 * La edición es una fila de la base, no una constante del código: su ventana,
 * su estado y su seed cambian por evento y tienen que quedar auditados. Lo que
 * el código aporta es la **tupla de versiones**, que sale del registro de
 * ediciones y no se escribe a mano — un número tipeado mal ahí produciría una
 * competencia que nadie puede verificar.
 *
 * La Competition Seed se genera acá, una sola vez, con aleatoriedad
 * criptográfica, y queda congelada junto con la huella del plan que produce.
 * Es la decisión de producto v1: **una seed compartida por edición**. Todos los
 * participantes juegan el mismo plan, las mismas variantes, la misma dificultad
 * y el mismo techo de oportunidades; lo único propio de cada intento es su
 * `runId`. La alternativa —una seed por intento— habría hecho que dos personas
 * compitieran contra problemas distintos.
 *
 * Es idempotente: si la edición ya existe, no la pisa. Cambiar la seed de una
 * competencia en curso invalidaría todas las partidas jugadas.
 */

import { randomBytes } from 'node:crypto'

import { loadCompetitionEnvironment } from './environment'
import { requireCompetitionConfiguration } from '@/server/competition/config'
import { FULL_CAREER_EDITION } from '@/server/competition/editions'
import { releaseBindingIssues } from '@/server/competition/freeze'
import { createCompetitionStore } from '@/server/competition/runtime'
import { currentRelease, releaseFingerprint } from '@/release'

/** El alfabeto de la seed: coincide con el charset que el motor acepta. */
const SEED_ALPHABET = 'abcdefghijkmnpqrstuvwxyz23456789'

function createCompetitionSeed(): string {
  const bytes = randomBytes(12)
  let seed = 'feria-'
  for (const byte of bytes) {
    seed += SEED_ALPHABET[byte % SEED_ALPHABET.length] ?? 'a'
  }
  return seed
}

function argument(name: string): string | undefined {
  const prefix = `--${name}=`
  const found = process.argv.find((value) => value.startsWith(prefix))
  return found?.slice(prefix.length)
}

loadCompetitionEnvironment()

const config = requireCompetitionConfiguration()
const store = createCompetitionStore()

const existing = await store.findCompetitionBySlug(config.slug)
if (existing !== undefined) {
  process.stdout.write(
    `La edición "${config.slug}" ya existe (${existing.status}). No se toca: ` +
      'cambiar la seed de una competencia en curso invalidaría las partidas jugadas.\n',
  )
  process.exit(0)
}

const status = argument('status') ?? 'UPCOMING'
if (!['DRAFT', 'UPCOMING', 'OPEN', 'CLOSED', 'ARCHIVED'].includes(status)) {
  process.stderr.write(`Estado desconocido: ${status}\n`)
  process.exit(2)
}

/*
 * Se busca una seed que componga un plan válido.
 *
 * En la práctica la primera alcanza —el compositor resuelve todo el espacio de
 * seeds que STAGE-08 midió—, pero una edición sin plan sería una competencia
 * que no se puede jugar, así que conviene descubrirlo acá y no cuando el primer
 * chico toque «Jugar».
 */
const requested = argument('seed')
let seed: string | undefined
let fingerprint: string | undefined

for (let attempt = 0; attempt < 32; attempt += 1) {
  const candidate = requested ?? createCompetitionSeed()
  const descriptor = FULL_CAREER_EDITION.createDescriptor(
    candidate,
    '00000000-0000-4000-8000-000000000000',
  )
  if (descriptor?.planFingerprint !== undefined) {
    seed = candidate
    fingerprint = descriptor.planFingerprint
    break
  }
  if (requested !== undefined) break
}

if (seed === undefined || fingerprint === undefined) {
  process.stderr.write(
    'No se pudo componer un plan de carrera completa para ninguna seed probada.\n',
  )
  process.exit(1)
}

const release = currentRelease()

const competition = await store.insertCompetition({
  slug: config.slug,
  name: argument('name') ?? `Egresado · ${config.slug}`,
  status: status as 'DRAFT' | 'UPCOMING' | 'OPEN' | 'CLOSED' | 'ARCHIVED',
  opensAt: argument('opens'),
  closesAt: argument('closes'),
  submissionGraceSeconds: Number(argument('grace') ?? '300'),
  runSeed: seed,
  runPlanFingerprint: fingerprint,
  privacyNoticeVersion: config.privacy.noticeVersion,
  retentionDays: config.privacy.retentionDays,
  ...FULL_CAREER_EDITION.versions,
})

/*
 * La edición recién creada tiene que corresponder al release que este código
 * implementa.
 *
 * La tupla sale del registro de ediciones, así que en condiciones normales
 * coincide por construcción. La comprobación existe para la condición anormal:
 * un `git checkout` a mitad de la tarde, un manifiesto editado sin regenerar el
 * candado, una rama con una versión de contenido distinta. Cualquiera de las
 * tres produce una competencia que después no se puede abrir, y es mucho mejor
 * saberlo ahora —cuando la edición está vacía— que cuando ya haya cincuenta
 * chicos anotados.
 */
const binding = releaseBindingIssues(competition, release)
if (binding.length > 0) {
  process.stderr.write(
    [
      `La edición creada no corresponde a ${release.releaseId} ${release.releaseVersion}:`,
      ...binding.map(
        (issue) =>
          `  ${issue.field}: el release espera ${issue.expected} y la edición tiene ${issue.found}`,
      ),
      'No se va a poder abrir. Corregí el desvío y volvé a crearla.',
      '',
    ].join('\n'),
  )
  process.exit(1)
}

process.stdout.write(
  [
    `Edición creada: ${competition.slug} (${competition.status})`,
    `  release: ${release.releaseId} ${release.releaseVersion} · huella ${releaseFingerprint(release)}`,
    `  edición de juego: ${FULL_CAREER_EDITION.label}`,
    `  motor ${competition.engineVersion} · ruleset ${competition.rulesetVersion}`,
    `  contenido ${competition.contentVersion} · catálogo ${competition.variantCatalogVersion}`,
    `  score ${competition.scoreVersion}`,
    `  seed compartida: ${competition.runSeed}`,
    `  huella del plan: ${competition.runPlanFingerprint}`,
    `  retención: ${String(competition.retentionDays)} días`,
    '',
  ].join('\n'),
)
