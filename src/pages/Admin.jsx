import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import AdminShell from '../components/ui/AdminShell'
import StatCard from '../components/ui/StatCard'
import SectionHeader from '../components/ui/SectionHeader'
import Icon from '../components/ui/Icons'

const QUICK_LINKS = [
  { label: '菜品管理', icon: 'menu', color: 'var(--color-ash)', path: '/admin/dishes' },
  { label: '厨房看板', icon: 'orders', color: 'var(--color-ash)', path: '/admin/orders' },
]

export default function Admin() {
  const [stats, setStats] = useState({ dishes: 0, orders: 0, today: 0 })
  const navigate = useNavigate()

  useEffect(() => {
    Promise.all([
      fetch('/api/dishes/all').then((r) => r.json()),
      fetch('/api/orders').then((r) => r.json()),
    ]).then(([dishes, orders]) => {
      const today = orders.filter((o) => {
        const d = new Date(o.created_at)
        const now = new Date()
        return d.toDateString() === now.toDateString()
      }).length
      setStats({ dishes: dishes.length, orders: orders.length, today })
    })
  }, [])

  const statCards = [
    { label: '菜品', value: stats.dishes, accent: 'var(--color-bone)' },
    { label: '订单', value: stats.orders, accent: 'var(--color-bone)' },
    { label: '今日', value: stats.today, accent: 'var(--color-bone)' },
  ]

  return (
    <AdminShell title="管理后台">
      <div className="flex gap-3">
        {statCards.map((s, i) => (
          <StatCard key={s.label} value={s.value} label={s.label} accent={s.accent} delay={i * 0.06} />
        ))}
      </div>

      <SectionHeader title="快捷入口" />

      <div className="flex gap-3">
        {QUICK_LINKS.map((link) => (
          <motion.button
            key={link.label}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate(link.path)}
            className="d3-card-face flex-1 text-center flex flex-col items-center gap-2.5"
            style={{ padding: 'var(--space-card-p)' }}
          >
            <Icon name={link.icon} size={26} style={{ color: link.color }} />
            <span className="text-sm font-bold text-[var(--color-bone)]">{link.label}</span>
          </motion.button>
        ))}
      </div>

      {/* 离开后台的显式出口（/admin 路由下底部导航是隐藏的） */}
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={() => navigate('/home')}
        className="d3-card-face w-full py-3.5 text-center text-sm font-bold text-[var(--color-ash)]"
        style={{ borderRadius: 'var(--radius-btn)' }}
      >
        ← 返回用户端
      </motion.button>
    </AdminShell>
  )
}
