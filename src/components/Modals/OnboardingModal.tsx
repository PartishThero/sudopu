/**
 * @fileoverview First-time user onboarding tutorial modal.
 */

interface OnboardingModalProps {
  onClose: () => void
}

const STEPS = [
  {
    title: 'Fill the Grid',
    desc: 'Place numbers 1-9 in every empty cell so that each row, column, and 3×3 box contains all nine digits exactly once.',
  },
  {
    title: 'Click to Select',
    desc: 'Click (or tap) any empty cell, then press a number key or tap the number pad to fill it. Use arrow keys to navigate.',
  },
  {
    title: 'Pencil Notes',
    desc: 'Press ✏️ or P to toggle pencil mode. In pencil mode, numbers are stored as small candidate notes instead of definitive values.',
  },
  {
    title: 'Undo & Hints',
    desc: 'Made a mistake? Use ↩ Undo (Ctrl+Z) to go back. Stuck? Press 💡 Hint for a technique-based suggestion.',
  },
  {
    title: 'Choose Your Difficulty',
    desc: 'Easy puzzles need only basic singles. Expert puzzles require advanced techniques like X-Wing and Swordfish.',
  },
]

export function OnboardingModal({ onClose }: OnboardingModalProps) {
  return (
    <div className="modal-overlay">
      <div className="modal-card" role="dialog" aria-modal="true" aria-label="How to play">
        <h2 className="modal-title">Welcome to Sudoku Master 🎯</h2>

        <div className="onboarding-steps">
          {STEPS.map((step, i) => (
            <div key={i} className="onboarding-step">
              <div className="onboarding-step-num">{i + 1}</div>
              <div className="onboarding-step-text">
                <strong>{step.title}:</strong> {step.desc}
              </div>
            </div>
          ))}
        </div>

        <button className="btn btn--primary btn--full" onClick={onClose}>
          Let's Play! 🚀
        </button>
      </div>
    </div>
  )
}
