import { describe, expect, it } from 'vitest'

import { compareResults, rankEntries } from '@/lib/competition'
import { rankOf, toPublicLeaderboard } from '@/server/competition/dto'
import type { BestAttemptRow } from '@/server/persistence/competition/rows'

/**
 * El comparador del ranking y la semántica del puesto compartido.
 *
 * La regla v1 está cerrada en producto: FairScore descendente, Prestige
 * descendente, puesto compartido si empatan los dos. Lo que estos tests
 * defienden no es la implementación sino la **ausencia** de todo lo demás —
 * tiempo, orden de llegada, cantidad de intentos, alias— como criterio.
 */

function best(
  participantId: string,
  fair: number,
  prestige = 0,
  nickname = participantId,
): BestAttemptRow {
  return {
    competitionId: 'c1',
    participantId,
    attemptId: `a-${participantId}`,
    publicNickname: nickname,
    nicknameHidden: false,
    verifiedFairScore: fair,
    verifiedPrestigeScore: prestige,
    verifiedAt: '2026-10-03T16:00:00.000Z',
  }
}

describe('comparador', () => {
  it('ordena por FairScore antes que por Prestige', () => {
    const results = [
      { participantId: 'a', fairScore: 9000, prestigeScore: 100 },
      { participantId: 'b', fairScore: 9001, prestigeScore: 0 },
    ]
    expect([...results].sort(compareResults)[0]?.participantId).toBe('b')
  })

  it('no suma Prestige al FairScore', () => {
    // 9.999 con 100 de Prestige nunca supera a 10.000 con 0. Son dos escalas
    // distintas y sumarlas inventaría una tercera que nadie calibró.
    const results = [
      { participantId: 'a', fairScore: 9999, prestigeScore: 100 },
      { participantId: 'b', fairScore: 10000, prestigeScore: 0 },
    ]
    expect([...results].sort(compareResults)[0]?.participantId).toBe('b')
  })

  it('usa Prestige sólo para desempatar', () => {
    const results = [
      { participantId: 'a', fairScore: 9000, prestigeScore: 10 },
      { participantId: 'b', fairScore: 9000, prestigeScore: 40 },
    ]
    expect([...results].sort(compareResults)[0]?.participantId).toBe('b')
  })
})

describe('puestos compartidos', () => {
  it('cuenta cuántos son estrictamente mejores, más uno', () => {
    const ranked = rankEntries([
      { participantId: 'a', fairScore: 100, prestigeScore: 0 },
      { participantId: 'b', fairScore: 100, prestigeScore: 0 },
      { participantId: 'c', fairScore: 90, prestigeScore: 0 },
      { participantId: 'd', fairScore: 80, prestigeScore: 0 },
    ])
    // El empate ocupa dos lugares, así que el siguiente es el tercero. Numerar
    // 1, 1, 2, 3 diría que hay un segundo puesto que nadie ganó.
    expect(ranked.map((entry) => entry.rank)).toEqual([1, 1, 3, 4])
  })

  it('comparte el primer puesto entre cuatro sin inventar un segundo', () => {
    const ranked = rankEntries(
      ['a', 'b', 'c', 'd'].map((id) => ({
        participantId: id,
        fairScore: 10000,
        prestigeScore: 0,
      })),
    )
    expect(ranked.every((entry) => entry.rank === 1)).toBe(true)
  })

  it('no deja que el orden de entrada cambie un puesto', () => {
    const results = [
      { participantId: 'z', fairScore: 100, prestigeScore: 0 },
      { participantId: 'a', fairScore: 100, prestigeScore: 0 },
    ]
    const forward = rankEntries(results)
    const backward = rankEntries([...results].reverse())
    expect(forward.map((entry) => entry.result.participantId)).toEqual(
      backward.map((entry) => entry.result.participantId),
    )
    expect(forward.every((entry) => entry.rank === 1)).toBe(true)
  })
})

describe('leaderboard público', () => {
  it('corta por puesto y no por cantidad de filas', () => {
    const board = toPublicLeaderboard(
      [
        best('a', 100),
        best('b', 100),
        best('c', 100),
        best('d', 100),
        best('e', 50),
      ],
      { maxRank: 3 },
    )
    // Cuatro personas empatadas en el primer puesto entran las cuatro. Cortar
    // en tres filas dejaría afuera a alguien que empató.
    expect(board.entries).toHaveLength(4)
    expect(board.entries.every((entry) => entry.rank === 1)).toBe(true)
    expect(board.total).toBe(5)
  })

  it('muestra el podio de tres puestos cuando no hay empates', () => {
    const board = toPublicLeaderboard(
      [best('a', 100), best('b', 90), best('c', 80), best('d', 70)],
      { maxRank: 3 },
    )
    expect(board.entries.map((entry) => entry.rank)).toEqual([1, 2, 3])
  })

  it('marca la fila de quien mira, sin devolver su id', () => {
    const board = toPublicLeaderboard([best('a', 100), best('b', 90)], {
      maxRank: 3,
      viewerParticipantId: 'b',
    })
    expect(board.entries[1]?.isYou).toBe(true)
    expect(JSON.stringify(board.entries)).not.toContain('participantId')
  })

  it('oculta el alias sin borrar el puesto', () => {
    const hidden: BestAttemptRow = {
      ...best('a', 100, 0, 'alias inapropiado'),
      nicknameHidden: true,
    }
    const board = toPublicLeaderboard([hidden, best('b', 90)], { maxRank: 3 })
    expect(board.entries[0]?.nickname).toBe('Jugador oculto')
    expect(board.entries[0]?.rank).toBe(1)
    expect(board.entries[0]?.fairScore).toBe(100)
  })

  it('devuelve el puesto propio aunque esté fuera del podio', () => {
    const rows = Array.from({ length: 20 }, (_, index) =>
      best(`p${String(index)}`, 1000 - index * 10),
    )
    expect(rankOf(rows, 'p11')).toBe(12)
    expect(rankOf(rows, 'inexistente')).toBeUndefined()
  })

  it('nunca ubica a un participante en dos filas', () => {
    const board = toPublicLeaderboard(
      [best('a', 100), best('b', 90), best('c', 80)],
      { maxRank: 10 },
    )
    const nicknames = board.entries.map((entry) => entry.nickname)
    expect(new Set(nicknames).size).toBe(nicknames.length)
  })
})
