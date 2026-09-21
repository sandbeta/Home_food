import { motion } from 'framer-motion'
import { useTheme } from '../../theme/useTheme'

/**
 * 页头常驻主题快捷开关 —— 与「我的」页开关共享 useTheme 状态。
 * 放在 PageHeader 的 right 槽：sticky 页头全站可见，夜宵/晨光随手可切，
 * 不必钻进个人页找开关。外观走玻璃令牌，夜宵下自动反相保持可见。
 */
export default function ThemeToggle() {
  const { isNight, toggle } = useTheme()
  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      onClick={toggle}
      role="switch"
      aria-checked={isNight}
      aria-label={isNight ? '切回晨光模式' : '开启夜宵模式'}
      className="w-10 h-10 rounded-full flex items-center justify-center text-base"
      style={{
        background: 'var(--color-glass)',
        border: '2px solid var(--color-line)',
        boxShadow: 'var(--shadow-1)',
      }}
    >
      {isNight ? '🌙' : '☀️'}
    </motion.button>
  )
}
