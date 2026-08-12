/**
 * @fileoverview Main menu / home screen (Cozy Redesign).
 */

import { useMemo } from 'react'
import { useGameStore } from '@/store/gameStore.ts'
import type { Difficulty } from '@/engine/types.ts'
import { getTodayDateString, getDailyDifficulty } from '@/engine/daily.ts'
import { Calendar, BookOpen } from 'lucide-react'
import { motion } from 'framer-motion'
import type { Variants } from 'framer-motion'

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 }
  }
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
}

const DIFFICULTIES: { id: Difficulty; label: string; desc: string }[] = [
  { id: 'easy', label: 'Easy', desc: 'A gentle puzzle to relax.' },
  { id: 'medium', label: 'Medium', desc: 'A focused, steady solve.' },
  { id: 'hard', label: 'Hard', desc: 'A challenging mental workout.' },
  { id: 'expert', label: 'Expert', desc: 'An intense test of logic.' },
]

function getGreeting() {
  const hour = new Date().getHours()
  if (hour >= 5 && hour < 12) return 'Good morning.'
  if (hour >= 12 && hour < 17) return 'Good afternoon.'
  if (hour >= 17 && hour < 22) return 'Good evening.'
  return 'Late night Sudopu?'
}

interface MenuProps {
  onShowOnboarding: () => void
}

export function Menu({ onShowOnboarding }: MenuProps) {
  const { startNewGame, startDailyChallenge } = useGameStore()
  const todayDate = getTodayDateString()
  const dailyDiff = getDailyDifficulty()
  
  const greeting = useMemo(() => getGreeting(), [])

  return (
    <motion.div
      className="menu-screen"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      <motion.div className="menu-header" variants={itemVariants}>
        <h1 className="menu-greeting">{greeting}</h1>
        <p className="menu-subtitle">Ready for a puzzle?</p>
      </motion.div>

      <div className="menu-actions-container">
        {/* Daily Challenge */}
        <motion.button
          variants={itemVariants}
          whileTap={{ scale: 0.98 }}
          className="menu-daily-btn"
          onClick={startDailyChallenge}
          id="btn-daily-challenge"
          aria-label={`Daily challenge — ${dailyDiff} — ${todayDate}`}
        >
          <div className="menu-daily-content">
            <Calendar size={20} className="menu-daily-icon" />
            <div className="menu-daily-text">
              <span className="menu-daily-title">Today's Challenge</span>
              <span className="menu-daily-meta">{dailyDiff} • {todayDate}</span>
            </div>
          </div>
        </motion.button>

        {/* Difficulty List */}
        <div className="menu-difficulty-list">
          {DIFFICULTIES.map(d => (
            <motion.button
              variants={itemVariants}
              whileTap={{ scale: 0.98 }}
              key={d.id}
              className={`menu-diff-item menu-diff-item--${d.id}`}
              onClick={() => startNewGame(d.id)}
              id={`btn-new-${d.id}`}
              aria-label={`Start new ${d.label} game`}
            >
              <span className="menu-diff-name">{d.label}</span>
              <span className="menu-diff-desc">{d.desc}</span>
            </motion.button>
          ))}
        </div>

        {/* Secondary actions */}
        <motion.div className="menu-secondary-actions" variants={itemVariants}>
          <motion.button
            whileTap={{ scale: 0.95 }}
            className="menu-action-link"
            onClick={onShowOnboarding}
            id="btn-how-to-play"
          >
            <BookOpen size={16} />
            <span>How to Play</span>
          </motion.button>
        </motion.div>
      </div>
    </motion.div>
  )
}

