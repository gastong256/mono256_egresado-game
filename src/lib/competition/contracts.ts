/**
 * Los contratos que cruzan la red.
 *
 * Viven en `lib` porque los necesitan los dos lados y ninguno puede importar al
 * otro: la UI no puede alcanzar `@/server` —la frontera de arquitectura lo
 * impide, que es justamente lo que evita que un componente lea la base— y el
 * servidor no importa componentes. Acá no hay lógica: son las formas, y la
 * comprobación de que una forma pública no puede llevar un dato privado vive en
 * `@/server/competition/dto`, donde se arma.
 */

export interface PublicLeaderboardEntry {
  readonly rank: number
  /** Lo único de una persona que este producto publica. */
  readonly nickname: string
  readonly fairScore: number
  /** Marca la fila del jugador que está mirando. Se resuelve en el servidor. */
  readonly isYou: boolean
}

/*
 * Por qué el podio público no lleva Prestige.
 *
 * El servidor lo recomputa y lo usa como **segundo criterio** del ranking, así
 * que decide puestos; lo que no hace es publicarlo. En Fair Edition v1 el techo
 * ofrecido es 0 —el manifiesto lo congela así (D-S08-084)—, de modo que la
 * columna diría `0` para todas las personas de la feria: ocuparía ancho en un
 * teléfono de 360 px y, peor, sugeriría que hay algo que conseguir. Una edición
 * futura que autorice oportunidades la reintroduce con su versión, que es
 * cuando el número empieza a significar algo.
 */

export type PublicCompetitionStatus =
  'not-configured' | 'upcoming' | 'open' | 'closed'

export interface PublicCompetitionSummary {
  readonly name: string
  readonly status: PublicCompetitionStatus
  readonly opensAt: string | undefined
  readonly closesAt: string | undefined
}

/** Lo que el jugador ve **de sí mismo**, y sólo si tiene sesión. */
export interface PublicSelfSummary {
  readonly nickname: string
  readonly bestFairScore: number | undefined
  readonly bestPrestigeScore: number | undefined
  readonly rank: number | undefined
  readonly attempts: number
  readonly activeAttempt: string | undefined
}

export interface PublicCompetitionState {
  readonly competition: PublicCompetitionSummary
  readonly leaderboard: readonly PublicLeaderboardEntry[]
  readonly totalRanked: number
  readonly you: PublicSelfSummary | undefined
}

/** La respuesta de emisión de un intento. */
export interface IssuedAttemptPayload {
  readonly attemptId: string
  readonly attemptNumber: number
  readonly resumed: boolean
  /**
   * El descriptor completo, tal como el servidor lo emitió.
   *
   * Se tipa como `unknown` acá y lo valida el motor al crear la run: la forma
   * del descriptor es del dominio del juego, y redeclararla en el contrato de
   * red crearía una segunda definición que se desincroniza.
   */
  readonly descriptor: unknown
}

export interface VerifiedAttemptPayload {
  readonly attemptId: string
  readonly status:
    'STARTED' | 'ABANDONED' | 'SUBMITTED' | 'VERIFIED' | 'REJECTED'
  readonly fairScore: number | undefined
  readonly prestigeScore: number | undefined
  readonly graduated: boolean
  readonly rejectionCode: string | undefined
  readonly personalBest: boolean
}

export interface SubmissionResponse {
  readonly result: VerifiedAttemptPayload
  readonly state: PublicCompetitionState
}

export interface CompetitionErrorBody {
  readonly error: { readonly code: string; readonly message: string }
}

/** El aviso de privacidad, armado en el servidor desde la configuración. */
export interface PrivacyNoticeSection {
  readonly heading: string
  readonly body: readonly string[]
}

export interface PrivacyNotice {
  readonly version: string
  readonly summary: readonly string[]
  readonly acknowledgement: string
  readonly sections: readonly PrivacyNoticeSection[]
}

/** Lo que el formulario de identificación necesita saber de la institución. */
export interface IdentityFormConfig {
  readonly schoolYears: readonly string[]
  readonly schoolDivisions: readonly string[]
  readonly privacyNotice: PrivacyNotice
}
