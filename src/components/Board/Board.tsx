/**
 * @fileoverview Sudoku board grid component.
 * Renders all 81 cells in a 9×9 grid with pause overlay support.
 */

import { Cell } from './Cell.tsx'
import { useGameStore } from '@/store/gameStore.ts'
import { useSettingsStore } from '@/store/settingsStore.ts'
import { motion } from 'framer-motion'

const boardVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.015 }
  }
}

export function Board() {
  const { phase, playerBoard } = useGameStore()
  const { boardZoom } = useSettingsStore()

  if (!playerBoard) return null

  return (
    <div className="board-wrapper" style={{ transform: `scale(${boardZoom})`, transformOrigin: 'top center' }}>
      <motion.div
        className="board-grid"
        role="grid"
        aria-label="Sudoku puzzle grid"
        variants={boardVariants}
        initial="hidden"
        animate="show"
      >
        {Array.from({ length: 81 }, (_, i) => (
          <Cell key={i} index={i} />
        ))}
      </motion.div>

      {phase === 'paused' && (
        <div className="pause-overlay" aria-live="polite">
          <span className="pause-text">Paused</span>
        </div>
      )}
    </div>
  )
}
