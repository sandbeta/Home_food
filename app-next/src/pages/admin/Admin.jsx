import { Link } from 'react-router-dom'
import PageHeader from '../../components/PageHeader.jsx'
import AdminTabs from '../../components/AdminTabs.jsx'
import Icon from '../../components/Icon.jsx'
import EmptyState from '../../components/EmptyState.jsx'
import { useData } from '../../state/DataContext.jsx'
import { formatWhen, money, orderItemsText } from '../../lib/format.js'

export default function Admin() {
  const { dishes, orders, wishes, anniversaries, refreshOrders } = useData()
  const doing = orders.filter((o) => o.status !== 'completed')
  const pendingWishes = wishes.filter((w) => w.status === 'pending')
  const available = dishes.filter((d) => Number(d.available) !== 0)
  const recent = [...orders].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 3)

  const stats = [
    { to: '/admin/dishes', label: '菜品', value: available.length, note: `共 ${dishes.length} 道`, icon: 'bowl', tone: 'honey' },
    { to: '/admin/orders', label: '在锅里', value: doing.length, note: `一共 ${orders.length} 单`, icon: 'flame', tone: 'coral' },
    { to: '/admin/wishes', label: '待处理愿望', value: pendingWishes.length, note: `一共 ${wishes.length} 条`, icon: 'wish', tone: 'sage' },
    { to: '/admin/anniversaries', label: '纪念日', value: anniversaries.length, note: '记着就不忘', icon: 'calendar', tone: 'sky' },
  ]

  return (
    <>
      <PageHeader title="厨房后台" sub="锅碗瓢盆，都在这儿" back />
      <AdminTabs />
      <div className="page admin-page">
        <div className="admin-stats">
          {stats.map((s) => (
            <Link key={s.to} to={s.to} className="admin-stat card">
              <span className={`admin-stat__icon admin-stat__icon--${s.tone}`}><Icon name={s.icon} size={20} /></span>
              <span className="admin-stat__value t-num">{s.value}</span>
              <span className="admin-stat__label">{s.label}</span>
              <span className="t-micro">{s.note}</span>
            </Link>
          ))}
        </div>

        <section className="section">
          <div className="section__head">
            <h2 className="section__title">最近订单</h2>
            <Link to="/admin/orders" className="section__action">去处理</Link>
          </div>
          {recent.length ? (
            <div className="card card--pad stack stack--tight">
              {recent.map((o) => (
                <Link key={o.id} to={`/orders/${o.id}`} className="admin-recent">
                  <div className="grow">
                    <p className="admin-recent__name">{orderItemsText(o, 2)}</p>
                    <p className="t-micro">{formatWhen(o.created_at)} · {o.status === 'completed' ? '做好啦' : '还在锅里'}</p>
                  </div>
                  <span className="price price--sm">{money(o.total_price)}</span>
                  <Icon name="arrow" size={18} />
                </Link>
              ))}
              <button type="button" className="section__action" style={{ paddingLeft: 0 }} onClick={refreshOrders}>
                刷新订单
              </button>
            </div>
          ) : (
            <EmptyState pose="mate" title="还没有订单" note="家人点了菜，这里就会出现。" />
          )}
        </section>

        <section className="section">
          <div className="section__head">
            <h2 className="section__title">能做的事</h2>
          </div>
          <div className="rows">
            <Link to="/admin/dishes" className="rows__item me-link"><Icon name="bowl" size={20} /><span className="grow">加菜、改价、上下架</span><Icon name="arrow" size={18} /></Link>
            <Link to="/admin/orders" className="rows__item me-link"><Icon name="flame" size={20} /><span className="grow">推进订单火候</span><Icon name="arrow" size={18} /></Link>
            <Link to="/admin/anniversaries" className="rows__item me-link"><Icon name="calendar" size={20} /><span className="grow">记日子</span><Icon name="arrow" size={18} /></Link>
            <Link to="/admin/wishes" className="rows__item me-link"><Icon name="wish" size={20} /><span className="grow">处理想吃的</span><Icon name="arrow" size={18} /></Link>
          </div>
        </section>

        <p className="t-micro admin-note">
          后台写操作在公网访问时会要求管理密码；局域网里不会打扰。
        </p>
      </div>
    </>
  )
}
