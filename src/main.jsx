import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'
import { installMockApi } from './lib/mockApi.js'
import './theme/useTheme.js' // 副作用导入：启动即应用主题（localStorage / 深夜自动夜宵）

installMockApi()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/*
      Hash 路由（URL 形如 /repo/#/menu）：GitHub Pages 等静态托管
      不支持 rewrite，BrowserRouter 下直接访问或刷新子路由会 404；
      hash 部分不发给服务器，任何托管都天然可用。
      站内跳转全部走 <Link>/navigate，用户无感差异。
    */}
    <HashRouter>
      <App />
    </HashRouter>
  </StrictMode>,
)
