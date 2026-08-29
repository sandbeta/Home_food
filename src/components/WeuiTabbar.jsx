import { useLocation, useNavigate } from 'react-router-dom'
import Icon from './ui/Icons'
import { useCart } from './CartContext'

const TABS = [
  { path: '/home', label: '首页', icon: 'home' },
  { path: '/menu', label: '点菜', icon: 'menu' },
  { path: '/orders', label: '订单', icon: 'orders' },
  { path: '/profile', label: '我的', icon: 'user' },
]

/**
 * WeUI 底部 TabBar（49px，顶部发丝线，选中绿，标签 10px）。
 * 购物车：扁平白钮 + 红色数量角标（WeChat 徽标样式），与 TabBar 同行。
 * 是否渲染由 DockLayer 决定（试点路由才出现）。
 */
export default function WeuiTabbar() {
  const { totalCount } = useCart()
  const navigate = useNavigate()
  const { pathname } = useLocation()

  return (
    <>
      <nav className="weui-tabbar">
        {TABS.map((t) => {
          const active = pathname === t.path || (t.path === '/orders' && pathname.startsWith('/orders/'))
          return (
            <a
              key={t.path}
              href={t.path}
              onClick={(e) => { e.preventDefault(); navigate(t.path) }}
              className={active ? 'is-active' : ''}
              aria-current={active ? 'page' : undefined}
            >
              <Icon name={t.icon} size={24} strokeWidth={active ? 2 : 1.5} />
              <span className="lbl">{t.label}</span>
              {t.path === '/menu' && totalCount > 0 && <span className="badge">{totalCount}</span>}
            </a>
          )
        })}
      </nav>
      {totalCount > 0 && (
        <button
          onClick={() => navigate('/cart')}
          aria-label={`购物车，${totalCount} 件`}
          style={{
            width: 40,
            height: 40,
            marginLeft: 8,
            alignSelf: 'center',
            borderRadius: 8,
            background: 'var(--color-weui-card)',
            border: '0.5px solid var(--color-weui-line)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            flex: 'none',
          }}
        >
          <Icon name="cart" size={20} style={{ color: 'var(--color-weui-text2)' }} />
          <span
            style={{
              position: 'absolute',
              top: -6,
              right: -6,
              minWidth: 16,
              height: 16,
              padding: '0 4px',
              borderRadius: 8,
              background: 'var(--color-weui-red)',
              color: '#fff',
              fontSize: 10,
              lineHeight: '16px',
              textAlign: 'center',
            }}
          >
            {totalCount}
          </span>
        </button>
      )}
    </>
  )
}
