import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useCart } from '../components/CartContext'
import Header from '../components/Header'
import GlassCard from '../components/GlassCard'
import FullBleedHero from '../components/FullBleedHero'
import KissIcon from '../components/KissIcon'
import { HERO_IMAGES } from '../theme/images'
import { PAYER, PERSONA } from '../theme/persona'

const PAYER_OPTIONS = [
  { value: 'aa', label: 'AA', emoji: '✌️', desc: '各付各的' },
  { value: 'me', label: '我请', emoji: '🙋', desc: '今天我买单' },
  { value: 'partner', label: 'TA请', emoji: '💝', desc: '让TA来~' },
]

function CartRow({ item, onUpdate, onRemove }) {
  return (
    <motion.div layout initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 15, height: 0 }}
      className="flex items-center gap-3 py-1.5">
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-[14px] text-[var(--color-bone)] truncate">{item.name}</h3>
        <div className="flex items-center gap-1 mt-0.5">
          <KissIcon className="w-3 h-3 text-[var(--color-love)]" />
          <span className="text-[13px] font-bold text-[var(--color-clay-soft)]">{item.price}</span>
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        <motion.button whileTap={{ scale: 0.85 }} whileHover={{ scale: 1.06 }}
          onClick={() => onUpdate(item.dish_id, item.quantity - 1, item.added_by)}
          className="w-[30px] h-[30px] rounded-full bg-black/5 flex items-center justify-center text-[var(--color-bone)] transition-all duration-200 hover:scale-105 active:scale-90">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12" /></svg>
        </motion.button>
        <motion.span key={item.quantity} initial={{ scale: 1.5, rotate: -10 }} animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 12 }}
          className="w-5 text-center font-bold text-[15px] tabular-nums text-[var(--color-bone)]">{item.quantity}</motion.span>
        <motion.button whileTap={{ scale: 0.85 }} whileHover={{ scale: 1.06 }}
          onClick={() => onUpdate(item.dish_id, item.quantity + 1, item.added_by)}
          className="w-[30px] h-[30px] rounded-full flex items-center justify-center text-white transition-all duration-200 hover:scale-105 active:scale-90"
          style={{ background: 'linear-gradient(135deg, var(--color-clay-soft), var(--color-clay))' }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
        </motion.button>
      </div>
      <motion.button whileTap={{ scale: 0.75 }} whileHover={{ scale: 1.15, rotate: 90 }}
        onClick={() => onRemove(item.dish_id, item.added_by)}
        className="text-[var(--color-mist)] active:text-[var(--color-danger)] ml-0.5 transition-all duration-200">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
      </motion.button>
    </motion.div>
  )
}

