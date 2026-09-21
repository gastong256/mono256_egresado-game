/**
 * Deriva la credencial del organizador.
 *
 *     pnpm competition:organizer:hash -- 'la-contraseña'
 *
 * Imprime el digest para `EGRESADO_ORGANIZER_PASSWORD_HASH`. La contraseña en
 * claro no se guarda en ninguna parte: ni en la base, ni en el entorno, ni en
 * este repositorio. Lo que el despliegue conoce es el digest, y de un digest de
 * scrypt no se vuelve.
 *
 * Se pide por argumento y no por `stdin` interactivo a propósito: el argumento
 * queda en el historial del shell de quien lo corre, que es su propia máquina,
 * y la alternativa —pedirlo por prompt— no mejora nada si después hay que
 * copiarlo a un archivo igual.
 */

import { hashOrganizerPassword } from '@/server/competition/tokens'

const password = process.argv.slice(2).filter((value) => value !== '--')[0]

if (password === undefined || password.length < 12) {
  process.stderr.write(
    'Uso: pnpm competition:organizer:hash -- "<contraseña de al menos 12 caracteres>"\n',
  )
  process.exit(2)
}

const digest = await hashOrganizerPassword(password)
process.stdout.write(`EGRESADO_ORGANIZER_PASSWORD_HASH=${digest}\n`)
