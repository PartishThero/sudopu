/**
 * @fileoverview Timer hook — ticks every second while game is playing.
 * @module hooks/useTimer
 */

import { useEffect } from 'react'
import { useGameStore } from '@/store/gameStore.ts'

export function useTimer() {
  const { phase, tick } = useGameStore()

  useEffect(() => {
    if (phase !== 'playing') return
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [phase, tick])
}

/**
 * Formats elapsed seconds to MM:SS display string.
 */
export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}
