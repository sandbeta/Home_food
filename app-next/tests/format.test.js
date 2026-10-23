import test from 'node:test'
import assert from 'node:assert/strict'
import { money, statusIndex, splitOrder, countThisWeek, normalizeStatus, orderItemsText } from '../src/lib/format.js'

test('金额格式：整数不带小数，非整数保留两位并去掉末尾 0', () => {
  assert.equal(money(24), '¥24')
  assert.equal(money(24.5), '¥24.5')
  assert.equal(money('abc'), '¥0')
})

test('状态索引与别名', () => {
  assert.equal(statusIndex('pending'), 0)
  assert.equal(statusIndex('preparing'), 2)
  assert.equal(statusIndex('completed'), 4)
  assert.equal(normalizeStatus('preparing'), 'cooking')
})

test('AA 分账与整单请客', () => {
  const order = {
    total_price: 60,
    payer: 'aa',
    items: [
      { dish_id: 1, price: 20, quantity: 2, added_by: 'me' },
      { dish_id: 2, price: 20, quantity: 1, added_by: 'partner' },
    ],
  }
  assert.deepEqual(splitOrder(order), { me: 40, partner: 20 })
  assert.deepEqual(splitOrder({ ...order, payer: 'me' }), { me: 60, partner: 0 })
  assert.deepEqual(splitOrder({ ...order, payer: 'partner' }), { me: 0, partner: 60 })
})

test('本周计数只算这一周', () => {
  const now = new Date('2026-10-23T12:00:00')
  const orders = [
    { created_at: '2026-10-19T12:00:00' },
    { created_at: '2026-10-23T12:00:00' },
    { created_at: '2026-10-11T12:00:00' },
  ]
  assert.equal(countThisWeek(orders, now), 2)
})

test('订单摘要最多显示指定道数', () => {
  const o = { items: [{ dish_name: 'A' }, { dish_name: 'B' }, { dish_name: 'C' }, { dish_name: 'D' }] }
  assert.equal(orderItemsText(o, 2), 'A、B 等 4 道')
})
