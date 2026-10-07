// 场景纹理采集层纯函数测试 —— node scripts/test_backdropTexture.mjs（无框架）
// 覆盖：object-fit:cover 源矩形三种情形、--body-bg 径向渐变解析、脏判定。
let failed = 0
const assert = (cond, msg) => {
  if (cond) console.log('✓', msg)
  else { console.error('✗', msg); failed++ }
}
const near = (a, b, eps = 1e-6) => Math.abs(a - b) < eps

const {
  coverSourceRect, parseRadialGradient, parseLinearGradient, splitTopLevel,
  shouldRepaint, TEX_SCALE,
} = await import('../src/lib/backdropTexture.js')

// 1) cover：图比框宽（源 2:1、框 1:1）→ scale 取较大者=1，源矩形 100×100，左右各裁 50
{
  const c = coverSourceRect(200, 100, 100, 100)
  assert(c && near(c.sw, 100) && near(c.sh, 100), 'cover 图宽于框：源矩形取 100×100（纵向铺满）')
  assert(c && near(c.sx, 50) && near(c.sy, 0), 'cover 图宽于框：水平居中裁切（sx=50，左右各丢 50）')
  assert(c && near(c.dw, 100) && near(c.dh, 100), 'cover 目标框尺寸原样透传')
}
// 2) cover：图比框高 → 上下裁，横向铺满
{
  const c = coverSourceRect(100, 400, 100, 100)   // 源 1:4，框 1:1
  assert(c && near(c.sw, 100) && near(c.sh, 100), 'cover 图高于框：源矩形取 100×100')
  assert(c && near(c.sy, 150), 'cover 图高于框：垂直居中裁切（sy=150）')
}
// 3) cover：小图放大填满（源矩形不得大于原图）
{
  const c = coverSourceRect(10, 10, 100, 50)
  assert(c && c.sw <= 10 && c.sh <= 10, 'cover 小图放大：源矩形不超出原图边界')
  assert(c && near(c.dw, 100) && near(c.dh, 50), 'cover 小图放大：仍铺满目标框')
}
// 4) 退化输入不得炸
{
  assert(coverSourceRect(0, 10, 10, 10) === null, 'naturalWidth=0 返回 null（图片还没解码完）')
  assert(coverSourceRect(10, 10, 0, 10) === null, '框宽=0 返回 null（display:none / 折叠）')
}
// 5) 完全在视口外的判定由 collectImages 负责，这里锁住它的判据语义
{
  const outside = r => (r.bottom <= 0 || r.top >= 800 || r.right <= 0 || r.left >= 400)
  assert(outside({ bottom: -5, top: -105, right: 300, left: 10 }) === true, '视口上方外的图被剔除')
  assert(outside({ bottom: 700, top: 640, right: 300, left: 10 }) === false, '视口内的图保留')
}
// 6) 径向渐变解析（本项目 --body-bg 的真实形态）
{
  const cs = { '--color-ink-900': '#FCE7F0' }
  const resolveVar = raw => {
    const m = raw && raw.match(/^var\((--[a-z0-9-]+)\)$/)
    return m ? cs[m[1]] : raw
  }
  const g = parseRadialGradient(
    'radial-gradient(120% 80% at 50% 0%, #FEF5F9 0%, var(--color-ink-900) 55%, #F9DCE9 100%)',
    resolveVar)
  assert(!!g, '--body-bg 径向渐变可解析')
  assert(g && g.stops.length === 3, '色标数量 = 3')
  assert(g && g.stops[1].color === '#FCE7F0', 'var(--color-ink-900) 被解析成真实色值')
  assert(g && near(g.stops[1].at, 0.55), '色标位置换算成 0–1')
  assert(g && near(g.cx, 0.5) && near(g.cy, 0), 'at 50% 0% 解析为圆心位置')
  assert(parseRadialGradient('none', resolveVar) === null, '非渐变值返回 null，调用方退实底')
}
// 7) 脏判定：静止不重绘
{
  const a = { scrollY: 100, w: 400, h: 800, theme: 'light', imgSig: 7 }
  assert(shouldRepaint(null, a) === true, '首帧必画')
  assert(shouldRepaint(a, { ...a }) === false, '什么都没变 → 不重绘')
  assert(shouldRepaint(a, { ...a, scrollY: 101 }) === true, '滚动 1px → 重绘')
  assert(shouldRepaint(a, { ...a, theme: 'night' }) === true, '切主题 → 重绘')
  assert(shouldRepaint(a, { ...a, imgSig: 8 }) === true, '图片增删/换源 → 重绘')
  assert(shouldRepaint(a, { ...a, w: 390 }) === true, '视口宽度变化 → 重绘')
}
// 8) 纹理缩放常量
assert(TEX_SCALE > 0 && TEX_SCALE <= 1, `TEX_SCALE=${TEX_SCALE} 在 (0,1] 内（半分辨率是默认档）`)

