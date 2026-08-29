import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import PageHeader from '../components/PageHeader'
import GlassCard from '../components/GlassCard'
import FullBleedHero from '../components/FullBleedHero'
import D3StatusRing from '../components/D3StatusRing'
import KissIcon from '../components/KissIcon'
import PageContainer from '../components/ui/PageContainer'
import EmptyState from '../components/ui/EmptyState'
import LoadingState from '../components/ui/LoadingState'
import { HERO_IMAGES } from '../theme/images'
import { ORDER_STATUS, PAYER } from '../theme/persona'

const STATUS_MAP = {
  pending: { ...ORDER_STATUS.pending, emoji: '⏳', desc: '交给厨房啦，等着就好~' },
  preparing: { ...ORDER_STATUS.preparing, emoji: '👨‍🍳', desc: '正在努力做呢，快好了~' },
  completed: { ...ORDER_STATUS.completed, emoji: '🎉', desc: '快来吃吧，趁热~' },
}

export default function OrderDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/orders/${id}`).then(r => r.json())
      .then(data => { setOrder(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [id])

  if (loading) return <LoadingState emoji="🍳" text="正在查订单..." />

  if (!order) return (
    <EmptyState
      emoji="😵"
      title="找不到这个订单了"
      desc="它可能已被删除，或者链接不对~"
      action={
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/orders')}
          className="d3-btn d3-btn-primary px-5 py-2.5 text-sm font-bold"
        >
          回到订单列表
        </motion.button>
      }
    />
  )

  const status = STATUS_MAP[order.status] || STATUS_MAP.pending
  const payer = PAYER[order.payer] || PAYER.aa

  return (
    <div className="relative">
      <FullBleedHero src={HERO_IMAGES.order} variant="immersive" alt="订单详情" />

      <PageHeader
        title="订单详情"
        back
        right={<Link to="/orders" className="text-xs text-[var(--color-clay)] font-semibold bg-[var(--color-clay)]/10 px-3 py-1.5 rounded-full">全部订单</Link>}
      />

      <PageContainer>
        {/* 状态环（尺寸令牌 --ring-size，见 D3StatusRing） */}
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

        {/* 菜品明细 + 谁买单 + 合计 */}
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
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs shrink-0 ${item.added_by === 'me' ? 'avatar-me' : 'avatar-partner'}`}>
                      {item.added_by === 'me' ? '🐱' : '🐰'}
                    </div>
                    <span className="text-sm text-[var(--color-bone)] font-medium truncate">{item.dish_name}</span>
                    <span className="text-xs text-[var(--color-ash)] shrink-0">×{item.quantity}</span>
                  </div>
                  <div className="flex items-center gap-0.5 shrink-0">
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
                  <span className="font-serif text-xl font-bold text-[var(--color-clay-soft)] tabular-nums">{order.total_price}</span>
                </div>
              </div>
            </div>
          </div>
        </GlassCard>

        {/* 备注 */}
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

        {/* 时间戳 */}
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
          className="text-center text-xs text-[var(--color-ash)] pb-2 flex items-center justify-center gap-1.5">
          <svg className="w-3 h-3 opacity-40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
          </svg>
          {new Date(order.created_at).toLocaleString('zh-CN')}
        </motion.p>
      </PageContainer>
    </div>
  )
}
