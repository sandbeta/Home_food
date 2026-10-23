import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Icon from '../components/Icon.jsx'
import Dialog from '../components/Dialog.jsx'
import Switch from '../components/Switch.jsx'
import { Avatar } from '../components/LambImage.jsx'
import { useData } from '../state/DataContext.jsx'
import { useCart } from '../state/CartContext.jsx'
import { useSettings } from '../state/SettingsContext.jsx'
import { useToast } from '../state/ToastContext.jsx'
import { useFavorites } from '../lib/favorites.js'
import { api } from '../lib/api.js'
import { daysBetween, monthKey, monthLabel, money, pad3 } from '../lib/format.js'
import { formatAnniDate, nextAnniversary } from '../lib/anniversary.js'

const THEMES = [
  { key: 'auto', label: '自动' },
  { key: 'day', label: '白天' },
  { key: 'night', label: '宵夜' },
]

export default function Me() {
  const { orders, anniversaries, wishes, ratings } = useData()
  const { favorites } = useFavorites()
  const { whoAmI, setWhoAmI } = useCart()
  const { settings, setTheme, setText, setMotion, setNickname, night } = useSettings()
  const toast = useToast()
  const navigate = useNavigate()
  const [nickOpen, setNickOpen] = useState(false)
  const [nickDraft, setNickDraft] = useState(settings.nickname)
  const [settlement, setSettlement] = useState(null)

  useEffect(() => {
    let alive = true
    api.settlement(monthKey()).then((d) => { if (alive) setSettlement(d) }).catch(() => {})
    return () => { alive = false }
  }, [])

  const companion = useMemo(() => {
    const a = (anniversaries || []).find((x) => !x.annual && /在一起|陪伴|恋爱|相识/.test(x.name || ''))
    return a ? { ...a, days: Math.max(1, daysBetween(a.date) + 1) } : null
  }, [anniversaries])

  const stats = useMemo(() => {
    const spend = (orders || []).reduce((s, o) => s + (Number(o.total_price) || 0), 0)
    const dishIds = new Set()
    for (const o of orders || []) for (const it of o.items || []) dishIds.add(Number(it.dish_id))
    return {
      orders: orders.length,
      spend,
      dishes: dishIds.size,
      favorites: favorites.length,
      ratings: ratings.length,
    }
  }, [orders, favorites.length, ratings.length])

  const upcoming = useMemo(() => nextAnniversary(anniversaries), [anniversaries])
  const pendingWishes = useMemo(() => (wishes || []).filter((w) => w.status === 'pending').slice(0, 3), [wishes])

  const badges = [
    { key: 'first', label: '第一顿', icon: 'bowl', on: stats.orders >= 1, hint: '下第一单' },
    { key: 'ten', label: '十顿饭', icon: 'pot', on: stats.orders >= 10, hint: '攒够 10 单' },
    { key: 'explore', label: '探索者', icon: 'menu', on: stats.dishes >= 20, hint: '吃过 20 道' },
    { key: 'record', label: '记录员', icon: 'star', on: stats.ratings >= 5, hint: '记 5 次分' },
    { key: 'collect', label: '收藏家', icon: 'heart', on: stats.favorites >= 10, hint: '收藏 10 道' },
  ]

  const saveNick = () => {
    setNickname(nickDraft)
    setNickOpen(false)
    toast('名字换了')
  }

  return (
    <div className="page page--top me-page">
      <header className="me-hero">
        <Avatar className="avatar--lg" />
        <div className="grow">
          <p className="t-micro">这间厨房属于</p>
          <h1 className="t-display me-hero__name">{settings.nickname}</h1>
          <p className="t-note">
            {companion ? `陪伴懒懒 ${pad3(companion.days)} 天啦` : stats.orders ? `一起吃过 ${stats.orders} 顿` : '还没开火，等你点菜'}
          </p>
        </div>
        <button
          type="button"
          className="icon-btn icon-btn--surface"
          aria-label="改昵称"
          onClick={() => { setNickDraft(settings.nickname); setNickOpen(true) }}
        >
          <Icon name="edit" size={19} />
        </button>
      </header>

      <section className="me-stats" aria-label="吃饭记录">
        <div className="me-stat card"><span className="me-stat__value t-num">{stats.orders}</span><span className="me-stat__label">单</span></div>
        <div className="me-stat card"><span className="me-stat__value t-num">{money(stats.spend)}</span><span className="me-stat__label">一起吃</span></div>
        <div className="me-stat card"><span className="me-stat__value t-num">{stats.dishes}</span><span className="me-stat__label">道菜</span></div>
        <Link to="/menu?fav=1" className="me-stat card"><span className="me-stat__value t-num">{stats.favorites}</span><span className="me-stat__label">收藏</span></Link>
      </section>

      {settlement && settlement.orders_count ? (
        <div className="banner me-settle">
          <Icon name="calendar" size={18} />
          <span className="grow">
            {monthLabel(settlement.month)} · {settlement.orders_count} 顿 · <b className="t-num">{money(settlement.total)}</b>
            <span className="t-note">（我 {money(settlement.owed_me)} / TA {money(settlement.owed_partner)}）</span>
          </span>
        </div>
      ) : null}

      <section className="section">
        <div className="section__head">
          <h2 className="section__title">我们的日子</h2>
          <Link to="/admin/anniversaries" className="section__action">去记日子</Link>
        </div>
        {anniversaries.length ? (
          <div className="card card--pad me-anni">
            <div className="me-anni__next">
              <Icon name="sparkle" size={18} />
              <div className="grow">
                {upcoming ? (
                  <>
                    <p className="t-note">离「{upcoming.anniversary.name}」还有</p>
                    <p className="me-anni__days t-num">{upcoming.days} <small>天</small></p>
                  </>
                ) : (
                  <p className="t-note">日子都记着，等下一个</p>
                )}
              </div>
            </div>
            <ul className="me-anni__list">
              {anniversaries.slice(0, 4).map((a) => (
                <li key={a.id}>
                  <span className="grow">{a.name}{a.annual ? <span className="tag">每年</span> : null}</span>
                  <span className="t-micro">{formatAnniDate(a.date)}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <button type="button" className="banner banner--sage me-empty" onClick={() => navigate('/admin/anniversaries')}>
            <Icon name="calendar" size={18} />
            <span className="grow">还没记日子，把在一起的日期记上</span>
            <Icon name="arrow" size={18} />
          </button>
        )}
      </section>

      <section className="section">
        <div className="section__head">
          <h2 className="section__title">小成就</h2>
          <span className="t-micro">做饭做出来的</span>
        </div>
        <div className="badge-row scroll-x">
          {badges.map((b) => (
            <div key={b.key} className={`badge-card${b.on ? ' is-on' : ''}`} title={b.on ? '已解锁' : b.hint}>
              <span className="badge-card__icon"><Icon name={b.icon} size={22} /></span>
              <span className="badge-card__label">{b.label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section__head">
          <h2 className="section__title">想吃的</h2>
          <Link to="/menu?wish=1" className="section__action">许个愿</Link>
        </div>
        {pendingWishes.length ? (
          <div className="card card--pad stack stack--tight">
            {pendingWishes.map((w) => (
              <div key={w.id} className="wish-line">
                <Icon name="wish" size={16} />
                <span className="grow">{w.name}</span>
                <span className="t-micro">{w.by === 'me' ? '我' : 'TA'}</span>
              </div>
            ))}
            <Link to="/admin/wishes" className="section__action" style={{ paddingLeft: 0 }}>看全部 →</Link>
          </div>
        ) : (
          <button type="button" className="banner me-empty" onClick={() => navigate('/menu?wish=1')}>
            <Icon name="wish" size={18} />
            <span className="grow">还没许愿，想吃什么告诉懒懒</span>
            <Icon name="arrow" size={18} />
          </button>
        )}
      </section>

      <section className="section">
        <div className="section__head">
          <h2 className="section__title">厨房里的</h2>
        </div>
        <div className="rows me-links">
          <Link to="/orders" className="rows__item me-link">
            <Icon name="list" size={20} /><span className="grow">全部订单</span><Icon name="arrow" size={18} />
          </Link>
          <Link to="/fridge" className="rows__item me-link">
            <Icon name="fridge" size={20} /><span className="grow">冰箱</span><Icon name="arrow" size={18} />
          </Link>
          <Link to="/admin" className="rows__item me-link">
            <Icon name="settings" size={20} /><span className="grow">厨房后台</span><Icon name="arrow" size={18} />
          </Link>
        </div>
      </section>

      <section className="section">
        <div className="section__head">
          <h2 className="section__title">顺手调一下</h2>
        </div>
        <div className="card card--pad stack">
          <div className="setting-row">
            <div>
              <p className="setting-row__label">外观</p>
              <p className="t-micro">跟着时间走，也可以钉住</p>
            </div>
            <div className="seg seg--compact" style={{ minWidth: 170 }}>
              {THEMES.map((t) => (
                <button key={t.key} type="button" className="seg__item" aria-pressed={settings.theme === t.key} onClick={() => setTheme(t.key)}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          <div className="setting-row">
            <div>
              <p className="setting-row__label">字号</p>
              <p className="t-micro">大一号，看得松快</p>
            </div>
            <div className="seg seg--compact" style={{ minWidth: 140 }}>
              <button type="button" className="seg__item" aria-pressed={settings.text !== 'lg'} onClick={() => setText('md')}>标准</button>
              <button type="button" className="seg__item" aria-pressed={settings.text === 'lg'} onClick={() => setText('lg')}>大</button>
            </div>
          </div>
          <div className="setting-row">
            <div>
              <p className="setting-row__label">少动一点</p>
              <p className="t-micro">关掉位移和呼吸，留淡入</p>
            </div>
            <Switch
              checked={settings.motion === 'reduce'}
              label="减少动效"
              onChange={(v) => {
                setMotion(v ? 'reduce' : 'auto')
                toast(v ? '已经收着动了' : '动效回来了')
              }}
            />
          </div>
          <div className="setting-row">
            <div>
              <p className="setting-row__label">这顿记在</p>
              <p className="t-micro">加购时按这个归属</p>
            </div>
            <div className="seg seg--compact" style={{ minWidth: 140 }}>
              <button type="button" className="seg__item" aria-pressed={whoAmI === 'me'} onClick={() => setWhoAmI('me')}>我</button>
              <button type="button" className="seg__item" aria-pressed={whoAmI === 'partner'} onClick={() => setWhoAmI('partner')}>TA</button>
            </div>
          </div>
        </div>
      </section>

      <p className="me-foot">
        懒懒的厨房 · 两个人在用{night ? ' · 现在宵夜档' : ''}
        <br />
        <span className="t-note">数据只放在家里，不上云</span>
      </p>

      <Dialog open={nickOpen} onClose={() => setNickOpen(false)} labelledBy="nick-title">
        <h2 id="nick-title" className="t-h2">换个名字</h2>
        <p className="t-note" style={{ marginTop: 'var(--s1)', marginBottom: 'var(--s3)' }}>最多 12 个字。</p>
        <div className="field">
          <input
            className="field__input"
            value={nickDraft}
            maxLength={12}
            onChange={(e) => setNickDraft(e.target.value)}
            aria-label="昵称"
          />
        </div>
        <div className="dialog__actions">
          <button type="button" className="btn btn--ghost" onClick={() => setNickOpen(false)}>先不改</button>
          <button type="button" className="btn btn--primary" onClick={saveNick}>就这个</button>
        </div>
      </Dialog>
    </div>
  )
}
