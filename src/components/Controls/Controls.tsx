/**
 * @fileoverview Game controls bar — Undo, Redo, Hint, Pause.
 */

import { useGameStore } from '@/store/gameStore.ts'
import { useSettingsStore } from '@/store/settingsStore.ts'
import { Sounds } from '@/utils/sounds.ts'
import { Undo2, Redo2, Pencil, Lightbulb, Pause, Play } from 'lucide-react'
import { motion } from 'framer-motion'

interface ControlsProps {
  onHint: () => void
}

export function Controls({ onHint }: ControlsProps) {
  const {
    undo,
    redo,
    pause,
    history,
    historyIndex,
    phase,
    isPencilMode,
    togglePencilMode,
    hintsEnabled,
  } = useGameStore()
  const { soundEnabled } = useSettingsStore()

  const canUndo = historyIndex >= 0
  const canRedo = historyIndex < history.length - 1

  return (
    <div className="controls-bar">
      <motion.button
        className="ctrl-btn"
        onClick={() => { if (soundEnabled) Sounds.select(); undo() }}
        disabled={!canUndo}
        aria-label="Undo last move"
        title="Undo (Ctrl+Z)"
        {...(canUndo ? { whileTap: { scale: 0.92 } } : {})}
      >
        <span className="ctrl-btn-icon"><Undo2 size={20} /></span>
        <span className="ctrl-btn-label">Undo</span>
      </motion.button>

      <motion.button
        className="ctrl-btn"
        onClick={() => { if (soundEnabled) Sounds.select(); redo() }}
        disabled={!canRedo}
        aria-label="Redo"
        title="Redo (Ctrl+Y)"
        {...(canRedo ? { whileTap: { scale: 0.92 } } : {})}
      >
        <span className="ctrl-btn-icon"><Redo2 size={20} /></span>
        <span className="ctrl-btn-label">Redo</span>
      </motion.button>

      <motion.button
        className={`ctrl-btn${isPencilMode ? ' ctrl-btn--active' : ''}`}
        onClick={togglePencilMode}
        aria-label={isPencilMode ? 'Pencil mode on' : 'Pencil mode off'}
        title="Toggle pencil mode (P)"
        whileTap={{ scale: 0.92 }}
      >
        <span className="ctrl-btn-icon"><Pencil size={20} /></span>
        <span className="ctrl-btn-label">Notes</span>
      </motion.button>

      {hintsEnabled && (
        <motion.button
          className="ctrl-btn"
          onClick={() => { if (soundEnabled) Sounds.hint(); onHint() }}
          aria-label="Get a hint"
          title="Hint"
          whileTap={{ scale: 0.92 }}
        >
          <span className="ctrl-btn-icon"><Lightbulb size={20} /></span>
          <span className="ctrl-btn-label">Hint</span>
        </motion.button>
      )}

      {phase === 'playing' && (
        <motion.button
          className="ctrl-btn"
          onClick={pause}
          aria-label="Pause game"
          title="Pause"
          whileTap={{ scale: 0.92 }}
        >
          <span className="ctrl-btn-icon"><Pause size={20} /></span>
          <span className="ctrl-btn-label">Pause</span>
        </motion.button>
      )}

      {phase === 'paused' && (
        <motion.button
          className="ctrl-btn"
          onClick={() => useGameStore.getState().resume()}
          aria-label="Resume game"
          whileTap={{ scale: 0.92 }}
        >
          <span className="ctrl-btn-icon"><Play size={20} /></span>
          <span className="ctrl-btn-label">Resume</span>
        </motion.button>
      )}
    </div>
  )
}
