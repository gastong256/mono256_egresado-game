import type { Metadata } from 'next'
import Link from 'next/link'
import { PrivacyPolicy } from '@/components/competition/privacy-policy'
import { readPrivacyNotice } from '@/server/competition/page-data'

// Configured notice and request-specific CSP nonce; never a build-time legal page.
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Política de Privacidad | Egresado',
  description:
    'Cómo se usan y protegen los datos de participación en Egresado.',
}

export default function PrivacyPage() {
  const notice = readPrivacyNotice()
  return (
    <main className="px-gutter mx-auto flex w-full max-w-3xl flex-col gap-4 py-6">
      <Link
        href="/"
        prefetch={false}
        className="text-meta text-ink inline-flex min-h-11 items-center self-start underline underline-offset-4"
      >
        Volver al inicio
      </Link>
      {notice === undefined ? (
        <section className="eg-canvas border-rule flex flex-col gap-3 border p-5">
          <h1 className="text-section font-display text-ink">
            Política de Privacidad
          </h1>
          <p className="text-body text-ink-secondary">
            El aviso estará disponible cuando se configure la competencia.
            Mientras tanto, podés probar el juego sin ingresar datos de
            identificación.
          </p>
          <Link
            href="/test"
            prefetch={false}
            className="text-meta text-ink inline-flex min-h-11 items-center underline underline-offset-4"
          >
            Practicar
          </Link>
        </section>
      ) : (
        <PrivacyPolicy notice={notice} />
      )}
    </main>
  )
}
