import { useState, useEffect, useRef } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import PageHeader from '../components/PageHeader'
import GlassCard from '../components/GlassCard'
import FullBleedHero from '../components/FullBleedHero'
import StoveStage from '../components/StoveStage'
import KissIcon from '../components/KissIcon'
import PageContainer from '../components/ui/PageContainer'
import EmptyState from '../components/ui/EmptyState'
import LoadingState from '../components/ui/LoadingState'
import { HERO_IMAGES } from '../theme/images'
import { ORDER_STATUS, PAYER } from '../theme/persona'
import { EASE, usePrefersReducedMotion } from '../theme/motion'
import { pickOne, DETAIL_TITLES } from '../lib/sweetCopy'
import { settle, vibrate } from '../lib/sfx'

const STATUS_MAP = {
  pending: { ...ORDER_STATUS.pending, emoji: '⏳', desc: '交给厨房啦，等着就好~' },
  preparing: { ...ORDER_STATUS.preparing, emoji: '👨‍🍳', desc: '正在努力做呢，快好了~' },
  completed: { ...ORDER_STATUS.completed, emoji: '🎉', desc: '快来吃吧，趁热~' },
}

// 灶火接力：订单未完成时低频拉状态（12s 一查，切后台不查、完成即停）。
// 真实流转（后台点菜推进）到达的那一秒，才给"火点着了/起锅了"的即时反馈。
const POLL_MS = 12000
const BUMP_MS = 1300
const STATUS_FLOW = ['pending', 'preparing', 'completed']

export default function OrderDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [pageTitle] = useState(() => pickOne(DETAIL_TITLES))
  const reduce = usePrefersReducedMotion()
  const [bump, setBump] = useState(null) // 'ignite' | 'serve' | null：真实流转到达的一记反馈
  const statusRef = useRef(null)
  const bumpTimerRef = useRef(null)

  const fireBump = (kind) => {
    setBump(kind)
    if (kind === 'ignite') { settle(); vibrate([16, 60, 24]) }
    else vibrate(30)
    clearTimeout(bumpTimerRef.current)
    bumpTimerRef.current = setTimeout(() => setBump(null), BUMP_MS)
  }

  useEffect(() => {
    let dead = false
    fetch(`/api/orders/${id}`).then(r => r.json())
      .then(data => {
        if (dead) return
        setOrder(data)
        setLoading(false)
        statusRef.current = data.status
      })
      .catch(() => { if (!dead) setLoading(false) })

    // 低频接力：未完成才轮询；标签页隐藏时跳过本轮，completed 后永不再发
    const timer = setInterval(() => {
      if (dead || document.hidden) return
      if (!statusRef.current || statusRef.current === 'completed') return
      fetch(`/api/orders/${id}`).then(r => (r.ok ? r.json() : null)).then(next => {
        if (dead || !next || !next.status) return
        const prev = statusRef.current
        statusRef.current = next.status
        if (next.status !== prev) {
          // 只在真实前进流转时报喜（completed 必 bump；pending→preparing 点火）
          if (STATUS_FLOW.indexOf(next.status) > STATUS_FLOW.indexOf(prev)) {
            fireBump(next.status === 'preparing' ? 'ignite' : 'serve')
          }
        }
        setOrder(next)
      }).catch(() => {})
    }, POLL_MS)
    return () => { dead = true; clearInterval(timer); clearTimeout(bumpTimerRef.current) }
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
        title={pageTitle}
        back
        right={<Link to="/orders" className="text-xs text-[var(--color-clay)] font-semibold bg-[var(--color-clay)]/10 px-3 py-1.5 rounded-full">全部订单</Link>}
      />

      <PageContainer>
        {/* 灶台舞台：熄火 / 点火焖煮 / 起锅，三态各有戏 */}
        <GlassCard>
          <div className="p-5 text-center overflow-hidden relative">
            {/* 灶火接力·点火：pending→preparing 到达的一刻，一束光晕从灶台绽放（一次性，1.3s 自熄） */}
            <AnimatePresence>
              {bump === 'ignite' && !reduce && (
                <motion.div
                  key="ignite"
                  className="absolute inset-0 pointer-events-none z-20"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 1, 0.85, 0] }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1.2, ease: EASE, times: [0, 0.18, 0.5, 1] }}
                  style={{
                    background: 'radial-gradient(circle at 50% 62%, color-mix(in srgb, var(--clay-50) 26%, transparent), transparent 62%)',
                  }}
                />
              )}
            </AnimatePresence>
            <div className="relative z-10">
              <StoveStage statusKey={order.status} createdAt={order.created_at} />
              {/* key=状态：流转到达即重挂，chip 以 ORDER_STATUS 新色脉冲一次（reduced 只淡入换色） */}
              <motion.span
                key={order.status}
                initial={{ opacity: 0 }}
                animate={reduce ? { opacity: 1 } : {
                  opacity: 1,
                  scale: order.status === 'pending' ? 1 : [1, 1.12, 1],
                  boxShadow: order.status === 'pending'
                    ? '0 0 0 0 transparent'
                    : [
                        `0 0 0 0 color-mix(in srgb, ${status.ring[1]} 0%, transparent)`,
                        `0 0 0 7px color-mix(in srgb, ${status.ring[1]} 26%, transparent)`,
                        `0 0 0 0 color-mix(in srgb, ${status.ring[1]} 0%, transparent)`,
                      ],
                }}
                transition={{ delay: 0.4, duration: reduce ? 0.2 : 0.9, ease: EASE }}
                className="inline-block px-4 py-1 rounded-full text-sm font-bold"
                style={{ background: status.chipBg, color: status.chipColor }}>{status.text}</motion.span>
              <motion.p key={`desc-${order.status}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
                className="text-[var(--color-ash)] text-sm mt-2">{status.desc}</motion.p>
            </div>
          </div>
        </GlassCard>

        {/* 菜品明细 + 谁买单 + 合计 */}
        <GlassCard delay={0.1}>
          <div className="p-4">
            <h2 className="font-sans font-bold text-sm text-[var(--color-bone)] mb-3 flex items-center gap-2">
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
                    <span className="text-sm font-bold text-[var(--color-caramel)]"><span className="text-[0.75em] mr-px">¥</span>{(item.price * item.quantity).toFixed(0)}</span>
                  </div>
                </motion.div>
              ))}
            </div>
            <div className="mt-3 pt-3 relative">
              <div className="absolute inset-x-0 top-0 h-px"
                style={{ background: 'linear-gradient(90deg, transparent, var(--color-glass-border) 20%, var(--color-glass-border) 80%, transparent)' }} />
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-[var(--color-bone)]">合计</span>
                  {order.payer && <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                    style={{ background: payer.fill, color: payer.label === 'AA' ? '#FFFDF9' : (order.payer === 'me' ? '#FFFDF9' : '#1A2417') }}>{payer.label}</span>}
                </div>
                <div className="flex items-center gap-1">
                  <KissIcon className="w-4 h-4 text-[var(--color-love)]" />
                  <span className="font-serif text-2xl font-bold text-[var(--color-caramel)] tabular-nums"><span className="text-[0.7em] mr-0.5">¥</span>{order.total_price}</span>
                </div>
              </div>
            </div>
          </div>
        </GlassCard>

        {/* 备注 */}
        {order.note && (
          <GlassCard delay={0.2}>
            <div className="p-3.5 relative overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-1" style={{ background: 'linear-gradient(to bottom, var(--color-clay), var(--color-sage))' }} />
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
