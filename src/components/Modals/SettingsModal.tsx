/**
 * @fileoverview Settings modal with all user preferences (Cozy Redesign).
 */

import type { Theme } from '@/store/settingsStore.ts'
import { useSettingsStore } from '@/store/settingsStore.ts'
import { X } from 'lucide-react'
import { motion } from 'framer-motion'

interface SettingsModalProps {
  onClose: () => void
}

const THEME_SWATCHES: { id: Theme; label: string; bg: string; board: string; accent: string }[] = [
  { id: 'midnight', label: 'Midnight', bg: '#1C1E24', board: '#252830', accent: '#81A1C1' },
  { id: 'coffee', label: 'Coffee', bg: '#FDF9F1', board: '#F3ECE1', accent: '#B26A4A' },
  { id: 'library', label: 'Library', bg: '#E9E4D4', board: '#DFD7C3', accent: '#4A6352' },
  { id: 'forest', label: 'Forest', bg: '#1c2722', board: '#222e29', accent: '#8fb397' },
  { id: 'clay', label: 'Clay', bg: '#e6e0d4', board: '#dcd4c6', accent: '#8e9485' },
  { id: 'autumn', label: 'Autumn', bg: '#f6efe8', board: '#ebdcd0', accent: '#bc5d2e' },
  { id: 'sakura', label: 'Sakura', bg: '#fcf8f8', board: '#f4eaeb', accent: '#b88693' },
  { id: 'ocean', label: 'Ocean', bg: '#121c26', board: '#16222e', accent: '#5db2b5' },
  { id: 'lavender', label: 'Lavender', bg: '#f2eff4', board: '#e6e0eb', accent: '#8e7e99' },
]

function Toggle({ id, checked, onChange }: { id: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="toggle" htmlFor={id}>
      <input id={id} type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} />
      <span className="toggle-slider" />
    </label>
  )
}

export function SettingsModal({ onClose }: SettingsModalProps) {
  const settings = useSettingsStore()

  return (
    <motion.div
      className="modal-overlay"
      onClick={e => e.target === e.currentTarget && onClose()}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <motion.div
        className="modal-card"
        role="dialog"
        aria-modal="true"
        aria-label="Settings"
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      >
        <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
          <h2 className="modal-title" style={{ margin: 0 }}>Preferences</h2>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close settings">
            <X size={20} />
          </button>
        </div>

        {/* Theme Drawer */}
        <div className="settings-section">
          <div className="settings-section-title">Atmosphere</div>
          <div className="theme-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {THEME_SWATCHES.map(t => (
              <button
                key={t.id}
                className={`theme-preview-card${settings.theme === t.id ? ' theme-preview-card--active' : ''}`}
                style={{ backgroundColor: t.bg }}
                onClick={() => settings.setTheme(t.id)}
                aria-label={`${t.label} theme`}
              >
                <div className="theme-preview-mock-board" style={{ backgroundColor: t.board, borderColor: t.accent }}>
                  <div style={{ backgroundColor: t.accent, width: '30%', height: '30%', borderRadius: 2 }} />
                </div>
                <div className="theme-preview-label" style={{ color: t.accent }}>{t.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Display */}
        <div className="settings-section">
          <div className="settings-section-title">Display</div>
          <div className="settings-row">
            <div>
              <div className="settings-label">Show Timer</div>
            </div>
            <Toggle id="s-timer" checked={settings.showTimer} onChange={settings.setShowTimer} />
          </div>
          <div className="settings-row">
            <div>
              <div className="settings-label">Highlight Conflicts</div>
              <div className="settings-sublabel">Gentle warning for invalid entries</div>
            </div>
            <Toggle id="s-conflicts" checked={settings.showConflicts} onChange={settings.setShowConflicts} />
          </div>
          <div className="settings-row">
            <div>
              <div className="settings-label">Highlight Row/Col/Box</div>
            </div>
            <Toggle id="s-peer" checked={settings.showPeerHighlight} onChange={settings.setShowPeerHighlight} />
          </div>
          <div className="settings-row">
            <div>
              <div className="settings-label">Highlight Same Numbers</div>
            </div>
            <Toggle id="s-same" checked={settings.showSameNumberHighlight} onChange={settings.setShowSameNumberHighlight} />
          </div>
        </div>

        {/* Gameplay */}
        <div className="settings-section">
          <div className="settings-section-title">Gameplay</div>
          <div className="settings-row">
            <div>
              <div className="settings-label">Auto-Remove Notes</div>
            </div>
            <Toggle id="s-autonotes" checked={settings.autoRemoveNotes} onChange={settings.setAutoRemoveNotes} />
          </div>
        </div>

        {/* Sound */}
        <div className="settings-section">
          <div className="settings-section-title">Sound</div>
          <div className="settings-row">
            <div>
              <div className="settings-label">Sound Effects</div>
            </div>
            <Toggle id="s-sound" checked={settings.soundEnabled} onChange={settings.setSoundEnabled} />
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
