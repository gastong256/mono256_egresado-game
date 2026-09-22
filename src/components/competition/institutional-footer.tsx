import Image from 'next/image'

/** Supplied institutional marks; optimized locally, with their original backgrounds. */
export function InstitutionalFooter() {
  return (
    <footer
      className="border-rule text-ink-secondary mt-4 border-t pt-6"
      aria-label="Institución y créditos"
    >
      <div className="grid gap-6 sm:grid-cols-3 sm:items-start">
        <div className="flex items-center gap-4 sm:flex-col sm:items-start">
          <Image
            src="/assets/footer/logo-piacentini.webp"
            alt="Colegio Integral Piacentini"
            width={320}
            height={320}
            unoptimized
            className="h-28 w-28 shrink-0 object-contain"
          />
          <p className="text-meta">Colegio Integral Piacentini</p>
        </div>
        <div className="flex items-center gap-4 sm:flex-col sm:items-start">
          <Image
            src="/assets/footer/logo-feria.webp"
            alt="Feria del Libro 2026 — Somos con otros"
            width={384}
            height={480}
            unoptimized
            className="h-40 w-32 shrink-0 object-contain"
          />
          <p className="text-meta">Feria del Libro 2026</p>
        </div>
        <a
          href="https://gastong256.dev"
          target="_blank"
          rel="noopener noreferrer"
          className="text-caption text-ink flex min-h-11 items-center gap-3 underline underline-offset-4 sm:flex-col sm:items-start"
        >
          <Image
            src="/assets/footer/logo-dev.webp"
            alt="Logo de gastong256.dev"
            width={160}
            height={160}
            unoptimized
            className="h-14 w-14 shrink-0 object-contain"
          />
          <span>
            developed by gastong256.dev
            <span className="sr-only"> (abre en otra pestaña)</span>
          </span>
        </a>
      </div>
      <a
        href="#privacy"
        className="text-meta text-ink mt-5 inline-flex min-h-11 items-center underline underline-offset-4"
      >
        Aviso de privacidad
      </a>
    </footer>
  )
}
