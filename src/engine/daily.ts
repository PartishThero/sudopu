/**
 * @fileoverview Daily challenge puzzle generation.
 *
 * The daily puzzle is seeded by the UTC date string, ensuring every player
 * gets the same puzzle on a given day regardless of timezone offsets within
 * a day boundary.
 *
 * @module engine/daily
 */

import type { PuzzleResult, Difficulty } from './types.ts'
import { generateSeededPuzzle } from './generator.ts'

/** Returns the UTC date string in YYYY-MM-DD format */
export function getTodayDateString(): string {
  const now = new Date()
  const y = now.getUTCFullYear()
  const m = String(now.getUTCMonth() + 1).padStart(2, '0')
  const d = String(now.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/**
 * Converts a date string to a deterministic integer seed.
 * Uses a simple DJB2-variant hash for distribution.
 *
 * @param dateStr - Date in YYYY-MM-DD format
 * @returns 32-bit integer seed
 */
export function dateSeed(dateStr: string): number {
  let hash = 5381
  for (let i = 0; i < dateStr.length; i++) {
    hash = ((hash << 5) + hash + dateStr.charCodeAt(i)) >>> 0
  }
  return hash
}

/**
 * Returns the daily difficulty based on the day of week.
 * Mon/Tue = easy, Wed/Thu = medium, Fri = hard, Sat/Sun = expert
 */
export function getDailyDifficulty(dateStr?: string): Difficulty {
  const d = new Date(dateStr ?? getTodayDateString() + 'T00:00:00Z')
  const dow = d.getUTCDay() // 0=Sun, 6=Sat
  if (dow === 1 || dow === 2) return 'easy'
  if (dow === 3 || dow === 4) return 'medium'
  if (dow === 5) return 'hard'
  return 'expert'
}

/**
 * Generates the daily challenge puzzle for a given date.
 * Two calls for the same `dateStr` produce identical puzzles.
 *
 * @param dateStr - Optional date override (defaults to today UTC)
 * @returns PuzzleResult for the daily challenge
 */
export function getDailyPuzzle(dateStr?: string): PuzzleResult & { dateStr: string } {
  const date = dateStr ?? getTodayDateString()
  const seed = dateSeed(date)
  const difficulty = getDailyDifficulty(date)
  const result = generateSeededPuzzle(seed, difficulty)
  return { ...result, dateStr: date }
}
