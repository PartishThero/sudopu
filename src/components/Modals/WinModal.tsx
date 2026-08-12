/**
 * @fileoverview Win screen modal (Cozy Redesign).
 */

import { useEffect, useState } from 'react'
import { useGameStore } from '@/store/gameStore.ts'
import { useSettingsStore } from '@/store/settingsStore.ts'
import { Sounds } from '@/utils/sounds.ts'
import { formatTime } from '@/hooks/useTimer.ts'
import type { Achievement } from '@/store/statsStore.ts'
import { Home, Play, Trophy, Brain, Gem, Zap, Crown, Flame, Swords, Calendar, Medal, Star, HelpCircle } from 'lucide-react'
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

interface WinModalProps {
  newAchievements: Achievement[]
  onNewGame: () => void
  onMenu: () => void
}

const GENTLE_MESSAGES = [
  'Nicely done.',
  'That was a good one.',
  'A beautiful solve.',
  'Well played.',
  'Peaceful progress.',
]

export function WinModal({ newAchievements, onNewGame, onMenu }: WinModalProps) {
  const { elapsedSeconds, difficulty } = useGameStore()
  const { soundEnabled } = useSettingsStore()
  const [message] = useState(() => GENTLE_MESSAGES[Math.floor(Math.random() * GENTLE_MESSAGES.length)])

  useEffect(() => {
    if (soundEnabled) Sounds.win()
  }, [soundEnabled])

  return (
    <motion.div
      className="modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <motion.div
        className="modal-card win-screen"
        style={{ textAlign: 'center', padding: '48px 32px' }}
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      >
        <h2 style={{ fontFamily: 'Lora, serif', fontSize: '2rem', fontWeight: 500, color: 'var(--text-primary)', marginBottom: 8 }}>
          {message}
        </h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 32 }}>
          You solved the {difficulty} puzzle in {formatTime(elapsedSeconds)}.
        </p>

        {newAchievements.length > 0 && (
          <div className="win-achievements" style={{ marginBottom: 32, textAlign: 'left', background: 'var(--bg-secondary)', borderRadius: 12, padding: 16 }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 12 }}>
              New Keepsakes
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {newAchievements.map(a => (
                <div key={a.id} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <span style={{ display: 'flex', alignItems: 'center' }}>{getIcon(a.icon)}</span>
                  <div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>{a.title}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{a.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <motion.button
            className="menu-action-link"
            onClick={onMenu}
            style={{ padding: '12px 24px', background: 'var(--bg-secondary)', borderRadius: 8 }}
            whileTap={{ scale: 0.95 }}
          >
            <Home size={18} />
            <span>Menu</span>
          </motion.button>
          <motion.button
            className="menu-action-link"
            onClick={onNewGame}
            style={{ padding: '12px 24px', background: 'var(--text-primary)', color: 'var(--bg-primary)', borderRadius: 8 }}
            whileTap={{ scale: 0.95 }}
          >
            <Play size={18} />
            <span>Next {difficulty}</span>
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  )
}
