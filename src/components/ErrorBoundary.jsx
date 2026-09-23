import { Component } from 'react'
import EmptyState from './ui/EmptyState'
import PageContainer from './ui/PageContainer'
import PageHeader from './PageHeader'

/* ============================================================
 * 顶层错误边界 · ErrorBoundary
 * ------------------------------------------------------------
 * 修 B2 根因：项目原本没有任何 ErrorBoundary。OrderDetail 首屏 fetch 无 r.ok → 404 body
 * 被当作合法订单 setOrder → 渲染 order.items.map 抛 TypeError → 整个路由树卸载 = **整站白屏**。
 * 任何组件抛错都是这个下场，太脆。
 *
 * 挂法：App.jsx 里包住 <main>，抛错时展示 EmptyState error 态 + 再试一次（reload）。
 * 保留最小堆栈打印到 console，方便开发定位。
 * ============================================================ */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, msg: '' }
  }
  static getDerivedStateFromError(err) {
    return { hasError: true, msg: (err && err.message) || '未知错误' }
  }
  componentDidCatch(err, info) {
    // 家庭自用不做远程上报，只 console 里留一份便于开发查
    try { console.error('[ErrorBoundary]', err, info?.componentStack) } catch { /* noop */ }
  }
  render() {
    if (!this.state.hasError) return this.props.children
    return (
      <div className="relative">
        <PageHeader title="哎哟，页面崩了" subtitle="不影响厨房，只是这一屏需要重启一下" />
        <PageContainer>
          <EmptyState
            emoji="📡"
            tone="error"
            title="这一屏卡壳了"
            desc={this.state.msg ? String(this.state.msg).slice(0, 120) : '刷新一下就好'}
            action={
              <button
                onClick={() => window.location.reload()}
                className="d3-btn d3-btn-primary px-6 py-2.5 text-sm font-bold"
                style={{ borderRadius: 'var(--radius-btn)', minHeight: 44 }}
              >
                刷新一下
              </button>
            }
          />
        </PageContainer>
      </div>
    )
  }
}
