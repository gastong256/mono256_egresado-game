/** Entorno de las CLI: proceso > --env-file > .env.local > .env. */
import { existsSync, readFileSync, statSync } from 'node:fs'
import { resolve } from 'node:path'
import { parseEnv } from 'node:util'

function explicitFile(args: readonly string[]): string | undefined {
  let selected: string | undefined
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index]
    if (arg !== '--env-file' && !arg?.startsWith('--env-file=')) continue
    const value =
      arg === '--env-file' ? args[++index] : arg.slice('--env-file='.length)
    if (selected !== undefined || !value || value.startsWith('--')) {
      throw new Error('Indicá un único --env-file con una ruta no vacía.')
    }
    selected = value
  }
  return selected
}

/**
 * No usa shell ni expande $VARIABLE/$(comando). Node conserva Unicode y valores
 * entre comillas. Lee y valida todo antes de modificar el entorno. Los errores
 * no incluyen contenidos, rutas ni mensajes del sistema que puedan ser secretos.
 * Los parsers de cada comando conservan sus argumentos; ignoran esta opción.
 */
export function loadCompetitionEnvironment(
  args: readonly string[] = process.argv.slice(2),
): void {
  const explicit = explicitFile(args)
  const files = [
    ...(explicit === undefined ? [] : [{ file: explicit, required: true }]),
    { file: '.env.local', required: false },
    { file: '.env', required: false },
  ]
  const values = new Map<string, string>()
  for (const { file, required } of files) {
    const path = resolve(process.cwd(), file)
    if (!required && !existsSync(path)) continue
    let contents: string
    try {
      const stat = statSync(path)
      if (!stat.isFile()) throw new Error()
      if (
        required &&
        process.platform !== 'win32' &&
        (stat.mode & 0o077) !== 0
      ) {
        throw new Error('permissions')
      }
      contents = readFileSync(path, 'utf8')
    } catch {
      throw new Error(
        required
          ? 'No se pudo leer --env-file: debe existir, ser un archivo legible y tener permisos privados (chmod 600 en POSIX).'
          : 'No se pudo leer un archivo de entorno local.',
      )
    }
    let parsed: ReturnType<typeof parseEnv>
    try {
      parsed = parseEnv(contents)
    } catch {
      throw new Error(
        'No se pudo interpretar el archivo de entorno; revisá su formato dotenv.',
      )
    }
    for (const [key, value] of Object.entries(parsed)) {
      if (value !== undefined && !values.has(key)) values.set(key, value)
    }
  }
  for (const [key, value] of values) {
    if (process.env[key] === undefined) process.env[key] = value
  }
}
