const STORAGE_KEY = 'couple_order_app_state_v2'

import { SEED_MENU_EXTRA } from './seedMenuExtra.js'
import { SEED_NIGHT_EXTRA } from './seedNightExtra.js'

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

// 内存态缓存：432 道菜 + 订单的 JSON 每请求都解析一遍太浪费，
// 首次 loadState 解析后驻留内存，写入时同步落盘（单标签页 demo 场景足够）
let stateCache = null

/* 批3 修 P1（跨标签失效）：另一页签写盘后本标签读路径下次取最新，
   不再拿陈旧整表去覆盖对方写入（写侧仍是 last-writer-wins，真双端请用家庭服务端）。 */
if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
  window.addEventListener('storage', (e) => { if (e.key === STORAGE_KEY) stateCache = null })
}

function loadState() {
  if (stateCache) return stateCache
  /* 修 P1（批3·数据安全）：原 try 把 saveState 也圈了进去——写盘异常（配额满/Safari 无痕）
     会被误判成"数据损坏"、整表回退 fresh seed：内存里 432 道、磁盘仍是用户那几道，
     后续任何写请求直接未捕获抛错。现在只有「读/解析」失败才回退，补齐落盘各自包自家 try。 */
  const fresh = () => ({ dishes: seedDishes.map(d => ({ ...d })), orders: [], nextDishId: 10000, nextOrderId: 1001, anniversaries: [], wishes: [], nextAnniversaryId: 1, nextWishId: 1, deletedSeedIds: [], sharedCart: { items: [], sharedBy: null, sharedAt: null } })
  let state = null
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      if (parsed && typeof parsed === 'object' && Array.isArray(parsed.dishes)) state = parsed
    }
  } catch {
    state = null
  }
  if (state) {
    /* M-d2 修（不可变文件 · 改动记入 PROJECT-HANDOFF §4 台账）：
       原按 name 去重导致夜宵版 905/907/915 与灌库版 735/767/713 同名时被跳过，
       老设备夜宵池永远少 3 道定向种子。改成 (id,name) 双键判等 —— 灌库版在场不影响夜宵版补齐，
       夜宵版也不会因名同灌库版被误去重。
       批3 修 P1「删不掉」：deletedSeedIds 墓碑——用户真删掉的内置种子不再刷新复活（下架 available=0 不受影响）。 */
    if (!Array.isArray(state.deletedSeedIds)) state.deletedSeedIds = []
    const tombstone = new Set(state.deletedSeedIds.map(Number))
    const existing = new Set((state.dishes || []).map(d => `${d.id}|${d.name}`))
    const missingSeed = seedDishes.filter(d => !existing.has(`${d.id}|${d.name}`) && !tombstone.has(Number(d.id)))
    if (missingSeed.length) {
      state.dishes = [...(state.dishes || []), ...missingSeed]
    }
    /* 老 state 兼容补齐（anniversaries / wishes 两表 + 序列号 + sharedCart） */
    if (!Array.isArray(state.anniversaries)) state.anniversaries = []
    if (!Array.isArray(state.wishes)) state.wishes = []
    if (!Number.isFinite(state.nextAnniversaryId)) state.nextAnniversaryId = 1
    if (!Number.isFinite(state.nextWishId)) state.nextWishId = 1
    if (!state.sharedCart || typeof state.sharedCart !== 'object') state.sharedCart = { items: [], sharedBy: null, sharedAt: null }
    /* 修 P1（脏 id 传染）：原 Math.max(...ids) 遇一条 id='abc' 即 NaN → 落盘 null → 之后所有新菜 id:null
       全线不可自愈。改为过滤非有限值后重算，且顺带修复已损坏的 nextDishId。 */
    const ids = (state.dishes || []).map(d => Number(d && d.id)).filter(Number.isFinite)
    const maxId = ids.length ? Math.max(...ids) : 0
    const cur = Number(state.nextDishId)
    if (!Number.isFinite(cur) || cur <= maxId) state.nextDishId = maxId + 1
    try { saveState(state) } catch { /* 补齐落盘失败不拦读路径（内存态已就绪） */ }
  } else {
    state = fresh()
  }
  stateCache = state
  return state
}

