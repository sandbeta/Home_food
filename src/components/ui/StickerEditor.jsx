import { motion } from 'framer-motion'
import Icon from './Icons'

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
 * ============================================================ */

const BGS = [
  { key: 'rose',    name: '樱粉', css: 'linear-gradient(180deg, var(--sticker-rose-a), var(--sticker-rose-b))' },
  { key: 'sage',    name: '薄荷', css: 'linear-gradient(180deg, var(--sticker-sage-a), var(--sticker-sage-b))' },
  { key: 'apricot', name: '暖杏', css: 'linear-gradient(180deg, var(--sticker-apricot-a), var(--sticker-apricot-b))' },
  { key: 'sky',     name: '云蓝', css: 'linear-gradient(180deg, var(--sticker-sky-a), var(--sticker-sky-b))' },
]
const PINS = ['📌', '⭐', '💕', '🌙', '✨', '🍑']

export function bgCss(key) {
  const b = BGS.find(x => x.key === key)
  return b ? b.css : BGS[0].css
}

export default function StickerEditor({ value, onChange, collapsedLabel = '贴张便签' }) {
  const open = !!value
  const v = value || { bg: 'rose', pin: '💕', msg: '' }

  const set = (patch) => {
    const next = { ...v, ...patch }
    // 全空视为清空
    if (!next.msg && !patch.msg && patch.bg === undefined && patch.pin === undefined) onChange(null)
    else onChange(next)
  }

  return (
    <div>
      {!open && (
        <motion.button
          type="button"
          whileTap={{ scale: 0.97 }}
          onClick={() => onChange({ bg: 'rose', pin: '💕', msg: '' })}
          className="flex items-center gap-1.5 text-xs font-bold text-[var(--color-clay-text)] min-h-[44px] px-2 -mx-2 rounded-full"
          aria-label="贴一张便签留言"
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
            boxShadow: '0 4px 14px rgba(43,36,41,0.10), inset 0 1px 0 rgba(255,255,255,0.5)',
            color: '#2B2429',
          }}
        >
          {/* 图钉（顶部居中，微微投出阴影） */}
          <span
            className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-2xl select-none"
            style={{ filter: 'drop-shadow(0 2px 2px rgba(43,36,41,0.28))' }}
            aria-hidden="true"
          >{v.pin}</span>

          {/* 关闭（收起） */}
          <button
            type="button"
            onClick={() => onChange(null)}
            aria-label="收起便签"
            className="absolute top-1 right-1 w-8 h-8 rounded-full text-[13px] font-bold opacity-60 hover:opacity-100"
            style={{ color: 'inherit' }}
          >×</button>

          <label htmlFor="sticker-msg" className="sr-only">便签内容</label>
          <textarea
            id="sticker-msg"
            value={v.msg}
            maxLength={60}
            onChange={(e) => set({ msg: e.target.value })}
            placeholder="写给他的悄悄话…（不用给厨房看的那种）"
            className="w-full bg-transparent resize-none outline-none text-[15px] leading-relaxed placeholder:opacity-45"
            style={{ minHeight: 60, fontStyle: 'italic', fontFamily: '"Ma Shan Zheng", "KaiTi", "STKaiti", cursive, serif' }}
          />
          <div className="flex items-center justify-between mt-1.5 text-[10px] opacity-60">
            <span>{v.msg.length}/60</span>
            <span>他会在订单详情看到这张纸</span>
          </div>

          {/* 底色与图钉选择器 */}
          <div className="flex items-center gap-1.5 mt-2 pt-2" style={{ borderTop: '1px dashed rgba(43,36,41,0.16)' }}>
            {BGS.map(b => (
              <button
                key={b.key}
                type="button"
                onClick={() => set({ bg: b.key })}
                aria-label={`底色 ${b.name}`}
                aria-pressed={v.bg === b.key}
                className="w-6 h-6 rounded-full border-2 transition-transform"
                style={{
                  background: b.css,
                  borderColor: v.bg === b.key ? '#2B2429' : 'rgba(43,36,41,0.16)',
                  transform: v.bg === b.key ? 'scale(1.12)' : 'none',
                }}
              />
            ))}
            <span className="mx-1 opacity-30">·</span>
            {PINS.map(p => (
              <button
                key={p}
                type="button"
                onClick={() => set({ pin: p })}
                aria-label={`图钉 ${p}`}
                aria-pressed={v.pin === p}
                className="w-7 h-7 rounded-full text-base leading-none"
                style={{
                  background: v.pin === p ? 'rgba(43,36,41,0.10)' : 'transparent',
                  outline: v.pin === p ? '1.5px solid #2B2429' : 'none',
                }}
              >{p}</button>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  )
}
