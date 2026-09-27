import { useState } from 'react'
import { motion } from 'framer-motion'
import { starCells, starCopy, summarizeDish, summaryCopy, SIGNATURE_BADGE, RATING_RULES } from '../lib/dishRating'
import { requestJson } from '../lib/request'
import { settle, vibrate } from '../lib/sfx'
import { useCart } from './CartContext'

/* ============================================================
 * 批 9 新增 · 星级评分器（一餐吃完在订单详情里逐道打分）
 * ------------------------------------------------------------
 * 状态口径全部走 src/lib/dishRating 纯函数，组件只管"点几颗星 / 写半句 / 提交"。
 * 令牌纪律（DESIGN.md 铁律，day/night 两态都自查过）：
 *   · 文字只吃 --color-bone / --color-ash / --color-caramel（三者都会随夜宵反相）；
 *   · 「拿手菜」章用不反相实底 --color-caramel-deep + --color-on-dark 亮字
 *     （caramel-deep 不做文字色、bone/caramel 不做底，双向都不许）；
 *   · 提交按钮沿用全站 d3-btn 体系（.d3-btn-primary 底=clay 人格色，两态恒定）；
 *   · 卡片底由父级 GlassCard/d3-card-face 提供，本组件不自铺底色，故无夜宵反相缺口。
 * ============================================================ */

function StarGlyph({ state }) {
  const fill = state === 'full' ? '100%' : state === 'half' ? '50%' : '0%'
  return (
    <span className="relative inline-block leading-none" style={{ fontSize: '22px' }}>
      <span aria-hidden style={{ color: 'var(--color-mist)' }}>☆</span>
      <span
        aria-hidden
        className="absolute top-0 left-0 overflow-hidden whitespace-nowrap"
        style={{ color: 'var(--color-caramel)', width: fill }}
      >★</span>
    </span>
  )
}

export default function RatingPicker({ dish, ratings = [], orderId = null, onSaved }) {
  const { whoAmI } = useCart()
  const [stars, setStars] = useState(null)
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [saved, setSaved] = useState(null)

  const sum = summarizeDish(ratings)
  const cells = starCells(stars)

  const save = async () => {
    if (!stars || busy) return
    setBusy(true); setErr('')
    try {
      const res = await requestJson('/api/ratings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dish_id: dish.id, stars, note: note.trim(), by: whoAmI, order_id: orderId }),
      })
      const rec = await res.json()
      setSaved(rec)
      setStars(null); setNote('')
      settle(); vibrate(20)
      onSaved?.(rec)
    } catch {
      setErr('这口没记上，再点一次')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex items-center gap-x-3 gap-y-1 flex-wrap">
      {/* 第一行：菜名 + 拿手菜章（左，可截断）· 五颗星 + ½ 开关（右，不缩） */}
      <div className="min-w-0 flex-1 flex items-center gap-1.5 flex-wrap">
        <span className="text-sm font-bold text-[var(--color-bone)] truncate">{dish.name}</span>
        {sum.isSignature && (
          <span
            className="badge-soft shrink-0 px-1.5 py-0.5 rounded-full text-[10px] font-bold"
            style={{ background: 'var(--color-caramel-deep)', color: 'var(--color-on-dark)' }}
            title={SIGNATURE_BADGE.tip}
          >
            ⭐ {SIGNATURE_BADGE.label}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {/* 五颗星 = 5 个 44×44 热区；半分单独一个开关（拆 10 个半格热区会低于 44px 铁律） */}
        <div className="flex items-center" role="group" aria-label={`给「${dish.name}」打分`}>
          {cells.map((state, i) => (
            <button
              key={i}
              type="button"
              onClick={() => { setStars(i + 1); setErr(''); vibrate(8) }}
              aria-label={`打 ${i + 1} 星${starCopy(i + 1) ? `：${starCopy(i + 1)}` : ''}`}
              aria-pressed={stars === i + 1}
              className="w-11 h-11 -ml-1.5 first:ml-0 rounded-full flex items-center justify-center transition-colors"
              style={{ background: state === 'empty' ? 'transparent' : 'color-mix(in srgb, var(--color-caramel) 10%, transparent)' }}
            >
              <StarGlyph state={state} />
            </button>
          ))}
        </div>
        {stars != null && (
          <button
            type="button"
            onClick={() => setStars(Number.isInteger(stars)
              ? Math.max(RATING_RULES.min, stars - RATING_RULES.halfStep)
              : Math.min(RATING_RULES.max, stars + RATING_RULES.halfStep))}
            aria-label="加半分或减半分"
            aria-pressed={!Number.isInteger(stars)}
            className="h-11 px-2 rounded-full text-xs font-bold"
            style={{ border: '2px solid var(--color-line)', color: 'var(--color-clay-text)' }}
          >
            ½ 半分
          </button>
        )}
      </div>

      {/* 第二行：聚合说明 + 刚记下的分数，整行宽。
          以前这两句挤在菜名下面（左列），选中星级后 ½ 按钮一出现就把左列压到 ~184px，
          "完成 6 次" 被劈成 "完/成" 折三行；实测两态都有，故把文案挪成独立整行。 */}
      <div className="w-full flex items-center gap-2 flex-wrap -mt-0.5">
        <p className="text-[11px] text-[var(--color-ash)]">{summaryCopy(sum)}</p>
        {saved && (
          <p className="text-[11px]" style={{ color: 'var(--color-caramel)' }}>
            已记下 {saved.stars} 星{starCopy(saved.stars) ? ` · ${starCopy(saved.stars)}` : ''}
          </p>
        )}
      </div>

      <div className="w-full flex items-center gap-2 flex-wrap">
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={40}
          placeholder="半句评语（可空）"
          aria-label={`「${dish.name}」的评语`}
          className="d3-input flex-1 min-w-[140px] px-3 py-2 text-sm rounded-[var(--radius-ctl)]"
        />
        <motion.button
          whileTap={{ scale: 0.96 }}
          type="button"
          onClick={save}
          disabled={!stars || busy}
          className="d3-btn d3-btn-primary px-4 h-11 text-sm font-bold rounded-[var(--radius-btn)] disabled:opacity-50"
        >
          {busy ? '记下中…' : '记下这口'}
        </motion.button>
        {stars != null && !busy && (
          <span className="text-[11px]" style={{ color: 'var(--color-caramel)' }}>{starCopy(stars)}</span>
        )}
        {err && <span className="text-[11px] text-[var(--color-danger)]">{err}</span>}
      </div>
    </div>
  )
}
