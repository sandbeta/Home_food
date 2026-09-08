// ============================================================
// 静态资源路径工具
// GitHub Pages 把站点挂在 /{仓库名}/ 子路径下，所有以 "/" 开头的
// 绝对路径都会指向域名根目录而 404。这里统一用 Vite 注入的 BASE_URL
// 拼接，本地开发（BASE_URL="/"）与子路径部署（BASE_URL="/repo/"）都正确。
// ============================================================
const BASE = import.meta.env.BASE_URL || '/'

/** 把 "/dish-images/x.webp" 这类根路径转为当前部署基址下的路径 */
export function assetUrl(path) {
  if (!path) return path
  // 外链与 data: 原样返回
  if (/^(https?:|data:|blob:)/i.test(path)) return path
  // 已是相对路径（./ 或 ../）原样返回
  if (!path.startsWith('/')) return path
  // BASE 以 "/" 结尾，path 以 "/" 开头，去掉一个避免双斜杠
  return BASE.endsWith('/') ? BASE + path.slice(1) : BASE + path
}
