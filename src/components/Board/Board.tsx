/**
 * @fileoverview Sudoku board grid component.
 * Renders all 81 cells in a 9×9 grid with pause overlay support.
 */

import { Cell } from './Cell.tsx'
import { useGameStore } from '@/store/gameStore.ts'
import { useSettingsStore } from '@/store/settingsStore.ts'

export function Board() {
  const { phase, playerBoard } = useGameStore()
  const { boardZoom } = useSettingsStore()

  if (!playerBoard) return null

  return (
    <div className="board-wrapper" style={{ transform: `scale(${boardZoom})`, transformOrigin: 'top center' }}>
      <div
        className="board-grid"
        role="grid"
        aria-label="Sudoku puzzle grid"
      >
        {Array.from({ length: 81 }, (_, i) => (
          <Cell key={i} index={i} />
        ))}
      </div>

      {phase === 'paused' && (
        <div className="pause-overlay" aria-live="polite">
          <span className="pause-text">⏸ Paused — click to resume</span>
        </div>
      )}
    </div>
  )
}
