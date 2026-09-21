import type { Metadata } from 'next'

import { OrganizerConsole } from '@/components/competition/organizer-console'
import { readOrganizerPageData } from '@/server/competition/page-data'

/**
 * La superficie del organizador.
 *
 * No contradice que el producto público viva en una sola dirección: esto no es
 * una segunda forma de jugar, es la herramienta con la que un docente opera la
 * feria. No emite intentos, no puntúa y no aparece enlazada desde ninguna
 * pantalla de estudiante.
 *
 * La página en sí no decide nada: el control está en el servidor, y cada
 * llamada de la consola pasa por una sesión de organizador. Que la ruta exista
 * sin sesión no expone nada — lo que devuelve es el formulario de acceso.
 * Esconder la dirección no habría sido una defensa; comprobar la sesión en cada
 * lectura sí lo es.
 */
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Organización — Egresado',
  robots: { index: false, follow: false },
}

export default async function OrganizerPage() {
  const { authenticated, dashboard } = await readOrganizerPageData()

  return (
    <main className="px-gutter pb-safe flex min-h-dvh w-full justify-center py-6">
      <div className="max-w-viewport flex w-full flex-col gap-4">
        <h1 className="text-section font-display text-ink">Organización</h1>
        <OrganizerConsole
          initialAuthenticated={authenticated}
          initialDashboard={dashboard}
        />
      </div>
    </main>
  )
}
