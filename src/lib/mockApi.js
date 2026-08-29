const STORAGE_KEY = 'couple_order_app_state_v2'

import { SEED_MENU_EXTRA } from './seedMenuExtra.js'

const seedDishes = [
  { id: 1, name: '番茄牛腩煲', price: 28, category: '硬菜', description: '酸甜浓郁，拌饭一绝', available: 1, image_url: '/dish-images/dish-1.webp' },
  { id: 2, name: '蒜蓉西兰花', price: 12, category: '素菜', description: '清爽解腻，脆脆嫩嫩', available: 1, image_url: '/dish-images/dish-2.webp' },
  { id: 3, name: '可乐鸡翅', price: 22, category: '家常菜', description: '甜咸刚好，幸福感拉满', available: 1, image_url: '/dish-images/dish-3.webp' },
  { id: 4, name: '虾仁滑蛋', price: 24, category: '家常菜', description: '嫩到会发光的下饭菜', available: 1, image_url: '/dish-images/dish-4.webp' },
  { id: 5, name: '土豆炖排骨', price: 26, category: '硬菜', description: '软糯土豆吸满肉香', available: 1, image_url: '/dish-images/dish-5.webp' },
  { id: 6, name: '紫菜蛋花汤', price: 8, category: '汤类', description: '热乎乎的一碗刚刚好', available: 1, image_url: '/dish-images/dish-6.webp' },
  { id: 7, name: '草莓酸奶杯', price: 16, category: '水果', description: '饭后甜甜收尾', available: 1, image_url: '/dish-images/dish-7.webp' },
  { id: 8, name: '冰柠檬茶', price: 10, category: '饮品', description: '清爽去腻，吨吨吨', available: 1, image_url: '/dish-images/dish-8.webp' },
  { id: 9, name: '葱油拌面', price: 14, category: '主食', description: '香气扑鼻的快乐碳水', available: 1, image_url: '/dish-images/dish-9.webp' },
  { id: 10, name: '炸鸡小拼', price: 20, category: '小吃', description: '追剧必备，酥脆可口', available: 1, image_url: '/dish-images/dish-10.webp' },

  // 川菜：麻辣鲜香
  { id: 11, name: '麻婆豆腐', price: 18, category: '川菜', description: '麻辣鲜香，拌饭超绝', available: 1, image_url: '/dish-images/dish-11.webp' },
  { id: 12, name: '宫保鸡丁', price: 26, category: '川菜', description: '甜辣荔枝味，花生脆香', available: 1, image_url: '/dish-images/dish-12.webp' },
  { id: 13, name: '水煮牛肉', price: 38, category: '川菜', description: '红油翻滚，麻辣过瘾', available: 1, image_url: '/dish-images/dish-13.webp' },
  { id: 14, name: '回锅肉', price: 28, category: '川菜', description: '锅气十足，肥而不腻', available: 1, image_url: '/dish-images/dish-14.webp' },
  { id: 15, name: '酸菜鱼', price: 42, category: '川菜', description: '酸辣开胃，鱼片嫩滑', available: 1, image_url: '/dish-images/dish-15.webp' },

  // 粤菜：清鲜本味
  { id: 16, name: '白切鸡', price: 32, category: '粤菜', description: '皮滑肉嫩，蘸料灵魂', available: 1, image_url: '/dish-images/dish-16.webp' },
  { id: 17, name: '蜜汁叉烧', price: 36, category: '粤菜', description: '甜咸油润，边角微焦', available: 1, image_url: '/dish-images/dish-17.webp' },
  { id: 18, name: '豉汁蒸排骨', price: 30, category: '粤菜', description: '豆豉咸香，鲜嫩多汁', available: 1, image_url: '/dish-images/dish-18.webp' },
  { id: 19, name: '干炒牛河', price: 28, category: '粤菜', description: '镬气满满，河粉爽滑', available: 1, image_url: '/dish-images/dish-19.webp' },
  { id: 20, name: '虾饺皇', price: 24, category: '粤菜', description: '晶莹弹牙，早茶必点', available: 1, image_url: '/dish-images/dish-20.webp' },

  // 湘菜：香辣浓烈
  { id: 21, name: '剁椒鱼头', price: 38, category: '湘菜', description: '鲜辣开胃，热气腾腾', available: 1, image_url: '/dish-images/dish-21.webp' },
  { id: 22, name: '小炒黄牛肉', price: 36, category: '湘菜', description: '香辣下饭，锅气很足', available: 1, image_url: '/dish-images/dish-22.webp' },
  { id: 23, name: '辣椒炒肉', price: 28, category: '湘菜', description: '青椒肉香，米饭杀手', available: 1, image_url: '/dish-images/dish-23.webp' },
  { id: 24, name: '毛氏红烧肉', price: 35, category: '湘菜', description: '红亮软糯，肥而不腻', available: 1, image_url: '/dish-images/dish-24.webp' },
  { id: 25, name: '口味虾', price: 48, category: '湘菜', description: '麻辣鲜香，越嗦越上头', available: 1, image_url: '/dish-images/dish-25.webp' },

  // 鲁菜：咸鲜醇厚
  { id: 26, name: '九转大肠', price: 36, category: '鲁菜', description: '酸甜咸香，经典鲁味', available: 1, image_url: '/dish-images/dish-26.webp' },
  { id: 27, name: '糖醋鲤鱼', price: 46, category: '鲁菜', description: '外酥里嫩，酸甜亮汁', available: 1, image_url: '/dish-images/dish-27.webp' },
  { id: 28, name: '葱烧海参', price: 68, category: '鲁菜', description: '葱香浓郁，软糯弹润', available: 1, image_url: '/dish-images/dish-28.webp' },
  { id: 29, name: '德州扒鸡', price: 42, category: '鲁菜', description: '骨酥肉烂，五香入味', available: 1, image_url: '/dish-images/dish-29.webp' },
  { id: 30, name: '油爆双脆', price: 40, category: '鲁菜', description: '脆嫩爽口，火候见功夫', available: 1, image_url: '/dish-images/dish-30.webp' },

  // 苏菜：精致清雅
  { id: 31, name: '松鼠桂鱼', price: 42, category: '苏菜', description: '外脆里嫩，酸甜讨喜', available: 1, image_url: '/dish-images/dish-31.webp' },
  { id: 32, name: '蟹粉狮子头', price: 39, category: '苏菜', description: '细腻丰腴，汤鲜肉嫩', available: 1, image_url: '/dish-images/dish-32.webp' },
  { id: 33, name: '响油鳝糊', price: 36, category: '苏菜', description: '热油滋啦，浓香滑嫩', available: 1, image_url: '/dish-images/dish-33.webp' },
  { id: 34, name: '盐水鸭', price: 32, category: '苏菜', description: '皮白肉嫩，咸鲜清爽', available: 1, image_url: '/dish-images/dish-34.webp' },
  { id: 35, name: '清炖蟹粉狮子头', price: 46, category: '苏菜', description: '汤清味醇，入口松软', available: 1, image_url: '/dish-images/dish-35.webp' },

  // 浙菜：鲜嫩清爽
  { id: 36, name: '西湖醋鱼', price: 34, category: '浙菜', description: '鱼肉细嫩，江南风味', available: 1, image_url: '/dish-images/dish-36.webp' },
  { id: 37, name: '东坡肉', price: 36, category: '浙菜', description: '酱香软糯，入口即化', available: 1, image_url: '/dish-images/dish-37.webp' },
  { id: 38, name: '龙井虾仁', price: 48, category: '浙菜', description: '茶香清新，虾仁弹嫩', available: 1, image_url: '/dish-images/dish-38.webp' },
  { id: 39, name: '宋嫂鱼羹', price: 30, category: '浙菜', description: '细滑鲜美，暖胃舒服', available: 1, image_url: '/dish-images/dish-39.webp' },
  { id: 40, name: '梅干菜扣肉', price: 34, category: '浙菜', description: '咸香下饭，肉香菜润', available: 1, image_url: '/dish-images/dish-40.webp' },

  // 闽菜：汤鲜海味
  { id: 41, name: '佛跳墙小盅', price: 58, category: '闽菜', description: '汤鲜味厚，仪式感满满', available: 1, image_url: '/dish-images/dish-41.webp' },
  { id: 42, name: '荔枝肉', price: 30, category: '闽菜', description: '酸甜酥嫩，果香造型', available: 1, image_url: '/dish-images/dish-42.webp' },
  { id: 43, name: '沙茶面', price: 24, category: '闽菜', description: '沙茶浓香，料足汤鲜', available: 1, image_url: '/dish-images/dish-43.webp' },
  { id: 44, name: '海蛎煎', price: 22, category: '闽菜', description: '外焦里嫩，海味十足', available: 1, image_url: '/dish-images/dish-44.webp' },
  { id: 45, name: '醉排骨', price: 32, category: '闽菜', description: '酸甜酒香，酥香可口', available: 1, image_url: '/dish-images/dish-45.webp' },

  // 徽菜：重油重色
  { id: 46, name: '黄山臭鳜鱼', price: 45, category: '徽菜', description: '闻着独特，吃着鲜香', available: 1, image_url: '/dish-images/dish-46.webp' },
  { id: 47, name: '毛豆腐', price: 22, category: '徽菜', description: '外煎微脆，豆香浓郁', available: 1, image_url: '/dish-images/dish-47.webp' },
  { id: 48, name: '问政山笋', price: 28, category: '徽菜', description: '笋香清鲜，山野味足', available: 1, image_url: '/dish-images/dish-48.webp' },
  { id: 49, name: '徽州一品锅', price: 48, category: '徽菜', description: '层层有料，越煮越香', available: 1, image_url: '/dish-images/dish-49.webp' },
  { id: 50, name: '胡适一品锅', price: 52, category: '徽菜', description: '丰盛暖锅，家宴感满满', available: 1, image_url: '/dish-images/dish-50.webp' },

  // 东北菜：量大实在
  { id: 51, name: '锅包肉', price: 30, category: '东北菜', description: '酸甜酥脆，快乐拉满', available: 1, image_url: '/dish-images/dish-51.webp' },
  { id: 52, name: '地三鲜', price: 22, category: '东北菜', description: '茄子土豆青椒，下饭王', available: 1, image_url: '/dish-images/dish-52.webp' },
  { id: 53, name: '小鸡炖蘑菇', price: 42, category: '东北菜', description: '汤浓肉香，蘑菇吸汁', available: 1, image_url: '/dish-images/dish-53.webp' },
  { id: 54, name: '酸菜白肉锅', price: 40, category: '东北菜', description: '酸爽暖身，越炖越香', available: 1, image_url: '/dish-images/dish-54.webp' },
  { id: 55, name: '东北大拉皮', price: 20, category: '东北菜', description: '爽滑开胃，凉拌很香', available: 1, image_url: '/dish-images/dish-55.webp' },

  // 西北菜：肉香面香
  { id: 56, name: '羊肉泡馍', price: 28, category: '西北菜', description: '暖胃扎实，越吃越香', available: 1, image_url: '/dish-images/dish-56.webp' },
  { id: 57, name: '大盘鸡', price: 45, category: '西北菜', description: '鸡肉土豆宽面，香辣过瘾', available: 1, image_url: '/dish-images/dish-57.webp' },
  { id: 58, name: '手抓羊肉', price: 58, category: '西北菜', description: '原香浓郁，蘸盐就很美', available: 1, image_url: '/dish-images/dish-58.webp' },
  { id: 59, name: '肉夹馍', price: 16, category: '西北菜', description: '馍酥肉烂，香气扑鼻', available: 1, image_url: '/dish-images/dish-59.webp' },
  { id: 60, name: '油泼面', price: 18, category: '西北菜', description: '辣子热油一浇，面香炸开', available: 1, image_url: '/dish-images/dish-60.webp' },

  // 云贵菜：酸辣鲜香
  { id: 61, name: '酸汤牛肉', price: 35, category: '云贵菜', description: '酸辣鲜爽，汤都想喝完', available: 1, image_url: '/dish-images/dish-61.webp' },
  { id: 62, name: '汽锅鸡', price: 46, category: '云贵菜', description: '原汁蒸汽成汤，鲜美清润', available: 1, image_url: '/dish-images/dish-62.webp' },
  { id: 63, name: '过桥米线', price: 26, category: '云贵菜', description: '热汤鲜料，仪式感满分', available: 1, image_url: '/dish-images/dish-63.webp' },
  { id: 64, name: '包烧菌菇', price: 30, category: '云贵菜', description: '菌香浓郁，山野气息', available: 1, image_url: '/dish-images/dish-64.webp' },
  { id: 65, name: '折耳根炒腊肉', price: 32, category: '云贵菜', description: '独特香气，越吃越上头', available: 1, image_url: '/dish-images/dish-65.webp' },
]

