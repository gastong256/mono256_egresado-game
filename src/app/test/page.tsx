import type { Metadata } from 'next'
import { PracticeExperience } from '@/components/practice/practice-experience'

// Request-specific CSP nonces require a fresh document, as on the public home.
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Modo práctica · Egresado',
  description:
    'Probá Egresado sin competir: la secundaria completa, de 7.º a 5.º, con las mismas reglas de puntaje y sin identificarte ni entrar al ranking.',
  openGraph: {
    title: 'Modo práctica · Egresado',
    description:
      'La secundaria completa, de 7.º a 5.º, sin identificarte ni entrar al ranking.',
    siteName: 'Egresado',
    type: 'website',
    locale: 'es_AR',
  },
}

export default function PracticePage() {
  return <PracticeExperience />
}
