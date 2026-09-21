import { handleOrganizerDashboard } from '@/server/competition/api'

export const dynamic = 'force-dynamic'

export function GET(): Promise<Response> {
  return handleOrganizerDashboard()
}
