import { TickMark } from '@/components/ui'

import type { Achievement } from './ending-model'

/**
 * El medallero.
 *
 * Una tarjeta por hito real: nada de oro, plata y bronce, porque un hito de
 * carrera no compite con nadie. La tinta, el filete y el tilde ya dicen
 * «conseguido». Si la carrera no dejó ninguno, la sección no existe: un panel
 * vacío o un premio de consuelo dirían algo que no pasó.
 */
export function AchievementCabinet({
  achievements,
}: {
  readonly achievements: readonly Achievement[]
}) {
  if (achievements.length === 0) return null

  return (
    <section
      aria-labelledby="achievements-title"
      data-testid="achievements"
      className="border-ink flex flex-col gap-3 border-t-2 pt-3"
    >
      <h2
        id="achievements-title"
        className="font-display text-ink-label text-eyebrow tracking-[0.15em] uppercase"
      >
        Tus hitos
      </h2>
      <ul className="grid list-none grid-cols-1 gap-2 p-0 sm:grid-cols-2">
        {achievements.map((achievement, index) => (
          <li
            key={achievement.id}
            data-testid="achievement"
            data-achievement={achievement.id}
            // Cada tarjeta entra un instante después de la anterior: se leen
            // como conseguidas una a una. Con reduced motion la duración es
            // 1 ms y el escalonado desaparece con ella.
            style={{ animationDelay: `${String(index * 70)}ms` }}
            className="bg-surface border-ink motion-enter flex min-w-0 gap-2.5 border-[1.5px] px-3 py-2.5"
          >
            <span className="border-green text-green mt-0.5 flex size-6 shrink-0 items-center justify-center border-[1.5px]">
              <TickMark className="size-[13px]" />
            </span>
            <span className="flex min-w-0 flex-col gap-0.5">
              <span className="text-option font-display text-ink">
                {achievement.label}
              </span>
              <span className="text-caption text-ink-secondary text-pretty">
                {achievement.detail}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}
