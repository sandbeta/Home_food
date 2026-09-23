import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import AdminShell from '../components/ui/AdminShell'
import EmptyState from '../components/ui/EmptyState'
import LoadingState from '../components/ui/LoadingState'
import Chip from '../components/ui/Chip'
import { requestJson } from '../lib/request'
import { PERSONA } from '../theme/persona'

/* ============================================================
 * 批 1 新增 · 愿望池管理（他侧）
 * ------------------------------------------------------------
 * 语义：她许的愿（by='partner'）+ 他自己提的（by='me'）都在这一屏；
 *   他"补齐"= 跳去 AddDish 页面并预填菜名/描述 → 新建后 PUT wish.status='added' + added_dish_id；
 *   "拒绝"= PUT status='rejected'（不真删，保留历史，她能看到"他还没做"）。
 * ============================================================ */
const TABS = [
  { key: 'pending', label: '等 TA 变出来' },
  { key: 'added',   label: '已入菜单' },
  { key: 'rejected',label: '婉拒' },
  { key: '',        label: '全部' },
]

export default function AdminWishes() {
  const [wishes, setWishes] = useState([])
  const [tab, setTab] = useState('pending')
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')
  const navigate = useNavigate()

  const load = () => {
    setLoading(true); setErr('')
    const url = tab ? `/api/wishes?status=${tab}` : '/api/wishes'
    requestJson(url).then(r => r.json())
      .then(d => { setWishes(Array.isArray(d) ? d : []); setLoading(false) })
      .catch(() => { setLoading(false); setErr('愿望池没加载出来') })
  }
  useEffect(() => { load() }, [tab])

  const markAdded = async (w) => {
    // 跳去添加菜品表单，把菜名与描述预填进 URL；AddDishModal 若支持可读取预填
    // 简化：先跳 /admin/dishes?wishId=xx 让列表页顶部提示（下一轮把预填做进 AddDishModal 里）
    try {
      await requestJson(`/api/wishes/${w.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'added' }) })
      load()
      navigate('/admin/dishes', { state: { prefill: { name: w.name, description: w.note }, wishId: w.id } })
    } catch { setErr('标记失败，再试一次') }
  }
  const markRejected = async (w) => {
    try {
      await requestJson(`/api/wishes/${w.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'rejected' }) })
      load()
    } catch { setErr('标记失败，再试一次') }
  }
  const remove = async (id) => {
    try { await requestJson(`/api/wishes/${id}`, { method: 'DELETE' }); load() } catch { setErr('删不掉，再试') }
  }

  return (
    <AdminShell title="愿望池" subtitle={wishes.length > 0 ? `${wishes.length} 个愿望` : ''}>
      {err && (
        <div role="alert" className="flex items-center justify-between gap-3 px-3.5 py-2.5 mb-3"
          style={{ borderRadius: 'var(--radius-ctl)', background: 'color-mix(in srgb, var(--color-danger) 10%, var(--surface))', border: '2px solid color-mix(in srgb, var(--color-danger) 40%, transparent)' }}>
          <span className="text-sm font-semibold" style={{ color: 'color-mix(in srgb, var(--color-danger) 70%, var(--color-bone))' }}>⚠️ {err}</span>
          <button onClick={() => setErr('')} aria-label="关闭" className="text-xs font-bold min-h-[44px] px-3 rounded-full" style={{ color: 'var(--color-ash)' }}>知道了</button>
        </div>
      )}
      <div className="flex gap-2 overflow-x-auto no-scrollbar mb-3">
        {TABS.map(t => (
          <Chip key={t.key} active={tab === t.key} onClick={() => setTab(t.key)}>{t.label}</Chip>
        ))}
      </div>
      {loading ? <LoadingState emoji="🌠" /> : wishes.length === 0 ? (
        <EmptyState emoji="🌠" title={tab === 'pending' ? '还没有等待兑现的愿望' : '这一档空着'}
          desc="她（或你）在点菜页底部「许个愿」提的东西会出现在这里" />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-card-p)' }}>
          {wishes.map(w => {
            const p = PERSONA[w.by] || PERSONA.me
            return (
              <div key={w.id} className="d3-card-face" style={{ padding: 'var(--space-card-p)' }}>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] ${w.by === 'me' ? 'avatar-me' : 'avatar-partner'}`} aria-hidden>
                    {p.emoji}
                  </span>
                  <span className="text-xs text-[var(--color-ash)]">{w.by === 'me' ? '你' : 'TA'}许的</span>
                  <span className="text-xs text-[var(--color-ash)] opacity-60 ml-auto">{new Date(w.created_at).toLocaleDateString('zh-CN')}</span>
                </div>
                <p className="font-serif font-bold text-base text-[var(--color-bone)] mb-1">{w.name}</p>
                {w.note && <p className="text-sm text-[var(--color-ash)] leading-relaxed mb-2">{w.note}</p>}
                {tab === 'pending' && (
                  <div className="flex gap-2 mt-2">
                    <motion.button whileTap={{ scale: 0.96 }} onClick={() => markAdded(w)}
                      className="d3-btn d3-btn-primary flex-1 py-2 text-xs font-bold min-h-[44px]">
                      变出来 · 去做这道菜
                    </motion.button>
                    <button onClick={() => markRejected(w)} aria-label="婉拒"
                      className="d3-btn-sm px-3 py-2 text-xs font-bold min-h-[44px]"
                      style={{ color: 'var(--color-ash)' }}>
                      婉拒
                    </button>
                  </div>
                )}
                {tab !== 'pending' && (
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs" style={{ color: w.status === 'added' ? 'var(--color-sage)' : 'var(--color-ash)' }}>
                      {w.status === 'added' ? '已入菜单' : '暂时做不了'}
                    </span>
                    <button onClick={() => remove(w.id)} className="text-xs font-bold text-[var(--color-danger)] min-h-[44px] px-3">删掉这条</button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </AdminShell>
  )
}
