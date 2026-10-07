/* ============================================================
 * 场景纹理采集层（BackdropTexture）
 *
 * 为什么要有这个文件：
 *   WebGL 的折射 shader 需要一张「玻璃身后是什么」的纹理，而 DOM 内容不会
 *   自动变成 texture。backdrop-filter 之所以能白拿这张图，是因为合成器内部
 *   有现成的背景缓冲 —— 我们要做真折射（iOS Liquid Glass 的核心识别特征），
 *   就必须自己把背景重画一遍。
 *
 * 四条纪律：
 *   1. 颜色一律从 CSS 令牌读（getComputedStyle），本文件不出现任何硬编码色值。
 *      夜宵切主题时令牌会变，所以每次重绘都重新读；唯一的缓存按
 *      「主题 + 表达式」做 key，切主题必然换键，不会把白天的粉留到夜里。
 *   2. 几何读取集中在一次 rAF 里做完，中间不写样式 —— 否则触发强制同步布局，
 *      滚动时掉帧就是这么来的。
 *   3. 静止时绝不重绘：只有 scroll / resize / 主题切换 / 图片增删改源 才置脏。
 *   4. **重建的是「层叠」，不只是「元素」**。页面看起来是一张照片，实际是
 *      纸底 → 颗粒 → vignette → Hero 原片（自带 blur+brightness）→ 74% 晨光洗白
 *      → 卡面 → 内容。少画任何一层，玻璃采到的就不是它身后那个颜色：漏了洗白层
 *      时纹理在药丸处是 0.175 的深灰，真页面是 0.618 的浅粉，差 3.5 倍亮度，
 *      折射再准也只会把一片脏灰弯出个边 —— 所以 filter 与遮罩层必须一起采。
 *
 * 纯函数（coverSourceRect / parseRadialGradient / parseLinearGradient /
 * shouldRepaint）单独导出，好让 scripts/test_backdropTexture.mjs 在 node 里
 * 直接跑，不必起浏览器。
 * ============================================================ */

/* 带 .js 后缀是故意的：本文件被 scripts/test_backdropTexture.mjs 用原生 node 直接
 * import，Node 的 ESM 解析器不做扩展名补全（Vite 会），少这三个字测试就起不来。 */
import { resolveCssColor, clearColorCache } from './cssColor.js'

/** 纹理相对视口的缩放。0.5 = 半分辨率，是折射质量与帧时的主旋钮。 */
export const TEX_SCALE = 0.5

/* ------------------------------------------------------------
 * 纯函数 1：object-fit: cover 的源矩形
 *
 * cover 的语义是「等比放大到铺满框，超出部分裁掉」。换算到源图上：
 * 取两个缩放比的较大者做 scale，则源矩形 = 框尺寸 / scale，居中裁切。
 * 这里必须用 naturalWidth 而不是框尺寸，否则会把已经缩过的显示位图再放大一遍。
 * ---------------------------------------------------------- */
export function coverSourceRect(natW, natH, boxW, boxH) {
  if (!(natW > 0) || !(natH > 0) || !(boxW > 0) || !(boxH > 0)) return null
  const scale = Math.max(boxW / natW, boxH / natH)
  const sw = Math.min(natW, boxW / scale)
  const sh = Math.min(natH, boxH / scale)
  return {
    sx: (natW - sw) / 2,
    sy: (natH - sh) / 2,
    sw,
    sh,
    dx: 0, dy: 0, dw: boxW, dh: boxH,
  }
}

/* ------------------------------------------------------------
 * 渐变解析的公共底座
 *
 * splitTopLevel / sliceBalanced：CSS 的值里逗号既做「色标分隔」也做
 * 「多层背景分隔」，括号里还可能有逗号（rgba / color-mix / 嵌套 gradient）。
 * 所以必须按括号深度切，正则在这种场景下一定会切错。
 * ---------------------------------------------------------- */
export function splitTopLevel(s) {
  const out = []
  let depth = 0, start = 0
  for (let i = 0; i < s.length; i++) {
    const ch = s[i]
    if (ch === '(') depth++
    else if (ch === ')') depth--
    else if (ch === ',' && depth === 0) { out.push(s.slice(start, i)); start = i + 1 }
  }
  out.push(s.slice(start))
  return out
}

