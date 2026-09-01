/**
 * Curated cases for Teacher Gate 1.
 *
 * A review session is only worth conducting if two people can see the same
 * situation on two different days. These seeds are the mechanism: each one is
 * searched from the real content, verified to reach a named template, and
 * pinned by a test so a future content change cannot quietly turn the meeting
 * into a discussion about something else.
 *
 * The manifest is small data on purpose. Everything a case needs to be
 * *presented* lives here; everything it needs to be *computed* comes from the
 * engine, because a second implementation of the composer would eventually
 * disagree with the first.
 */

import type { ChallengeId } from '../../core/branded'
import type { DifficultyBand } from '../../difficulty/cognitive'

/** Which content set a case is played against. */
export type TeacherGateSurface = 'grade-7-demo' | 'grade-7-composed'

export interface TeacherGateCase {
  /** Stable id used on the command line and in the decision sheet. */
  readonly id: string
  readonly title: string
  /** Why this case is in the session, in the facilitator's words. */
  readonly purpose: string
  readonly seed: string
  readonly surface: TeacherGateSurface
  /**
   * The template this case exists to show.
   *
   * Asserted by `--validate`. If a content change stops the seed reaching it,
   * the meeting is stale and the tooling says so instead of showing whatever
   * came out.
   */
  readonly expectedTemplate: ChallengeId
  readonly expectedBand: DifficultyBand
  /** What the teacher sees, in plain Spanish. No identifiers. */
  readonly whatTheySee: string
  /** The mathematical work the situation asks for. */
  readonly mathematics: string
  /** What the facilitator watches for while the teacher plays. */
  readonly observe: readonly string[]
  /** The exact questions to ask. Never «¿qué les parece?». */
  readonly questions: readonly string[]
  /** Minutes this case is budgeted in the core session. */
  readonly minutes: number
  /** Ordering in the session. Lower runs first. */
  readonly order: number
}

/**
 * The session's cases.
 *
 * Order is deliberate: an ordinary situation first so Egresado becomes
 * understandable, then the contrast that shows the same context asking a
 * different question, then the two that only come out if there is time.
 */
