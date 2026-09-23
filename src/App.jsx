import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AnimatePresence, motion, MotionConfig } from 'framer-motion'
import { CartProvider } from './components/CartContext'
import DockLayer from './components/DockLayer'
import NightSnackSheet from './components/NightSnackSheet'
import AmbientLightCanvas from './components/AmbientLightCanvas'
import ErrorBoundary from './components/ErrorBoundary'
import { useTheme } from './theme/useTheme'
import { pageEnter } from './theme/motion'
import LazySheep, { SheepZzz } from './components/ui/LazySheep'
// m-12：全局 announce 桥副作用引入（内部挂 window.__cgAnnounce），App 不再导出非组件符号避免 react-refresh 警告
import './lib/announce'

// 路由懒加载 — 按需加载页面，减小初始 bundle 体积
const Home = lazy(() => import('./pages/Home'))
const NightHome = lazy(() => import('./pages/NightHome'))
const Menu = lazy(() => import('./pages/Menu'))
const DishDetail = lazy(() => import('./pages/DishDetail'))
const Cart = lazy(() => import('./pages/Cart'))
const OrderDetail = lazy(() => import('./pages/OrderDetail'))
const MyOrders = lazy(() => import('./pages/MyOrders'))
const Profile = lazy(() => import('./pages/Profile'))
const HotDishes = lazy(() => import('./pages/HotDishes'))
const KitchenCalendar = lazy(() => import('./pages/KitchenCalendar'))
const TasteProfile = lazy(() => import('./pages/TasteProfile'))
const AnnualReport = lazy(() => import('./pages/AnnualReport'))
const Admin = lazy(() => import('./pages/Admin'))
const AdminDishes = lazy(() => import('./pages/AdminDishes'))
const AdminOrders = lazy(() => import('./pages/AdminOrders'))
const AdminAnniversaries = lazy(() => import('./pages/AdminAnniversaries'))
const AdminWishes = lazy(() => import('./pages/AdminWishes'))

// 页面加载骨架屏
function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="relative">
        <div className="w-8 h-8 border-2 border-[var(--color-clay)]/20 border-t-[var(--color-clay)] rounded-full animate-spin" />
        {/* 转圈也挡不住困：懒羊羊陪等 */}
        <div className="absolute inset-0 flex items-center justify-center text-[var(--color-sage)]">
          <LazySheep size={22} mood="sleep" bib={false} breathe={false} />
        </div>
        <SheepZzz size={9} className="top-0" />
      </div>
    </div>
  )
}

