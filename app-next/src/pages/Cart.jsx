import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PageHeader from '../components/PageHeader.jsx'
import Icon from '../components/Icon.jsx'
import DishThumb from '../components/DishThumb.jsx'
import Stepper from '../components/Stepper.jsx'
import SwipeRow from '../components/SwipeRow.jsx'
import EmptyState from '../components/EmptyState.jsx'
import ConfirmDialog from '../components/ConfirmDialog.jsx'
import { useCart } from '../state/CartContext.jsx'
import { useData } from '../state/DataContext.jsx'
import { useToast } from '../state/ToastContext.jsx'
import { api } from '../lib/api.js'
import { money, monthKey, monthLabel } from '../lib/format.js'

export default function Cart() {
  const { items, total, count, split, setQuantity, removeItem, clearCart, shareCart, fetchShared, mergeShared } = useCart()
  const { dishesById, refreshOrders } = useData()
  const toast = useToast()
  const navigate = useNavigate()
  const [payer, setPayer] = useState('aa')
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [shared, setShared] = useState(null)
  const [sharedDismissed, setSharedDismissed] = useState(false)
  const [settlement, setSettlement] = useState(null)
  const [confirmClear, setConfirmClear] = useState(false)

  useEffect(() => {
    let alive = true
    fetchShared().then((d) => { if (alive) setShared(d) }).catch(() => {})
    api.settlement(monthKey()).then((d) => { if (alive) setSettlement(d) }).catch(() => {})
    return () => { alive = false }
  }, [fetchShared])

  const owed = useMemo(() => {
    if (payer === 'me') return { me: total, partner: 0 }
    if (payer === 'partner') return { me: 0, partner: total }
    return { me: split.me || 0, partner: split.partner || 0 }
  }, [payer, total, split])

  const groups = useMemo(() => {
    const mine = items.filter((i) => i.added_by === 'me')
    const theirs = items.filter((i) => i.added_by === 'partner')
    return [
      { key: 'me', label: '我点的', items: mine },
      { key: 'partner', label: 'TA 点的', items: theirs },
    ].filter((g) => g.items.length)
  }, [items])

  const subtotalOf = (list) => list.reduce((s, i) => s + (Number(i.price) || 0) * (Number(i.quantity) || 0), 0)

  const doShare = async () => {
    if (!items.length) return
    try {
      const data = await shareCart()
      setShared(data)
      setSharedDismissed(false)
      toast(`已分享 ${count} 份给 TA`)
    } catch {
      toast('没分享出去，再试一次')
    }
  }

  const doMerge = () => {
    const n = mergeShared(shared)
    if (n) {
      toast(`并进来 ${n} 件`)
      setSharedDismissed(true)
    }
  }

  const submit = async () => {
    if (!items.length || submitting) return
    setSubmitting(true)
    try {
      const order = await api.orders.create({
        items: items.map((i) => ({ dish_id: i.dish_id, quantity: i.quantity, added_by: i.added_by })),
        payer,
        note: note.trim(),
      })
      await refreshOrders()
      clearCart()
      setNote('')
      toast('锅已点上，等着开火')
      navigate(`/orders/${order.id}`)
    } catch (e) {
      const msg = e?.status === 400 ? '有菜下架了，回菜单看一眼' : '没下成单，再试一次'
      toast(msg)
    } finally {
      setSubmitting(false)
    }
  }

  const sharedVisible = shared && Array.isArray(shared.items) && shared.items.length > 0
    && shared.sharedBy === 'partner' && !sharedDismissed

  return (
    <>
      <PageHeader
        title="锅巴"
        sub={count ? `${count} 份 · ${money(total)}` : '今天想吃什么'}
        right={(
          <div className="row" style={{ gap: 0 }}>
            <button type="button" className="icon-btn" aria-label="分享锅巴给 TA" onClick={doShare} disabled={!items.length}>
              <Icon name="share" size={21} />
            </button>
            {items.length ? (
              <button type="button" className="icon-btn" aria-label="清空锅巴" onClick={() => setConfirmClear(true)}>
                <Icon name="trash" size={20} />
              </button>
            ) : null}
          </div>
        )}
      />

      <div className={`page cart-page${items.length ? ' cart-page--checkout' : ''}`}>
        {sharedVisible ? (
          <div className="banner banner--honey cart__shared">
            <Icon name="users" size={18} />
            <span className="grow">TA 分享了 {shared.items.length} 件</span>
            <button type="button" className="btn btn--sm" onClick={doMerge}>并进来</button>
          </div>
        ) : null}

        {!items.length ? (
          <EmptyState
            pose="mate"
            title="锅是空的诶"
            note="去菜单挑两道，锅巴等着装。"
            action={<button type="button" className="btn btn--primary" onClick={() => navigate('/menu')}>去点菜</button>}
          />
        ) : (
          <>
            {groups.map((g) => (
              <section key={g.key} className="cart-group">
                <div className="cart-group__head">
                  <h2 className="cart-group__title">
                    <span className={`person-dot person-dot--${g.key}`} aria-hidden="true" />
                    {g.label}
                  </h2>
                  <span className="t-note t-num">{money(subtotalOf(g.items))}</span>
                </div>
                <div className="cart-rows">
                  {g.items.map((item) => {
                    const current = dishesById.get(Number(item.dish_id))
                    return (
                      <SwipeRow
                        key={`${item.dish_id}-${item.added_by}`}
                        deleteLabel="删除"
                        onDelete={() => {
                          removeItem(item.dish_id, item.added_by)
                          toast(`拿掉了 ${item.name}`)
                        }}
                      >
                        <div className="cart-row">
                          <span className={`cart-row__media${current?.image_url || item.image_url ? ' has-photo' : ''}`}>
                            <DishThumb dish={current || item} size={48} />
                          </span>
                          <div className="cart-row__text">
                            <p className="cart-row__name">{item.name}</p>
                            <p className="t-micro">{money(item.price)} / 份{Number(current?.available) === 0 ? ' · 今天不做了' : ''}</p>
                          </div>
                          <span className="cart-row__sum t-num">{money((Number(item.price) || 0) * (Number(item.quantity) || 0))}</span>
                          <Stepper
                            value={item.quantity}
                            min={1}
                            max={20}
                            label={`${item.name} 份数`}
                            onChange={(q) => setQuantity(item.dish_id, q, item.added_by)}
                          />
                        </div>
                      </SwipeRow>
                    )
                  })}
                </div>
              </section>
            ))}

            <p className="cart-hint">左滑一行可以删掉</p>

            <section className="card card--pad cart-block">
              <div className="cart-payer">
                <div>
                  <p className="t-micro">谁买单</p>
                  <p className="t-note">{payer === 'aa' ? '按谁点的各付各的' : payer === 'me' ? '这顿我来' : '这顿 TA 来'}</p>
                </div>
                <div className="seg seg--compact cart-payer__seg">
                  <button type="button" className="seg__item" aria-pressed={payer === 'aa'} onClick={() => setPayer('aa')}>AA</button>
                  <button type="button" className="seg__item" aria-pressed={payer === 'me'} onClick={() => setPayer('me')}>我请</button>
                  <button type="button" className="seg__item" aria-pressed={payer === 'partner'} onClick={() => setPayer('partner')}>TA 请</button>
                </div>
              </div>
              <div className="cart-owed">
                <span>我 <b className="t-num">{money(owed.me)}</b></span>
                <span>TA <b className="t-num">{money(owed.partner)}</b></span>
              </div>
            </section>

            <section className="card card--pad cart-block">
              <label className="t-micro" htmlFor="cart-note">给厨房的话</label>
              <div className="field field--area" style={{ marginTop: 'var(--s2)' }}>
                <textarea
                  id="cart-note"
                  aria-label="给厨房的话"
                  className="field__input"
                  rows={3}
                  maxLength={60}
                  placeholder="少辣、多放葱、几点吃…"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
                <span className="field__count">{note.length}/60</span>
              </div>
            </section>

            {settlement && settlement.orders_count ? (
              <div className="banner cart__settle">
                <Icon name="calendar" size={18} />
                <span className="grow">
                  {monthLabel(settlement.month)}一起吃了 <b className="t-num">{money(settlement.total)}</b>
                  <span className="t-note"> · 我 {money(settlement.owed_me)} / TA {money(settlement.owed_partner)}</span>
                </span>
              </div>
            ) : null}

            <div className="cart-checkout" role="region" aria-label="结算">
              <div className="cart-checkout__sum">
                <span className="t-micro">合计</span>
                <span className="price">{money(total)}</span>
              </div>
              <button
                type="button"
                className="btn btn--primary cart-checkout__btn"
                onClick={submit}
                disabled={submitting || !items.length}
              >
                {submitting ? '点上火…' : `下单 · ${money(total)}`}
              </button>
            </div>
          </>
        )}
      </div>

      <ConfirmDialog
        open={confirmClear}
        title="把锅巴清空？"
        note="清掉之后要重新点，已经点过的菜不会受影响。"
        confirmText="清空"
        danger
        onCancel={() => setConfirmClear(false)}
        onConfirm={() => { clearCart(); setConfirmClear(false); toast('锅巴清空了') }}
      />
    </>
  )
}
