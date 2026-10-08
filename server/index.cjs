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
/* 种子菜品清单提到模块作用域：DELETE /api/dishes/:id 的墓碑判定要问「这个 id 是不是
   种子菜」，而 loadSeeds()/initState() 里的 const dishes 出函数就没了。
   原写法在 handleApi 里直接引用 dishes → ReferenceError，且 build/lint/test 全绿
   （没人起服务端，runtime_audit 的双端比对只做路径文本匹配，看不见运行期引用错误）。 */
let SEED_DISHES = []
function initState() {
  fs.mkdirSync(DATA_DIR, { recursive: true })
  const { dishes, recipes } = loadSeeds()
  RECIPES = recipes
  SEED_DISHES = dishes
  if (fs.existsSync(STATE_FILE)) {
    /* 读失败不再当"没有 state"。旧写法 catch 后 state=null，于是走进 fresh 分支
       从种子重建并覆盖写回——全部订单/愿望/评分/纪念日/共享购物车/自建菜一次性消失，
       而且只留一行像正常首启的日志、没有备份，事后无法恢复（7.29 复盘定的"真实数据
       不可再生"在这里被违反）。
       现在：先把坏文件改名留存再中止启动。家庭场景下让主人看到"文件坏了、旧文件在哪、
       怎么恢复"，远好过悄悄换一份空账本。 */
    try {
      /* 剥掉 BOM 再解析：JSON.parse 不认 U+FEFF，中文Windows 上用记事本/PowerShell
         打开 state.json 看过一眼再保存就会多一个 BOM，那样连内容完好也会被判成损坏、
         服务端直接停机。自己writeFileSync 写的文件不带 BOM，所以这是纯外部扰动兜底。 */
      const raw = fs.readFileSync(STATE_FILE, 'utf8').replace(/^\uFEFF/, '')
      state = JSON.parse(raw)
    } catch (e) {
      const bad = STATE_FILE + '.corrupt-' + new Date().toISOString().replace(/[:.]/g, '-')
      try { fs.renameSync(STATE_FILE, bad) } catch { /* 改名也失败就保持原样 */ }
      fatal('state.json 读不出来（' + (e && e.message ? e.message : '未知错误') + '），已停止启动以免覆盖你的订单。\n' +
            '  原文件已留存为：' + bad + '\n' +
            '  处理办法：确认该文件确属损坏后，把它改名回 state.json 即可恢复；\n' +
            '            若确要重置，把它移走再启动，服务端会从种子重建空账本。\n' +
            '  （种子在 server/data/seed-dishes.json + seed-recipes.json，菜品不会少。）')
    }
  }
  if (!state || !Array.isArray(state.dishes)) {
    /* 批 1 新增：fresh state 一并给 anniversaries / wishes 空表 + 序列号（与 mockApi 一比一复刻）
       补 deletedSeedIds 空表：旧写法漏了它，而下面的墓碑判定要 .includes()——fresh 分支下
       state.deletedSeedIds 是 undefined，首次 DELETE 会从 ReferenceError 换成 TypeError，
       等于没修。else 分支的补齐只在第二次启动才跑，救不了首轮。 */
    state = { dishes: [...dishes], orders: [], nextDishId: 10000, nextOrderId: 1001, deletedSeedIds: [], anniversaries: [], wishes: [], nextAnniversaryId: 1, nextWishId: 1, ratings: [], nextRatingId: 1, sharedCart: { items: [], sharedBy: null, sharedAt: null } }
    saveState()
    console.log('[init] 已从种子创建 state.json（%d 道菜）', state.dishes.length)
  } else {
    /* 修（§7.15 M-d2 双键去重）+ 批3 双端同步（与 mockApi 一比一）：
       ① deletedSeedIds 墓碑——真删掉的种子菜不再重启复活；
       ② nextDishId 重算过滤非有限值——脏 id 不再把它传染成 NaN。
       ③ 回填键从 `${id}|${name}` 改为 Number(id) 单键：双键的用意是区分
          「同id 不同名」的夜宵改名（905/907/915 扬州炒饭→深夜扬州炒饭），但代价是
          **改个名就算「种子缺失」→ 同 id 复活一份 → state 里出现重复 id**。
          find(id) 只返回首个匹配，详情页与订单快照会静默解析到另一道菜。
          单键后改名不再复活（保住用户改动），新增种子仍按新 id 正常补入。 */
    if (!Array.isArray(state.deletedSeedIds)) state.deletedSeedIds = []
    const tomb = new Set(state.deletedSeedIds.map(Number))
    const existing = new Set(state.dishes.map((d) => Number(d.id)))
    const missing = dishes.filter((d) => !existing.has(Number(d.id)) && !tomb.has(Number(d.id)))
    if (missing.length) {
      state.dishes.push(...missing)
      console.log('[init] 补齐新增种子菜品 %d 道', missing.length)
    }
    /* 存量行不回填字段：initState 只补「缺失的行」，已有行的 image_url 永远停在写入那天。
       实测 state.json 有 4 道（904/909/919/921）种子已带真实图、存量仍是空串——
       同一道菜在详情页和缩略图管线上表现不一致。这里按「种子有值且本地为空」单向补齐，
       绝不覆盖本地已有值（后台改名/换图/自定义不能被种子倒灌）。 */
    {
      const byId = new Map(dishes.map((d) => [Number(d.id), d]))
      let healed = 0
      for (const d of state.dishes) {
        const s = byId.get(Number(d.id))
        if (s && !d.image_url && s.image_url) { d.image_url = s.image_url; healed++ }
      }
      if (healed) console.log('[init] 回填存量菜品缺失的图片地址 %d 道', healed)
    }
    {
      const ids = state.dishes.map((d) => Number(d.id)).filter(Number.isFinite)
      const maxId = ids.length ? Math.max(...ids) : 0
      if (!Number.isFinite(state.nextDishId) || state.nextDishId <= maxId) state.nextDishId = maxId + 1
    }
    saveState()
    /* 批 1 新增 · 老 state.json 兼容补齐 anniversaries / wishes 两表 */
    if (!Array.isArray(state.anniversaries)) state.anniversaries = []
    if (!Array.isArray(state.wishes)) state.wishes = []
    if (!Number.isFinite(state.nextAnniversaryId)) state.nextAnniversaryId = 1
    if (!Number.isFinite(state.nextWishId)) state.nextWishId = 1
    /* 批 5 新增 · sharedCart（跨设备分享购物车，家庭"手动分享+拉取合并"） */
    if (!state.sharedCart || typeof state.sharedCart !== 'object') state.sharedCart = { items: [], sharedBy: null, sharedAt: null }
    /* 批 9 新增 · ratings 表（星级评分/制作记录，与 mockApi 一比一） */
    if (!Array.isArray(state.ratings)) state.ratings = []
    if (!Number.isFinite(state.nextRatingId)) state.nextRatingId = 1
  }
}

