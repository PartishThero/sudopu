/**
 * @fileoverview Unit tests for difficulty classifier and hint system.
 */

import { describe, it, expect } from 'vitest'
import { classifyDifficulty, getHint } from '../difficulty.ts'
import { generateSeededPuzzle } from '../generator.ts'
import type { Board } from '../types.ts'

// A trivially easy puzzle where almost every cell is naked/hidden single
const NEAR_COMPLETE: Board = [
  5, 3, 4, 6, 7, 8, 9, 1, 2, 6, 7, 2, 1, 9, 5, 3, 4, 8, 1, 9, 8, 3, 4, 2, 5, 6, 7, 8, 5, 9, 7,
  6, 1, 4, 2, 3, 4, 2, 6, 8, 5, 3, 7, 9, 1, 7, 1, 3, 9, 2, 4, 8, 5, 6, 9, 6, 1, 5, 3, 7, 2, 8,
  4, 2, 8, 7, 4, 1, 9, 6, 3, 5, 3, 4, 5, 2, 8, 6, 1, 7, 0, // last cell empty
]

describe('classifyDifficulty', () => {
  it('classifies a near-complete board as easy', () => {
    const result = classifyDifficulty(NEAR_COMPLETE)
    expect(result.difficulty).toBe('easy')
    expect(result.techniquesUsed).toContain('naked_single')
  })

  it('returns a non-empty techniquesUsed array', () => {
    const puzzle = generateSeededPuzzle(1, 'medium')
    const result = classifyDifficulty(puzzle.puzzle)
    expect(result.techniquesUsed.length).toBeGreaterThan(0)
  })

  it('assigns higher scores to harder puzzles', () => {
    const easy = generateSeededPuzzle(42, 'easy')
    const hard = generateSeededPuzzle(42, 'hard')
    const easyResult = classifyDifficulty(easy.puzzle)
    const hardResult = classifyDifficulty(hard.puzzle)
    expect(hardResult.score).toBeGreaterThanOrEqual(easyResult.score)
  })

  it('classifies a fully solved board with no techniques needed', () => {
    // A complete board needs no techniques
    const full: Board = [
      5, 3, 4, 6, 7, 8, 9, 1, 2, 6, 7, 2, 1, 9, 5, 3, 4, 8, 1, 9, 8, 3, 4, 2, 5, 6, 7, 8, 5, 9,
      7, 6, 1, 4, 2, 3, 4, 2, 6, 8, 5, 3, 7, 9, 1, 7, 1, 3, 9, 2, 4, 8, 5, 6, 9, 6, 1, 5, 3, 7,
      2, 8, 4, 2, 8, 7, 4, 1, 9, 6, 3, 5, 3, 4, 5, 2, 8, 6, 1, 7, 9,
    ]
    const result = classifyDifficulty(full)
    expect(result.techniquesUsed).toHaveLength(0)
  })
})

describe('getHint', () => {
  it('returns a hint for a near-complete board', () => {
    const hint = getHint(NEAR_COMPLETE)
    expect(hint).not.toBeNull()
    expect(hint!.cellIndex).toBe(80) // Last cell
    expect(hint!.value).toBe(9)
    expect(hint!.technique).toBeTruthy()
    expect(hint!.explanation).toBeTruthy()
  })

  it('returns null for a complete board', () => {
    const full: Board = [
      5, 3, 4, 6, 7, 8, 9, 1, 2, 6, 7, 2, 1, 9, 5, 3, 4, 8, 1, 9, 8, 3, 4, 2, 5, 6, 7, 8, 5, 9,
      7, 6, 1, 4, 2, 3, 4, 2, 6, 8, 5, 3, 7, 9, 1, 7, 1, 3, 9, 2, 4, 8, 5, 6, 9, 6, 1, 5, 3, 7,
      2, 8, 4, 2, 8, 7, 4, 1, 9, 6, 3, 5, 3, 4, 5, 2, 8, 6, 1, 7, 9,
    ]
    expect(getHint(full)).toBeNull()
  })

  it('hint value matches the solution', () => {
    const { puzzle, solution } = generateSeededPuzzle(555, 'easy')
    const hint = getHint(puzzle)
    if (hint) {
      expect(hint.value).toBe(solution[hint.cellIndex])
    }
  })
})
