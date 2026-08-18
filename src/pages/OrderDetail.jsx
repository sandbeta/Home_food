import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import Header from '../components/Header'
import GlassCard from '../components/GlassCard'
import FullBleedHero from '../components/FullBleedHero'
import D3StatusRing from '../components/D3StatusRing'
import KissIcon from '../components/KissIcon'
import { HERO_IMAGES } from '../theme/images'
import { ORDER_STATUS, PAYER } from '../theme/persona'

const STATUS_MAP = {
  pending: { ...ORDER_STATUS.pending, emoji: '⏳', desc: '交给厨房啦，等着就好~' },
  preparing: { ...ORDER_STATUS.preparing, emoji: '👨‍🍳', desc: '正在努力做呢，快好了~' },
  completed: { ...ORDER_STATUS.completed, emoji: '🎉', desc: '快来吃吧，趁热~' },
}

export default function OrderDetail() {
  const { id } = useParams()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/orders/${id}`).then(r => r.json())
      .then(data => { setOrder(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [id])

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-32">
      <div className="relative">
        <motion.div className="text-5xl" animate={{ y: [0, -8, 0], rotate: [0, 5, -5, 0] }} transition={{ duration: 2, repeat: Infinity }}>🍳</motion.div>
        <motion.div className="absolute -inset-6 rounded-full opacity-15"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          style={{ background: 'radial-gradient(circle, rgba(200,104,63,0.18), transparent 70%)' }} />
      </div>
    </div>
  )

  if (!order) return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-32 relative overflow-hidden">
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-48 h-48 rounded-full opacity-10"
        style={{ background: 'radial-gradient(circle, rgba(200,104,63,0.18), transparent 70%)' }} />
      <motion.div className="text-7xl mb-4 relative z-10" animate={{ y: [0, -6, 0] }} transition={{ duration: 2.5, repeat: Infinity }}>😵</motion.div>
      <p className="text-[var(--color-ash)] relative z-10 font-medium">找不到这个订单了</p>
      <Link to="/orders" className="mt-4 d3-btn d3-btn-primary text-[#2A1E0E] text-xs font-semibold px-4 py-2 rounded-full relative z-10">
        回到订单列表
      </Link>
    </motion.div>
  )

  const status = STATUS_MAP[order.status] || STATUS_MAP.pending
  const payer = PAYER[order.payer] || PAYER.aa

  return (
    <div className="relative">
      <FullBleedHero src={HERO_IMAGES.order} variant="immersive" alt="订单详情" />

      <Header title="订单详情"
        right={<Link to="/orders" className="text-xs text-[var(--color-clay)] font-semibold bg-[var(--color-clay)]/10 px-3 py-1.5 rounded-full">全部订单</Link>} />

      <div className="px-4 space-y-3">
        <GlassCard>
          <div className="p-5 text-center overflow-hidden relative">
            <div className="relative z-10">
              <D3StatusRing config={{ ring: status.ring }} />
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
                className="inline-block px-4 py-1 rounded-full text-sm font-bold"
                style={{ background: status.chipBg, color: status.chipColor }}>{status.text}</motion.span>
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
                className="text-[var(--color-ash)] text-sm mt-2">{status.desc}</motion.p>
            </div>
          </div>
        </GlassCard>

        <GlassCard delay={0.1}>
          <div className="p-4">
            <h2 className="font-bold text-sm text-[var(--color-bone)] mb-3 flex items-center gap-2">
              📝 都选了啥
            </h2>
            <div className="space-y-1">
              {order.items.map((item, idx) => (
                <motion.div key={item.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 + idx * 0.04 }}
                  className="flex items-center justify-between rounded-lg px-2 py-1.5 -mx-2 hover:bg-white/5 transition-colors duration-150 relative group">
                  <div className="absolute left-0 top-1 bottom-1 w-0.5 rounded-full group-hover:bg-[var(--color-clay)]/40 transition-colors duration-150" />
                  <div className="flex items-center gap-2.5">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] ${item.added_by === 'me' ? 'avatar-me' : 'avatar-partner'}`}>
                      {item.added_by === 'me' ? '🐱' : '🐰'}
                    </div>
                    <span className="text-sm text-[var(--color-bone)] font-medium">{item.dish_name}</span>
                    <span className="text-xs text-[var(--color-ash)]">×{item.quantity}</span>
                  </div>
                  <div className="flex items-center gap-0.5">
                    <KissIcon className="w-3 h-3 text-[var(--color-love)]" />
                    <span className="text-sm font-bold text-[var(--color-clay-soft)]">{(item.price * item.quantity).toFixed(0)}</span>
                  </div>
                </motion.div>
              ))}
            </div>
            <div className="mt-3 pt-3 relative">
              <div className="absolute inset-x-0 top-0 h-px"
                style={{ background: 'linear-gradient(90deg, transparent, var(--color-glass-border) 20%, var(--color-glass-border) 80%, transparent)' }} />
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-[var(--color-clay-soft)]">合计</span>
                  {order.payer && <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                    style={{ background: payer.border, color: payer.label === 'AA' ? 'var(--color-ash)' : (order.payer === 'me' ? 'var(--color-clay-soft)' : 'var(--color-sage-soft)') }}>{payer.label}</span>}
                </div>
                <div className="flex items-center gap-1">
                  <KissIcon className="w-4 h-4 text-[var(--color-love)]" />
                  <span className="text-[20px] font-bold text-[var(--color-clay-soft)]">{order.total_price}</span>
                </div>
              </div>
            </div>
          </div>
        </GlassCard>

        {order.note && (
          <GlassCard delay={0.2}>
            <div className="p-3.5 relative overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-1" style={{ background: 'linear-gradient(to bottom, var(--color-clay-soft), var(--color-sage))' }} />
              <div className="flex items-center gap-1.5 mb-1 pl-1">
                <span className="text-sm">💬</span>
                <span className="text-xs text-[var(--color-ash)] font-semibold">备注</span>
              </div>
              <p className="text-sm text-[var(--color-bone)] pl-1">{order.note}</p>
            </div>
          </GlassCard>
        )}

        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
          className="text-center text-xs text-[var(--color-ash)] py-3 flex items-center justify-center gap-1.5">
          <svg className="w-3 h-3 opacity-40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
          </svg>
          {new Date(order.created_at).toLocaleString('zh-CN')}
        </motion.p>
      </div>
    </div>
  )
}
