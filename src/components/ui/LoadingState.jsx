import { motion } from 'framer-motion'

/**
 * 统一加载态 —— 取代此前 MyOrders / AdminDishes / AdminOrders 三份相同的手写实现。
 */
export default function LoadingState({ emoji = '📋', text = '加载中...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
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
          style={{ background: 'radial-gradient(circle, rgba(200,104,63,0.20), transparent 70%)' }}
        />
      </div>

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
