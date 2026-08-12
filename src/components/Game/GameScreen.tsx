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
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, width: '100%' }}>
      {/* Info bar */}
      <div className="game-info-bar">
        <div className="game-info-item">
          <span className="game-info-label">Difficulty</span>
          <span className={`difficulty-badge difficulty-badge--${difficulty}`}>
            {difficulty}
          </span>
        </div>

        <div className="game-info-item">
          <span className="game-info-label">Time</span>
          <span className="game-info-value">{formatTime(elapsedSeconds)}</span>
        </div>

        <div className="game-info-item">
          <span className="game-info-label">Mistakes</span>
          <span
            className="game-info-value"
            style={{ color: mistakeCount > 0 ? 'var(--cell-text-conflict)' : undefined }}
          >
            {mistakeCount}
          </span>
        </div>

        <div className="game-info-item">
          <span className="game-info-label">Hints</span>
          <span className="game-info-value">{hintCount}</span>
        </div>
      </div>

      {/* Board */}
      <Board />

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
