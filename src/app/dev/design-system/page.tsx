import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { DesignSystemShowcase } from '@/components/dev/design-system-showcase'
import { isDevelopmentHarnessEnabled } from '@/server/development/harness-access'

/**
 * Referencia viva del sistema de diseño.
 *
 * Disponible en desarrollo, y fuera de ahí sólo con el opt-in del servidor. En
 * cualquier otro ambiente devuelve 404, así que no se llega adivinando la ruta
 * en un deploy.
 *
 * Es la fuente visual a la que hay que mirar antes de inventar una primitiva
 * nueva: si el patrón ya está acá, se compone en lugar de escribirse de cero.
 */
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Sistema de diseño — herramienta de desarrollo',
  robots: { index: false, follow: false },
}

export default function DesignSystemPage() {
  if (!isDevelopmentHarnessEnabled()) {
    notFound()
  }

  return <DesignSystemShowcase />
}
