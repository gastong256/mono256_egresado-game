import { cn } from '@/lib/ui/cn'

/** Decorative marks always accompany visible labels on the landing page. */
export function MathMark() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-7 w-7 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="square"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M3 6h7M6.5 2.5v7M15 4h6M15 8h6M3 15l7 7M3 22l7-7M15 18.5h6" />
      <circle cx="18" cy="14" r="1" fill="currentColor" stroke="none" />
      <circle cx="18" cy="23" r="1" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function TeamMark() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-7 w-7 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="square"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="7" cy="6" r="3" />
      <circle cx="17" cy="6" r="3" />
      <path d="M2 21v-5a4 4 0 0 1 4-4h2l4 4 4-4h2a4 4 0 0 1 4 4v5M6 17v4M18 17v4M9 13l3 3 3-3" />
    </svg>
  )
}

export function AuraMark() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-7 w-7 shrink-0"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      <path d="m12 1 3.3 7.7L23 12l-7.7 3.3L12 23l-3.3-7.7L1 12l7.7-3.3Z" />
    </svg>
  )
}

/** The numeral remains text; metal colors and artwork never carry rank alone. */
export function PodiumMedal({
  rank,
  compact = false,
}: {
  readonly rank: number
  readonly compact?: boolean
}) {
  if (rank < 1 || rank > 3)
    return <span className="text-section tabular-nums">{rank}</span>

  return (
    <span
      className={cn(
        'relative inline-grid shrink-0 place-items-center',
        compact ? 'h-12 w-10 pb-3' : 'pb-6',
        rank === 1
          ? 'text-podium-gold'
          : rank === 2
            ? 'text-podium-silver'
            : 'text-podium-bronze',
        !compact && (rank === 1 ? 'h-24 w-20' : 'h-20 w-16'),
      )}
    >
      <svg
        viewBox="0 0 64 80"
        className="absolute inset-0 h-full w-full"
        stroke="currentColor"
        strokeWidth={2}
        aria-hidden="true"
        focusable="false"
      >
        <path
          d="m16 44-6 29 13-6 9 10 5-30M48 44l6 29-13-6-9 10-5-30"
          className={
            rank === 1
              ? 'fill-podium-gold-surface'
              : rank === 2
                ? 'fill-podium-silver-surface'
                : 'fill-podium-bronze-surface'
          }
        />
        <circle
          cx="32"
          cy="29"
          r="25"
          className={
            rank === 1
              ? 'fill-podium-gold-surface'
              : rank === 2
                ? 'fill-podium-silver-surface'
                : 'fill-podium-bronze-surface'
          }
        />
        <circle cx="32" cy="29" r="20" fill="none" strokeWidth={1} />
      </svg>
      <span
        className={cn(
          'font-display relative tabular-nums',
          compact ? 'text-option' : 'text-section',
        )}
      >
        {rank}
      </span>
    </span>
  )
}
