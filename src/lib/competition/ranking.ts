/**
 * El comparador del ranking, y nada más.
 *
 * La regla v1 está cerrada en producto: `FairScore` descendente, `Prestige`
 * descendente y **puesto compartido** si empatan los dos. No hay criterio
 * terciario. Ni el tiempo, ni el orden de llegada, ni la cantidad de intentos,
 * ni la seed, ni un identificador deciden un puesto.
 *
 * Que esto sea una función pura sobre una lista ya ordenada por la base —y no
 * una ventana en SQL— es lo que permite probar la semántica de empate sin
 * levantar Postgres, que es exactamente la parte que un error silencioso
 * volvería injusta.
 *
 * El puesto es "cuántos participantes son estrictamente mejores, más uno".
 * Con 100, 100, 90 y 80 los puestos son 1, 1, 3 y 4: el empate ocupa dos
 * lugares, así que el siguiente es el tercero. La alternativa —numerar 1, 1, 2,
 * 3— diría que hay un segundo puesto que nadie ganó.
 */

export interface RankableResult {
  readonly participantId: string
  readonly fairScore: number
  readonly prestigeScore: number
}

export interface RankedEntry<T extends RankableResult> {
  readonly rank: number
  readonly result: T
}

/** Orden de los empatados en pantalla. Estabiliza el dibujo, nunca el puesto. */
function displayOrder(left: RankableResult, right: RankableResult): number {
  return left.participantId < right.participantId ? -1 : 1
}

export function compareResults(
  left: RankableResult,
  right: RankableResult,
): number {
  if (left.fairScore !== right.fairScore)
    return right.fairScore - left.fairScore
  if (left.prestigeScore !== right.prestigeScore)
    return right.prestigeScore - left.prestigeScore
  return displayOrder(left, right)
}

/**
 * Asigna puestos compartidos.
 *
 * Recibe cualquier orden y devuelve la lista ordenada con su puesto. No filtra
 * ni deduplica: cada participante tiene que llegar acá con una sola fila, que
 * es responsabilidad de la consulta del mejor intento.
 */
export function rankEntries<T extends RankableResult>(
  results: readonly T[],
): readonly RankedEntry<T>[] {
  const sorted = [...results].sort(compareResults)
  const ranked: RankedEntry<T>[] = []

  let currentRank = 0
  let previous: RankableResult | undefined

  for (const [index, result] of sorted.entries()) {
    const tied =
      previous !== undefined &&
      previous.fairScore === result.fairScore &&
      previous.prestigeScore === result.prestigeScore
    currentRank = tied ? currentRank : index + 1
    ranked.push({ rank: currentRank, result })
    previous = result
  }

  return ranked
}
