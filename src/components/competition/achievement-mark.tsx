import { AuraMark, TeamMark } from './home-marks'

/** Decorative marks accompany the persisted achievement's public name. */
export function AchievementMark({ id }: { readonly id: string }) {
  if (id === 'flag.todos-participaron') return <TeamMark />
  if (id === 'career.aura') return <AuraMark />
  const path =
    id === 'milestone.graduated'
      ? 'm2 9 10-5 10 5-10 5ZM6 11v6q6 5 12 0v-6M22 9v9'
      : id === 'flag.proyecto-redondo'
        ? 'M3 6h7l2 3h9v12H3ZM8 15l3 3 5-6'
        : id === 'flag.acto-impecable'
          ? 'M5 22V3h14l-3 5 3 5H5'
          : id === 'milestone.saw-something-rare'
            ? 'm12 2 2.6 6.7L21 12l-6.4 3.3L12 22l-2.6-6.7L3 12l6.4-3.3ZM19 2l3 3m-3 14 3 3'
            : 'm12 3 2.8 5.6 6.2.9-4.5 4.4 1.1 6.2L12 17.2l-5.6 2.9 1.1-6.2L3 9.5l6.2-.9Z'
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      aria-hidden="true"
      focusable="false"
    >
      <path d={path} />
    </svg>
  )
}
