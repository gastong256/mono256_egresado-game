import { GeistSans } from 'geist/font/sans'
import type { Metadata, Viewport } from 'next'
import type { ReactNode } from 'react'

import { BRAND_HEX } from '@/lib/ui/brand'

import './globals.css'

/**
 * Layout raíz.
 *
 * La tipografía se carga con `next/font/local` a través del paquete `geist`:
 * los archivos viven en `node_modules`, así que no hay pedido a un CDN ni en
 * runtime ni durante el build, y el build sigue siendo reproducible sin red.
 *
 * `GeistSans.variable` publica `--font-geist-sans`, que es lo que consume el
 * token `--font-sans` del sistema de diseño.
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
    <html lang="es" className={GeistSans.variable}>
      <body className="bg-canvas text-foreground text-body min-h-dvh font-sans antialiased">
        {children}
      </body>
    </html>
  )
}
