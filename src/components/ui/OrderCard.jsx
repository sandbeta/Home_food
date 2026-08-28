import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import KissIcon from '../KissIcon'

function formatTime(iso) {
  try {
    return new Date(iso).toLocaleString('zh-CN', {
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return ''
  }
}

/**
 * 订单卡 —— 取代此前 MyOrders 与 AdminOrders 两份**逐行雷同**的实现。
 *
 * variant:
 *  - 'user'  用户端：整卡可点，跳转订单详情，尾部显示下单人头像与箭头
 *  - 'admin' 后台：不可跳转，尾部显示状态推进按钮（action）
 *
 * status 形如 { bar, text, chipBg, chipColor }
 */
export default function OrderCard({ order, status, variant = 'user', action, className = '' }) {
  const itemNames = (order.items || []).map((i) => `${i.dish_name}×${i.quantity}`).join('、')
  const isAdmin = variant === 'admin'

  const body = (
    <div className="d3-card-face">
      {/* 顶部状态条 */}
      <div className="h-1" style={{ background: `linear-gradient(90deg, ${status.bar}88, ${status.bar}22)` }} />
      <div className="flex">
        <div className="w-1 shrink-0" style={{ background: status.bar }} />
        <div className="flex-1" style={{ padding: 'var(--space-card-p)' }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-[var(--color-ash)] flex items-center gap-1">
              <svg className="w-3 h-3 opacity-50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              {formatTime(order.created_at)}
            </span>
            <span
              className="text-xs px-2.5 py-0.5 rounded-full font-bold"
              style={{ background: status.chipBg, color: status.chipColor, boxShadow: 'var(--shadow-1)' }}
            >
              {status.text}
            </span>
          </div>

          <p className="text-sm text-[var(--color-bone)] line-clamp-1 font-medium">{itemNames}</p>

          <div className="flex items-center justify-between mt-2.5 pt-2.5 border-t border-[var(--color-glass-border)]">
            <div className="flex items-center gap-1.5">
              <KissIcon className="w-3.5 h-3.5 text-[var(--color-love)]" />
              <span className="text-base font-bold text-[var(--color-clay)] tabular-nums">
                {order.total_price}
              </span>
            </div>

            {isAdmin ? (
              action
            ) : (
              (order.items || []).length > 0 && (
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-1.5">
                    {(order.items || []).slice(0, 3).map((it, idx) => (
                      <div
                        key={idx}
                        className={`w-6 h-6 rounded-full border-2 border-[var(--color-ink-900)] flex items-center justify-center text-[9px] ${
                          it.added_by === 'me' ? 'avatar-me' : 'avatar-partner'
                        }`}
                      >
                        {it.added_by === 'me' ? '🐱' : '🐰'}
                      </div>
                    ))}
                  </div>
                  <svg className="w-3.5 h-3.5 text-[var(--color-ash)] opacity-40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  )

  const shell = (
    <motion.div
      whileTap={{ scale: 0.98 }}
      whileHover={isAdmin ? undefined : { y: -1 }}
      className={`d3-card overflow-hidden transition-shadow duration-200 ${className}`}
    >
      {body}
    </motion.div>
  )

  if (isAdmin) return shell

  return (
    <Link to={`/orders/${order.id}`} className="block">
      {shell}
    </Link>
  )
}
