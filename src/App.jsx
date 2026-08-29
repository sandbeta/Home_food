import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { CartProvider } from './components/CartContext'
import DockLayer from './components/DockLayer'
import { pageEnter } from './theme/motion'

// 路由懒加载 — 按需加载页面，减小初始 bundle 体积
const Home = lazy(() => import('./pages/Home'))
const Menu = lazy(() => import('./pages/Menu'))
const DishDetail = lazy(() => import('./pages/DishDetail'))
const Cart = lazy(() => import('./pages/Cart'))
const OrderDetail = lazy(() => import('./pages/OrderDetail'))
const MyOrders = lazy(() => import('./pages/MyOrders'))
const Profile = lazy(() => import('./pages/Profile'))
const Admin = lazy(() => import('./pages/Admin'))
const AdminDishes = lazy(() => import('./pages/AdminDishes'))
const AdminOrders = lazy(() => import('./pages/AdminOrders'))

// 页面加载骨架屏
function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 border-2 border-[var(--color-clay)]/20 border-t-[var(--color-clay)] rounded-full animate-spin" />
    </div>
  )
}

function App() {
  const location = useLocation()
  const isAdmin = location.pathname.startsWith('/admin')

  return (
    <CartProvider>
      <div
        className="min-h-screen mx-auto relative border-x border-[var(--color-glass-border)] bg-[var(--color-ink-900)]"
        style={{ maxWidth: 'var(--shell-w)' }}
      >
        {/* 晨光环境光：赤陶主光（左） + 鼠尾草绿辅光（右），低透，仅作氛围 */}
        <div
          className="fixed top-[-120px] w-80 h-80 rounded-full blur-[90px] pointer-events-none"
          style={{
            left: 'calc(50% - var(--shell-w) / 2 - 20px)',
            background: 'radial-gradient(circle, rgba(200,104,63,0.10) 0%, transparent 70%)',
          }}
        />
        <div
          className="fixed top-1/3 w-64 h-64 rounded-full blur-[90px] pointer-events-none"
          style={{
            right: 'calc(50% - var(--shell-w) / 2 - 20px)',
            background: 'radial-gradient(circle, rgba(127,163,122,0.10) 0%, transparent 70%)',
          }}
        />

        {/*
          底部留白由令牌给出，取代原先硬编码的 pb-28：
          admin 路由没有停靠层，用 compact 档。
        */}
        <main
          className="relative z-10"
          style={{ paddingBottom: isAdmin ? 'var(--bottom-inset-compact)' : 'var(--bottom-inset)' }}
        >
          {/*
            页面转场：pageEnter 只动 opacity，绝不能带 transform。
            带 transform 会让本元素成为 fixed/sticky 后代的包含块，
            导致 PageHeader 的吸顶失效、FullBleedHero 的 fixed 定位错乱。
          */}
          <AnimatePresence mode="wait">
            <motion.div key={location.pathname} {...pageEnter}>
              <Suspense fallback={<PageLoader />}>
                <Routes location={location}>
                  <Route path="/" element={<Navigate to="/home" replace />} />
                  <Route path="/home" element={<Home />} />
                  <Route path="/menu" element={<Menu />} />
                  <Route path="/dish/:id" element={<DishDetail />} />
                  <Route path="/cart" element={<Cart />} />
                  {/* 结算已并入购物车：旧路由保留重定向，避免外链失效 */}
                  <Route path="/checkout" element={<Navigate to="/cart" replace />} />
                  <Route path="/orders" element={<MyOrders />} />
                  <Route path="/orders/:id" element={<OrderDetail />} />
                  {/* 收藏已并入点菜页（/menu 分段控件）：旧路由保留重定向，避免外链失效 */}
                  <Route path="/favorites" element={<Navigate to="/menu?fav=1" replace />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/admin" element={<Admin />} />
                  <Route path="/admin/dishes" element={<AdminDishes />} />
                  <Route path="/admin/orders" element={<AdminOrders />} />
                </Routes>
              </Suspense>
            </motion.div>
          </AnimatePresence>
        </main>

        {!isAdmin && <DockLayer />}
      </div>
    </CartProvider>
  )
}

export default App
