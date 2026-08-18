import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import Header from '../components/Header'
import FullBleedHero from '../components/FullBleedHero'
import { HERO_IMAGES } from '../theme/images'
import { PERSONA } from '../theme/persona'
import { useCart } from '../components/CartContext'

const MENU_ITEMS = [
  { label: '我的收藏', emoji: '⭐', path: '/favorites' },
  { label: '管理后台', emoji: '⚙️', path: '/admin' },
  { label: '设置', emoji: '🔧', path: '#' },
  { label: '关于', emoji: '💡', path: '#' },
]

export default function Profile() {
  const [stats, setStats] = useState({ orders: 0, total: 0 })
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

      <Header title="我的" />

      <div className="px-4 pb-4 space-y-4">
        {/* 头像卡片 - 身份切换 */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="d3-card-face p-5 text-center">
          <motion.div
            className={`w-20 h-20 rounded-full mx-auto mb-3 flex items-center justify-center text-3xl cursor-pointer ${whoAmI === 'me' ? 'avatar-me is-active' : 'avatar-partner is-active'}`}
            onClick={() => setWhoAmI(whoAmI === 'me' ? 'partner' : 'me')}
            whileHover={{ scale: 1.05, rotate: 5 }} whileTap={{ scale: 0.95 }}>
            {persona.emoji}
          </motion.div>
          <h2 className="text-lg font-bold text-[var(--color-bone)] font-serif">{whoAmI === 'me' ? '美食家（我）' : '另一半（TA）'}</h2>
          <p className="text-xs text-[var(--color-ash)] mt-1">点头像切换 🐱/🐰 身份</p>
        </motion.div>

        {/* 统计 */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="grid grid-cols-2 gap-3">
          <div className="d3-card-face p-4 text-center">
            <div className="text-2xl font-bold text-[var(--color-gold-soft)]">{stats.orders}</div>
            <div className="text-xs text-[var(--color-ash)] mt-1">订单总数</div>
          </div>
          <div className="d3-card-face p-4 text-center">
            <div className="text-2xl font-bold text-[var(--color-gold-soft)]">{stats.total}</div>
            <div className="text-xs text-[var(--color-ash)] mt-1">累计消费</div>
          </div>
        </motion.div>

        {/* 菜单列表 */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="d3-card-face overflow-hidden">
          {MENU_ITEMS.map((item, i) => (
            <motion.div key={item.label}
              whileTap={{ scale: 0.98 }}
              onClick={() => item.path !== '#' && navigate(item.path)}
              className={`flex items-center gap-3 px-4 py-3.5 cursor-pointer ${i < MENU_ITEMS.length - 1 ? 'border-b border-[var(--color-glass-border)]' : ''}`}>
              <span className="text-xl">{item.emoji}</span>
              <span className="flex-1 text-sm font-bold text-[var(--color-bone)]">{item.label}</span>
              <span className="text-[var(--color-ash)] text-lg">›</span>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  )
}
