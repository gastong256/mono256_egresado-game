import type { Metadata, Viewport } from 'next'
import type { ReactNode } from 'react'

import { BRAND_HEX } from '@/lib/ui/brand'

import { fontVariables } from './fonts'
import './globals.css'

/**
 * Layout raíz.
 *
 * Las dos familias del sistema se cargan con `next/font/local` desde
 * `src/app/fonts`: sin pedido a un CDN en runtime y sin descarga durante el
 * build. Cada una publica su variable CSS, que es lo que consumen los tokens
 * `--font-display` y `--font-body`.
 *
 * `lang="es-AR"` no es decorativo: el juego escribe coma decimal, punto de miles
 * y hora de 24 h, y un lector de pantalla tiene que leerlos con esas reglas.
 */

export const metadata: Metadata = {
  title: 'Egresado',
  description: 'Un juego web de decisiones y desafíos matemáticos.',
  applicationName: 'Egresado',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: BRAND_HEX.canvas,
}

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="es-AR" className={fontVariables}>
      <body className="bg-canvas text-ink text-body font-body min-h-dvh antialiased">
        {children}
      </body>
    </html>
  )
}