// 9) 线性渐变解析：页面洗白层的真实形态（FullBleedHero 晨光叠层）
{
  const resolve = raw => raw
  const g = parseLinearGradient(
    'linear-gradient(180deg, rgba(252,231,240,0.55) 0%, rgba(252,231,240,0.66) 30%, rgba(252,231,240,0.78) 52%, rgba(252,231,240,0.94) 80%, #FCE7F0 100%)',
    resolve)
  assert(!!g && g.angle === 180, 'linear-gradient 角度可解析')
  assert(g && g.stops.length === 5, '色标数量 = 5')
  assert(g && near(g.stops[3].at, 0.8) && g.stops[3].color === 'rgba(252,231,240,0.94)', '第 4 个色标位置与颜色都对')
  assert(g && g.stops.every((s, i) => i === 0 || s.at >= g.stops[i - 1].at), '色标位置单调不减（canvas 要求）')
}
// 10) 带空格的 rgb()/color-mix() 不得被空白切坏（浏览器回读的色值就是这种形态）
{
  const g = parseLinearGradient('linear-gradient(180deg, rgb(252, 231, 240) 0%, rgba(0, 0, 0, 0) 100%)', s => s)
  assert(g && g.stops.length === 2 && g.stops[0].color === 'rgb(252, 231, 240)', 'rgb(…) 内部空格不被当成色标分隔')
  const m = parseLinearGradient('linear-gradient(to right, rgb(230, 138, 164) 0%, transparent 100%)', s => s)
  assert(m && near(m.angle, 90), 'to right 换算成 90deg')
}
// 11) 不给位置 / 硬断点
{
  const a = parseLinearGradient('linear-gradient(rgb(255, 244, 248), rgb(250, 220, 233))', s => s)
  assert(a && near(a.stops[0].at, 0) && near(a.stops[1].at, 1), '缺省位置：首尾补 0%/100%')
  assert(a && a.stops[0].color === 'rgb(255, 244, 248)', '不写方向时首段仍是第一个色标（不是被当成方向吃掉）')
  const b = parseLinearGradient('linear-gradient(180deg, rgb(230, 138, 164) 0% 50%, rgb(255, 244, 248) 50%)', s => s)
  assert(b && b.stops.length === 3 && near(b.stops[1].at, 0.5) && near(b.stops[2].at, 0.5), '双位置硬断点拆成同色两点')
  assert(parseLinearGradient('radial-gradient(circle, red, blue)', s => s) === null, '非 linear 值返回 null')
}
// 12) 多层 background-image 按顶层逗号切分（嵌套括号里的逗号不得切）
{
  const parts = splitTopLevel('radial-gradient(circle, rgb(1, 2, 3) 0%, transparent 70%), linear-gradient(180deg, rgb(4, 5, 6) 0%, rgb(7, 8, 9) 100%)')
  assert(parts.length === 2, '两层背景切成 2 段')
  assert(/^radial-gradient/.test(parts[0].trim()) && /^linear-gradient/.test(parts[1].trim()), '切点落在层之间而不是色标之间')
}

console.log(failed ? `\n[backdropTexture] ${failed} 条失败` : '\n[backdropTexture] 全部通过')
process.exit(failed ? 1 : 0)
