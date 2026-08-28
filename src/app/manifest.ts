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
  }
}
