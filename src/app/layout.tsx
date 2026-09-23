import type { Metadata, Viewport } from 'next'
import type { ReactNode } from 'react'

import { getPublicEnvironment } from '@/config/env.client'
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
  // Las URL absolutas de la imagen social salen de acá; el esquema ya
  // valida la variable y en local cae a `http://localhost:3000`.
  metadataBase: new URL(getPublicEnvironment().NEXT_PUBLIC_APP_URL),
  title: 'Egresado',
  description:
    'Un juego web sobre decidir en la escuela: la secundaria de 7.º a 5.º en decisiones con números.',
  applicationName: 'Egresado',
  // La imagen social es `src/app/opengraph-image.jpg` (con su `.alt.txt`),
  // compuesta por `pnpm brand:og` desde el isotipo, la fuente real y el hero.
  // Next la publica en `og:image` y, con la tarjeta grande, X/Twitter la
  // hereda de Open Graph junto con título y descripción.
  twitter: { card: 'summary_large_image' },
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
