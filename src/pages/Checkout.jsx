import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useCart } from '../components/CartContext'
import Header from '../components/Header'
import GlassCard from '../components/GlassCard'
import FullBleedHero from '../components/FullBleedHero'
import KissIcon from '../components/KissIcon'
import { HERO_IMAGES } from '../theme/images'
import { PAYER } from '../theme/persona'

const PAYER_OPTIONS = [
  { value: 'aa', label: 'AA', emoji: '✌️' },
  { value: 'me', label: '我请', emoji: '🙋' },
  { value: 'partner', label: 'TA请', emoji: '💝' },
]

export default function Checkout() {
  const { items, totalPrice, totalCount, clearCart } = useCart()
  const [payer, setPayer] = useState('aa')
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [celebrating, setCelebrating] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map(i => ({ dish_id: i.dish_id, quantity: i.quantity, added_by: i.added_by })),
          note, payer,
        }),
      })
      const order = await res.json()
      setCelebrating(true)
      await new Promise(r => setTimeout(r, 1200))
      clearCart()
      navigate(`/orders/${order.id}`)
    } catch {
      alert('提交失败，再试一次嘛~')
      setSubmitting(false)
    }
  }

  if (celebrating) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[rgba(14,12,10,0.95)] backdrop-blur-sm">
        <motion.div initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 12 }} className="text-8xl mb-4">🎉</motion.div>
        <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="text-2xl font-bold text-[var(--color-bone)]">下单成功！</motion.p>
      </div>
    )
  }

  return (
    <div className="relative">
      <FullBleedHero src={HERO_IMAGES.order} variant="functional" alt="确认订单" />

      <Header title="确认订单" subtitle={`共 ${totalCount} 件`} />
      <div className="px-4 pb-4 space-y-3">
        {items.map(item => (
          <GlassCard key={`${item.dish_id}-${item.added_by}`} className="p-3.5 flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs shrink-0 ${item.added_by === 'me' ? 'avatar-me' : 'avatar-partner'}`}>
              {item.added_by === 'me' ? '🐱' : '🐰'}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-[13px] text-[var(--color-bone)] truncate">{item.name}</h3>
            </div>
            <span className="text-sm font-bold text-[var(--color-bone)]">×{item.quantity}</span>
            <div className="flex items-center gap-1">
              <KissIcon className="w-3 h-3 text-[var(--color-love)]" />
              <span className="text-sm font-bold text-[var(--color-gold-soft)]">{item.price * item.quantity}</span>
            </div>
          </GlassCard>
        ))}

        <GlassCard className="p-4">
          <label className="text-xs text-[var(--color-ash)] font-bold block mb-2">备注</label>
          <textarea value={note} onChange={e => setNote(e.target.value)}
            className="d3-input w-full px-3 py-2.5 text-sm resize-none text-[var(--color-bone)] placeholder:text-[var(--color-mist)]/70"
            rows={2} placeholder="少盐、不要香菜..." />
        </GlassCard>

        <GlassCard className="p-4">
          <p className="text-xs text-[var(--color-ash)] font-bold mb-3">谁来买单？</p>
          <div className="flex gap-2">
            {PAYER_OPTIONS.map(opt => {
              const p = PAYER[opt.value]
              const active = payer === opt.value
              return (
                <motion.button key={opt.value} whileTap={{ scale: 0.95 }} onClick={() => setPayer(opt.value)}
                  className={`flex-1 py-3 rounded-xl text-center transition-all duration-300 relative overflow-hidden ${active ? 'd3-btn-primary' : 'bg-white/5 text-[var(--color-ash)]'}`}
                  style={active ? { borderColor: p.border, boxShadow: p.glow } : {}}>
                  <div className="text-xl mb-1">{opt.emoji}</div>
                  <div className="text-xs font-bold text-[var(--color-bone)]">{opt.label}</div>
                </motion.button>
              )
            })}
          </div>
        </GlassCard>

        <GlassCard className="p-4">
          <div className="flex justify-between items-center mb-3">
            <span className="text-[var(--color-ash)] font-bold">合计</span>
            <div className="flex items-center gap-1">
              <KissIcon className="w-5 h-5 text-[var(--color-love)]" />
              <span className="text-[26px] font-bold text-[var(--color-gold-soft)] tabular-nums">{totalPrice}</span>
            </div>
          </div>
          <motion.button whileTap={{ scale: 0.97, y: 2 }} whileHover={{ y: -1 }}
            onClick={handleSubmit} disabled={submitting}
            className="d3-btn d3-btn-primary w-full py-3.5 rounded-2xl font-bold text-[15px] disabled:opacity-50 text-[#2A1E0E]">
            {submitting ? '提交中...' : '确认下单'}
          </motion.button>
        </GlassCard>
      </div>
    </div>
  )
}
