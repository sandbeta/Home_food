import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useCart } from './CartContext'
import { PERSONA } from '../theme/persona'

/**
 * 购物车球 —— 只负责自身外观与入场动效，不做定位。
 * 定位由 DockLayer 统一管理，因此结构上不可能与底部导航重叠。
 * 仅在购物车非空时出现。
 */
export default function D3CartOrb() {
  const { totalCount } = useCart()
  const navigate = useNavigate()

  return (
    <AnimatePresence>
      {totalCount > 0 && (
        <motion.div
          initial={{ scale: 0, rotateY: -180 }}
          animate={{ scale: 1, rotateY: 0 }}
          exit={{ scale: 0, rotateY: 180 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        >
          <motion.button
            aria-label={`购物车，${totalCount} 件`}
            className="relative rounded-full flex items-center justify-center"
            style={{
              width: 'var(--dock-orb)',
              height: 'var(--dock-orb)',
              background: PERSONA.me.gradient,
              boxShadow:
                '0 6px 20px rgba(200,104,63,0.40), 0 12px 32px rgba(43,38,32,0.22), inset 0 2px 4px rgba(255,255,255,0.45), inset 0 -2px 4px rgba(154,78,44,0.30)',
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
              className="absolute -top-1 -right-1 min-w-[22px] h-[22px] rounded-full text-white text-xs font-bold flex items-center justify-center px-1 border-2 border-[var(--color-cream)]"
              style={{ background: 'var(--color-love)', boxShadow: '0 2px 8px rgba(217,140,132,0.45)' }}
            >
              {totalCount}
            </motion.span>
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
