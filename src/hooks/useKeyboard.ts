/**
 * @fileoverview Keyboard navigation hook for the Sudoku board.
 * Handles arrow keys, number input, Delete/Backspace, Ctrl+Z/Y.
 *
 * @module hooks/useKeyboard
 */

import { useEffect } from 'react'
import { useGameStore } from '@/store/gameStore.ts'
import type { CellValue } from '@/engine/types.ts'

export function useKeyboard() {
  const {
    selectedCell,
    phase,
    puzzle,
    selectCell,
    enterValue,
    eraseCell,
    togglePencilMode,
    undo,
    redo,
  } = useGameStore()

  useEffect(() => {
    if (phase !== 'playing') return

    const handler = (e: KeyboardEvent) => {
      // Don't intercept when typing in inputs
      if ((e.target as HTMLElement).tagName === 'INPUT') return

      // Undo/Redo
      if (e.key === 'z' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        if (e.shiftKey) redo()
        else undo()
        return
      }
      if (e.key === 'y' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        redo()
        return
      }

      // Pencil mode toggle
      if (e.key === 'p' || e.key === 'P') {
        togglePencilMode()
        return
      }

      // Cell navigation with arrow keys
      if (selectedCell !== null) {
        const row = Math.floor(selectedCell / 9)
        const col = selectedCell % 9

        if (e.key === 'ArrowUp' && row > 0) {
          e.preventDefault()
          selectCell(selectedCell - 9)
          return
        }
        if (e.key === 'ArrowDown' && row < 8) {
          e.preventDefault()
          selectCell(selectedCell + 9)
          return
        }
        if (e.key === 'ArrowLeft' && col > 0) {
          e.preventDefault()
          selectCell(selectedCell - 1)
          return
        }
        if (e.key === 'ArrowRight' && col < 8) {
          e.preventDefault()
          selectCell(selectedCell + 1)
          return
        }

        // Tab navigation
        if (e.key === 'Tab') {
          e.preventDefault()
          const next = e.shiftKey
            ? Math.max(0, selectedCell - 1)
            : Math.min(80, selectedCell + 1)
          selectCell(next)
          return
        }

        // Number entry (1-9)
        if (e.key >= '1' && e.key <= '9') {
          if (!puzzle || puzzle[selectedCell] === 0) {
            enterValue(parseInt(e.key) as CellValue)
          }
          return
        }

        // Erase
        if (e.key === 'Delete' || e.key === 'Backspace' || e.key === '0') {
          eraseCell()
          return
        }
      }

      // Click any cell to start navigation
      if (e.key >= '1' && e.key <= '9' && selectedCell === null) {
        selectCell(0)
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [selectedCell, phase, puzzle, selectCell, enterValue, eraseCell, togglePencilMode, undo, redo])
}