/** 从 css[idx] === '(' 处取配对括号内的内容（不含括号本身） */
export function sliceBalanced(css, idx) {
  if (css[idx] !== '(') return null
  let depth = 0
  for (let i = idx; i < css.length; i++) {
    const ch = css[i]
    if (ch === '(') depth++
    else if (ch === ')') { depth--; if (depth === 0) return css.slice(idx + 1, i) }
  }
  return null
}

/** 按「顶层空格」切 token。
 *  不能用 /\s+/：浏览器回读的色值是 `rgb(252, 231, 240)` 带空格的形态，
 *  直接按空白切会把一个色标炸成三截。 */
function splitTopLevelWs(s) {
  const out = []
  let depth = 0, cur = ''
  for (let i = 0; i < s.length; i++) {
    const ch = s[i]
    if (ch === '(') depth++
    else if (ch === ')') depth--
    if (ch === ' ' && depth === 0) { if (cur) out.push(cur); cur = ''; continue }
    cur += ch
  }
  if (cur) out.push(cur)
  return out
}

/** 色标位置归一化。
 *  CSS 允许：① 不给位置（首 0%、尾 100%、中间等分）；② 一个色标给两个位置
 *  （硬断点）；③ 位置单调不减。这里补全为「每个色标一个 0–1 的 at」，
 *  硬断点拆成同色两点，canvas 的 addColorStop 表达不了双位置。 */
function normalizeStops(raw) {
  const out = raw.map((s, i) => {
    if (s.at != null) return { color: s.color, at: s.at }
    if (i === 0) return { color: s.color, at: 0 }
    if (i === raw.length - 1) return { color: s.color, at: 1 }
    // 未给位置：向最近的两个已给位置线性插值；一个都没给就按等分
    let prev = i - 1
    while (prev >= 0 && raw[prev].at == null) prev--
    let next = i + 1
    while (next < raw.length && raw[next].at == null) next++
    const a = prev >= 0 ? raw[prev].at : 0
    const b = next < raw.length ? raw[next].at : 1
    const t = (i - prev) / (next - prev)
    return { color: s.color, at: a + (b - a) * t }
  })
  let last = 0
  for (const s of out) {
    s.at = Math.min(1, Math.max(0, Math.max(s.at, last)))
    last = s.at
  }
  return out
}

/* ------------------------------------------------------------
 * 纯函数 2：解析 --body-bg 的 radial-gradient
 *
 * 只支持本项目实际用到的形态：
 *   radial-gradient(<r1> <r2> at <x> <y>, <color> <pos>%, ...)
 * 颜色里允许 var(--token)，由调用方注入 resolveVar 解析。
 * 解析不了就返回 null，调用方退到主底色实底 —— 宁可平也别画错。
 * ---------------------------------------------------------- */
export function parseRadialGradient(css, resolveVar) {
  if (!css || !css.includes('radial-gradient')) return null
  const start = css.indexOf('radial-gradient')
  if (start < 0) return null
  const inner = sliceBalanced(css, start + 'radial-gradient'.length)
  if (inner == null) return null
  // 按顶层逗号切段（radius/position 段里没有逗号，色标里也没有）
  const parts = splitTopLevel(inner)
  const head = parts.shift()
  const atMatch = head.match(/at\s+([\d.]+)%\s+([\d.]+)%/)
  const radii = head.match(/([\d.]+)%/g) || []
  const stops = []
  for (const p of parts) {
    const seg = p.trim()
    const m = seg.match(/^(.+?)\s+(-?[\d.]+)%\s*$/)
    const colorRaw = m ? m[1].trim() : seg
    const at = m ? parseFloat(m[2]) / 100 : undefined
    stops.push({ color: resolveVar(colorRaw), at })
  }
  if (!stops.length) return null
  return {
    cx: (atMatch ? parseFloat(atMatch[1]) : 50) / 100,
    cy: (atMatch ? parseFloat(atMatch[2]) : 0) / 100,
    rx: (radii[0] ? parseFloat(radii[0]) : 100) / 100,
    ry: (radii[1] ? parseFloat(radii[1]) : radii[0] ? parseFloat(radii[0]) : 100) / 100,
    stops: normalizeStops(stops),
  }
}

