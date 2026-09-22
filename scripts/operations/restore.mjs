#!/usr/bin/env node
/**
 * Restauración de un respaldo, en un destino que se declara a mano.
 *
 *     pnpm ops:restore -- --schema=backups/x.schema.sql --data=backups/x.data.sql --local
 *     pnpm ops:restore -- --data=backups/x.data.sql --db-url="postgresql://…"
 *
 * Tres decisiones, y las tres existen para que esto no se pueda usar por error.
 *
 * 1. **El destino es obligatorio y explícito.** No hay default. Un script de
 *    restauración cuyo destino por omisión sea «la base que esté configurada»
 *    es un script que un día pisa producción porque alguien tenía el `.env` de
 *    producción cargado.
 *
 * 2. **Restaurar datos sobre una base con filas exige `--force`.** El caso
 *    normal es restaurar en un destino vacío o descartable. Si el destino ya
 *    tiene participantes, o el operador se equivocó de base, o está por mezclar
 *    dos ferias — y las dos cosas hay que verlas antes, no después.
 *
 * 3. **Usa `psql`, no un cliente propio.** El archivo lo escribió `pg_dump`;
 *    lo lee la herramienta que lo entiende.
 */

import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'

function argument(name) {
  const prefix = `--${name}=`
  const found = process.argv.find((value) => value.startsWith(prefix))
  return found === undefined ? undefined : found.slice(prefix.length)
}

const schemaFile = argument('schema')
const dataFile = argument('data')
const dbUrl = argument('db-url')
const local = process.argv.includes('--local')
const force = process.argv.includes('--force')

if (schemaFile === undefined && dataFile === undefined) {
  process.stderr.write(
    'Indicá al menos --schema= o --data=. Ver `pnpm ops:backup` para producirlos.\n',
  )
  process.exit(2)
}
if (dbUrl === undefined && !local) {
  process.stderr.write(
    [
      'Falta el destino. No hay uno por omisión a propósito.',
      '  --local                        la base local de `pnpm db:start`',
      '  --db-url="postgresql://…"      cualquier otra, escrita entera',
      '',
    ].join('\n'),
  )
  process.exit(2)
}

/** La cadena de la base local de Supabase, que es fija y pública. */
const LOCAL_URL = 'postgresql://postgres:postgres@127.0.0.1:54322/postgres'
const connection = dbUrl ?? LOCAL_URL

if (local && dbUrl !== undefined) {
  process.stderr.write('Indicá un solo destino: --local o --db-url.\n')
  process.exit(2)
}

const files = [schemaFile, dataFile]
  .filter((file) => file !== undefined)
  .map((file) => resolve(file))
for (const file of files) {
  if (!existsSync(file)) {
    process.stderr.write(`No existe ${file}\n`)
    process.exit(2)
  }
}

function psql(args) {
  return spawnSync(
    'psql',
    [connection, '--no-psqlrc', '--variable', 'ON_ERROR_STOP=1', ...args],
    {
      stdio: ['ignore', 'pipe', 'pipe'],
      encoding: 'utf8',
    },
  )
}

function checked(result, operation) {
  if (result.error || result.status !== 0) {
    // Driver errors can contain connection strings or COPY rows with PII.
    process.stderr.write(
      `${operation} falló. Revisá conectividad, permisos y compatibilidad del respaldo; no se imprimen datos del driver.\n`,
    )
    process.exit(1)
  }
  return result.stdout.trim()
}

const tables = checked(
  psql(['-tAc', "select tablename from pg_tables where schemaname='public'"]),
  'La comprobación del destino',
)
  .split('\n')
  .filter(Boolean)
if (dataFile !== undefined && !force) {
  for (const table of tables) {
    const quoted = '"' + table.replaceAll('"', '""') + '"'
    const occupied = checked(
      psql(['-tAc', `select exists(select 1 from public.${quoted} limit 1)`]),
      'La comprobación de filas',
    )
    if (occupied !== 't' && occupied !== 'f') {
      process.stderr.write(
        'Respuesta de comprobación inválida; no se restaura.\n',
      )
      process.exit(1)
    }
    if (occupied === 't') {
      process.stderr.write(
        'El destino ya tiene filas. Usá un destino vacío o --force sólo si querés mezclar datos deliberadamente.\n',
      )
      process.exit(3)
    }
  }
}

process.stdout.write(
  `Restaurando en ${local ? 'la base local' : 'el destino indicado'}\n`,
)
// Schema and data share one transaction: a failed COPY cannot leave half a
// competition restored. ON_ERROR_STOP makes psql roll everything back.
checked(
  psql([
    '--single-transaction',
    '--quiet',
    ...files.flatMap((file) => ['--file', file]),
  ]),
  'La restauración',
)
const counts = checked(
  psql([
    '-tAc',
    "select (select count(*) from public.competitions) || '/' || (select count(*) from public.participants) || '/' || (select count(*) from public.attempts)",
  ]),
  'La verificación posterior',
)
process.stdout.write(`Listo. Competencias/participantes/intentos: ${counts}\n`)
