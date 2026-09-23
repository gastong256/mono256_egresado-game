import { z } from 'zod'

/** Public projection only: no identity, action log, answers or hidden mastery. */
export const runSummarySchema = z.object({
  version: z.literal(1),
  career: z.object({
    promedio: z.number().min(1).max(10).nullable(),
    equipo: z.number().min(0).max(100).nullable(),
    aura: z.number().int().nullable(),
  }),
  estilo: z
    .object({
      aplicado: z.number().min(0).max(100),
      estratega: z.number().min(0).max(100),
      improvisador: z.number().min(0).max(100),
    })
    .nullable(),
  playStyle: z.object({
    id: z.string().max(40),
    label: z.string().max(100),
    detail: z.string().max(500),
  }),
  profile: z.enum([
    'strategist',
    'improviser',
    'scientist',
    'leader',
    'entrepreneur',
    'competitor',
    'balanced',
    'survivor',
  ]),
  graduated: z.boolean(),
  eventsPlayed: z.number().int().nonnegative(),
  recoveries: z.number().int().nonnegative(),
  previas: z.number().int().nonnegative(),
  optimalCount: z.number().int().nonnegative(),
  components: z
    .array(
      z.object({
        component: z.enum(['math', 'team', 'aura']),
        opportunities: z.number().int().nonnegative(),
        performance: z.number().int().min(0).max(10000),
        contribution: z.number().int().min(0).max(10000),
        effectiveWeight: z.number().int().min(0).max(10000),
      }),
    )
    .max(3),
  achievements: z
    .array(
      z.object({
        id: z.string().max(100),
        label: z.string().max(120),
        detail: z.string().max(1000),
        source: z.enum(['milestone', 'flag', 'career']),
      }),
    )
    .max(12),
  years: z
    .array(
      z.object({
        stage: z.string().max(20),
        numeral: z.string().max(20),
        theme: z.string().max(100),
        played: z.boolean(),
        marker: z.enum([
          'perfect',
          'review',
          'review-previa',
          'completed',
          'not-played',
        ]),
        highlight: z.string().max(200).optional(),
      }),
    )
    .max(6),
  memories: z
    .array(
      z.object({
        title: z.string().max(200),
        text: z.string().max(1500),
        kind: z.enum(['rare', 'milestone', 'recovery', 'iconic', 'ordinary']),
      }),
    )
    .max(5),
})

export type PublicRunSummary = z.infer<typeof runSummarySchema>

/** Old or incompatible records stay score-only; unknown properties are stripped. */
export function readRunSummary(value: unknown): PublicRunSummary | undefined {
  const result = runSummarySchema.safeParse(value)
  return result.success ? result.data : undefined
}
