import type { Metadata } from 'next'
import Link from 'next/link'

/**
 * Entrada de Egresado.
 *
 * Server Component estático: el jugador ve la portada sin esperar a que cargue
 * nada del juego. Lo interactivo empieza recién en `/jugar`.
 */

export const metadata: Metadata = {
  title: 'Egresado — un juego sobre decidir en la escuela',
  description:
    'Recorré la secundaria tomando decisiones donde los números importan. La primera versión jugable cubre 7.º grado.',
}

export default function Home() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-xl flex-col justify-center gap-8 px-5 py-12">
      <header className="flex flex-col gap-4">
        <h1 className="text-5xl font-semibold tracking-tight">Egresado</h1>
        <p className="text-lg text-pretty text-slate-700 dark:text-slate-300">
          Seis años de secundaria en unos minutos. Comprás la pintura del mural,
          decidís en qué colectivo te subís y repartís el trabajo grupal. Los
          números no son un ejercicio aparte: son lo que te deja decidir bien.
        </p>
      </header>

      <Link
        href="/jugar"
        className="flex min-h-14 items-center justify-center rounded-xl bg-slate-900 px-6 text-lg font-semibold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 dark:bg-slate-100 dark:text-slate-900 dark:focus-visible:outline-slate-100"
      >
        Jugar
      </Link>

      <section className="flex flex-col gap-2 text-sm text-slate-600 dark:text-slate-400">
        <p>
          Esta primera versión jugable cubre <strong>7.º grado</strong>: cinco
          situaciones y el cierre del año.
        </p>
        <p>
          No hace falta crear una cuenta. Sólo elegís un nombre y la partida
          queda en tu dispositivo.
        </p>
      </section>
    </main>
  )
}