// 内存态缓存：407 道菜 + 订单的 JSON 每请求都解析一遍太浪费，
// 首次 loadState 解析后驻留内存，写入时同步落盘（单标签页 demo 场景足够）
let stateCache = null

function loadState() {
  if (stateCache) return stateCache
  let state
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      state = JSON.parse(saved)
      const existingNames = new Set((state.dishes || []).map(d => d.name))
      const missingSeed = seedDishes.filter(d => !existingNames.has(d.name))
      if (missingSeed.length) {
        state.dishes = [...(state.dishes || []), ...missingSeed]
        state.nextDishId = Math.max(Number(state.nextDishId || 1), ...state.dishes.map(d => Number(d.id || 0))) + 1
        saveState(state)
      }
    } else {
      state = { dishes: seedDishes, orders: [], nextDishId: 66, nextOrderId: 1001 }
    }
  } catch {
    state = { dishes: seedDishes, orders: [], nextDishId: 66, nextOrderId: 1001 }
  }
  stateCache = state
  return state
}

// HowToCook 开源菜谱灌库数据（公有领域/Unlicense，生成于 scripts/build_htc_seed.py），
// 扩充日常分类供给；loadState 的 missingSeed 按名去重，老 localStorage 也会自动补齐
seedDishes.push(...SEED_MENU_EXTRA)

