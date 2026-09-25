import { Component } from 'react'

/* ============================================================
 * 顶层错误边界 · ErrorBoundary
 * ------------------------------------------------------------
 * 修 B2 根因：项目原本没有任何 ErrorBoundary。OrderDetail 首屏 fetch 无 r.ok → 404 body
 * 被当作合法订单 setOrder → 渲染 order.items.map 抛 TypeError → 整个路由树卸载 = **整站白屏**。
 *
 * 批3 修 P1（降级页自身可二次崩 + reload 死循环）：
 *   ① 降级 UI 全部零依赖纯静态（不再引 EmptyState/PageHeader/useTheme/Character——
 *      崩因若出在主题/路由/图片链路，旧降级页会当场再抛、白屏如故）；
 *   ② 确定性数据错误 reload 必再崩，故给「回首页」硬链接（a href 直改 hash，不经 useNavigate）
 *      与「刷新」双出口；错误细节只进 console，用户看人话。
 * 复位契约：调用方传 resetKey（App 传 pathname），变化即清错误态——不依赖整树重挂的隐式行为。
 * ============================================================ */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, msg: '', prevResetKey: props.resetKey }
  }
  static getDerivedStateFromError(err) {
    return { hasError: true, msg: (err && err.message) || '未知错误' }
  }
  static getDerivedStateFromProps(props, state) {
    // resetKey 变化 = 用户已换页 → 错误态自动复位（官方派生模式，不在 didUpdate 里 setState）
    if (state.prevResetKey !== props.resetKey) {
      return { prevResetKey: props.resetKey, hasError: false, msg: '' }
    }
    return null
  }
  componentDidCatch(err, info) {
    // 家庭自用不做远程上报，只 console 里留一份便于开发查
    try { console.error('[ErrorBoundary]', err, info?.componentStack) } catch { /* noop */ }
  }
  render() {
    if (!this.state.hasError) return this.props.children
    // ↓ 零 hook / 零 context / 零 CSS 类依赖的纯静态降级（内联色是刻意的：此时样式令牌可能正是崩因）
    return (
      <div role="alert" aria-live="assertive"
        style={{ minHeight: '55vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, padding: 32, textAlign: 'center', fontFamily: 'system-ui, sans-serif', color: 'var(--color-bone, #2B2429)' }}>
        <div style={{ fontSize: 40 }} aria-hidden="true">📡</div>
        <p style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>这一屏卡壳了</p>
        <p style={{ fontSize: 13, lineHeight: 1.7, margin: 0, color: 'var(--color-ash, #5F5259)' }}>
          厨房还在，只是这一页没端上来。回首页点菜，或刷新一下试试。
        </p>
        <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
          <a href="#/home"
            style={{ padding: '10px 22px', borderRadius: 999, background: 'var(--color-clay, #BE4E67)', color: 'var(--color-on-dark, #FFF9FC)', fontSize: 14, fontWeight: 700, textDecoration: 'none' }}>
            回首页点菜
          </a>
          <button onClick={() => window.location.reload()}
            style={{ padding: '10px 22px', borderRadius: 999, border: '2px solid var(--color-line, rgba(43,36,41,.14))', background: 'transparent', color: 'var(--color-bone, #2B2429)', fontSize: 14, fontWeight: 700, cursor: 'pointer', minHeight: 44 }}>
            刷新这一页
          </button>
        </div>
      </div>
    )
  }
}
