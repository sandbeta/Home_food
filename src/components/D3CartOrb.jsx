import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useCart } from './CartContext'
import { PERSONA } from '../theme/persona'

export default function D3CartOrb() {
  const { totalCount } = useCart()
  const navigate = useNavigate()

  return (
    <AnimatePresence>
      {totalCount > 0 && (
        <motion.div
          className="fixed bottom-24 right-4 z-50"
          initial={{ scale: 0, rotateY: -180 }}
          animate={{ scale: 1, rotateY: 0 }}
          exit={{ scale: 0, rotateY: 180 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        >
          <motion.button
            className="relative w-16 h-16 rounded-full flex items-center justify-center"
            style={{
              background: PERSONA.me.gradient,
              boxShadow: '0 6px 20px rgba(230,178,90,0.40), 0 12px 32px rgba(0,0,0,0.45), inset 0 2px 4px rgba(255,255,255,0.45), inset 0 -2px 4px rgba(184,134,60,0.30)',
            }}
            whileHover={{ scale: 1.1, y: -2 }}
            whileTap={{ scale: 0.92 }}
            onClick={() => navigate('/cart')}
          >
            <span className="text-2xl">🛒</span>
            <motion.span
              key={totalCount}
              initial={{ scale: 0.3, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 15 }}
              className="absolute -top-1 -right-1 min-w-[22px] h-[22px] rounded-full text-white text-[11px] font-bold flex items-center justify-center px-1 border-2 border-[var(--color-cream)]"
              style={{ background: 'var(--color-love)', boxShadow: '0 2px 8px rgba(255,90,110,0.45)' }}
            >
              {totalCount}
            </motion.span>
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
