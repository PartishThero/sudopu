/**
 * @fileoverview Sudoku solver using constraint propagation + backtracking.
 *
 * Used for:
 * 1. Validating generated puzzles have exactly one solution
 * 2. Providing in-game hints
 * 3. Powering the difficulty classifier
 *
 * @module engine/solver
 */

import type { Board, CellValue, CandidateGrid } from './types.ts'

// ---------------------------------------------------------------------------
// Constants & helpers
// ---------------------------------------------------------------------------

const CELLS = 81
const SIZE = 9

/** Returns the row index (0–8) for a cell index */
export const rowOf = (i: number): number => Math.floor(i / SIZE)

/** Returns the column index (0–8) for a cell index */
export const colOf = (i: number): number => i % SIZE

/** Returns the 3×3 box index (0–8) for a cell index */
export const boxOf = (i: number): number => Math.floor(rowOf(i) / 3) * 3 + Math.floor(colOf(i) / 3)

/**
 * Returns all 20 peers (same row, col, or box) of cell index i.
 * Peers are precomputed once for performance.
 */
export const PEERS: ReadonlyArray<ReadonlySet<number>> = (() => {
  const peers: Set<number>[] = Array.from({ length: CELLS }, () => new Set<number>())
  for (let i = 0; i < CELLS; i++) {
    for (let j = 0; j < CELLS; j++) {
      if (i !== j && (rowOf(i) === rowOf(j) || colOf(i) === colOf(j) || boxOf(i) === boxOf(j))) {
        peers[i].add(j)
      }
    }
  }
  return peers
})()

/** All cells in the same row as cell i */
export const rowCells = (i: number): number[] =>
  Array.from({ length: SIZE }, (_, c) => rowOf(i) * SIZE + c)

/** All cells in the same column as cell i */
export const colCells = (i: number): number[] =>
  Array.from({ length: SIZE }, (_, r) => r * SIZE + colOf(i))

/** All cells in the same 3×3 box as cell i */
export const boxCells = (i: number): number[] => {
  const br = Math.floor(rowOf(i) / 3) * 3
  const bc = Math.floor(colOf(i) / 3) * 3
  const cells: number[] = []
  for (let r = br; r < br + 3; r++) {
    for (let c = bc; c < bc + 3; c++) {
      cells.push(r * SIZE + c)
    }
  }
  return cells
}

/** Groups: all 27 rows + columns + boxes as arrays of cell indices */
export const GROUPS: ReadonlyArray<ReadonlyArray<number>> = (() => {
  const groups: number[][] = []
  // Rows
  for (let r = 0; r < SIZE; r++) {
    groups.push(Array.from({ length: SIZE }, (_, c) => r * SIZE + c))
  }
  // Cols
  for (let c = 0; c < SIZE; c++) {
    groups.push(Array.from({ length: SIZE }, (_, r) => r * SIZE + c))
  }
  // Boxes
  for (let br = 0; br < 3; br++) {
    for (let bc = 0; bc < 3; bc++) {
      const box: number[] = []
      for (let r = br * 3; r < br * 3 + 3; r++) {
        for (let c = bc * 3; c < bc * 3 + 3; c++) {
          box.push(r * SIZE + c)
        }
      }
      groups.push(box)
    }
  }
  return groups
})()

// ---------------------------------------------------------------------------
// Candidate grid helpers
// ---------------------------------------------------------------------------

/**
 * Builds an initial candidate grid from a board.
 * Each empty cell starts with all values [1–9] that don't conflict with peers.
 */
export function buildCandidates(board: Board): CandidateGrid {
  const grid: CandidateGrid = Array.from({ length: CELLS }, () => new Set<CellValue>())

  for (let i = 0; i < CELLS; i++) {
    if (board[i] !== 0) {
      // Filled cell — candidates don't matter, but we store its value for reference
      grid[i].add(board[i] as CellValue)
    } else {
      // Start with all values, then eliminate peers
      const used = new Set<CellValue>()
      for (const peer of PEERS[i]) {
        if (board[peer] !== 0) used.add(board[peer] as CellValue)
      }
      for (let v = 1; v <= 9; v++) {
        if (!used.has(v as CellValue)) grid[i].add(v as CellValue)
      }
    }
  }
  return grid
}

