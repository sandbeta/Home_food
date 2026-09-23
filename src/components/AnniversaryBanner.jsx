import { motion } from 'framer-motion'
import { cardEntrance } from '../theme/motion'

/* ============================================================
 * 批 1 新增 · 纪念日命中横幅
 * ------------------------------------------------------------
 * 语义：命中今日时，Home 顶栏（PageHeader 下、娃娃机上）出现一条渐变横幅，
 *   展示「第 N 个今天 · 纪念日名 · 回忆里那道菜」；未绑定 dish 时仅显文案。
 * 视觉：clay 渐变实底 + on-dark 亮字 + 一枚 🎉 图钉（负 margin 挂上沿），
 *   与「娃娃机世界件」的糖果语言一致（不新增色值，全 var 令牌）。
 * ============================================================ */
export default function AnniversaryBanner({ hit, dishName, onOpenDish }) {
  if (!hit) return null
  const yearLabel = hit.years <= 0 ? '第一年' : `第 ${hit.years + 1} 年`
  return (
    <motion.div
      {...cardEntrance(0.02)}
      className="relative mt-1 mb-3 px-4 py-3 flex items-center gap-3"
      style={{
        background: 'var(--anchor-ink)',
        borderRadius: 'var(--radius-card)',
        border: '2px solid var(--clay-deep)',
        color: 'var(--color-on-dark)',
        boxShadow: 'var(--shadow-3)',
      }}
    >
      <span aria-hidden="true"
        className="absolute -top-3 -left-1 text-2xl"
        style={{ filter: 'drop-shadow(0 2px 3px rgba(43,36,41,0.28))', transform: 'rotate(-12deg)' }}>🎉</span>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-bold" style={{ letterSpacing: '0.14em', opacity: 0.88 }}>{yearLabel} · {hit.name}</p>
        {dishName && (
          <button
            type="button"
            onClick={onOpenDish}
            className="text-sm font-bold mt-0.5 text-left underline-offset-2 hover:underline min-h-[44px]"
            style={{ color: 'var(--color-on-dark)' }}
            aria-label={`打开回忆里那道菜：${dishName}`}
          >
            回忆里那道菜 · {dishName} →
          </button>
        )}
      </div>
    </motion.div>
  )
}
