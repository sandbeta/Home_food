import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import AdminShell from '../components/ui/AdminShell'
import OrderCard from '../components/ui/OrderCard'
import EmptyState from '../components/ui/EmptyState'
import LoadingState from '../components/ui/LoadingState'
import Chip from '../components/ui/Chip'
import { orderStatusOf, PERSONA } from '../theme/persona'

const STATUS_FILTERS = [
  { value: '', label: '全部', emoji: '✨' },
  { value: 'pending', label: '等着呢', emoji: '⏳' },
  { value: 'preparing', label: '在做了', emoji: '👨‍🍳' },
  { value: 'completed', label: '做好啦', emoji: '🎉' },
]

const PAYER_LABEL = { aa: 'AA', me: '我请', partner: 'TA请' }

// 状态推进按钮：冷暖语义 —— 开始做=赤陶(暖)，做好了=鼠尾草绿(冷)
const STATUS_ACTIONS = {
  pending: {
    next: 'preparing', text: '开始做', emoji: '🔥',
    gradient: PERSONA.me.gradient, color: '#FFFDF9', glow: 'rgba(200,104,63,0.3)',
  },
  preparing: {
    next: 'completed', text: '做好了', emoji: '✅',
    gradient: 'linear-gradient(135deg, var(--color-sage-soft), var(--color-sage))',
    color: 'var(--color-bone)', glow: 'rgba(127,163,122,0.3)',
  },
}

export default function AdminOrders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')

  const loadOrders = useCallback(() => {
    const url = filter ? `/api/orders?status=${filter}` : '/api/orders'
    fetch(url)
      .then((r) => r.json())
      .then((d) => { setOrders(d); setLoading(false) })
  }, [filter])

  useEffect(() => { loadOrders() }, [loadOrders])

  const handleStatusChange = async (id, s) => {
    await fetch(`/api/orders/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: s }),
    })
    loadOrders()
  }

  return (
    <AdminShell title="厨房看板" subtitle={orders.length > 0 ? `${orders.length} 笔订单` : ''}>
      {/* 状态筛选 */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {STATUS_FILTERS.map((f) => (
          <Chip key={f.value} active={filter === f.value} onClick={() => setFilter(f.value)}>
            <span className="mr-1">{f.emoji}</span>
            {f.label}
          </Chip>
        ))}
      </div>

      {loading ? (
        <LoadingState emoji="👨‍🍳" />
      ) : orders.length === 0 ? (
        <EmptyState emoji="📋" title="暂时没有订单" desc="有新单会在这里出现" />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-card-p)' }}>
          {orders.map((order) => {
            const status = orderStatusOf(order.status)
            const action = STATUS_ACTIONS[order.status]
            return (
              <OrderCard
                key={order.id}
                order={order}
                status={{ ...status, bar: status.ring[1] }}
                variant="admin"
                showNote
                payerLabel={PAYER_LABEL[order.payer]}
                action={
                  action && (
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      whileHover={{ scale: 1.03 }}
                      onClick={() => handleStatusChange(order.id, action.next)}
                      className="px-3.5 py-1.5 text-xs font-bold flex items-center gap-1 shrink-0"
                      style={{
                        borderRadius: 'var(--radius-ctl)',
                        background: action.gradient,
                        color: action.color,
                        boxShadow: `0 2px 10px ${action.glow}`,
                      }}
                    >
                      {action.emoji} {action.text}
                    </motion.button>
                  )
                }
              />
            )
          })}
        </div>
      )}
    </AdminShell>
  )
}
