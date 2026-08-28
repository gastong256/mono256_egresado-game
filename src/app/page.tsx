import type { Metadata } from 'next'
import Link from 'next/link'

import { Eyebrow, Wordmark } from '@/components/ui'

/**
 * Entrada de Egresado.
 *
 * Server Component estático: el jugador ve la portada sin esperar a que cargue
 * nada del juego. Lo interactivo empieza recién en `/jugar`.
 *
 * Es la primera impresión de marca y por eso usa la misma hoja cuadriculada que
 * el resto: no hay una estética de portada aparte. El único saturado es el
 * bloque de la acción principal, que es exactamente para lo que existe la lima.
 *
 * El enlace se estila como el primario en lugar de envolver un `<Button>`: es
 * navegación, y un `<a>` disfrazado de botón pierde abrir en pestaña nueva,
 * copiar la dirección y el menú contextual.
 */

export const metadata: Metadata = {
  title: 'Egresado — un juego sobre decidir en la escuela',
  description:
    'Recorré la secundaria tomando decisiones donde los números importan. La primera versión jugable cubre 7.º grado.',
}

export default function Home() {
  return (
    <main className="px-gutter pb-safe flex min-h-dvh w-full justify-center py-6">
      <div className="max-w-viewport flex w-full flex-col gap-3">
        <div className="eg-canvas border-rule flex min-h-[560px] flex-col gap-4 border px-4 py-[18px]">
          <header className="flex flex-col gap-3">
            <Eyebrow>Juego de matemática escolar</Eyebrow>
            <h1>
              <Wordmark size="lg" />
            </h1>
            <p className="text-section font-display text-ink text-balance">
              Seis años de secundaria en unos minutos.
            </p>
            <p className="text-body-lg text-ink-secondary text-pretty">
              Comprás la pintura del mural, decidís en qué colectivo te subís y
              repartís el trabajo grupal. Los números no son un ejercicio
              aparte: son lo que te deja decidir bien.
            </p>
          </header>

          <section className="text-caption text-ink-secondary flex flex-col gap-2">
            <p className="text-pretty">
              Esta primera versión jugable cubre{' '}
              <strong className="text-ink font-semibold">7.º grado</strong>:
              cinco situaciones y el cierre del año.
            </p>
            <p className="text-pretty">
              No hace falta crear una cuenta. Sólo elegís un nombre y la partida
              queda en tu dispositivo.
            </p>
          </section>

          <div className="mt-auto pt-4">
            <Link
              href="/jugar"
              className="bg-action text-on-action text-action font-display motion-select hover:bg-action-hover flex min-h-[50px] w-full items-center justify-center px-6 uppercase"
            >
              Jugar
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
