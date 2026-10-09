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
  /* 这块**刻意不接 WebGL 玻璃**，只留 CSS 那层。实测理由：
     41px 的圆钮上 lensW≈1 铺满整块表面，shader 按「边缘清、中心糊」在那里显示的是
     **未糊**的场景，而 CSS 降级层糊 6px —— 两条链路在「身后是文字」时差 −0.106 亮度
     （measure_glass_gap light /menu y=0 .glass-op--ctl，纯玻璃一趟）。
     根因是场景纹理里没有字形（见 progress.txt US-004 末节）。等纹理补齐文字层再接。 */
  return (
    <motion.button
      whileTap={{ scale: 0.94 }}
      onClick={toggle}
      role="switch"
      aria-checked={isNight}
      aria-label={isNight ? '切回晨光模式' : '开启夜宵模式'}
      className="relative w-11 h-11 rounded-full flex items-center justify-center glass-op glass-op--ctl"
      style={{ color: isNight ? 'var(--color-love)' : 'var(--color-clay)' }}
    >
      <span className="glass-halo">
        <Icon name={isNight ? 'moon' : 'sun'} size={20} strokeWidth={1.9} filled={isNight} />
      </span>
    </motion.button>
  )
}