function App() {
  const location = useLocation()
  const { isNight, debugLocked } = useTheme()
  const isAdmin = location.pathname.startsWith('/admin')
  // VT 形变导航：旁路 AnimatePresence，让 View Transitions 独占本次转场（否则 mode=wait 的 exit 会拖住新页快照）
  const viaVT = !!(location.state && location.state.vt)
  // m-18：key 加 search，让 /menu?cat=X → /menu 或 ?fav=1 → 无参 会重挂载并清掉热同步残留
  const routeKey = location.pathname + (location.search || '')

  /* m-31 修：?theme= 生效期间 tick() return 暂停时段接管，但界面无提示 → 用户挂着参数过夜
     跨过 21:00/05:00 也不会跟随时间，误以为夜宵自动切换坏了。给一条可关闭角标：点 X 移除参数。 */
  const clearDebugTheme = () => {
    try {
      const url = new URL(window.location.href)
      url.searchParams.delete('theme')
      // hash 里也可能带（/repo/#/menu?theme=night）→ 清 hash query 部分
      if (url.hash.includes('?')) {
        const [hpath, hquery] = url.hash.split('?')
        const hp = new URLSearchParams(hquery)
        hp.delete('theme')
        const rest = hp.toString()
        url.hash = rest ? `${hpath}?${rest}` : hpath
      }
      window.history.replaceState({}, '', url.toString())
      // 触发 useTheme 的 tick 重新求值：通过手动派一个 visibilitychange 事件
      document.dispatchEvent(new Event('visibilitychange'))
    } catch { /* noop */ }
  }

  return (
    <CartProvider>
      {/* M-k1：全站 framer 动画在系统 reduced-motion 下自动禁 transform、保留 opacity，兑现 PRODUCT.md 承诺 */}
      <MotionConfig reducedMotion="user">
      <div
        className="min-h-screen mx-auto relative border-x border-[var(--color-glass-border)] bg-[var(--color-ink-900)]"
        style={{ maxWidth: 'var(--shell-w)' }}
      >
        {debugLocked && (
          <div
            role="status"
            className="fixed top-1 left-1/2 -translate-x-1/2 z-[95] flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-bold"
            style={{
              background: 'color-mix(in srgb, var(--color-ember) 88%, transparent)',
              color: 'var(--color-on-dark)',
              boxShadow: 'var(--shadow-3)',
              maxWidth: 'calc(var(--shell-w) - 24px)',
            }}
          >
            <span aria-hidden>🔧</span>
            <span>调试模式：主题被 URL 锁定，跨过时段不会自动切换</span>
            <button onClick={clearDebugTheme} aria-label="解除主题调试锁定"
              className="ml-1 px-2 py-0.5 rounded-full font-bold"
              style={{ background: 'var(--color-on-dark)', color: 'var(--color-ember)' }}>
              解除
            </button>
          </div>
        )}
        {/* m-12：全局 sr-only live region，供加购/状态播报；aria-live=polite 不打断用户当前朗读 */}
        <div id="cg-live-region" className="sr-only" role="status" aria-live="polite" aria-atomic="true" />
        {/* 晨光环境光：赤陶主光（左） + 鼠尾草绿辅光（右），低透，仅作氛围 */}
        <div
          className="fixed top-[-120px] w-80 h-80 rounded-full blur-[90px] pointer-events-none ambient-a"
          style={{
            left: 'calc(50% - var(--shell-w) / 2 - 20px)',
            background: 'radial-gradient(circle, color-mix(in srgb, var(--clay-50) 10%, transparent) 0%, transparent 70%)',
          }}
        />
        <div
          className="fixed top-1/3 w-64 h-64 rounded-full blur-[90px] pointer-events-none ambient-b"
          style={{
            right: 'calc(50% - var(--shell-w) / 2 - 20px)',
            background: 'radial-gradient(circle, color-mix(in srgb, var(--sage-40) 10%, transparent) 0%, transparent 70%)',
          }}
        />
        <AmbientLightCanvas />

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
            <motion.div key={routeKey} {...(viaVT ? { initial: false, animate: { opacity: 1 }, exit: {} } : pageEnter)}>
              <Suspense fallback={<PageLoader />}>
                <ErrorBoundary>
                  <Routes location={location}>
                    <Route path="/" element={<Navigate to="/home" replace />} />
                    {/* 首页按主题分发：夜宵模式=深夜食堂专属界面，白天=原首页 */}
                    <Route path="/home" element={isNight ? <NightHome /> : <Home />} />
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
                    <Route path="/hot" element={<HotDishes />} />
                    {/* 批 3a · 厨房日历（月历回看每天吃了啥，从 Profile 入口进） */}
                    <Route path="/calendar" element={<KitchenCalendar />} />
                    {/* 批 3b · 口味画像（雷达图 + TOP5，从 Profile 入口进） */}
                    <Route path="/taste" element={<TasteProfile />} />
                    {/* 批 4c · 年度别册（可打印的年终总结，从 Profile 入口进） */}
                    <Route path="/report" element={<AnnualReport />} />
                    <Route path="/admin" element={<Admin />} />
                    <Route path="/admin/dishes" element={<AdminDishes />} />
                    <Route path="/admin/orders" element={<AdminOrders />} />
                    {/* 批 1 新增 · 纪念日与愿望池 */}
                    <Route path="/admin/anniversaries" element={<AdminAnniversaries />} />
                    <Route path="/admin/wishes" element={<AdminWishes />} />
                  </Routes>
                </ErrorBoundary>
              </Suspense>
            </motion.div>
          </AnimatePresence>
        </main>

        {!isAdmin && <DockLayer />}
        {!isAdmin && <NightSnackSheet />}
      </div>
      </MotionConfig>
    </CartProvider>
  )
}

export default App
