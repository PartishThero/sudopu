import { motion } from 'framer-motion'
import { Home, RotateCcw, XCircle } from 'lucide-react'

interface GameOverModalProps {
  onRetry: () => void
  onMenu: () => void
}

export function GameOverModal({ onRetry, onMenu }: GameOverModalProps) {
  return (
    <motion.div
      className="modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <motion.div
        className="modal-card win-screen"
        style={{ textAlign: 'center', padding: '48px 32px' }}
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
          <XCircle size={48} style={{ color: 'var(--btn-danger-bg)' }} />
        </div>
        
        <h2 style={{ fontFamily: 'var(--font-family)', fontSize: '2rem', fontWeight: 500, color: 'var(--text-primary)', marginBottom: 8 }}>
          Game Over
        </h2>
        
        <p style={{ color: 'var(--text-secondary)', marginBottom: 32, lineHeight: 1.6 }}>
          You've reached the limit of your house rules. Don't worry, every puzzle is a chance to learn!
        </p>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <motion.button
            className="menu-action-link"
            onClick={onMenu}
            style={{ padding: '12px 24px', background: 'var(--bg-secondary)', borderRadius: 8 }}
            whileTap={{ scale: 0.95 }}
          >
            <Home size={18} />
            <span>Menu</span>
          </motion.button>
          
          <motion.button
            className="menu-action-link"
            onClick={onRetry}
            style={{ padding: '12px 24px', background: 'var(--text-primary)', color: 'var(--bg-primary)', borderRadius: 8 }}
            whileTap={{ scale: 0.95 }}
          >
            <RotateCcw size={18} />
            <span>Try Again</span>
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  )
}
