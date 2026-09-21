import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import LazySheep from './ui/LazySheep'
import { useTheme } from '../theme/useTheme'

/**
 * 全站统一页头 —— 编辑杂志版式。
 *
 * 2026-09 换装「编辑杂志质感」：
 * 1. 装饰性彩条换成一条贯通发丝线（杂志栏目分隔），不再用发光渐变条
 * 2. 新增 eyebrow 眉题槽：页头副标题以全大写宽字距小字呈现（杂志 kicker），
 *    原 subtitle 槽保留向下兼容
 * 3. 标题字阶吃 --text-display（已调大收紧），衬线大标题是版面的主角
 *
 * 注意：本组件的 sticky 依赖「页面包裹层不带 transform」，见 motion.js 的 pageEnter 说明。
 */
export default function PageHeader({ title, eyebrow, subtitle, back = false, backTo, right, onBack }) {
  const navigate = useNavigate()
  const goBack = () => (backTo ? navigate(backTo) : navigate(-1))
  // 懒羊羊驻颜：晨光模式它犯困（doze），夜宵时段它闻香睁眼（sniff）——深夜食堂开张
  const { isNight } = useTheme()

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
      className="sticky top-0 z-40"
      style={{
        background:
          'linear-gradient(180deg, var(--scrim-top) 0%, rgba(0,0,0,0) 100%)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
      }}
    >
      <div
        className="flex items-center justify-between gap-3 pt-12 pb-4"
        style={{
          paddingLeft: 'var(--space-page-x)',
          paddingRight: 'var(--space-page-x)',
        }}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {/* 懒羊羊身份徽记：TA 的头像坐在页头，双人格里的"TA"如今有了正脸 */}
          <div
            className="shrink-0 w-11 h-11 rounded-full flex items-center justify-center text-[var(--color-sage)]"
            style={{
              background: 'color-mix(in srgb, var(--sage-40) 16%, var(--color-glass))',
              border: '1px solid color-mix(in srgb, var(--sage-40) 40%, transparent)',
            }}
          >
            <LazySheep size={38} mood={isNight ? 'sniff' : 'doze'} />
          </div>
          {back && (
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={onBack || goBack}
              aria-label="返回"
              className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
              style={{
                background: 'var(--color-glass)',
                border: '1px solid var(--color-glass-border)',
                boxShadow: 'var(--shadow-1)',
              }}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--color-bone)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </motion.button>
          )}

          <div className="min-w-0">
            {(eyebrow || subtitle) && (
              <p
                className="text-[11px] font-bold uppercase mb-1 truncate"
                style={{
                  letterSpacing: '0.18em',
                  color: 'var(--color-ash)',
                }}
              >
                {eyebrow || subtitle}
              </p>
            )}
            <h1 className="font-serif text-display font-bold text-[var(--color-bone)] truncate">
              {title}
            </h1>
          </div>
        </div>

        {right && <div className="shrink-0">{right}</div>}
      </div>
      {/* 贯通发丝线：杂志栏目的分隔语言，取代旧版发光彩条 */}
      <div style={{ borderTop: '1px solid var(--color-glass-border)', margin: '0 var(--space-page-x)' }} />
    </motion.div>
  )
}
