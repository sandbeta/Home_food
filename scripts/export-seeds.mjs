// 一次性导出种子菜品数据 → server/data/seed-dishes.json
// 在 stub 环境加载真实 mockApi，按前端同款逻辑（含 REAL_IMAGE_OVERRIDES 覆盖与 AI 清退）
// 导出全量 432 道菜品，供家庭服务端首启导入。重跑即重置。
globalThis.localStorage = { getItem: () => null, setItem: () => {} }
globalThis.location = { origin: 'http://localhost:8787' }
globalThis.window = globalThis

const m = await import('../src/lib/mockApi.js')
m.installMockApi()
const res = await window.fetch('/api/dishes/all')
const dishes = await res.json()

import fs from 'fs'
fs.mkdirSync('server/data', { recursive: true })
fs.writeFileSync('server/data/seed-dishes.json', JSON.stringify(dishes, null, 0), 'utf8')
console.log(`导出 ${dishes.length} 道菜品 → server/data/seed-dishes.json`)
const withImg = dishes.filter(d => d.image_url).length
console.log(`带图 ${withImg}，emoji 占位 ${dishes.length - withImg}`)

// 菜谱（前端 seedRecipes.js 是运行时懒加载；服务端启动加载一份等价 JSON，
// 在 GET /api/dishes/:id 响应里复刻 mockApi 的 recipe 注入语义）
const recipes = (await import('../src/lib/seedRecipes.js')).default
fs.writeFileSync('server/data/seed-recipes.json', JSON.stringify(recipes, null, 0), 'utf8')
console.log(`导出菜谱 ${Object.keys(recipes).length} 份 → server/data/seed-recipes.json`)
