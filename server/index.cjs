// ============================================================
// 晨光厨房 · 家庭本地服务端（CJS —— 同时是 Node SEA exe 的入口）
// 数据完全存在本机 JSON 文件里，不上云；全家设备经局域网共享。
//
// 三种跑法（行为一致）：
//   1. node server/index.cjs                    —— 开发/备用
//   2. server\晨光厨房服务端.exe（双击）         —— 日常使用，见 §10 打包
//   3. npm run family
//
// exe（SEA）路径解析：种子在 <exeDir>/data 或 <exeDir>/server/data 两种摆位皆可
// （分别对应「exe 放 server 目录里」和「exe 放项目根」）；数据写 exe 旁边的
// state.json，dist 相对其父/本目录取。文件直跑仍按源码位置解析。
// - 接口一比一复刻 src/lib/mockApi.js；持久化原子写（tmp+rename）。
// ============================================================
const http = require('node:http')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const sea = require('node:sea')

// 双击防闪退总兜底：任何未捕获异常都走 fatal()（函数声明提升，可先注册后定义）
process.on('uncaughtException', (e) => fatal('[致命] ' + (e.message || String(e))))

// —— 布局解析：SEA(exe) 与文件直跑两种世界 ——
let DATA_DIR, DIST_DIR
if (sea.isSea()) {
  const exeDir = path.dirname(process.execPath)
  if (fs.existsSync(path.join(exeDir, 'data', 'seed-dishes.json'))) {
    // 摆位 A：exe 在 server/ 目录内（推荐，随项目移动）
    DATA_DIR = path.join(exeDir, 'data')
    DIST_DIR = path.join(exeDir, '..', 'dist')
  } else if (fs.existsSync(path.join(exeDir, 'server', 'data', 'seed-dishes.json'))) {
    // 摆位 B：exe 在项目根
    DATA_DIR = path.join(exeDir, 'server', 'data')
    DIST_DIR = path.join(exeDir, 'dist')
  } else {
    throw new Error('[致命] 找不到种子数据 server/data/seed-dishes.json。\r\n'
      + '请把这个 exe 放到项目目录（extracted）内再双击，或连整个项目文件夹一起拷贝。')
  }
} else {
  DATA_DIR = path.join(__dirname, 'data')
  DIST_DIR = path.join(__dirname, '..', 'dist')
}
const STATE_FILE = path.join(DATA_DIR, 'state.json')
const PORT = Number(process.env.PORT || 8787)

// 双击场景防闪退：错误打印后等回车再关窗；stdin 不可读（被重定向等）时
// 用 Atomics.wait 挂死主线程保持窗口，Ctrl+C 或手动关窗结束。
// 不用提前 process.exit —— libuv 句柄未净时强退会触发断言崩溃。
function fatal(msg) {
  console.error('\n' + msg)
  console.error('\n按回车键关闭本窗口…')
  try {
    const buf = Buffer.alloc(1)
    fs.readSync(0, buf, 0, 1, null)
  } catch {
    try { Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, Infinity) } catch { /* ignore */ }
  }
  process.exit(1)
}

// —— 状态载入（内存驻留 + 落盘；家庭单实例场景足够）——
function loadSeeds() {
  const dishes = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'seed-dishes.json'), 'utf8'))
  const recipes = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'seed-recipes.json'), 'utf8'))
  return { dishes, recipes }
}