function saveState() {
  /* 原子落盘：写 tmp → fsync(tmp) → rename → fsync(目录)。
     原写法只有 writeFileSync + renameSync。rename 本身原子，但没落盘保证：断电/磁盘满
     时rename 已生效而数据块还在页缓存里，重启就得到半截 JSON —— 而上面读不出来时
     旧逻辑会当"没有state"从种子重建，等于静默清空全部订单/愿望/评分/用户自建菜。
     fsync 代价是一次落盘，家庭单实例量级（state.json 约 90KB）完全可接受。 */
  const tmp = STATE_FILE + '.tmp'
  const fd = fs.openSync(tmp, 'w')
  try {
    fs.writeFileSync(fd, JSON.stringify(state), 'utf8')
    fs.fsyncSync(fd)
  } finally {
    fs.closeSync(fd)
  }
  fs.renameSync(tmp, STATE_FILE)
  try {
    const dfd = fs.openSync(path.dirname(STATE_FILE), 'r')
    try { fs.fsyncSync(dfd) } finally { fs.closeSync(dfd) }
  } catch { /* 某些文件系统不允许对目录 fsync，失败不影响 rename 已生效 */ }
}

// —— 响应工具 ——
function sendJson(res, data, status = 200) {
  const body = JSON.stringify(data)
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Content-Length': Buffer.byteLength(body) })
  res.end(body)
}
// 星级归一：一比一复刻 src/lib/dishRating.normalizeStars（1–5、半格步进、非法→null）。
// 服务端是 CJS、lib 是 ESM，require 不过来，故此处留一份并靠注释绑住口径 ——
// 改 RATING_RULES 必须同时改这里（test_mockApi 与下面的家庭模式冒烟都会覆盖到）。
// 修（2026-09-27 复核）：补齐 lib 开头的 null/''/undefined 挡板。少了它时
// Number(null)===0 会被钳成 1 星并 201 落库，本地轨(mockApi)却返回 400 —— 双轨不一致，
// 一条脏请求就静默记成「这道菜很难吃」污染均分。越界数字仍是钳制（99→5、0→1），只有非数字才 400。
function normStars(v) {
  if (v === null || v === undefined || v === '') return null
  const n = Number(v)
  if (!Number.isFinite(n)) return null
  const clamped = Math.min(5, Math.max(1, n))
  const stepped = Math.round(clamped / 0.5) * 0.5
  return Math.round(stepped * 10) / 10
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
    const { id: _bodyId, nextDishId: _nd, ...rest } = body || {}   // 批3：主键收归服务端
    const dish = { id: state.nextDishId++, available: 1, image_url: '', description: '', ...rest, price: Number(rest.price || 0) }
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
    const body = await readJsonBody(req) || {}
    const idx = state.dishes.findIndex((d) => Number(d.id) === id)
    if (idx === -1) return sendJson(res, { message: 'Not found' }, 404)
    const pick = {}
    for (const k of ['name', 'price', 'category', 'description', 'available', 'image_url']) {
      if (Object.prototype.hasOwnProperty.call(body, k)) pick[k] = body[k]
    }
    if ('price' in pick) pick.price = Number(pick.price) || 0
    state.dishes[idx] = { ...state.dishes[idx], ...pick, id }
    saveState()
    return sendJson(res, state.dishes[idx])
  }
  if (dishM && method === 'DELETE') {
    const id = Number(dishM[1])
    const idx = state.dishes.findIndex((d) => Number(d.id) === id)
    if (idx === -1) return sendJson(res, { message: 'Not found' }, 404)
    /* ① 墓碑判定改用模块级 SEED_DISHES（原引用函数内的 dishes → ReferenceError）
       ② 墓碑推进挪到 splice 之前：旧顺序下 splice 先执行、墓碑那行再抛，结果是
          客户端收到 500「删除失败」，菜却已从内存消失，且 saveState() 永远到不了
          → 重启即复活。墓碑是唯一可能抛的地方，放最前面保证失败时状态零变更。 */
    const isSeed = id < 10000 && SEED_DISHES.some((d) => Number(d.id) === id)
    if (isSeed && !state.deletedSeedIds.includes(id)) state.deletedSeedIds.push(id)
    state.dishes.splice(idx, 1)
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
    if (!Array.isArray(body.items) || !body.items.length) return sendJson(res, { message: 'items required' }, 400)
    for (const it of body.items) {
      if (!state.dishes.some((d) => Number(d.id) === Number(it.dish_id))) return sendJson(res, { message: 'unknown dish_id', dish_id: it.dish_id }, 400)
    }
    const items = (body.items || []).map((item, idx) => {
      const dish = state.dishes.find((d) => d.id === Number(item.dish_id)) || {}
      return {
        id: Date.now() + idx,
        dish_id: Number(item.dish_id),
        dish_name: dish.name || '未知菜品',
        price: Number(dish.price) || 0,
        quantity: Math.max(1, Number(item.quantity) || 1),
        added_by: item.added_by === 'partner' ? 'partner' : 'me',
        category: dish.category || '', /* 修 P0-3：快照分类 */
      }
    })
    const total_price = items.reduce((s, i) => s + i.price * i.quantity, 0)
    /* 批 4a · AA 结算快照（家庭语义 AA = 各付各的）：payer=me 全归 🐱 / partner 全归 🐑 / aa 按 added_by 分账 */
    const PAYER = ['aa', 'me', 'partner'].includes(body.payer) ? body.payer : 'aa'
    const meSub = items.filter(i => i.added_by === 'me').reduce((s, i) => s + i.price * i.quantity, 0)
    const partnerSub = items.filter(i => i.added_by === 'partner').reduce((s, i) => s + i.price * i.quantity, 0)
    const owed_me = PAYER === 'me' ? total_price : PAYER === 'partner' ? 0 : meSub
    const owed_partner = PAYER === 'me' ? 0 : PAYER === 'partner' ? total_price : partnerSub
    /* 批 1 新增：sticker 便签留言条（选底色 + 图钉 emoji + 可选手写消息），OrderDetail 呈现为贴在灶台上的纸片 */
    const sticker = body.sticker && typeof body.sticker === 'object'
      ? { bg: String(body.sticker.bg || ''), pin: String(body.sticker.pin || ''), msg: String(body.sticker.msg || '') }
      : null
    const order = { id: state.nextOrderId++, status: 'pending', created_at: new Date().toISOString(), note: body.note || '', sticker, payer: PAYER, total_price, owed_me, owed_partner, items }
    state.orders.unshift(order)
    saveState()
    return sendJson(res, order, 201)
  }
  const osM = pathname.match(/^\/api\/orders\/(\d+)\/status$/)
  if (osM && method === 'PUT') {
    const id = Number(osM[1])
    const body = await readJsonBody(req)
    /* 批2a 白名单 + 批3 方向校验（与 mockApi 一比一）：preparing=只读别名(cooking)；只许持平/前进 */
    const NEXT = body.status
    const VALID = ['pending', 'preparing', 'cutting', 'cooking', 'plating', 'completed']
    if (!NEXT || VALID.indexOf(NEXT) === -1) return sendJson(res, { message: 'invalid status', allowed: VALID }, 400)
    const FLOW = ['pending', 'cutting', 'cooking', 'plating', 'completed']
    const norm = (s) => (s === 'preparing' ? 'cooking' : s)
    const order = state.orders.find((o) => o.id === id)
    if (!order) return sendJson(res, { message: 'Not found' }, 404)
    if (FLOW.indexOf(norm(NEXT)) < FLOW.indexOf(norm(order.status))) return sendJson(res, { message: 'status rollback not allowed', from: order.status, to: NEXT }, 400)
    state.orders = state.orders.map((o) => o.id === id ? { ...o, status: NEXT } : o)
    saveState()
    return sendJson(res, state.orders.find((o) => o.id === id) || null)
  }
  const oM = pathname.match(/^\/api\/orders\/(\d+)$/)
  if (oM && method === 'GET') {
    const id = Number(oM[1])
    const order = state.orders.find((o) => o.id === id)
    return order ? sendJson(res, order) : sendJson(res, { message: 'Not found' }, 404)
  }

  /* —— 批 1 新增 · 纪念日 anniversaries（与 mockApi 一比一） —— */
  if (pathname === '/api/anniversaries' && method === 'GET') {
    return sendJson(res, [...state.anniversaries].sort((a, b) => (a.date || '').localeCompare(b.date || '')))
  }
  if (pathname === '/api/anniversaries' && method === 'POST') {
    const body = await readJsonBody(req)
    /* 批3（与 mockApi 一比一）：date 校验 / annual 归一 / dish_id 必须存在 */
    const dateStr = String(body.date || '')
    if (!/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.test(dateStr)) return sendJson(res, { message: 'date must be YYYY-MM-DD' }, 400)
    const dishId = body.dish_id == null || body.dish_id === '' ? null : Number(body.dish_id)
    if (dishId != null && !Number.isFinite(dishId)) return sendJson(res, { message: 'dish_id must be number' }, 400)
    if (dishId != null && !state.dishes.some((d) => Number(d.id) === dishId)) return sendJson(res, { message: 'unknown dish_id', dish_id: dishId }, 400)
    const item = {
      id: state.nextAnniversaryId++,
      name: String(body.name || '纪念日'),
      date: dateStr,
      annual: !(body.annual === false || body.annual === 'false'),
      dish_id: dishId,
      note: String(body.note || ''),
    }
    state.anniversaries.push(item)
    saveState()
    return sendJson(res, item, 201)
  }
  const anniM = pathname.match(/^\/api\/anniversaries\/(\d+)$/)
  if (anniM && method === 'PUT') {
    const id = Number(anniM[1])
    const body = await readJsonBody(req) || {}
    if (!state.anniversaries.some((a) => Number(a.id) === id)) return sendJson(res, { message: 'Not found' }, 404)
    const pick = {}
    for (const k of ['name', 'date', 'annual', 'dish_id', 'note']) {
      if (Object.prototype.hasOwnProperty.call(body, k)) pick[k] = body[k]
    }
    if (Object.prototype.hasOwnProperty.call(pick, 'date') && !/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.test(String(pick.date))) return sendJson(res, { message: 'date must be YYYY-MM-DD' }, 400)
    if (Object.prototype.hasOwnProperty.call(pick, 'dish_id')) {
      const dv = pick.dish_id == null || pick.dish_id === '' ? null : Number(pick.dish_id)
      if (dv != null && !state.dishes.some((d) => Number(d.id) === dv)) return sendJson(res, { message: 'unknown dish_id' }, 400)
      pick.dish_id = dv
    }
    state.anniversaries = state.anniversaries.map((a) => Number(a.id) === id ? { ...a, ...pick, id } : a)
    saveState()
    return sendJson(res, state.anniversaries.find((a) => Number(a.id) === id))
  }
  if (anniM && method === 'DELETE') {
    const id = Number(anniM[1])
    if (!state.anniversaries.some((a) => Number(a.id) === id)) return sendJson(res, { message: 'Not found' }, 404)
    state.anniversaries = state.anniversaries.filter((a) => a.id !== id)
    saveState()
    return sendJson(res, { ok: true })
  }

  /* —— 批 1 新增 · 愿望池 wishes（与 mockApi 一比一） —— */
  if (pathname === '/api/wishes' && method === 'GET') {
    const status = url.searchParams.get('status')
    const list = [...state.wishes].filter((w) => !status || w.status === status)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    return sendJson(res, list)
  }
  if (pathname === '/api/wishes' && method === 'POST') {
    const body = await readJsonBody(req)
    const item = {
      id: state.nextWishId++,
      name: String(body.name || ''),
      note: String(body.note || ''),
      by: body.by === 'partner' ? 'partner' : 'me',
      status: 'pending',
      created_at: new Date().toISOString(),
      added_dish_id: null,
    }
    state.wishes.unshift(item)
    saveState()
    return sendJson(res, item, 201)
  }
  const wishM = pathname.match(/^\/api\/wishes\/(\d+)$/)
  if (wishM && method === 'PUT') {
    const id = Number(wishM[1])
    const body = await readJsonBody(req) || {}
    if (!state.wishes.some((w) => Number(w.id) === id)) return sendJson(res, { message: 'Not found' }, 404)
    const pick = {}
    for (const k of ['status', 'added_dish_id', 'note']) {
      if (Object.prototype.hasOwnProperty.call(body, k)) pick[k] = body[k]
    }
    if (pick.status != null && !['pending', 'added', 'rejected'].includes(pick.status)) return sendJson(res, { message: 'invalid wish status' }, 400)
    state.wishes = state.wishes.map((w) => Number(w.id) === id ? { ...w, ...pick, id } : w)
    saveState()
    return sendJson(res, state.wishes.find((w) => Number(w.id) === id))
  }
  if (wishM && method === 'DELETE') {
    const id = Number(wishM[1])
    if (!state.wishes.some((w) => Number(w.id) === id)) return sendJson(res, { message: 'Not found' }, 404)
    state.wishes = state.wishes.filter((w) => w.id !== id)
    saveState()
    return sendJson(res, { ok: true })
  }

  /* —— 批 9 新增 · 星级评分 ratings（与 mockApi 一比一）——
     一餐一条记录，同一道菜可反复记；写操作不进 needsAdminGuard（家人打分＝点餐级别的日常动作）。 */
  if (pathname === '/api/ratings' && method === 'GET') {
    const dishId = searchParams.get('dish_id')
    const limit = Number(searchParams.get('limit'))
    let list = [...state.ratings].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    if (dishId && Number.isFinite(Number(dishId))) list = list.filter((r) => Number(r.dish_id) === Number(dishId))
    if (Number.isFinite(limit) && limit > 0) list = list.slice(0, limit)
    return sendJson(res, list)
  }
  if (pathname === '/api/ratings' && method === 'POST') {
    const body = await readJsonBody(req)
    const dishId = Number(body.dish_id)
    const dish = state.dishes.find((d) => Number(d.id) === dishId)
    if (!dish) return sendJson(res, { message: 'unknown dish_id', dish_id: body.dish_id }, 400)
    const stars = normStars(body.stars)
    if (stars == null) return sendJson(res, { message: 'stars must be 1-5 (half stars allowed)', got: body.stars }, 400)
    const item = {
      id: state.nextRatingId++,
      dish_id: Number(dish.id),
      dish_name: dish.name || '',
      stars,
      note: String(body.note || '').slice(0, 60),
      by: body.by === 'partner' ? 'partner' : 'me',
      order_id: Number.isFinite(Number(body.order_id)) ? Number(body.order_id) : null,
      created_at: new Date().toISOString(),
    }
    state.ratings.unshift(item)
    saveState()
    return sendJson(res, item, 201)
  }

  /* —— 批 4a · 结算单（与 mockApi 一比一） —— */
  if (pathname === '/api/settlements' && method === 'GET') {
    const month = url.searchParams.get('month')
    const mm = month && /^\d{4}-\d{2}$/.test(month) ? month : new Date().toISOString().slice(0, 7)
    const inMonth = state.orders.filter(o => (o.created_at || '').slice(0, 7) === mm)
    const calc = (o) => {
      if (Number.isFinite(o.owed_me) || Number.isFinite(o.owed_partner)) {
        return { me: Number(o.owed_me || 0), partner: Number(o.owed_partner || 0) }
      }
      const items = Array.isArray(o.items) ? o.items : []
      const total = items.reduce((s, i) => s + (Number(i.price) || 0) * (Number(i.quantity) || 0), 0)
      const meSub = items.filter(i => i.added_by === 'me').reduce((s, i) => s + (Number(i.price) || 0) * (Number(i.quantity) || 0), 0)
      const pSub = items.filter(i => i.added_by === 'partner').reduce((s, i) => s + (Number(i.price) || 0) * (Number(i.quantity) || 0), 0)
      const p = o.payer || 'aa'
      return p === 'me' ? { me: total, partner: 0 } : p === 'partner' ? { me: 0, partner: total } : { me: meSub, partner: pSub }
    }
    let owedMe = 0, owedPartner = 0, total = 0
    const byPayer = { aa: 0, me: 0, partner: 0 }
    for (const o of inMonth) {
      const t = Number(o.total_price) || 0
      total += t
      const { me, partner } = calc(o)
      owedMe += me; owedPartner += partner
      byPayer[o.payer] = (byPayer[o.payer] || 0) + t
    }
    return sendJson(res, {
      month: mm,
      orders_count: inMonth.length,
      total,
      owed_me: Math.round(owedMe * 100) / 100,
      owed_partner: Math.round(owedPartner * 100) / 100,
      by_payer: { aa: byPayer.aa || 0, me: byPayer.me || 0, partner: byPayer.partner || 0 },
    })
  }

  /* —— 批 5 · 跨设备分享购物车（与 mockApi 一比一） —— */
  if (pathname === '/api/cart/share' && method === 'POST') {
    const body = await readJsonBody(req)
    const items = Array.isArray(body.items) ? body.items.map(i => ({
      dish_id: Number(i.dish_id), name: String(i.name || ''), price: Number(i.price) || 0,
      category: String(i.category || ''), quantity: Number(i.quantity) || 1,
      added_by: i.added_by === 'partner' ? 'partner' : 'me',
    })) : []
    state.sharedCart = { items, sharedBy: body.by === 'partner' ? 'partner' : 'me', sharedAt: new Date().toISOString() }
    saveState()
    return sendJson(res, state.sharedCart)
  }
  if (pathname === '/api/cart/shared' && method === 'GET') {
    return sendJson(res, state.sharedCart || { items: [], sharedBy: null, sharedAt: null })
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
  if (rel === '/index.html') {
    if (fs.existsSync(path.join(DIST_DIR, 'index.html'))) return serveIndexHtml(res)
  }
  // 防目录穿越：解析后必须仍在 DIST 内
  const abs = path.join(DIST_DIR, path.normalize(rel))
  if (!abs.startsWith(DIST_DIR) || !fs.existsSync(abs) || fs.statSync(abs).isDirectory()) {
    // hash 路由下真实路径恒为 /index.html；未知非 api 路径一律兜底
    const idx = path.join(DIST_DIR, 'index.html')
    if (fs.existsSync(idx)) return serveIndexHtml(res)
    res.writeHead(404); return res.end('404')
  }
  streamFile(res, abs, MIME[path.extname(abs).toLowerCase()] || 'application/octet-stream')
}
function streamFile(res, abs, type) {
  res.writeHead(200, { 'Content-Type': type, 'Cache-Control': type.includes('image') || type.includes('font') ? 'public, max-age=86400' : 'no-cache' })
  /*必须挂 error 监听：createReadStream 到 pipe 之间、以及 open 之后的读错误，
     都会以 EventEmitter 'error' 抛出。没有监听时它冒泡成 uncaughtException →
     fatal() → process.exit(1)，整个家庭服务端当场退出。触发条件在中文Windows 上很常见：
     Defender 实时扫描对 dist/*.js|html|json 的瞬时占用、坚果云/OneDrive 同步、
     杀毒软件隔离与读取赛跑。existsSync 过了不代表 open 一定成功（EBUSY/EACCES/ENOENT）。
     处置：只回这一个请求 404/500，服务端继续活着——一个文件读不出来不是停服的理由。 */
  const stream = fs.createReadStream(abs)
  stream.on('error', (e) => {
    console.error('[static] 读取失败 %s：%s', path.basename(abs), e.message)
    if (res.headersSent) { res.destroy(); return }
    res.writeHead(e.code === 'ENOENT' ? 404 : 500, { 'Content-Type': 'text/plain; charset=utf-8' })
    res.end('文件暂时读不出来，请重试')
  })
  stream.pipe(res)
}

