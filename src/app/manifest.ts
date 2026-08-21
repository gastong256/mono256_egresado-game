import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Egresado',
    short_name: 'Egresado',
    description: 'Juego web de decisiones y desafíos matemáticos.',
    start_url: '/',
    display: 'standalone',
    background_color: '#f4f1e9',
    theme_color: '#132a25',
    lang: 'es',
  }
}
