/**
 * @fileoverview Root application component.
 * Manages routing between screens and modal visibility.
 * Applies the theme and font style to the document root.
 */

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '@/store/gameStore.ts'
import { useSettingsStore } from '@/store/settingsStore.ts'
import { useStatsStore } from '@/store/statsStore.ts'
import { Header } from './components/Header/Header.tsx'
import { Menu } from './components/Menu/Menu.tsx'
import { GameScreen } from './components/Game/GameScreen.tsx'
import { SettingsModal } from './components/Modals/SettingsModal.tsx'
import { StatsModal } from './components/Modals/StatsModal.tsx'
import { WinModal } from './components/Modals/WinModal.tsx'
import { OnboardingModal } from './components/Modals/OnboardingModal.tsx'
import type { Achievement } from './store/statsStore.ts'

const ONBOARDING_KEY = 'sudoku-onboarded'

export default function App() {
  const { phase, startNewGame, difficulty, reset } = useGameStore()
  const { theme, fontStyle } = useSettingsStore()
  const { loadStats } = useStatsStore()

  const [showSettings, setShowSettings] = useState(false)
  const [showStats, setShowStats] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [winAchievements, setWinAchievements] = useState<Achievement[]>([])

  // Load stats from IndexedDB on mount
  useEffect(() => {
    loadStats()
  }, [loadStats])

  // Show onboarding for first-time users
  useEffect(() => {
    if (!localStorage.getItem(ONBOARDING_KEY)) {
      setShowOnboarding(true)
    }
  }, [])

  // Apply theme & font to document root
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    document.documentElement.setAttribute('data-font', fontStyle)
  }, [theme, fontStyle])

  // Apply colorblind mode
  const { colorblindMode } = useSettingsStore()
  useEffect(() => {
    document.documentElement.setAttribute('data-colorblind', String(colorblindMode))
  }, [colorblindMode])

  const handleWin = (achievements: Achievement[]) => {
    setWinAchievements(achievements)
  }

  const handleOnboardingClose = () => {
    localStorage.setItem(ONBOARDING_KEY, '1')
    setShowOnboarding(false)
  }

  const handleHome = () => {
    reset()
  }



  return (
    <div className="app-container">
      <Header
        onOpenSettings={() => setShowSettings(true)}
        onOpenStats={() => setShowStats(true)}
        onHome={handleHome}
      />

      <main className="main-content" role="main">
        <AnimatePresence mode="wait">
          {phase === 'menu' ? (
            <motion.div
              key="menu"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <Menu onShowOnboarding={() => setShowOnboarding(true)} />
            </motion.div>
          ) : (
            <motion.div
              key="game"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className="game-layout"
            >
              <div className="game-left">
                <GameScreen onWin={handleWin} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Modals */}
      <AnimatePresence>
        {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
      </AnimatePresence>
      <AnimatePresence>
        {showStats && <StatsModal onClose={() => setShowStats(false)} />}
      </AnimatePresence>
      <AnimatePresence>
        {showOnboarding && <OnboardingModal onClose={handleOnboardingClose} />}
      </AnimatePresence>
      <AnimatePresence>
        {phase === 'won' && (
        <WinModal
          newAchievements={winAchievements}
          onNewGame={() => {
            setWinAchievements([])
            startNewGame(difficulty)
          }}
          onMenu={() => {
            setWinAchievements([])
            handleHome()
          }}
        />
      )}
      </AnimatePresence>
    </div>
  )
}
