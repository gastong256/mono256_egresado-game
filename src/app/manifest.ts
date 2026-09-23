import type { MetadataRoute } from 'next'

import { BRAND_HEX } from '@/lib/ui/brand'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Egresado',
    short_name: 'Egresado',
    description: 'Juego web de decisiones y desafíos matemáticos.',
    start_url: '/',
    display: 'standalone',
    background_color: BRAND_HEX.canvas,
    theme_color: BRAND_HEX.canvas,
    lang: 'es-AR',
    // El isotipo sobre papel, derivado de `src/lib/ui/brand-mark.ts` por
    // `pnpm brand:build`. El de 512 deja el margen que pide una máscara.
    icons: [
      {
        src: '/assets/brand/egresado-icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/assets/brand/egresado-icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/assets/brand/egresado-icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  }
}
