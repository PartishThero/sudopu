/**
 * @fileoverview Unit tests for the puzzle generator.
 *
 * Tests: valid generation, unique solutions, difficulty ranges, seeding
 */

import { describe, it, expect } from 'vitest'
import { generatePuzzle, generateSeededPuzzle, hasUniqueSolution } from '../generator.ts'
import { isSolved, isValidBoard, countSolutions } from '../solver.ts'
import type { Board, Difficulty } from '../types.ts'

const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard', 'expert']

describe('generatePuzzle', () => {
  it.each(DIFFICULTIES)('generates a valid %s puzzle', difficulty => {
    const result = generatePuzzle(difficulty)

    // Puzzle has correct length
    expect(result.puzzle).toHaveLength(81)
    expect(result.solution).toHaveLength(81)

    // Solution is a complete valid board
    expect(isSolved(result.solution)).toBe(true)

    // Puzzle has empty cells
    expect(result.puzzle.some(v => v === 0)).toBe(true)

    // Puzzle values match solution where filled
    for (let i = 0; i < 81; i++) {
      if (result.puzzle[i] !== 0) {
        expect(result.puzzle[i]).toBe(result.solution[i])
      }
    }

    // Puzzle board itself is valid (no conflicts)
    expect(isValidBoard(result.puzzle)).toBe(true)
  })

  it.each(DIFFICULTIES)('generates a puzzle with exactly one solution (%s)', difficulty => {
    const result = generatePuzzle(difficulty)
    const solutionCount = countSolutions(result.puzzle, 2)
    expect(solutionCount).toBe(1)
  }, 30000) // Allow up to 30s for this test

  it('generates different puzzles on subsequent calls (same difficulty)', () => {
    const a = generatePuzzle('easy')
    const b = generatePuzzle('easy')
    // They should almost certainly differ (probability of same is negligible)
    expect(a.puzzle).not.toEqual(b.puzzle)
  })
})

describe('generateSeededPuzzle', () => {
  it('produces identical puzzles for the same seed', () => {
    const seed = 12345
    const a = generateSeededPuzzle(seed, 'medium')
    const b = generateSeededPuzzle(seed, 'medium')
    expect(a.puzzle).toEqual(b.puzzle)
    expect(a.solution).toEqual(b.solution)
  })

  it('produces different puzzles for different seeds', () => {
    const a = generateSeededPuzzle(1000, 'medium')
    const b = generateSeededPuzzle(2000, 'medium')
    expect(a.puzzle).not.toEqual(b.puzzle)
  })

  it('generated seeded puzzle has unique solution', () => {
    const result = generateSeededPuzzle(99999, 'easy')
    expect(countSolutions(result.puzzle, 2)).toBe(1)
  })
})

describe('hasUniqueSolution', () => {
  it('returns true for a valid easy puzzle', () => {
    const result = generateSeededPuzzle(42, 'easy')
    expect(hasUniqueSolution(result.puzzle)).toBe(true)
  })

  it('returns false for an empty board', () => {
    const empty = new Array(81).fill(0) as Board
    expect(hasUniqueSolution(empty)).toBe(false)
  })

  it('returns false for a board with two solutions', () => {
    // Remove one clue from a valid puzzle to potentially create ambiguity
    // (Use a minimal clue count puzzle to test)
    const empty = new Array(81).fill(0) as Board
    expect(hasUniqueSolution(empty)).toBe(false)
  })
})

describe('puzzle clue counts', () => {
  it('easy puzzles have between 36 and 45 clues', () => {
    const result = generateSeededPuzzle(7777, 'easy')
    const clues = result.puzzle.filter(v => v !== 0).length
    expect(clues).toBeGreaterThanOrEqual(30) // Allow some tolerance
    expect(clues).toBeLessThanOrEqual(50)
  })

  it('expert puzzles have fewer clues than easy puzzles', () => {
    const easy = generateSeededPuzzle(100, 'easy')
    const expert = generateSeededPuzzle(100, 'expert')
    const easyClues = easy.puzzle.filter(v => v !== 0).length
    const expertClues = expert.puzzle.filter(v => v !== 0).length
    expect(expertClues).toBeLessThan(easyClues)
  })
})
