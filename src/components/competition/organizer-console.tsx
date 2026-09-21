'use client'

import { useCallback, useState, type FormEvent } from 'react'

import { Button, Callout, TextField } from '@/components/ui'
import type { CompetitionErrorBody } from '@/lib/competition'

/**
 * La consola del organizador.
 *
 * Una pantalla, sin navegación: la lista de participantes con lo que hace falta
 * para reconocer a una persona detrás de un alias, y las acciones que una feria
 * necesita de verdad. Cada acción destructiva pide un motivo antes de hacerse,
 * y ese motivo queda en la auditoría junto con quién la hizo.
 *
 * Lo que se ve acá **no** viaja a ninguna pantalla pública: viene de una ruta
 * autenticada distinta de la del ranking, y esa ruta es la única del sistema
 * que devuelve nombre, año y últimos cuatro dígitos.
 */

interface OrganizerAttempt {
  readonly id: string
  readonly attemptNumber: number
  readonly status: string
  readonly fairScore: number | undefined
  readonly prestigeScore: number | undefined
  readonly rejectionCode: string | undefined
  readonly invalidatedAt: string | undefined
}

interface OrganizerParticipant {
  readonly id: string
  readonly nickname: string
  readonly nicknameHidden: boolean
  readonly fullName: string | undefined
  readonly schoolYear: string | undefined
  readonly division: string | undefined
  readonly dniLast4: string | undefined
  readonly status: 'ELIGIBLE' | 'DISQUALIFIED'
  readonly identityVerifiedAt: string | undefined
  readonly rank: number | undefined
  readonly attempts: number
  readonly verifiedAttempts: number
  readonly bestFairScore: number | undefined
  readonly attemptDetail: readonly OrganizerAttempt[]
}

interface Dashboard {
  readonly competition: {
    readonly name: string
    readonly slug: string
    readonly status: string
    readonly closesAt: string | undefined
    readonly retentionDays: number
    readonly runSeed: string
  }
  readonly participants: readonly OrganizerParticipant[]
}

/**
 * Lee el mensaje de un error, tolerando que no venga ninguno.
 *
 * Una respuesta de error no siempre trae cuerpo —un proxy que corta, un 502 de
 * la plataforma— y asumir que sí convierte un fallo del servidor en un fallo
 * del render. El docente tiene que seguir viendo su tablero.
 */
async function readErrorMessage(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as Partial<CompetitionErrorBody>
    const message = body.error?.message
    return typeof message === 'string' && message.length > 0
      ? message
      : 'No se pudo completar la acción.'
  } catch {
    return 'No se pudo completar la acción.'
  }
}

function isDashboard(value: unknown): value is Dashboard {
  return (
    typeof value === 'object' &&
    value !== null &&
    'competition' in value &&
    typeof (value as { competition?: unknown }).competition === 'object' &&
    (value as { competition?: unknown }).competition !== null &&
    Array.isArray((value as { participants?: unknown }).participants)
  )
}

