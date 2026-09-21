/**
 * Carga `.env.local` y `.env` para los comandos de competencia.
 *
 * Next.js hace esto solo para la aplicación, pero un script que corre bajo
 * `vite-node` arranca con el entorno pelado. Sin esto, `pnpm
 * competition:bootstrap` obligaría a exportar ocho variables a mano cada vez, y
 * la primera vez que alguien se olvide una el error va a ser "falta el
 * responsable de los datos" en lugar de "olvidaste el archivo".
 *
 * Lo que ya está en el entorno **gana**. Es lo que permite que un pipeline pase
 * sus propios valores sin que un `.env.local` olvidado en la máquina los pise.
 */

import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

/** Los mismos archivos que Next.js lee, en el mismo orden de precedencia. */
const FILES = ['.env.local', '.env'] as const

function parse(contents: string): Map<string, string> {
  const values = new Map<string, string>()
  for (const line of contents.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (trimmed.length === 0 || trimmed.startsWith('#')) continue
    const separator = trimmed.indexOf('=')
    if (separator === -1) continue
    const key = trimmed.slice(0, separator).trim()
    let value = trimmed.slice(separator + 1).trim()
    // Comillas simples o dobles alrededor del valor: se sacan, y lo de adentro
    // se toma literal. Un digest de scrypt lleva `$`, que sin comillas el shell
    // expandiría antes de que el archivo llegue acá.
    if (
      value.length >= 2 &&
      ((value.startsWith("'") && value.endsWith("'")) ||
        (value.startsWith('"') && value.endsWith('"')))
    ) {
      value = value.slice(1, -1)
    }
    values.set(key, value)
  }
  return values
}

export function loadCompetitionEnvironment(): void {
  for (const file of FILES) {
    const path = resolve(process.cwd(), file)
    if (!existsSync(path)) continue
    for (const [key, value] of parse(readFileSync(path, 'utf8'))) {
      if (process.env[key] === undefined) {
        process.env[key] = value
      }
    }
  }
}
