'use client'

import Link from 'next/link'
import { useEffect } from 'react'

import { Button, Wordmark } from '@/components/ui'

/**
 * Algo se rompió al dibujar una página.
 *
 * Next lo captura por segmento; acá se le da la hoja de Egresado, una frase
 * en castellano y dos salidas: volver a intentar el render o ir a la portada.
 * El detalle técnico va a la consola, nunca a la pantalla de un estudiante.
 * Una partida en curso no se pierde por esto: el checkpoint sigue en el
 * navegador y la portada ofrece continuarla.
 */
export default function ErrorPage({
  error,
  reset,
}: {
  readonly error: Error & { digest?: string }
  readonly reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <main className="px-gutter pb-safe max-w-viewport mx-auto flex min-h-dvh w-full flex-col justify-center py-6">
      <section className="eg-canvas border-rule flex flex-col gap-4 border p-5">
        <Wordmark size="md" />
        <h1 className="text-section font-display text-ink text-balance">
          Algo salió mal al mostrar esta página.
        </h1>
        <p className="text-body text-ink-secondary text-pretty">
          No es culpa tuya. Si estabas jugando, tu avance quedó guardado en este
          navegador y podés continuarlo desde la portada.
        </p>
        <Button onClick={reset}>Probar de nuevo</Button>
        <Link
          href="/"
          className="text-action border-ink text-ink hover:bg-canvas-sunken inline-flex min-h-[46px] w-full items-center justify-center border-[1.5px] px-5 uppercase"
        >
          Ir a la portada
        </Link>
      </section>
    </main>
  )
}
