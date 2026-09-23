import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import AdminShell from '../components/ui/AdminShell'
import OrderCard from '../components/ui/OrderCard'
import EmptyState from '../components/ui/EmptyState'
import LoadingState from '../components/ui/LoadingState'
import Chip from '../components/ui/Chip'
import Icon from '../components/ui/Icons'
import { orderStatusOf, PERSONA } from '../theme/persona'

const STATUS_FILTERS = [
  { value: '', label: '全部', icon: 'sparkles' },
  { value: 'pending', label: '等着呢', icon: 'clock' },
  { value: 'preparing', label: '在做了', icon: 'potBoil' },
  { value: 'completed', label: '做好啦', icon: 'check' },
]

const PAYER_LABEL = { aa: 'AA', me: '我请', partner: 'TA请' }

// 状态推进按钮（管理端唯一主操作位）：冷暖语义照旧 —— 开始做=赤陶(暖)，做好了=鼠尾草绿(冷)
// 管理端 quieter：去光晕与 hover 浮起，按钮以实底安静存在，反馈只留按压缩放；图标走统一细线集
const STATUS_ACTIONS = {
  pending: {
    next: 'preparing', text: '开始做', icon: 'flame',
    gradient: PERSONA.me.gradient, color: 'var(--color-on-dark)',
  },
  preparing: {
    next: 'completed', text: '做好了', icon: 'check',
    gradient: 'linear-gradient(135deg, var(--color-sage-soft), var(--color-sage))',
    color: 'var(--color-bone)',
  },
}

export default function AdminOrders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const [err, setErr] = useState('')

  const loadOrders = useCallback(() => {
    const url = filter ? `/api/orders?status=${filter}` : '/api/orders'
    fetch(url)
      .then((r) => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json() })
      .then((d) => { setOrders(d); setLoading(false); setErr('') })
      .catch(() => { setLoading(false); setErr('订单没加载出来，看看服务端开好了没') })
  }, [filter])

  useEffect(() => { loadOrders() }, [loadOrders])

  const handleStatusChange = async (id, s) => {
    try {
      const res = await fetch(`/api/orders/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: s }),
      })
      if (!res.ok) throw new Error('HTTP ' + res.status)
      loadOrders()
    } catch { setErr('状态没推进成功，网络可能不稳，再点一次') }
  }

  return (
    <AdminShell title="厨房看板" subtitle={orders.length > 0 ? `${orders.length} 笔订单` : ''}>
      {/* 状态筛选 */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {STATUS_FILTERS.map((f) => (
          <Chip key={f.value} active={filter === f.value} onClick={() => setFilter(f.value)}>
            <Icon name={f.icon} size={16} strokeWidth={2.2} />
            {f.label}
          </Chip>
        ))}
      </div>

      {err && (
        <div role="alert"
          className="flex items-center justify-between gap-3 px-3.5 py-2.5 mb-3"
          style={{
            borderRadius: 'var(--radius-ctl)',
            background: 'color-mix(in srgb, var(--color-danger) 10%, var(--surface))',
            border: '2px solid color-mix(in srgb, var(--color-danger) 40%, transparent)',
          }}>
          <span className="text-sm font-semibold" style={{ color: 'color-mix(in srgb, var(--color-danger) 70%, var(--color-bone))' }}>⚠️ {err}</span>
          <button onClick={() => setErr('')} aria-label="关闭提示" className="text-xs font-bold shrink-0" style={{ color: 'var(--color-ash)' }}>知道了</button>
        </div>
      )}

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
                      whileTap={{ scale: 0.97 }}
                      onClick={() => handleStatusChange(order.id, action.next)}
                      className="px-3.5 min-h-[44px] text-xs font-bold flex items-center gap-1 shrink-0"
                      style={{
                        borderRadius: 'var(--radius-ctl)',
                        background: action.gradient,
                        color: action.color,
                      }}
                    >
                      <Icon name={action.icon} size={15} strokeWidth={2.4} /> {action.text}
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
