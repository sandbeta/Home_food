/**
 * 区块标题行 —— 取代 Home 内 4 份手写的「标题 + 右侧跳转」组合。
 */
export default function SectionHeader({ title, action, className = '' }) {
  return (
    <div className={`flex items-center justify-between gap-3 ${className}`}>
      <h2 className="font-serif text-xl font-semibold text-[var(--color-bone)] truncate">
        {title}
      </h2>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}
