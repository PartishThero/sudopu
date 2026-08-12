/**
 * @fileoverview App Header with logo, timer, and action buttons.
 */

import { useGameStore } from '@/store/gameStore.ts'
import { useSettingsStore } from '@/store/settingsStore.ts'
import { formatTime } from '@/hooks/useTimer.ts'

interface HeaderProps {
  onOpenSettings: () => void
  onOpenStats: () => void
  onHome: () => void
}

export function Header({ onOpenSettings, onOpenStats, onHome }: HeaderProps) {
  const { phase, elapsedSeconds, isDaily } = useGameStore()
  const { showTimer } = useSettingsStore()

  const showTimerDisplay = showTimer && (phase === 'playing' || phase === 'paused' || phase === 'won')

  return (
    <header className="header" role="banner">
      <div className="header-inner">
        <button
          className="header-logo"
          onClick={onHome}
          aria-label="Go to home menu"
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
        >
          ◈ Sudoku <span>Master</span>
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
        </button>

        <div className="header-actions">
          {showTimerDisplay && (
            <span
              style={{
                fontVariantNumeric: 'tabular-nums',
                fontSize: '1rem',
                fontWeight: 700,
                color: phase === 'paused' ? 'var(--text-muted)' : 'var(--text-primary)',
                marginRight: 8,
              }}
              aria-live="polite"
              aria-label={`Timer: ${formatTime(elapsedSeconds)}`}
            >
              {formatTime(elapsedSeconds)}
            </span>
          )}

          <button
            className="icon-btn"
            onClick={onOpenStats}
            aria-label="View statistics"
            title="Statistics"
          >
            📊
          </button>

          <button
            className="icon-btn"
            onClick={onOpenSettings}
            aria-label="Open settings"
            title="Settings"
          >
            ⚙️
          </button>
        </div>
      </div>
    </header>
  )
}
