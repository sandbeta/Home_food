/**
 * 区块标题行 —— 取代 Home 内 4 份手写的「标题 + 右侧跳转」组合。
 * 编辑杂志版式：标题前缀一条赤陶短线（栏目标记），字距收紧。
 */
export default function SectionHeader({ title, action, className = '' }) {
  return (
    <div className={`flex items-center justify-between gap-3 ${className}`}>
      <div className="flex items-center gap-2.5 min-w-0">
        <span
          aria-hidden
          className="shrink-0 w-4 h-[2px] rounded-full"
          style={{ background: 'var(--color-clay)' }}
        />
        <h2 className="font-serif text-2xl font-semibold text-[var(--color-bone)] truncate">
          {title}
        </h2>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}
