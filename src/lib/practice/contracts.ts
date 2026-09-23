import { z } from 'zod'

/** Practice results deliberately have no rank, participant or attempt fields. */
export const practiceResultSchema = z
  .object({
    kind: z.literal('practice'),
    runId: z.string().min(1).max(128),
    fairScore: z.number().int().min(0).max(10000),
    graduated: z.boolean(),
  })
  .strict()

export type PracticeResult = z.infer<typeof practiceResultSchema>

export function practiceErrorMessage(body: unknown): string {
  const parsed = z
    .object({ error: z.object({ message: z.string().max(300) }) })
    .safeParse(body)
  return parsed.success
    ? parsed.data.error.message
    : 'No pudimos completar el pedido. Volvé a intentarlo.'
}