/* ------------------------------------------------------------
 * 纯函数 2b：解析 linear-gradient
 *
 * 为什么必须补上：页面里最重的一层不是照片而是**洗白遮罩**。FullBleedHero 的
 * 晨光叠层（--hero-wash-*）白天是 74% 的粉、夜里是 72% 的黑，PageHeader 的
 * 渐隐、EmptyState 的光晕全是 linear/radial-gradient。纹理漏掉它们，玻璃采到
 * 的就是没洗过的原片 —— 实测药丸中心亮度 WebGL 0.175 vs CSS 降级层 0.618，
 * 差的正是这层遮罩，不是 tint。
 *
 * 支持形态：linear-gradient([<angle> | to <side>], <色标>...)，色标可带
 * 0–2 个百分比位置。返回的 angle 用 CSS 语义（0deg 朝上、顺时针增大）。
 * ---------------------------------------------------------- */
export function parseLinearGradient(css, resolveVar) {
  if (!css || !css.includes('linear-gradient(')) return null
  const start = css.indexOf('linear-gradient(')
  if (start < 0) return null
  const inner = sliceBalanced(css, start + 'linear-gradient'.length)
  if (inner == null) return null
  const parts = splitTopLevel(inner)
  if (parts.length < 2) return null
  const head = parts.shift().trim()
  let angle = 180   // CSS 默认 to bottom
  let headIsStop = false
  if (/^to\s/.test(head)) {
    const m = head.match(/^to\s+(left|right|top|bottom)(?:\s+(left|right|top|bottom))?/)
    if (!m) return null
    const map = { top: 0, right: 90, bottom: 180, left: 270 }
    angle = map[m[1]] != null ? map[m[1]] : 180
    if (m[2] && map[m[2]] != null) angle = (angle + map[m[2]]) / 2
  } else if (/^(-?[\d.]+)(deg|turn|grad|rad)$/.test(head)) {
    const v = parseFloat(head)
    angle = /turn$/.test(head) ? v * 360 : /grad$/.test(head) ? v * 90 : /rad$/.test(head) ? v * 180 / Math.PI : v
  } else if (looksLikeColor(head)) {
    headIsStop = true   // 不写方向的写法（首段直接是色标）也要能画，首段要留在色标列表里
  } else {
    return null         // 首段既不是方向也不是颜色 → 形态不认识，交给调用方退实底
  }
  if (headIsStop) parts.unshift(head)
  const stops = []
  for (const p of parts) {
    const seg = p.trim()
    if (!seg) continue
    const toks = splitTopLevelWs(seg)
    const pos = []
    while (toks.length && /^(-?[\d.]+)%$/.test(toks[toks.length - 1])) pos.unshift(parseFloat(toks.pop()) / 100)
    const colorRaw = toks.join(' ').trim()
    if (!colorRaw) continue
    if (pos.length >= 2) {
      stops.push({ color: resolveVar(colorRaw), at: pos[0] })
      stops.push({ color: resolveVar(colorRaw), at: pos[1] })
    } else {
      stops.push({ color: resolveVar(colorRaw), at: pos[0] })
    }
  }
  if (stops.length < 2) return null
  return { angle, stops: normalizeStops(stops) }
}

const looksLikeColor = s => /^(#|rgb\(|rgba\(|hsl\(|hsla\(|color-mix\(|var\(|none$|transparent$)/i.test(s.trim())

/* ------------------------------------------------------------
 * 纯函数 3：脏判定
 *
 * 只有这几类事件值得重画。静止时（无滚动、无 resize、无主题变化）返回 false，
 * 调度器据此跳过整帧工作。
 * ---------------------------------------------------------- */
export function shouldRepaint(prev, next) {
  if (!prev) return true
  if (prev.scrollY !== next.scrollY) return true
  if (prev.w !== next.w || prev.h !== next.h) return true
  if (prev.theme !== next.theme) return true
  if (prev.imgSig !== next.imgSig) return true
  return false
}

/* ------------------------------------------------------------
 * 把解析出的渐变画进给定框
 *
 * 径向：CSS 的 radial-gradient(<rx> <ry> at ...) 是椭圆，canvas 只有圆形渐变，
 * 所以用「绕圆心纵向缩放 + 圆形渐变」等价模拟。
 * 线性：CSS 的渐变线长度 = |w·sinθ| + |h·cosθ|（θ 从「朝上」顺时针量），
 * 这是规范里的投影算法，照抄即可，别用对角线。
 * ---------------------------------------------------------- */
export function paintRadialGradient(ctx, x, y, w, h, g, fallbackColor) {
  if (!g || !g.stops.length) {
    if (fallbackColor) { ctx.fillStyle = fallbackColor; ctx.fillRect(x, y, w, h) }
    return
  }
  const cx = x + g.cx * w, cy = y + g.cy * h
  const r = Math.max(w * g.rx, h * g.ry) || Math.max(w, h)
  const scaleY = r > 0 ? (h * g.ry || r) / r : 1
  ctx.save()
  if (scaleY > 0 && scaleY !== 1) {
    ctx.translate(0, cy)
    ctx.scale(1, scaleY)
    ctx.translate(0, -cy)
  }
  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r)
  g.stops.forEach(s => grad.addColorStop(Math.min(1, Math.max(0, s.at)), s.color))
  ctx.fillStyle = grad
  ctx.fillRect(x, y - h * 2, w * 2, h * 6)
  ctx.restore()
}

