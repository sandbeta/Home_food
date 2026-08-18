import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import Header from '../components/Header'
import FullBleedHero from '../components/FullBleedHero'
import KissIcon from '../components/KissIcon'
import { HERO_IMAGES } from '../theme/images'
import { ORDER_STATUS } from '../theme/persona'

const STATUS_MAP = {
  pending: { ...ORDER_STATUS.pending, bar: ORDER_STATUS.pending.ring[1] },
  preparing: { ...ORDER_STATUS.preparing, bar: ORDER_STATUS.preparing.ring[1] },
  completed: { ...ORDER_STATUS.completed, bar: ORDER_STATUS.completed.ring[1] },
}

const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } }
const item = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0 } }

export default function MyOrders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetch('/api/orders').then(r => r.json()).then(d => { setOrders(d); setLoading(false) }) }, [])

  return (
    <div className="relative">
      <FullBleedHero src={HERO_IMAGES.orders} variant="immersive" alt="我们的订单" />

      <Header title="我们的订单" subtitle={orders.length > 0 ? `一共 ${orders.length} 笔` : ''} />

      <div className="px-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="relative">
              <motion.div className="text-5xl" animate={{ y: [0, -6, 0], rotate: [0, 3, -3, 0] }} transition={{ duration: 2, repeat: Infinity }}>📋</motion.div>
              <motion.div className="absolute -inset-4 rounded-full opacity-20"
                animate={{ scale: [1, 1.15, 1], opacity: [0.1, 0.25, 0.1] }}
                transition={{ duration: 2, repeat: Infinity }}
                style={{ background: 'radial-gradient(circle, rgba(230,178,90,0.20), transparent 70%)' }} />
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
              style={{ background: 'radial-gradient(circle, rgba(230,178,90,0.18), transparent 70%)' }} />
            <div className="absolute bottom-12 left-1/4 w-24 h-24 rounded-full opacity-10"
              style={{ background: 'radial-gradient(circle, rgba(194,199,210,0.16), transparent 70%)' }} />
            <motion.div
              className="text-7xl mb-5 relative z-10"
              animate={{ y: [0, -8, 0], rotate: [0, -3, 3, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            >
              📋
            </motion.div>
            <p className="text-[var(--color-bone)] mb-1 font-bold relative z-10">还没有下过单</p>
            <p className="text-[var(--color-ash)] text-sm mb-6 relative z-10">快去一起选点好吃的吧~</p>
            <Link to="/menu" className="d3-btn d3-btn-primary text-[#2A1E0E] px-8 py-3 rounded-2xl text-sm font-bold relative z-10"
              style={{ boxShadow: '0 4px 15px rgba(230,178,90,0.30)' }}>去选菜</Link>
          </motion.div>
        ) : (
          <motion.div className="space-y-3" variants={container} initial="hidden" animate="show">
            {orders.map(order => {
              const status = STATUS_MAP[order.status] || STATUS_MAP.pending
              const itemNames = order.items.map(i => `${i.dish_name}×${i.quantity}`).join('、')
              return (
                <Link key={order.id} to={`/orders/${order.id}`}>
                  <motion.div variants={item} whileTap={{ scale: 0.98 }} whileHover={{ y: -1 }}
                    className="d3-card overflow-hidden transition-shadow duration-200">
                    <div className="d3-card-face">
                      <div className="h-1" style={{ background: `linear-gradient(90deg, ${status.bar}88, ${status.bar}22)` }} />
                      <div className="flex">
                        <div className="w-1 shrink-0" style={{ background: status.bar }} />
                        <div className="p-3.5 flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-[var(--color-ash)] flex items-center gap-1">
                              <svg className="w-3 h-3 opacity-50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                              </svg>
                              {new Date(order.created_at).toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <span className="text-[11px] px-2.5 py-0.5 rounded-full font-bold"
                              style={{ background: status.chipBg, color: status.chipColor, boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }}>{status.text}</span>
                          </div>
                          <p className="text-sm text-[var(--color-bone)] line-clamp-1 font-medium">{itemNames}</p>
                          <div className="flex items-center justify-between mt-2.5 pt-2.5 border-t border-[var(--color-glass-border)]">
                            <div className="flex items-center gap-1.5">
                              <KissIcon className="w-3.5 h-3.5 text-[var(--color-love)]" />
                              <span className="text-[15px] font-bold text-[var(--color-gold-soft)]">{order.total_price}</span>
                            </div>
                            {order.items.length > 0 && (
                              <div className="flex items-center gap-2">
                                <div className="flex -space-x-1.5">
                                  {order.items.slice(0, 3).map((it, idx) => (
                                    <div key={idx} className={`w-6 h-6 rounded-full border-2 border-[var(--color-ink-900)] flex items-center justify-center text-[9px] ${it.added_by === 'me' ? 'avatar-me' : 'avatar-partner'}`}>
                                      {it.added_by === 'me' ? '🐱' : '🐰'}
                                    </div>
                                  ))}
                                </div>
                                <svg className="w-3.5 h-3.5 text-[var(--color-ash)] opacity-40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="9 18 15 12 9 6" />
                                </svg>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </Link>
              )
            })}
          </motion.div>
        )}
      </div>
    </div>
  )
}
