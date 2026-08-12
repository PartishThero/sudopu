/**
 * @fileoverview Stats Zustand store backed by IndexedDB.
 * Tracks games played, wins, streaks, best times, and achievements.
 *
 * @module store/statsStore
 */

import { create } from 'zustand'
import { idbGet, idbSet } from '@/utils/indexedDB.ts'
import type { Difficulty } from '@/engine/types.ts'

export interface GameRecord {
  id: string
  difficulty: Difficulty
  isDaily: boolean
  dailyDate?: string
  won: boolean
  timeSeconds: number
  moveCount: number
  mistakeCount: number
  hintCount: number
  playedAt: number
}

export interface DifficultyStats {
  played: number
  won: number
  bestTime: number | null
  totalTime: number
}

export interface AchievementId
  extends String {}

export interface Achievement {
  id: string
  title: string
  description: string
  icon: string
  unlockedAt: number | null
}

const ALL_ACHIEVEMENTS: Achievement[] = [
  { id: 'first_win', title: 'First Victory', description: 'Win your first game', icon: 'trophy', unlockedAt: null },
  { id: 'no_hints', title: 'Pure Logic', description: 'Win without using any hints', icon: 'brain', unlockedAt: null },
  { id: 'no_mistakes', title: 'Flawless', description: 'Win without any mistakes', icon: 'gem', unlockedAt: null },
  { id: 'sub3_easy', title: 'Speed Demon', description: 'Solve an Easy puzzle in under 3 minutes', icon: 'zap', unlockedAt: null },
  { id: 'expert_win', title: 'Grand Master', description: 'Win an Expert puzzle', icon: 'crown', unlockedAt: null },
  { id: 'streak_3', title: 'Hat Trick', description: 'Win 3 games in a row', icon: 'flame', unlockedAt: null },
  { id: 'streak_7', title: 'Week Warrior', description: 'Win 7 games in a row', icon: 'swords', unlockedAt: null },
  { id: 'daily_done', title: 'Daily Devotee', description: 'Complete a daily challenge', icon: 'calendar', unlockedAt: null },
  { id: 'win_10', title: 'Centurion', description: 'Win 10 games total', icon: 'medal', unlockedAt: null },
  { id: 'win_50', title: 'Veteran', description: 'Win 50 games total', icon: 'star', unlockedAt: null },
]

interface StatsState {
  records: GameRecord[]
  byDifficulty: Record<Difficulty, DifficultyStats>
  currentStreak: number
  longestStreak: number
  achievements: Achievement[]
  loaded: boolean

  // Actions
  loadStats: () => Promise<void>
  recordGame: (record: Omit<GameRecord, 'id' | 'playedAt'>) => Promise<Achievement[]>
}

const defaultDiffStats = (): DifficultyStats => ({
  played: 0,
  won: 0,
  bestTime: null,
  totalTime: 0,
})

export const useStatsStore = create<StatsState>((set, get) => ({
  records: [],
  byDifficulty: {
    easy: defaultDiffStats(),
    medium: defaultDiffStats(),
    hard: defaultDiffStats(),
    expert: defaultDiffStats(),
  },
  currentStreak: 0,
  longestStreak: 0,
  achievements: ALL_ACHIEVEMENTS.map(a => ({ ...a })),
  loaded: false,

  loadStats: async () => {
    const data = await idbGet<{
      records: GameRecord[]
      byDifficulty: Record<Difficulty, DifficultyStats>
      currentStreak: number
      longestStreak: number
      achievements: Achievement[]
    }>('stats-v1')

    if (data) {
      // Merge new achievements that may not exist in saved data
      const mergedAchievements = ALL_ACHIEVEMENTS.map(a => {
        const saved = data.achievements?.find(s => s.id === a.id)
        return saved ? { ...a, unlockedAt: saved.unlockedAt } : a
      })
      set({
        records: data.records ?? [],
        byDifficulty: data.byDifficulty ?? {
          easy: defaultDiffStats(),
          medium: defaultDiffStats(),
          hard: defaultDiffStats(),
          expert: defaultDiffStats(),
        },
        currentStreak: data.currentStreak ?? 0,
        longestStreak: data.longestStreak ?? 0,
        achievements: mergedAchievements,
        loaded: true,
      })
    } else {
      set({ loaded: true })
    }
  },

  recordGame: async (partial) => {
    const state = get()
    const record: GameRecord = {
      ...partial,
      id: crypto.randomUUID(),
      playedAt: Date.now(),
    }

    // Update difficulty stats
    const diff = { ...state.byDifficulty[record.difficulty] }
    diff.played++
    if (record.won) {
      diff.won++
      diff.totalTime += record.timeSeconds
      if (diff.bestTime === null || record.timeSeconds < diff.bestTime) {
        diff.bestTime = record.timeSeconds
      }
    }

    // Update streaks
    let currentStreak = record.won ? state.currentStreak + 1 : 0
    const longestStreak = Math.max(state.longestStreak, currentStreak)

    // Check achievements
    const newRecords = [...state.records, record]
    const totalWins = newRecords.filter(r => r.won).length
    const unlockedNow: Achievement[] = []

    const achievements = state.achievements.map(a => {
      if (a.unlockedAt !== null) return a
      let unlock = false
      if (a.id === 'first_win' && record.won) unlock = true
      if (a.id === 'no_hints' && record.won && record.hintCount === 0) unlock = true
      if (a.id === 'no_mistakes' && record.won && record.mistakeCount === 0) unlock = true
      if (a.id === 'sub3_easy' && record.won && record.difficulty === 'easy' && record.timeSeconds < 180) unlock = true
      if (a.id === 'expert_win' && record.won && record.difficulty === 'expert') unlock = true
      if (a.id === 'streak_3' && currentStreak >= 3) unlock = true
      if (a.id === 'streak_7' && currentStreak >= 7) unlock = true
      if (a.id === 'daily_done' && record.won && record.isDaily) unlock = true
      if (a.id === 'win_10' && totalWins >= 10) unlock = true
      if (a.id === 'win_50' && totalWins >= 50) unlock = true

      if (unlock) {
        const unlocked = { ...a, unlockedAt: Date.now() }
        unlockedNow.push(unlocked)
        return unlocked
      }
      return a
    })

    const newState = {
      records: newRecords,
      byDifficulty: { ...state.byDifficulty, [record.difficulty]: diff },
      currentStreak,
      longestStreak,
      achievements,
    }

    set(newState)

    // Persist
    await idbSet('stats-v1', {
      records: newRecords.slice(-200), // Keep last 200 records
      byDifficulty: newState.byDifficulty,
      currentStreak,
      longestStreak,
      achievements,
    })

    return unlockedNow
  },
}))