export function paintLinearGradient(ctx, x, y, w, h, g) {
  if (!g || g.stops.length < 2) return
  const a = (g.angle % 360) * Math.PI / 180
  const dx = Math.sin(a), dy = -Math.cos(a)          // 屏幕坐标 y 朝下
  const len = Math.abs(w * dx) + Math.abs(h * dy)
  const cx = x + w / 2, cy = y + h / 2
  const grad = ctx.createLinearGradient(cx - dx * len / 2, cy - dy * len / 2, cx + dx * len / 2, cy + dy * len / 2)
  g.stops.forEach(s => grad.addColorStop(Math.min(1, Math.max(0, s.at)), s.color))
  ctx.fillStyle = grad
  ctx.fillRect(x, y, w, h)
}

/** 画一个元素的 background-image（可以是逗号分隔的多层）。
 *  CSS 里**排前的层在上**，所以要从最后一段往前画，才和真实合成顺序一致。
 *  url() 层交给调用方注入的 drawUrl（浏览器侧才有 Image 可用），这样本函数
 *  在 node 里仍然可测 —— 纯函数边界不能因为要加载图片就漏掉。 */
export function paintBackgroundImages(ctx, x, y, w, h, bgImage, resolveVar, bgSize = 'auto', drawUrl = null) {
  if (!bgImage || bgImage === 'none') return 0
  const list = splitTopLevel(bgImage)
  let painted = 0
  for (let i = list.length - 1; i >= 0; i--) {
    const part = list[i].trim()
    if (!part || part === 'none') continue
    if (part.includes('url(')) {
      if (drawUrl && drawUrl(ctx, x, y, w, h, part, bgSize)) painted++
      continue
    }
    const lin = parseLinearGradient(part, resolveVar)
    if (lin) { paintLinearGradient(ctx, x, y, w, h, lin); painted++; continue }
    const rad = parseRadialGradient(part, resolveVar)
    if (rad) { paintRadialGradient(ctx, x, y, w, h, rad, null); painted++ }
  }
  return painted
}

/* ------------------------------------------------------------
 * url() 背景图也是「身后那一层」
 *
 * 为什么必须画：/home 底部那排菜品卡的**主图是 background-image**（缩略图才是
 * <img>）。纹理只采 <img>，于是整排卡在纹理里是空的粉底：同一点真实页面亮度
 * 0.746、纹理 0.818，WebGL 忠实照着纹理画，就比 CSS 那层亮 0.07 ——
 * 看着就是「玻璃接管的一瞬间突然变白」。
 * ---------------------------------------------------------- */
const bgCache = new Map()   // url → { img, ok }

function bgImage(url) {
  if (bgCache.has(url)) return bgCache.get(url)
  const rec = { img: null, ok: false }
  bgCache.set(url, rec)
  const img = new Image()
  img.onload = () => { rec.img = img; rec.ok = true; markDirty() }
  img.onerror = () => { rec.ok = false }
  img.src = url
  return rec
}

/** 按 background-size 把一张 url() 画进框。只实现本项目真用到的几档。 */
function paintUrlLayer(ctx, x, y, w, h, part, bgSize) {
  const url = extractUrl(part)
  if (!url) return false
  const rec = bgImage(url)
  if (!rec.ok || !rec.img) return false
  const natW = rec.img.naturalWidth, natH = rec.img.naturalHeight
  if (!(natW > 0) || !(natH > 0)) return false
  const size = (bgSize || 'auto').split(',')[0].trim()
  if (size === 'cover') {
    const c = coverSourceRect(natW, natH, w, h)
    if (c) { ctx.drawImage(rec.img, c.sx, c.sy, c.sw, c.sh, x, y, w, h); return true }
  }
  if (size === 'contain') { ctx.drawImage(rec.img, x, y, w, h); return true }
  // auto：按原尺寸画在框左上角（本项目没用到 url 平铺，先不实现 repeat）
  ctx.drawImage(rec.img, x, y)
  return true
}

