// ============================================================
// 晨光厨房 · 夜宵判定规则（2026-09-17）
// 纯关键词规则库：夜宵模式下首页自动选品与点菜页「夜宵」筛选共用。
// 只匹配菜名（描述里"追剧必备"等泛词会误伤正餐大菜），
// 显式黑名单兜住"可乐鸡翅"这类含宵夜词的下饭硬菜。
// ============================================================

// 深夜食堂系：烧烤炸串 / 夜面炒饭 / 饺包馄饨 / 粥粉砂锅 / 卤味辣锅 / 糖水暖饮
const NIGHT_RE = /(烤串|炸串|烧烤|烤冷面|烤鱼|烤鱿鱼|烤生蚝|烤面包|炒饭|炒粉|炒面|炒河粉|炒年糕|炒饼|河粉|泡面|方便面|螺蛳粉|酸辣粉|米线|米粉|粉丝汤|抄手|馄饨|云吞|小笼|生煎|锅贴|煎饺|蒸饺|水饺|饺子|手抓饼|灌饼|卷饼|粥|砂锅|煲仔|火锅|冒菜|麻辣烫|串串|关东煮|卤|鸭脖|鸭翅|鸡爪|毛豆|花甲|蛏子|臭豆腐|炸鸡|薯条|鸡翅尖|小龙虾|口味虾|烧烤|披萨|章鱼烧|蛋挞|松饼|华夫|布丁|双皮奶|姜撞奶|芋圆|西米露|糖水|酒酿|醪糟|汤圆|银耳|桃胶|燕菜|慕斯|曲奇|热牛奶|热可可|可可|牛奶|酸奶|气泡|酸梅汤|柠檬茶|夜宵|宵夜|深夜)/

// 含宵夜词但实为正餐/硬菜的排除项（按菜名精确兜底）
const NIGHT_EXCLUDE_RE = /^(可乐鸡翅|可乐鸡腿|可乐鸡|啤酒鸭|啤酒鱼|牛奶布丁蛋糕)/

/** 该菜是否适合当夜宵（关键词规则，非数据字段） */
export function isNightSnack(dish) {
  if (!dish || !dish.name) return false
  if (NIGHT_EXCLUDE_RE.test(dish.name)) return false
  return NIGHT_RE.test(dish.name)
}

/** 从池中挑夜宵；命中数过少时回退整池，保证夜宵模式永不空池 */
export function nightPick(dishes, min = 6) {
  return nightPickInfo(dishes, min).list
}

/* m-26 修（2026-09-23 第四轮审查）：nightPick 命中<min 时回退整池但不给任何标注，
   UI 层无从得知是"真夜宵推荐"还是"宵夜供给不足先看这些"。新加 nightPickInfo
   返回 {list, isFallback} 元信息，UI 消费 isFallback 显示降级角标；
   旧 nightPick 保留兼容签名。 */
export function nightPickInfo(dishes, min = 6) {
  const pool = dishes || []
  const night = pool.filter(isNightSnack)
  return night.length >= min ? { list: night, isFallback: false } : { list: pool, isFallback: true }
}
