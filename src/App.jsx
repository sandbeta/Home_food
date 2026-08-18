import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { CartProvider } from './components/CartContext'
import FloatingPillNav from './components/FloatingPillNav'
import D3CartOrb from './components/D3CartOrb'

// 路由懒加载 — 按需加载页面，减小初始 bundle 体积
const Home = lazy(() => import('./pages/Home'))
const Menu = lazy(() => import('./pages/Menu'))
const DishDetail = lazy(() => import('./pages/DishDetail'))
const Cart = lazy(() => import('./pages/Cart'))
const Checkout = lazy(() => import('./pages/Checkout'))
const OrderDetail = lazy(() => import('./pages/OrderDetail'))
const MyOrders = lazy(() => import('./pages/MyOrders'))
const Profile = lazy(() => import('./pages/Profile'))
const Favorites = lazy(() => import('./pages/Favorites'))
const Admin = lazy(() => import('./pages/Admin'))
const AdminDishes = lazy(() => import('./pages/AdminDishes'))
const AdminOrders = lazy(() => import('./pages/AdminOrders'))

// 页面加载骨架屏
function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 border-2 border-[var(--color-gold)]/20 border-t-[var(--color-gold)] rounded-full animate-spin" />
    </div>
  )
}

function App() {
  const location = useLocation()
  const isAdmin = location.pathname.startsWith('/admin')

  return (
    <CartProvider>
      <div className="min-h-screen max-w-[480px] mx-auto relative overflow-hidden border-x border-[var(--color-glass-border)] bg-[var(--color-ink-900)]">
        {/* 暗房环境光：暖金主光（左） + 冷铂辅光（右），极弱，仅作氛围 */}
        <div className="fixed top-[-120px] left-[calc(50%-260px)] w-80 h-80 rounded-full blur-[90px] opacity-30 pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(230,178,90,0.16) 0%, transparent 70%)' }} />
        <div className="fixed top-1/3 right-[calc(50%-260px)] w-64 h-64 rounded-full blur-[90px] opacity-22 pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(194,199,210,0.10) 0%, transparent 70%)' }} />

        <main className="pb-28 relative z-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            >
              <Suspense fallback={<PageLoader />}>
                <Routes location={location}>
                  <Route path="/" element={<Navigate to="/home" replace />} />
                  <Route path="/home" element={<Home />} />
                  <Route path="/menu" element={<Menu />} />
                  <Route path="/dish/:id" element={<DishDetail />} />
                  <Route path="/cart" element={<Cart />} />
                  <Route path="/checkout" element={<Checkout />} />
                  <Route path="/orders" element={<MyOrders />} />
                  <Route path="/orders/:id" element={<OrderDetail />} />
                  <Route path="/favorites" element={<Favorites />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/admin" element={<Admin />} />
                  <Route path="/admin/dishes" element={<AdminDishes />} />
                  <Route path="/admin/orders" element={<AdminOrders />} />
                </Routes>
              </Suspense>
            </motion.div>
          </AnimatePresence>
        </main>

        {!isAdmin && <FloatingPillNav />}
        {!isAdmin && <D3CartOrb />}
      </div>
    </CartProvider>
  )
}

export default App
