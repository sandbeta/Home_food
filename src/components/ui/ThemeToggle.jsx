import { motion } from 'framer-motion'
import { useTheme } from '../../theme/useTheme'
import Icon from './Icons'

/**
 * 页头常驻主题快捷开关 —— 与「我的」页开关共享 useTheme 状态。
 * 放在 PageHeader 的 right 槽：sticky 页头全站可见，夜宵/晨光随手可切，
 * 不必钻进个人页找开关。外观走玻璃令牌，夜宵下自动反相保持可见。
 * 图标用细线 SVG（月/日），与全站图标同一风格谱系；触控热区 44px。
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
      className="w-11 h-11 rounded-full flex items-center justify-center"
      style={{
        background: 'var(--color-glass)',
        border: '2px solid var(--color-line)',
        boxShadow: 'var(--shadow-1)',
        color: isNight ? 'var(--color-love)' : 'var(--color-clay)',
      }}
    >
      <Icon name={isNight ? 'moon' : 'sun'} size={20} strokeWidth={1.9} filled={isNight} />
    </motion.button>
  )
}
