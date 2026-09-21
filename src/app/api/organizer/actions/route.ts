import { handleOrganizerAction } from '@/server/competition/api'

export const dynamic = 'force-dynamic'

export function POST(request: Request): Promise<Response> {
  return handleOrganizerAction(request)
}
