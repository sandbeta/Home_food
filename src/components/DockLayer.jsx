import FloatingPillNav from './FloatingPillNav'
import D3CartOrb from './D3CartOrb'

/**
 * 底部停靠层 —— 全站**唯一**的底部固定层。
 *
 * 导航药丸与购物车球并排同一行、由 flex 分配宽度，
 * 因此二者在任何屏宽下都不可能重叠（此前是两处独立 fixed 靠 bottom-24 魔法数避让，
 * 且 Menu 的 bottom-24 CTA 还会与球撞在一起）。
 *
 * 是否渲染由 App 决定（admin 路由不显示）。
 */
export default function DockLayer() {
  return (
    <div
      className="fixed bottom-0 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
      style={{ width: 'min(var(--shell-w), 100%)' }}
    >
      <div
        className="flex items-center pointer-events-auto"
        style={{
          gap: 'var(--dock-gap)',
          paddingLeft: 'var(--space-page-x)',
          paddingRight: 'var(--space-page-x)',
          paddingBottom: 'var(--safe-bottom)',
        }}
      >
        <FloatingPillNav />
        {/* 球位恒定预留：购物车为空时不塌陷，加购时也不会跳版 */}
        <div
          className="shrink-0 flex items-center justify-center"
          style={{ width: 'var(--dock-orb)', height: 'var(--dock-orb)' }}
        >
          <D3CartOrb />
        </div>
      </div>
    </div>
  )
}