let state
let RECIPES = {}
function initState() {
  fs.mkdirSync(DATA_DIR, { recursive: true })
  const { dishes, recipes } = loadSeeds()
  RECIPES = recipes
  if (fs.existsSync(STATE_FILE)) {
    try { state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8')) } catch { state = null }
  }
  if (!state || !Array.isArray(state.dishes)) {
    state = { dishes: [...dishes], orders: [], nextDishId: 10000, nextOrderId: 1001 }
    saveState()
    console.log('[init] 已从种子创建 state.json（%d 道菜）', state.dishes.length)
  } else {
    // 老 state 补齐：种子里有、state 里没有的菜按名并入（同 mockApi 的 missingSeed 语义）
    const names = new Set(state.dishes.map((d) => d.name))
    const missing = dishes.filter((d) => !names.has(d.name))
    if (missing.length) {
      state.dishes.push(...missing)
      state.nextDishId = Math.max(state.nextDishId || 1, ...state.dishes.map((d) => Number(d.id) || 0)) + 1
      saveState()
      console.log('[init] 补齐新增种子菜品 %d 道', missing.length)
    }
  }
}

function saveState() {
  const tmp = STATE_FILE + '.tmp'
  fs.writeFileSync(tmp, JSON.stringify(state), 'utf8')
  fs.renameSync(tmp, STATE_FILE)
}

// —— 响应工具 ——
function sendJson(res, data, status = 200) {
  const body = JSON.stringify(data)
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Content-Length': Buffer.byteLength(body) })
  res.end(body)
}
function readJsonBody(req) {
  return new Promise((resolve) => {
    let raw = ''
    req.on('data', (c) => { raw += c; if (raw.length > 5e6) req.destroy() }) // 5MB 上限
    req.on('end', () => { try { resolve(JSON.parse(raw || '{}')) } catch { resolve({}) } })
    req.on('error', () => resolve({}))
  })
}

// —— 业务路由：逐条对齐 mockApi ——
async function handleApi(req, res, url) {
  const { pathname, searchParams } = url
  const method = req.method.toUpperCase()

  if (pathname === '/api/dishes/all' && method === 'GET')
    return sendJson(res, [...state.dishes].sort((a, b) => b.id - a.id))

  if (pathname === '/api/dishes' && method === 'GET') {
    const cat = searchParams.get('category') || '全部'
    const list = state.dishes
      .filter((d) => Number(d.available) !== 0)
      .filter((d) => cat === '全部' || d.category === cat)
    return sendJson(res, list)
  }

  if (pathname === '/api/dishes' && method === 'POST') {
    const body = await readJsonBody(req)
    const dish = { id: state.nextDishId++, available: 1, image_url: '', description: '', ...body, price: Number(body.price || 0) }
    state.dishes.unshift(dish)
    saveState()
    return sendJson(res, dish, 201)
  }

  const dishM = pathname.match(/^\/api\/dishes\/(\d+)$/)
  if (dishM && method === 'GET') {
    const id = Number(dishM[1])
    const dish = state.dishes.find((d) => d.id === id)
    if (!dish) return sendJson(res, { message: 'Not found' }, 404)
    return sendJson(res, { ...dish, recipe: RECIPES[id] || null })
  }
  if (dishM && method === 'PUT') {
    const id = Number(dishM[1])
    const body = await readJsonBody(req)
    state.dishes = state.dishes.map((d) => d.id === id ? { ...d, ...body, price: body.price === undefined ? d.price : Number(body.price) } : d)
    saveState()
    return sendJson(res, state.dishes.find((d) => d.id === id) || null)
  }
  if (dishM && method === 'DELETE') {
    const id = Number(dishM[1])
    state.dishes = state.dishes.filter((d) => d.id !== id)
    saveState()
    return sendJson(res, { ok: true })
  }

  if (pathname === '/api/orders' && method === 'GET') {
    const status = searchParams.get('status')
    const list = [...state.orders]
      .filter((o) => !status || o.status === status)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    return sendJson(res, list)
  }
  if (pathname === '/api/orders' && method === 'POST') {
    const body = await readJsonBody(req)
    const items = (body.items || []).map((item, idx) => {
      const dish = state.dishes.find((d) => d.id === Number(item.dish_id)) || {}
      return {
        id: Date.now() + idx,
        dish_id: Number(item.dish_id),
        dish_name: dish.name || item.name || '未知菜品',
        price: Number(dish.price || item.price || 0),
        quantity: Number(item.quantity || 1),
        added_by: item.added_by || 'me',
      }
    })
    const total_price = items.reduce((s, i) => s + i.price * i.quantity, 0)
    const order = { id: state.nextOrderId++, status: 'pending', created_at: new Date().toISOString(), note: body.note || '', payer: body.payer || 'aa', total_price, items }
    state.orders.unshift(order)
    saveState()
    return sendJson(res, order, 201)
  }
  const osM = pathname.match(/^\/api\/orders\/(\d+)\/status$/)
  if (osM && method === 'PUT') {
    const id = Number(osM[1])
    const body = await readJsonBody(req)
    state.orders = state.orders.map((o) => o.id === id ? { ...o, status: body.status || o.status } : o)
    saveState()
    return sendJson(res, state.orders.find((o) => o.id === id) || null)
  }
  const oM = pathname.match(/^\/api\/orders\/(\d+)$/)
  if (oM && method === 'GET') {
    const id = Number(oM[1])
    const order = state.orders.find((o) => o.id === id)
    return order ? sendJson(res, order) : sendJson(res, { message: 'Not found' }, 404)
  }

  return sendJson(res, { message: `No route: ${method} ${pathname}` }, 404)
}

// —— 静态文件（托管 dist，SPA 兜底 index.html）——
const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.png': 'image/png', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.txt': 'text/plain',
}
function serveStatic(res, urlPath) {
  if (!fs.existsSync(DIST_DIR)) {
    res.writeHead(503, { 'Content-Type': 'text/plain; charset=utf-8' })
    return res.end('前端尚未构建：请先在项目目录运行  npm run build')
  }
  let rel = decodeURIComponent(urlPath.split('?')[0])
  if (rel === '/' || rel === '') rel = '/index.html'
  // 防目录穿越：解析后必须仍在 DIST 内
  const abs = path.join(DIST_DIR, path.normalize(rel))
  if (!abs.startsWith(DIST_DIR) || !fs.existsSync(abs) || fs.statSync(abs).isDirectory()) {
    // hash 路由下真实路径恒为 /index.html；未知非 api 路径一律兜底
    const idx = path.join(DIST_DIR, 'index.html')
    if (fs.existsSync(idx)) return streamFile(res, idx, 'text/html; charset=utf-8')
    res.writeHead(404); return res.end('404')
  }
  streamFile(res, abs, MIME[path.extname(abs).toLowerCase()] || 'application/octet-stream')
}
function streamFile(res, abs, type) {
  res.writeHead(200, { 'Content-Type': type, 'Cache-Control': type.includes('image') || type.includes('font') ? 'public, max-age=86400' : 'no-cache' })
  fs.createReadStream(abs).pipe(res)
}

