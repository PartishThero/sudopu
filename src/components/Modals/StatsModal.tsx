/**
 * @fileoverview Statistics dashboard modal (Cozy Journal Redesign).
 */

import { useStatsStore } from '@/store/statsStore.ts'
import { formatTime } from '@/hooks/useTimer.ts'
import type { Difficulty } from '@/engine/types.ts'
import { X, Bookmark, Trophy, Brain, Gem, Zap, Crown, Flame, Swords, Calendar, Medal, Star, HelpCircle } from 'lucide-react'
import { motion } from 'framer-motion'

function getIcon(name: string) {
  switch (name) {
    case 'trophy': return <Trophy size={24} />
    case 'brain': return <Brain size={24} />
    case 'gem': return <Gem size={24} />
    case 'zap': return <Zap size={24} />
    case 'crown': return <Crown size={24} />
    case 'flame': return <Flame size={24} />
    case 'swords': return <Swords size={24} />
    case 'calendar': return <Calendar size={24} />
    case 'medal': return <Medal size={24} />
    case 'star': return <Star size={24} />
    default: return <HelpCircle size={24} />
  }
}

interface StatsModalProps {
  onClose: () => void
}

const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard', 'expert']

export function StatsModal({ onClose }: StatsModalProps) {
  const { byDifficulty, currentStreak, longestStreak, achievements } = useStatsStore()

  const totalPlayed = DIFFICULTIES.reduce((s, d) => s + byDifficulty[d].played, 0)
  const totalWon = DIFFICULTIES.reduce((s, d) => s + byDifficulty[d].won, 0)
  const unlockedCount = achievements.filter(a => a.unlockedAt !== null).length

  // Determine favorite difficulty
  let favDiff: Difficulty = 'easy'
  let maxPlayed = -1
  for (const d of DIFFICULTIES) {
    if (byDifficulty[d].played > maxPlayed) {
      maxPlayed = byDifficulty[d].played
      favDiff = d
    }
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
        className="modal-card stats-modal-card"
        role="dialog"
        aria-modal="true"
        aria-label="Journal"
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      >
        <div className="stats-header" style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
          <h2 className="modal-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
            <Bookmark size={24} style={{ color: 'var(--accent)' }} />
            Journal
          </h2>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        {/* Conversational Overview */}
        <div className="journal-entry">
          {totalPlayed === 0 ? (
            <p>You haven't played any puzzles yet. This space will fill up as you play.</p>
          ) : (
            <>
              <p>
                You have started <strong>{totalPlayed}</strong> puzzles, and successfully completed <strong>{totalWon}</strong> of them.
                {maxPlayed > 0 && <span> It looks like your favorite difficulty is <span style={{ textTransform: 'capitalize' }}>{favDiff}</span>.</span>}
              </p>
              {currentStreak > 1 && (
                <p>You are currently on a <strong>{currentStreak}</strong> game winning streak! Keep it up. Your longest streak so far is <strong>{longestStreak}</strong>.</p>
              )}
            </>
          )}
        </div>

        {/* Breakdown */}
        {totalPlayed > 0 && (
          <div className="journal-breakdown">
            <div className="settings-section-title">Your Progress</div>
            <div className="journal-breakdown-grid">
              {DIFFICULTIES.map(d => {
                const s = byDifficulty[d]
                if (s.played === 0) return null
                return (
                  <div key={d} className="journal-breakdown-item">
                    <span className="journal-breakdown-diff">{d}</span>
                    <span className="journal-breakdown-stat">
                      {s.won}/{s.played} won
                      {s.bestTime !== null && ` • Best: ${formatTime(s.bestTime)}`}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Keepsakes (Achievements) */}
        <div style={{ marginTop: 40 }}>
          <div className="settings-section-title">Keepsakes ({unlockedCount}/{achievements.length})</div>
          <div className="keepsakes-grid">
            {achievements.map(a => {
              const unlocked = a.unlockedAt !== null
              return (
                <div
                  key={a.id}
                  className={`keepsake-item${unlocked ? ' keepsake-item--unlocked' : ''}`}
                  title={unlocked ? `Discovered: ${new Date(a.unlockedAt!).toLocaleDateString()}` : 'Hidden'}
                >
                  <span className="keepsake-icon">{unlocked ? getIcon(a.icon) : <HelpCircle size={24} />}</span>
                  <div className="keepsake-details">
                    <div className="keepsake-title">{unlocked ? a.title : '???'}</div>
                    <div className="keepsake-desc">{unlocked ? a.description : 'Keep playing to discover this.'}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
