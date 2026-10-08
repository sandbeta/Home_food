import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  // 相对基址：GitHub Pages 部署在 /{仓库名}/ 子路径下也能正确加载资源，
  // 本地开发与自建域名根路径同样适用（无需知道仓库名）
  base: './',
  plugins: [react(), tailwindcss()],
  server: {
    host: true,
    /* 这条 /api 代理在常规开发下走不到：src/main.jsx 的门是
       if (!window.__CHENGUANG_FAMILY__ && location.port !== '8787') installMockApi()，
       而 __CHENGUANG_FAMILY__ 只由家庭服务端注入进 index.html —— 所以 5173 上永远是
       mock 劫持全部 /api。留着它只服务一种场景：以后想拆掉 mock 直接对着 8787 调后端。
       要验服务端轨，仍然必须开 http://127.0.0.1:8787/。 */
    proxy: {
      '/api': 'http://localhost:8787'
    }
  },
  build: {
    rollupOptions: {
      output: {
        // 将第三方依赖拆分为独立 chunk，利用浏览器缓存
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('framer-motion')) return 'framer-motion'
            if (id.includes('react-router')) return 'react-vendor'
            if (id.includes('react-dom') || id.includes('/react/')) return 'react-vendor'
          }
        },
      },
    },
    // 小于 4KB 的资源内联为 base64，减少 HTTP 请求（与 Vite 默认同值，这里显式钉住意图）
    // 注：cssCodeSplit / minify / sourcemap 三项本来就是默认值，之前写出来还配了错归因的
    // 注释（"未使用的 CSS 会被 tree-shake"是 Tailwind v4 的职责，跟 cssCodeSplit 无关），故删。
    assetsInlineLimit: 4096,
  },
})
