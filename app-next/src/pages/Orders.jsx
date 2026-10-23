import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import PageHeader from '../components/PageHeader.jsx'
import Icon from '../components/Icon.jsx'
import EmptyState from '../components/EmptyState.jsx'
import { useData } from '../state/DataContext.jsx'
import { formatWhen, money, monthLabel, orderCount, orderItemsText, splitOrder, statusInfo } from '../lib/format.js'

const FILTERS = [
  { key: 'all', label: '全部' },
  { key: 'doing', label: '在锅里' },
  { key: 'done', label: '做好了' },
]

const TONE = { warn: 'tag--warn', honey: 'tag--honey', sage: 'tag--sage', success: 'tag--success' }

export default function Orders() {
  const { orders, loading, errors, refreshOrders } = useData()
  const [filter, setFilter] = useState('all')

  const list = useMemo(() => {
    const sorted = [...(orders || [])].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    if (filter === 'doing') return sorted.filter((o) => o.status !== 'completed')
    if (filter === 'done') return sorted.filter((o) => o.status === 'completed')
    return sorted
  }, [orders, filter])

  const groups = useMemo(() => {
    const map = new Map()
    for (const o of list) {
      const k = String(o.created_at || '').slice(0, 7)
      if (!map.has(k)) map.set(k, [])
      map.get(k).push(o)
    }
    return [...map.entries()]
  }, [list])

  return (
    <>
      <PageHeader
        title="订单"
        sub={orders.length ? `一共 ${orders.length} 单` : '每一顿都记着'}
        back
        right={(
          <button type="button" className="icon-btn" aria-label="刷新订单" onClick={refreshOrders}>
            <Icon name="refresh" size={20} />
          </button>
        )}
      />
      <div className="page orders-page">
        <div className="seg" role="group" aria-label="订单筛选">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              className="seg__item"
              aria-pressed={filter === f.key}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>

        {errors.orders && !orders.length ? (
          <EmptyState
            pose="steal"
            title="订单没取到"
            note="网络或服务端出了点状况，再试一次。"
            action={<button type="button" className="btn btn--honey" onClick={refreshOrders}>再试一次</button>}
          />
        ) : loading && !orders.length ? (
          <div className="stack" style={{ marginTop: 'var(--s4)' }}>
            {[0, 1, 2].map((i) => (
              <div key={i} className="card card--pad">
                <div className="skeleton" style={{ height: 16, width: '35%' }} />
                <div className="skeleton" style={{ height: 14, width: '75%', marginTop: 12 }} />
                <div className="skeleton" style={{ height: 18, width: '25%', marginTop: 14 }} />
              </div>
            ))}
          </div>
        ) : !list.length ? (
          <EmptyState
            pose="mate"
            title={filter === 'all' ? '还没有订单' : '这一栏空着'}
            note={filter === 'all' ? '去菜单点两道，第一单就有了。' : '换个筛选看看。'}
            action={
              filter === 'all'
                ? <Link to="/menu" className="btn btn--primary">去点菜</Link>
                : <button type="button" className="btn btn--honey" onClick={() => setFilter('all')}>看全部</button>
            }
          />
        ) : (
          <div className="orders-list">
            {groups.map(([key, items]) => (
              <section key={key} className="orders-group">
                <h2 className="orders-group__title">{monthLabel(key)}</h2>
                <div className="stack stack--tight">
                  {items.map((o) => {
                    const st = statusInfo(o.status)
                    const split = splitOrder(o)
                    return (
                      <Link key={o.id} to={`/orders/${o.id}`} className="order-card card">
                        <div className="order-card__top">
                          <span className={`tag ${TONE[st.tone] || ''}`}>{st.label}</span>
                          <span className="t-micro">{formatWhen(o.created_at)}</span>
                        </div>
                        <p className="order-card__items">{orderItemsText(o, 4)}</p>
                        <div className="order-card__bottom">
                          <span className="t-micro">{orderCount(o)} 份 · 我 {money(split.me)} / TA {money(split.partner)}</span>
                          <span className="price price--sm">{money(o.total_price)}</span>
                          <Icon name="arrow" size={18} />
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
