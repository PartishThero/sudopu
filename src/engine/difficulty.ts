/**
 * @fileoverview Technique-based Sudoku difficulty classifier.
 *
 * Classifies difficulty by simulating human solving techniques in order
 * of complexity. The hardest technique required determines the difficulty.
 *
 * Technique hierarchy:
 *   Easy:   naked_single, hidden_single
 *   Medium: pointing_pair, box_line_reduction
 *   Hard:   naked_pair, naked_triple, x_wing
 *   Expert: swordfish, coloring, backtracking (fallback)
 *
 * @module engine/difficulty
 */

import type { Board, CellValue, Difficulty, DifficultyResult, Hint, Technique } from './types.ts'
import { buildCandidates, PEERS, GROUPS, rowOf, colOf, boxOf } from './solver.ts'
import type { CandidateGrid } from './types.ts'

// ---------------------------------------------------------------------------
// Technique scores (higher = harder)
// ---------------------------------------------------------------------------

const TECHNIQUE_SCORES: Record<Technique, number> = {
  naked_single: 1,
  hidden_single: 2,
  pointing_pair: 3,
  box_line_reduction: 4,
  naked_pair: 5,
  naked_triple: 6,
  x_wing: 7,
  swordfish: 8,
  coloring: 9,
  backtracking: 10,
}

// ---------------------------------------------------------------------------
// Candidate grid manipulation helpers
// ---------------------------------------------------------------------------

function cloneCandidates(grid: CandidateGrid): CandidateGrid {
  return grid.map(s => new Set(s))
}

/** Place a value at cell index, remove from all peers' candidates */
function placeValue(grid: CandidateGrid, board: Board, idx: number, val: CellValue): void {
  board[idx] = val
  grid[idx] = new Set([val])
  for (const peer of PEERS[idx]) {
    grid[peer].delete(val)
  }
}

// ---------------------------------------------------------------------------
// Individual techniques
// ---------------------------------------------------------------------------

/**
 * Naked Single: a cell with only one candidate.
 * Returns [cellIndex, value] or null.
 */
function findNakedSingle(grid: CandidateGrid, board: Board): [number, CellValue] | null {
  for (let i = 0; i < 81; i++) {
    if (board[i] !== 0) continue
    if (grid[i].size === 1) {
      return [i, [...grid[i]][0]]
    }
  }
  return null
}

/**
 * Hidden Single: a value that can only go in one cell within a group.
 * Returns [cellIndex, value] or null.
 */
function findHiddenSingle(grid: CandidateGrid, board: Board): [number, CellValue] | null {
  for (const group of GROUPS) {
    for (let v = 1; v <= 9; v++) {
      const possibleCells = group.filter(i => board[i] === 0 && grid[i].has(v as CellValue))
      if (possibleCells.length === 1) {
        return [possibleCells[0], v as CellValue]
      }
    }
  }
  return null
}

/**
 * Pointing Pair/Triple: if a candidate within a box is confined to one row/col,
 * it can be eliminated from the rest of that row/col outside the box.
 * Returns true if any eliminations were made.
 */
function applyPointingPairs(grid: CandidateGrid, board: Board): boolean {
  let changed = false
  // Boxes 0-8
  for (let boxIdx = 0; boxIdx < 9; boxIdx++) {
    const br = Math.floor(boxIdx / 3) * 3
    const bc = (boxIdx % 3) * 3
    const boxCellList: number[] = []
    for (let r = br; r < br + 3; r++) {
      for (let c = bc; c < bc + 3; c++) {
        boxCellList.push(r * 9 + c)
      }
    }

    for (let v = 1; v <= 9; v++) {
      const vCells = boxCellList.filter(i => board[i] === 0 && grid[i].has(v as CellValue))
      if (vCells.length < 2 || vCells.length > 3) continue

      // Check if all are in the same row
      const rows = new Set(vCells.map(rowOf))
      if (rows.size === 1) {
        const row = [...rows][0]
        for (let c = 0; c < 9; c++) {
          const ci = row * 9 + c
          if (!boxCellList.includes(ci) && board[ci] === 0 && grid[ci].has(v as CellValue)) {
            grid[ci].delete(v as CellValue)
            changed = true
          }
        }
      }

      // Check if all are in the same column
      const cols = new Set(vCells.map(colOf))
      if (cols.size === 1) {
        const col = [...cols][0]
        for (let r = 0; r < 9; r++) {
          const ci = r * 9 + col
          if (!boxCellList.includes(ci) && board[ci] === 0 && grid[ci].has(v as CellValue)) {
            grid[ci].delete(v as CellValue)
            changed = true
          }
        }
      }
    }
  }
  return changed
}

/**
 * Box/Line Reduction: if a candidate in a row/col is confined to one box,
 * eliminate from the rest of that box.
 */
