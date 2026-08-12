/**
 * @fileoverview Seeded pseudo-random number generator (LCG variant).
 *
 * Used by the puzzle generator to produce reproducible puzzles from a seed.
 * This is a Mulberry32 PRNG — fast and has good distribution for game use.
 *
 * @module utils/seeding
 */

/**
 * Mulberry32 seeded PRNG.
 * Produces a float in [0, 1) each call, similar to Math.random().
 */
export class SeededRandom {
  private state: number

  constructor(seed: number) {
    this.state = seed >>> 0
  }

  /**
   * Returns the next pseudo-random float in [0, 1).
   */
  next(): number {
    this.state = (this.state + 0x6d2b79f5) >>> 0
    let t = Math.imul(this.state ^ (this.state >>> 15), 1 | this.state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) >>> 0
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }

  /** Creates a new SeededRandom from a date string */
  static fromDate(dateStr: string): SeededRandom {
    let hash = 5381
    for (let i = 0; i < dateStr.length; i++) {
      hash = ((hash << 5) + hash + dateStr.charCodeAt(i)) >>> 0
    }
    return new SeededRandom(hash)
  }
}
