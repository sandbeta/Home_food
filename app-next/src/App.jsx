import { lazy, Suspense, useEffect } from 'react'
import { Navigate, Route, Routes, useLocation, useParams } from 'react-router-dom'
import { MotionConfig } from 'framer-motion'
import Dock from './components/Dock.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import { useSettings } from './state/SettingsContext.jsx'
import Today from './pages/Today.jsx'
import Menu from './pages/Menu.jsx'
import Cart from './pages/Cart.jsx'
import Me from './pages/Me.jsx'
import { useDishSheet } from './state/DishSheetContext.jsx'

const Orders = lazy(() => import('./pages/Orders.jsx'))
const OrderDetail = lazy(() => import('./pages/OrderDetail.jsx'))
const Fridge = lazy(() => import('./pages/Fridge.jsx'))
const Admin = lazy(() => import('./pages/admin/Admin.jsx'))
const AdminDishes = lazy(() => import('./pages/admin/AdminDishes.jsx'))
const AdminOrders = lazy(() => import('./pages/admin/AdminOrders.jsx'))
const AdminAnniversaries = lazy(() => import('./pages/admin/AdminAnniversaries.jsx'))
const AdminWishes = lazy(() => import('./pages/admin/AdminWishes.jsx'))
const NotFound = lazy(() => import('./pages/NotFound.jsx'))

const DOCK_PATHS = new Set(['/today', '/menu', '/cart', '/me'])

/* 旧站 /#/dish/:id 深链兼容：在菜单上打开同一道菜的面板 */
function DishDeepLink() {
  const { id } = useParams()
  const { openDish } = useDishSheet()
  useEffect(() => { if (id != null) openDish(Number(id)) }, [id, openDish])
  return <Menu />
}

function PageFallback() {
  return (
    <div className="page-loading" role="status" aria-label="载入中">
      <span className="dots" aria-hidden="true"><i /><i /><i /></span>
    </div>
  )
}

export default function App() {
  const location = useLocation()
  const { settings } = useSettings()
  const hasDock = DOCK_PATHS.has(location.pathname)

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [location.pathname])

  return (
    <MotionConfig reducedMotion={settings.motion === 'reduce' ? 'always' : 'user'}>
      <div className={`app${hasDock ? '' : ' app--admin'}`}>
        <main>
          <ErrorBoundary resetKey={location.pathname}>
            <div className="page-enter" key={location.pathname}>
              <Suspense fallback={<PageFallback />}>
                <Routes location={location}>
                  <Route path="/" element={<Navigate to="/today" replace />} />
                  <Route path="/today" element={<Today />} />
                  {/* 旧书签兼容：/home、/profile、/favorites、/checkout 都还有人在用 */}
                  <Route path="/home" element={<Navigate to="/today" replace />} />
                  <Route path="/profile" element={<Navigate to="/me" replace />} />
                  <Route path="/favorites" element={<Navigate to="/menu?fav=1" replace />} />
                  <Route path="/checkout" element={<Navigate to="/cart" replace />} />
                  <Route path="/calendar" element={<Navigate to="/me" replace />} />
                  <Route path="/taste" element={<Navigate to="/me" replace />} />
                  <Route path="/report" element={<Navigate to="/me" replace />} />
                  <Route path="/hot" element={<Navigate to="/me" replace />} />
                  <Route path="/menu" element={<Menu />} />
                  <Route path="/dish/:id" element={<DishDeepLink />} />
                  <Route path="/cart" element={<Cart />} />
                  <Route path="/orders" element={<Orders />} />
                  <Route path="/orders/:id" element={<OrderDetail />} />
                  <Route path="/me" element={<Me />} />
                  <Route path="/fridge" element={<Fridge />} />
                  <Route path="/admin" element={<Admin />} />
                  <Route path="/admin/dishes" element={<AdminDishes />} />
                  <Route path="/admin/orders" element={<AdminOrders />} />
                  <Route path="/admin/anniversaries" element={<AdminAnniversaries />} />
                  <Route path="/admin/wishes" element={<AdminWishes />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </div>
          </ErrorBoundary>
        </main>
        {hasDock ? <Dock /> : null}
      </div>
    </MotionConfig>
  )
}
