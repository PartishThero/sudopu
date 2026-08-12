/**
 * @fileoverview Statistics dashboard modal.
 */

import { useStatsStore } from '@/store/statsStore.ts'
import { formatTime } from '@/hooks/useTimer.ts'
import type { Difficulty } from '@/engine/types.ts'

interface StatsModalProps {
  onClose: () => void
}

const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard', 'expert']

function WinRate({ won, played }: { won: number; played: number }) {
  const rate = played === 0 ? 0 : Math.round((won / played) * 100)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
        <span>Win Rate</span>
        <span>{rate}%</span>
      </div>
      <div style={{ background: 'var(--border-primary)', borderRadius: 999, height: 6, overflow: 'hidden' }}>
        <div style={{ width: `${rate}%`, background: 'var(--accent)', height: '100%', borderRadius: 999, transition: 'width 0.5s ease' }} />
      </div>
    </div>
  )
}

export function StatsModal({ onClose }: StatsModalProps) {
  const { byDifficulty, currentStreak, longestStreak, achievements } = useStatsStore()

  const totalPlayed = DIFFICULTIES.reduce((s, d) => s + byDifficulty[d].played, 0)
  const totalWon = DIFFICULTIES.reduce((s, d) => s + byDifficulty[d].won, 0)
  const unlockedCount = achievements.filter(a => a.unlockedAt !== null).length

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-card" role="dialog" aria-modal="true" aria-label="Statistics">
        <div style={{ position: 'relative' }}>
          <h2 className="modal-title">Statistics</h2>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close">✕</button>
        </div>

        {/* Overview */}
        <div className="stats-grid" style={{ marginBottom: 20 }}>
          <div className="stat-card">
            <span className="stat-card-value">{totalPlayed}</span>
            <span className="stat-card-label">Played</span>
          </div>
          <div className="stat-card">
            <span className="stat-card-value">{totalWon}</span>
            <span className="stat-card-label">Won</span>
          </div>
          <div className="stat-card">
            <span className="stat-card-value">{currentStreak}</span>
            <span className="stat-card-label">Current Streak</span>
          </div>
          <div className="stat-card">
            <span className="stat-card-value">{longestStreak}</span>
            <span className="stat-card-label">Best Streak</span>
          </div>
        </div>

        {/* Win rate bar */}
        <div style={{ marginBottom: 20 }}>
          <WinRate won={totalWon} played={totalPlayed} />
        </div>

        {/* Per-difficulty table */}
        <div style={{ marginBottom: 20 }}>
          <div className="settings-section-title">By Difficulty</div>
          <table className="diff-stats-table">
            <thead>
              <tr>
                <th>Level</th>
                <th>Played</th>
                <th>Won</th>
                <th>Best Time</th>
              </tr>
            </thead>
            <tbody>
              {DIFFICULTIES.map(d => {
                const s = byDifficulty[d]
                return (
                  <tr key={d}>
                    <td style={{ textTransform: 'capitalize', fontWeight: 600 }}>{d}</td>
                    <td>{s.played}</td>
                    <td>{s.won}</td>
                    <td>{s.bestTime !== null ? formatTime(s.bestTime) : '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Achievements */}
        <div>
          <div className="settings-section-title">Achievements ({unlockedCount}/{achievements.length})</div>
          <div className="achievements-grid">
            {achievements.map(a => (
              <div
                key={a.id}
                className={`achievement-card${a.unlockedAt !== null ? ' achievement-card--unlocked' : ''}`}
                title={a.unlockedAt ? `Unlocked: ${new Date(a.unlockedAt).toLocaleDateString()}` : 'Locked'}
              >
                <span className="achievement-icon">{a.icon}</span>
                <div>
                  <div className="achievement-title">{a.title}</div>
                  <div className="achievement-desc">{a.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
