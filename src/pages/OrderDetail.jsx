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
import { pickOne, DETAIL_TITLES, ORDER_STATUS_DESC } from '../lib/sweetCopy'
import { settle, vibrate } from '../lib/sfx'
import { requestJson } from '../lib/request'

/* m-5 修：三条状态口吻文案内联 → 迁至 sweetCopy.ORDER_STATUS_DESC 单源
   批 2a · 从三档扩到六档：pending / cutting / cooking / plating / completed + 旧 preparing 别名（走 cooking 视觉） */
const STATUS_MAP = {
  pending: { ...ORDER_STATUS.pending, emoji: '⏳', desc: ORDER_STATUS_DESC.pending },
  preparing: { ...ORDER_STATUS.preparing, emoji: '👨‍🍳', desc: ORDER_STATUS_DESC.preparing },
  cutting: { ...ORDER_STATUS.cutting, emoji: '🔪', desc: ORDER_STATUS_DESC.cutting },
  cooking: { ...ORDER_STATUS.cooking, emoji: '🍳', desc: ORDER_STATUS_DESC.cooking },
  plating: { ...ORDER_STATUS.plating, emoji: '🍽️', desc: ORDER_STATUS_DESC.plating },
  completed: { ...ORDER_STATUS.completed, emoji: '🎉', desc: ORDER_STATUS_DESC.completed },
}

// 灶火接力：订单未完成时低频拉状态（12s 一查，切后台不查、完成即停）。
// 真实流转（后台点菜推进）到达的那一秒，才给"火点着了/起锅了"的即时反馈。
const POLL_MS = 12000
const BUMP_MS = 1300
/* 批 2a · 跑灯扩到五段（preparing 不列入 flow，历史订单归一化到 cooking 后进同一路径） */
const STATUS_FLOW = ['pending', 'cutting', 'cooking', 'plating', 'completed']
// 归一化：历史 status='preparing' 视为 cooking，让"当前段"高亮能落在 flow 里
const normalize = (s) => s === 'preparing' ? 'cooking' : s

