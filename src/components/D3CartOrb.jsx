import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useCart } from './CartContext'
import { PERSONA } from '../theme/persona'
import LazySheep, { SheepZzz } from './ui/LazySheep'

/**
 * 购物车球 —— 只负责自身外观与角标动效，不做定位。
 * 定位由 DockLayer 统一管理；入场/退场也由 DockLayer 的 AnimatePresence 统一编排
 * （本组件若再自带一层入场动画会与之打架）。仅在购物车非空时由 DockLayer 挂载。
 *
 * 懒羊羊化：球心由购物车 emoji 换成懒羊羊脸，表情随"饭量"升级——
 * 空车睡着（zZ）、有菜犯困、≥4 道眼睛放大、≥8 道眯眼满足。
 * 球体底色/角标/阴影等色调令牌全部保留原值。
 */
export default function D3CartOrb() {
  const { totalCount } = useCart()
  const navigate = useNavigate()
  const mood = totalCount >= 8 ? 'happy' : totalCount >= 4 ? 'sniff' : totalCount >= 1 ? 'doze' : 'sleep'

  return (
    <motion.button
      id="cart-orb"
      aria-label={`购物车，${totalCount} 件`}
      className="relative rounded-full flex items-center justify-center"
      style={{
        width: 'var(--dock-orb)',
        height: 'var(--dock-orb)',
        background: PERSONA.me.gradient,
        border: '2px solid var(--clay-deep)',
        boxShadow:
          '0 6px 20px color-mix(in srgb, var(--clay-50) 40%, transparent), 0 12px 32px rgba(43,36,41,0.22), inset 0 2px 4px rgba(255,255,255,0.45), inset 0 -2px 4px color-mix(in srgb, var(--clay-90) 30%, transparent)',
      }}
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.94 }}
      onClick={() => navigate('/cart')}
    >
      {/* 羊毛白脸浮在 clay 实底上：与球内高光同源的 on-dark 色 */}
      <div className="relative text-[var(--color-on-dark)]">
        <LazySheep size={50} mood={mood} />
        {totalCount === 0 && <SheepZzz size={9} />}
      </div>
      <motion.span
        key={totalCount}
        initial={{ scale: 0.3, rotate: -20 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 500, damping: 15 }}
        className="absolute -top-1 -right-1 min-w-[22px] h-[22px] rounded-full text-white text-xs font-bold flex items-center justify-center px-1 border-2 border-[var(--color-ink-900)]"
        style={{ background: 'var(--color-love)', boxShadow: '0 2px 8px rgba(217,100,136,0.45)' }}
      >
        {totalCount}
      </motion.span>
    </motion.button>
  )
}
