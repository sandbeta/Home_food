import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import PageHeader from '../components/PageHeader'
import PageContainer from '../components/ui/PageContainer'
import FullBleedHero from '../components/FullBleedHero'
import GlassCard from '../components/GlassCard'
import { HERO_IMAGES } from '../theme/images'
import { readFridge, upsertItem, removeItem, adjustQty } from '../lib/fridge'
import { tap, vibrate } from '../lib/sfx'

/* ============================================================
 * 批 6a · 厨房冰箱（家庭"我们家有啥菜"）
 * ------------------------------------------------------------
 * 视图：搜索 + 顶部添加栏（名/量/单位）+ 按更新时间倒序的食材卡列表
 * 交互：± 调数量 / 长按删除 / 编辑（点入 inline 编辑）
 * 语义：与 PurchaseListSheet 打通，采购清单里能标"家里有 vs 要买"
 * 存储：localStorage 设备级（暂不上服务端，避免双端不可变文件同步成本）
 * ============================================================ */
export default function Fridge() {
  const navigate = useNavigate()
  const [map, setMap] = useState(() => readFridge())
  const [name, setName] = useState('')
  const [qty, setQty] = useState('1')
  const [unit, setUnit] = useState('')
  const [search, setSearch] = useState('')
  /* §7.22 修：§7.15 已全清原生 confirm，本批回归；改两段式（5s 内再点即删） */
  const [pendingRemove, setPendingRemove] = useState(null)
  useEffect(() => {
    if (!pendingRemove) return undefined
    const t = setTimeout(() => setPendingRemove(null), 5000)
    return () => clearTimeout(t)
  }, [pendingRemove])

  const items = Object.entries(map)
    .filter(([k]) => !search || k.includes(search.trim()))
    .sort((a, b) => (b[1].updatedAt || '').localeCompare(a[1].updatedAt || ''))

  const add = (e) => {
    e.preventDefault()
    const n = name.trim()
    if (!n) return
    const next = upsertItem(n, { qty: Number(qty) || 1, unit: unit.trim() })
    setMap({ ...next })
    setName(''); setQty('1'); setUnit('')
    tap(); vibrate(10)
    try { window.__cgAnnounce?.(`冰箱加了 ${n}`) } catch {}
  }
  const remove = (k) => {
    if (pendingRemove !== k) { setPendingRemove(k); return }
    setMap({ ...removeItem(k) })
    setPendingRemove(null)
    try { window.__cgAnnounce?.(`从冰箱移除 ${k}`) } catch {}
  }
  const bump = (k, delta) => setMap({ ...adjustQty(k, delta) })

  return (
    <div className="relative">
      <FullBleedHero src={HERO_IMAGES.menu} variant="functional" alt="厨房冰箱" />
      <PageHeader title="厨房冰箱" subtitle="家里有什么，采购清单自动帮你划掉" back onBack={() => navigate('/profile')} />
      <PageContainer>
        {/* 添加条 */}
        <GlassCard>
          <form onSubmit={add} style={{ padding: 'var(--space-card-p)' }}>
            <p className="text-xs text-[var(--color-ash)] font-bold mb-2">放一样东西进冰箱</p>
            <div className="flex gap-2">
              <label htmlFor="fridge-name" className="sr-only">名称</label>
              <input id="fridge-name" value={name} onChange={e => setName(e.target.value)}
                placeholder="生姜" maxLength={12} required
                className="d3-input flex-1 min-w-0 px-3 py-2 text-sm min-h-[44px]"
                style={{ borderRadius: 'var(--radius-btn)' }} />
              <label htmlFor="fridge-qty" className="sr-only">数量</label>
              <input id="fridge-qty" type="number" min="0" step="1" value={qty} onChange={e => setQty(e.target.value)}
                className="d3-input w-16 px-2 py-2 text-sm text-center min-h-[44px]"
                style={{ borderRadius: 'var(--radius-btn)' }} />
              <label htmlFor="fridge-unit" className="sr-only">单位</label>
              <input id="fridge-unit" value={unit} onChange={e => setUnit(e.target.value)}
                placeholder="片" maxLength={4}
                className="d3-input w-14 px-2 py-2 text-sm min-h-[44px]"
                style={{ borderRadius: 'var(--radius-btn)' }} />
              <motion.button type="submit" whileTap={{ scale: 0.94 }}
                className="d3-btn d3-btn-primary px-3 py-2 min-h-[44px] text-xs font-bold shrink-0">放</motion.button>
            </div>
          </form>
        </GlassCard>

        {/* 搜索 */}
        {Object.keys(map).length > 0 && (
          <div className="mt-3">
            <label htmlFor="fridge-search" className="sr-only">搜索食材</label>
            <input id="fridge-search" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="搜冰箱里的食材…"
              className="d3-input w-full px-3.5 py-2 text-sm min-h-[44px]"
              style={{ borderRadius: '999px' }} />
          </div>
        )}

        {/* 列表 */}
        {items.length === 0 ? (
          <GlassCard delay={0.05}>
            <div style={{ padding: 'var(--space-card-p)', textAlign: 'center' }}>
              <p aria-hidden className="text-4xl mb-2">🧊</p>
              <p className="text-sm text-[var(--color-bone)] font-bold">{Object.keys(map).length === 0 ? '冰箱还是空的' : '没搜到'}</p>
              <p className="text-xs text-[var(--color-ash)] mt-1 leading-relaxed">
                {Object.keys(map).length === 0 ? '把常备的葱姜蒜、家里的冻肉都放进来，下次采购清单会自动划掉' : '换个关键词试试'}
              </p>
            </div>
          </GlassCard>
        ) : (
          <div className="space-y-2 mt-3">
            <AnimatePresence initial={false}>
              {items.map(([k, v]) => (
                <motion.div key={k} layout
                  initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: 30 }}
                  className="d3-card-face flex items-center gap-3"
                  style={{ padding: '12px var(--space-card-p)' }}>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-[var(--color-bone)] truncate">{k}</p>
                    <p className="text-[11px] text-[var(--color-ash)] mt-0.5 tabular-nums">{v.qty}{v.unit || ''} · {new Date(v.updatedAt).toLocaleDateString('zh-CN')}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => bump(k, -1)} aria-label={`减少 ${k}`}
                      className="w-11 h-11 rounded-full flex items-center justify-center text-[var(--color-bone)]"
                      style={{ background: 'var(--color-ink-850)', border: '2px solid var(--color-line)' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12" /></svg>
                    </button>
                    <button onClick={() => bump(k, 1)} aria-label={`增加 ${k}`}
                      className="w-11 h-11 rounded-full flex items-center justify-center text-[var(--color-on-dark)]"
                      style={{ background: 'var(--color-clay)', border: '2px solid var(--clay-deep)' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden="true"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                    </button>
                    <button onClick={() => remove(k)} aria-label={pendingRemove === k ? `再次点击确认移除 ${k}` : `移除 ${k}`}
                      className="w-11 h-11 rounded-full flex items-center justify-center ml-1 text-xs font-bold shrink-0 px-1"
                      style={{
                        background: pendingRemove === k ? 'var(--color-danger)' : 'transparent',
                        color: pendingRemove === k ? 'var(--color-on-dark)' : 'var(--color-danger)',
                        border: '2px solid color-mix(in srgb, var(--color-danger) 40%, transparent)',
                      }}>
                      {pendingRemove === k ? '确认?' : '×'}
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </PageContainer>
    </div>
  )
}
