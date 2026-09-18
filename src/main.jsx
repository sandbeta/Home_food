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
  createRoot(document.getElementById('root')).render(
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
bootstrap()
