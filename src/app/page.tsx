import type { Metadata } from 'next'
import { InstitutionalFooter } from '@/components/competition/institutional-footer'

import { CompetitionExperience } from '@/components/competition/competition-experience'
import { readPublicState } from '@/server/competition/api'
import { readIdentityFormConfig } from '@/server/competition/page-data'

/**
 * Entrada a la competencia de Egresado.
 *
 * Acá el estudiante ve el ranking, se identifica y juega un intento oficial.
 * La práctica anónima vive en `/test`, con emisión y replay separados, sin
 * participantes ni ranking y sin parámetros públicos de seed.
 *
 * Es dinámica por necesidad, no por descuido: la respuesta incluye el saludo y
 * el puesto de quien la pide, así que una versión estática compartida le
 * mostraría a alguien la sesión de otro.
 */

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Egresado — un juego sobre decidir en la escuela',
  description:
    'Recorré la secundaria tomando decisiones donde los números importan. Jugá la competencia y mirá el ranking.',
}

export default async function Home() {
  const [state, formConfig] = await Promise.all([
    readPublicState(),
    Promise.resolve(safeFormConfig()),
  ])

  return (
    <CompetitionExperience
      initialState={state}
      formConfig={formConfig}
      footer={<InstitutionalFooter />}
    />
  )
}

/**
 * La configuración del formulario, tolerando un despliegue sin competencia.
 *
 * Un error de configuración ya se reporta en el estado público —la portada dice
 * que no hay competencia abierta—, así que hacer estallar el render acá
 * cambiaría un mensaje entendible por una pantalla de error.
 */
function safeFormConfig() {
  try {
    return readIdentityFormConfig()
  } catch {
    return undefined
  }
}
