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

/**
 * Marca en el título y descripción según el estado real del evento.
 *
 * Salen de la misma lectura pública que dibuja la portada: el nombre de la
 * edición va en la descripción, no se concatena a la marca de la pestaña, y
 * el estado —abierta, próxima, cerrada— cambia qué promete la pestaña. Nada
 * de sesión entra acá: la metadata es la misma para todo el mundo.
 */
export async function generateMetadata(): Promise<Metadata> {
  const { competition } = await readPublicState()
  const title = 'Egresado'
  const description =
    competition.status === 'open'
      ? `Es tu turno en ${competition.name}: recorré la secundaria de 7.º a 5.º, tomá decisiones y buscá tu mejor puntaje.`
      : competition.status === 'upcoming'
        ? `Se viene ${competition.name}. Mientras tanto, practicá a tu ritmo y recorré la secundaria de 7.º a 5.º.`
        : competition.status === 'closed'
          ? `Terminó la competencia de ${competition.name}. Mirá los resultados y seguí practicando a tu ritmo.`
          : 'Recorré la secundaria de 7.º a 5.º tomando decisiones donde los números importan. Jugá la competencia y mirá el ranking.'
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      siteName: 'Egresado',
      type: 'website',
      locale: 'es_AR',
    },
  }
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