function saveState(state) {
  stateCache = state
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

async function readBody(init) {
  if (!init?.body) return {}
  try { return JSON.parse(init.body) } catch { return {} }
}

function getPath(input) {
  const raw = typeof input === 'string' ? input : input?.url
  if (!raw) return null
  const url = new URL(raw, window.location.origin)
  return { pathname: url.pathname, searchParams: url.searchParams }
}

export function installMockApi() {
  // Install the mock in every environment (dev AND production builds) so the
  // app works offline / after `vite build` without a real backend.
  // The __COUPLE_ORDER_MOCK_API__ flag prevents double-installing in HMR.
  if (window.__COUPLE_ORDER_MOCK_API__) return
  window.__COUPLE_ORDER_MOCK_API__ = true
  const nativeFetch = window.fetch.bind(window)

  window.fetch = async (input, init = {}) => {
    const parsed = getPath(input)
    if (!parsed || !parsed.pathname.startsWith('/api/')) return nativeFetch(input, init)

    // Simulate a tiny bit of network latency so loading states remain visible.
    await new Promise(resolve => setTimeout(resolve, 160))

    const state = loadState()
    const method = (init.method || 'GET').toUpperCase()
    const { pathname, searchParams } = parsed

    if (pathname === '/api/dishes/all' && method === 'GET') {
      return json([...state.dishes].sort((a, b) => b.id - a.id))
    }

    if (pathname === '/api/dishes' && method === 'GET') {
      const category = searchParams.get('category') || '全部'
      const dishes = state.dishes
        .filter(d => Number(d.available) !== 0)
        .filter(d => category === '全部' || d.category === category)
      return json(dishes)
    }

    if (pathname === '/api/dishes' && method === 'POST') {
      const body = await readBody(init)
      const dish = { id: state.nextDishId++, available: 1, image_url: '', description: '', ...body, price: Number(body.price || 0) }
      state.dishes.unshift(dish)
      saveState(state)
      return json(dish, 201)
    }

    const dishMatch = pathname.match(/^\/api\/dishes\/(\d+)$/)
    if (dishMatch && method === 'GET') {
      const id = Number(dishMatch[1])
      const dish = state.dishes.find(d => d.id === id)
      if (!dish) return json({ message: 'Not found' }, 404)
      // 菜谱（HowToCook 灌库菜才有）按需动态加载：体积较大，不进列表与首屏
      const recipes = await import('./seedRecipes.js').then(m => m.default).catch(() => ({}))
      return json({ ...dish, recipe: recipes[id] || null })
    }
    if (dishMatch && method === 'PUT') {
      const id = Number(dishMatch[1])
      const body = await readBody(init)
      state.dishes = state.dishes.map(d => d.id === id ? { ...d, ...body, price: body.price === undefined ? d.price : Number(body.price) } : d)
      saveState(state)
      return json(state.dishes.find(d => d.id === id) || null)
    }
    if (dishMatch && method === 'DELETE') {
      const id = Number(dishMatch[1])
      state.dishes = state.dishes.filter(d => d.id !== id)
      saveState(state)
      return json({ ok: true })
    }

    if (pathname === '/api/orders' && method === 'GET') {
      const status = searchParams.get('status')
      const orders = [...state.orders]
        .filter(o => !status || o.status === status)
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      return json(orders)
    }

    if (pathname === '/api/orders' && method === 'POST') {
      const body = await readBody(init)
      const items = (body.items || []).map((item, idx) => {
        const dish = state.dishes.find(d => d.id === Number(item.dish_id)) || {}
        return {
          id: Date.now() + idx,
          dish_id: Number(item.dish_id),
          dish_name: dish.name || item.name || '未知菜品',
          price: Number(dish.price || item.price || 0),
          quantity: Number(item.quantity || 1),
          added_by: item.added_by || 'me',
        }
      })
      const total_price = items.reduce((sum, i) => sum + i.price * i.quantity, 0)
      const order = {
        id: state.nextOrderId++,
        status: 'pending',
        created_at: new Date().toISOString(),
        note: body.note || '',
        payer: body.payer || 'aa',
        total_price,
        items,
      }
      state.orders.unshift(order)
      saveState(state)
      return json(order, 201)
    }

    const orderStatusMatch = pathname.match(/^\/api\/orders\/(\d+)\/status$/)
    if (orderStatusMatch && method === 'PUT') {
      const id = Number(orderStatusMatch[1])
      const body = await readBody(init)
      state.orders = state.orders.map(o => o.id === id ? { ...o, status: body.status || o.status } : o)
      saveState(state)
      return json(state.orders.find(o => o.id === id) || null)
    }

    const orderMatch = pathname.match(/^\/api\/orders\/(\d+)$/)
    if (orderMatch && method === 'GET') {
      const id = Number(orderMatch[1])
      const order = state.orders.find(o => o.id === id)
      return order ? json(order) : json({ message: 'Not found' }, 404)
    }

    return json({ message: `Mock API route not found: ${method} ${pathname}` }, 404)
  }
}
