/**
 * SHA-256 for the deterministic core.
 *
 * Variant fingerprints have to survive collisions across tens of thousands of
 * generated candidates, so the eight-hex FNV digest used for version
 * fingerprints is not enough: at ten thousand entries a 32-bit hash collides
 * about one time in a hundred, and a fingerprint that collides silently merges
 * two different problems into one catalog entry.
 *
 * The engine runs in the browser and on the server, and its dependency
 * allowlist is deliberately two libraries wide, so `node:crypto` is not
 * reachable from here. This is therefore the standard algorithm implemented in
 * portable TypeScript rather than an invented one — and it is checked against
 * the published FIPS 180-4 test vectors, which is the only reason to trust a
 * hand-written primitive.
 *
 * It hashes UTF-8 bytes, so two strings that differ only outside the BMP still
 * differ in the digest.
 */

const ROUND_CONSTANTS = [
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1,
  0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3,
  0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786,
  0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147,
  0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
  0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b,
  0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a,
  0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
  0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
] as const

const INITIAL_STATE = [
  0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c,
  0x1f83d9ab, 0x5be0cd19,
] as const

function rotateRight(value: number, bits: number): number {
  return ((value >>> bits) | (value << (32 - bits))) >>> 0
}

/** UTF-8 bytes of a string, without depending on a platform encoder. */
function utf8Bytes(input: string): number[] {
  const bytes: number[] = []

  for (let index = 0; index < input.length; index += 1) {
    const codePoint = input.codePointAt(index)
    if (codePoint === undefined) continue
    if (codePoint > 0xffff) index += 1

    if (codePoint < 0x80) {
      bytes.push(codePoint)
    } else if (codePoint < 0x800) {
      bytes.push(0xc0 | (codePoint >> 6), 0x80 | (codePoint & 0x3f))
    } else if (codePoint < 0x10000) {
      bytes.push(
        0xe0 | (codePoint >> 12),
        0x80 | ((codePoint >> 6) & 0x3f),
        0x80 | (codePoint & 0x3f),
      )
    } else {
      bytes.push(
        0xf0 | (codePoint >> 18),
        0x80 | ((codePoint >> 12) & 0x3f),
        0x80 | ((codePoint >> 6) & 0x3f),
        0x80 | (codePoint & 0x3f),
      )
    }
  }

  return bytes
}

/** Lowercase hex SHA-256 of a string's UTF-8 bytes. */
export function sha256Hex(input: string): string {
  const bytes = utf8Bytes(input)
  const bitLength = bytes.length * 8

  bytes.push(0x80)
  while (bytes.length % 64 !== 56) bytes.push(0)

  // Length as a 64-bit big-endian count of bits. The high word is computed with
  // division rather than shifts, which would wrap at 32 bits.
  const high = Math.floor(bitLength / 0x100000000)
  const low = bitLength >>> 0
  bytes.push(
    (high >>> 24) & 0xff,
    (high >>> 16) & 0xff,
    (high >>> 8) & 0xff,
    high & 0xff,
    (low >>> 24) & 0xff,
    (low >>> 16) & 0xff,
    (low >>> 8) & 0xff,
    low & 0xff,
  )

  const state: number[] = [...INITIAL_STATE]
  const schedule = new Array<number>(64).fill(0)

  for (let offset = 0; offset < bytes.length; offset += 64) {
    for (let index = 0; index < 16; index += 1) {
      const at = offset + index * 4
      schedule[index] =
        (((bytes[at] ?? 0) << 24) |
          ((bytes[at + 1] ?? 0) << 16) |
          ((bytes[at + 2] ?? 0) << 8) |
          (bytes[at + 3] ?? 0)) >>>
        0
    }

    for (let index = 16; index < 64; index += 1) {
      const previous = schedule[index - 15] ?? 0
      const ahead = schedule[index - 2] ?? 0
      const s0 =
        (rotateRight(previous, 7) ^
          rotateRight(previous, 18) ^
          (previous >>> 3)) >>>
        0
      const s1 =
        (rotateRight(ahead, 17) ^ rotateRight(ahead, 19) ^ (ahead >>> 10)) >>> 0
      schedule[index] = (((schedule[index - 16] ?? 0) +
        s0 +
        (schedule[index - 7] ?? 0) +
        s1) >>>
        0) as number
    }

    let [a, b, c, d, e, f, g, h] = state as [
      number,
      number,
      number,
      number,
      number,
      number,
      number,
      number,
    ]

    for (let index = 0; index < 64; index += 1) {
      const s1 =
        (rotateRight(e, 6) ^ rotateRight(e, 11) ^ rotateRight(e, 25)) >>> 0
      const choose = ((e & f) ^ (~e & g)) >>> 0
      const temp1 =
        (h +
          s1 +
          choose +
          (ROUND_CONSTANTS[index] ?? 0) +
          (schedule[index] ?? 0)) >>>
        0
      const s0 =
        (rotateRight(a, 2) ^ rotateRight(a, 13) ^ rotateRight(a, 22)) >>> 0
      const majority = ((a & b) ^ (a & c) ^ (b & c)) >>> 0
      const temp2 = (s0 + majority) >>> 0

      h = g
      g = f
      f = e
      e = (d + temp1) >>> 0
      d = c
      c = b
      b = a
      a = (temp1 + temp2) >>> 0
    }

    const round = [a, b, c, d, e, f, g, h]
    for (let index = 0; index < 8; index += 1) {
      state[index] = (((state[index] ?? 0) + (round[index] ?? 0)) >>>
        0) as number
    }
  }

  return state.map((word) => word.toString(16).padStart(8, '0')).join('')
}