// HowToCook 开源菜谱灌库数据（公有领域/Unlicense，生成于 scripts/build_htc_seed.py），
// 扩充日常分类供给；loadState 的 missingSeed 按名去重，老 localStorage 也会自动补齐
seedDishes.push(...SEED_MENU_EXTRA)
// 夜宵手写种子 25 道（src/lib/seedNightExtra.js，id 900-924，所有者反馈深夜场景缺供给）
seedDishes.push(...SEED_NIGHT_EXTRA)
// —— 真实菜品照片覆盖表（2026-09-18 图片真实化：HowToCook 实拍 + Wikimedia Commons CC 照片）——
const REAL_IMAGE_OVERRIDES = {
  3: '/dish-images/real/3.webp',
  4: '/dish-images/real/4.webp',
  5: '/dish-images/dish-5.webp',
  7: '/dish-images/real/7.webp',
  8: '/dish-images/real/8.webp',
  9: '/dish-images/real/9.webp',
  10: '/dish-images/real/10.webp',
  11: '/dish-images/dish-11.webp',
  12: '/dish-images/dish-12.webp',
  13: '/dish-images/dish-13.webp',
  14: '/dish-images/dish-14.webp',
  15: '/dish-images/real/15.webp',
  16: '/dish-images/real/16.webp',
  18: '/dish-images/real/18.webp',
  19: '/dish-images/real/19.webp',
  20: '/dish-images/real/20.webp',
  21: '/dish-images/real/21.webp',
  22: '/dish-images/dish-22.webp',
  24: '/dish-images/real/24.webp',
  26: '/dish-images/real/26.webp',
  27: '/dish-images/dish-27.webp',
  28: '/dish-images/dish-28.webp',
  29: '/dish-images/real/29.webp',
  31: '/dish-images/real/31.webp',
  32: '/dish-images/real/32.webp',
  33: '/dish-images/real/33.webp',
  36: '/dish-images/real/36.webp',
  37: '/dish-images/real/37.webp',
  38: '/dish-images/real/38.webp',
  40: '/dish-images/real/40.webp',
  41: '/dish-images/real/41.webp',
  42: '/dish-images/dish-42.webp',
  44: '/dish-images/real/44.webp',
  45: '/dish-images/dish-45.webp',
  46: '/dish-images/real/46.webp',
  47: '/dish-images/real/47.webp',
  49: '/dish-images/real/49.webp',
  50: '/dish-images/real/50.webp',
  51: '/dish-images/real/51.webp',
  52: '/dish-images/dish-52.webp',
  56: '/dish-images/real/56.webp',
  59: '/dish-images/real/59.webp',
  60: '/dish-images/real/60.webp',
  61: '/dish-images/real/61.webp',
  62: '/dish-images/real/62.webp',
  63: '/dish-images/real/63.webp',
  516: '/dish-images/htc/516.jpg',
  555: '/dish-images/htc/555.jpg',
  573: '/dish-images/htc/573.jpg',
  576: '/dish-images/htc/576.jpg',
  584: '/dish-images/htc/584.jpg',
  585: '/dish-images/htc/585.jpg',
  588: '/dish-images/htc/588.jpg',
  633: '/dish-images/htc/633.jpg',
  648: '/dish-images/htc/648.jpg',
  669: '/dish-images/htc/669.jpg',
  678: '/dish-images/htc/678.jpg',
  732: '/dish-images/htc/732.jpg',
  760: '/dish-images/htc/760.jpg',
  782: '/dish-images/htc/782.jpg',
  783: '/dish-images/htc/783.jpg',
  900: '/dish-images/real/900.webp',
  901: '/dish-images/real/901.webp',
  902: '/dish-images/real/902.webp',
  903: '/dish-images/real/903.webp',
  904: '/dish-images/real/904.webp',
  905: '/dish-images/htc/905.jpg',
  906: '/dish-images/real/906.webp',
  907: '/dish-images/real/907.webp',
  908: '/dish-images/real/908.webp',
  911: '/dish-images/real/911.webp',
  912: '/dish-images/real/912.webp',
  913: '/dish-images/real/913.webp',
  914: '/dish-images/real/914.webp',
  915: '/dish-images/real/915.webp',
  916: '/dish-images/real/916.webp',
  917: '/dish-images/real/917.webp',
  919: '/dish-images/real/919.webp',
  923: '/dish-images/real/923.webp',
  924: '/dish-images/real/924.webp',
}
// 真实图覆盖应用：命中 id 的菜 image_url 指向真实照片（原 dish-*.webp 中已被 HowToCook
// 实拍覆盖的 11 道路径不变；其余经此表切到 real/ 或 htc/ 新文件）
seedDishes.forEach((d) => { const u = REAL_IMAGE_OVERRIDES[d.id]; if (u) d.image_url = u })
// AI 图清退：仍指向原 dish-*.webp 且未被真实图覆盖的菜，清空 image_url 走 emoji 占位
seedDishes.forEach((d) => { if (/^\/dish-images\/dish-\d+\.webp$/.test(d.image_url) && !(d.id in REAL_IMAGE_OVERRIDES)) d.image_url = '' })



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
      /* 修 P0-8（主键收归服务端）：原 ...body 排在 id 之后，客户端可指定 id 造双主键撞车、
         旧条目永久不可寻址，脏 id 还会传染 nextDishId=NaN 拖垮全库。 */
      const { id: _bodyId, nextDishId: _nd, ...rest } = body || {}
      const dish = { id: state.nextDishId++, available: 1, image_url: '', description: '', ...rest, price: Number(rest.price || 0) }
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
      const body = await readBody(init) || {}
      const idx = state.dishes.findIndex(d => Number(d.id) === id)
      if (idx === -1) return json({ message: 'Not found' }, 404)   // 修 P1：原 200+null 前端永不报错
      /* 修 P1（字段白名单）：body 不再能注入 id/内部字段（原可把菜"改名换身份证"致 GET 404） */
      const pick = {}
      for (const k of ['name', 'price', 'category', 'description', 'available', 'image_url']) {
        if (Object.prototype.hasOwnProperty.call(body, k)) pick[k] = body[k]
      }
      if ('price' in pick) pick.price = Number(pick.price) || 0
      state.dishes[idx] = { ...state.dishes[idx], ...pick, id }
      saveState(state)
      return json(state.dishes[idx])
    }
    if (dishMatch && method === 'DELETE') {
      const id = Number(dishMatch[1])
      const idx = state.dishes.findIndex(d => Number(d.id) === id)
      if (idx === -1) return json({ message: 'Not found' }, 404)     // 修 P1：删除假成功
      state.dishes.splice(idx, 1)
      /* 批3 墓碑：内置种子（id<10000 且在 seed 名单里）被真删后不再刷新复活 */
      if (id < 10000 && seedDishes.some(d => Number(d.id) === id) && !state.deletedSeedIds.includes(id)) {
        state.deletedSeedIds.push(id)
      }
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
      /* 修 P1（幽灵订单）：空 items / 非数组拒建；dish_id 查无此菜拒建——
         原先客户端可提交 {dish_name:'伪造', price:999} 落进真账（settlements/年报/成就全吃它）。 */
      if (!Array.isArray(body.items) || !body.items.length) return json({ message: 'items required' }, 400)
      for (const it of body.items) {
        if (!state.dishes.some(d => Number(d.id) === Number(it.dish_id))) return json({ message: 'unknown dish_id', dish_id: it.dish_id }, 400)
      }
      const items = (body.items || []).map((item, idx) => {
        const dish = state.dishes.find(d => d.id === Number(item.dish_id)) || {}
        return {
          id: Date.now() + idx,
          dish_id: Number(item.dish_id),
          dish_name: dish.name || '未知菜品',
          price: Number(dish.price) || 0,
          quantity: Math.max(1, Number(item.quantity) || 1),   // 修 P2：负数/NaN 份数入库致 -84 元单
          added_by: item.added_by === 'partner' ? 'partner' : 'me',
          category: dish.category || '', /* 修 P0-3：快照分类 */
        }
      })
      const total_price = items.reduce((sum, i) => sum + i.price * i.quantity, 0)
      /* 批 4a · AA 结算快照（家庭语义 AA = 各付各的）：payer=me 全归 🐱 / partner 全归 🐑 / aa 按 added_by 分账。
         落库到订单，避免"事后 admin 改菜价历史订单金额漂"问题（同 §7.15 m-21 快照价缝隙的补丁）。 */
      const PAYER = ['aa', 'me', 'partner'].includes(body.payer) ? body.payer : 'aa'   // 修 P1：非法 payer 静默丢钱
      const meSub = items.filter(i => i.added_by === 'me').reduce((s, i) => s + i.price * i.quantity, 0)
      const partnerSub = items.filter(i => i.added_by === 'partner').reduce((s, i) => s + i.price * i.quantity, 0)
      const owed_me = PAYER === 'me' ? total_price : PAYER === 'partner' ? 0 : meSub
      const owed_partner = PAYER === 'me' ? 0 : PAYER === 'partner' ? total_price : partnerSub
      const order = {
        id: state.nextOrderId++,
        status: 'pending',
        created_at: new Date().toISOString(),
        note: body.note || '',
        /* 批 1 新增：便签留言条（选底色 + 图钉 emoji + 可选手写字体）→ OrderDetail 呈现为贴在灶台上的纸片 */
        sticker: body.sticker && typeof body.sticker === 'object'
          ? { bg: String(body.sticker.bg || ''), pin: String(body.sticker.pin || ''), msg: String(body.sticker.msg || '') }
          : null,
        payer: PAYER,
        total_price,
        /* 批 4a 新增：结算快照 */
        owed_me, owed_partner,
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
      /* 批2a 状态白名单 + 批3（原 m-32 欠账今天还）：方向校验——只许持平或前进，禁一切回退。
         preparing 降级为只读别名（=cooking）；completed 是终点，不可再改。404=无此单。 */
      const NEXT = body.status
      const VALID = ['pending', 'preparing', 'cutting', 'cooking', 'plating', 'completed']
      if (!NEXT || VALID.indexOf(NEXT) === -1) return json({ message: 'invalid status', allowed: VALID }, 400)
      const FLOW = ['pending', 'cutting', 'cooking', 'plating', 'completed']
      const norm = (s) => (s === 'preparing' ? 'cooking' : s)
      const order = state.orders.find(o => o.id === id)
      if (!order) return json({ message: 'Not found' }, 404)
      const from = FLOW.indexOf(norm(order.status))
      const to = FLOW.indexOf(norm(NEXT))
      if (to < from) return json({ message: 'status rollback not allowed', from: order.status, to: NEXT }, 400)
      state.orders = state.orders.map(o => o.id === id ? { ...o, status: NEXT } : o)
      saveState(state)
      return json(state.orders.find(o => o.id === id) || null)
    }

    const orderMatch = pathname.match(/^\/api\/orders\/(\d+)$/)
    if (orderMatch && method === 'GET') {
      const id = Number(orderMatch[1])
      const order = state.orders.find(o => o.id === id)
      return order ? json(order) : json({ message: 'Not found' }, 404)
    }

    /* —— 批 1 新增 · 纪念日 anniversaries（她/他共同的日子，Home 检测命中即切主题） —— */
    if (pathname === '/api/anniversaries' && method === 'GET') {
      return json([...state.anniversaries].sort((a, b) => (a.date || '').localeCompare(b.date || '')))
    }
    if (pathname === '/api/anniversaries' && method === 'POST') {
      const body = await readBody(init)
      /* 修 P2（脏数据静默隐形）：date 必须 YYYY-MM-DD；annual 归一布尔（'false' 字符串不再判真）；
         dish_id 给了就必须存在，否则 400——填错当场可见而不是"绑了但永不亮" */
      const dateStr = String(body.date || '')
      if (!/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.test(dateStr)) return json({ message: 'date must be YYYY-MM-DD' }, 400)
      const dishId = body.dish_id == null || body.dish_id === '' ? null : Number(body.dish_id)
      if (dishId != null && !Number.isFinite(dishId)) return json({ message: 'dish_id must be number' }, 400)
      if (dishId != null && !state.dishes.some(d => Number(d.id) === dishId)) return json({ message: 'unknown dish_id', dish_id: dishId }, 400)
      const item = {
        id: state.nextAnniversaryId++,
        name: String(body.name || '纪念日'),
        date: dateStr,                          // YYYY-MM-DD 首次日期
        annual: !(body.annual === false || body.annual === 'false'),  // 是否每年重复（默认 true）
        dish_id: dishId,                        // 可选绑定的「回忆里那道菜」
        note: String(body.note || ''),
      }
      state.anniversaries.push(item)
      saveState(state)
      return json(item, 201)
    }
    const anniMatch = pathname.match(/^\/api\/anniversaries\/(\d+)$/)
    if (anniMatch && method === 'PUT') {
      const id = Number(anniMatch[1])
      const body = await readBody(init) || {}
      const found = state.anniversaries.find(a => Number(a.id) === id)
      if (!found) return json({ message: 'Not found' }, 404)        // 修 P1：200+null 假成功
      const pick = {}
      for (const k of ['name', 'date', 'annual', 'dish_id', 'note']) {
        if (Object.prototype.hasOwnProperty.call(body, k)) pick[k] = body[k]
      }
      if (Object.prototype.hasOwnProperty.call(pick, 'date') && !/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.test(String(pick.date))) return json({ message: 'date must be YYYY-MM-DD' }, 400)
      if (Object.prototype.hasOwnProperty.call(pick, 'dish_id')) {
        const dv = pick.dish_id == null || pick.dish_id === '' ? null : Number(pick.dish_id)
        if (dv != null && !state.dishes.some(d => Number(d.id) === dv)) return json({ message: 'unknown dish_id' }, 400)
        pick.dish_id = dv
      }
      state.anniversaries = state.anniversaries.map(a => a.id === id ? { ...a, ...pick, id } : a)
      saveState(state)
      return json(state.anniversaries.find(a => a.id === id))
    }
    if (anniMatch && method === 'DELETE') {
      const id = Number(anniMatch[1])
      if (!state.anniversaries.some(a => Number(a.id) === id)) return json({ message: 'Not found' }, 404)
      state.anniversaries = state.anniversaries.filter(a => a.id !== id)
      saveState(state)
      return json({ ok: true })
    }

    /* —— 批 1 新增 · 愿望池 wishes（她提想吃什么菜单没有 → 他补齐/拒绝） —— */
    if (pathname === '/api/wishes' && method === 'GET') {
      const status = searchParams.get('status')
      const list = [...state.wishes].filter(w => !status || w.status === status)
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      return json(list)
    }
    if (pathname === '/api/wishes' && method === 'POST') {
      const body = await readBody(init)
      const item = {
        id: state.nextWishId++,
        name: String(body.name || ''),
        note: String(body.note || ''),
        by: body.by === 'partner' ? 'partner' : 'me',
        status: 'pending',                     // pending | added | rejected
        created_at: new Date().toISOString(),
        added_dish_id: null,                    // 他补齐后关联的 dish id
      }
      state.wishes.unshift(item)
      saveState(state)
      return json(item, 201)
    }
    const wishMatch = pathname.match(/^\/api\/wishes\/(\d+)$/)
    if (wishMatch && method === 'PUT') {
      const id = Number(wishMatch[1])
      const body = await readBody(init) || {}
      if (!state.wishes.some(w => Number(w.id) === id)) return json({ message: 'Not found' }, 404)   // 修 P1：假成功
      const pick = {}
      for (const k of ['status', 'added_dish_id', 'note']) {
        if (Object.prototype.hasOwnProperty.call(body, k)) pick[k] = body[k]
      }
      if (pick.status != null && !['pending', 'added', 'rejected'].includes(pick.status)) return json({ message: 'invalid wish status' }, 400)
      state.wishes = state.wishes.map(w => w.id === id ? { ...w, ...pick, id } : w)
      saveState(state)
      return json(state.wishes.find(w => w.id === id))
    }
    if (wishMatch && method === 'DELETE') {
      const id = Number(wishMatch[1])
      if (!state.wishes.some(w => Number(w.id) === id)) return json({ message: 'Not found' }, 404)
      state.wishes = state.wishes.filter(w => w.id !== id)
      saveState(state)
      return json({ ok: true })
    }

    /* —— 批 4a · 结算单：按月聚合订单 owed_me/owed_partner（历史订单无 owed_* 时按 items+payer 现算兜底） —— */
    if (pathname === '/api/settlements' && method === 'GET') {
      const month = searchParams.get('month') // 'YYYY-MM'，缺省=当月
      const mm = month && /^\d{4}-\d{2}$/.test(month) ? month : new Date().toISOString().slice(0, 7)
      const inMonth = state.orders.filter(o => (o.created_at || '').slice(0, 7) === mm)
      const calc = (o) => {
        if (Number.isFinite(o.owed_me) || Number.isFinite(o.owed_partner)) {
          return { me: Number(o.owed_me || 0), partner: Number(o.owed_partner || 0) }
        }
        // 历史订单兜底：按 items.added_by + payer 现算（与 POST 时同规则）
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
      return json({
        month: mm,
        orders_count: inMonth.length,
        total,
        owed_me: Math.round(owedMe * 100) / 100,
        owed_partner: Math.round(owedPartner * 100) / 100,
        by_payer: {
          aa: byPayer.aa || 0,
          me: byPayer.me || 0,
          partner: byPayer.partner || 0,
        },
      })
    }

    /* —— 批 5 · 跨设备分享购物车（家庭场景"手动分享 + 拉取合并"，非实时同步） ——
       sharedBy 记哪个人格分享的，对方看到"TA 分享了 N 件"再决定合并 —— */
    if (pathname === '/api/cart/share' && method === 'POST') {
      const body = await readBody(init)
      const items = Array.isArray(body.items) ? body.items.map(i => ({
        dish_id: Number(i.dish_id), name: String(i.name || ''), price: Number(i.price) || 0,
        category: String(i.category || ''), quantity: Number(i.quantity) || 1,
        added_by: i.added_by === 'partner' ? 'partner' : 'me',
      })) : []
      state.sharedCart = { items, sharedBy: body.by === 'partner' ? 'partner' : 'me', sharedAt: new Date().toISOString() }
      saveState(state)
      return json(state.sharedCart)
    }
    if (pathname === '/api/cart/shared' && method === 'GET') {
      return json(state.sharedCart || { items: [], sharedBy: null, sharedAt: null })
    }

    return json({ message: `Mock API route not found: ${method} ${pathname}` }, 404)
  }
}
