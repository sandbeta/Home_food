import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

const CATEGORY_OPTIONS = [
  { value: '家常菜', emoji: '🍳' }, { value: '硬菜', emoji: '🥩' }, { value: '素菜', emoji: '🥬' },
  { value: '主食', emoji: '🍚' }, { value: '汤类', emoji: '🍲' }, { value: '小吃', emoji: '🍢' },
  { value: '水果', emoji: '🍎' }, { value: '饮品', emoji: '🧋' }, { value: '川菜', emoji: '🌶️' },
  { value: '粤菜', emoji: '🥢' }, { value: '湘菜', emoji: '🔥' }, { value: '鲁菜', emoji: '🍤' },
  { value: '苏菜', emoji: '🪷' }, { value: '浙菜', emoji: '🐟' }, { value: '闽菜', emoji: '🦐' },
  { value: '徽菜', emoji: '🍲' }, { value: '东北菜', emoji: '🥟' }, { value: '西北菜', emoji: '🍖' },
  { value: '云贵菜', emoji: '🍄' }, { value: '其他', emoji: '🍽️' },
]

const FIELDS = [
  { label: '菜名', key: 'name', type: 'text', placeholder: '红烧肉', required: true, icon: '🍜' },
  { label: '亲亲数量', key: 'price', type: 'number', inputMode: 'numeric', placeholder: '15', min: '0', step: '1', required: true, icon: '💕' },
  { label: '图片链接', key: 'image_url', type: 'url', placeholder: 'https://...', icon: '🖼️' },
  { label: '一句话描述', key: 'description', type: 'text', placeholder: '好吃到飞起~', icon: '✨' },
]

export default function AddDishModal({ dish, onClose, onSave }) {
  const [form, setForm] = useState({ name: '', price: '', category: '家常菜', image_url: '', description: '' })

  useEffect(() => {
    if (dish) setForm({ name: dish.name || '', price: dish.price || '', category: dish.category || '家常菜', image_url: dish.image_url || '', description: dish.description || '' })
  }, [dish])

  const handleSubmit = (e) => { e.preventDefault(); if (!form.name || !form.price) return; onSave({ ...form, price: Number(form.price) }) }

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose} className="fixed inset-0 z-50"
        style={{ backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', background: 'rgba(43,38,32,0.35)' }} />
      <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        className="fixed bottom-0 left-0 right-0 mx-auto z-50"
        style={{ maxWidth: 'var(--shell-w)' }}>
        <div className="d3-card-face rounded-t-3xl max-h-[85vh] overflow-hidden">
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-12 h-1.5 rounded-full" style={{ background: 'linear-gradient(90deg, color-mix(in srgb, var(--color-clay) 14%, transparent), var(--color-clay), color-mix(in srgb, var(--color-clay) 14%, transparent))' }} />
          </div>
          <div className="px-5 pb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, color-mix(in srgb, var(--color-clay) 14%, transparent), var(--color-clay))' }}>
                <span className="text-sm">{dish ? '✏️' : '➕'}</span>
              </div>
              <h2 className="text-lg font-bold text-[var(--color-bone)]">{dish ? '改改这道菜' : '加一道新菜'}</h2>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--color-ash)] hover:scale-105 active:scale-95 transition-transform border border-[var(--color-glass-border)] bg-[var(--color-glass)]">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            </button>
          </div>
          <form onSubmit={handleSubmit} className="px-5 pb-8 overflow-y-auto max-h-[calc(85vh-80px)]">
            <div className="space-y-4">
              {FIELDS.map(f => (
                <div key={f.key}>
                  <label className="text-sm text-[var(--color-ash)] block mb-1.5 font-semibold flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--color-clay)' }} />
                    {f.label}
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm pointer-events-none opacity-60">{f.icon}</span>
                    <input type={f.type} value={form[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                      className="d3-input w-full pl-9 pr-3 py-2.5 text-sm placeholder:text-[var(--color-ash)]/40 bg-[var(--color-ink-850)]"
                      placeholder={f.placeholder} min={f.min} step={f.step} required={f.required} inputMode={f.inputMode} />
                  </div>
                </div>
              ))}

              <div>
                <label className="text-sm text-[var(--color-ash)] block mb-1.5 font-semibold flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--color-sage)' }} />
                  分类
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm pointer-events-none opacity-60">
                    {CATEGORY_OPTIONS.find(c => c.value === form.category)?.emoji || '🍽️'}
                  </span>
                    <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                    className="d3-input w-full pl-9 pr-3 py-2.5 text-sm bg-[var(--color-ink-850)] appearance-none cursor-pointer">
                    {CATEGORY_OPTIONS.map(c => (
                      <option key={c.value} value={c.value}>{c.emoji} {c.value}</option>
                    ))}
                  </select>
                  <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-ash)] opacity-40 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-6">
              <motion.button type="button" whileTap={{ scale: 0.97 }} onClick={onClose}
                className="d3-btn-sm flex-1 py-3 rounded-2xl font-bold text-sm border-2 transition-colors duration-150 bg-[var(--color-ink-850)]"
                style={{ borderColor: 'var(--color-glass-border)', color: 'var(--color-ash)', background: 'transparent' }}>算了</motion.button>
              <motion.button type="submit" whileTap={{ scale: 0.97 }}
                className="d3-btn d3-btn-primary flex-1 py-3 rounded-2xl text-white font-bold text-sm transition-shadow duration-200"
                style={{ background: 'linear-gradient(135deg, var(--color-clay), var(--color-clay-deep))', boxShadow: '0 4px 15px rgba(200,104,63,0.35)' }}>好啦</motion.button>
            </div>
          </form>
        </div>
      </motion.div>
    </>
  )
}
