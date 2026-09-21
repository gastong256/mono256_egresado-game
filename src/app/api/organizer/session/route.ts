import {
  handleOrganizerLogin,
  handleOrganizerLogout,
} from '@/server/competition/api'

export const dynamic = 'force-dynamic'

export function POST(request: Request): Promise<Response> {
  return handleOrganizerLogin(request)
}

export function DELETE(request: Request): Promise<Response> {
  return handleOrganizerLogout(request)
}
