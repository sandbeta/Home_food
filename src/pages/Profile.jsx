import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import PageHeader from '../components/PageHeader'
import FullBleedHero from '../components/FullBleedHero'
import PageContainer from '../components/ui/PageContainer'
import StatCard from '../components/ui/StatCard'
import { HERO_IMAGES } from '../theme/images'
import { PERSONA } from '../theme/persona'
import { useCart } from '../components/CartContext'
import { useTheme } from '../theme/useTheme'
import { pickOne, PROFILE_TITLES } from '../lib/sweetCopy'
import Icon from '../components/ui/Icons'

export default function Profile() {
  const [stats, setStats] = useState({ orders: 0, total: 0 })
  const [pageTitle] = useState(() => pickOne(PROFILE_TITLES))
  const navigate = useNavigate()
  const { whoAmI, setWhoAmI } = useCart()
  const { isNight, toggle: toggleThemeMode } = useTheme()
  const persona = PERSONA[whoAmI]

  useEffect(() => {
    fetch('/api/orders').then(r => r.json()).then(d => {
      setStats({ orders: d.length, total: d.reduce((s, o) => s + o.total_price, 0) })
    })
  }, [])

  return (
    <div className="relative">
      <FullBleedHero src={HERO_IMAGES.profile} variant="immersive" alt="我的" />

      <PageHeader title={pageTitle} />

      <PageContainer>
        {/* 身份卡 - 点头像切换 🐱/🐰 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="d3-card-face text-center relative overflow-hidden"
          style={{ padding: 'calc(var(--space-card-p) * 1.5) var(--space-card-p)' }}
        >
          {/* 人格色光晕：随身份切换，呼应双人格温度对比 */}
          <div
            className="absolute -top-16 left-1/2 -translate-x-1/2 w-56 h-40 rounded-full pointer-events-none"
            style={{ background: `radial-gradient(closest-side, ${persona.chipBg}, transparent 72%)` }}
          />
          <motion.div
            className={`relative w-20 h-20 rounded-full mx-auto mb-3 flex items-center justify-center text-3xl cursor-pointer ${whoAmI === 'me' ? 'avatar-me is-active' : 'avatar-partner is-active'}`}
            style={{ boxShadow: persona.glow }}
            onClick={() => setWhoAmI(whoAmI === 'me' ? 'partner' : 'me')}
            whileHover={{ scale: 1.05, rotate: 5 }}
            whileTap={{ scale: 0.95 }}
          >
            {persona.emoji}
          </motion.div>
          <h2
            className="text-lg font-bold font-serif"
            style={{
              backgroundImage: persona.gradient,
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent',
            }}
          >
            {whoAmI === 'me' ? '美食家（我）' : '另一半（TA）'}
          </h2>
          <p className="text-xs text-[var(--color-ash)] mt-1">点头像切换 🐱/🐰 身份</p>
        </motion.div>

        {/* 统计 */}
        <div className="flex gap-3">
          <StatCard value={stats.orders} label="订单总数" accent="var(--color-clay)" delay={0.1} />
          <StatCard value={stats.total} label="累计消费" accent="var(--color-caramel)" delay={0.16} prefix="¥" />
        </div>

        {/* 入口列表 —— 收藏已并入点菜页，空壳项已删 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="d3-card-face overflow-hidden"
        >
          {/* 夜宵模式：深夜刷手机护眼，全站令牌反相 */}
          <div className="flex items-center gap-3" style={{ padding: 'var(--space-card-p)' }}>
            <span className="text-base w-5 text-center" aria-hidden>{isNight ? '🌙' : '☀️'}</span>
            <div className="flex-1 min-w-0">
              <span className="block text-sm font-bold text-[var(--color-bone)]">夜宵模式</span>
              <span className="block text-xs text-[var(--color-ash)] mt-0.5">灯调暗，灶火更暖</span>
            </div>
            <motion.button
              onClick={toggleThemeMode}
              whileTap={{ scale: 0.92 }}
              role="switch"
              aria-checked={isNight}
              aria-label="切换夜宵模式"
              className="relative w-12 h-7 rounded-full shrink-0 transition-colors duration-300"
              style={{
                background: isNight ? 'var(--color-clay)' : 'rgba(43,38,32,0.16)',
                boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.12)',
              }}
            >
              <motion.span
                className="absolute top-0.5 left-0.5 w-6 h-6 rounded-full flex items-center justify-center text-[11px]"
                style={{ background: '#FFFDF9', boxShadow: 'var(--shadow-2)' }}
                animate={{ x: isNight ? 20 : 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              >
                {isNight ? '🌙' : '☀️'}
              </motion.span>
            </motion.button>
          </div>

          <div className="h-px mx-4" style={{ background: 'var(--color-glass-border)' }} />

          <motion.div
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/admin')}
            className="flex items-center gap-3 cursor-pointer"
            style={{ padding: 'var(--space-card-p)' }}
          >
            <Icon name="gear" size={20} style={{ color: 'var(--color-ash)' }} />
            <span className="flex-1 text-sm font-bold text-[var(--color-bone)]">管理后台</span>
            <span className="text-[var(--color-ash)] text-lg">›</span>
          </motion.div>
        </motion.div>
      </PageContainer>
    </div>
  )
}
