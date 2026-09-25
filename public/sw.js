/* 晨光厨房 · Service Worker（批5 PWA）
 * ------------------------------------------------------------
 * 目标：家庭自用 H5「装到桌面 + 弱网/离线可点菜」。数据本就在 localStorage/浏览器端，
 * 无需预缓存构建产物名（哈希每次变），改运行期缓存策略更稳：
 *   · 导航请求（打开页面）—— network-first，命中新鲜壳；离线/隧道抖动回退缓存的 index，
 *     再由 HashRouter 走本地 mock，离线照样点菜（订单在本地，联网后家庭服务端可再同步）。
 *   · 同源静态资源（JS/CSS/图片/字体）—— cache-first，二次访问秒开、省电省流。
 *   · 跨域请求 —— 直通不接管。
 * 版本化：CACHE 名带 v，activate 清旧桶，避免缓存无限增长。
 */
const CACHE = 'chengguang-v1'

self.addEventListener('install', () => self.skipWaiting())

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys()
    await Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    await self.clients.claim()
  })())
})

self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET') return
  const url = new URL(req.url)
  if (url.origin !== self.location.origin) return

  // 导航：网络优先，失败回退缓存壳（离线可用的关键）
  if (req.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const net = await fetch(req)
        const c = await caches.open(CACHE)
        c.put(req, net.clone())
        return net
      } catch {
        const c = await caches.open(CACHE)
        return (await c.match(req)) || (await c.match('./index.html')) || (await c.match('/Home_food/index.html')) || Response.error()
      }
    })())
    return
  }

  // 静态资源：缓存优先，命中即返回；未命中回源并写入缓存
  event.respondWith((async () => {
    const c = await caches.open(CACHE)
    const hit = await c.match(req)
    if (hit) return hit
    try {
      const net = await fetch(req)
      if (net && net.ok && (net.type === 'basic' || net.type === 'default')) c.put(req, net.clone())
      return net
    } catch {
      return Response.error()
    }
  })())
})
