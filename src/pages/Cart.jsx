import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useCart } from '../components/CartContext'
import PageHeader from '../components/PageHeader'
import ThemeToggle from '../components/ui/ThemeToggle'
import GlassCard from '../components/GlassCard'
import FullBleedHero from '../components/FullBleedHero'
import KissIcon from '../components/KissIcon'
import PageContainer from '../components/ui/PageContainer'
import PayerSelector from '../components/ui/PayerSelector'
import Stepper from '../components/ui/Stepper'
import EmptyState from '../components/ui/EmptyState'
import LazySheep from '../components/ui/LazySheep'
import StickerEditor from '../components/ui/StickerEditor'
import PurchaseListSheet from '../components/PurchaseListSheet'
import { getCategoryEmoji } from '../lib/categoryIcons'
import { HERO_IMAGES } from '../theme/images'
import { PERSONA } from '../theme/persona'
import { cardEntrance, EASE, usePrefersReducedMotion } from '../theme/motion'
import { pickOne, CART_TITLES, CART_NOTES, ORDER_PLACED_NOTE } from '../lib/sweetCopy'
import { tap, vibrate } from '../lib/sfx'
import { requestJson } from '../lib/request'
import { readAvoids, scanDishes } from '../lib/avoid'

/** 相对时间：ISO 字符串 → "刚刚 / N 分钟前 / N 小时前 / 昨天 / N 天前" */
function timeAgo(iso) {
  try {
    const diff = Date.now() - new Date(iso).getTime()
    const m = Math.floor(diff / 60000)
    if (m < 1) return '刚刚'
    if (m < 60) return `${m} 分钟前`
    const h = Math.floor(m / 60)
    if (h < 24) return `${h} 小时前`
    const d = Math.floor(h / 24)
    return d === 1 ? '昨天' : `${d} 天前`
  } catch { return '' }
}

/**
 * 购物车条目 —— V3 设计稿的"糖果清单行"：
 * 分类图鉴圆牌 + 菜名 + caramel 单价 + 步进器 + 移除。
 * 条目自己是一枚 2px 糖果描边小卡，坐在人格分组卡（我点的 / TA 点的）里面——
 * 卡套卡在这里是"清单纸片贴在分组封套上"的分组感，不是重复边框。
 * 步进器 36px 档（22–44 双档的中间档）：比页内 44px 收敛，又守住触达下限。
 */
function CartRow({ item, onUpdate, onRemove }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -15 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 15, height: 0 }}
      className="flex items-center gap-2.5 px-2.5 py-2 rounded-[var(--radius-tile)]"
      style={{ background: 'var(--surface)', border: '2px solid var(--color-line)' }}
    >
      <div
        className="w-9 h-9 shrink-0 rounded-[12px] flex items-center justify-center text-base"
        style={{ background: 'var(--color-ink-850)', border: '2px solid var(--color-line)' }}
      >
        {getCategoryEmoji(item.category)}
      </div>

      <div className="flex-1 min-w-0">
        {/* m-10 修：h3 会与 Cart 页 h1 之间缺 h2 中间层，读屏丢层级；条目是数据不是版面主角 → <p> */}
        <p className="font-sans font-semibold text-sm text-[var(--color-bone)] truncate m-0">{item.name}</p>
        <div className="flex items-center gap-1 mt-0.5">
          <KissIcon className="w-3 h-3 text-[var(--color-love)]" />
          <span className="font-serif text-sm font-bold text-[var(--color-caramel)] tabular-nums"><span className="text-[0.75em] mr-px">¥</span>{item.price}</span>
        </div>
      </div>

      <Stepper
        value={item.quantity}
        min={1}
        size={44}
        name={item.name}   /* 批4：补上 m-9 的无障碍名——否则一屏 8 行的 +/- 读屏全叫"增加/减少" */
        onChange={(v) => onUpdate(item.dish_id, v, item.added_by)}
      />

      <motion.button
        whileTap={{ scale: 0.94 }}
        onClick={() => onRemove(item.dish_id, item.added_by)}
        aria-label={`移除${item.name}`}
        className="w-11 h-11 rounded-full flex items-center justify-center shrink-0 text-[var(--color-ash)] active:text-[var(--color-danger)]"
        style={{ border: '2px solid var(--color-line)' }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </motion.button>
    </motion.div>
  )
}

