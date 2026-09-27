// 星级评分纯函数测试 —— node scripts/test_dishRating.mjs（无框架，沿用仓库既有方式）。
// 覆盖：归一半星、完成/超级好评口径、拿手菜盖章、按菜聚合、成就联动。
let failed = 0
const assert = (cond, msg) => {
  if (cond) console.log('✓', msg)
  else { console.error('✗', msg); failed++ }
}

const {
  RATING_RULES, SIGNATURE_BADGE, normalizeStars, isDone, isSuperLike,
  starCopy, starCells, summarizeDish, summarizeByDish, signatureDishIds, summaryCopy,
} = await import('../src/lib/dishRating.js')
const { computeAchievements, ACHIEVEMENTS } = await import('../src/lib/achievements.js')

const R = (dish_id, stars, created_at, extra = {}) => ({ id: dish_id, dish_id, stars, created_at, ...extra })

// 1) 归一：1–5、半格、脏值
{
  assert(normalizeStars(4) === 4 && normalizeStars(3.5) === 3.5, '整数与半星都原样保留')
  assert(normalizeStars(0) === 1 && normalizeStars(9) === 5, '越界钳到 1~5')
  assert(normalizeStars(4.3) === 4.5 && normalizeStars(4.1) === 4, '非半格值就近贴到半星档')
  assert(normalizeStars('4.5') === 4.5, '字符串数字也认')
  assert(normalizeStars(undefined) === null && normalizeStars('abc') === null && normalizeStars(NaN) === null, '脏值→null')
}

// 2) 完成 / 超级好评口径
{
  assert(isDone(R(1, 3)) && !isDone(R(1, 2.5)), '≥3 星算一次「完成」')
  assert(isSuperLike(R(1, 5)) && !isSuperLike(R(1, 4.5)), '=5 星算「超级好评」')
  assert(!isDone(R(1, null)), '脏记录不算完成')
}

// 3) 聚合 + 拿手菜
{
  const list = [R(7, 5, '2026-09-01T10:00:00.000Z'), R(7, 4, '2026-09-05T10:00:00.000Z'), R(7, 2, '2026-09-06T10:00:00.000Z')]
  const s = summarizeDish(list)
  assert(s.count === 3 && s.avg === 3.7, 'count/avg 计算正确')
  assert(s.doneCount === 2 && s.superCount === 1 && s.fiveCount === 1, '完成数与五星数分别统计')
  assert(!s.isSignature, '仅 1 颗五星不盖章')
  assert(s.lastStars === 2 && s.lastAt === '2026-09-06T10:00:00.000Z', '取到最后一次打分')
  const three = [R(7, 5, 'a'), R(7, 5, 'b'), R(7, 5, 'c')]
  assert(summarizeDish(three).isSignature, '同一道菜累计 3 次 5 星 → 拿手菜')
  assert(RATING_RULES.signatureStars === 3 && SIGNATURE_BADGE.label === '拿手菜', '规则常量与徽章文案单源')
  assert(summarizeDish([]).count === 0 && summarizeDish(undefined).count === 0, '空数据不炸')
}

// 4) 全表聚合 / 拿手菜清单 / 文案
{
  const ratings = [R(1, 5, '2026-08-01T00:00:00.000Z'), R(1, 5, '2026-08-02T00:00:00.000Z'), R(1, 5, '2026-08-03T00:00:00.000Z'), R(2, 4, '2026-08-04T00:00:00.000Z'), { dish_id: 'x', stars: 3 }]
  const by = summarizeByDish(ratings)
  assert(by.get(1).isSignature && !by.get(2).isSignature, '按 dish_id 分桶聚合')
  assert(signatureDishIds(ratings).join() === '1', 'signatureDishIds 只返回盖章的菜（脏记录忽略）')
  assert(starCopy(3.5) !== '' && starCopy(5) !== '' && starCopy(2.3) !== '', '每档都有文案')
  assert(starCells(3.5).join() === 'full,full,full,half,empty', '半星画成 half（UI 不再自己算）')
  assert(starCells(null).join() === 'empty,empty,empty,empty,empty', '未打分=五颗空')
  assert(summaryCopy(summarizeDish([])).includes('还没记'), '空数据给引导语')
  assert(summaryCopy(by.get(1)).includes('拿手菜'), '聚合文案带出拿手菜')
}

// 5) 成就联动：不传 ratings 时行为与接入前一致；传了才可能出「拿手菜」
{
  const orders = [{ id: 1001, status: 'completed', created_at: '2026-08-01T00:00:00.000Z', items: [{ dish_id: 1, dish_name: 'A', quantity: 1, price: 10, added_by: 'me' }] }]
  const before = computeAchievements(orders)
  assert(!before.signature && before.first.unlocked, '老调用方（不传 ratings）结果不变、无拿手菜')
  const withR = computeAchievements(orders, null, [R(1, 5, '2026-08-05T00:00:00.000Z'), R(1, 5, '2026-08-06T00:00:00.000Z'), R(1, 5, '2026-08-07T00:00:00.000Z')], new Map([[1, '番茄牛腩煲']]))
  assert(withR.signature.unlocked && withR.signature.dish_name === '番茄牛腩煲', '攒满 3 颗五星 → 成就解锁并带出菜名')
  assert(withR.signature.at === '2026-08-07T00:00:00.000Z', '达成时刻=第 3 颗五星落下那条')
  assert(JSON.stringify(before) === JSON.stringify(computeAchievements(orders, null, [])), '空 ratings 不改变任何徽章')
  assert(ACHIEVEMENTS.some(a => a.key === 'signature'), '徽章墙里有拿手菜这一枚')
  assert(computeAchievements([], null, [R(1, 5, 'x'), R(1, 5, 'y'), R(1, 5, 'z')]).signature.unlocked, '没订单也能只凭评分盖章')
}

console.log(failed === 0 ? '\n[dishRating] 全部通过' : `\n[dishRating] ${failed} 项失败`)
process.exit(failed === 0 ? 0 : 1)
