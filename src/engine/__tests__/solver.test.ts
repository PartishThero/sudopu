/**
 * @fileoverview Unit tests for the Sudoku solver engine.
 *
 * Tests: validity checking, conflict detection, solving, countSolutions
 */

import { describe, it, expect } from 'vitest'
import {
  isValidBoard,
  getConflicts,
  isSolved,
  solve,
  countSolutions,
  rowOf,
  colOf,
  boxOf,
  PEERS,
} from '../solver.ts'
import type { Board } from '../types.ts'

// A known valid puzzle (Easy)
const EASY_PUZZLE: Board = [
  5, 3, 0, 0, 7, 0, 0, 0, 0, 6, 0, 0, 1, 9, 5, 0, 0, 0, 0, 9, 8, 0, 0, 0, 0, 6, 0, 8, 0, 0, 0,
  6, 0, 0, 0, 3, 4, 0, 0, 8, 0, 3, 0, 0, 1, 7, 0, 0, 0, 2, 0, 0, 0, 6, 0, 6, 0, 0, 0, 0, 2, 8,
  0, 0, 0, 0, 4, 1, 9, 0, 0, 5, 0, 0, 0, 0, 8, 0, 0, 7, 9,
]

const EASY_SOLUTION: Board = [
  5, 3, 4, 6, 7, 8, 9, 1, 2, 6, 7, 2, 1, 9, 5, 3, 4, 8, 1, 9, 8, 3, 4, 2, 5, 6, 7, 8, 5, 9, 7,
  6, 1, 4, 2, 3, 4, 2, 6, 8, 5, 3, 7, 9, 1, 7, 1, 3, 9, 2, 4, 8, 5, 6, 9, 6, 1, 5, 3, 7, 2, 8,
  4, 2, 8, 7, 4, 1, 9, 6, 3, 5, 3, 4, 5, 2, 8, 6, 1, 7, 9,
]

// A board with a known conflict (two 5s in row 0)
const CONFLICTED_BOARD: Board = [
  5, 5, 0, 0, 7, 0, 0, 0, 0, 6, 0, 0, 1, 9, 5, 0, 0, 0, 0, 9, 8, 0, 0, 0, 0, 6, 0, 8, 0, 0, 0,
  6, 0, 0, 0, 3, 4, 0, 0, 8, 0, 3, 0, 0, 1, 7, 0, 0, 0, 2, 0, 0, 0, 6, 0, 6, 0, 0, 0, 0, 2, 8,
  0, 0, 0, 0, 4, 1, 9, 0, 0, 5, 0, 0, 0, 0, 8, 0, 0, 7, 9,
]

// Unsolvable puzzle (empty but conflicted)
const UNSOLVABLE: Board = new Array(81).fill(0) as Board
UNSOLVABLE[0] = 1
UNSOLVABLE[1] = 1 // Conflict in row 0

describe('rowOf / colOf / boxOf', () => {
  it('computes row correctly', () => {
    expect(rowOf(0)).toBe(0)
    expect(rowOf(9)).toBe(1)
    expect(rowOf(80)).toBe(8)
  })

  it('computes col correctly', () => {
    expect(colOf(0)).toBe(0)
    expect(colOf(8)).toBe(8)
    expect(colOf(9)).toBe(0)
    expect(colOf(80)).toBe(8)
  })

  it('computes box correctly', () => {
    expect(boxOf(0)).toBe(0)
    expect(boxOf(4)).toBe(1)
    expect(boxOf(8)).toBe(2)
    expect(boxOf(36)).toBe(3)
    expect(boxOf(80)).toBe(8)
  })
})

describe('PEERS', () => {
  it('each cell has exactly 20 peers', () => {
    for (let i = 0; i < 81; i++) {
      expect(PEERS[i].size).toBe(20)
    }
  })

  it('peers are symmetric', () => {
    for (let i = 0; i < 81; i++) {
      for (const peer of PEERS[i]) {
        expect(PEERS[peer].has(i)).toBe(true)
      }
    }
  })

  it('cell does not peer with itself', () => {
    for (let i = 0; i < 81; i++) {
      expect(PEERS[i].has(i)).toBe(false)
    }
  })
})

describe('isValidBoard', () => {
  it('returns true for an empty board', () => {
    const empty = new Array(81).fill(0) as Board
    expect(isValidBoard(empty)).toBe(true)
  })

  it('returns true for a partially filled valid board', () => {
    expect(isValidBoard(EASY_PUZZLE)).toBe(true)
  })

  it('returns true for a fully solved board', () => {
    expect(isValidBoard(EASY_SOLUTION)).toBe(true)
  })

  it('returns false for a board with row conflict', () => {
    expect(isValidBoard(CONFLICTED_BOARD)).toBe(false)
  })
})

describe('getConflicts', () => {
  it('returns empty set for a valid board', () => {
    const conflicts = getConflicts(EASY_PUZZLE)
    expect(conflicts.size).toBe(0)
  })

  it('identifies conflicting cells', () => {
    const conflicts = getConflicts(CONFLICTED_BOARD)
    expect(conflicts.has(0)).toBe(true)
    expect(conflicts.has(1)).toBe(true)
    expect(conflicts.size).toBeGreaterThanOrEqual(2)
  })
})

describe('isSolved', () => {
  it('returns false for incomplete board', () => {
    expect(isSolved(EASY_PUZZLE)).toBe(false)
  })

  it('returns true for complete valid solution', () => {
    expect(isSolved(EASY_SOLUTION)).toBe(true)
  })

  it('returns false for complete but invalid board', () => {
    const bad = [...EASY_SOLUTION] as Board
    bad[0] = bad[1] // create a conflict
    expect(isSolved(bad)).toBe(false)
  })
})

describe('solve', () => {
  it('solves a known easy puzzle correctly', () => {
    const solution = solve(EASY_PUZZLE)
    expect(solution).not.toBeNull()
    expect(solution).toEqual(EASY_SOLUTION)
  })

  it('returns null for an unsolvable board', () => {
    const result = solve(UNSOLVABLE)
    expect(result).toBeNull()
  })

  it('does not modify the input board', () => {
    const copy = [...EASY_PUZZLE] as Board
    solve(EASY_PUZZLE)
    expect(EASY_PUZZLE).toEqual(copy)
  })
})

describe('countSolutions', () => {
  it('counts exactly 1 solution for a valid puzzle', () => {
    expect(countSolutions(EASY_PUZZLE, 2)).toBe(1)
  })

  it('counts 0 solutions for an unsolvable board', () => {
    expect(countSolutions(UNSOLVABLE, 1)).toBe(0)
  })

  it('counts multiple solutions for an underconstrained board', () => {
    // Nearly empty board — definitely has many solutions
    const almostEmpty = new Array(81).fill(0) as Board
    const count = countSolutions(almostEmpty, 2)
    expect(count).toBeGreaterThanOrEqual(2)
  })
})
