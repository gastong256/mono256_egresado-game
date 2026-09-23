import type { Metadata } from 'next'
import Link from 'next/link'
import { InstitutionalFooter } from '@/components/competition/institutional-footer'
import { fairScoreV1Policy, SCORE_SCALE } from '@/game'

// Public information with the same request-specific CSP nonce as Home/privacy.
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Cómo se calculan los puntos | Egresado',
  description:
    'Qué suma al puntaje de tu partida, por qué cuenta tu mejor intento y cómo se comparten los puestos del ranking.',
}

const percentage = (weight: number) =>
  (weight / SCORE_SCALE).toLocaleString('es-AR', { style: 'percent' })

/** Plain-language explanation of the frozen v1 policy; never another scorer. */
export default function PointsPage() {
  const { weights } = fairScoreV1Policy
  const sections = [
    {
      heading: 'Qué suma puntos',
      body: [
        `La matemática tiene el mayor peso. Cuando la partida ofrece los tres componentes, Matemática pesa un ${percentage(weights.math)}, Equipo un ${percentage(weights.team)} y Aura un ${percentage(weights.aura)}.`,
        'El juego compara lo que lograste con lo que podías lograr en las situaciones que te tocaron. En Matemática cuenta qué tan bien las resolviste; los desafíos más exigentes pesan un poco más. Equipo y Aura toman las decisiones de colaboración y participación que cada situación evalúa.',
        'Si la partida no ofrece oportunidades de Equipo o Aura, su peso se reparte entre los componentes disponibles. No perdés puntos por algo que no tuviste la posibilidad de hacer.',
      ],
    },
    {
      heading: 'Qué significan los números que ves al jugar',
      body: [
        'El Promedio, Equipo y Aura describen tu recorrido dentro del juego. No se suman directamente para obtener el puntaje del ranking: tener 1.000 de Aura no significa sumar 1.000 puntos. Son resultados del juego, no calificaciones escolares reales.',
        'Tu estilo y los reconocimientos cuentan tu historia. En esta edición no agregan puntos ni desempatan puestos. Los repasos te ayudan a seguir aprendiendo, pero no suman al ranking.',
      ],
    },
    {
      heading: 'Qué partida cuenta para el ranking',
      body: [
        'Cuenta tu mejor partida terminada de competencia. Si conseguís 7.000 puntos y después 8.000, quedás con 8.000. Si volvés a jugar y sacás menos, conservás tu mejor marca; los intentos no se suman.',
        'El juego comprueba el resultado al recibir tu partida y después lo publica. Las partidas de práctica no entran al ranking.',
      ],
    },
    {
      heading: 'Qué pasa si hay empate',
      body: [
        'En esta edición, quienes tienen el mismo puntaje comparten el puesto. Si dos personas quedan primeras, la siguiente queda tercera: 1.º, 1.º, 3.º.',
        'Para que la lista sea más fácil de recorrer, los empates se agrupan en una fila con «Compartido con X más». Nadie pierde su puesto por aparecer dentro de ese grupo.',
      ],
    },
    {
      heading: 'Qué condiciones son iguales para todos',
      body: [
        'En la competencia, todos reciben las mismas situaciones y variantes. No hay puntos extra ni ventaja en un empate por responder rápido, llegar primero o jugar más veces.',
      ],
    },
  ]
  return (
    <div className="px-gutter mx-auto w-full max-w-3xl py-6">
      <main className="flex flex-col gap-4">
        <Link
          href="/"
          prefetch={false}
          className="text-meta text-ink inline-flex min-h-11 items-center self-start underline underline-offset-4"
        >
          Volver al inicio
        </Link>
        <article className="eg-canvas border-rule flex flex-col gap-6 border p-5 sm:p-8">
          <header className="flex flex-col gap-3">
            <h1 className="text-section font-display text-ink">
              Cómo se calculan los puntos
            </h1>
            <ul className="text-body text-ink-secondary flex list-disc flex-col gap-2 pl-5">
              <li>
                El puntaje de una partida puede llegar a{' '}
                <span className="tabular-nums">
                  {SCORE_SCALE.toLocaleString('es-AR')}
                </span>{' '}
                puntos.
              </li>
              <li>
                La matemática tiene el mayor peso; Equipo y Aura también pueden
                sumar.
              </li>
              <li>
                En el ranking cuenta tu mejor partida, no la suma de tus
                intentos.
              </li>
            </ul>
          </header>
          {sections.map((section) => (
            <section key={section.heading} className="flex flex-col gap-2">
              <h2 className="text-goal font-display text-ink">
                {section.heading}
              </h2>
              {section.body.map((paragraph) => (
                <p
                  key={paragraph}
                  className="text-body text-ink-secondary text-pretty break-words tabular-nums"
                >
                  {paragraph}
                </p>
              ))}
            </section>
          ))}
          <section className="flex flex-col gap-2">
            <h2 className="text-goal font-display text-ink">
              Si querés conocer los detalles
            </h2>
            <p className="text-body text-ink-secondary text-pretty">
              En «Ver partida», dentro del ranking, podés ver cuánto aportó cada
              componente al puntaje de esa partida.
            </p>
            <a
              href="https://github.com/gastong256/mono256_egresado-game/blob/main/docs/06-delivery/production-v1-release-candidate.md#f-oficialización-de-fairscore"
              target="_blank"
              rel="noopener noreferrer"
              className="text-meta text-ink inline-flex min-h-11 items-center self-start underline underline-offset-4"
            >
              Leer la explicación técnica en GitHub (abre en otra pestaña)
            </a>
          </section>
        </article>
      </main>
      <InstitutionalFooter />
    </div>
  )
}
