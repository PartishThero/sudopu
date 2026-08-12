/**
 * @fileoverview Game controls bar — Undo, Redo, Hint, Pause.
 */

import { useGameStore } from '@/store/gameStore.ts'
import { useSettingsStore } from '@/store/settingsStore.ts'
import { Sounds } from '@/utils/sounds.ts'

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
  } = useGameStore()
  const { soundEnabled } = useSettingsStore()

  const canUndo = historyIndex >= 0
  const canRedo = historyIndex < history.length - 1

  return (
    <div className="controls-bar">
      <button
        className="ctrl-btn"
        onClick={() => { if (soundEnabled) Sounds.select(); undo() }}
        disabled={!canUndo}
        aria-label="Undo last move"
        title="Undo (Ctrl+Z)"
      >
        <span className="ctrl-btn-icon">↩️</span>
        <span className="ctrl-btn-label">Undo</span>
      </button>

      <button
        className="ctrl-btn"
        onClick={() => { if (soundEnabled) Sounds.select(); redo() }}
        disabled={!canRedo}
        aria-label="Redo"
        title="Redo (Ctrl+Y)"
      >
        <span className="ctrl-btn-icon">↪️</span>
        <span className="ctrl-btn-label">Redo</span>
      </button>

      <button
        className={`ctrl-btn${isPencilMode ? ' ctrl-btn--active' : ''}`}
        onClick={togglePencilMode}
        aria-label={isPencilMode ? 'Pencil mode on' : 'Pencil mode off'}
        title="Toggle pencil mode (P)"
      >
        <span className="ctrl-btn-icon">✏️</span>
        <span className="ctrl-btn-label">Notes</span>
      </button>

      <button
        className="ctrl-btn"
        onClick={() => { if (soundEnabled) Sounds.hint(); onHint() }}
        aria-label="Get a hint"
        title="Hint"
      >
        <span className="ctrl-btn-icon">💡</span>
        <span className="ctrl-btn-label">Hint</span>
      </button>

      {phase === 'playing' && (
        <button
          className="ctrl-btn"
          onClick={pause}
          aria-label="Pause game"
          title="Pause"
        >
          <span className="ctrl-btn-icon">⏸</span>
          <span className="ctrl-btn-label">Pause</span>
        </button>
      )}

      {phase === 'paused' && (
        <button
          className="ctrl-btn"
          onClick={() => useGameStore.getState().resume()}
          aria-label="Resume game"
        >
          <span className="ctrl-btn-icon">▶️</span>
          <span className="ctrl-btn-label">Resume</span>
        </button>
      )}
    </div>
  )
}