export default function Cart() {
  const { items, totalPrice, totalCount, updateQuantity, removeItem } = useCart()
  const [note, setNote] = useState('')
  const [payer, setPayer] = useState('aa')
  const [submitting] = useState(false)
  const navigate = useNavigate()

  const meItems = items.filter(i => i.added_by === 'me')
  const partnerItems = items.filter(i => i.added_by === 'partner')
  const meTotal = meItems.reduce((s, i) => s + i.price * i.quantity, 0)
  const partnerTotal = partnerItems.reduce((s, i) => s + i.price * i.quantity, 0)

  const handleSubmit = () => { if (items.length === 0) return; navigate('/checkout') }

  if (items.length === 0) {
    return (
      <div className="relative">
        <FullBleedHero src={HERO_IMAGES.orders} variant="functional" alt="购物车" />
        <Header title="已选的菜" />
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center py-20 px-4">
          <div className="relative mb-6">
            <div className="w-24 h-24 rounded-full animate-cart-empty-bounce"
              style={{ background: 'linear-gradient(135deg, color-mix(in srgb, var(--color-clay) 12%, transparent), color-mix(in srgb, var(--color-sage) 8%, transparent))' }}>
              <div className="w-full h-full flex items-center justify-center"><span className="text-6xl">🛒</span></div>
            </div>
            <motion.div className="absolute -top-2 -right-3 w-6 h-6 rounded-full"
              animate={{ y: [0, -5, 0], opacity: [0.6, 1, 0.6] }} transition={{ duration: 2.5, repeat: Infinity }}
              style={{ background: 'radial-gradient(circle, color-mix(in srgb, var(--color-clay) 22%, transparent), transparent)' }}>
              <div className="w-full h-full flex items-center justify-center text-xs">✨</div>
            </motion.div>
          </div>
          <p className="text-[var(--color-bone)] mb-1.5 text-base font-bold">还没选好呀</p>
          <p className="text-[var(--color-ash)] text-sm mb-8 text-center leading-relaxed max-w-[220px]">饿了吗？<br />去点点好吃的吧~</p>
          <motion.button whileTap={{ scale: 0.95 }} whileHover={{ scale: 1.04 }} onClick={() => navigate('/menu')}
            className="d3-btn d3-btn-primary px-8 py-3 rounded-2xl text-sm font-bold">去选菜</motion.button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="relative">
      <FullBleedHero src={HERO_IMAGES.orders} variant="functional" alt="购物车" />
      <Header title="已选的菜" subtitle={`共 ${totalCount} 件`} />

      <div className="px-4 space-y-3.5">
        {/* 我点的 */}
        {meItems.length > 0 && (
          <GlassCard className="glass-me p-4" glow={PERSONA.me.glow}>
            <div className="flex items-center gap-2 mb-3">
              <div className="avatar-me w-7 h-7 rounded-full flex items-center justify-center text-xs">🐱</div>
              <span className="font-bold text-[var(--color-bone)]">我点的</span>
              <span className="ml-auto text-sm font-bold text-[var(--color-clay-soft)] tabular-nums">{meTotal}</span>
            </div>
            <div className="space-y-1.5">
              <AnimatePresence>
                {meItems.map(item => <CartRow key={`${item.dish_id}-${item.added_by}`} item={item} onUpdate={updateQuantity} onRemove={removeItem} />)}
              </AnimatePresence>
            </div>
          </GlassCard>
        )}

        {/* TA 点的 */}
        {partnerItems.length > 0 && (
          <GlassCard className="glass-partner p-4" glow={PERSONA.partner.glow}>
            <div className="flex items-center gap-2 mb-3">
              <div className="avatar-partner w-7 h-7 rounded-full flex items-center justify-center text-xs">🐰</div>
              <span className="font-bold text-[var(--color-bone)]">TA 点的</span>
              <span className="ml-auto text-sm font-bold text-[var(--color-sage-soft)] tabular-nums">{partnerTotal}</span>
            </div>
            <div className="space-y-1.5">
              <AnimatePresence>
                {partnerItems.map(item => <CartRow key={`${item.dish_id}-${item.added_by}`} item={item} onUpdate={updateQuantity} onRemove={removeItem} />)}
              </AnimatePresence>
            </div>
          </GlassCard>
        )}

        {/* 备注 */}
        <GlassCard className="p-4">
          <div className="flex items-center gap-2 mb-2.5">
            <motion.span className="text-base" animate={{ y: [0, -3, 0] }} transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}>💬</motion.span>
            <label className="text-sm text-[var(--color-ash)] font-semibold">想说点啥</label>
          </div>
          <textarea value={note} onChange={e => setNote(e.target.value)}
            className="d3-input w-full rounded-2xl px-3.5 py-2.5 text-sm resize-none text-[var(--color-bone)] placeholder:text-[var(--color-mist)]/70 font-medium"
            rows={2} placeholder="少盐、不要香菜、多放蒜..." />
        </GlassCard>

        {/* 买单选择器 */}
        <GlassCard className="p-4">
          <p className="text-sm text-[var(--color-ash)] font-semibold mb-3">谁来买单？</p>
          <div className="flex gap-2">
            {PAYER_OPTIONS.map(opt => {
              const p = PAYER[opt.value]
              const active = payer === opt.value
              const activeColor = opt.value === 'me' ? 'var(--color-clay)' : opt.value === 'partner' ? 'var(--color-sage)' : 'var(--color-caramel)'
              return (
                <motion.button key={opt.value} whileTap={{ scale: 0.95 }} whileHover={{ scale: 1.02 }}
                  onClick={() => setPayer(opt.value)}
                  className={`flex-1 py-3 rounded-xl text-center transition-all duration-300 relative overflow-hidden ${active ? 'd3-btn-primary' : 'bg-black/5 text-[var(--color-ash)]'}`}
                  style={active ? { borderColor: p.border, boxShadow: p.glow } : {}}>
                  {active && (
                    <motion.div className="absolute inset-0 pointer-events-none" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      style={{ background: `radial-gradient(circle at 50% 30%, color-mix(in srgb, ${activeColor} 13%, transparent), transparent 70%)` }} />
                  )}
                  <motion.div className="text-2xl mb-1 relative" animate={active ? { scale: [1, 1.15, 1] } : { scale: 1 }} transition={{ duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}>{opt.emoji}</motion.div>
                  <div className="text-sm font-bold text-[var(--color-bone)] relative">{opt.label}</div>
                  <div className="text-[10px] text-[var(--color-ash)] mt-0.5 relative">{opt.desc}</div>
                </motion.button>
              )
            })}
          </div>
        </GlassCard>

        {/* 合计区域 */}
        <GlassCard className="p-4">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[var(--color-ash)] font-semibold">合计</span>
            <div className="flex items-center gap-1.5">
              <KissIcon className="w-5 h-5 text-[var(--color-love)]" />
              <motion.span key={totalPrice} initial={{ scale: 1.3, y: -4 }} animate={{ scale: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                className="text-[28px] font-bold text-[var(--color-clay-soft)] tabular-nums">{totalPrice}</motion.span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 mb-3.5 py-1.5 px-2.5 rounded-xl self-start"
            style={{ background: 'linear-gradient(135deg, color-mix(in srgb, var(--color-clay) 8%, transparent), color-mix(in srgb, var(--color-sage) 5%, transparent))' }}>
            <span className="text-xs">⏱️</span>
            <span className="text-xs text-[var(--color-ash)]">预估等待约 20-30 分钟</span>
          </div>
          <motion.button whileTap={{ scale: 0.97 }} whileHover={{ scale: 1.01 }} onClick={handleSubmit} disabled={submitting}
            className="d3-btn d3-btn-primary w-full disabled:opacity-50 py-3.5 rounded-2xl font-bold text-[15px] relative overflow-hidden animate-pulse-glow-clay">
            <span className="relative">{submitting ? '提交中...' : '下单啦~'}</span>
          </motion.button>
        </GlassCard>
      </div>
    </div>
  )
}