// —— 家庭模式标记注入 ——
// 公网隧道经域名(80/443)转发进来时，前端 main.jsx 靠 window.__CHENGUANG_FAMILY__
// 判定家庭模式（旧判据"端口==8787"在隧道下失效）。端出 index.html 时于 <head> 顶部
// 注入该标记，零依赖、对 file:// 与 Pages 构建产物无感（它们不经这里）。
let INDEX_HTML_CACHE = null, INDEX_HTML_MTIME = 0
function serveIndexHtml(res) {
  const idx = path.join(DIST_DIR, 'index.html')
  const mt = fs.statSync(idx).mtimeMs
  if (INDEX_HTML_CACHE === null || mt !== INDEX_HTML_MTIME) {
    const raw = fs.readFileSync(idx, 'utf8')
    INDEX_HTML_MTIME = mt
    INDEX_HTML_CACHE = raw.includes('window.__CHENGUANG_FAMILY__')
      ? raw // 已注入过（构建产物自带）则直接用
      : raw.replace('</head>', '  <script>window.__CHENGUANG_FAMILY__=true</script>\n  </head>')
  }
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-cache' })
  res.end(INDEX_HTML_CACHE)
}

// —— 公网访问识别 ——
// 局域网直连（192.168.x.x/10.x/172.16-31.x/::1/本机）不带 XFF 头；
// 任何经隧道/代理进来的请求一定携带 X-Forwarded-For（OpenFrp 文档：HTTP 隧道
// frpc 会自动追加真实客户端 IP 到 XFF）。⚠️ 但 HTTPS 隧道不加 XFF，且 frpc 与
// 服务端同机时来源恒是 127.0.0.1——单靠来源无法区分。因此提供显式开关：
// 环境变量 FAMILY_PUBLIC_MODE=1 或 server/public-mode.txt 内容为 1 →
// 所有请求一律视为公网（本机/局域网管理端也需过一次密码，cookie 7 天）。
function publicMode() {
  if (process.env.FAMILY_PUBLIC_MODE === '1') return true
  try {
    const f = path.join(__dirname, 'public-mode.txt')
    return fs.existsSync(f) && fs.readFileSync(f, 'utf8').trim() === '1'
  } catch { return false }
}
function clientIsPublic(req) {
  if (publicMode()) return true
  if (req.headers['x-forwarded-for']) return true
  const sock = req.socket.remoteAddress || ''
  return !(/^(127\.|::1|::ffff:127\.)/.test(sock) || /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(sock))
}

