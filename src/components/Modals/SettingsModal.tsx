/**
 * @fileoverview Settings modal with all user preferences.
 */

import type { Theme, FontStyle } from '@/store/settingsStore.ts'
import { useSettingsStore } from '@/store/settingsStore.ts'

interface SettingsModalProps {
  onClose: () => void
}

const THEME_SWATCHES: { id: Theme; label: string; bg: string; accent: string }[] = [
  { id: 'dark', label: 'Dark', bg: '#0d1117', accent: '#58a6ff' },
  { id: 'light', label: 'Light', bg: '#f6f8fa', accent: '#0969da' },
  { id: 'paper', label: 'Paper', bg: '#fdf6e3', accent: '#8b5c2a' },
  { id: 'neon', label: 'Neon', bg: '#080010', accent: '#b060ff' },
  { id: 'seasonal', label: 'Aurora', bg: '#020d18', accent: '#00d4aa' },
]

const FONT_OPTIONS: { id: FontStyle; label: string }[] = [
  { id: 'modern', label: 'Modern' },
  { id: 'classic', label: 'Classic' },
  { id: 'handwritten', label: 'Handwritten' },
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
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-card" role="dialog" aria-modal="true" aria-label="Settings">
        <div style={{ position: 'relative' }}>
          <h2 className="modal-title">Settings</h2>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close settings">✕</button>
        </div>

        {/* Theme */}
        <div className="settings-section">
          <div className="settings-section-title">Theme</div>
          <div className="theme-grid">
            {THEME_SWATCHES.map(t => (
              <button
                key={t.id}
                className={`theme-swatch${settings.theme === t.id ? ' theme-swatch--active' : ''}`}
                style={{ background: t.bg }}
                onClick={() => settings.setTheme(t.id)}
                aria-label={`${t.label} theme${settings.theme === t.id ? ' (active)' : ''}`}
                title={t.label}
              >
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ width: 16, height: 16, borderRadius: 4, background: t.accent }} />
                </div>
                <div className="theme-swatch-label">{t.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Font */}
        <div className="settings-section">
          <div className="settings-section-title">Number Style</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {FONT_OPTIONS.map(f => (
              <button
                key={f.id}
                className={`btn ${settings.fontStyle === f.id ? 'btn--primary' : 'btn--secondary'}`}
                style={{ flex: 1, padding: '8px 12px', fontSize: '0.82rem' }}
                onClick={() => settings.setFontStyle(f.id)}
                aria-pressed={settings.fontStyle === f.id}
              >
                {f.label}
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
              <div className="settings-sublabel">Show red on invalid entries</div>
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

          <div className="settings-row">
            <div>
              <div className="settings-label">Colorblind Mode</div>
              <div className="settings-sublabel">Uses patterns in addition to color</div>
            </div>
            <Toggle id="s-cb" checked={settings.colorblindMode} onChange={settings.setColorblindMode} />
          </div>
        </div>

        {/* Gameplay */}
        <div className="settings-section">
          <div className="settings-section-title">Gameplay</div>

          <div className="settings-row">
            <div>
              <div className="settings-label">Auto-Remove Notes</div>
              <div className="settings-sublabel">Remove pencil marks when value placed</div>
            </div>
            <Toggle id="s-autonotes" checked={settings.autoRemoveNotes} onChange={settings.setAutoRemoveNotes} />
          </div>

          <div className="settings-row">
            <div>
              <div className="settings-label">Strict Mode</div>
              <div className="settings-sublabel">Block invalid entries instead of highlighting</div>
            </div>
            <Toggle id="s-strict" checked={settings.strictMode} onChange={settings.setStrictMode} />
          </div>
        </div>

        {/* Sound */}
        <div className="settings-section">
          <div className="settings-section-title">Audio</div>

          <div className="settings-row">
            <div><div className="settings-label">Sound Effects</div></div>
            <Toggle id="s-sound" checked={settings.soundEnabled} onChange={settings.setSoundEnabled} />
          </div>
        </div>

        {/* Board Zoom */}
        <div className="settings-section">
          <div className="settings-section-title">Board Size</div>
          <input
            type="range"
            min={0.8}
            max={1.4}
            step={0.05}
            value={settings.boardZoom}
            onChange={e => settings.setBoardZoom(parseFloat(e.target.value))}
            style={{ width: '100%', accentColor: 'var(--accent)' }}
            aria-label="Board zoom level"
          />
          <div style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 4 }}>
            {Math.round(settings.boardZoom * 100)}%
          </div>
        </div>
      </div>
    </div>
  )
}
