/**
 * @fileoverview Settings Zustand store.
 * All user preferences persisted to localStorage.
 *
 * @module store/settingsStore
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Theme = 'midnight' | 'coffee' | 'library' | 'forest' | 'clay' | 'autumn' | 'sakura' | 'ocean' | 'lavender'
export type FontStyle = 'modern' | 'classic' | 'handwritten'

interface SettingsState {
  theme: Theme
  fontStyle: FontStyle
  soundEnabled: boolean
  musicEnabled: boolean
  showTimer: boolean
  showConflicts: boolean
  showPeerHighlight: boolean
  showSameNumberHighlight: boolean
  autoRemoveNotes: boolean
  strictMode: boolean
  colorblindMode: boolean
  boardZoom: number // 0.8 to 1.4

  // Actions
  setTheme: (theme: Theme) => void
  setFontStyle: (style: FontStyle) => void
  setSoundEnabled: (enabled: boolean) => void
  setMusicEnabled: (enabled: boolean) => void
  setShowTimer: (show: boolean) => void
  setShowConflicts: (show: boolean) => void
  setShowPeerHighlight: (show: boolean) => void
  setShowSameNumberHighlight: (show: boolean) => void
  setAutoRemoveNotes: (auto: boolean) => void
  setStrictMode: (strict: boolean) => void
  setColorblindMode: (cb: boolean) => void
  setBoardZoom: (zoom: number) => void
  toggleSound: () => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    set => ({
      theme: 'midnight',
      fontStyle: 'modern',
      soundEnabled: true,
      musicEnabled: false,
      showTimer: true,
      showConflicts: true,
      showPeerHighlight: true,
      showSameNumberHighlight: true,
      autoRemoveNotes: true,
      strictMode: false,
      colorblindMode: false,
      boardZoom: 1.0,

      setTheme: theme => set({ theme }),
      setFontStyle: style => set({ fontStyle: style }),
      setSoundEnabled: enabled => set({ soundEnabled: enabled }),
      setMusicEnabled: enabled => set({ musicEnabled: enabled }),
      setShowTimer: show => set({ showTimer: show }),
      setShowConflicts: show => set({ showConflicts: show }),
      setShowPeerHighlight: show => set({ showPeerHighlight: show }),
      setShowSameNumberHighlight: show => set({ showSameNumberHighlight: show }),
      setAutoRemoveNotes: auto => set({ autoRemoveNotes: auto }),
      setStrictMode: strict => set({ strictMode: strict }),
      setColorblindMode: cb => set({ colorblindMode: cb }),
      setBoardZoom: zoom => set({ boardZoom: Math.min(1.4, Math.max(0.8, zoom)) }),
      toggleSound: () => set(state => ({ soundEnabled: !state.soundEnabled })),
    }),
    { name: 'sudoku-settings' }
  )
)
