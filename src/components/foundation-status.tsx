const foundationCapabilities = [
  'Aplicación web',
  'Entorno reproducible',
  'Calidad automatizada',
] as const

export function FoundationStatus() {
  return (
    <section
      aria-labelledby="foundation-title"
      className="w-full rounded-3xl border border-black/10 bg-[var(--surface)] p-6 shadow-[0_24px_80px_rgb(19_42_37_/_0.12)] sm:p-10"
      data-testid="foundation-status"
    >
      <p className="mb-3 text-sm font-bold tracking-[0.2em] text-[var(--accent)] uppercase">
        Base técnica
      </p>
      <h1
        id="foundation-title"
        className="text-4xl font-black tracking-tight sm:text-6xl"
      >
        Egresado
      </h1>
      <p className="mt-5 max-w-2xl text-lg leading-8 text-black/70">
        El entorno de desarrollo está listo. La experiencia de juego todavía no
        fue implementada.
      </p>
      <ul
        className="mt-8 grid gap-3 sm:grid-cols-3"
        aria-label="Capacidades verificadas"
      >
        {foundationCapabilities.map((capability) => (
          <li
            key={capability}
            className="flex min-h-12 items-center rounded-xl bg-black/5 px-4 py-3 font-semibold"
          >
            {capability}
          </li>
        ))}
      </ul>
    </section>
  )
}
