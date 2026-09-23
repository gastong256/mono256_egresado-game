import 'server-only'

import type { IdentityFormConfig, PrivacyNotice } from '@/lib/competition'
import { readCompetitionConfiguration } from './config'
import { readOrganizerToken } from './http'
import {
  loadOrganizerDashboard,
  resolveOrganizerSession,
  type OrganizerDashboard,
} from './organizer'
import { buildPrivacyNotice } from './privacy-notice'
import {
  createCompetitionContext,
  loadActiveCompetition,
  type CompetitionContext,
} from './runtime'

/**
 * Lo que el Server Component de `/` necesita además del estado público.
 *
 * La configuración del formulario —años, divisiones, aviso de privacidad— sale
 * del servidor y no de una constante del cliente por dos razones. Los años
 * dependen de la escuela, así que codificarlos en el bundle obligaría a
 * recompilar para otra institución; y el aviso nombra al responsable de los
 * datos, que es exactamente el valor que no puede estar inventado en un archivo
 * de componentes.
 */
export function readIdentityFormConfig(): IdentityFormConfig | undefined {
  const config = readCompetitionConfiguration()
  if (config === undefined) return undefined
  return {
    schoolYears: config.schoolYears,
    schoolDivisions: config.schoolDivisions,
    privacyNotice: buildPrivacyNotice(config),
  }
}

/** Public legal page: configuration only, no participant/session/database read. */
export function readPrivacyNotice(): PrivacyNotice | undefined {
  const config = readCompetitionConfiguration()
  return config === undefined ? undefined : buildPrivacyNotice(config)
}

/**
 * El tablero del organizador, resuelto en el servidor.
 *
 * La consola podría pedirlo desde el navegador al montarse, pero entonces la
 * primera pintura sería una pantalla vacía y la sesión se comprobaría un viaje
 * más tarde. Resolverlo acá también deja claro dónde está el control: la página
 * no se renderiza con datos si no hay sesión de organizador.
 */
export async function readOrganizerPageData(): Promise<{
  readonly authenticated: boolean
  readonly dashboard: OrganizerDashboard | undefined
}> {
  let context: CompetitionContext | undefined
  try {
    context = createCompetitionContext()
  } catch {
    return { authenticated: false, dashboard: undefined }
  }
  if (context === undefined)
    return { authenticated: false, dashboard: undefined }

  const organizer = await resolveOrganizerSession(
    context,
    await readOrganizerToken(),
  )
  if (organizer === undefined) {
    return { authenticated: false, dashboard: undefined }
  }

  const competition = await loadActiveCompetition(context)
  return {
    authenticated: true,
    dashboard:
      competition === undefined
        ? undefined
        : await loadOrganizerDashboard(context, competition),
  }
}