/**
 * 购物车 + 结算（原 Cart 与 Checkout 合并）。
 *
 * 两者本就是同一流程的前后两段，却各自维护一份 PAYER_OPTIONS 常量与买单选择器，
 * 且 Checkout 页面没有任何返回入口（断头路）。合并后：
 *  - 消除重复的买单选择器（改用 ui/PayerSelector）
 *  - 页头带返回，不再有断头路
 *  - 少一次跳转
 */
export default function Cart() {
  const { items, totalPrice, totalCount, updateQuantity, removeItem, clearCart, whoAmI, shareCart, fetchSharedCart, mergeSharedCart } = useCart()
  const [note, setNote] = useState('')
  const [sticker, setSticker] = useState(null) // 批 1 · 便签留言条 {bg,pin,msg}
  const [payer, setPayer] = useState('aa')
  /* 批 2b · 采购清单底部 sheet */
  const [purchaseOpen, setPurchaseOpen] = useState(false)
  /* 批 5 · 跨设备分享 */
  const [shared, setShared] = useState(null)
  const [sharing, setSharing] = useState(false)
  const [shareDone, setShareDone] = useState(false)
  const [mergeDone, setMergeDone] = useState(false)
  /* 一键清空 · 两段式确认（清空会一次抹掉双方全部条目、不可逆 → 点一下先变「确认清空?」，4s 内再点才执行） */
  const [confirmClear, setConfirmClear] = useState(false)
  const [shareErr, setShareErr] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(false)
  /* 批 4b · 忌口扫描：命中时先拦一次让用户看，再点即放行（家庭场景"提示不阻断"） */
  const [avoidHit, setAvoidHit] = useState(null) // [{ dishName, hits:[{keyword, ingredient}] }]
  const [avoidConfirmed, setAvoidConfirmed] = useState(false)
  const [celebrating, setCelebrating] = useState(false)
  const skipRef = useRef(null)
  const clearTimerRef = useRef(null)
  const mountedRef = useRef(true)
  const reduce = usePrefersReducedMotion()
  const [pageTitle] = useState(() => pickOne(CART_TITLES))
  const [pageNote] = useState(() => pickOne(CART_NOTES))
  const navigate = useNavigate()

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      if (clearTimerRef.current) clearTimeout(clearTimerRef.current)
    }
  }, [])

  /* 批 5 · 挂载时拉一次服务端 sharedCart；若别人分享的（sharedBy !== whoAmI）且非空，提示合并 */
  useEffect(() => {
    let alive = true
    fetchSharedCart().then(d => { if (alive && d && Array.isArray(d.items) && d.items.length && d.sharedBy && d.sharedBy !== whoAmI) setShared(d) }).catch(() => {})
    return () => { alive = false }
  }, [fetchSharedCart, whoAmI])

  const handleShare = async () => {
    if (items.length === 0 || sharing) return
    setSharing(true); setShareErr(''); setShareDone(false)
    try {
      await shareCart()
      setShareDone(true)
      setTimeout(() => setShareDone(false), 2400)
    } catch { setShareErr('分享没成功，看看服务端还在不') }
    setSharing(false)
  }

  const handleMerge = () => {
    if (!shared) return
    mergeSharedCart(shared.items)
    setShared(null)
    setMergeDone(true)
    setTimeout(() => setMergeDone(false), 2400)
  }

  // 一键清空 · 两段式确认：首点进确认态（4s 自动取消），再点才真清
  const handleClear = () => {
    if (!confirmClear) {
      setConfirmClear(true)
      try { window.__cgAnnounce?.(`再点一次「确认清空」将清空购物车全部 ${totalCount} 件`) } catch {}
      if (clearTimerRef.current) clearTimeout(clearTimerRef.current)
      clearTimerRef.current = setTimeout(() => setConfirmClear(false), 4000)
      return
    }
    if (clearTimerRef.current) clearTimeout(clearTimerRef.current)
    setConfirmClear(false)
    clearCart()
    try { window.__cgAnnounce?.('购物车已清空') } catch {}
  }

  const meItems = items.filter((i) => i.added_by === 'me')
  const partnerItems = items.filter((i) => i.added_by === 'partner')
  const meTotal = meItems.reduce((s, i) => s + i.price * i.quantity, 0)
  const partnerTotal = partnerItems.reduce((s, i) => s + i.price * i.quantity, 0)

  const handleSubmit = async () => {
    if (items.length === 0 || submitting) return
    /* 批 4b · 提交前忌口扫描（首次拦，用户看后再点即放行） */
    const avoids = readAvoids()
    if (!avoidConfirmed && avoids.length > 0 && !avoidHit) {
      setSubmitting(true)
      try {
        const withRecipe = await Promise.all(items.map(async (i) => {
          try {
            const r = await requestJson(`/api/dishes/${i.dish_id}`)
            const d = await r.json()
            return { name: i.name, recipe: d && d.recipe }
          } catch { return { name: i.name, recipe: null } }
        }))
        const hits = scanDishes(withRecipe, avoids)
        if (hits.length > 0) {
          setAvoidHit(hits)
          setSubmitting(false)
          try { window.__cgAnnounce?.(`有 ${hits.length} 道菜含忌口，请看一眼`) } catch {}
          return
        }
      } catch { /* 扫不动不拦，让下单继续走 */ }
      setSubmitting(false)
    }
    setSubmitting(true)
    setSubmitError(false)
    try {
      // M-s5：走 requestJson，家庭服务端 hang 时 12s 后自动 abort → 走 catch 分支解禁按钮
      const res = await requestJson('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map((i) => ({ dish_id: i.dish_id, quantity: i.quantity, added_by: i.added_by })),
          note,
          // 批 1 · 便签：msg 空则传 null（数据层不做二次判断，前端就把空态收敛掉）
          sticker: sticker && sticker.msg && sticker.msg.trim() ? sticker : null,
          payer,
        }),
      })
      const order = await res.json()
      if (!mountedRef.current) return  // M-s6：卸载后不再执行后续副作用
      // m-21：cart 快照价 vs 服务端最新价 diff 时播报（家庭两人共享数据场景，一方改价另一方无感知会导致账对不上）
      try {
        if (order && Number(order.total_price) !== totalPrice) {
          window.__cgAnnounce?.(`价格有更新，购物车 ¥${totalPrice} → 订单实际 ¥${order.total_price}`)
        } else {
          window.__cgAnnounce?.(`已下单，共 ${totalCount} 件`)
        }
      } catch { /* noop */ }
      clearCart()
      setCelebrating(true)
      tap()
      vibrate([12, 40, 18])
      // 让惊喜播 ~1.1s 再进详情页；点覆盖层任意处立即让路（不阻塞主任务）
      await new Promise((resolve) => {
        skipRef.current = resolve
        setTimeout(resolve, 1100)
      })
      skipRef.current = null
      // M-s6 修：庆祝 1.1s 期间用户返回/切页时组件已卸载 → 不再 navigate（避免幽灵跳转）
      if (!mountedRef.current) return
      setCelebrating(false)
      navigate(`/orders/${order.id}`)
    } catch {
      if (!mountedRef.current) return
      setSubmitError(true)
      setSubmitting(false)
      try { window.__cgAnnounce?.('下单没成功，菜还给你留着') } catch {}
    }
  }

  // 下单成功瞬间 ——「锅已上灶」：小锅落坐灶台、蒸汽扶一缕，然后让路给详情页。
  // 灶台熄火等待，此刻不开火（点火是厨房那边的动作，OrderDetail 轮询到 preparing 时灶火才真亮）。
  if (celebrating) {
    return (
      <div
        role="status" aria-live="polite"
        className="fixed inset-0 z-[60] flex flex-col items-center justify-center backdrop-blur-sm cursor-pointer"
        style={{ background: 'color-mix(in srgb, var(--color-ink-900) 96%, transparent)' }}
        onClick={() => skipRef.current?.()}
      >
        <div className="relative" style={{ width: 130, height: 128 }}>
          {/* 灶台（复用 StoveStage 底座；覆盖层里自定吸底） */}
          <div className="stove-base" style={{ top: 'auto', bottom: 0 }} />
          {/* 锅一上灶，懒羊羊闻着味就醒了（欧羊的饭点反射） */}
          <div className="absolute text-[var(--color-sage)]" style={{ right: -16, bottom: -4 }}>
            <LazySheep size={30} mood="sniff" />
          </div>
          {/* 锅落坐：从上方轻放下来（reduced 只做淡入） */}
          <motion.span
            className="absolute left-1/2 text-6xl"
            style={{ bottom: 24, x: '-50%' }}
            initial={reduce ? { opacity: 0 } : { y: -44, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.12, duration: reduce ? 0.2 : 0.28, ease: EASE }}
          >
            🍲
          </motion.span>
          {/* 落灶后蒸汽扶起一记（一次性：2.6s 循环在离开前只会完整升一蓬） */}
          {!reduce && (
            <div className="absolute left-1/2 -translate-x-1/2 flex gap-2 pointer-events-none" style={{ bottom: 96 }}>
              <span className="steam-puff" style={{ animationDelay: '0.5s' }} />
              <span className="steam-puff" style={{ animationDelay: '0.9s' }} />
            </div>
          )}
        </div>
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.34, duration: 0.24, ease: EASE }}
          className="text-lg font-bold text-[var(--color-bone)] mt-4"
        >
          {ORDER_PLACED_NOTE}
        </motion.p>
      </div>
    )
  }

  return (
    <div className="relative">
      <FullBleedHero src={HERO_IMAGES.orders} variant="functional" alt="购物车" />

      <PageHeader title={pageTitle} subtitle={totalCount > 0 ? pageNote(totalCount) : ''} back right={<ThemeToggle />} />

      {/* 批4 修 P1：分享提示条从"非空车"分支里提出来——空车（最需要一键合并的时刻）也要看得见点得到 */}
      {shared && (
        <div className="px-[var(--space-page-x)]">
          <motion.div
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            className="mb-3 px-4 py-3 flex items-center gap-3"
            style={{
              background: 'color-mix(in srgb, var(--color-sage) 16%, var(--surface))',
              border: '2px solid color-mix(in srgb, var(--color-sage) 55%, transparent)',
              borderRadius: 'var(--radius-card)',
              color: 'var(--color-bone)',
            }}
            role="status"
          >
            <span aria-hidden className="text-2xl shrink-0">📬</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate">TA 分享了 {shared.items.length} 件</p>
              <p className="text-[11px] text-[var(--color-ash)] mt-0.5">{shared.sharedAt ? timeAgo(shared.sharedAt) : '刚刚'} · 合并进来一起下单？</p>
            </div>
            <button onClick={handleMerge}
              className="d3-btn-sm px-3 py-1.5 text-xs font-bold min-h-[44px] shrink-0"
              style={{ background: 'var(--color-sage)', color: 'var(--color-on-sage)', border: '2px solid var(--sage-60)' }}>
              合并
            </button>
          </motion.div>
        </div>
      )}

      {items.length === 0 ? (
        <EmptyState
          who="badgeDay"
          title="还没选好呀"
          desc="饿了吗？去点点好吃的吧~"
          action={
            <motion.button
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.04 }}
              onClick={() => navigate('/menu')}
              className="d3-btn d3-btn-primary px-8 py-3 rounded-2xl text-sm font-bold"
            >
              去选菜
            </motion.button>
          }
        />
      ) : (
        <PageContainer>
          {mergeDone && (
            <div role="status" className="mb-3 px-4 py-2 text-xs font-bold text-[var(--color-on-sage)]"
              style={{ background: 'var(--color-sage)', borderRadius: 'var(--radius-ctl)' }}>已合并 ✓</div>
          )}

          {/* 一键清空（购物车级操作 · 两段式确认） */}
          <div className="flex justify-end mb-2">
            <motion.button
              whileTap={{ scale: 0.96 }}
              type="button"
              onClick={handleClear}
              aria-label={confirmClear ? `确认清空购物车全部 ${totalCount} 件` : '清空购物车'}
              className="inline-flex items-center gap-1 px-3 py-1.5 min-h-[44px] text-xs font-bold rounded-full"
              style={{
                background: confirmClear ? 'color-mix(in srgb, var(--color-danger) 16%, var(--surface))' : 'transparent',
                color: confirmClear ? 'color-mix(in srgb, var(--color-danger) 70%, var(--color-bone))' : 'var(--color-ash)',
                border: `2px solid ${confirmClear ? 'color-mix(in srgb, var(--color-danger) 55%, transparent)' : 'var(--color-line)'}`,
              }}
            >
              <span aria-hidden>🗑</span> {confirmClear ? '确认清空？' : '一键清空'}
            </motion.button>
          </div>

          {/* 我点的 */}
          {meItems.length > 0 && (
            <GlassCard className="glass-me" glow={PERSONA.me.glow} style={{ padding: 'var(--space-card-p)' }}>
              <div className="flex items-center gap-2 mb-3">
                <div className="avatar-me w-7 h-7 rounded-full flex items-center justify-center text-xs">🐱</div>
                <span className="font-bold text-[var(--color-bone)]">我点的</span>
                <span className="ml-auto text-sm font-bold text-[var(--color-caramel)] tabular-nums"><span className="text-[0.75em] mr-px">¥</span>{meTotal}</span>
              </div>
              <div className="space-y-2">
                <AnimatePresence>
                  {meItems.map((item) => (
                    <CartRow
                      key={`${item.dish_id}-${item.added_by}`}
                      item={item}
                      onUpdate={updateQuantity}
                      onRemove={removeItem}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </GlassCard>
          )}

          {/* TA 点的 */}
          {partnerItems.length > 0 && (
            <GlassCard className="glass-partner" glow={PERSONA.partner.glow} style={{ padding: 'var(--space-card-p)' }}>
              <div className="flex items-center gap-2 mb-3">
                <div className="avatar-partner w-7 h-7 rounded-full flex items-center justify-center text-xs">🐑</div>
                <span className="font-bold text-[var(--color-bone)]">TA 点的</span>
                <span className="ml-auto text-sm font-bold text-[var(--color-caramel)] tabular-nums"><span className="text-[0.75em] mr-px">¥</span>{partnerTotal}</span>
              </div>
              <div className="space-y-2">
                <AnimatePresence>
                  {partnerItems.map((item) => (
                    <CartRow
                      key={`${item.dish_id}-${item.added_by}`}
                      item={item}
                      onUpdate={updateQuantity}
                      onRemove={removeItem}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </GlassCard>
          )}

          {/* 批 2b 新增 · 采购清单入口：一单菜合并原料，去超市/菜场一键复制 */}
          <GlassCard style={{ padding: 'var(--space-card-p)' }}>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => setPurchaseOpen(true)}
              className="w-full flex items-center gap-3 min-h-[44px] text-left"
              aria-label="生成采购清单"
            >
              <span aria-hidden className="w-9 h-9 rounded-full flex items-center justify-center text-lg shrink-0"
                style={{ background: 'color-mix(in srgb, var(--clay-50) 12%, var(--surface))', border: '2px solid var(--color-line)' }}>🛒</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-[var(--color-bone)]">要买这些东西</p>
                <p className="text-xs text-[var(--color-ash)] mt-0.5 truncate">合并所有菜的原料，去超市一键复制</p>
              </div>
              <span aria-hidden className="text-lg text-[var(--color-ash)] shrink-0">›</span>
            </motion.button>
          </GlassCard>

          {/* 备注 */}
          <GlassCard style={{ padding: 'var(--space-card-p)' }}>
            <div className="flex items-center gap-2 mb-2.5">
              <motion.span
                className="text-base"
                animate={{ y: [0, -3, 0] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                aria-hidden="true"
              >
                💬
              </motion.span>
              <label htmlFor="cart-note" className="text-sm text-[var(--color-ash)] font-semibold">
                想说点啥
              </label>
            </div>
            <textarea
              id="cart-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="d3-input w-full px-3.5 py-2.5 text-sm resize-none text-[var(--color-bone)] font-medium"
              style={{ borderRadius: 'var(--radius-btn)' }}
              rows={2}
              placeholder="少盐、不要香菜、多放蒜..."
            />
          </GlassCard>

          {/* 批 1 新增 · 便签纸：给TA的小纸条（贴在灶台上的那种），与"给厨房的操作指令"备注互补 */}
          <GlassCard style={{ padding: 'var(--space-card-p)' }}>
            <StickerEditor value={sticker} onChange={setSticker} collapsedLabel="贴张便签给他/她（会显示在订单里）" />
          </GlassCard>

          {/* 谁买单 */}
          <GlassCard style={{ padding: 'var(--space-card-p)' }}>
            <p className="text-sm text-[var(--color-ash)] font-semibold mb-3">谁来买单？</p>
            <PayerSelector value={payer} onChange={setPayer} />
          </GlassCard>

          {/* 合计 + 提交 —— 本页的深色锚点卡：clay 实底 + 白字大数字 + 反白按钮 */}
          <motion.div
            {...cardEntrance(0.2)}
            className="overflow-hidden"
            style={{
              borderRadius: 'var(--radius-card)',
              background: 'var(--anchor-ink)',
              border: '2px solid var(--clay-deep)',
              boxShadow: 'var(--shadow-4)',
              padding: 'var(--space-card-p)',
            }}
          >
            <div className="flex justify-between items-center">
              <span className="text-[var(--color-on-dark)] font-semibold">合计</span>
              <motion.span
                key={totalPrice}
                initial={{ scale: 1.3, y: -4 }}
                animate={{ scale: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                className="font-serif text-display font-bold text-[var(--color-on-dark)] tabular-nums"
              >
                <span className="text-[0.6em] mr-1">¥</span>{totalPrice}
              </motion.span>
            </div>

            <div
              className="flex items-center gap-1.5 mb-3.5 mt-2 py-1.5 px-2.5 rounded-xl self-start"
              style={{ background: 'rgba(43,36,41,0.14)' }}
            >
              <span className="text-xs" aria-hidden>⏱️</span>
              <span className="text-xs text-[var(--color-on-dark)]">已记入灶台，等出锅的消息</span>
            </div>

            {avoidHit && (
              <div role="alert"
                className="mb-2.5 px-3 py-2.5 rounded-xl"
                style={{
                  background: 'color-mix(in srgb, var(--color-ember) 22%, var(--color-on-dark))',
                  border: '2px solid color-mix(in srgb, var(--color-ember) 60%, transparent)',
                  color: 'var(--color-ink-fixed)',
                }}>
                <p className="text-xs font-bold mb-1.5 flex items-center gap-1"><span aria-hidden>🌿</span> 这几道里有忌口，看看要不要换</p>
                <ul className="text-[11px] leading-relaxed space-y-0.5" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {avoidHit.map(h => (
                    <li key={h.dishName}>
                      <span className="font-bold">{h.dishName}</span>
                      <span className="opacity-70"> · {h.hits.map(x => x.keyword).join('、')}</span>
                    </li>
                  ))}
                </ul>
                <div className="flex gap-2 mt-2">
                  <button type="button"
                    onClick={() => { setAvoidConfirmed(true); handleSubmit() }}
                    className="flex-1 py-1.5 px-2 rounded-lg text-xs font-bold min-h-[44px]"
                    style={{ background: 'var(--color-ink-fixed)', color: 'var(--color-on-dark)' }}>
                    知道啦，仍然下单
                  </button>
                  <button type="button"
                    onClick={() => setAvoidHit(null)}
                    className="flex-1 py-1.5 px-2 rounded-lg text-xs font-bold min-h-[44px]"
                    style={{ background: 'transparent', border: '2px solid color-mix(in srgb, var(--color-ink-fixed) 30%, transparent)', color: 'var(--color-ink-fixed)' }}>
                    先返回改改
                  </button>
                </div>
              </div>
            )}

            {submitError && (
              <div role="alert"
                className="flex items-start gap-1.5 mb-2.5 px-2.5 py-2 rounded-xl"
                style={{ background: 'color-mix(in srgb, var(--color-danger) 26%, transparent)', border: '1px solid color-mix(in srgb, var(--color-danger) 45%, transparent)' }}>
                <span aria-hidden className="text-sm leading-5">⚠️</span>
                <span className="text-xs font-semibold leading-5 text-[var(--color-on-dark)]">提交没成功，网络可能不稳——菜还给你留着呢，再点一次就好</span>
              </div>
            )}

            {/* 批 5 · 分享给 TA（跨设备传购物车）：手动推一份快照到服务端，对方开 Cart 就能看到并合并 */}
            <div className="mb-2">
              <motion.button
                whileTap={{ scale: 0.97 }}
                type="button"
                onClick={handleShare}
                disabled={sharing || items.length === 0}
                className="w-full py-2 text-xs font-bold min-h-[44px] rounded-lg flex items-center justify-center gap-1.5"
                style={{
                  background: shareDone ? 'var(--color-sage)' : 'color-mix(in srgb, var(--color-on-dark) 18%, transparent)',
                  color: shareDone ? 'var(--color-on-sage)' : 'var(--color-on-dark)',
                  border: '2px solid color-mix(in srgb, var(--color-on-dark) 30%, transparent)',
                  opacity: (sharing || items.length === 0) ? 0.6 : 1,
                }}
              >
                {shareDone ? '✓ 已分享，TA 打开就能看到' : sharing ? '分享中…' : `📤 把这一车分享给 TA（${items.length} 件）`}
              </motion.button>
              {shareErr && <p className="text-[11px] mt-1" style={{ color: 'var(--color-on-dark)', opacity: 0.92 }}>⚠️ {shareErr}</p>}
            </div>

            <motion.button
              whileTap={{ scale: 0.97 }}
              whileHover={{ scale: 1.01 }}
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full disabled:opacity-50 py-3.5 font-bold text-base"
              style={{
                borderRadius: 'var(--radius-btn)',
                background: 'var(--color-on-dark)',
                color: 'var(--color-clay)',
                border: '2px solid var(--clay-deep)',
                boxShadow: 'var(--shadow-2)',
              }}
            >
              {submitting ? '提交中...' : '下单啦~'}
            </motion.button>
          </motion.div>
        </PageContainer>
      )}

      {/* 批 2b · 采购清单 sheet */}
      <PurchaseListSheet open={purchaseOpen} onClose={() => setPurchaseOpen(false)} items={items} />
    </div>
  )
}
