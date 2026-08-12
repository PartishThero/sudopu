/**
 * @fileoverview Main Zustand game store.
 *
 * Manages all in-game state: board, selection, pencil marks,
 * move history (undo/redo), timer, hints, and save slots.
 *
 * @module store/gameStore
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Board, CellValue, Difficulty, PuzzleResult, Hint, HouseRules, MistakeLimit, TimerMode } from '@/engine/types.ts'
import { generatePuzzle, getDailyPuzzle } from '@/engine/index.ts'
import { getConflicts, isSolved } from '@/engine/solver.ts'
import { getHint } from '@/engine/difficulty.ts'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MoveRecord {
  cellIndex: number
  prevValue: CellValue
  nextValue: CellValue
  prevNotes: number[]
  nextNotes: number[]
}

export interface SaveSlot {
  id: string
  puzzle: Board
  solution: Board
  playerBoard: Board
  notes: number[]        // per-cell bitmask (flat array of 81)
  difficulty: Difficulty
  elapsedSeconds: number
  moveCount: number
  mistakeCount: number
  hintCount: number
  savedAt: number
  isDaily: boolean
  dailyDate?: string

  // House Rules
  mistakeLimit: MistakeLimit
  timerMode: TimerMode
  hintsEnabled: boolean
}

export type GamePhase = 'menu' | 'playing' | 'paused' | 'won' | 'lost' | 'daily'

interface GameState {
  // Current game
  phase: GamePhase
  puzzle: Board | null
  solution: Board | null
  playerBoard: Board | null
  difficulty: Difficulty
  isDaily: boolean
  dailyDate: string | null

  // Interaction
  selectedCell: number | null
  isPencilMode: boolean

  // Notes: per-cell bitmask of candidate values (bit i = value i+1)
  notes: number[] // length 81, each is bitmask

  // Undo/Redo
  history: MoveRecord[]
  historyIndex: number

  // Counters
  elapsedSeconds: number
  timeRemaining: number | null // Used for time-attack
  moveCount: number
  mistakeCount: number
  hintCount: number

  // House Rules
  mistakeLimit: MistakeLimit
  timerMode: TimerMode
  hintsEnabled: boolean

  // Conflicts (derived)
  conflicts: Set<number>

  // Last hint
  lastHint: Hint | null

  // Actions
  startNewGame: (difficulty: Difficulty, rules?: HouseRules) => void
  startDailyChallenge: () => void
  loadSaveSlot: (slot: SaveSlot) => void
  selectCell: (index: number | null) => void
  enterValue: (value: CellValue) => void
  eraseCell: () => void
  togglePencilMode: () => void
  toggleNote: (value: CellValue) => void
  undo: () => void
  redo: () => void
  pause: () => void
  resume: () => void
  tick: () => void
  requestHint: () => Hint | null
  getSaveSlot: () => SaveSlot | null
  reset: () => void
}

// ---------------------------------------------------------------------------
// Helper: compute conflicts from board
// ---------------------------------------------------------------------------
function computeConflicts(board: Board): Set<number> {
  return getConflicts(board)
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      phase: 'menu',
      puzzle: null,
      solution: null,
      playerBoard: null,
      difficulty: 'easy',
      isDaily: false,
      dailyDate: null,
      selectedCell: null,
      isPencilMode: false,
      notes: new Array(81).fill(0),
      history: [],
      historyIndex: -1,
      elapsedSeconds: 0,
      timeRemaining: null,
      moveCount: 0,
      mistakeCount: 0,
      hintCount: 0,
      mistakeLimit: 'infinite',
      timerMode: 'classic',
      hintsEnabled: true,
      conflicts: new Set<number>(),
      lastHint: null,

      startNewGame: (difficulty, rules) => {
        const result: PuzzleResult = generatePuzzle(difficulty)
        const playerBoard = result.puzzle.slice() as Board
        
        let timeRemaining = null
        if (rules?.timerMode === 'time-attack') {
          // Defaults: easy: 5m, medium: 10m, hard: 15m, expert: 20m
          timeRemaining = difficulty === 'easy' ? 300 : difficulty === 'medium' ? 600 : difficulty === 'hard' ? 900 : 1200
        }

        set({
          phase: 'playing',
          puzzle: result.puzzle,
          solution: result.solution,
          playerBoard,
          difficulty,
          isDaily: false,
          dailyDate: null,
          selectedCell: null,
          isPencilMode: false,
          notes: new Array(81).fill(0),
          history: [],
          historyIndex: -1,
          elapsedSeconds: 0,
          timeRemaining,
          moveCount: 0,
          mistakeCount: 0,
          hintCount: 0,
          mistakeLimit: rules?.mistakeLimit ?? 'infinite',
          timerMode: rules?.timerMode ?? 'classic',
          hintsEnabled: rules?.hintsEnabled ?? true,
          conflicts: new Set<number>(),
          lastHint: null,
        })
      },

      startDailyChallenge: () => {
        const result = getDailyPuzzle()
        const playerBoard = result.puzzle.slice() as Board
        set({
          phase: 'playing',
          puzzle: result.puzzle,
          solution: result.solution,
          playerBoard,
          difficulty: result.difficulty.difficulty,
          isDaily: true,
          dailyDate: result.dateStr,
          selectedCell: null,
          isPencilMode: false,
          notes: new Array(81).fill(0),
          history: [],
          historyIndex: -1,
          elapsedSeconds: 0,
          timeRemaining: null,
          moveCount: 0,
          mistakeCount: 0,
          hintCount: 0,
          mistakeLimit: 'infinite',
          timerMode: 'classic',
          hintsEnabled: true,
          conflicts: new Set<number>(),
          lastHint: null,
        })
      },

      loadSaveSlot: (slot) => {
        set({
          phase: 'playing',
          puzzle: slot.puzzle,
          solution: slot.solution,
          playerBoard: slot.playerBoard.slice() as Board,
          difficulty: slot.difficulty,
          isDaily: slot.isDaily,
          dailyDate: slot.dailyDate ?? null,
          selectedCell: null,
          isPencilMode: false,
          notes: slot.notes,
          history: [],
          historyIndex: -1,
          elapsedSeconds: slot.elapsedSeconds,
          timeRemaining: null, // Basic save states won't support time remaining for now, or assume infinite
          moveCount: slot.moveCount,
          mistakeCount: slot.mistakeCount,
          hintCount: slot.hintCount,
          mistakeLimit: slot.mistakeLimit ?? 'infinite',
          timerMode: slot.timerMode ?? 'classic',
          hintsEnabled: slot.hintsEnabled ?? true,
          conflicts: computeConflicts(slot.playerBoard as Board),
          lastHint: null,
        })
      },

      selectCell: (index) => {
        set({ selectedCell: index, lastHint: null })
      },

      enterValue: (value) => {
        const { selectedCell, playerBoard, puzzle, solution, notes, history, historyIndex, mistakeCount, isPencilMode } = get()
        if (selectedCell === null || !playerBoard || !puzzle || !solution) return
        if (puzzle[selectedCell] !== 0) return // Can't change given cells

        if (isPencilMode) {
          // Toggle note
          get().toggleNote(value)
          return
        }

        const prevValue = playerBoard[selectedCell] as CellValue
        const prevNotes = [...(notes[selectedCell] ? [notes[selectedCell]] : [])]

        if (prevValue === value) return // No change

        const newBoard = playerBoard.slice() as Board
        newBoard[selectedCell] = value

        // Check if this is a mistake
        const isWrong = value !== 0 && value !== solution[selectedCell]
        let newMistakeCount = mistakeCount
        let newPhase = get().phase

        if (isWrong) {
          newMistakeCount += 1
          if (get().mistakeLimit !== 'infinite' && newMistakeCount >= (get().mistakeLimit as number)) {
            newPhase = 'lost'
          }
        }

        // Clear notes for this cell if placing a definitive value
        const newNotes = [...notes]
        newNotes[selectedCell] = 0

        const newConflicts = computeConflicts(newBoard)

        // Trim redo history and push new move
        const truncatedHistory = history.slice(0, historyIndex + 1)
        const move: MoveRecord = {
          cellIndex: selectedCell,
          prevValue,
          nextValue: value,
          prevNotes: prevNotes,
          nextNotes: [],
        }

        if (value !== 0 && isSolved(newBoard)) {
          newPhase = 'won'
        }

        set({
          playerBoard: newBoard,
          notes: newNotes,
          history: truncatedHistory.concat(move),
          historyIndex: historyIndex + 1,
          moveCount: get().moveCount + 1,
          mistakeCount: newMistakeCount,
          conflicts: newConflicts,
          phase: newPhase,
          lastHint: null,
        })
      },

      eraseCell: () => {
        const { selectedCell, playerBoard, puzzle, notes, history, historyIndex } = get()
        if (selectedCell === null || !playerBoard || !puzzle) return
        if (puzzle[selectedCell] !== 0) return // Can't erase given cells

        const prevValue = playerBoard[selectedCell] as CellValue
        const prevNotes = notes[selectedCell]

        const newBoard = playerBoard.slice() as Board
        newBoard[selectedCell] = 0

        const newNotes = [...notes]
        newNotes[selectedCell] = 0

        const move: MoveRecord = {
          cellIndex: selectedCell,
          prevValue,
          nextValue: 0,
          prevNotes: [prevNotes],
          nextNotes: [],
        }

        const truncatedHistory = history.slice(0, historyIndex + 1)

        set({
          playerBoard: newBoard,
          notes: newNotes,
          history: [...truncatedHistory, move],
          historyIndex: historyIndex + 1,
          conflicts: computeConflicts(newBoard),
          lastHint: null,
        })
      },

      togglePencilMode: () => {
        set(state => ({ isPencilMode: !state.isPencilMode }))
      },

      toggleNote: (value) => {
        const { selectedCell, notes, playerBoard, puzzle } = get()
        if (selectedCell === null || !playerBoard || !puzzle) return
        if (puzzle[selectedCell] !== 0) return
        if (playerBoard[selectedCell] !== 0) return // Has a value, can't note

        const newNotes = [...notes]
        const bit = 1 << (value - 1)
        newNotes[selectedCell] ^= bit

        set({ notes: newNotes })
      },

      undo: () => {
        const { history, historyIndex, playerBoard, notes } = get()
        if (historyIndex < 0 || !playerBoard) return

        const move = history[historyIndex]
        const newBoard = playerBoard.slice() as Board
        newBoard[move.cellIndex] = move.prevValue

        const newNotes = [...notes]
        newNotes[move.cellIndex] = move.prevNotes[0] ?? 0

        set({
          playerBoard: newBoard,
          notes: newNotes,
          historyIndex: historyIndex - 1,
          conflicts: computeConflicts(newBoard),
        })
      },

      redo: () => {
        const { history, historyIndex, playerBoard, notes } = get()
        if (historyIndex >= history.length - 1 || !playerBoard) return

        const move = history[historyIndex + 1]
        const newBoard = playerBoard.slice() as Board
        newBoard[move.cellIndex] = move.nextValue

        const newNotes = [...notes]
        newNotes[move.cellIndex] = move.nextNotes[0] ?? 0

        set({
          playerBoard: newBoard,
          notes: newNotes,
          historyIndex: historyIndex + 1,
          conflicts: computeConflicts(newBoard),
        })
      },

      pause: () => {
        set({ phase: 'paused' })
      },

      resume: () => {
        set({ phase: 'playing' })
      },

      tick: () => {
        set(state => {
          if (state.phase !== 'playing') return state

          if (state.timerMode === 'time-attack' && state.timeRemaining !== null) {
            const nextTime = state.timeRemaining - 1
            if (nextTime <= 0) {
              return { timeRemaining: 0, phase: 'lost' }
            }
            return { timeRemaining: nextTime }
          } else {
            return { elapsedSeconds: state.elapsedSeconds + 1 }
          }
        })
      },

      requestHint: () => {
        const { playerBoard } = get()
        if (!playerBoard) return null
        const hint = getHint(playerBoard)
        if (hint) {
          set(state => ({ hintCount: state.hintCount + 1, lastHint: hint }))
        }
        return hint
      },

      getSaveSlot: () => {
        const { puzzle, solution, playerBoard, notes, difficulty, elapsedSeconds, moveCount, mistakeCount, hintCount, isDaily, dailyDate, mistakeLimit, timerMode, hintsEnabled } = get()
        if (!puzzle || !solution || !playerBoard) return null
        const slot: SaveSlot = {
          id: crypto.randomUUID(),
          puzzle,
          solution,
          playerBoard,
          notes,
          difficulty,
          elapsedSeconds,
          moveCount,
          mistakeCount,
          hintCount,
          savedAt: Date.now(),
          isDaily,
          mistakeLimit,
          timerMode,
          hintsEnabled,
        }
        if (dailyDate !== null) slot.dailyDate = dailyDate
        return slot
      },

      reset: () => {
        set({ phase: 'menu', puzzle: null, solution: null, playerBoard: null })
      },
    }),
    {
      name: 'sudoku-game',
      partialize: state => ({
        // Only persist the game state needed to resume
        phase: state.phase === 'won' ? 'menu' : state.phase,
        puzzle: state.puzzle,
        solution: state.solution,
        playerBoard: state.playerBoard,
        difficulty: state.difficulty,
        isDaily: state.isDaily,
        dailyDate: state.dailyDate,
        historyIndex: state.historyIndex,
        elapsedSeconds: state.elapsedSeconds,
        timeRemaining: state.timeRemaining,
        moveCount: state.moveCount,
        mistakeCount: state.mistakeCount,
        hintCount: state.hintCount,
        mistakeLimit: state.mistakeLimit,
        timerMode: state.timerMode,
        hintsEnabled: state.hintsEnabled,
        notes: state.notes,
        history: state.history,
      }),
    }
  )
)
