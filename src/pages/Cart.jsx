import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useCart } from '../components/CartContext'
import PageHeader from '../components/PageHeader'
import GlassCard from '../components/GlassCard'
import FullBleedHero from '../components/FullBleedHero'
import KissIcon from '../components/KissIcon'
import PageContainer from '../components/ui/PageContainer'
import PayerSelector from '../components/ui/PayerSelector'
import Stepper from '../components/ui/Stepper'
import EmptyState from '../components/ui/EmptyState'
import { HERO_IMAGES } from '../theme/images'
import { PERSONA } from '../theme/persona'
import { cardEntrance } from '../theme/motion'
import { pickOne, CART_TITLES, CART_NOTES } from '../lib/sweetCopy'

function CartRow({ item, onUpdate, onRemove }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -15 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 15, height: 0 }}
      className="flex items-center gap-3 py-1.5"
    >
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-sm text-[var(--color-bone)] truncate">{item.name}</h3>
        <div className="flex items-center gap-1 mt-0.5">
          <KissIcon className="w-3 h-3 text-[var(--color-love)]" />
          <span className="font-serif text-sm font-bold text-[var(--color-caramel)] tabular-nums"><span className="text-[0.75em] mr-px">¥</span>{item.price}</span>
        </div>
      </div>

      <Stepper
        value={item.quantity}
        min={1}
        onChange={(v) => onUpdate(item.dish_id, v, item.added_by)}
      />

      <motion.button
        whileTap={{ scale: 0.75 }}
        whileHover={{ scale: 1.15, rotate: 90 }}
        onClick={() => onRemove(item.dish_id, item.added_by)}
        aria-label={`移除${item.name}`}
        className="text-[var(--color-mist)] active:text-[var(--color-danger)] ml-0.5 shrink-0"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
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
  const { items, totalPrice, totalCount, updateQuantity, removeItem, clearCart } = useCart()
  const [note, setNote] = useState('')
  const [payer, setPayer] = useState('aa')
  const [submitting, setSubmitting] = useState(false)
  const [celebrating, setCelebrating] = useState(false)
  const [pageTitle] = useState(() => pickOne(CART_TITLES))
  const [pageNote] = useState(() => pickOne(CART_NOTES))
  const navigate = useNavigate()

  const meItems = items.filter((i) => i.added_by === 'me')
  const partnerItems = items.filter((i) => i.added_by === 'partner')
  const meTotal = meItems.reduce((s, i) => s + i.price * i.quantity, 0)
  const partnerTotal = partnerItems.reduce((s, i) => s + i.price * i.quantity, 0)

  const handleSubmit = async () => {
    if (items.length === 0) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map((i) => ({ dish_id: i.dish_id, quantity: i.quantity, added_by: i.added_by })),
          note,
          payer,
        }),
      })
      const order = await res.json()
      setCelebrating(true)
      await new Promise((r) => setTimeout(r, 1200))
      clearCart()
      navigate(`/orders/${order.id}`)
    } catch {
      alert('提交失败，再试一次嘛~')
      setSubmitting(false)
    }
  }

  // 下单成功覆盖层
  if (celebrating) {
    return (
      <div
        className="fixed inset-0 z-50 flex flex-col items-center justify-center backdrop-blur-sm"
        style={{ background: 'color-mix(in srgb, var(--color-ink-900) 96%, transparent)' }}
      >
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 12 }}
          className="text-8xl mb-4"
        >
          🎉
        </motion.div>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-2xl font-bold text-[var(--color-bone)]"
        >
          下单成功！
        </motion.p>
      </div>
    )
  }

  return (
    <div className="relative">
      <FullBleedHero src={HERO_IMAGES.orders} variant="functional" alt="购物车" />

      <PageHeader title={pageTitle} subtitle={totalCount > 0 ? pageNote(totalCount) : ''} back />

      {items.length === 0 ? (
        <EmptyState
          emoji="🛒"
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
          {/* 我点的 */}
          {meItems.length > 0 && (
            <GlassCard className="glass-me" glow={PERSONA.me.glow} style={{ padding: 'var(--space-card-p)' }}>
              <div className="flex items-center gap-2 mb-3">
                <div className="avatar-me w-7 h-7 rounded-full flex items-center justify-center text-xs">🐱</div>
                <span className="font-bold text-[var(--color-bone)]">我点的</span>
                <span className="ml-auto text-sm font-bold text-[var(--color-clay)] tabular-nums"><span className="text-[0.75em] mr-px">¥</span>{meTotal}</span>
              </div>
              <div>
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
                <div className="avatar-partner w-7 h-7 rounded-full flex items-center justify-center text-xs">🐰</div>
                <span className="font-bold text-[var(--color-bone)]">TA 点的</span>
                <span className="ml-auto text-sm font-bold text-[var(--color-sage)] tabular-nums"><span className="text-[0.75em] mr-px">¥</span>{partnerTotal}</span>
              </div>
              <div>
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

          {/* 备注 */}
          <GlassCard style={{ padding: 'var(--space-card-p)' }}>
            <div className="flex items-center gap-2 mb-2.5">
              <motion.span
                className="text-base"
                animate={{ y: [0, -3, 0] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
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
              className="d3-input w-full px-3.5 py-2.5 text-sm resize-none text-[var(--color-bone)] placeholder:text-[var(--color-mist)]/70 font-medium"
              style={{ borderRadius: 'var(--radius-btn)' }}
              rows={2}
              placeholder="少盐、不要香菜、多放蒜..."
            />
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
              background: 'var(--color-clay-gradient)',
              boxShadow: 'var(--shadow-4)',
              padding: 'var(--space-card-p)',
            }}
          >
            <div className="flex justify-between items-center">
              <span className="text-[#FFFDF9]/85 font-semibold">合计</span>
              <div className="flex items-center gap-1.5">
                <KissIcon className="w-5 h-5 text-[#FFFDF9]" />
                <motion.span
                  key={totalPrice}
                  initial={{ scale: 1.3, y: -4 }}
                  animate={{ scale: 1, y: 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                  className="font-serif text-display font-bold text-[#FFFDF9] tabular-nums"
                >
                  <span className="text-[0.6em] mr-1 opacity-90">¥</span>{totalPrice}
                </motion.span>
              </div>
            </div>

            <div
              className="flex items-center gap-1.5 mb-3.5 mt-2 py-1.5 px-2.5 rounded-xl self-start"
              style={{ background: 'rgba(43,38,32,0.14)' }}
            >
              <span className="text-xs">⏱️</span>
              <span className="text-xs text-[#FFFDF9]/85">预估等待约 20-30 分钟</span>
            </div>

            <motion.button
              whileTap={{ scale: 0.97 }}
              whileHover={{ scale: 1.01 }}
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full disabled:opacity-50 py-3.5 font-bold text-base"
              style={{
                borderRadius: 'var(--radius-btn)',
                background: '#FFFDF9',
                color: 'var(--color-clay)',
                boxShadow: 'var(--shadow-2)',
              }}
            >
              {submitting ? '提交中...' : '下单啦~'}
            </motion.button>
          </motion.div>
        </PageContainer>
      )}
    </div>
  )
}
