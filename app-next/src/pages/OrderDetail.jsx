import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import PageHeader from '../components/PageHeader.jsx'
import Icon from '../components/Icon.jsx'
import EmptyState from '../components/EmptyState.jsx'
import RatingDialog from '../components/RatingDialog.jsx'
import { api } from '../lib/api.js'
import { useData } from '../state/DataContext.jsx'
import { useCart } from '../state/CartContext.jsx'
import { useToast } from '../state/ToastContext.jsx'
import {
  ORDER_FLOW, formatWhen, money, orderCount, splitOrder, statusIndex, statusInfo,
} from '../lib/format.js'
import { summarizeDish } from '../lib/dishRating.js'
import { PAYER_LABEL } from '../lib/format.js'

export default function OrderDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { ratings } = useData()
  const { addItem } = useCart()
  const toast = useToast()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [ratingDish, setRatingDish] = useState(null)
  const prevStatus = useRef(null)

  const load = useCallback(async () => {
    try {
      const data = await api.orders.get(id)
      setOrder(data)
      setError('')
      return data
    } catch (e) {
      setError(e?.status === 404 ? 'not-found' : 'load-failed')
      return null
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    setLoading(true)
    setOrder(null)
    load()
  }, [load])

  useEffect(() => {
    if (!order || order.status === 'completed') return undefined
    const timer = setInterval(() => { load() }, 12000)
    const onVisible = () => { if (!document.hidden) load() }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [order, load])

  useEffect(() => {
    if (!order) return
    if (prevStatus.current && prevStatus.current !== order.status) {
      const st = statusInfo(order.status)
      toast(st.label)
    }
    prevStatus.current = order.status
  }, [order, toast])

  if (loading && !order) {
    return (
      <>
        <PageHeader title="订单" back />
        <div className="page stack" style={{ marginTop: 'var(--s4)' }}>
          <div className="skeleton" style={{ height: 120, borderRadius: 'var(--r-lg)' }} />
          <div className="skeleton" style={{ height: 180, borderRadius: 'var(--r-lg)' }} />
        </div>
      </>
    )
  }

  if (!order) {
    return (
      <>
        <PageHeader title="订单" back />
        <EmptyState
          pose="mate"
          title={error === 'not-found' ? '这单找不到' : '订单没取到'}
          note={error === 'not-found' ? '可能已经被删掉了。' : '网络或服务端出了点状况。'}
          action={<button type="button" className="btn btn--honey" onClick={() => navigate('/orders')}>回订单列表</button>}
        />
      </>
    )
  }

  const st = statusInfo(order.status)
  const cur = statusIndex(order.status)
  const split = splitOrder(order)
  const items = order.items || []

  const rate = (it) => {
    setRatingDish({ dish_id: it.dish_id, name: it.dish_name })
  }

  const again = () => {
    let n = 0
    for (const it of items) {
      for (let i = 0; i < (Number(it.quantity) || 1); i++) {
        addItem({ id: it.dish_id, name: it.dish_name, price: it.price, category: it.category })
        n++
      }
    }
    if (n) {
      toast(`照这桌加了 ${n} 份`)
      navigate('/cart')
    } else {
      toast('这桌的菜都下架了')
    }
  }

  return (
    <>
      <PageHeader
        title={`订单 #${order.id}`}
        sub={formatWhen(order.created_at)}
        back
        right={<span className={`tag tag--${st.tone}`}>{st.label}</span>}
      />
      <div className="page order-detail">
        <section className="card card--pad order-hero">
          <p className="t-micro">现在的火候</p>
          <h1 className="t-title">{st.label}</h1>
          <p className="t-note">{st.desc}</p>
          <div className="timeline" aria-label="订单进度">
            {ORDER_FLOW.map((s, i) => (
              <div key={s} className={`timeline__step${i <= cur ? ' is-done' : ''}${i === cur ? ' is-current' : ''}`}>
                <span className="timeline__dot">
                  {i < cur ? <Icon name="check" size={12} strokeWidth={2.4} /> : i + 1}
                </span>
                <span className="timeline__label">{statusInfo(s).label}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="card card--pad order-block">
          <div className="row row--between">
            <h2 className="t-h2">这桌菜</h2>
            <span className="t-micro">{orderCount(order)} 份</span>
          </div>
          <ul className="order-items">
            {items.map((it) => {
              const sum = summarizeDish((ratings || []).filter((r) => Number(r.dish_id) === Number(it.dish_id)))
              return (
                <li key={it.id || `${it.dish_id}-${it.added_by}`} className="order-item">
                  <div className="grow">
                    <p className="order-item__name">
                      {it.dish_name}
                      <span className={`tag tag--${it.added_by === 'me' ? 'sage' : 'honey'}`}>{it.added_by === 'me' ? '我' : 'TA'}</span>
                    </p>
                    <p className="t-micro">{money(it.price)} × {it.quantity}</p>
                    {order.status === 'completed' ? (
                      <button type="button" className="order-item__rate" onClick={() => rate(it)}>
                        <Icon name="star" size={12} fill={sum.count > 0} />
                        {sum.count ? `均分 ${sum.avg} · 再记一笔` : '给这道记一笔'}
                      </button>
                    ) : null}
                  </div>
                  <span className="t-num">{money((Number(it.price) || 0) * (Number(it.quantity) || 0))}</span>
                </li>
              )
            })}
          </ul>
        </section>

        {order.note ? (
          <section className="order-note">
            <Icon name="edit" size={16} />
            <p>{order.note}</p>
          </section>
        ) : null}

        <section className="card card--pad order-block">
          <div className="order-line"><span>合计</span><b className="price">{money(order.total_price)}</b></div>
          <div className="order-line"><span>买单方式</span><span>{PAYER_LABEL[order.payer] || 'AA 各付各的'}</span></div>
          <div className="order-line"><span>我</span><span className="t-num">{money(split.me)}</span></div>
          <div className="order-line"><span>TA</span><span className="t-num">{money(split.partner)}</span></div>
        </section>

        <button type="button" className="btn btn--ghost btn--block" onClick={again}>
          <Icon name="refresh" size={16} /> 照这桌再来一单
        </button>
      </div>

      <RatingDialog
        open={!!ratingDish}
        dish={ratingDish}
        orderId={order.id}
        onClose={() => setRatingDish(null)}
      />
    </>
  )
}
