import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App.jsx'
import { installAdminGate } from './lib/adminGate.js'
import './index.css'
import './theme/useTheme.js' // 副作用导入：启动即应用主题（localStorage / 深夜自动夜宵）

// 家庭部署（2026-09-18）：页面由 server/index.cjs 端出时，数据走
// 本机服务端的真实 /api（存 server/data/state.json，全家设备共享同一份）；
// 其余场景（vite dev、GitHub Pages、file:// 双击）动态装载浏览器 mock——
// mock 及其携带的 432 道种子数据不再进家庭模式的关键包。
// 判定（2026-09-18 公网部署升级）：家庭服务端在端出 index.html 时会注入
// window.__CHENGUANG_FAMILY__ = true 标记 —— 公网隧道（花生壳/OpenFrp 等）
// 经域名 80/443 转发进来时同样命中，不再依赖端口；file://、GitHub Pages、
// vite dev 拿不到该标记且无 8787 端口，两态互不误伤。保留 8787 端口判据
// 是为兼容注入前的旧产物（如 file:// 双击 dist 预览）。
async function bootstrap() {
  if (!window.__CHENGUANG_FAMILY__ && window.location.port !== '8787') {
    const { installMockApi } = await import('./lib/mockApi.js')
    installMockApi()
  } else {
    // 家庭模式：包装 fetch，公网写操作收到 401 时弹密码门（局域网永不触发）
    installAdminGate()
  }
  const mount = document.getElementById('root')
  if (!mount) throw new Error('#root missing')   // 旧缓存 HTML/注入失败：交给下方兜底面板，不炸成白屏
  createRoot(mount).render(
    <StrictMode>
      {/*
        Hash 路由（URL 形如 /#/menu）：GitHub Pages 等静态托管
        不支持 rewrite，BrowserRouter 下直接访问或刷新子路由会 404；
        hash 部分不发给服务器，任何托管都天然可用。
        站内跳转全部走 <Link>/navigate，用户无感差异。
      */}
      <HashRouter>
        <App />
      </HashRouter>
    </StrictMode>
  )
}
/* 批3 修 P1（冷启死白屏）：mock chunk 拉取失败（Pages 部署中间态 404/弱网）原会让
   bootstrap 的 promise 静默 reject——createRoot 永不执行，ErrorBoundary（在 App 内）
   根本没机会登场。兜一块纯静态恢复面板：零依赖、必可见，恢复网络后重进即自愈。 */
bootstrap().catch(() => {
  const root = document.getElementById('root') || document.body
  root.innerHTML =
    '<div style="min-height:60vh;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;padding:32px;font-family:system-ui,sans-serif;color:#2B2429;text-align:center">' +
    '<div style="font-size:40px" aria-hidden="true">🍳</div>' +
    '<p style="font-size:15px;line-height:1.7;margin:0">厨房的锅没端上来（资源没加载成功）<br>检查下网络，再试一次</p>' +
    '<button onclick="location.reload()" style="padding:10px 22px;border:2px solid #BE4E67;border-radius:999px;background:#BE4E67;color:#FFF9FC;font-size:14px;font-weight:700">再试一次</button>' +
    '</div>'
})
