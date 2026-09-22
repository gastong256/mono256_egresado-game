#!/usr/bin/env node
/**
 * Respaldo de la competencia.
 *
 *     pnpm ops:backup                          la base local
 *     pnpm ops:backup -- --linked              el proyecto enlazado
 *     pnpm ops:backup -- --db-url="postgresql://…"
 *     pnpm ops:backup -- --out=backups/pre-feria
 *
 * Envuelve `supabase db dump`, que es `pg_dump` con las exclusiones que Supabase
 * necesita. No inventa un formato: un respaldo en un formato propio es un
 * respaldo que sólo se puede restaurar con el código que lo escribió, y el
 * momento en que hace falta restaurar es exactamente el momento en que ese
 * código puede ser el que falló.
 *
 * Escribe **dos** archivos y la distinción importa:
 *
 * ```text
 * <nombre>.schema.sql    estructura: tablas, índices, restricciones, grants, RLS
 * <nombre>.data.sql      filas
 * ```
 *
 * Restaurar estructura y datos por separado es lo que permite el caso que de
 * verdad ocurre: la base está sana y alguien borró resultados. Ahí se restauran
 * datos sobre una estructura que no hay que tocar. Un único archivo obligaría a
 * recrear el esquema para recuperar filas, que es más riesgo del que se estaba
 * arreglando.
 *
 * Lo que un respaldo **no** puede devolver, y por eso está escrito acá y en el
 * runbook: `PARTICIPANT_IDENTITY_SECRET` no vive en la base. Sin él, las claves
 * de identidad restauradas no se pueden volver a derivar y nadie puede
 * reingresar. El secreto se respalda donde se respaldan los secretos.
 */

import { chmodSync, mkdirSync, statSync } from 'node:fs'
import { resolve } from 'node:path'

import { runPnpmSync } from '../run-pnpm.mjs'

function argument(name, fallback) {
  const prefix = `--${name}=`
  const found = process.argv.find((value) => value.startsWith(prefix))
  return found === undefined ? fallback : found.slice(prefix.length)
}

function flag(name) {
  return process.argv.includes(`--${name}`)
}

/** Dónde apunta el dump. Local salvo que se pida otra cosa, explícitamente. */
function target() {
  const dbUrl = argument('db-url')
  if (dbUrl !== undefined)
    return { label: 'db-url', flags: ['--db-url', dbUrl] }
  if (flag('linked')) return { label: 'linked', flags: ['--linked'] }
  return { label: 'local', flags: ['--local'] }
}

// Dumps contain private identities and session digests.
process.umask(0o077)

const where = target()
const stamp = new Date().toISOString().replace(/[:.]/gu, '-')
const directory = resolve(argument('out', 'backups'))
const name = argument('name', `egresado-${where.label}-${stamp}`)

mkdirSync(directory, { recursive: true, mode: 0o700 })

function dump(label, file, extra) {
  const path = resolve(directory, file)
  process.stdout.write(`  ${label} → ${path}\n`)
  // A través de `pnpm exec`, que es como el resto del repositorio invoca la
  // CLI: el binario vive en `.bin` y su ruta dentro de `node_modules` depende
  // del layout del gestor de paquetes, que no es algo que un script de
  // operaciones tenga que saber.
  const result = runPnpmSync(
    [
      'exec',
      'supabase',
      'db',
      'dump',
      ...where.flags,
      // Egresado owns public; Supabase auth/storage infrastructure must not be
      // copied into a disposable application database or another project.
      '--schema',
      'public',
      '--file',
      path,
      ...extra,
    ],
    { stdio: ['ignore', 'inherit', 'inherit'] },
  )
  if (result.error) throw result.error
  if (result.status !== 0) {
    process.stderr.write(`El dump de ${label} falló.\n`)
    process.exit(result.status ?? 1)
  }
  chmodSync(path, 0o600)
  return path
}

process.stdout.write(`Respaldo de ${where.label}\n`)
const schemaPath = dump('esquema', `${name}.schema.sql`, [])
// `--use-copy` produce `COPY` en vez de un `INSERT` por fila: restaurar una
// feria de quinientos participantes con dieciséis mil intentos por inserts
// individuales tarda minutos que no hay durante un incidente.
const dataPath = dump('datos', `${name}.data.sql`, [
  '--data-only',
  '--use-copy',
])

const sizes = [schemaPath, dataPath].map((path) => {
  const { size } = statSync(path)
  return `${path} (${(size / 1024).toFixed(1)} KiB)`
})

process.stdout.write(
  [
    '',
    'Listo.',
    ...sizes.map((line) => `  ${line}`),
    '',
    'Recordá que el respaldo NO incluye PARTICIPANT_IDENTITY_SECRET: sin ese',
    'secreto las identidades restauradas no se pueden volver a derivar.',
    '',
    'Restaurar en un destino descartable:',
    `  pnpm ops:restore -- --schema=${schemaPath} --data=${dataPath} --db-url="postgresql://…"`,
    '',
  ].join('\n'),
)
