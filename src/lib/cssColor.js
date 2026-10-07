/* ============================================================
 * cssColor —— 把任意 CSS 颜色表达式落成能用的数字
 *
 * 为什么要有这个文件：CSS 里写 `color-mix(in srgb, var(--x) 22%, transparent)`
 * 时，自定义属性的 getComputedStyle **只把原始串原样吐回来**（var() 都不展开），
 * 所以必须借一次真实渲染才能拿到颜色。借法是探针元素：写进 background-color，
 * 再读 computed。
 *
 * ⚠ 但探针读回来的**不一定是 rgba(0–255)**。Chrome 对 color-mix 的序列化是
 * CSS Color 4 的函数式写法：
 *     color-mix(in srgb, #FFF9FC 22%, transparent)
 *       → background-color: color(srgb 1 0.976471 0.988235 / 0.22)
 * 三个通道是 **0–1 浮点**。谁要是按 `rgba()` 的形状抓数字当 0–255 用，
 * 白色就变成 1/255 的黑 —— 实测白天的玻璃因此被凭空压暗 22%，
 * 上缘高光也从白线变成黑环。这类 bug 不抛错、只让画面变暗，最难查。
 *
 * 所以这里做两级，并且只信 canvas 一个出口：
 *   ① 探针元素：把 var()/color-mix()/自定义属性 交给样式引擎；
 *   ② 1×1 canvas：把样式引擎吐出的**任何**合法 CSS 颜色（rgba / color() / oklab /
 *      hsl / 关键字…）填进去再 getImageData，得到唯一的真值 0–255 + 0–1 alpha。
 *
 * 合法性判定用 CSS.supports，不用「哨兵色」：本项目门禁（p6_static_gate）会把
 * 主题层以外的深色字面量当可疑硬编码报出来，写个近黑的小颜色当哨兵既污染色值
 * 扫描、又可能被误读成一个真实颜色。
 *
 * 缓存 key 带主题：同一个表达式串在白天/夜宵下解析结果不同（它引用的令牌会变）。
 * =========================================================== */

const inBrowser = typeof document !== 'undefined'

let probe = null
let onePix = null
let oneCtx = null
const strCache = new Map()   // expr → 浏览器序列化后的颜色串
const numCache = new Map()   // expr → [r, g, b, a]（r/g/b 0–255，a 0–1）

const cacheKey = expr => (document.documentElement.dataset.theme || 'light') + '\u0000' + expr

function ensureProbe() {
  if (!probe) {
    probe = document.createElement('span')
    probe.setAttribute('aria-hidden', 'true')
    probe.style.cssText = 'position:fixed;left:-9999px;top:0;width:1px;height:1px;visibility:hidden'
    document.documentElement.appendChild(probe)
  }
  return probe
}

const supports = (prop, value) =>
  typeof CSS !== 'undefined' && CSS.supports ? CSS.supports(prop, value) : true

/** ① 把表达式交给样式引擎，拿回它序列化的颜色串（认不了就原样返回） */
export function resolveCssColor(expr) {
  if (!expr || !inBrowser) return expr
  const key = cacheKey(expr)
  const hit = strCache.get(key)
  if (hit !== undefined) return hit
  if (!supports('background-color', expr)) { strCache.set(key, expr); return expr }
  const el = ensureProbe()
  el.style.backgroundColor = expr
  const out = getComputedStyle(el).backgroundColor
  strCache.set(key, out)
  return out
}

/** ① + ② 串起来：任意表达式 → [r, g, b, a]，r/g/b 为 0–255，a 为 0–1
 *
 *  必须先过探针那一跳再交给 canvas：canvas 的 fillStyle 认得 `color(srgb …)`，
 *  但**不认得 var()** —— 少这一跳，所有 `var(--glass-*)` 都会静默变成透明黑。 */
export function parseCssColor(expr) {
  if (!expr || !inBrowser) return null
  const key = cacheKey(expr)
  const hit = numCache.get(key)
  if (hit !== undefined) return hit
  const resolved = resolveCssColor(expr)
  if (!supports('background-color', resolved)) { numCache.set(key, null); return null }
  if (!onePix) {
    onePix = document.createElement('canvas')
    onePix.width = 1; onePix.height = 1
    oneCtx = onePix.getContext('2d', { willReadFrequently: true })
  }
  if (!oneCtx) { numCache.set(key, null); return null }
  oneCtx.clearRect(0, 0, 1, 1)
  oneCtx.globalAlpha = 1
  oneCtx.fillStyle = resolved
  oneCtx.fillRect(0, 0, 1, 1)
  const d = oneCtx.getImageData(0, 0, 1, 1).data
  const out = [d[0], d[1], d[2], d[3] / 255]
  numCache.set(key, out)
  return out
}

/** 主题切换时可手动清空；自动路径不必 —— 缓存 key 里已经带了主题。 */
export function clearColorCache() {
  strCache.clear()
  numCache.clear()
}
