import Image from 'next/image'
import Link from 'next/link'

/** Institutional artwork retains its proportions; the school mark has a circular mask. */
export function InstitutionalFooter() {
  return (
    <footer
      className="border-rule text-ink-secondary mt-4 grid min-h-52 grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-3 border-t px-2 py-4 md:min-h-40 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] md:gap-x-6"
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
        className="col-span-2 col-start-1 row-start-1 flex h-28 items-center justify-center gap-5 md:col-span-1 md:col-start-2"
        data-testid="institutional-marks"
      >
        <Image
          src="/assets/footer/logo-piacentini.webp"
          alt="Colegio Integral Piacentini"
          width={240}
          height={240}
          unoptimized
          className="h-28 w-28 shrink-0 object-contain [clip-path:circle(50%)]"
        />
        <Image
          src="/assets/footer/logo-feria.webp"
          alt="36° Feria del Libro 2026 — Somos con otros"
          width={216}
          height={270}
          unoptimized
          className="h-28 w-auto shrink-0 object-contain"
        />
      </div>
      <div className="col-start-2 row-start-2 flex min-w-0 items-center justify-self-end md:col-start-3 md:row-start-1">
        <a
          href="https://gastong256.dev"
          target="_blank"
          rel="noopener noreferrer"
          className="text-label text-ink-secondary hover:text-ink inline-flex min-h-11 items-center font-normal tracking-normal whitespace-nowrap"
        >
          <span>
            <span>developed by</span>{' '}
            <span className="underline underline-offset-4">gastong256.dev</span>
            <span className="sr-only"> (abre en otra pestaña)</span>
          </span>
        </a>
        <a
          href="https://github.com/gastong256/mono256_egresado-game"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Repositorio en GitHub (abre en otra pestaña)"
          className="text-ink-secondary hover:text-ink inline-flex min-h-11 min-w-11 items-center justify-start pl-1"
        >
          <svg
            viewBox="0 0 24 24"
            fill="currentColor"
            className="h-4 w-4"
            aria-hidden="true"
            focusable="false"
          >
            <path d="M12 .297a12 12 0 0 0-3.793 23.385c.6.111.82-.261.82-.577v-2.234c-3.338.726-4.043-1.416-4.043-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.835 2.807 1.305 3.492.998.108-.776.418-1.305.762-1.605-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.323 3.301 1.23a11.52 11.52 0 0 1 3.004-.404c1.02.005 2.047.138 3.006.404 2.291-1.553 3.297-1.23 3.297-1.23.654 1.652.243 2.873.119 3.176.77.84 1.235 1.91 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.216.694.825.576A12.001 12.001 0 0 0 12 .297Z" />
          </svg>
        </a>
      </div>
    </footer>
  )
}
