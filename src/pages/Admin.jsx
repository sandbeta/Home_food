import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import Header from '../components/Header'

// 快捷入口：菜品管理(金) / 厨房看板(铂) —— 仅取主题色，不硬编码暖色
const QUICK_LINKS = [
  { label: '菜品管理', emoji: '🍽️', path: '/admin/dishes', accent: 'var(--color-gold-soft)' },
  { label: '厨房看板', emoji: '👨‍🍳', path: '/admin/orders', accent: 'var(--color-platinum-soft)' },
]

export default function Admin() {
  const [stats, setStats] = useState({ dishes: 0, orders: 0, today: 0 })
  const navigate = useNavigate()

  useEffect(() => {
    Promise.all([
      fetch('/api/dishes/all').then(r => r.json()),
      fetch('/api/orders').then(r => r.json()),
    ]).then(([dishes, orders]) => {
      const today = orders.filter(o => {
        const d = new Date(o.created_at)
        const now = new Date()
        return d.toDateString() === now.toDateString()
      }).length
      setStats({ dishes: dishes.length, orders: orders.length, today })
    })
  }, [])

  const statCards = [
    { label: '菜品', value: stats.dishes },
    { label: '订单', value: stats.orders },
    { label: '今日', value: stats.today },
  ]

  return (
    <div>
      <Header title="管理后台" />

      <div className="px-4 pb-4 space-y-4">
        {/* 数据概览 */}
        <div className="grid grid-cols-3 gap-3">
          {statCards.map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
              className="glass rounded-[var(--radius-card)] p-4 text-center">
              <div className="text-2xl font-bold text-[var(--color-gold-soft)] tabular-nums">{s.value}</div>
              <div className="text-[11px] text-[var(--color-ash)] mt-1.5">{s.label}</div>
            </motion.div>
          ))}
        </div>

        {/* 快捷入口 */}
        <div className="section-title">快捷入口</div>
        <div className="grid grid-cols-2 gap-3">
          {QUICK_LINKS.map(link => (
            <motion.button key={link.label} whileTap={{ scale: 0.95 }}
              onClick={() => navigate(link.path)}
              className="glass rounded-[var(--radius-card)] p-5 text-center flex flex-col items-center gap-2.5 transition-shadow"
              style={{ borderLeft: `3px solid ${link.accent}` }}>
              <span className="text-3xl">{link.emoji}</span>
              <span className="text-sm font-bold text-[var(--color-bone)]">{link.label}</span>
            </motion.button>
          ))}
        </div>

        {/* 返回用户端 */}
        <motion.button whileTap={{ scale: 0.97 }}
          onClick={() => navigate('/home')}
          className="glass rounded-[var(--radius-btn)] w-full py-3.5 text-center text-sm font-bold text-[var(--color-ash)]">
          ← 返回用户端
        </motion.button>
      </div>
    </div>
  )
}
