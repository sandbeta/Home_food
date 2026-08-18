import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Header from '../components/Header'
import KissIcon from '../components/KissIcon'
import { orderStatusOf, PERSONA } from '../theme/persona'

const STATUS_FILTERS = [
  { value: '', label: '全部', emoji: '✨' },
  { value: 'pending', label: '等着呢', emoji: '⏳' },
  { value: 'preparing', label: '在做了', emoji: '👨‍🍳' },
  { value: 'completed', label: '做好啦', emoji: '✅' },
]
const PAYER_LABEL = { aa: 'AA', me: '我请', partner: 'TA请' }

// 状态推进按钮：pending→preparing 用铂；preparing→completed 用鼠尾草绿
const STATUS_ACTIONS = {
  pending: { next: 'preparing', text: '开始做', emoji: '🔥', gradient: PERSONA.partner.gradient, color: '#1A1D22', glow: 'rgba(194,199,210,0.3)' },
  preparing: { next: 'completed', text: '做好了', emoji: '✅', gradient: 'linear-gradient(135deg, #9DB39A, #7A9476)', color: '#14210F', glow: 'rgba(157,179,154,0.3)' },
}

const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } }
const item = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0 } }

export default function AdminOrders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')

  const loadOrders = () => {
    const url = filter ? `/api/orders?status=${filter}` : '/api/orders'
    fetch(url).then(r => r.json()).then(d => { setOrders(d); setLoading(false) })
  }
  useEffect(() => { loadOrders() }, [filter])

  const handleStatusChange = async (id, s) => {
    await fetch(`/api/orders/${id}/status`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: s }) })
    loadOrders()
  }

  return (
    <div>
      <Header title="厨房看板" subtitle={orders.length > 0 ? `${orders.length} 笔订单` : ''} />

      <div className="px-4">
        <div className="flex gap-2 overflow-x-auto pb-3 no-scrollbar">
          {STATUS_FILTERS.map(f => (
            <motion.button key={f.value} whileTap={{ scale: 0.95 }} onClick={() => setFilter(f.value)}
              className={`shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-semibold transition-all ${
                filter === f.value ? 'd3-btn d3-btn-primary text-[#2A1E0E]' : 'text-[var(--color-ash)] border border-[var(--color-glass-border)] bg-[var(--color-glass)]'
              }`}>
              <span>{f.emoji}</span>{f.label}
            </motion.button>
          ))}
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="relative">
              <motion.div className="text-5xl" animate={{ y: [0, -6, 0], rotate: [0, 3, -3, 0] }} transition={{ duration: 2, repeat: Infinity }}>📋</motion.div>
              <motion.div className="absolute -inset-4 rounded-full opacity-20"
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                style={{ background: 'radial-gradient(circle, rgba(230,178,90,0.35), transparent 70%)' }} />
            </div>
            <div className="flex items-center gap-1.5 mt-4">
              {[0, 1, 2].map(i => (
                <motion.div key={i} className="w-1.5 h-1.5 rounded-full bg-[var(--color-gold)]"
                  animate={{ scale: [1, 1.4, 1], opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }} />
              ))}
            </div>
            <p className="text-[var(--color-ash)] text-sm mt-2">加载中...</p>
          </div>
        ) : orders.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-20 relative overflow-hidden">
            <div className="absolute top-8 left-1/2 -translate-x-1/2 w-40 h-40 rounded-full opacity-15"
              style={{ background: 'radial-gradient(circle, rgba(230,178,90,0.35), transparent 70%)' }} />
            <motion.div className="text-7xl mb-5 animate-float relative z-10">📋</motion.div>
            <p className="text-[var(--color-ash)] relative z-10">暂时没有订单</p>
          </motion.div>
        ) : (
          <motion.div className="space-y-3" variants={container} initial="hidden" animate="show">
            {orders.map(order => {
              const status = orderStatusOf(order.status)
              const bar = status.ring[1]
              const action = STATUS_ACTIONS[order.status]
              const itemNames = order.items.map(i => `${i.dish_name}×${i.quantity}`).join('、')
              return (
                <motion.div key={order.id} variants={item} className="glass rounded-[var(--radius-card)] overflow-hidden">
                  <div className="h-1" style={{ background: `linear-gradient(90deg, ${bar}88, ${bar}22)` }} />
                  <div className="flex">
                    <div className="w-1 shrink-0" style={{ background: bar }} />
                    <div className="p-3.5 flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-[var(--color-ash)] font-mono bg-[var(--color-glass)] px-1.5 py-0.5 rounded border border-[var(--color-glass-border)]">#{order.id}</span>
                          {order.payer && <span className="text-[10px] bg-[var(--color-glass)] text-[var(--color-ash)] px-2 py-0.5 rounded-full font-semibold border border-[var(--color-glass-border)]">{PAYER_LABEL[order.payer]}</span>}
                        </div>
                        <span className="text-[11px] px-2.5 py-0.5 rounded-full font-bold" style={{ background: status.chipBg, color: status.chipColor }}>{status.text}</span>
                      </div>
                      <p className="text-sm text-[var(--color-bone)] line-clamp-1 font-medium">{itemNames}</p>
                      {order.note && (
                        <div className="mt-1.5 px-2 py-1.5 rounded-lg relative overflow-hidden bg-[var(--color-glass)] border border-[var(--color-glass-border)]">
                          <div className="absolute left-0 top-0 bottom-0 w-0.5 rounded-full" style={{ background: 'var(--color-gold)' }} />
                          <p className="text-xs text-[var(--color-ash)] pl-1.5 flex items-center gap-1">💬 {order.note}</p>
                        </div>
                      )}
                      <div className="flex items-center justify-between mt-2.5 pt-2.5 border-t border-[var(--color-glass-border)]">
                        <div className="flex items-center gap-1.5">
                          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--color-glass)] border border-[var(--color-glass-border)]">
                            <KissIcon className="w-3 h-3 text-[var(--color-love)]" />
                            <span className="text-[15px] font-bold text-[var(--color-gold-soft)]">¥{order.total_price}</span>
                          </div>
                          <span className="text-[11px] text-[var(--color-ash)]">
                            {new Date(order.created_at).toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        {action && (
                          <motion.button whileTap={{ scale: 0.95 }} whileHover={{ scale: 1.03 }}
                            onClick={() => handleStatusChange(order.id, action.next)}
                            className="px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-shadow duration-200 hover:scale-105 active:scale-95"
                            style={{ background: action.gradient, color: action.color, boxShadow: `0 2px 10px ${action.glow}` }}>
                            {action.emoji} {action.text}
                          </motion.button>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </motion.div>
        )}
      </div>
    </div>
  )
}