try { initState() } catch (e) {
  fatal('[致命] 初始化失败：' + (e.message || String(e)))
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`)
  try {
    if (url.pathname.startsWith('/api/')) await handleApi(req, res, url)
    else serveStatic(res, url.pathname)
  } catch (e) {
    console.error('[error]', e)
    if (!res.headersSent) sendJson(res, { message: 'Internal error', detail: String(e.message || e) }, 500)
  }
})

server.on('error', (e) => {
  if (e.code === 'EADDRINUSE') {
    fatal(`[提示] 端口 ${PORT} 已被占用 —— 服务可能已经在运行了（重复双击就是这个情况）。\r\n`
      + '确认没有其他程序用这个端口后重试，或设置环境变量 PORT 换端口。')
  } else {
    fatal('[致命] 服务启动失败：' + (e.message || String(e)))
  }
})

server.listen(PORT, '0.0.0.0', () => {
  const nets = Object.values(os.networkInterfaces()).flat().filter((n) => n.family === 'IPv4' && !n.internal)
  console.log(`\n晨光厨房 · 家庭服务端已启动（数据只存家里这台电脑）`)
  console.log(`  本机：    http://localhost:${PORT}/`)
  nets.forEach((n) => console.log(`  局域网：  http://${n.address}:${PORT}/   ← 家人手机用这个`))
  console.log(`  数据文件：${STATE_FILE}`)
  console.log(`\n  保持本窗口开着即为运行中；关闭本窗口会停止服务。\n`)
})
