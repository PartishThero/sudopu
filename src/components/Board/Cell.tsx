/**
 * @fileoverview Single cell component for the Sudoku board.
 */

import { memo, useCallback } from 'react'
import { useGameStore } from '@/store/gameStore.ts'
import { useSettingsStore } from '@/store/settingsStore.ts'
import { rowOf, colOf, boxOf } from '@/engine/solver.ts'
import { motion } from 'framer-motion'
import type { Variants } from 'framer-motion'

const cellVariants: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  show: { opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 300, damping: 25 } }
}

interface CellProps {
  index: number
}

const NOTE_VALUES = [1, 2, 3, 4, 5, 6, 7, 8, 9]

export const Cell = memo(({ index }: CellProps) => {
  const {
    puzzle,
    playerBoard,
    selectedCell,
    notes,
    conflicts,
    lastHint,
    phase,
    selectCell,
  } = useGameStore()

  const { showConflicts, showPeerHighlight, showSameNumberHighlight } = useSettingsStore()

  const handleClick = useCallback(() => {
    if (phase !== 'playing') return
    selectCell(index === selectedCell ? null : index)
  }, [index, selectedCell, phase, selectCell])

  if (!puzzle || !playerBoard) return null

  const isGiven = puzzle[index] !== 0
  const value = playerBoard[index]
  const selectedValue = selectedCell !== null ? playerBoard[selectedCell] : 0
  const noteMask = notes[index]

  // Cell state flags
  const isSelected = selectedCell === index
  const isHint = lastHint?.cellIndex === index

  const isConflict = showConflicts && conflicts.has(index)

  const isPeer =
    !isSelected &&
    showPeerHighlight &&
    selectedCell !== null &&
    (rowOf(index) === rowOf(selectedCell) ||
      colOf(index) === colOf(selectedCell) ||
      boxOf(index) === boxOf(selectedCell))

  const isSame =
    !isSelected &&
    showSameNumberHighlight &&
    value !== 0 &&
    selectedValue !== 0 &&
    value === selectedValue

  const row = rowOf(index)
  const col = colOf(index)

  // Build class string
  const classes = [
    'cell',
    isGiven ? 'cell--given' : '',
    isSelected ? 'cell--selected' : '',
    isPeer && !isSelected ? 'cell--peer' : '',
    isSame ? 'cell--same' : '',
    isConflict ? 'cell--conflict' : '',
    isHint ? 'cell--hint' : '',
    !isGiven && value !== 0 ? 'cell--player-value' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <motion.div
      className={classes}
      data-row={row}
      data-col={col}
      onClick={handleClick}
      variants={cellVariants}
      role="gridcell"
      aria-label={`Row ${row + 1}, Column ${col + 1}${value ? `, value ${value}` : ', empty'}${isGiven ? ', given' : ''}`}
      aria-selected={isSelected}
      tabIndex={isSelected ? 0 : -1}
    >
      {value !== 0 ? (
        <span className="cell-value">{value}</span>
      ) : noteMask !== 0 ? (
        <div className="cell-notes">
          {NOTE_VALUES.map(n => (
            <span key={n} className="cell-note">
              {noteMask & (1 << (n - 1)) ? n : ''}
            </span>
          ))}
        </div>
      ) : null}
    </motion.div>
  )
})

Cell.displayName = 'Cell'
