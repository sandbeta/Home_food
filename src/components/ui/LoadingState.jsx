import { motion } from 'framer-motion'
import { usePrefersReducedMotion } from '../../theme/motion'
import Icon from './Icons'
import LazySheep, { SheepZzz } from './LazySheep'

/**
 * 统一加载态 —— 取代各页手写的相同实现。已接入：AdminDishes / AdminOrders /
 * MyOrders / OrderDetail / DishDetail / Home。
 * mode="pot"（默认）：锅沿水开冒泡——把"等"做成灶台叙事的一部分；
 * 传 emoji 走旧版 emoji 浮动（后台页保留人味表情）。
 */
export default function LoadingState({ emoji, text = '加载中...' }) {
  const reduce = usePrefersReducedMotion()
  const isPot = !emoji || emoji === '🍳'
  return (
    <div className="flex flex-col items-center justify-center py-20">
      {isPot ? (
        <div className="relative w-[64px] h-[64px]">
          {/* 水开：三串气泡从锅沿错峰升起（reduced 静止） */}
          {!reduce && (
            <div className="absolute left-1/2 -translate-x-1/2 top-[-2px] flex gap-2 pointer-events-none">
              <span className="steam-puff" style={{ animationDelay: '0s' }} />
              <span className="steam-puff" style={{ animationDelay: '0.9s' }} />
              <span className="steam-puff" style={{ animationDelay: '1.7s' }} />
            </div>
          )}
          <motion.div
            className="absolute inset-0 flex items-end justify-center text-[var(--color-ash)]"
            animate={reduce ? undefined : { y: [0, -2, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Icon name="potBoil" size={52} strokeWidth={1.6} />
          </motion.div>
          {/* 懒羊羊趴在锅边等饭，睡着（zZ 飘起）——"等"是它的舒适区 */}
          <div className="absolute -right-4 -bottom-1 text-[var(--color-sage)]">
            <LazySheep size={34} mood="sleep" bib={false} />
            <SheepZzz size={9} className="-top-2 -right-1" />
          </div>
        </div>
      ) : (
        <div className="relative">
          <motion.div
            className="text-5xl"
            animate={{ y: [0, -6, 0], rotate: [0, 3, -3, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            {emoji}
          </motion.div>
          <motion.div
            className="absolute -inset-4 rounded-full opacity-20"
            animate={{ scale: [1, 1.15, 1], opacity: [0.1, 0.25, 0.1] }}
            transition={{ duration: 2, repeat: Infinity }}
            style={{ background: 'radial-gradient(circle, color-mix(in srgb, var(--clay-50) 20%, transparent), transparent 70%)' }}
          />
        </div>
      )}

      <div className="flex items-center gap-1.5 mt-4">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-[var(--color-clay)]"
            animate={{ scale: [1, 1.4, 1], opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
          />
        ))}
      </div>

      <p className="text-sm text-[var(--color-ash)] mt-2">{text}</p>
    </div>
  )
}
