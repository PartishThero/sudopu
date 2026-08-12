/**
 * @fileoverview Mobile number pad component.
 * Shows digits 1-9 plus erase and pencil mode toggle.
 */

import { useGameStore } from '@/store/gameStore.ts'
import { useSettingsStore } from '@/store/settingsStore.ts'
import { Sounds } from '@/utils/sounds.ts'
import type { CellValue } from '@/engine/types.ts'
import { Delete, Pencil } from 'lucide-react'
import { motion } from 'framer-motion'

const DIGITS = [1, 2, 3, 4, 5, 6, 7, 8, 9] as CellValue[]

export function NumberPad() {
  const {
    enterValue,
    eraseCell,
    togglePencilMode,
    isPencilMode,
    playerBoard,
    solution,
  } = useGameStore()
  const { soundEnabled } = useSettingsStore()

  // Count how many of each digit are placed correctly
  const digitCounts = new Map<number, number>()
  if (playerBoard && solution) {
    for (let i = 0; i < 81; i++) {
      const v = playerBoard[i]
      if (v !== 0 && v === solution[i]) {
        digitCounts.set(v, (digitCounts.get(v) ?? 0) + 1)
      }
    }
  }

  const handleDigit = (v: CellValue) => {
    if (soundEnabled) Sounds.enter()
    enterValue(v)
  }

  const handleErase = () => {
    if (soundEnabled) Sounds.erase()
    eraseCell()
  }

  return (
    <div className="num-pad" role="group" aria-label="Number input pad">
      {DIGITS.map(v => {
        const count = digitCounts.get(v) ?? 0
        const isComplete = count === 9
        return (
          <motion.button
            key={v}
            className={`num-pad-btn${isComplete ? ' num-pad-btn--complete' : ''}`}
            onClick={() => handleDigit(v)}
            aria-label={`Enter ${v}`}
            disabled={isComplete}
            title={isComplete ? `${v} is complete` : undefined}
            {...(!isComplete ? { whileTap: { scale: 0.92 } } : {})}
          >
            {v}
          </motion.button>
        )
      })}

      {/* Erase */}
      <motion.button
        className="num-pad-btn"
        onClick={handleErase}
        aria-label="Erase cell"
        title="Erase (Delete)"
        whileTap={{ scale: 0.92 }}
      >
        <Delete size={20} />
      </motion.button>

      {/* Pencil mode */}
      <motion.button
        className={`num-pad-btn${isPencilMode ? ' ctrl-btn--active' : ''}`}
        onClick={togglePencilMode}
        aria-label={isPencilMode ? 'Pencil mode on — click to turn off' : 'Enable pencil mode'}
        title="Pencil mode (P)"
        whileTap={{ scale: 0.92 }}
      >
        <Pencil size={20} />
      </motion.button>
    </div>
  )
}