/* ------------------------------------------------------------
 * 浏览器侧胶水
 * ---------------------------------------------------------- */
const inBrowser = typeof document !== 'undefined' && typeof window !== 'undefined'

let canvas = null
let ctx = null
let grainImg = null
let grainLoaded = false
let grainTried = false
let dirty = true
let scheduled = false
let lastEnv = null
const listeners = new Set()

/* ------------------------------------------------------------
 * 颜色解析交给 cssColor（探针元素 + 1×1 canvas 两级）
 *
 * 本文件只负责「先展开拓扑 var()」，落数交给它。不要在这里再写一套：
 * color-mix() 会被 Chrome 序列化成 `color(srgb 0–1 …)` 而不是 `rgba(0–255)`，
 * 自己抓数字当 0–255 用会把白纱画成黑纱（cssColor 的文件头记着这次踩坑）。
 * ---------------------------------------------------------- */

/** 需要采进纹理的实色表面（它们会挡住身后的图片，必须按序画） */
const SOLID_SELECTORS = '.d3-card-face, .ctl-plate, .glass-me, .glass-partner'

/** 遮罩/洗白层的采集钩子。
 *
 *  为什么不自动扫全站：全站有几千个元素，逐个 getComputedStyle 读 background
 *  在滚动时每帧几毫秒，直接掉帧。而且绝大多数元素的底色早就被祖先画过了，
 *  采进来只是重复计费。所以显式标记：谁负责「洗」画面，谁挂 data-bd-layer。
 *  目前挂上的是 App 纸底壳与 FullBleedHero 的晨光叠层 —— 也就是决定玻璃
 *  「亮/暗」的那两层。 */
export const LAYER_ATTR = 'data-bd-layer'

function readTokens() {
  const cs = getComputedStyle(document.documentElement)
  const tok = n => cs.getPropertyValue(n).trim()
  // 兜底色也一律从令牌取：本文件不允许出现字面色值（p6_static_gate 会报「主题层外新 hex」）
  const paper = resolveCssColor(tok('--color-ink-900') || tok('--surface'))
  const resolveVar = raw => {
    let s = (raw || '').trim()
    const m = s.match(/^var\((--[a-z0-9-]+)\)$/)
    if (m) s = tok(m[1]) || paper
    return resolveCssColor(s)
  }
  return {
    bodyBg: tok('--body-bg'),
    grain: tok('--grain'),
    vignette: tok('--vignette'),
    paper,
    resolveVar,
  }
}

/** 从 CSS 值里取出 url() 的目标。
 *  ⚠ 不能用非贪婪 `url\((.*?)\)`：--grain 的 data-URI 内部本身带 `filter='url(%23g)'`，
 *  非贪婪匹配会在**内层**那个右括号处提前截断，得到一个残缺 URI（实测 img.onerror，
 *  于是颗粒层从来没进过纹理）。改成取最后一个右括号之前的全部内容。 */
function extractUrl(cssValue) {
  if (!cssValue) return null
  const i = cssValue.indexOf('url(')
  if (i < 0) return null
  const rest = cssValue.slice(i + 4)
  const last = rest.lastIndexOf(')')
  if (last < 0) return null
  let s = rest.slice(0, last).trim()
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) s = s.slice(1, -1)
  return s || null
}

/** 颗粒层：--grain 是个 data-URI SVG，加载一次后按 pattern 平铺 */
function ensureGrain(url) {
  if (!url || grainTried) return
  grainTried = true
  const src = extractUrl(url)
  if (!src) return
  const img = new Image()
  img.onload = () => { grainImg = img; grainLoaded = true; markDirty() }
  img.onerror = () => { grainLoaded = false; console.warn('[backdropTexture] 颗粒图加载失败，纹理将无颗粒层') }
  img.src = src
}

