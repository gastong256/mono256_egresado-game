import { healthReport } from '@/server/competition/health'

export const dynamic = 'force-dynamic'

/**
 * `/api/health` responde vida; `/api/health?ready=1`, disponibilidad.
 *
 * La distinción decide el status HTTP. Un chequeo de vida que devolviera 503
 * porque la base está caída haría que un orquestador reiniciara un proceso sano
 * y perdiera las sesiones de toda la feria para arreglar algo que no está en el
 * proceso. El chequeo de disponibilidad sí devuelve 503, que es lo que un
 * operador quiere ver antes de abrir.
 */
export async function GET(request: Request): Promise<Response> {
  const ready = new URL(request.url).searchParams.get('ready') !== null
  const report = await healthReport({ ready })
  const failed = report.status !== 'ok'

  return Response.json(report, {
    status: ready && failed ? 503 : 200,
    headers: { 'Cache-Control': 'no-store' },
  })
}
