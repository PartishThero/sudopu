/**
 * @fileoverview Sudoku puzzle generator.
 *
 * Strategy:
 * 1. Fill a solved board using randomized backtracking
 * 2. Remove cells one at a time (random order) while:
 *    a. The puzzle remains uniquely solvable (countSolutions === 1)
 *    b. The target clue count has not been reached
 * 3. Run the difficulty classifier to label the puzzle
 *
 * @module engine/generator
 */

import type { Board, CellValue, Difficulty, PuzzleResult } from './types.ts'
import { countSolutions, solve } from './solver.ts'
import { classifyDifficulty } from './difficulty.ts'
import { SeededRandom } from '../utils/seeding.ts'

// ---------------------------------------------------------------------------
// Clue count ranges per difficulty (starting point before technique check)
// ---------------------------------------------------------------------------

const CLUE_RANGES: Record<Difficulty, [number, number]> = {
  easy: [36, 45],
  medium: [28, 35],
  hard: [22, 27],
  expert: [17, 21],
}

// ---------------------------------------------------------------------------
// Seeded / random utilities
// ---------------------------------------------------------------------------

/** Shuffles an array in-place using Fisher-Yates with the given RNG */
function shuffle<T>(arr: T[], rng: SeededRandom): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng.next() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

// ---------------------------------------------------------------------------
// Full board generation
// ---------------------------------------------------------------------------

/**
 * Generates a valid, fully-solved 9×9 Sudoku board using randomized backtracking.
 *
 * @param rng - Seeded random number generator for reproducibility
 * @returns A completely filled, valid board
 */
function generateSolvedBoard(rng: SeededRandom): Board {
  const board: Board = new Array(81).fill(0) as Board

  function fill(pos: number): boolean {
    if (pos === 81) return true

    // Randomize the order we try digits
    const digits = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9] as CellValue[], rng)

    for (const digit of digits) {
      if (isPlaceable(board, pos, digit)) {
        board[pos] = digit
        if (fill(pos + 1)) return true
        board[pos] = 0
      }
    }
    return false
  }

  fill(0)
  return board
}

/** Quick placement check without full peer set */
function isPlaceable(board: Board, pos: number, val: CellValue): boolean {
  const row = Math.floor(pos / 9)
  const col = pos % 9
  const boxRow = Math.floor(row / 3) * 3
  const boxCol = Math.floor(col / 3) * 3

  for (let i = 0; i < 9; i++) {
    if (board[row * 9 + i] === val) return false
    if (board[i * 9 + col] === val) return false
    if (board[(boxRow + Math.floor(i / 3)) * 9 + (boxCol + (i % 3))] === val) return false
  }
  return true
}

// ---------------------------------------------------------------------------
// Puzzle generation (cell removal)
// ---------------------------------------------------------------------------

/**
 * Removes cells from a solved board to create a puzzle with a unique solution.
 *
 * @param solution - A fully solved board
 * @param targetClues - Target number of clues to leave
 * @param rng - Seeded random number generator
 * @returns The puzzle board (0 = removed cells)
 */
function createPuzzle(solution: Board, targetClues: number, rng: SeededRandom): Board {
  const puzzle = solution.slice() as Board
  const indices = shuffle(
    Array.from({ length: 81 }, (_, i) => i),
    rng
  )

  let cluesLeft = 81

  for (const idx of indices) {
    if (cluesLeft <= targetClues) break

    const backup = puzzle[idx]
    puzzle[idx] = 0

    // Verify uniqueness after removal
    if (countSolutions(puzzle, 2) !== 1) {
      // Removing this cell breaks uniqueness — restore it
      puzzle[idx] = backup
    } else {
      cluesLeft--
    }
  }

  return puzzle
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Generates a complete Sudoku puzzle at the specified difficulty.
 *
 * The generator may overshoot or undershoot the difficulty target (technique-
 * based classification doesn't map perfectly to clue counts). If the first
 * generated puzzle doesn't match the requested difficulty, we retry up to
 * `maxRetries` times.
 *
 * @param difficulty - Target difficulty level
 * @param seed - Optional seed for reproducible generation (e.g. daily puzzles)
 * @returns A PuzzleResult containing the puzzle, solution, and difficulty info
 */
export function generatePuzzle(difficulty: Difficulty, seed?: number): PuzzleResult {
  const rng = new SeededRandom(seed ?? Math.floor(Math.random() * 2 ** 32))

  const [minClues, maxClues] = CLUE_RANGES[difficulty]
  const MAX_RETRIES = 20

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    // 1. Generate a fully solved board
    const solution = generateSolvedBoard(rng)

    // 2. Pick a random clue count in the target range
    const targetClues = minClues + Math.floor(rng.next() * (maxClues - minClues + 1))

    // 3. Create the puzzle by removing cells
    const puzzle = createPuzzle(solution, targetClues, rng)

    // 4. Classify difficulty
    const difficultyResult = classifyDifficulty(puzzle)

    // 5. Accept if it matches target (or if we're on the last retry, accept anything)
    if (difficultyResult.difficulty === difficulty || attempt === MAX_RETRIES - 1) {
      return { puzzle, solution, difficulty: difficultyResult }
    }
  }

  // Fallback (should never reach here in practice)
  const solution = generateSolvedBoard(rng)
  const targetClues = minClues + Math.floor(rng.next() * (maxClues - minClues + 1))
  const puzzle = createPuzzle(solution, targetClues, rng)
  return { puzzle, solution, difficulty: classifyDifficulty(puzzle) }
}

/**
 * Generates a puzzle from a specific seed.
 * Two calls with the same seed and difficulty will produce the same puzzle.
 *
 * @param seed - Integer seed value
 * @param difficulty - Target difficulty
 * @returns PuzzleResult
 */
export function generateSeededPuzzle(seed: number, difficulty: Difficulty = 'medium'): PuzzleResult {
  return generatePuzzle(difficulty, seed)
}

/**
 * Validates that a puzzle board has exactly one solution.
 *
 * @param puzzle - The puzzle to validate
 * @returns true if exactly one solution exists
 */
export function hasUniqueSolution(puzzle: Board): boolean {
  return countSolutions(puzzle, 2) === 1
}

/**
 * Returns the solution for a given puzzle, or null if unsolvable.
 *
 * @param puzzle - The puzzle to solve
 * @returns Solved board or null
 */
export function solvePuzzle(puzzle: Board): Board | null {
  return solve(puzzle)
}