export default function OrderDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  // B2 修：区分「订单不存在（404）」与「网络失败/服务端挂了」——前者走 EmptyState 找不到态，
  // 后者走 error 态 + 再试一次；以前两种混在一起，且 404 body truthy 时被 setOrder 收下 → 抛错白屏。
  const [fetchErr, setFetchErr] = useState(null) // 'notfound' | 'network'
  const [pageTitle] = useState(() => pickOne(DETAIL_TITLES))
  const reduce = usePrefersReducedMotion()
  const [bump, setBump] = useState(null) // 'ignite' | 'serve' | null：真实流转到达的一记反馈
  const statusRef = useRef(null)
  const bumpTimerRef = useRef(null)
  const [reload, setReload] = useState(0)

  const fireBump = (kind) => {
    setBump(kind)
    if (kind === 'ignite') { settle(); vibrate([16, 60, 24]) }
    else vibrate(30)
    clearTimeout(bumpTimerRef.current)
    bumpTimerRef.current = setTimeout(() => setBump(null), BUMP_MS)
  }

  useEffect(() => {
    let dead = false
    setFetchErr(null); setLoading(true); statusRef.current = null
    // B2 修：走 requestJson（自带 r.ok），404 → 'notfound'，其它错误/超时 → 'network'
    requestJson(`/api/orders/${id}`).then(r => r.json())
      .then(data => {
        if (dead) return
        if (!data || typeof data !== 'object' || !data.id) { setOrder(null); setFetchErr('notfound'); setLoading(false); return }
        setOrder(data)
        setLoading(false)
        statusRef.current = data.status
      })
      .catch((err) => {
        if (dead) return
        setLoading(false)
        setOrder(null)
        setFetchErr(err && err.status === 404 ? 'notfound' : 'network')
      })

    // 低频接力：未完成才轮询；标签页隐藏时跳过本轮，completed 后永不再发
    const timer = setInterval(() => {
      if (dead || document.hidden) return
      if (!statusRef.current || statusRef.current === 'completed') return
      requestJson(`/api/orders/${id}`).then(r => r.json()).then(next => {
        if (dead || !next || !next.status) return
        const prev = normalize(statusRef.current)
        const now = normalize(next.status)
        statusRef.current = next.status
        if (now !== prev) {
          // 只在真实前进流转时报喜（五档 flow 里索引前进：pending→cutting 亮火、plating→completed 起锅）
          if (STATUS_FLOW.indexOf(now) > STATUS_FLOW.indexOf(prev)) {
            fireBump(now === 'cutting' || now === 'cooking' ? 'ignite' : 'serve')
          }
        }
        setOrder(next)
      }).catch(() => {})
    }, POLL_MS)
    return () => { dead = true; clearInterval(timer); clearTimeout(bumpTimerRef.current) }
  }, [id, reload])

  if (loading) return <LoadingState text="正在查订单..." />

  if (!order || !Array.isArray(order.items)) return (
    <EmptyState
      emoji={fetchErr === 'network' ? '📡' : '😵'} tone="error"
      title={fetchErr === 'network' ? '厨房暂时断联' : '找不到这个订单了'}
      desc={fetchErr === 'network' ? '网络不稳，稍等一下再试' : '它可能已被删除，或者链接不对~'}
      action={
        fetchErr === 'network' ? (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setReload(r => r + 1)}
            className="d3-btn d3-btn-primary px-5 py-2.5 text-sm font-bold"
          >再试一次</motion.button>
        ) : (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/orders')}
            className="d3-btn d3-btn-primary px-5 py-2.5 text-sm font-bold"
          >回到订单列表</motion.button>
        )
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
        right={<Link to="/orders" className="inline-flex items-center min-h-[44px] text-xs text-[var(--color-clay-text)] font-semibold bg-[var(--color-clay)]/10 px-3 rounded-full">全部订单</Link>}
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
              {/* 三段跑灯（V3 设计稿）：当前段 clay 实底，已走完的段转 sage ——
                  状态不再是页脚一枚小胶囊，而是灶台上方一整排"进度灯"。 */}
              <div className="flex gap-2 mb-4">
                {STATUS_FLOW.map((key, idx) => {
                  const s = STATUS_MAP[key]
                  const cur = STATUS_FLOW.indexOf(normalize(order.status))
                  const isNow = idx === cur
                  const isDone = idx < cur
                  return (
                    <motion.span
                      key={key}
                      initial={false}
                      animate={isNow && !reduce ? {
                        scale: [1, 1.06, 1],
                        boxShadow: [
                          `0 0 0 0 color-mix(in srgb, ${s.ring[1]} 0%, transparent)`,
                          `0 0 0 7px color-mix(in srgb, ${s.ring[1]} 26%, transparent)`,
                          `0 0 0 0 color-mix(in srgb, ${s.ring[1]} 0%, transparent)`,
                        ],
                      } : { scale: 1, boxShadow: '0 0 0 0 transparent' }}
                      transition={{ duration: 0.9, ease: EASE }}
                      className={`status-seg ${isNow ? 'is-now' : isDone ? 'is-done' : ''}`}
                    >
                      <span aria-hidden>{s.emoji}</span>
                      {s.text}
                    </motion.span>
                  )
                })}
              </div>

              <StoveStage statusKey={order.status} createdAt={order.created_at} />
              <motion.p key={`desc-${order.status}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
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
                  className="flex items-center justify-between rounded-lg px-2 py-1.5 -mx-2 transition-colors duration-150 relative group">
                  <div className="absolute left-0 top-1 bottom-1 w-0.5 rounded-full group-hover:bg-[var(--color-clay)]/40 transition-colors duration-150" />
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs shrink-0 ${item.added_by === 'me' ? 'avatar-me' : 'avatar-partner'}`}>
                      {item.added_by === 'me' ? '🐱' : '🐑'}
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
                    style={{ background: payer.fill, color: payer.label === 'AA' ? 'var(--color-on-dark)' : (order.payer === 'me' ? 'var(--color-on-dark)' : 'var(--color-on-sage)') }}>{payer.label}</span>}
                </div>
                <div className="flex items-center gap-1">
                  <KissIcon className="w-4 h-4 text-[var(--color-love)]" />
                  <span className="font-serif text-3xl font-bold text-[var(--color-caramel)] tabular-nums"><span className="text-[0.7em] mr-0.5">¥</span>{order.total_price}</span>
                </div>
              </div>
              {/* 批 4a · AA 结算快照（家庭语义=各付各的）：payer=aa 时展开两人应付；历史订单从 items 现算兜底 */}
              {order.payer === 'aa' && (() => {
                const meOwed = Number.isFinite(order.owed_me) ? order.owed_me
                  : (order.items || []).filter(i => i.added_by === 'me').reduce((s, i) => s + (Number(i.price) || 0) * (Number(i.quantity) || 0), 0)
                const pOwed = Number.isFinite(order.owed_partner) ? order.owed_partner
                  : (order.items || []).filter(i => i.added_by === 'partner').reduce((s, i) => s + (Number(i.price) || 0) * (Number(i.quantity) || 0), 0)
                return (
                  <div className="flex justify-end items-center gap-3 mt-1.5 text-xs">
                    <span className="text-[var(--color-ash)]">
                      🐱 <span className="font-serif font-bold text-[var(--color-caramel)] tabular-nums">¥{meOwed}</span>
                    </span>
                    <span aria-hidden className="opacity-40">·</span>
                    <span className="text-[var(--color-ash)]">
                      🐑 <span className="font-serif font-bold text-[var(--color-caramel)] tabular-nums">¥{pOwed}</span>
                    </span>
                  </div>
                )
              })()}
            </div>
          </div>
        </GlassCard>

        {/* 备注 / 批 1 · 便签纸：有 sticker 优先展示便签（贴灶台上的小纸条），否则回落到纯文字备注 */}
        {order.sticker && order.sticker.msg ? (
          <GlassCard delay={0.2}>
            <div className="relative overflow-visible p-4 flex items-start justify-center">
              <div
                className="relative w-full"
                style={{
                  background: (() => {
                    /* 与 StickerEditor 共 4 色，走 @theme 令牌单源（批 1 便签世界件）*/
                    const map = {
                      rose: 'linear-gradient(180deg, var(--sticker-rose-a), var(--sticker-rose-b))',
                      sage: 'linear-gradient(180deg, var(--sticker-sage-a), var(--sticker-sage-b))',
                      apricot: 'linear-gradient(180deg, var(--sticker-apricot-a), var(--sticker-apricot-b))',
                      sky: 'linear-gradient(180deg, var(--sticker-sky-a), var(--sticker-sky-b))',
                    }
                    return map[order.sticker.bg] || map.rose
                  })(),
                  color: 'var(--color-bone)',
                  borderRadius: 4,
                  transform: 'rotate(-1.2deg)',
                  boxShadow: '0 6px 18px rgba(43,36,41,0.14), inset 0 1px 0 rgba(255,255,255,0.5)',
                  padding: '22px 18px 16px',
                }}
              >
                <span
                  className="absolute -top-3 left-1/2 -translate-x-1/2 text-2xl select-none"
                  style={{ filter: 'drop-shadow(0 2px 2px rgba(43,36,41,0.28))' }}
                  aria-hidden="true"
                >{order.sticker.pin || '💕'}</span>
                <p
                  className="text-[15px] leading-relaxed whitespace-pre-wrap"
                  style={{ fontStyle: 'italic', fontFamily: '"Ma Shan Zheng", "KaiTi", "STKaiti", cursive, serif' }}
                >{order.sticker.msg}</p>
                {order.note && (
                  <p className="text-xs mt-2 pt-2 opacity-70" style={{ borderTop: '1px dashed rgba(43,36,41,0.16)' }}>
                    给厨房：{order.note}
                  </p>
                )}
              </div>
            </div>
          </GlassCard>
        ) : order.note ? (
          <GlassCard delay={0.2}>
            <div className="p-3.5 relative overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-1" style={{ background: 'linear-gradient(to bottom, var(--color-clay), var(--color-sage))' }} />
              <div className="flex items-center gap-1.5 mb-1 pl-1">
                <span className="text-sm" aria-hidden="true">💬</span>
                <span className="text-xs text-[var(--color-ash)] font-semibold">备注</span>
              </div>
              <p className="text-sm text-[var(--color-bone)] pl-1">{order.note}</p>
            </div>
          </GlassCard>
        ) : null}

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
