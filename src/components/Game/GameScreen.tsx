/**
 * @fileoverview Game screen — board + controls + info bar + hint card.
 */

import { useEffect, useRef } from 'react'
import { Board } from '../Board/Board.tsx'
import { NumberPad } from '../NumberPad/NumberPad.tsx'
import { Controls } from '../Controls/Controls.tsx'
import { useGameStore } from '@/store/gameStore.ts'
import { useStatsStore } from '@/store/statsStore.ts'
import { useKeyboard } from '@/hooks/useKeyboard.ts'
import { useTimer } from '@/hooks/useTimer.ts'
import type { Achievement } from '@/store/statsStore.ts'
import { formatTime } from '@/hooks/useTimer.ts'

interface GameScreenProps {
  onWin: (achievements: Achievement[]) => void
}

export function GameScreen({ onWin }: GameScreenProps) {
  useKeyboard()
  useTimer()

  const {
    phase,
    difficulty,
    elapsedSeconds,
    mistakeCount,
    hintCount,
    isDaily,
    dailyDate,
    lastHint,
    requestHint,
    timerMode,
    timeRemaining,
  } = useGameStore()

  const { recordGame } = useStatsStore()
  const winRecorded = useRef(false)

  // Record game win and emit achievements
  useEffect(() => {
    if (phase === 'won' && !winRecorded.current) {
      winRecorded.current = true
      const gameData: Parameters<typeof recordGame>[0] = {
        difficulty,
        isDaily,
        won: true,
        timeSeconds: elapsedSeconds,
        moveCount: useGameStore.getState().moveCount,
        mistakeCount,
        hintCount,
      }
      if (dailyDate !== null) gameData.dailyDate = dailyDate
      recordGame(gameData).then(achievements => {
        onWin(achievements)
      })
    }
  }, [phase])

  const handleHint = () => {
    requestHint()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, width: '100%' }}>
      {/* Top Info Area */}
      <div className="game-top-info" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, marginBottom: 4 }}>
        {timerMode !== 'zen' && (
          <span 
            className="game-timer" 
            style={{ 
              fontSize: '1.2rem', 
              fontWeight: 500, 
              fontVariantNumeric: 'tabular-nums', 
              color: (timerMode === 'time-attack' && timeRemaining !== null && timeRemaining <= 60) ? 'var(--btn-danger-bg)' : 'var(--text-primary)'
            }}
          >
            {timerMode === 'time-attack' && timeRemaining !== null ? formatTime(timeRemaining) : formatTime(elapsedSeconds)}
          </span>
        )}
        <span className={`difficulty-badge difficulty-badge--${difficulty}`}>
          {difficulty}
        </span>
      </div>

      {/* Board */}
      <Board />

      {/* Bottom Understated Info */}
      <div className="game-bottom-info" style={{ display: 'flex', gap: 24, opacity: 0.6, fontSize: '0.8rem', marginTop: 8 }}>
        {mistakeCount > 0 && (
          <span style={{ color: 'var(--cell-text-conflict)' }}>Mistakes: {mistakeCount} </span>
        )}
        {hintCount > 0 && (
          <span>Hints used: {hintCount}</span>
        )}
      </div>

      {/* Hint card */}
      {lastHint && (
        <div className="hint-card" role="status" aria-live="polite">
          <div className="hint-card-technique">{lastHint.technique}</div>
          <div className="hint-card-text">{lastHint.explanation}</div>
        </div>
      )}

      {/* Controls */}
      <Controls onHint={handleHint} />

      {/* Number pad */}
      <NumberPad />
    </div>
  )
}
