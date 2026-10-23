import { NavLink } from 'react-router-dom'
import Icon from './Icon.jsx'
import { useCart } from '../state/CartContext.jsx'

const TABS = [
  { to: '/today', label: '今天', icon: 'home' },
  { to: '/menu', label: '菜单', icon: 'menu' },
  { to: '/cart', label: '锅巴', icon: 'pot' },
  { to: '/me', label: '我的', icon: 'me' },
]

export default function Dock() {
  const { count } = useCart()
  return (
    <nav className="dock" aria-label="主导航">
      {TABS.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          className={({ isActive }) => `dock__tab${isActive ? ' is-active' : ''}`}
          aria-label={tab.label}
        >
          <span className="dock__icon-wrap">
            <Icon name={tab.icon} size={24} className="dock__icon" />
            {tab.to === '/cart' && count > 0 ? <span className="dock__badge">{count > 99 ? '99+' : count}</span> : null}
          </span>
          <span>{tab.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
