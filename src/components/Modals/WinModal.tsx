/**
 * @fileoverview Win screen modal with stats, score, and next game options.
 */

import { useEffect } from 'react'
import { useGameStore } from '@/store/gameStore.ts'
import { useStatsStore } from '@/store/statsStore.ts'
import { useSettingsStore } from '@/store/settingsStore.ts'
import { Sounds } from '@/utils/sounds.ts'
import { formatTime } from '@/hooks/useTimer.ts'
import type { Achievement } from '@/store/statsStore.ts'

interface WinModalProps {
  newAchievements: Achievement[]
  onNewGame: () => void
  onMenu: () => void
}

function starRating(time: number, mistakes: number, hints: number): number {
  if (mistakes === 0 && hints === 0 && time < 120) return 3
  if (mistakes <= 2 && hints === 0) return 2
  return 1
}

export function WinModal({ newAchievements, onNewGame, onMenu }: WinModalProps) {
  const { elapsedSeconds, mistakeCount, hintCount, difficulty } = useGameStore()
  const { soundEnabled } = useSettingsStore()

  useEffect(() => {
    if (soundEnabled) Sounds.win()
    spawnConfetti()
  }, [soundEnabled])

  const stars = starRating(elapsedSeconds, mistakeCount, hintCount)

  return (
    <div className="modal-overlay">
      <div className="modal-card win-screen">
        <div className="win-emoji">🎉</div>
        <h2 className="win-title">Puzzle Solved!</h2>

        <div style={{ display: 'flex', gap: 4, justifyContent: 'center', fontSize: '1.8rem' }}>
          {Array.from({ length: 3 }, (_, i) => (
            <span key={i} style={{ opacity: i < stars ? 1 : 0.25 }}>⭐</span>
          ))}
        </div>

        <div className="win-stats-grid">
          <div className="win-stat">
            <span className="win-stat-value">{formatTime(elapsedSeconds)}</span>
            <span className="win-stat-label">Time</span>
          </div>
          <div className="win-stat">
            <span className="win-stat-value">{mistakeCount}</span>
            <span className="win-stat-label">Mistakes</span>
          </div>
          <div className="win-stat">
            <span className="win-stat-value">{hintCount}</span>
            <span className="win-stat-label">Hints Used</span>
          </div>
        </div>

        {newAchievements.length > 0 && (
          <div
            style={{
              background: 'var(--cell-bg-hint)',
              border: '1px solid var(--cell-text-hint)',
              borderRadius: 10,
              padding: '12px 16px',
              width: '100%',
            }}
          >
            <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--cell-text-hint)', marginBottom: 8 }}>
              🏅 New Achievements
            </div>
            {newAchievements.map(a => (
              <div key={a.id} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                <span>{a.icon}</span>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>{a.title}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{a.description}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="win-actions">
          <button
            className="btn btn--secondary btn--full"
            onClick={onMenu}
          >
            🏠 Menu
          </button>
          <button
            className="btn btn--primary btn--full"
            onClick={onNewGame}
          >
            ▶ Next {difficulty}
          </button>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Confetti
// ---------------------------------------------------------------------------

function spawnConfetti() {
  const colors = ['#58a6ff', '#56d364', '#e3b341', '#d2a8ff', '#ff7b72']
  const count = 60

  for (let i = 0; i < count; i++) {
    setTimeout(() => {
      const el = document.createElement('div')
      el.className = 'confetti-particle'
      el.style.cssText = `
        left: ${Math.random() * 100}vw;
        top: -20px;
        background: ${colors[Math.floor(Math.random() * colors.length)]};
        width: ${6 + Math.random() * 8}px;
        height: ${6 + Math.random() * 8}px;
        border-radius: ${Math.random() > 0.5 ? '50%' : '2px'};
        animation: confetti-fall ${1.5 + Math.random() * 2}s ease forwards;
        animation-delay: ${Math.random() * 0.5}s;
      `
      document.body.appendChild(el)
      setTimeout(() => el.remove(), 4000)
    }, i * 30)
  }
}
