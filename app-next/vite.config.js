import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base 用相对路径：GitHub Pages 子路径、家庭服务端根路径、file:// 预览三种场景共用一份产物
export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    target: 'es2022',
    cssCodeSplit: false,
  },
})