/** 求某节点真正可见的裁剪框。
 *
 *  关键修正：早期实现直接用 getBoundingClientRect() 画，**没管祖先的 overflow 裁切**。
 *  被 `overflow:hidden` 容器压住的超大图片（Hero、轮播、头像圈）会整张糊到纹理上，
 *  把画面压成中性灰 —— 实测纹理左上角 147/141/140、药丸处 70/67/68，而真实页面是浅粉。
 *  这里向上走祖先，遇到非 visible 的 overflow 就与它的框求交。
 */
function clipRectFor(el, r, vw, vh) {
  const x0 = Math.max(0, r.left), y0 = Math.max(0, r.top)
  let box = { x: x0, y: y0, w: Math.min(r.right, vw) - x0, h: Math.min(r.bottom, vh) - y0 }
  let p = el.parentElement
  while (p && p !== document.body && p !== document.documentElement) {
    const cs = getComputedStyle(p)
    if (cs.overflowX !== 'visible' || cs.overflowY !== 'visible') {
      const pr = p.getBoundingClientRect()
      const x = Math.max(box.x, pr.left), y = Math.max(box.y, pr.top)
      const x2 = Math.min(box.x + box.w, pr.right), y2 = Math.min(box.y + box.h, pr.bottom)
      box = { x, y, w: x2 - x, h: y2 - y }
      if (box.w <= 0 || box.h <= 0) return null
    }
    p = p.parentElement
  }
  return (box.w > 0 && box.h > 0) ? box : null
}

const CAPTURE_SELECTOR = `img, ${SOLID_SELECTORS}, [${LAYER_ATTR}]`
const SOLID_SET = SOLID_SELECTORS.split(',').map(s => s.trim())

function kindOf(el) {
  if (el.tagName === 'IMG') return 'img'
  if (el.hasAttribute(LAYER_ATTR)) return 'layer'
  for (const sel of SOLID_SET) if (el.matches(sel)) return 'solid'
  return 'layer'   // 只会因为选择器命中而进来，兜底当遮罩层画
}

/** 采集视口内该画进纹理的节点。
 *
 * 关键：所有节点**一次收集、按文档顺序绘制**。早期实现是「先画完所有图片，再画
 * 所有卡面」，结果卡片背景把盖在它上面的菜品图整个抹掉（浏览器实测：图中心采到的
 * 是卡面色 #2E2229 而不是照片）。querySelectorAll 的返回顺序即文档顺序，对
 * 非层叠（z-index/定位）元素就是近似绘制顺序 —— 遮罩层都是 absolute inset-0，
 * 在文档里排在被洗的元素之后，正好符合预期。
 *
 * 每个节点带三样「层叠信息」，缺一就不像：
 *   filter   —— Hero 原片的 blur(14px)+brightness()，直接决定身后是亮是暗；
 *   opacity  —— framer 渐入中的遮罩，按最终不透明度画会整屏发黑；
 *   bgImage  —— linear/radial 洗白层（见文件头纪律 4）。
 * 没做的：mix-blend-mode、mask、CSS 动画进行中的中间帧（只在脏帧采样，
 * 入场动画结束后会随 mutation/scroll 再采一次，落点是对的）。
 */
function collectNodes(vw, vh, resolveVar) {
  const out = []
  for (const el of document.querySelectorAll(CAPTURE_SELECTOR)) {
    const r = el.getBoundingClientRect()
    if (r.width <= 0 || r.height <= 0) continue
    if (r.bottom <= 0 || r.top >= vh || r.right <= 0 || r.left >= vw) continue   // 完全在视口外
    const clip = clipRectFor(el, r, vw, vh)
    if (!clip) continue                                                          // 被祖先裁没了
    const cs = getComputedStyle(el)
    const op = parseFloat(cs.opacity)
    if (!(op > 0) || cs.visibility === 'hidden') continue                        // 完全透明的层不画
    out.push({
      kind: kindOf(el),
      el,
      x: clip.x, y: clip.y, w: clip.w, h: clip.h,               // 与祖先求交后的可见框
      boxX: r.left, boxY: r.top, boxW: r.width, boxH: r.height,  // 元素自己的框（画渐变/圆角用它）
      radius: parseFloat(cs.borderRadius) || 0,
      alpha: Math.min(1, op),
      filter: cs.filter && cs.filter !== 'none' ? cs.filter : '',
      bg: cs.backgroundColor,
      bgImg: cs.backgroundImage,
      bgSize: cs.backgroundSize,
      fit: cs.objectFit,
      natW: el.naturalWidth, natH: el.naturalHeight,
      resolveVar,
    })
  }
  return out
}

