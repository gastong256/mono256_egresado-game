import type { RunState } from '@/game'

/**
 * Callbacks de carrera: texto que recuerda algo que la run efectivamente jugó.
 *
 * La regla de coherencia narrativa es que **un callback debe tener causa
 * rastreable**. Cada función lee sólo flags que una Template anterior grabó en
 * su propio año y devuelve cadena vacía cuando no hay nada que recordar; nunca
 * afirma un hecho que el sistema no pueda justificar desde el log. Además son
 * puramente narrativos: entran en `setup`, no tocan parámetros, evaluación ni
 * puntaje, así que dos runs con la misma seed y distinta memoria resuelven
 * exactamente la misma instancia matemática.
 */

type Flags = RunState['flags']

const QUALITIES = ['optimal', 'efficient', 'functional', 'invalid'] as const
type Quality = (typeof QUALITIES)[number]

function quality(flags: Flags, flag: string): Quality | undefined {
  const value = flags[flag]
  return QUALITIES.find((entry) => entry === value)
}

/** El beat del Proyecto del Curso que la run jugó más recientemente, si hubo alguno. */
function lastProject(
  flags: Flags,
): { readonly year: string; readonly quality: Quality } | undefined {
  const beats = [
    ['primero', 'y1.project.outcome'],
    ['segundo', 'y2.survey.outcome'],
    ['tercero', 'y3.projectTech.outcome'],
    ['cuarto', 'y4.fundraiser.outcome'],
  ] as const
  for (const [year, flag] of [...beats].reverse()) {
    const result = quality(flags, flag)
    if (result !== undefined) return { year, quality: result }
  }
  return undefined
}

/**
 * Cómo llega el Proyecto del Curso al año en curso.
 *
 * El arco recorre 1.º–5.º pero la composición sólo agenda una o dos de sus
 * Templates por carrera: por eso el recuerdo se construye del último beat que
 * realmente ocurrió, y no de una lista fija de años.
 */
export function projectArcCallback(flags: Flags): string {
  const previous = lastProject(flags)
  if (previous === undefined) return ''
  if (previous.quality === 'invalid')
    return `En ${previous.year} el Proyecto del Curso salió mal y quedó la sensación de que se podía haber organizado mejor. `
  if (previous.quality === 'functional')
    return `En ${previous.year} el Proyecto del Curso salió, aunque ajustado. `
  return `En ${previous.year} el Proyecto del Curso funcionó, y el grupo llega con esa confianza. `
}

/** Lo que quedó del Día del Amigo, cuando la run lo jugó. */
export function friendDayCallback(flags: Flags): string {
  const result = quality(flags, 'y3.friendDay.outcome')
  if (result === undefined) return ''
  return result === 'invalid'
    ? 'El Día del Amigo de tercero terminó a las corridas, y de eso todavía se acuerdan. '
    : 'Desde el Día del Amigo de tercero quedó la costumbre de avisar antes de arrancar. '
}

/**
 * La confianza que deja haber coordinado bien al grupo.
 *
 * El contexto narrativo expone flags, no dimensiones de carrera, y está bien
 * que así sea: el recuerdo se apoya en el hecho concreto —esta run jugó una
 * Template de Equipo y le fue de tal modo— y no en un número agregado que el
 * jugador nunca vio. Sin ninguno de esos beats, no hay recuerdo.
 */
export function teamworkCallback(flags: Flags): string {
  const results = [
    'y2.intercurso.outcome',
    'y3.projectTech.outcome',
    'y4.shifts.outcome',
  ]
    .map((flag) => quality(flags, flag))
    .filter((result): result is Quality => result !== undefined)
  if (results.length === 0) return ''
  if (results.some((result) => result === 'optimal' || result === 'efficient'))
    return 'El curso ya te vio repartir tareas y salir bien, así que esta vez te preguntan a vos. '
  return 'Repartir tareas con el curso ya te costó una vez, y eso también se tiene en cuenta. '
}
