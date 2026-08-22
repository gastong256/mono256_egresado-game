import { ArrowRight } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'

import { Wordmark } from '@/components/ui'

/**
 * Entrada de Egresado.
 *
 * Server Component estático: el jugador ve la portada sin esperar a que cargue
 * nada del juego. Lo interactivo empieza recién en `/jugar`.
 *
 * Es la primera impresión de marca, así que es el único lugar de la portada
 * donde el verde ocupa espacio propio: el bloque de la acción principal.
 */

export const metadata: Metadata = {
  title: 'Egresado — un juego sobre decidir en la escuela',
  description:
    'Recorré la secundaria tomando decisiones donde los números importan. La primera versión jugable cubre 7.º grado.',
}

export default function Home() {
  return (
    <main className="max-w-game px-gutter pb-safe mx-auto flex min-h-dvh w-full flex-col justify-center gap-8 py-12">
      <header className="flex flex-col gap-5">
        <h1>
          <Wordmark size="lg" />
        </h1>
        <p className="text-title text-foreground text-balance">
          Seis años de secundaria en unos minutos.
        </p>
        <p className="text-body text-foreground-muted text-pretty">
          Comprás la pintura del mural, decidís en qué colectivo te subís y
          repartís el trabajo grupal. Los números no son un ejercicio aparte:
          son lo que te deja decidir bien.
        </p>
      </header>

      <Link
        href="/jugar"
        className="bg-primary text-primary-foreground rounded-control text-heading motion-fast hover:bg-primary-hover flex min-h-14 items-center justify-center gap-2 px-6 transition-[background-color]"
      >
        Jugar
        <ArrowRight aria-hidden className="size-5" />
      </Link>

      <section className="text-caption text-foreground-muted flex flex-col gap-2">
        <p className="text-pretty">
          Esta primera versión jugable cubre{' '}
          <strong className="text-foreground font-semibold">7.º grado</strong>:
          cinco situaciones y el cierre del año.
        </p>
        <p className="text-pretty">
          No hace falta crear una cuenta. Sólo elegís un nombre y la partida
          queda en tu dispositivo.
        </p>
      </section>
    </main>
  )
}
