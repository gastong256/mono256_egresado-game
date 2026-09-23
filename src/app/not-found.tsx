import Link from 'next/link'

import { Wordmark } from '@/components/ui'

/**
 * Página que no existe.
 *
 * El producto tiene tres puertas —la portada, la práctica y la consola del
 * organizador— y ninguna URL de partida: un enlace roto vuelve a la portada.
 * Misma hoja cuadriculada, mismo tono, sin código de error a la vista.
 */
export default function NotFound() {
  return (
    <main className="px-gutter pb-safe max-w-viewport mx-auto flex min-h-dvh w-full flex-col justify-center py-6">
      <section className="eg-canvas border-rule flex flex-col gap-4 border p-5">
        <Wordmark size="md" />
        <h1 className="text-section font-display text-ink text-balance">
          Esa página no está.
        </h1>
        <p className="text-body text-ink-secondary text-pretty">
          El enlace puede estar mal escrito o apuntar a algo que ya no existe.
          La competencia y la práctica siguen en la portada.
        </p>
        <Link
          href="/"
          className="text-action bg-action text-on-action hover:bg-action-hover inline-flex min-h-[50px] w-full items-center justify-center px-6 uppercase"
        >
          Ir a la portada
        </Link>
      </section>
    </main>
  )
}
