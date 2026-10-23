import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App.jsx'
import { SettingsProvider } from './state/SettingsContext.jsx'
import { ToastProvider } from './state/ToastContext.jsx'
import { DataProvider } from './state/DataContext.jsx'
import { CartProvider } from './state/CartContext.jsx'
import { DishSheetProvider } from './state/DishSheetContext.jsx'
import './styles/tokens.css'
import './styles/base.css'
import './styles/components.css'
import './styles/pages.css'
import './styles/art.css'

async function bootstrap() {
  const family = window.__CHENGUANG_FAMILY__ || window.location.port === '8787'
  if (family) {
    const { installAdminGate } = await import('./lib/adminGate.js')
    installAdminGate()
  } else {
    const { installMockApi } = await import('./lib/mockApi.js')
    installMockApi()
  }

  const mount = document.getElementById('root')
  if (!mount) throw new Error('#root missing')

  createRoot(mount).render(
    <StrictMode>
      <SettingsProvider>
        <ToastProvider>
          <DataProvider>
            <CartProvider>
              <DishSheetProvider>
                <HashRouter>
                  <App />
                </HashRouter>
              </DishSheetProvider>
            </CartProvider>
          </DataProvider>
        </ToastProvider>
      </SettingsProvider>
    </StrictMode>,
  )
}

bootstrap().catch(() => {
  const root = document.getElementById('root') || document.body
  root.innerHTML = `
    <div class="crash">
      <div class="crash__emoji" aria-hidden="true">🍳</div>
      <p class="t-title">厨房没点上火</p>
      <p class="t-note">资源没加载成功，检查下网络再试。</p>
      <button class="btn btn--primary" onclick="location.reload()">重新点火</button>
    </div>`
})
