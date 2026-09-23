import { Eyebrow, Surface } from '@/components/ui'
import { AuraMark, MathMark, TeamMark } from './home-marks'

/** Qualitative explanation of frozen FairScore v1 (85/10/5), never a second scorer. */
export function GameModeSummary({
  closed = false,
}: {
  readonly closed?: boolean
}) {
  return (
    <section
      className="border-ink flex flex-col gap-5 border-t-2 py-6"
      aria-labelledby="game-mode-heading"
    >
      <div className="grid items-end gap-3 sm:grid-cols-2 sm:gap-6">
        <div className="flex flex-col gap-2">
          <Eyebrow>Cómo se juega</Eyebrow>
          <h2
            id="game-mode-heading"
            className="text-section font-display text-ink text-balance"
          >
            <span className="text-green">La matemática manda.</span>
            <br />
            Todo lo que decidís cuenta.
          </h2>
        </div>
        <p className="text-body text-ink-secondary text-pretty">
          Recorré de 7.º a 5.º año resolviendo situaciones de la vida escolar.{' '}
          {closed
            ? 'En esta competencia contó tu mejor puntaje.'
            : 'Podés volver a jugar: cuenta tu mejor puntaje.'}
        </p>
      </div>
      <dl className="grid gap-3 md:grid-cols-3">
        <Surface
          tone="paper"
          className="bg-green-tint border-t-green border-t-4"
        >
          <dt className="text-title font-display text-green-deep flex items-center gap-3">
            <MathMark />
            Matemática
          </dt>
          <dd className="text-body text-ink-secondary mt-3 text-pretty">
            Tus decisiones con números construyen la mayor parte del puntaje.
          </dd>
        </Surface>
        <Surface tone="paper" className="border-t-green border-t-2">
          <dt className="text-title font-display text-green flex items-center gap-3">
            <TeamMark />
            Equipo
          </dt>
          <dd className="text-body text-ink-secondary mt-3 text-pretty">
            Cómo colaborás con tus compañeros también suma.
          </dd>
        </Surface>
        <Surface tone="aura" className="border-t-aura-gain border-t-2">
          <dt className="text-title font-display text-aura-gain flex items-center gap-3">
            <AuraMark />
            Aura
          </dt>
          <dd className="text-body text-aura-label mt-3 text-pretty">
            La huella que dejás en la escuela tiene su lugar.
          </dd>
        </Surface>
      </dl>
    </section>
  )
}
