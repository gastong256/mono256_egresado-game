import Image from 'next/image'
import Link from 'next/link'

/** Institutional artwork retains its proportions; the school mark has a circular mask. */
export function InstitutionalFooter() {
  return (
    <footer
      className="border-rule text-ink-secondary mt-4 grid min-h-44 grid-cols-2 items-center gap-x-3 gap-y-3 border-t px-2 py-4 md:min-h-32 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] md:gap-x-6"
      aria-label="Institución y créditos"
    >
      <Link
        href="/privacidad"
        prefetch={false}
        className="text-caption text-ink row-start-2 inline-flex min-h-11 items-center justify-self-start underline underline-offset-4 md:col-start-1 md:row-start-1"
      >
        Política de privacidad y uso de datos
      </Link>
      <div
        className="col-span-2 col-start-1 row-start-1 flex h-20 items-center justify-center gap-5 md:col-span-1 md:col-start-2"
        data-testid="institutional-marks"
      >
        <Image
          src="/assets/footer/logo-piacentini.webp"
          alt="Colegio Integral Piacentini"
          width={240}
          height={240}
          unoptimized
          className="h-20 w-20 shrink-0 object-contain [clip-path:circle(50%)]"
        />
        <Image
          src="/assets/footer/logo-feria.webp"
          alt="36° Feria del Libro 2026 — Somos con otros"
          width={216}
          height={270}
          unoptimized
          className="h-20 w-16 shrink-0 object-contain"
        />
      </div>
      <a
        href="https://gastong256.dev"
        target="_blank"
        rel="noopener noreferrer"
        className="text-caption text-ink-secondary hover:text-ink col-start-2 row-start-2 flex min-h-11 min-w-0 items-center gap-2 justify-self-end md:col-start-3 md:row-start-1"
      >
        <Image
          src="/assets/footer/logo-dev.webp"
          alt="Logo de gastong256.dev"
          width={80}
          height={80}
          unoptimized
          className="h-6 w-6 shrink-0 object-contain"
        />
        <span className="text-right">
          <span className="block">developed by</span>{' '}
          <span className="underline underline-offset-4">gastong256.dev</span>
          <span className="sr-only"> (abre en otra pestaña)</span>
        </span>
      </a>
    </footer>
  )
}