function applyBoxLineReduction(grid: CandidateGrid, board: Board): boolean {
  let changed = false
  // Check rows and cols
  for (let lineIdx = 0; lineIdx < 9; lineIdx++) {
    for (const isRow of [true, false]) {
      const lineCells = Array.from({ length: 9 }, (_, i) =>
        isRow ? lineIdx * 9 + i : i * 9 + lineIdx
      )
      for (let v = 1; v <= 9; v++) {
        const vCells = lineCells.filter(i => board[i] === 0 && grid[i].has(v as CellValue))
        if (vCells.length < 2) continue
        const boxes = new Set(vCells.map(boxOf))
        if (boxes.size === 1) {
          const box = [...boxes][0]
          const br = Math.floor(box / 3) * 3
          const bc = (box % 3) * 3
          for (let r = br; r < br + 3; r++) {
            for (let c = bc; c < bc + 3; c++) {
              const ci = r * 9 + c
              if (!lineCells.includes(ci) && board[ci] === 0 && grid[ci].has(v as CellValue)) {
                grid[ci].delete(v as CellValue)
                changed = true
              }
            }
          }
        }
      }
    }
  }
  return changed
}

/**
 * Naked Pair: two cells in the same group with the same two candidates.
 * Eliminate those two values from all other cells in the group.
 */
function applyNakedPairs(grid: CandidateGrid, board: Board): boolean {
  let changed = false
  for (const group of GROUPS) {
    const empties = group.filter(i => board[i] === 0)
    for (let a = 0; a < empties.length; a++) {
      if (grid[empties[a]].size !== 2) continue
      for (let b = a + 1; b < empties.length; b++) {
        if (grid[empties[b]].size !== 2) continue
        const setA = [...grid[empties[a]]]
        const setB = [...grid[empties[b]]]
        if (setA[0] === setB[0] && setA[1] === setB[1]) {
          // Naked pair found — eliminate from rest of group
          for (const cell of empties) {
            if (cell === empties[a] || cell === empties[b]) continue
            for (const v of setA) {
              if (grid[cell].has(v as CellValue)) {
                grid[cell].delete(v as CellValue)
                changed = true
              }
            }
          }
        }
      }
    }
  }
  return changed
}

/**
 * Naked Triple: three cells in a group whose combined candidates are exactly 3 values.
 */
function applyNakedTriples(grid: CandidateGrid, board: Board): boolean {
  let changed = false
  for (const group of GROUPS) {
    const empties = group.filter(i => board[i] === 0 && grid[i].size <= 3)
    for (let a = 0; a < empties.length; a++) {
      for (let b = a + 1; b < empties.length; b++) {
        for (let c = b + 1; c < empties.length; c++) {
          const combined = new Set([
            ...grid[empties[a]],
            ...grid[empties[b]],
            ...grid[empties[c]],
          ])
          if (combined.size !== 3) continue
          const triple = [empties[a], empties[b], empties[c]]
          for (const cell of group.filter(i => board[i] === 0 && !triple.includes(i))) {
            for (const v of combined) {
              if (grid[cell].has(v as CellValue)) {
                grid[cell].delete(v as CellValue)
                changed = true
              }
            }
          }
        }
      }
    }
  }
  return changed
}

/**
 * X-Wing: if a candidate appears in exactly 2 cells in each of 2 rows,
 * and those cells are in the same 2 columns, eliminate from those columns.
 */
function applyXWing(grid: CandidateGrid, board: Board): boolean {
  let changed = false
  for (let v = 1; v <= 9; v++) {
    // Row-based X-Wing
    const rowPositions: Map<number, number[]> = new Map()
    for (let r = 0; r < 9; r++) {
      const cols = Array.from({ length: 9 }, (_, c) => r * 9 + c).filter(
        i => board[i] === 0 && grid[i].has(v as CellValue)
      ).map(colOf)
      if (cols.length === 2) rowPositions.set(r, cols)
    }
    const rows = [...rowPositions.entries()]
    for (let i = 0; i < rows.length; i++) {
      for (let j = i + 1; j < rows.length; j++) {
        const [r1, cols1] = rows[i]
        const [r2, cols2] = rows[j]
        if (cols1[0] === cols2[0] && cols1[1] === cols2[1]) {
          for (const col of cols1) {
            for (let r = 0; r < 9; r++) {
              if (r === r1 || r === r2) continue
              const ci = r * 9 + col
              if (board[ci] === 0 && grid[ci].has(v as CellValue)) {
                grid[ci].delete(v as CellValue)
                changed = true
              }
            }
          }
        }
      }
    }
  }
  return changed
}

// ---------------------------------------------------------------------------
// Main classifier
// ---------------------------------------------------------------------------

