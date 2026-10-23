import test from 'node:test'
import assert from 'node:assert/strict'
import { scoreDishes, pickPool, moodBiasFor, weightedShuffle, mulberry32, computeEatSignals } from '../src/lib/pick.js'

const dishes = [
  { id: 1, name: '番茄牛腩煲', category: '硬菜', description: '炖得软烂', available: 1 },
  { id: 2, name: '凉拌黄瓜', category: '素菜', description: '快手凉菜', available: 1 },
  { id: 3, name: '辣子鸡', category: '川菜', description: '香辣过瘾', available: 1 },
  { id: 4, name: '下架菜', category: '家常菜', description: '', available: 0 },
  { id: 5, name: '草莓蛋糕', category: '小吃', description: '甜甜的', available: 1 },
]

test('scoreDishes 排除下架菜', () => {
  const scored = scoreDishes(dishes, {})
  assert.equal(scored.length, 4)
  assert.ok(!scored.some((s) => s.dish.id === 4))
})

test('收藏 / 故事菜权重高于普通菜', () => {
  const scored = scoreDishes(dishes, { favoriteIds: [1], storyIds: [2] })
  const byId = Object.fromEntries(scored.map((s) => [s.dish.id, s.weight]))
  assert.ok(byId[1] > byId[3])
  assert.ok(byId[2] > byId[3])
})

test('心情倍率：想躺平时快手菜高于慢炖菜', () => {
  const quick = dishes.find((d) => d.id === 2)
  const slow = dishes.find((d) => d.id === 1)
  assert.ok(moodBiasFor(quick, 'tired') > moodBiasFor(slow, 'tired'))
  assert.equal(moodBiasFor(quick, ''), 1)
})

test('同一个日期种子给出同样的顺序', () => {
  const signals = { favoriteIds: [1], storyIds: [3], mood: 'spicy', dateKey: '2026-10-23', now: new Date('2026-10-23T12:00:00') }
  const a = pickPool({ dishes, signals }).map((x) => x.dish.id)
  const b = pickPool({ dishes, signals }).map((x) => x.dish.id)
  assert.deepEqual(a, b)
})

test('加权洗牌不会丢项', () => {
  const rng = mulberry32(42)
  const out = weightedShuffle([{ weight: 1 }, { weight: 5 }, { weight: 2 }, { weight: 1 }], rng)
  assert.equal(out.length, 4)
})

test('吃过的菜有记录，次数能累加', () => {
  const orders = [
    { created_at: '2026-10-22T12:00:00', items: [{ dish_id: 1, quantity: 2 }] },
    { created_at: '2026-10-23T12:00:00', items: [{ dish_id: 1, quantity: 1 }, { dish_id: 3, quantity: 1 }] },
  ]
  const sig = computeEatSignals(orders)
  assert.equal(sig.counts.get(1), 3)
  assert.equal(sig.counts.get(3), 1)
})
