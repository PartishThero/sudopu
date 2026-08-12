/**
 * @fileoverview App Header with logo, timer, and action buttons.
 */

import { useGameStore } from '@/store/gameStore.ts'
import { useSettingsStore } from '@/store/settingsStore.ts'
import { formatTime } from '@/hooks/useTimer.ts'
import { Settings, BarChart2 } from 'lucide-react'
import { motion } from 'framer-motion'

interface HeaderProps {
  onOpenSettings: () => void
  onOpenStats: () => void
  onHome: () => void
}

export function Header({ onOpenSettings, onOpenStats, onHome }: HeaderProps) {
  const { phase, elapsedSeconds, timeRemaining, timerMode, isDaily } = useGameStore()
  const { showTimer } = useSettingsStore()

  const isVisiblePhase = phase === 'playing' || phase === 'paused' || phase === 'won' || phase === 'lost'
  const showTimerDisplay = showTimer && isVisiblePhase && timerMode !== 'zen'

  return (
    <motion.header
      className="header"
      role="banner"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <div className="header-inner">
        <motion.button
          className="header-logo"
          onClick={onHome}
          aria-label="Go to home menu"
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
        >
          ◈ Sudopu
          {isDaily && (
            <span
              style={{
                fontSize: '0.6rem',
                fontWeight: 600,
                padding: '2px 6px',
                borderRadius: '999px',
                background: 'var(--accent)',
                color: '#fff',
                marginLeft: 4,
              }}
            >
              DAILY
            </span>
          )}
        </motion.button>

        <div className="header-actions">
          {showTimerDisplay && (
            <span
              style={{
                fontVariantNumeric: 'tabular-nums',
                fontSize: '0.9rem',
                opacity: 0.8,
                marginRight: 12,
                color: (timerMode === 'time-attack' && timeRemaining !== null && timeRemaining <= 60) ? 'var(--btn-danger-bg)' : 'inherit'
              }}
              aria-live="polite"
              aria-label={`Timer: ${timerMode === 'time-attack' && timeRemaining !== null ? formatTime(timeRemaining) : formatTime(elapsedSeconds)}`}
            >
              {timerMode === 'time-attack' && timeRemaining !== null ? formatTime(timeRemaining) : formatTime(elapsedSeconds)}
            </span>
          )}

          <motion.button
            className="icon-btn"
            onClick={onOpenStats}
            aria-label="View statistics"
            title="Statistics"
            whileTap={{ scale: 0.9 }}
          >
            <BarChart2 size={20} />
          </motion.button>

          <motion.button
            className="icon-btn"
            onClick={onOpenSettings}
            aria-label="Open settings"
            title="Settings"
            whileTap={{ scale: 0.9 }}
          >
            <Settings size={20} />
          </motion.button>
        </div>
      </div>
    </motion.header>
  )
}
