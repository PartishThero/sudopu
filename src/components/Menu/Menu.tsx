/**
 * @fileoverview Main menu / home screen.
 */

import { useGameStore } from '@/store/gameStore.ts'
import type { Difficulty } from '@/engine/types.ts'
import { getTodayDateString, getDailyDifficulty } from '@/engine/daily.ts'

const DIFFICULTIES: { id: Difficulty; label: string; desc: string }[] = [
  { id: 'easy', label: 'Easy', desc: 'Singles & hidden singles only' },
  { id: 'medium', label: 'Medium', desc: 'Pointing pairs, box reduction' },
  { id: 'hard', label: 'Hard', desc: 'Naked pairs/triples, X-Wing' },
  { id: 'expert', label: 'Expert', desc: 'Swordfish, coloring, chains' },
]

interface MenuProps {
  onShowOnboarding: () => void
}

export function Menu({ onShowOnboarding }: MenuProps) {
  const { startNewGame, startDailyChallenge } = useGameStore()
  const todayDate = getTodayDateString()
  const dailyDiff = getDailyDifficulty()

  return (
    <div className="menu-screen">
      <div>
        <h1 className="menu-hero-title">Sudoku<br />Master</h1>
        <p className="menu-subtitle">Industrial-grade puzzle solving</p>
      </div>

      {/* Daily Challenge */}
      <button
        className="menu-action-btn menu-action-btn--daily btn--full"
        onClick={startDailyChallenge}
        id="btn-daily-challenge"
        aria-label={`Daily challenge — ${dailyDiff} — ${todayDate}`}
      >
        📅 Today's Challenge
        <span style={{ fontSize: '0.75rem', opacity: 0.85, fontWeight: 400, textTransform: 'capitalize' }}>
          · {dailyDiff} · {todayDate}
        </span>
      </button>

      {/* Difficulty grid */}
      <div className="menu-difficulty-grid">
        {DIFFICULTIES.map(d => (
          <button
            key={d.id}
            className={`menu-diff-btn menu-diff-btn--${d.id}`}
            onClick={() => startNewGame(d.id)}
            id={`btn-new-${d.id}`}
            aria-label={`Start new ${d.label} game`}
          >
            <span className="menu-diff-name">{d.label}</span>
            <span className="menu-diff-desc">{d.desc}</span>
          </button>
        ))}
      </div>

      {/* Secondary actions */}
      <div className="menu-secondary-actions">
        <button
          className="menu-action-btn"
          onClick={onShowOnboarding}
          id="btn-how-to-play"
          aria-label="How to play"
        >
          ❓ How to Play
        </button>
      </div>
    </div>
  )
}
