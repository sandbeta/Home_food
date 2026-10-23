import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import Icon from '../components/Icon.jsx'
import DishThumb from '../components/DishThumb.jsx'
import { Avatar, LambImage } from '../components/LambImage.jsx'
import { useData } from '../state/DataContext.jsx'
import { useSettings } from '../state/SettingsContext.jsx'
import { useCart } from '../state/CartContext.jsx'
import { useDishSheet } from '../state/DishSheetContext.jsx'
import { useToast } from '../state/ToastContext.jsx'
import { useFavorites } from '../lib/favorites.js'
import { readTodayMood, writeTodayMood } from '../lib/settings.js'
import { anniversariesToday, nextAnniversary } from '../lib/anniversary.js'
import { pickDaily, computeEatSignals } from '../lib/pick.js'
import { countThisWeek, daysBetween, money, monthDay, pad3, timeHM, weekdayCN, ymd } from '../lib/format.js'
import { readFridge } from '../lib/fridge.js'

const MOODS = [
  { key: 'happy', label: '开心' },
  { key: 'spicy', label: '想吃辣' },
  { key: 'tired', label: '想躺平' },
  { key: 'sweet', label: '甜一口' },
  { key: 'light', label: '清淡点' },
]

const POSES = new Set(['sleep', 'pray', 'play', 'bath', 'busy', 'steal'])

const LINES = {
  sleep: ['先睡为敬', '再躺五分钟'],
  pray: ['好运 +1', '今天有好事'],
  play: ['今天状态很好', '懒懒玩的很开心'],
  bath: ['哈~ 好舒呀~', '泡泡有点多'],
  busy: ['在跑在跑', '马上就好'],
  steal: ['没连上厨房', '等会儿再试'],
}