interface ClassifyState {
  board: Board
  grid: CandidateGrid
  techniquesUsed: Technique[]
  score: number
}

function recordTechnique(state: ClassifyState, tech: Technique): void {
  if (!state.techniquesUsed.includes(tech)) {
    state.techniquesUsed.push(tech)
    state.score += TECHNIQUE_SCORES[tech]
  }
}

/**
 * Classifies the difficulty of a Sudoku puzzle by simulating human solving.
 *
 * @param puzzle - The puzzle to classify (0 = empty cells)
 * @returns DifficultyResult with difficulty label, techniques used, and score
 */
export function classifyDifficulty(puzzle: Board): DifficultyResult {
  const state: ClassifyState = {
    board: puzzle.slice() as Board,
    grid: buildCandidates(puzzle),
    techniquesUsed: [],
    score: 0,
  }

  let progress = true
  while (progress) {
    progress = false

    // Naked Single
    const ns = findNakedSingle(state.grid, state.board)
    if (ns) {
      recordTechnique(state, 'naked_single')
      placeValue(state.grid, state.board, ns[0], ns[1])
      progress = true
      continue
    }

    // Hidden Single
    const hs = findHiddenSingle(state.grid, state.board)
    if (hs) {
      recordTechnique(state, 'hidden_single')
      placeValue(state.grid, state.board, hs[0], hs[1])
      progress = true
      continue
    }

    // Pointing Pairs
    if (applyPointingPairs(state.grid, state.board)) {
      recordTechnique(state, 'pointing_pair')
      progress = true
      continue
    }

    // Box/Line Reduction
    if (applyBoxLineReduction(state.grid, state.board)) {
      recordTechnique(state, 'box_line_reduction')
      progress = true
      continue
    }

    // Naked Pairs
    if (applyNakedPairs(state.grid, state.board)) {
      recordTechnique(state, 'naked_pair')
      progress = true
      continue
    }

    // Naked Triples
    if (applyNakedTriples(state.grid, state.board)) {
      recordTechnique(state, 'naked_triple')
      progress = true
      continue
    }

    // X-Wing
    if (applyXWing(state.grid, state.board)) {
      recordTechnique(state, 'x_wing')
      progress = true
      continue
    }

    // If still unsolved, mark as requiring backtracking (Expert)
    if (state.board.some(v => v === 0)) {
      recordTechnique(state, 'backtracking')
    }
  }

  return {
    difficulty: scoreToDifficulty(state.score, state.techniquesUsed),
    techniquesUsed: state.techniquesUsed,
    score: state.score,
  }
}

function scoreToDifficulty(score: number, techniques: Technique[]): Difficulty {
  const hardestTech = techniques.reduce<Technique | null>((acc, t) => {
    if (!acc || TECHNIQUE_SCORES[t] > TECHNIQUE_SCORES[acc]) return t
    return acc
  }, null)

  if (!hardestTech) return 'easy'
  const s = TECHNIQUE_SCORES[hardestTech]
  if (s <= 2) return 'easy'
  if (s <= 4) return 'medium'
  if (s <= 7) return 'hard'
  return 'expert'
}

// ---------------------------------------------------------------------------
// Hint generation
// ---------------------------------------------------------------------------

/**
 * Finds the next logical hint for the player using the simplest available technique.
 *
 * @param puzzle - Current puzzle state (player's board)
 * @returns A Hint with cell index, value, technique, and explanation
 */
export function getHint(puzzle: Board): Hint | null {
  const grid = buildCandidates(puzzle)
  const board = puzzle.slice() as Board

  // Try naked single first
  const ns = findNakedSingle(grid, board)
  if (ns) {
    return {
      cellIndex: ns[0],
      value: ns[1],
      technique: 'Naked Single',
      explanation: `Cell (${rowOf(ns[0]) + 1}, ${colOf(ns[0]) + 1}) can only contain ${ns[1]} — all other values are eliminated by its row, column, and box.`,
    }
  }

  // Try hidden single
  const hs = findHiddenSingle(grid, board)
  if (hs) {
    return {
      cellIndex: hs[0],
      value: hs[1],
      technique: 'Hidden Single',
      explanation: `${hs[1]} can only appear in cell (${rowOf(hs[0]) + 1}, ${colOf(hs[0]) + 1}) within its group.`,
    }
  }

  // Fallback: just reveal a random empty cell (shouldn't usually reach here)
  for (let i = 0; i < 81; i++) {
    if (board[i] === 0 && grid[i].size > 0) {
      const val = [...grid[i]][0]
      return {
        cellIndex: i,
        value: val,
        technique: 'Reveal',
        explanation: `Cell (${rowOf(i) + 1}, ${colOf(i) + 1}) should be ${val}.`,
      }
    }
  }

  return null
}
