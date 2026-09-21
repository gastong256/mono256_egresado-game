import { handleAbandonAttempt } from '@/server/competition/api'

export const dynamic = 'force-dynamic'

export async function POST(
  request: Request,
  context: { readonly params: Promise<{ readonly attemptId: string }> },
): Promise<Response> {
  const { attemptId } = await context.params
  return handleAbandonAttempt(request, attemptId)
}
