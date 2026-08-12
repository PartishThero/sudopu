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
import type { Board, CellValue, Difficulty, PuzzleResult, Hint } from '@/engine/types.ts'
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
  notes: number[][]
  difficulty: Difficulty
  elapsedSeconds: number
  moveCount: number
  mistakeCount: number
  hintCount: number
  savedAt: number
  isDaily: boolean
  dailyDate?: string
}

export type GamePhase = 'menu' | 'playing' | 'paused' | 'won' | 'daily'

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
  moveCount: number
  mistakeCount: number
  hintCount: number

  // Conflicts (derived)
  conflicts: Set<number>

  // Last hint
  lastHint: Hint | null

  // Actions
  startNewGame: (difficulty: Difficulty) => void
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
      moveCount: 0,
      mistakeCount: 0,
      hintCount: 0,
      conflicts: new Set<number>(),
      lastHint: null,

      startNewGame: (difficulty) => {
        const result: PuzzleResult = generatePuzzle(difficulty)
        const playerBoard = result.puzzle.slice() as Board
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
          moveCount: 0,
          mistakeCount: 0,
          hintCount: 0,
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
          moveCount: 0,
          mistakeCount: 0,
          hintCount: 0,
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
          moveCount: slot.moveCount,
          mistakeCount: slot.mistakeCount,
          hintCount: slot.hintCount,
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
        const newMistakeCount = isWrong ? mistakeCount + 1 : mistakeCount

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

        const isWon = value !== 0 && isSolved(newBoard)

        set({
          playerBoard: newBoard,
          notes: newNotes,
          history: [...truncatedHistory, move],
          historyIndex: historyIndex + 1,
          moveCount: get().moveCount + 1,
          mistakeCount: newMistakeCount,
          conflicts: newConflicts,
          phase: isWon ? 'won' : 'playing',
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
        set(state => ({
          elapsedSeconds: state.phase === 'playing' ? state.elapsedSeconds + 1 : state.elapsedSeconds,
        }))
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
        const { puzzle, solution, playerBoard, notes, difficulty, elapsedSeconds, moveCount, mistakeCount, hintCount, isDaily, dailyDate } = get()
        if (!puzzle || !solution || !playerBoard) return null
        return {
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
          dailyDate: dailyDate ?? undefined,
        }
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
        notes: state.notes,
        elapsedSeconds: state.elapsedSeconds,
        moveCount: state.moveCount,
        mistakeCount: state.mistakeCount,
        hintCount: state.hintCount,
      }),
    }
  )
)