export function OrganizerConsole({
  initialAuthenticated,
  initialDashboard,
}: {
  readonly initialAuthenticated: boolean
  readonly initialDashboard: Dashboard | undefined
}) {
  const [dashboard, setDashboard] = useState(initialDashboard)
  const [authenticated, setAuthenticated] = useState(initialAuthenticated)
  const [message, setMessage] = useState<string | undefined>(undefined)

  /**
   * Relee el tablero después de una acción.
   *
   * El primer tablero llega renderizado desde el servidor, así que esto corre
   * sólo cuando algo cambió: no hay un `fetch` al montar que pinte una pantalla
   * vacía mientras viaja.
   */
  const load = useCallback(async () => {
    const response = await fetch('/api/organizer/dashboard', {
      cache: 'no-store',
    })
    if (response.status === 401) {
      setAuthenticated(false)
      return
    }
    if (!response.ok) {
      setMessage(await readErrorMessage(response))
      setAuthenticated(true)
      return
    }
    // Se comprueba la forma antes de adoptarla: una respuesta inesperada tiene
    // que dejar la consola diciendo «sin competencia», no rompiendo el render
    // de un docente en medio de la feria.
    const body: unknown = await response.json()
    setDashboard(isDashboard(body) ? body : undefined)
    setAuthenticated(true)
  }, [])

  const act = useCallback(
    async (action: Record<string, unknown>) => {
      setMessage(undefined)
      const response = await fetch('/api/organizer/actions', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(action),
      })
      if (response.status === 401) {
        // La sesión venció mientras la consola estaba abierta. Mostrar un
        // mensaje sobre un tablero viejo no le dice al docente qué hacer;
        // volver al formulario sí.
        setAuthenticated(false)
        setDashboard(undefined)
        return
      }
      if (!response.ok) {
        setMessage(await readErrorMessage(response))
        return
      }
      await load()
    },
    [load],
  )

  if (!authenticated) {
    return (
      <OrganizerLogin
        onAuthenticated={() => {
          void load()
        }}
      />
    )
  }

  return (
    <div className="flex flex-col gap-5">
      {message === undefined ? null : (
        <Callout tone="accent" title="No se pudo completar">
          {message}
        </Callout>
      )}

      {dashboard === undefined ? (
        <Callout title="Sin competencia configurada">
          Este despliegue no tiene una edición activa.
        </Callout>
      ) : (
        <>
          <section className="flex flex-col gap-2">
            <h2 className="text-section font-display text-ink">
              {dashboard.competition.name}
            </h2>
            <p className="text-meta text-ink-secondary">
              Estado: <strong>{dashboard.competition.status}</strong> ·
              retención {dashboard.competition.retentionDays} días
            </p>
            <div className="flex flex-wrap gap-2">
              {(['UPCOMING', 'OPEN', 'CLOSED'] as const).map((status) => (
                <Button
                  key={status}
                  variant="secondary"
                  disabled={dashboard.competition.status === status}
                  onClick={() => {
                    const reason = window.prompt(
                      `Motivo para pasar a ${status}`,
                    )
                    if (reason === null || reason.trim().length < 3) return
                    void act({
                      action: 'competition.status',
                      status,
                      reason: reason.trim(),
                    })
                  }}
                >
                  {status}
                </Button>
              ))}
              <a
                href="/api/organizer/export"
                className="text-meta font-display text-ink inline-flex min-h-11 items-center underline underline-offset-4"
              >
                Exportar CSV
              </a>
            </div>
          </section>

          <section className="flex flex-col gap-2">
            <h3 className="text-goal font-display text-ink">
              Participantes ({dashboard.participants.length})
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[46rem] border-collapse text-left">
                <thead>
                  <tr className="text-caption text-ink-secondary uppercase">
                    <th className="px-2 py-2">Puesto</th>
                    <th className="px-2 py-2">Alias</th>
                    <th className="px-2 py-2">Nombre y apellido</th>
                    <th className="px-2 py-2">Año</th>
                    <th className="px-2 py-2">DNI ·4</th>
                    <th className="px-2 py-2">Mejor</th>
                    <th className="px-2 py-2">Intentos</th>
                    <th className="px-2 py-2">Estado</th>
                    <th className="px-2 py-2">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboard.participants.map((participant) => (
                    <tr
                      key={participant.id}
                      className="border-rule border-t align-top"
                      data-testid="organizer-participant"
                    >
                      <td className="px-2 py-2 tabular-nums">
                        {participant.rank ?? '—'}
                      </td>
                      <td className="px-2 py-2">
                        {participant.nickname}
                        {participant.nicknameHidden ? ' (oculto)' : ''}
                      </td>
                      <td className="px-2 py-2">
                        {participant.fullName ?? '—'}
                      </td>
                      <td className="px-2 py-2">
                        {participant.schoolYear ?? '—'}
                        {participant.division === undefined
                          ? ''
                          : ` ${participant.division}`}
                      </td>
                      <td className="px-2 py-2 tabular-nums">
                        {participant.dniLast4 ?? '—'}
                      </td>
                      <td className="px-2 py-2 tabular-nums">
                        {participant.bestFairScore ?? '—'}
                      </td>
                      <td className="px-2 py-2 tabular-nums">
                        {participant.verifiedAttempts}/{participant.attempts}
                      </td>
                      <td className="px-2 py-2">
                        {participant.status === 'ELIGIBLE'
                          ? 'Elegible'
                          : 'Descalificado'}
                        {participant.identityVerifiedAt === undefined
                          ? ''
                          : ' · verificado'}
                      </td>
                      <td className="px-2 py-2">
                        <div className="flex flex-col gap-1">
                          <ReasonedAction
                            label={
                              participant.nicknameHidden
                                ? 'Mostrar alias'
                                : 'Ocultar alias'
                            }
                            prompt="Motivo para cambiar la visibilidad del alias"
                            onConfirm={(reason) => {
                              void act({
                                action: 'participant.correct',
                                participantId: participant.id,
                                nicknameHidden: !participant.nicknameHidden,
                                reason,
                              })
                            }}
                          />
                          <ReasonedAction
                            label={
                              participant.status === 'ELIGIBLE'
                                ? 'Descalificar'
                                : 'Reincorporar'
                            }
                            prompt="Motivo"
                            onConfirm={(reason) => {
                              void act({
                                action: 'participant.eligibility',
                                participantId: participant.id,
                                status:
                                  participant.status === 'ELIGIBLE'
                                    ? 'DISQUALIFIED'
                                    : 'ELIGIBLE',
                                reason,
                              })
                            }}
                          />
                          <ReasonedAction
                            label={
                              participant.identityVerifiedAt === undefined
                                ? 'Marcar identidad verificada'
                                : 'Quitar verificación'
                            }
                            prompt="Motivo"
                            onConfirm={(reason) => {
                              void act({
                                action: 'participant.identity-verified',
                                participantId: participant.id,
                                verified:
                                  participant.identityVerifiedAt === undefined,
                                reason,
                              })
                            }}
                          />
                          {participant.attemptDetail
                            .filter((attempt) => attempt.status === 'VERIFIED')
                            .map((attempt) => (
                              <ReasonedAction
                                key={attempt.id}
                                label={
                                  attempt.invalidatedAt === undefined
                                    ? `Invalidar intento ${String(attempt.attemptNumber)} (${String(attempt.fairScore ?? 0)})`
                                    : `Restaurar intento ${String(attempt.attemptNumber)}`
                                }
                                prompt="Motivo"
                                onConfirm={(reason) => {
                                  void act({
                                    action: 'attempt.validity',
                                    attemptId: attempt.id,
                                    invalid:
                                      attempt.invalidatedAt === undefined,
                                    reason,
                                  })
                                }}
                              />
                            ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="flex flex-col gap-2">
            <h3 className="text-goal font-display text-ink">Datos privados</h3>
            <p className="text-meta text-ink-secondary text-pretty">
              Al vencer la retención, los datos privados se anonimizan: se van
              nombre, año, división y últimos cuatro dígitos, y quedan el alias
              y el puntaje. Hacelo sólo después de entregar los premios.
            </p>
            <ReasonedAction
              label="Anonimizar datos privados"
              prompt="Motivo de la purga"
              onConfirm={(reason) => {
                void act({ action: 'competition.purge', reason })
              }}
            />
          </section>
        </>
      )}

      <Button
        variant="secondary"
        onClick={() => {
          void fetch('/api/organizer/session', { method: 'DELETE' }).then(
            () => {
              setAuthenticated(false)
              setDashboard(undefined)
            },
          )
        }}
      >
        Cerrar sesión
      </Button>
    </div>
  )
}

/**
 * Una acción que exige un motivo antes de ocurrir.
 *
 * El motivo no es burocracia: es lo que convierte «alguien descalificó a
 * alguien» en un registro que se puede revisar después de la feria, cuando la
 * persona que lo hizo ya no se acuerda.
 */
function ReasonedAction({
  label,
  prompt,
  onConfirm,
}: {
  readonly label: string
  readonly prompt: string
  readonly onConfirm: (reason: string) => void
}) {
  return (
    <button
      type="button"
      className="text-caption font-display text-ink min-h-11 text-left underline underline-offset-4"
      onClick={() => {
        const reason = window.prompt(prompt)
        if (reason === null || reason.trim().length < 3) return
        onConfirm(reason.trim())
      }}
    >
      {label}
    </button>
  )
}

function OrganizerLogin({
  onAuthenticated,
}: {
  readonly onAuthenticated: () => void
}) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | undefined>(undefined)
  const [pending, setPending] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true)
    setError(undefined)
    try {
      const response = await fetch('/api/organizer/session', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      if (!response.ok) {
        setError(await readErrorMessage(response))
        return
      }
      onAuthenticated()
    } finally {
      setPending(false)
    }
  }

  return (
    <form onSubmit={submit} className="flex max-w-sm flex-col gap-4">
      <h2 className="text-section font-display text-ink">
        Acceso de organizador
      </h2>
      <TextField
        label="Usuario"
        value={username}
        autoComplete="username"
        onChange={(event) => {
          setUsername(event.currentTarget.value)
        }}
      />
      <div className="flex flex-col gap-2">
        <label
          htmlFor="organizer-password"
          className="text-goal font-display text-ink"
        >
          Contraseña
        </label>
        <input
          id="organizer-password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => {
            setPassword(event.currentTarget.value)
          }}
          className="border-ink bg-surface text-ink text-option font-display h-12 w-full border-[1.5px] px-3"
        />
      </div>
      {error === undefined ? null : (
        <Callout tone="accent" title="No se pudo entrar">
          {error}
        </Callout>
      )}
      <Button type="submit" disabled={pending}>
        {pending ? 'Un momento…' : 'Entrar'}
      </Button>
    </form>
  )
}
