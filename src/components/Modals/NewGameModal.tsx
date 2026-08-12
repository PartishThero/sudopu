import { useState } from 'react'
import { motion } from 'framer-motion'
import { X, Play, Clock, ShieldAlert, Lightbulb } from 'lucide-react'
import type { Difficulty, HouseRules, MistakeLimit, TimerMode } from '@/engine/types.ts'

interface NewGameModalProps {
  difficulty: Difficulty
  onStart: (rules: HouseRules) => void
  onClose: () => void
}

export function NewGameModal({ difficulty, onStart, onClose }: NewGameModalProps) {
  const [mistakeLimit, setMistakeLimit] = useState<MistakeLimit>('infinite')
  const [timerMode, setTimerMode] = useState<TimerMode>('classic')
  const [hintsEnabled, setHintsEnabled] = useState<boolean>(true)

  const handleStart = () => {
    onStart({ mistakeLimit, timerMode, hintsEnabled })
  }

  return (
    <motion.div
      className="modal-overlay"
      onClick={e => e.target === e.currentTarget && onClose()}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <motion.div
        className="modal-card"
        role="dialog"
        aria-modal="true"
        aria-label="House Rules"
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h2 className="modal-title" style={{ margin: 0 }}>House Rules</h2>
            <div style={{ opacity: 0.6, fontSize: '0.9rem', marginTop: 4, textTransform: 'capitalize' }}>
              {difficulty} Difficulty
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, marginBottom: 32 }}>
          {/* Mistake Limit */}
          <div className="settings-section">
            <div className="settings-section-header">
              <ShieldAlert size={18} />
              <h3>Mistake Limit</h3>
            </div>
            <div className="settings-options" style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              {(['infinite', 3, 1] as const).map(limit => (
                <button
                  key={limit}
                  className={`btn ${mistakeLimit === limit ? 'btn--primary' : 'btn--secondary'}`}
                  style={{ flex: 1, padding: '8px 12px', fontSize: '0.9rem' }}
                  onClick={() => setMistakeLimit(limit)}
                >
                  {limit === 'infinite' ? 'Forgiving' : limit === 3 ? '3 Mistakes' : 'Sudden Death'}
                </button>
              ))}
            </div>
          </div>

          {/* Timer Mode */}
          <div className="settings-section">
            <div className="settings-section-header">
              <Clock size={18} />
              <h3>Timer Mode</h3>
            </div>
            <div className="settings-options" style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              {(['zen', 'classic', 'time-attack'] as const).map(mode => (
                <button
                  key={mode}
                  className={`btn ${timerMode === mode ? 'btn--primary' : 'btn--secondary'}`}
                  style={{ flex: 1, padding: '8px 12px', fontSize: '0.9rem' }}
                  onClick={() => setTimerMode(mode)}
                >
                  {mode === 'zen' ? 'Zen' : mode === 'classic' ? 'Classic' : 'Time Attack'}
                </button>
              ))}
            </div>
            {timerMode === 'time-attack' && (
              <div style={{ fontSize: '0.8rem', opacity: 0.6, marginTop: 8, textAlign: 'center' }}>
                {difficulty === 'easy' ? '5 minutes' : difficulty === 'medium' ? '10 minutes' : difficulty === 'hard' ? '15 minutes' : '20 minutes'} countdown
              </div>
            )}
          </div>

          {/* Hints */}
          <div className="settings-section">
            <div className="settings-section-header">
              <Lightbulb size={18} />
              <h3>Hints</h3>
            </div>
            <div className="settings-options" style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button
                className={`btn ${hintsEnabled ? 'btn--primary' : 'btn--secondary'}`}
                style={{ flex: 1, padding: '8px 12px', fontSize: '0.9rem' }}
                onClick={() => setHintsEnabled(true)}
              >
                Enabled
              </button>
              <button
                className={`btn ${!hintsEnabled ? 'btn--primary' : 'btn--secondary'}`}
                style={{ flex: 1, padding: '8px 12px', fontSize: '0.9rem' }}
                onClick={() => setHintsEnabled(false)}
              >
                Disabled
              </button>
            </div>
          </div>
        </div>

        <motion.button
          className="btn btn--primary btn--full"
          onClick={handleStart}
          whileTap={{ scale: 0.98 }}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '14px' }}
        >
          <Play size={18} />
          <span>Start Game</span>
        </motion.button>
      </motion.div>
    </motion.div>
  )
}
