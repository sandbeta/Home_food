import { NavLink } from 'react-router-dom'

const TABS = [
  { to: '/admin', label: '概览', end: true },
  { to: '/admin/dishes', label: '菜品' },
  { to: '/admin/orders', label: '订单' },
  { to: '/admin/anniversaries', label: '日子' },
  { to: '/admin/wishes', label: '愿望' },
]

export default function AdminTabs() {
  return (
    <nav className="admin-tabs scroll-x" aria-label="后台导航">
      {TABS.map((t) => (
        <NavLink
          key={t.to}
          to={t.to}
          end={t.end}
          className={({ isActive }) => `admin-tabs__item${isActive ? ' is-active' : ''}`}
        >
          {t.label}
        </NavLink>
      ))}
    </nav>
  )
}
