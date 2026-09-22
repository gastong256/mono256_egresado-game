import { Eyebrow } from '@/components/ui'

/** Qualitative explanation of frozen FairScore v1 (85/10/5), never a second scorer. */
export function GameModeSummary({
  closed = false,
}: {
  readonly closed?: boolean
}) {
  return (
    <section
      className="border-ink grid gap-5 border-t-2 py-6 sm:grid-cols-2"
      aria-labelledby="game-mode-heading"
    >
      <div className="flex flex-col gap-2">
        <Eyebrow>Cómo se juega</Eyebrow>
        <h2
          id="game-mode-heading"
          className="text-section font-display text-ink text-balance"
        >
          La matemática manda.
          <br />
          Todo lo que decidís cuenta.
        </h2>
        <p className="text-body text-ink-secondary text-pretty">
          Recorré de 7.º a 5.º año resolviendo situaciones de la vida escolar.{' '}
          {closed
            ? 'En esta competencia contó tu mejor partida verificada.'
            : 'Podés volver a jugar: cuenta tu mejor partida verificada.'}
        </p>
      </div>
      <dl className="border-rule divide-rule divide-y border-y">
        <div className="py-3">
          <dt className="text-title font-display text-ink">Matemática</dt>
          <dd className="text-body text-ink-secondary mt-1">
            Tus decisiones con números construyen la mayor parte del puntaje.
          </dd>
        </div>
        <div className="py-3">
          <dt className="text-goal font-display text-ink">Equipo</dt>
          <dd className="text-body text-ink-secondary mt-1">
            Cómo colaborás con tus compañeros también suma.
          </dd>
        </div>
        <div className="py-3">
          <dt className="text-goal font-display text-ink">Aura</dt>
          <dd className="text-body text-ink-secondary mt-1">
            La huella que dejás en la escuela tiene su lugar.
          </dd>
        </div>
      </dl>
    </section>
  )
}
