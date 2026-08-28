import PageHeader from '../PageHeader'

/**
 * 后台外壳 —— 三页 admin 共用。
 *
 * 解决两个问题：
 * 1. 此前 AdminDishes / AdminOrders 没有任何站内返回入口，而 /admin 路由下底部导航
 *    又被隐藏，用户进去出不来（断头路）。这里**强制**提供返回到 /admin。
 * 2. 此前三页没有 Hero，与用户端 9 页存在视觉断层。这里用晨光渐变头部补上，
 *    不引照片，保持后台的工具属性。
 */
export default function AdminShell({
  title,
  subtitle,
  back = true,
  backTo = '/admin',
  right,
  children,
}) {
  return (
    <div className="relative">
      {/* 晨光渐变头部：赤陶 → 鼠尾草，极低透明度，仅作氛围 */}
      <div
        className="absolute top-0 left-0 right-0 h-56 pointer-events-none"
        style={{
          background:
            'linear-gradient(180deg, rgba(200,104,63,0.10) 0%, rgba(127,163,122,0.06) 45%, transparent 100%)',
        }}
      />

      <PageHeader title={title} subtitle={subtitle} back={back} backTo={backTo} right={right} />

      <div
        className="relative"
        style={{
          paddingLeft: 'var(--space-page-x)',
          paddingRight: 'var(--space-page-x)',
        }}
      >
        {children}
      </div>
    </div>
  )
}
