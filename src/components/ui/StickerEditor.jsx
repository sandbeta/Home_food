import { motion } from 'framer-motion'
import Icon from './Icons'
import { STICKER } from '../../lib/sweetCopy'

/* ============================================================
 * 批 1 新增 · 便签留言条编辑器（贴在购物车与订单详情之间）
 * ------------------------------------------------------------
 * 数据形状（存进 order.sticker）：{ bg, pin, msg }
 *   bg  = 底色 key：'rose' | 'sage' | 'apricot' | 'sky'
 *   pin = 图钉 emoji：📌/⭐/💕/🌙/✨/🍑
 *   msg = 手写体留言（≤60 字）
 * 视觉：一张微微倾斜的便签纸，顶部图钉；底色四选一 + 图钉六选 + 一句留言。
 * 语义：现有 note 字段（少盐、不要香菜）是"给厨房的操作指令"，sticker 是"给他的小纸条"——
 *   两者互补、不冲突。note 走 textarea，sticker 走这张纸。
 *
 * 批4 修：①墨色/阴影/发丝线收进 --sticker-ink* 令牌（原与 OrderDetail 各写一份字面量）；
 *   ②底色点 24px/图钉 28px/收起叉 32px 热区全部撑到 ≥44（外层按钮 44、视觉尺寸不变）；
 *   ③把留言删干净 ≠ 作废整张便签（原会连底色图钉一起清空并折叠，现只有点 × 才收起）；
 *   ④文案入 sweetCopy；⑤图钉 aria-label 用中文名不带 emoji（读屏不念"闪光"emoji 名）。
 * ============================================================ */

const BGS = [
  { key: 'rose',    name: '樱粉', css: 'linear-gradient(180deg, var(--sticker-rose-a), var(--sticker-rose-b))' },
  { key: 'sage',    name: '薄荷', css: 'linear-gradient(180deg, var(--sticker-sage-a), var(--sticker-sage-b))' },
  { key: 'apricot', name: '暖杏', css: 'linear-gradient(180deg, var(--sticker-apricot-a), var(--sticker-apricot-b))' },
  { key: 'sky',     name: '云蓝', css: 'linear-gradient(180deg, var(--sticker-sky-a), var(--sticker-sky-b))' },
]
const PINS = [
  { g: '📌', n: '图钉' }, { g: '⭐', n: '星星' }, { g: '💕', n: '双心' },
  { g: '🌙', n: '月亮' }, { g: '✨', n: '闪光' }, { g: '🍑', n: '桃子' },
]

export function bgCss(key) {
  const b = BGS.find(x => x.key === key)
  return b ? b.css : BGS[0].css
}

export default function StickerEditor({ value, onChange, collapsedLabel = STICKER.addShort }) {
  const open = !!value
  const v = value || { bg: 'rose', pin: '💕', msg: '' }

  /* 只有显式收起（× / 取消入口）才把 value 置 null；改字/删空一律保留便签本体 */
  const set = (patch) => onChange({ ...v, ...patch })

  return (
    <div>
      {!open && (
        <motion.button
          type="button"
          whileTap={{ scale: 0.97 }}
          onClick={() => onChange({ bg: 'rose', pin: '💕', msg: '' })}
          className="flex items-center gap-1.5 text-xs font-bold text-[var(--color-clay-text)] min-h-[44px] px-2 -mx-2 rounded-full"
          aria-label={STICKER.add}
        >
          <Icon name="heart" size={14} strokeWidth={2.2} /> {collapsedLabel}
        </motion.button>
      )}
      {open && (
        <motion.div
          initial={{ opacity: 0, rotate: -6, scale: 0.92 }}
          animate={{ opacity: 1, rotate: 0, scale: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          className="relative p-3 pb-3.5 pl-4"
          style={{
            background: bgCss(v.bg),
            borderRadius: 4,
            boxShadow: 'var(--sticker-shadow)',
            color: 'var(--sticker-ink)',
          }}
        >
          {/* 图钉（顶部居中，微微投出阴影） */}
          <span
            className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-2xl select-none"
            style={{ filter: 'drop-shadow(var(--sticker-pin-shadow))' }}
            aria-hidden="true"
          >{v.pin}</span>

          {/* 关闭（收起）：视觉小叉 + 44px 命中框 */}
          <button
            type="button"
            onClick={() => onChange(null)}
            aria-label={STICKER.collapse}
            className="absolute top-0 right-0 w-11 h-11 grid place-items-center rounded-full"
            style={{ color: 'inherit' }}
          ><span className="text-[13px] font-bold opacity-60 hover:opacity-100" aria-hidden>×</span></button>

          <label htmlFor="sticker-msg" className="sr-only">{STICKER.content}</label>
          <textarea
            id="sticker-msg"
            value={v.msg}
            maxLength={60}
            onChange={(e) => set({ msg: e.target.value })}
            placeholder={STICKER.placeholder}
            className="w-full bg-transparent resize-none outline-none text-[15px] leading-relaxed placeholder:opacity-45"
            style={{ minHeight: 60, fontStyle: 'italic', fontFamily: '"KaiTi", "STKaiti", cursive, serif' }}
          />
          <div className="flex items-center justify-between mt-1.5 text-[10px] opacity-80">
            <span className="tabular-nums">{v.msg.length}/60</span>
            <span>{STICKER.hint}</span>
          </div>

          {/* 底色与图钉选择器：外层钮 44×44，视觉点尺寸不变 */}
          <div className="flex items-center gap-0.5 mt-2 pt-2" style={{ borderTop: '1px dashed var(--sticker-ink-hair)' }}>
            {BGS.map(b => (
              <button
                key={b.key}
                type="button"
                onClick={() => set({ bg: b.key })}
                aria-label={`底色 ${b.name}`}
                aria-pressed={v.bg === b.key}
                className="w-11 h-11 grid place-items-center rounded-full"
              >
                <span
                  className="w-6 h-6 rounded-full border-2 transition-transform block"
                  style={{
                    background: b.css,
                    borderColor: v.bg === b.key ? 'var(--sticker-ink)' : 'var(--sticker-ink-hair)',
                    transform: v.bg === b.key ? 'scale(1.12)' : 'none',
                  }}
                />
              </button>
            ))}
            <span className="mx-0.5 opacity-30" aria-hidden>·</span>
            {PINS.map(p => (
              <button
                key={p.g}
                type="button"
                onClick={() => set({ pin: p.g })}
                aria-label={`图钉：${p.n}`}
                aria-pressed={v.pin === p.g}
                className="w-11 h-11 rounded-full text-base leading-none"
                style={{
                  background: v.pin === p.g ? 'var(--sticker-ink-tint)' : 'transparent',
                  outline: v.pin === p.g ? '1.5px solid var(--sticker-ink)' : 'none',
                }}
              >{p.g}</button>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  )
}
