/**
 * @fileoverview Unit tests for daily challenge puzzle generation.
 */

import { describe, it, expect } from 'vitest'
import { getTodayDateString, dateSeed, getDailyDifficulty, getDailyPuzzle } from '../daily.ts'
import { isSolved, countSolutions } from '../solver.ts'

describe('getTodayDateString', () => {
  it('returns a date in YYYY-MM-DD format', () => {
    const date = getTodayDateString()
    expect(date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
})

describe('dateSeed', () => {
  it('returns the same seed for the same date', () => {
    expect(dateSeed('2024-01-01')).toBe(dateSeed('2024-01-01'))
  })

  it('returns different seeds for different dates', () => {
    expect(dateSeed('2024-01-01')).not.toBe(dateSeed('2024-01-02'))
  })

  it('returns a positive integer', () => {
    const seed = dateSeed('2024-06-15')
    expect(typeof seed).toBe('number')
    expect(seed).toBeGreaterThan(0)
    expect(Number.isInteger(seed)).toBe(true)
  })
})

describe('getDailyDifficulty', () => {
  it('returns easy on Monday', () => {
    // 2024-01-01 is a Monday
    expect(getDailyDifficulty('2024-01-01')).toBe('easy')
  })

  it('returns medium on Wednesday', () => {
    // 2024-01-03 is a Wednesday
    expect(getDailyDifficulty('2024-01-03')).toBe('medium')
  })

  it('returns hard on Friday', () => {
    // 2024-01-05 is a Friday
    expect(getDailyDifficulty('2024-01-05')).toBe('hard')
  })

  it('returns expert on Sunday', () => {
    // 2024-01-07 is a Sunday
    expect(getDailyDifficulty('2024-01-07')).toBe('expert')
  })
})

describe('getDailyPuzzle', () => {
  it('returns the same puzzle for the same date', () => {
    const a = getDailyPuzzle('2024-03-15')
    const b = getDailyPuzzle('2024-03-15')
    expect(a.puzzle).toEqual(b.puzzle)
    expect(a.solution).toEqual(b.solution)
  })

  it('returns different puzzles for different dates', () => {
    const a = getDailyPuzzle('2024-03-15')
    const b = getDailyPuzzle('2024-03-16')
    expect(a.puzzle).not.toEqual(b.puzzle)
  })

  it('returns a puzzle with a unique solution', () => {
    const result = getDailyPuzzle('2024-06-01')
    expect(countSolutions(result.puzzle, 2)).toBe(1)
  }, 30000)

  it('returns a valid complete solution', () => {
    const result = getDailyPuzzle('2024-07-04')
    expect(isSolved(result.solution)).toBe(true)
  })

  it('includes the dateStr in the result', () => {
    const result = getDailyPuzzle('2024-12-25')
    expect(result.dateStr).toBe('2024-12-25')
  })
})
