import {
  handleForgetParticipant,
  handleIdentify,
} from '@/server/competition/api'

export const dynamic = 'force-dynamic'

export function POST(request: Request): Promise<Response> {
  return handleIdentify(request)
}

/** «No soy yo»: revoca la sesión de este navegador. */
export function DELETE(request: Request): Promise<Response> {
  return handleForgetParticipant(request)
}