// ---------------------------------------------------------------------------
// Core solver
// ---------------------------------------------------------------------------

/**
 * Attempts to solve `board` using backtracking (with MRV heuristic).
 *
 * @param board - The puzzle to solve (modified in-place when counting > 0)
 * @param solutionCount - Stop after finding this many solutions (use 1 for normal solving, 2 for uniqueness check)
 * @returns number of solutions found (up to `solutionCount`)
 */
export function countSolutions(board: Board, solutionCount: number = 1): number {
  const clone = board.slice() as Board
  let found = 0

  function solve(): boolean {
    // Find the empty cell with the minimum remaining values (MRV heuristic)
    let minCandidates = 10
    let chosen = -1

    const used: Set<CellValue>[] = Array.from({ length: CELLS }, () => new Set<CellValue>())

    for (let i = 0; i < CELLS; i++) {
      if (clone[i] !== 0) continue
      const u = new Set<CellValue>()
      for (const p of PEERS[i]) {
        if (clone[p] !== 0) u.add(clone[p] as CellValue)
      }
      used[i] = u
      const count = 9 - u.size
      if (count === 0) return false // Dead end
      if (count < minCandidates) {
        minCandidates = count
        chosen = i
      }
    }

    if (chosen === -1) {
      // All cells filled — solution found
      found++
      return found >= solutionCount
    }

    for (let v = 1; v <= 9; v++) {
      if (!used[chosen].has(v as CellValue)) {
        clone[chosen] = v as CellValue
        if (solve()) return true
        clone[chosen] = 0
      }
    }
    return false
  }

  solve()
  return found
}

/**
 * Solves the board and returns the solution, or null if unsolvable.
 *
 * @param board - The puzzle board (not modified)
 * @returns Solved board or null
 */
export function solve(board: Board): Board | null {
  const clone = board.slice() as Board
  let solved = false

  function bt(): boolean {
    let minCandidates = 10
    let chosen = -1
    const usedSets: Set<CellValue>[] = Array.from({ length: CELLS }, () => new Set<CellValue>())

    for (let i = 0; i < CELLS; i++) {
      if (clone[i] !== 0) continue
      const u = new Set<CellValue>()
      for (const p of PEERS[i]) {
        if (clone[p] !== 0) u.add(clone[p] as CellValue)
      }
      usedSets[i] = u
      const count = 9 - u.size
      if (count === 0) return false
      if (count < minCandidates) {
        minCandidates = count
        chosen = i
      }
    }

    if (chosen === -1) {
      solved = true
      return true
    }

    for (let v = 1; v <= 9; v++) {
      if (!usedSets[chosen].has(v as CellValue)) {
        clone[chosen] = v as CellValue
        if (bt()) return true
        clone[chosen] = 0
      }
    }
    return false
  }

  bt()
  return solved ? clone : null
}

/**
 * Checks if a board position is valid (no conflicts).
 * Does NOT require the board to be complete.
 *
 * @param board - The board to validate
 * @returns true if no conflicts exist
 */
export function isValidBoard(board: Board): boolean {
  for (const group of GROUPS) {
    const seen = new Set<number>()
    for (const cell of group) {
      const v = board[cell]
      if (v === 0) continue
      if (seen.has(v)) return false
      seen.add(v)
    }
  }
  return true
}

/**
 * Returns the set of cell indices that are in conflict with their peers.
 *
 * @param board - The board to check
 * @returns Set of cell indices that have conflicts
 */
export function getConflicts(board: Board): Set<number> {
  const conflicts = new Set<number>()
  for (const group of GROUPS) {
    const seen = new Map<number, number>()
    for (const cell of group) {
      const v = board[cell]
      if (v === 0) continue
      if (seen.has(v)) {
        conflicts.add(cell)
        conflicts.add(seen.get(v)!)
      } else {
        seen.set(v, cell)
      }
    }
  }
  return conflicts
}

/**
 * Checks if a board is completely and correctly solved.
 *
 * @param board - The board to check
 * @returns true if the board is a valid complete solution
 */
export function isSolved(board: Board): boolean {
  if (board.some(v => v === 0)) return false
  return isValidBoard(board)
}
