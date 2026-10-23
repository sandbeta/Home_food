import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import PageHeader from '../../components/PageHeader.jsx'
import AdminTabs from '../../components/AdminTabs.jsx'
import Icon from '../../components/Icon.jsx'
import EmptyState from '../../components/EmptyState.jsx'
import { useData } from '../../state/DataContext.jsx'
import { useToast } from '../../state/ToastContext.jsx'
import { api } from '../../lib/api.js'
import { formatWhen, money, normalizeStatus, orderCount, orderItemsText, statusInfo } from '../../lib/format.js'

const FILTERS = [
  { key: 'all', label: '全部' },
  { key: 'pending', label: '等着呢' },
  { key: 'cutting', label: '切配' },
  { key: 'cooking', label: '下锅' },
  { key: 'plating', label: '装盘' },
  { key: 'completed', label: '做好啦' },
]

const NEXT = {
  pending: { status: 'cutting', label: '开始做' },
  cutting: { status: 'cooking', label: '下锅' },
  cooking: { status: 'plating', label: '装盘' },
  plating: { status: 'completed', label: '做好了' },
}

const TONE = { warn: 'tag--warn', honey: 'tag--honey', sage: 'tag--sage', success: 'tag--success' }

export default function AdminOrders() {
  const { orders, loading, refreshOrders } = useData()
  const toast = useToast()
  const [filter, setFilter] = useState('all')
  const [busyId, setBusyId] = useState(null)

  const list = useMemo(() => {
    const sorted = [...orders].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    if (filter === 'all') return sorted
    return sorted.filter((o) => normalizeStatus(o.status) === filter || o.status === filter)
  }, [orders, filter])

  const advance = async (o) => {
    const next = NEXT[normalizeStatus(o.status)]
    if (!next) return
    setBusyId(o.id)
    try {
      await api.orders.setStatus(o.id, next.status)
      await refreshOrders()
      toast(`推到「${statusInfo(next.status).label}」`)
    } catch {
      toast('没推动，再试一次')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <>
      <PageHeader
        title="订单"
        sub={`${orders.filter((o) => o.status !== 'completed').length} 单在锅里`}
        back
        right={(
          <button type="button" className="icon-btn" aria-label="刷新订单" onClick={refreshOrders}>
            <Icon name="refresh" size={20} />
          </button>
        )}
      />
      <AdminTabs />
      <div className="page admin-page">
        <div className="admin-filters scroll-x" role="group" aria-label="按状态筛选">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              className={`chip ${filter === f.key ? 'chip--active' : 'chip--field'}`}
              aria-pressed={filter === f.key}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>

        {loading && !orders.length ? (
          <div className="stack" style={{ marginTop: 'var(--s3)' }}>
            {[0, 1, 2].map((i) => <div key={i} className="skeleton" style={{ height: 120, borderRadius: 'var(--r-lg)' }} />)}
          </div>
        ) : !list.length ? (
          <EmptyState pose="mate" title={filter === 'all' ? '还没有订单' : '这一档空着'} note={filter === 'all' ? '家人点了菜，这里就会出现。' : '换个筛选看看。'} />
        ) : (
          <div className="stack admin-order-list">
            {list.map((o) => {
              const st = statusInfo(o.status)
              const next = NEXT[normalizeStatus(o.status)]
              return (
                <article key={o.id} className="card card--pad admin-order">
                  <div className="admin-order__top">
                    <span className={`tag ${TONE[st.tone] || ''}`}>{st.label}</span>
                    <span className="t-micro">#{o.id} · {formatWhen(o.created_at)}</span>
                  </div>
                  <p className="admin-order__items">{orderItemsText(o, 4)}</p>
                  <div className="admin-order__meta">
                    <span className="t-micro">{orderCount(o)} 份 · {o.payer === 'aa' ? 'AA' : o.payer === 'me' ? '我请' : 'TA 请'}</span>
                    <span className="price price--sm">{money(o.total_price)}</span>
                  </div>
                  {o.note ? <p className="admin-order__note">“{o.note}”</p> : null}
                  <div className="admin-order__actions">
                    <Link to={`/orders/${o.id}`} className="btn btn--ghost btn--sm">看详情</Link>
                    {next ? (
                      <button type="button" className="btn btn--honey btn--sm" disabled={busyId === o.id} onClick={() => advance(o)}>
                        {busyId === o.id ? '推着…' : next.label}
                      </button>
                    ) : (
                      <span className="tag tag--success">这单收工</span>
                    )}
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}
