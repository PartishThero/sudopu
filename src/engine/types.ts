/**
 * @fileoverview Shared type definitions for the Sudoku engine.
 * This module has zero UI dependencies and can be used in any context.
 */

/** A cell value: 0 means empty, 1-9 are filled values */
export type CellValue = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9

/** A flat 81-element array representing the 9×9 grid, row-major order */
export type Board = CellValue[]

/** A set of candidate (pencil mark) values for a cell */
export type Candidates = Set<CellValue>

/** Per-cell candidate sets, indexed same as Board */
export type CandidateGrid = Candidates[]

/** Difficulty level labels */
export type Difficulty = 'easy' | 'medium' | 'hard' | 'expert'

export type MistakeLimit = 'infinite' | 3 | 1
export type TimerMode = 'classic' | 'zen' | 'time-attack'

export interface HouseRules {
  mistakeLimit: MistakeLimit
  timerMode: TimerMode
  hintsEnabled: boolean
}

/**
 * A solving technique name, used for difficulty classification.
 * Ordered from simplest to most complex.
 */
export type Technique =
  | 'naked_single'
  | 'hidden_single'
  | 'pointing_pair'
  | 'box_line_reduction'
  | 'naked_pair'
  | 'naked_triple'
  | 'x_wing'
  | 'swordfish'
  | 'coloring'
  | 'backtracking'

/** Result of difficulty analysis */
export interface DifficultyResult {
  difficulty: Difficulty
  /** Techniques required to solve, in order applied */
  techniquesUsed: Technique[]
  /** Estimated score — higher = harder */
  score: number
}

/** A generated puzzle with its solution */
export interface PuzzleResult {
  /** The puzzle board (0 = empty cell) */
  puzzle: Board
  /** The complete solution */
  solution: Board
  /** Difficulty analysis */
  difficulty: DifficultyResult
}

/** A hint provided to the player */
export interface Hint {
  /** Cell index (0–80) */
  cellIndex: number
  /** The correct value for that cell */
  value: CellValue
  /** Human-readable technique explanation */
  technique: string
  explanation: string
}