function envSnapshot(vw, vh) {
  const imgs = document.querySelectorAll('img')
  let sig = imgs.length
  for (const el of imgs) sig = (sig * 31 + el.src.length + (el.complete ? 1 : 0)) >>> 0
  return {
    scrollY: Math.round(window.scrollY || 0),
    w: vw, h: vh,
    theme: document.documentElement.dataset.theme || 'light',
    imgSig: sig,
  }
}

function roundRectPath(c, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2)
  c.beginPath()
  c.moveTo(x + rr, y)
  c.arcTo(x + w, y, x + w, y + h, rr)
  c.arcTo(x + w, y + h, x, y + h, rr)
  c.arcTo(x, y + h, x, y, rr)
  c.arcTo(x, y, x + w, y, rr)
  c.closePath()
}

function repaint() {
  const vw = window.innerWidth, vh = window.innerHeight
  const env = envSnapshot(vw, vh)
  if (!shouldRepaint(lastEnv, env)) return false
  lastEnv = env

  const w = Math.max(1, Math.round(vw * TEX_SCALE))
  const h = Math.max(1, Math.round(vh * TEX_SCALE))
  if (!canvas) { canvas = document.createElement('canvas'); ctx = canvas.getContext('2d') }
  if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h }

  const t = readTokens()
  ensureGrain(t.grain)

  ctx.setTransform(TEX_SCALE, 0, 0, TEX_SCALE, 0, 0)
  ctx.clearRect(0, 0, vw, vh)

  // ① 纸底：html/body 的 --body-bg（多层径向渐变），解析不了退主底色实底
  if (!paintBackgroundImages(ctx, 0, 0, vw, vh, t.bodyBg, t.resolveVar))
    paintRadialGradient(ctx, 0, 0, vw, vh, null, t.paper)

  // ② 颗粒（pattern 平铺；未加载完就先跳过，下一帧补上）
  //    玻璃要「弯」出东西，身后必须有高频细节 —— 这张图就是给折射准备的。
  if (grainLoaded && grainImg) {
    const pat = ctx.createPattern(grainImg, 'repeat')
    if (pat) { ctx.fillStyle = pat; ctx.fillRect(0, 0, vw, vh) }
  }

  // ②b body::before 的 vignette（伪元素选不到，直接读令牌画；白天 --vignette:none 自动跳过）
  paintBackgroundImages(ctx, 0, 0, vw, vh, t.vignette, t.resolveVar)

  // ③ 层叠：图片 / 实色卡面 / 洗白遮罩，按文档顺序一次画完。
  //    顺序错了会把图抹掉（见 collectNodes 注释）；漏了遮罩层会把整张纹理
  //    画成没洗过的原片 —— 那正是 WebGL 层比 CSS 降级层暗 3.5 倍的原因。
  //    裁剪是两重的：先套祖先的 overflow 交框，再套元素自己的圆角框。
  //    canvas 的 clip  successive 求交，所以两次 clip() 自然得到交集。
  for (const n of collectNodes(vw, vh, t.resolveVar)) paintNode(n)

  listeners.forEach(cb => { try { cb(canvas) } catch (e) { console.error('[backdropTexture] listener 抛错', e) } })
  return true
}

