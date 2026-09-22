#!/usr/bin/env node
/**
 * Genera los secretos de un despliegue, sin escribir un solo archivo.
 *
 *     pnpm secrets:generate
 *
 * Imprime y nada más. Escribir `.env.local` desde acá parecería una comodidad y
 * sería la forma más rápida de que un secreto de producción termine en el disco
 * de una máquina de desarrollo y, de ahí, en un backup de esa máquina. Quien
 * despliega copia el valor al gestor de secretos de su plataforma; nadie tiene
 * que guardarlo dos veces.
 *
 * El digest del organizador **no** se genera acá: necesita una contraseña que
 * una persona elija, y para eso está `pnpm competition:organizer:hash`.
 */

import { randomBytes } from 'node:crypto'

const identity = randomBytes(48).toString('base64')

process.stdout.write(
  [
    'Secretos nuevos. Copialos al gestor de secretos del despliegue y no los guardes en disco.',
    '',
    `PARTICIPANT_IDENTITY_SECRET=${identity}`,
    '',
    'Falta uno, y no se puede generar solo:',
    '',
    '  pnpm competition:organizer:hash -- "<contraseña que elija una persona>"',
    '',
    'Rotación: el secreto de identidad NO se rota dentro de una edición abierta.',
    'Las claves derivadas dependen de él, así que rotarlo deja a los participantes',
    'sin poder reconocerse. Entre ediciones no cuesta nada.',
    '',
  ].join('\n'),
)
