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
 * Título y descripción según el estado real del evento.
 *
 * Salen de la misma lectura pública que dibuja la portada: el nombre de la
 * edición es configuración del despliegue, no una constante del componente, y
 * el estado —abierta, próxima, cerrada— cambia qué promete la pestaña. Nada
 * de sesión entra acá: la metadata es la misma para todo el mundo.
 */
export async function generateMetadata(): Promise<Metadata> {
  const { competition } = await readPublicState()
  const configured = competition.status !== 'not-configured'
  const title = configured
    ? `Egresado · ${competition.name}`
    : 'Egresado — un juego sobre decidir en la escuela'
  const description =
    competition.status === 'open'
      ? `${competition.name} está abierta: recorré la secundaria de 7.º a 5.º tomando decisiones con números y buscá tu puesto en el ranking.`
      : competition.status === 'upcoming'
        ? `${competition.name} abre pronto. Mientras tanto, probá Egresado sin competir: la secundaria de 7.º a 5.º en decisiones con números.`
        : competition.status === 'closed'
          ? `${competition.name} cerró. Mirá los resultados y practicá la secundaria de 7.º a 5.º con decisiones con números.`
          : 'Recorré la secundaria de 7.º a 5.º tomando decisiones donde los números importan. Jugá la competencia y mirá el ranking.'
  return {
    title,
    description,
    openGraph: { title, description, type: 'website', locale: 'es_AR' },
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
