# Fair mode and ranking operations

## Attempts

Recommended default: unlimited attempts, personal best counts. Keep event config able to switch to 1/N attempts if teachers decide otherwise.

## Why personal best

Cumulative scoring rewards time spent rather than quality. Personal best creates a practice/improvement loop while keeping one comparable run per participant on the board.

## Leaderboard record

Public view should use nickname and score. Avoid exposing hidden mastery or unnecessary personal data.

## Rank comparator

Use versioned lexicographic comparator. Store the full comparison breakdown for audits.

## True tie policy

Must be written before prizes. Recommended options:

- organizer tie-break minigame;
- shared place/prize;
- another explicitly announced skill-based criterion.

Do not secretly award a prize based on random UUID ordering.

## Ranking refresh

Realtime is optional. Polling every few seconds may be simpler and more robust at fair scale. Choose based on actual platform/load, not novelty.
