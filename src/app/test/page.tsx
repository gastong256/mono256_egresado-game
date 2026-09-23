import type { Metadata } from 'next'
import { PracticeExperience } from '@/components/practice/practice-experience'

// Request-specific CSP nonces require a fresh document, as on the public home.
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Modo práctica | Egresado',
  description:
    'Probá la carrera completa sin identificarte ni participar del ranking.',
}

export default function PracticePage() {
  return <PracticeExperience />
}