/** 画一个采集到的节点。裁剪见 repaint，这里只管「这一层画什么」。 */
function paintNode(n) {
  ctx.save()
  ctx.globalAlpha = n.alpha
  // CSS filter 链路里 blur 的长度单位在 canvas 下按设备像素解释，纹理是 0.5 倍，
  // 所以模糊半径等效放大一档。亮度/饱和是逐通道运算，与缩放无关 —— 决定明暗的
  // 那部分不会偏，故不额外换算（换了反而要跟着 TEX_SCALE 走）。
  if (n.filter) ctx.filter = n.filter
  ctx.beginPath(); ctx.rect(n.x, n.y, n.w, n.h); ctx.clip()
  if (n.radius > 0) { roundRectPath(ctx, n.boxX, n.boxY, n.boxW, n.boxH, n.radius); ctx.clip() }

  if (n.kind === 'img') {
    if (!(n.el.complete && n.natW > 0)) { ctx.restore(); return }
    // cover 的比例必须按**元素自身框**算，用被祖先裁小的框算会得错源矩形
    if (n.fit === 'contain' || n.fit === 'none' || n.fit === 'scale-down') {
      ctx.drawImage(n.el, n.boxX, n.boxY, n.boxW, n.boxH)
    } else {
      const c = coverSourceRect(n.natW, n.natH, n.boxW, n.boxH)
      if (c) ctx.drawImage(n.el, c.sx, c.sy, c.sw, c.sh, n.boxX, n.boxY, n.boxW, n.boxH)
      else ctx.drawImage(n.el, n.boxX, n.boxY, n.boxW, n.boxH)
    }
    ctx.restore()
    return
  }

  // 卡面与遮罩层：先铺 background-color，再叠 background-image（多层已在函数里倒序）
  const box = [n.boxX, n.boxY, n.boxW, n.boxH]
  if (n.bg && n.bg !== 'transparent') {
    ctx.fillStyle = resolveCssColor(n.bg)
    ctx.fillRect(...box)
  }
  if (n.bgImg && n.bgImg !== 'none') paintBackgroundImages(ctx, ...box, n.bgImg, n.resolveVar, n.bgSize, paintUrlLayer)
  ctx.restore()
}

/* 背景图的「迟到」不需要额外的脏判定通路：paintUrlLayer 遇到没见过的 url 会建一个
 * Image，它的 onload 里已经 markDirty()。换源同理（新 url → 新 Image → 再画一帧）。
 * 曾考虑在 envSnapshot 里扫一遍所有采集节点的 background-image 做签名，但那等于
 * 每帧多跑一轮 getComputedStyle，为了一个已有解的事件把热路径搞贵，不划算。 */

function schedule() {
  if (scheduled) return
  scheduled = true
  requestAnimationFrame(() => {
    scheduled = false
    if (dirty) { dirty = false; repaint() }
  })
}

export function markDirty() { dirty = true; schedule() }

/** 拿当前纹理；尺寸变了或变脏了就就地重画。返回 null 表示还没准备好。 */
export function getBackdropTexture() {
  if (!inBrowser) return null
  if (dirty) { dirty = false; repaint() }
  return canvas
}

/** 订阅纹理更新（渲染层据此重传 texture / 重绘一帧） */
export function subscribe(cb) {
  listeners.add(cb)
  markDirty()
  return () => listeners.delete(cb)
}

/** 供玻璃表面每帧取自身几何。调用方必须在同一次 rAF 里读完，
 *  且不要在「写样式 → 立刻读几何」的循环里用它（强制同步布局）。 */
export function rectOf(el) {
  if (!el) return null
  const r = el.getBoundingClientRect()
  return { x: r.left, y: r.top, w: r.width, h: r.height }
}

/** 纹理相对视口的缩放，供 shader 做坐标换算 */
export function getTexScale() { return TEX_SCALE }

let bound = false
let imgEls = []
let observers = []
// 必须是**同一个函数引用**：addEventListener / removeEventListener 按引用配对，
// 早期实现在 detach 里又 `const on = () => ...` 新建了一个，remove 静默无效，
// 再 attach 就成了双份监听。
const onDirty = () => markDirty()

/** 绑定全局事件。重复调用安全。 */
export function attach() {
  if (!inBrowser || bound) return
  bound = true
  window.addEventListener('scroll', onDirty, { passive: true })
  window.addEventListener('resize', onDirty)
  // 主题切换顺带清颜色缓存：缓存 key 本身已含主题，这里只是给「原地改令牌」留后路
  const themeObs = new MutationObserver(() => { clearColorCache(); markDirty() })
  themeObs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
  const bodyObs = new MutationObserver(onDirty)
  bodyObs.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['src'] })
  observers = [themeObs, bodyObs]
  imgEls = [...document.querySelectorAll('img')]
  imgEls.forEach(el => {
    el.addEventListener('load', onDirty)
    el.addEventListener('error', onDirty)
  })
  markDirty()
}

export function detach() {
  if (!inBrowser || !bound) return
  bound = false
  window.removeEventListener('scroll', onDirty)
  window.removeEventListener('resize', onDirty)
  observers.forEach(o => o.disconnect())
  observers = []
  imgEls.forEach(el => {
    el.removeEventListener('load', onDirty)
    el.removeEventListener('error', onDirty)
  })
  imgEls = []
}
