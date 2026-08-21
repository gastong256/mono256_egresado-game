import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { toRunSeed } from '@/game'
import { createRng } from '@/game/random/rng'
import { deriveSeedValue, encodeRngPath } from '@/game/random/seed'

/**
 * RNG substream addressing contract.
 *
 * Every stored run's generated content depends on how a seed and a path become
 * a substream address. These vectors freeze that mapping.
 *
 * The separators are U+0001 (seed against path) and U+0000 (between segments).
 * They were once written as literal control bytes in the source, which made the
 * contract invisible to any reader and destroyable by any tool that normalises
 * whitespace — silently changing the content of every historical run. They are
 * escapes now, and this file is what keeps them that way.
 */

describe('RNG address encoding', () => {
  it('keeps every engine source free of literal control bytes', () => {
    // The separators must exist as escapes, never as raw bytes: a literal
    // control character is invisible to a reviewer and destroyable by any tool
    // that normalises whitespace, which would silently change the address of
    // every substream and therefore every stored run.
    const controlBytes = /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/u

    const sources = readdirSync('src/game/random').filter((name) =>
      name.endsWith('.ts'),
    )
    expect(sources.length).toBeGreaterThan(0)

    for (const name of sources) {
      const source = readFileSync(join('src/game/random', name), 'utf8')
      expect(controlBytes.test(source)).toBe(false)
    }

    const seedSource = readFileSync('src/game/random/seed.ts', 'utf8')
    expect(seedSource).toContain("'\\u0001'")
    expect(seedSource).toContain("'\\u0000'")
  })

  it.each([
    ['seed only', 'abc', [], 'abc\u0001'],
    ['one text segment', 'abc', ['stage'], 'abc\u0001stage'],
    [
      'two text segments',
      'abc',
      ['stage', 'event'],
      'abc\u0001stage\u0000event',
    ],
    [
      'numeric segment is prefixed',
      'abc',
      ['stage', 2],
      'abc\u0001stage\u0000#2',
    ],
    ['negative numeric segment', 'abc', [-3], 'abc\u0001#-3'],
  ])('encodes %s', (_label, seed, path, expected) => {
    expect(encodeRngPath(toRunSeed(seed), path)).toBe(expected)
  })

  it.each([
    // The junction between seed and path must not be forgeable by moving text
    // across it, which is what an unseparated concatenation would allow.
    ['seed/path junction', ['a', ['b']], ['ab', []]],
    ['segment junction', ['x', ['a', 'b']], ['x', ['ab']]],
    ['numeric versus text', ['x', ['a', 1]], ['x', ['a1']]],
    ['segment order', ['x', ['a', 'b']], ['x', ['b', 'a']]],
  ] as const)('keeps %s distinct', (_label, left, right) => {
    const [leftSeed, leftPath] = left
    const [rightSeed, rightPath] = right

    expect(encodeRngPath(toRunSeed(leftSeed), leftPath)).not.toBe(
      encodeRngPath(toRunSeed(rightSeed), rightPath),
    )
    expect(deriveSeedValue(toRunSeed(leftSeed), leftPath)).not.toBe(
      deriveSeedValue(toRunSeed(rightSeed), rightPath),
    )
  })

  it('derives the recorded seed values', () => {
    // Frozen vectors: a change here changes the content of every stored run and
    // therefore requires an ENGINE_VERSION bump.
    const vectors: readonly [string, readonly (string | number)[], number][] = [
      ['golden-alpha', [], -473_752_204],
      [
        'golden-alpha',
        ['stage', 'grade-7', 'event', 0, 'storylet'],
        1_329_544_409,
      ],
      [
        'golden-alpha',
        ['stage', 'year-1', 'event', 2, 'challenge-pick'],
        -1_116_499_591,
      ],
    ]

    for (const [seed, path, expected] of vectors) {
      expect(deriveSeedValue(toRunSeed(seed), path)).toBe(expected)
    }
  })

  it('produces the recorded draws for a frozen address', () => {
    const rng = createRng(toRunSeed('golden-alpha'), ['audit', 'vector'])
    expect([
      rng.nextInt(0, 999),
      rng.nextInt(0, 999),
      rng.nextInt(0, 999),
    ]).toEqual([643, 924, 485])
  })

  it('gives every substream an independent sequence', () => {
    // Adding a consumer under a new path must not disturb an existing one.
    const before = createRng(toRunSeed('s'), ['a']).nextInt(0, 1_000_000)
    createRng(toRunSeed('s'), ['b']).nextInt(0, 1_000_000)
    const after = createRng(toRunSeed('s'), ['a']).nextInt(0, 1_000_000)

    expect(after).toBe(before)
  })
})
