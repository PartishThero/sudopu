/**
 * @fileoverview Web Audio API sound engine.
 * Generates all sounds procedurally — no audio files needed.
 *
 * @module utils/sounds
 */

let ctx: AudioContext | null = null

function getCtx(): AudioContext {
  if (!ctx) ctx = new AudioContext()
  return ctx
}

function playTone(
  frequency: number,
  duration: number,
  type: OscillatorType = 'sine',
  gainVal = 0.18
): void {
  try {
    const ac = getCtx()
    const osc = ac.createOscillator()
    const gain = ac.createGain()
    osc.connect(gain)
    gain.connect(ac.destination)
    osc.type = type
    osc.frequency.setValueAtTime(frequency, ac.currentTime)
    gain.gain.setValueAtTime(gainVal, ac.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + duration)
    osc.start(ac.currentTime)
    osc.stop(ac.currentTime + duration)
  } catch {
    // Silently fail if audio context is unavailable
  }
}

export const Sounds = {
  select: () => playTone(440, 0.08, 'sine', 0.1),
  enter: () => playTone(523, 0.12, 'sine', 0.15),
  erase: () => playTone(300, 0.1, 'triangle', 0.1),
  error: () => {
    playTone(200, 0.15, 'sawtooth', 0.12)
    setTimeout(() => playTone(170, 0.2, 'sawtooth', 0.1), 80)
  },
  hint: () => {
    playTone(660, 0.1, 'sine', 0.12)
    setTimeout(() => playTone(880, 0.15, 'sine', 0.1), 100)
  },
  win: () => {
    const notes = [523, 659, 784, 1047]
    notes.forEach((f, i) => setTimeout(() => playTone(f, 0.3, 'sine', 0.2), i * 120))
  },
  rowComplete: () => playTone(700, 0.2, 'sine', 0.13),
}
