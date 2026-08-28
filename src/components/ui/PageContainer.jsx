/**
 * 页面内容容器 —— 统一左右边距与区块纵向节奏。
 *
 * 取代此前各页不一致的写法：Home 用 space-y-6、Menu 无 space-y 全靠 mb-3/mb-4、
 * 其余页 space-y-3 / 3.5 / 4 各不相同，且多页缺底部内边距。
 */
export default function PageContainer({ children, className = '', gap = 'var(--space-section)' }) {
  return (
    <div
      className={`relative ${className}`}
      style={{
        paddingLeft: 'var(--space-page-x)',
        paddingRight: 'var(--space-page-x)',
        display: 'flex',
        flexDirection: 'column',
        gap,
      }}
    >
      {children}
    </div>
  )
}
