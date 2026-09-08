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
    proxy: {
      '/api': 'http://localhost:3000'
    }
  },
  build: {
    // 启用 CSS 代码分割，未使用的 CSS 会被 tree-shake
    cssCodeSplit: true,
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
    // 使用 Vite 8 默认的 Oxc 压缩器（比 esbuild 更快）
    minify: true,
    // 小于 4KB 的资源内联为 base64，减少 HTTP 请求
    assetsInlineLimit: 4096,
    // 启用 sourcemap 用于调试（生产环境可关闭）
    sourcemap: false,
  },
})