// —— Admin 密码门（2026-09-18 公网化前置安全）——
// 局域网零打扰：内网访问行为如旧。公网访问默认拒绝（403），直到用环境变量
// FAMILY_ADMIN_PASSWORD 设置密码后，凭同一密码换 httpOnly cookie 进入。
function needsAdminGuard(pathname, method) {
  // 写保护：拦「改数据」的管理动作（增删改菜、推进订单状态、处理愿望、纪念日增删改）。
  // 读接口与 POST /api/orders、POST /api/wishes（家人公网点餐/许愿）放行——公网浏览/下单/许愿无感；
  // 修 P0-7：wishes 的 PUT/DELETE 与 anniversaries 的写操作原为裸奔（公网陌生人可删光愿望池）。
  // 注：SPA 是 hash 路由，/admin 页面路径不会到达服务端，管理入口的写
  // 操作全部经由下面这些 API 接口，拦接口即拦住管理行为。
  const mutating = method !== 'GET' && method !== 'HEAD'
  if (!mutating) return false
  if (pathname === '/api/dishes') return true
  if (/^\/api\/dishes\/\d+$/.test(pathname)) return true
  if (/^\/api\/orders\/\d+\/status$/.test(pathname)) return true
  if (pathname === '/api/anniversaries') return true              // 建纪念日 = 管理动作
  if (/^\/api\/anniversaries\/\d+$/.test(pathname)) return true   // 改/删纪念日
  if (/^\/api\/wishes\/\d+$/.test(pathname)) return true          // 处理愿望（婉拒 PUT/删除/变出来回写）；她许愿走 POST /api/wishes 不拦
  if (pathname === '/api/cart/share') return true                 // 补漏：共享购物车是「覆盖全家」级写入
  return false
}
const crypto = require('node:crypto')
const ADMIN_TOKEN = crypto.randomBytes(24).toString('hex')
function adminPassword() {
  // 密码来源优先级：环境变量 FAMILY_ADMIN_PASSWORD > 项目内 server/admin-password.txt
  // （exe 双击场景没有控制台环境变量，改文件即可，重启与否都能生效——每次校验现读）
  const envPw = process.env.FAMILY_ADMIN_PASSWORD
  if (envPw && envPw.trim()) return envPw.trim()
  try {
    const f = path.join(__dirname, 'admin-password.txt')
    if (fs.existsSync(f)) {
      const t = fs.readFileSync(f, 'utf8').trim()
      if (t) return t
    }
  } catch { /* 读不到视为未配置 */ }
  return null
}
function cookieValue(req, name) {
  const raw = req.headers.cookie || ''
  for (const part of raw.split(';')) {
    const i = part.indexOf('=')
    if (i < 0) continue
    if (part.slice(0, i).trim() === name) return decodeURIComponent(part.slice(i + 1).trim())
  }
  return null
}
function safeEqual(a, b) {
  const ba = Buffer.from(a), bb = Buffer.from(b)
  return ba.length === bb.length && crypto.timingSafeEqual(ba, bb)
}
function handleAdminLogin(req, res) {
  const pw = adminPassword()
  if (!pw) return sendJson(res, { message: 'admin_password_not_configured' }, 503)
  readJsonBody(req).then((body) => {
    if (safeEqual(String(body.password || ''), pw)) {
      res.setHeader('Set-Cookie', `cg_admin=${ADMIN_TOKEN}; HttpOnly; Path=/; SameSite=Lax; Max-Age=604800`)
      return sendJson(res, { ok: true })
    }
    return sendJson(res, { message: 'wrong_password' }, 401)
  })
}
function adminAuthorized(req) {
  return cookieValue(req, 'cg_admin') === ADMIN_TOKEN
}

try { initState() } catch (e) {
  fatal('[致命] 初始化失败：' + (e.message || String(e)))
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`)
  try {
    if (url.pathname === '/api/admin/login' && req.method.toUpperCase() === 'POST') {
      return handleAdminLogin(req, res)
    }
    if (url.pathname.startsWith('/api/')) {
      // 公网写操作门控：局域网直连（无 XFF、内网网卡来源）行为如旧零打扰；
      // 隧道进来的改数据请求必须已凭密码换到 cookie。
      if (needsAdminGuard(url.pathname, req.method.toUpperCase()) && clientIsPublic(req) && !adminAuthorized(req)) {
        return sendJson(res, { message: 'admin_auth_required' }, 401)
      }
      return await handleApi(req, res, url)
    }
    serveStatic(res, url.pathname)
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
