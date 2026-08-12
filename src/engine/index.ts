/**
 * @fileoverview Public API barrel for the Sudoku engine.
 * Import everything you need from '@/engine' rather than individual files.
 *
 * @module engine
 */

export type {
  Board,
  CellValue,
  Candidates,
  CandidateGrid,
  Difficulty,
  DifficultyResult,
  Hint,
  PuzzleResult,
  Technique,
} from './types.ts'

export {
  // Solver utilities
  solve,
  countSolutions,
  isValidBoard,
  getConflicts,
  isSolved,
  buildCandidates,
  PEERS,
  GROUPS,
  rowOf,
  colOf,
  boxOf,
  rowCells,
  colCells,
  boxCells,
} from './solver.ts'

export {
  // Generator
  generatePuzzle,
  generateSeededPuzzle,
  hasUniqueSolution,
  solvePuzzle,
} from './generator.ts'

export {
  // Difficulty
  classifyDifficulty,
  getHint,
} from './difficulty.ts'

export {
  // Daily challenge
  getDailyPuzzle,
  getTodayDateString,
  getDailyDifficulty,
  dateSeed,
} from './daily.ts'