export const TEACHER_GATE_1_CASES: readonly TeacherGateCase[] = [
  {
    id: 'TG1-A',
    title: 'El colectivo — elegir en cuál subirse',
    purpose:
      'Que el docente entienda Egresado jugando, sin que nadie se lo explique antes.',
    seed: 'tg1-aa',
    surface: 'grade-7-demo',
    expectedTemplate: 'g7.bus-timing' as ChallengeId,
    expectedBand: 'standard',
    whatTheySee:
      'El viaje dura 36 minutos y hoy demora un 50 % más. La entrada es a las 08:00 y hay cuatro horarios de salida para elegir.',
    mathematics:
      'Calcular el viaje real con la demora y decidir cuál de las cuatro salidas llega a horario sin esperar de más en la puerta.',
    observe: [
      '¿Entendió qué le piden sin que se lo expliquen?',
      '¿Qué dato miró primero?',
      '¿Descartó opciones o calculó una sola?',
      '¿El resultado le explicó la consecuencia o sólo le dijo si acertó?',
    ],
    questions: [
      '¿Este razonamiento corresponde al nivel que esperarían en 7.º?',
      '¿La dificultad viene del razonamiento o de hacer la cuenta?',
      '¿La consigna es clara sin ayuda?',
      '¿Cambiarían algo de la situación o de los números?',
    ],
    minutes: 4,
    order: 1,
  },
  {
    id: 'TG1-B',
    title: 'El colectivo — decir con cuánto tiempo salir',
    purpose:
      'Mostrar que la misma situación puede pedir un razonamiento distinto, no sólo otros números.',
    seed: 'tg1-ac',
    surface: 'grade-7-demo',
    expectedTemplate: 'g7.bus-latest-departure' as ChallengeId,
    expectedBand: 'standard',
    whatTheySee:
      'El mismo colectivo: el viaje dura 20 minutos y hoy demora un 15 % más, la entrada es a las 08:00, y el grupo pide llegar 10 minutos antes. No hay opciones: hay que escribir el número.',
    mathematics:
      'Recorrer la misma relación al revés —de la hora de llegada hacia atrás— y construir la respuesta en vez de elegirla entre alternativas.',
    observe: [
      '¿Notó que es la misma situación con otra pregunta?',
      '¿Le resultó más difícil producir el número que elegir una opción?',
      '¿Interpretó bien el margen que pide el grupo?',
    ],
    questions: [
      '¿Es razonable que estas dos versiones convivan como situaciones distintas?',
      '¿Producir la respuesta debería considerarse más exigente que elegirla?',
      '¿Las dos deberían estar en el mismo nivel, o una es más difícil?',
    ],
    minutes: 2,
    order: 2,
  },
  {
    id: 'TG1-C',
    title: 'El acto del 25 de Mayo',
    purpose:
      'Revisar la única situación que ocurre en público y la única que mueve Aura.',
    seed: 'tg1-aa',
    surface: 'grade-7-demo',
    expectedTemplate: 'g7.may-25-act' as ChallengeId,
    expectedBand: 'core',
    whatTheySee:
      'Tres pasos de una coreografía, cada uno con su regla escrita —pares, múltiplos de 3, primos— y ocho números para marcar. En el paso de primos aparece el 1.',
    mathematics:
      'Clasificar según una regla. Se corrige con precisión y cobertura juntas, así que marcar todo o marcar una sola celda no alcanzan.',
    observe: [
      '¿Marcó el 1 como primo?',
      '¿Le pareció clara la corrección?',
      '¿Entendió por qué marcar de más también resta?',
    ],
    questions: [
      '¿Pares, múltiplos y primos son apropiados para 7.º?',
      '¿La tarea de clasificar es clara y tiene sentido matemático?',
      '¿El contexto del acto escolar es creíble y respetuoso?',
      '¿Este tipo de evento debería influir en el puntaje de competencia?',
    ],
    minutes: 3,
    order: 3,
  },
  {
    id: 'TG1-D',
    title: 'El trabajo grupal',
    purpose:
      'Revisar la única situación que hoy aporta evidencia de trabajo en equipo al puntaje.',
    seed: 'tg1-aa',
    surface: 'grade-7-demo',
    expectedTemplate: 'g7.group-tasks' as ChallengeId,
    expectedBand: 'stretch',
    whatTheySee:
      'Cuatro partes del trabajo y cuatro personas con horas disponibles y fuerzas distintas. Hay que repartir sin pasarse de las horas de nadie.',
    mathematics:
      'Asignación con dos restricciones simultáneas, buscando el mejor reparto y no solamente uno que entre.',
    observe: [
      '¿Distinguió entre un reparto que entra y uno que aprovecha las fuerzas?',
      '¿Le pareció que la situación mide trabajo en equipo o sólo optimización?',
    ],
    questions: [
      '¿Esto es evidencia válida de trabajo en equipo, o es matemática de asignación?',
      '¿El ranking debería medir también capacidades de trabajo en equipo?',
      'Si sí, ¿qué situaciones considerarían evidencia válida?',
    ],
    minutes: 3,
    order: 4,
  },
]

export function teacherGateCase(id: string): TeacherGateCase | undefined {
  return TEACHER_GATE_1_CASES.find((entry) => entry.id === id)
}

/** Cases in the order the session plays them. */
export function orderedTeacherGateCases(): readonly TeacherGateCase[] {
  return [...TEACHER_GATE_1_CASES].sort(
    (left, right) => left.order - right.order,
  )
}

/** Structural problems in the manifest, checked by a test and by `--validate`. */
export function teacherGateCaseIssues(
  cases: readonly TeacherGateCase[] = TEACHER_GATE_1_CASES,
): readonly string[] {
  const issues: string[] = []
  const ids = new Set<string>()
  const orders = new Set<number>()

  for (const entry of cases) {
    if (ids.has(entry.id)) {
      issues.push(`el caso ${entry.id} está declarado dos veces`)
    }
    ids.add(entry.id)

    if (orders.has(entry.order)) {
      issues.push(`dos casos comparten el orden ${String(entry.order)}`)
    }
    orders.add(entry.order)

    if (!/^[A-Za-z0-9._:-]{1,64}$/u.test(entry.seed)) {
      issues.push(`el seed de ${entry.id} no es un identificador aceptable`)
    }
    if (entry.questions.length === 0) {
      issues.push(`el caso ${entry.id} no le pregunta nada al docente`)
    }
    if (entry.observe.length === 0) {
      issues.push(`el caso ${entry.id} no dice qué observar`)
    }
    if (entry.minutes <= 0 || entry.minutes > 6) {
      issues.push(
        `el caso ${entry.id} pide ${String(entry.minutes)} minutos; una sesión de quince no lo sostiene`,
      )
    }
  }

  const total = cases.reduce((sum, entry) => sum + entry.minutes, 0)
  if (total > 12) {
    issues.push(
      `los casos suman ${String(total)} minutos y la sesión central son quince, contando apertura y decisiones`,
    )
  }

  return issues
}
