// ============================================================
// 缩略图管线 —— 把 public/dish-images 下的原图压成两档 WebP，
// 供 src/lib/categoryIcons.js 的 getDishImage(dish, size) 按档取用。
//
// 用法：node scripts/build_thumbs.mjs
// 依赖：sharp（devDependencies，只在建图期使用，不进前端 bundle）
//
// ------------------------------------------------------------
// 【命名规则 · 唯一真源】改这里必须同步改 getDishImage()，两边逐字一致
//   <相对路径> = 源文件相对 public/dish-images 的路径，**保留原扩展名**，末尾追加 .webp
//     htc/502.jpg    → thumb/htc/502.jpg.webp
//     real/10.webp   → thumb/real/10.webp.webp    ← 双后缀是设计如此，不是 bug
//     dish-5.webp    → thumb/dish-5.webp.webp
//   为什么不删原扩展名：同一目录下 a.jpg 与 a.png 会被压成同名，追加 .webp
//   保留原扩展名可保证「一源文件 ↔ 一缩略图」不会互相覆盖。
// ------------------------------------------------------------
//
// 两档规格：
//   thumb  宽 160（withoutEnlargement）quality 68 —— 列表行 / 70px 格子 / 小圆盘
//   w800   宽 ≤800（withoutEnlargement）quality 72 —— 详情页主视觉等大展示
//
// 幂等：输出目录本身被排除在扫描之外；单个文件「输出比输入新」即跳过，可反复运行。
// ============================================================
import { readdir, mkdir, stat, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const SRC_DIR = path.join(ROOT, 'public', 'dish-images')
const EXT_RE = /\.(jpe?g|png|webp)$/i
const SIZES = ['thumb', 'w800']

const PRESETS = {
  thumb: { width: 160, quality: 68 },
  w800: { width: 800, quality: 72 },
}

/** 递归收集源图，跳过输出目录（thumb/ w800/），保证幂等与「输出不是输入」 */
async function collectSources(dir, base = '') {
  const out = []
  const entries = await readdir(dir, { withFileTypes: true })
  for (const ent of entries) {
    const rel = base ? `${base}/${ent.name}` : ent.name
    if (ent.isDirectory()) {
      if (SIZES.includes(ent.name) && base === '') continue // 顶层输出目录：不扫
      out.push(...(await collectSources(path.join(dir, ent.name), rel)))
    } else if (EXT_RE.test(ent.name)) {
      out.push(rel)
    }
  }
  return out.sort()
}

async function dirBytes(dir) {
  if (!existsSync(dir)) return 0
  let total = 0
  for (const ent of await readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name)
    total += ent.isDirectory() ? await dirBytes(p) : (await stat(p)).size
  }
  return total
}

const mb = (n) => `${(n / 1024 / 1024).toFixed(2)}MB`

async function main() {
  if (!existsSync(SRC_DIR)) {
    console.error(`[build-thumbs] 源目录不存在：${SRC_DIR}`)
    process.exitCode = 1
    return
  }

  const sources = await collectSources(SRC_DIR)
  console.log(`[build-thumbs] 扫描到源图 ${sources.length} 张（已排除 ${SIZES.join('/')} 输出目录）`)

  const stats = {}
  for (const size of SIZES) {
    const { width, quality } = PRESETS[size]
    const outDir = path.join(SRC_DIR, size)
    let generated = 0
    let skipped = 0
    let failed = 0
    for (const rel of sources) {
      const srcFile = path.join(SRC_DIR, rel)
      // 命名规则见文件头「唯一真源」注释：<相对路径>.webp（保留原扩展名）
      const outFile = path.join(outDir, `${rel}.webp`)
      try {
        const [s, d] = await Promise.all([stat(srcFile), stat(outFile).catch(() => null)])
        if (d && d.mtimeMs >= s.mtimeMs) { skipped += 1; continue } // 增量：输出不比源旧
        await mkdir(path.dirname(outFile), { recursive: true })
        const buf = await sharp(srcFile)
          .resize({ width, withoutEnlargement: true })
          .webp({ quality })
          .toBuffer()
        await writeFile(outFile, buf)
        generated += 1
      } catch (err) {
        failed += 1
        console.error(`[build-thumbs] 跳过坏图 ${rel}：${err.message}`)
      }
    }
    stats[size] = { generated, skipped, failed, bytes: await dirBytes(outDir) }
  }

  for (const size of SIZES) {
    const { generated, skipped, failed, bytes } = stats[size]
    console.log(
      `[build-thumbs] ${size.padEnd(5)} 生成 ${generated} · 跳过 ${skipped}${failed ? ` · 失败 ${failed}` : ''}` +
      ` · 目录合计 ${mb(bytes)}（${(bytes / 1024).toFixed(0)}KB）`
    )
  }

  const srcBytes = await dirBytes(SRC_DIR)
  const thumbBytes = stats.thumb.bytes
  const w800Bytes = stats.w800.bytes
  console.log(
    `[build-thumbs] public/dish-images 总体积 ${mb(srcBytes)}` +
    `（源图 ${mb(srcBytes - thumbBytes - w800Bytes)} + thumb ${mb(thumbBytes)} + w800 ${mb(w800Bytes)}）`
  )
}

main()
