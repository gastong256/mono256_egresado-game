import { practiceHandlers } from '@/server/practice/api'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export function POST(request: Request): Promise<Response> {
  return practiceHandlers.issue(request)
}