export default function Today() {
  const { dishes, orders, anniversaries, wishes, loading, errors, reload } = useData()
  const { settings, night } = useSettings()
  const { addItem, count: cartCount } = useCart()
  const { openDish } = useDishSheet()
  const toast = useToast()
  const { favorites } = useFavorites()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const forcedPose = import.meta.env.DEV && POSES.has(params.get('pose')) ? params.get('pose') : null
  const now = useMemo(() => new Date(), [])
  const dateKey = ymd(now)
  const [mood, setMood] = useState(() => readTodayMood(dateKey))
  const [pickIndex, setPickIndex] = useState(0)
  const [fridgeCount, setFridgeCount] = useState(() => Object.keys(readFridge()).length)

  useEffect(() => {
    setFridgeCount(Object.keys(readFridge()).length)
  }, [])

  useEffect(() => { setPickIndex(0) }, [mood, night, dateKey])

  const todayAnniversaries = useMemo(() => anniversariesToday(anniversaries, now), [anniversaries, now])
  const nextAnni = useMemo(() => nextAnniversary(anniversaries, now), [anniversaries, now])
  const companion = useMemo(() => {
    const a = (anniversaries || []).find((x) => !x.annual && /在一起|陪伴|恋爱|相识/.test(x.name || ''))
    if (!a) return null
    return { ...a, days: Math.max(1, daysBetween(a.date, now) + 1) }
  }, [anniversaries, now])

  const todayOrders = useMemo(() => (orders || []).filter((o) => {
    const d = new Date(o.created_at)
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate()
  }), [orders, now])
  const doing = useMemo(() => (orders || []).filter((o) => !['completed'].includes(o.status)), [orders])
  const weekCount = useMemo(() => countThisWeek(orders, now), [orders, now])

  const storyIds = useMemo(() => {
    const ids = []
    for (const w of wishes || []) if (w.added_dish_id != null) ids.push(w.added_dish_id)
    for (const a of anniversaries || []) if (a.dish_id != null) ids.push(a.dish_id)
    return ids
  }, [wishes, anniversaries])

  const pickList = useMemo(() => {
    if (!dishes.length) return []
    return pickDaily({
      dishes,
      signals: {
        favoriteIds: favorites.map((f) => f.id),
        storyIds,
        mood,
        dateKey,
        now,
        night,
        eat: computeEatSignals(orders),
      },
      limit: 12,
    })
  }, [dishes, favorites, storyIds, mood, dateKey, now, night, orders])

  const pick = pickList.length ? pickList[pickIndex % pickList.length] : null
  const dish = pick?.dish || null

  const pose = useMemo(() => {
    if (forcedPose) return forcedPose
    if (errors.dishes) return 'steal'
    if (loading && !dishes.length) return 'busy'
    if (todayAnniversaries.length) return 'pray'
    if (night) return 'bath'
    const h = now.getHours()
    if (h < 10) return 'sleep'
    if (todayOrders.length) return 'pray'
    if (h >= 17 || now.getDay() === 0 || now.getDay() === 6) return 'play'
    return 'sleep'
  }, [forcedPose, errors.dishes, loading, dishes.length, todayAnniversaries.length, night, now, todayOrders.length])

  const line = (LINES[pose] || LINES.sleep)[Math.floor(now.getMinutes() / 3) % (LINES[pose] || LINES.sleep).length]

  const pickFlag = useMemo(() => {
    if (!pick) return null
    if (pick.flags.favorite) return { label: '你收藏过', tone: 'tag--coral' }
    if (pick.flags.story) return { label: '有点故事', tone: 'tag--honey' }
    if (pick.flags.hot) return { label: '常点', tone: 'tag--sage' }
    if (pick.flags.fresh) return { label: '没试过', tone: 'tag--honey' }
    return null
  }, [pick])

  const setMoodAndStore = (key) => {
    const next = mood === key ? '' : key
    setMood(next)
    writeTodayMood(dateKey, next)
  }

  const addToday = () => {
    if (!dish) return
    addItem(dish)
    toast(`${dish.name} 进锅巴了`)
  }

  const topSub = companion
    ? `陪伴懒懒 ${pad3(companion.days)} 天啦`
    : orders.length
      ? `一起吃过 ${orders.length} 顿`
      : '第一顿，等你点菜'


  return (
    <div className="page page--top today">
      <header className="home-top">
        <div className="home-top__who">
          <Avatar />
          <div className="home-top__id">
            <p className="home-top__nick">{settings.nickname}</p>
            <p className="home-top__sub">{topSub}</p>
          </div>
        </div>
        <div className="home-top__right">
          <p className="home-top__clock t-num">{timeHM(now)}</p>
          <p className="home-top__date">{monthDay(now)} 周{weekdayCN(now)}</p>
        </div>
      </header>

      {todayAnniversaries.length ? (
        <div className="banner banner--honey today__banner">
          <Icon name="sparkle" size={18} />
          <span className="grow">今天是「{todayAnniversaries[0].name}」</span>
          {todayAnniversaries[0].dish_id ? (
            <button type="button" className="btn btn--sm" onClick={() => openDish(todayAnniversaries[0].dish_id)}>
              吃那道
            </button>
          ) : null}
        </div>
      ) : null}

      {doing.length ? (
        <Link to="/orders" className="banner today__banner today__banner--doing">
          <Icon name="flame" size={18} />
          <span className="grow">{doing.length} 单还在锅里</span>
          <Icon name="arrow" size={18} />
        </Link>
      ) : null}

      <section className={`hero-card hero-card--${pose}`} aria-label="懒懒今天的状态">
        <div className="hero-card__scene">
          <LambImage pose={pose} className="hero-card__img" eager alt="" />
          <span className="hero-card__status">
            {pose === 'bath' ? '泡澡中' : pose === 'pray' ? '等开饭' : pose === 'play' ? '在玩' : pose === 'busy' ? '在跑' : pose === 'steal' ? '走神了' : '睡着'}
          </span>
          <span className={`hero-card__bubble${pose === 'bath' ? ' is-br' : ''}${pose === 'play' || pose === 'bath' ? ' is-wide' : ''}`}>{line}</span>
        </div>
        <div className="hero-card__caption">
          <div>
            <p className="t-micro">今天想吃什么</p>
            <h1 className="hero-card__title">锅已热，<span className="t-coral">就等你</span>点菜</h1>
          </div>
          <span className="hero-card__days t-num">{companion ? `${pad3(companion.days)} 天` : `${orders.length} 顿`}</span>
        </div>
      </section>

      {errors.dishes && !dishes.length ? (
        <div className="card card--pad today__error">
          <p className="t-body" style={{ fontWeight: 700 }}>没连上厨房</p>
          <p className="t-note">检查一下网络，或者服务端有没有开着。</p>
          <button type="button" className="btn btn--honey" onClick={reload}>再敲一次锅</button>
        </div>
      ) : null}

      {dish ? (
        <section className="pick card card--lift" aria-label="今日主推">
          <div className="pick__text">
            <p className="eyebrow">
              <Icon name="sparkle" size={13} /> 今日主推 · 第 {pickIndex + 1} 道
            </p>
            <button type="button" className="pick__name-btn" onClick={() => openDish(dish)}>
              <span className="pick__name">{dish.name}</span>
            </button>
            <p className="pick__desc t-clamp-2">{dish.description || '今天这道，刚好。'}</p>
            <div className="pick__meta">
              <span className="price">{money(dish.price)}</span>
              {pickFlag ? <span className={`tag ${pickFlag.tone}`}>{pickFlag.label}</span> : null}
            </div>
            <div className="pick__actions">
              <button type="button" className="btn btn--honey btn--sm" onClick={addToday}>
                <Icon name="plus" size={16} /> 端上来
              </button>
              <button
                type="button"
                className="btn btn--ghost btn--sm"
                onClick={() => setPickIndex((i) => (i + 1) % Math.max(1, pickList.length))}
              >
                <Icon name="refresh" size={16} /> 换一道
              </button>
            </div>
          </div>
          <button type="button" className="pick__media" onClick={() => openDish(dish)} aria-label={`看 ${dish.name}`}>
            <DishThumb dish={dish} size={104} eager />
          </button>
        </section>
      ) : loading ? (
        <section className="pick card card--lift">
          <div className="pick__text">
            <div className="skeleton" style={{ height: 14, width: 100 }} />
            <div className="skeleton" style={{ height: 28, width: 160, marginTop: 12 }} />
            <div className="skeleton" style={{ height: 12, width: '85%', marginTop: 12 }} />
            <div className="skeleton" style={{ height: 36, width: 180, marginTop: 16 }} />
          </div>
          <div className="skeleton pick__media" />
        </section>
      ) : null}

      <section className="mood-block" aria-label="今天的心情">
        <p className="mood-block__label">今天什么心情</p>
        <div className="mood-block__chips scroll-x">
          {MOODS.map((m) => (
            <button
              key={m.key}
              type="button"
              className={`chip chip--field${mood === m.key ? ' chip--active' : ''}`}
              aria-pressed={mood === m.key}
              onClick={() => setMoodAndStore(m.key)}
            >
              {m.label}
            </button>
          ))}
        </div>
      </section>

      <section className="stats-grid" aria-label="最近的家务事">
        <div className="stat card">
          <span className="stat__label">本周开火</span>
          <span className="stat__value t-num">{weekCount}<small> 次</small></span>
        </div>
        <div className="stat card">
          <span className="stat__label">{nextAnni ? nextAnni.anniversary.name : '还没记纪念日'}</span>
          <span className="stat__value t-num">
            {nextAnni ? nextAnni.days : '—'}<small>{nextAnni ? ' 天' : ''}</small>
          </span>
        </div>
        <Link to="/fridge" className="stat card">
          <span className="stat__label">冰箱里有</span>
          <span className="stat__value t-num">{fridgeCount}<small> 样</small></span>
        </Link>
      </section>

      <section className="quick-grid" aria-label="常用入口">
        <button type="button" className="quick" onClick={() => navigate('/menu')}>
          <span className="quick__icon quick__icon--honey"><Icon name="menu" size={22} /></span>
          <span>菜单</span>
        </button>
        <button type="button" className="quick" onClick={() => navigate('/cart')}>
          <span className="quick__icon quick__icon--sage"><Icon name="pot" size={22} /></span>
          <span>锅巴{cartCount ? ` ${cartCount}` : ''}</span>
        </button>
        <button type="button" className="quick" onClick={() => navigate('/fridge')}>
          <span className="quick__icon quick__icon--sky"><Icon name="fridge" size={22} /></span>
          <span>冰箱</span>
        </button>
        <button type="button" className="quick" onClick={() => navigate('/admin')}>
          <span className="quick__icon quick__icon--coral"><Icon name="settings" size={22} /></span>
          <span>厨房</span>
        </button>
      </section>

      <button type="button" className="wish-banner" onClick={() => navigate('/menu?wish=1')}>
        <span className="row" style={{ gap: 'var(--s2)' }}>
          <Icon name="wish" size={18} />
          <span>想吃的没在菜单里？许个愿</span>
        </span>
        <Icon name="arrow" size={18} />
      </button>

      <footer className="home-foot">
        <LambImage pose="footer" className="home-foot__img" alt="" />
        <p className="home-foot__copy">一起吃饭，日子就有了味道</p>
      </footer>
    </div>
  )
}
