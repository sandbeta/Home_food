import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'

/**
 * 全站统一页头。
 *
 * 相比旧 Header 的改进：
 * 1. 支持 back —— 消灭此前 AdminDishes / AdminOrders / Checkout 三处「无返回入口」的断头路
 * 2. 内边距对齐 --space-page-x（旧 Header 是 px-5，与页面 px-4 差 4px）
 * 3. 标题用 display 字阶 + serif，副标题用 text-sm
 *
 * 注意：本组件的 sticky 依赖「页面包裹层不带 transform」，见 motion.js 的 pageEnter 说明。
 */
export default function PageHeader({ title, subtitle, back = false, backTo, right }) {
  const navigate = useNavigate()
  const goBack = () => (backTo ? navigate(backTo) : navigate(-1))

  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 22 }}
      className="sticky top-0 z-40"
      style={{
        background:
          'linear-gradient(180deg, var(--scrim-top) 0%, rgba(0,0,0,0) 100%)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
      }}
    >
      <div
        className="flex items-center justify-between gap-3 pt-12 pb-5"
        style={{
          paddingLeft: 'var(--space-page-x)',
          paddingRight: 'var(--space-page-x)',
        }}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {back && (
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={goBack}
              aria-label="返回"
              className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
              style={{
                background: 'var(--color-glass)',
                border: '1px solid var(--color-glass-border)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                boxShadow: 'var(--shadow-1)',
              }}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--color-bone)"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </motion.button>
          )}

          <div className="min-w-0">
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 52, opacity: 1 }}
              transition={{ delay: 0.12, type: 'spring', stiffness: 300, damping: 24 }}
              className="h-[3px] rounded-full mb-2 bg-gradient-to-r from-[var(--color-clay-soft)] to-[var(--color-clay)]"
              style={{ boxShadow: '0 0 8px rgba(200,104,63,0.35), 0 0 16px rgba(200,104,63,0.12)' }}
            />
            <h1 className="font-serif text-display font-bold text-[var(--color-bone)] truncate">
              {title}
            </h1>
            {subtitle && (
              <div className="flex items-center gap-1.5 mt-1">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--color-clay)] shrink-0" />
                <p className="text-sm text-[var(--color-ash)] font-semibold truncate">{subtitle}</p>
              </div>
            )}
          </div>
        </div>

        {right && <div className="shrink-0">{right}</div>}
      </div>
    </motion.div>
  )
}
