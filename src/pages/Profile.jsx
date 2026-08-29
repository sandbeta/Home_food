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
import { pickOne, PROFILE_TITLES } from '../lib/sweetCopy'
import Icon from '../components/ui/Icons'

export default function Profile() {
  const [stats, setStats] = useState({ orders: 0, total: 0 })
  const [pageTitle] = useState(() => pickOne(PROFILE_TITLES))
  const navigate = useNavigate()
  const { whoAmI, setWhoAmI } = useCart()
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
          className="d3-card-face text-center"
          style={{ padding: 'var(--space-card-p)' }}
        >
          <motion.div
            className={`w-20 h-20 rounded-full mx-auto mb-3 flex items-center justify-center text-3xl cursor-pointer ${whoAmI === 'me' ? 'avatar-me is-active' : 'avatar-partner is-active'}`}
            onClick={() => setWhoAmI(whoAmI === 'me' ? 'partner' : 'me')}
            whileHover={{ scale: 1.05, rotate: 5 }}
            whileTap={{ scale: 0.95 }}
          >
            {persona.emoji}
          </motion.div>
          <h2 className="text-lg font-bold text-[var(--color-bone)] font-serif">{whoAmI === 'me' ? '美食家（我）' : '另一半（TA）'}</h2>
          <p className="text-xs text-[var(--color-ash)] mt-1">点头像切换 🐱/🐰 身份</p>
        </motion.div>

        {/* 统计 */}
        <div className="flex gap-3">
          <StatCard value={stats.orders} label="订单总数" accent="var(--color-clay)" delay={0.1} />
          <StatCard value={stats.total} label="累计消费" accent="var(--color-caramel)" delay={0.16} />
        </div>

        {/* 入口列表 —— 收藏已并入点菜页，空壳项已删，仅保留有效入口 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="d3-card-face overflow-hidden"
        >
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
