import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { GameContainer } from '@/components/game/game-container'
import { isDevelopmentHarnessEnabled } from '@/server/development/harness-access'

/**
 * Ruta de revisión para el Teacher Gate.
 *
 * Es el mismo juego que `/dev/grade-7` —mismo contenido, mismas reglas, mismas
 * pantallas— con una sola diferencia: la partida arranca con el seed que se le
 * pide en la URL. Eso es lo que permite que dos personas, en dos días
 * distintos, vean exactamente la misma situación y discutan sobre lo mismo.
 *
 * Vive bajo `/dev` y no en la ruta del juego porque elegir el sorteo es
 * precisamente lo que una competencia no puede permitir. La misma puerta que
 * cierra el harness cierra ésta: fuera de desarrollo devuelve 404 salvo que el
 * servidor active la opción explícitamente.
 */
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Revisión docente — herramienta de desarrollo',
  robots: { index: false, follow: false },
}

export default async function TeacherGatePage({
  searchParams,
}: {
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  if (!isDevelopmentHarnessEnabled()) {
    notFound()
  }

  const params = await searchParams
  const raw = params['seed']
  const requested = Array.isArray(raw) ? raw[0] : raw
  // Los seeds son opacos; cualquier cosa fuera del juego de caracteres aceptado
  // cae en el caso por defecto en vez de llegar al motor.
  const seed =
    typeof requested === 'string' && /^[A-Za-z0-9._:-]{1,64}$/u.test(requested)
      ? requested
      : 'tg1-aa'

  return <GameContainer initialSeed={seed} />
}
