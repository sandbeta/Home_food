/* ============================================================
 * scripts/prune-dist-images.mjs —— 构建后把「线上永远不会被请求」的菜品原图从 dist 剔除
 * ------------------------------------------------------------
 * 为什么要有这一步：src/lib/categoryIcons.js 的 getDishImage(dish, size) 只有两档会真正
 * 改写路径 —— 'thumb'（默认，列表/娃娃机/蒸笼/幸运签）与 'w800'（详情页主视觉、分享海报）。
 * 第三档 'orig' 全项目 0 个调用方，也没有任何组件绕过 getDishImage 直接把 dish.image_url
 * 塞进 <img src>（唯一写 image_url 的地方是 AddDishModal 的表单字段）。
 * 但 public/dish-images/ 下的 htc/ 与 real/ 连同根层 dish-*.webp 共 235 个文件、11.23MB
 * 会被 vite 整份拷进 dist 一起上线 —— 它们只是 npm run thumbs 的源图，线上一次都不会被请求。
 *
 * 规则（保守取向）：
 *  · 只删 dist/dish-images/htc/、dist/dish-images/real/ 两个目录，以及 dish-images 根层的
 *    dish-*.webp。**绝不碰 thumb/ 与 w800/**（它们内部也有 htc/ real/ 子目录，路径区分靠层级）。
 *  · 删之前先数 thumb/ 与 w800/ 的档数，两档必须等量且非零；不等就说明缩略图没生成全，
 *    此时**原图一个都不删**直接 exit 1 —— 宁可构建红，也不要线上 404。
 *  · 本地源图（public/）不动，`npm run thumbs` 照常能从原图重打两档。
 *  · 需要临时保留原图（例如想试 'orig' 档）：KEEP_ORIG=1 npm run build
 *
 * 用法：由 package.json 的 build 串起来（vite build && node scripts/prune-dist-images.mjs）。
 * ============================================================ */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DIST_IMG = path.join(__dirname, '..', 'dist', 'dish-images')
const ORIG_DIRS = ['htc', 'real']
const TIERS = ['thumb', 'w800']

function countFiles(dir) {
  if (!fs.existsSync(dir)) return 0
  let n = 0
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    n += e.isDirectory() ? countFiles(path.join(dir, e.name)) : 1
  }
  return n
}

if (process.env.KEEP_ORIG === '1') {
  console.log('[prune] KEEP_ORIG=1 —— 保留全部原图，dist 未做任何剔除。')
  process.exit(0)
}

if (!fs.existsSync(DIST_IMG)) {
  console.error(`[prune] 找不到 ${DIST_IMG}：先跑 vite build（本脚本必须在 build 之后执行）。`)
  process.exit(1)
}

/* 前置门：两档缩略图必须齐全且等量，否则原图一张都不能删 */
const tierCounts = TIERS.map(t => [t, countFiles(path.join(DIST_IMG, t))])
const n0 = tierCounts[0][1]
const bad = tierCounts.find(([, n]) => n === 0 || n !== n0)
if (bad) {
  console.error(`[prune] 缩略图档数异常：${tierCounts.map(([t, n]) => `${t}=${n}`).join(' ')} —— 判定为未生成全。`)
  console.error('[prune] 原图一个都没删。先跑 npm run thumbs 再 npm run build。')
  process.exit(1)
}

let bytes = 0, removed = 0
const dirBytes = (d) => {
  let s = 0
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const q = path.join(d, e.name)
    s += e.isDirectory() ? dirBytes(q) : fs.statSync(q).size
  }
  return s
}
const rm = (p, isDir) => {
  bytes += isDir ? dirBytes(p) : fs.statSync(p).size
  fs.rmSync(p, { recursive: isDir, force: true })
  removed++
}

for (const d of ORIG_DIRS) {
  const p = path.join(DIST_IMG, d)
  if (fs.existsSync(p) && fs.statSync(p).isDirectory()) rm(p, true)
}
/* 根层散落的 dish-*.webp（早期 22 道菜的原始尺寸图） */
for (const f of fs.readdirSync(DIST_IMG)) {
  const p = path.join(DIST_IMG, f)
  if (fs.statSync(p).isFile() && /^dish-.*\.webp$/i.test(f)) rm(p, false)
}

console.log(`[prune] 缩略图两档各 ${n0} 张齐备 → 剔除 ${removed} 项原图，释放 ${(bytes / 1048576).toFixed(2)}MB`)
console.log(`[prune] dist/dish-images 现存：${fs.readdirSync(DIST_IMG).join(', ')}`)
