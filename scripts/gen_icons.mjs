// 批5 PWA 图标光栅化：public/icons/icon.svg → 192/512 any + 512 maskable（logo 缩进安全区）。
// 依赖 sharp（devDependency，与 build_thumbs.mjs 共用）。用法：node scripts/gen_icons.mjs
import sharp from 'sharp'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const root = path.resolve(fileURLToPath(new URL('.', import.meta.url)), '..')
const SRC = path.join(root, 'public/icons/icon.svg')
const OUT = path.join(root, 'public/icons')

async function raster(size, out, { maskable = false } = {}) {
  const svg = await sharp(SRC, { density: 384 }).resize(size, size).png()
  if (!maskable) {
    await svg.toFile(out)
  } else {
    // maskable：系统会按中心安全区裁切，把 logo 缩到 80% 居中铺在主题底色上，留足边距
    const inner = Math.round(size * 0.8)
    const logo = await sharp(SRC, { density: 384 }).resize(inner, inner).png().toBuffer()
    await sharp({ create: { width: size, height: size, channels: 4, background: '#D8748A' } })
      .composite([{ input: logo, gravity: 'center' }])
      .png().toFile(out)
  }
  console.log('✓', path.relative(root, out))
}

await raster(192, path.join(OUT, 'icon-192.png'))
await raster(512, path.join(OUT, 'icon-512.png'))
await raster(512, path.join(OUT, 'icon-maskable-512.png'), { maskable: true })
