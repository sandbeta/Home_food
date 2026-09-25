// ============================================================
// Admin 密码门（前端侧，2026-09-18 公网部署）
// 家庭服务端对"公网来源的管理写接口"返回 401 {message:'admin_auth_required'}；
// 拦截清单（与 server needsAdminGuard 同步，2026-09-25 修 P0-7 扩面）：
//   菜品增删改 / 订单状态推进 / 纪念日增删改 / 愿望处理（PUT/DELETE /api/wishes/:id）。
// 放行：所有 GET、POST /api/orders（下单）、POST /api/wishes（许愿）——家人公网日常操作零门。
// 这里包装 window.fetch：捕获该 401 → 弹密码层 → POST /api/admin/login
// 换 httpOnly cookie → 成功后自动重放原请求，用户只在首次输一次密码。
// 局域网来源永远不会收到 401，本模块零打扰；浏览器 mock 模式也不安装它。
// 样式全部走 CSS 变量，避免主题色值门禁（p6_static_gate）告警。
// ============================================================

let gatePromise = null // 单实例：并发 401 只弹一层

function askPassword() {
  if (gatePromise) return gatePromise
  gatePromise = new Promise((resolve) => {
    const overlay = document.createElement('div')
    overlay.setAttribute('style', [
      'position:fixed;inset:0;z-index:9999',
      'background:rgba(43,36,41,.45)',
      'display:flex;align-items:center;justify-content:center',
    ].join(';'))
    overlay.innerHTML = `
      <form role="dialog" aria-modal="true" aria-label="管理验证" class="cg-gate-card" style="background:var(--color-ink-900);border:2px solid var(--color-line);border-radius:var(--radius-card);padding:28px;width:min(88vw,320px);box-shadow:var(--shadow-4)">
        <h2 style="font-size:1.125rem;margin:0 0 6px;color:var(--color-bone)">🔐 管理验证</h2>
        <p style="font-size:13px;margin:0 0 16px;color:var(--color-ash)">当前经公网访问管理功能，请输入家庭管理密码</p>
        <input name="password" type="password" placeholder="家庭管理密码" autofocus
          style="width:100%;box-sizing:border-box;padding:10px 12px;border:2px solid var(--color-line);border-radius:var(--radius-btn);font-size:15px;background:transparent;color:var(--color-bone)">
        <div class="cg-gate-err" role="alert" aria-live="assertive" style="min-height:18px;font-size:12px;color:color-mix(in srgb, var(--color-danger) 70%, var(--color-bone));margin-top:8px"></div>
        <button type="submit" style="margin-top:6px;width:100%;padding:10px;border:0;border-radius:var(--radius-btn);background:var(--color-clay);color:var(--color-on-dark);font-size:15px;font-weight:700">验证并继续</button>
        <button type="button" name="cancel" style="margin-top:10px;width:100%;padding:8px;border:0;border-radius:var(--radius-btn);background:transparent;color:var(--color-ash);font-size:13px">取消</button>
      </form>`
    document.body.appendChild(overlay)
    const card = overlay.querySelector('form')
    const input = card.querySelector('input[name=password]')
    const err = card.querySelector('.cg-gate-err')
    const prevFocus = document.activeElement
    const focusables = () => Array.from(card.querySelectorAll('input, button'))
    setTimeout(() => input.focus(), 50)

    function close (ok) {
      document.removeEventListener('keydown', onKey)
      overlay.remove(); gatePromise = null
      if (prevFocus && document.contains(prevFocus)) prevFocus.focus?.()
      resolve(ok)
    }
    function onKey (e) {
      if (e.key === 'Escape') { e.preventDefault(); close(false); return }
      if (e.key !== 'Tab') return
      const items = focusables(); if (!items.length) return
      const first = items[0], last = items[items.length - 1]
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', onKey)
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(false) })
    card.addEventListener('submit', async (ev) => {
      ev.preventDefault()
      err.textContent = ''
      try {
        const r = await (window.__cgNativeFetch || window.fetch)('/api/admin/login', {   // 走原生 fetch：登录请求绝不能再进门包装
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password: input.value }),
        })
        if (r.ok) return close(true)
        if (r.status === 503) { err.textContent = '家庭管理密码还没设好，待会儿再试'; console.warn('[adminGate] 服务端未配置管理密码'); return }
        err.textContent = r.status === 401 ? '密码不对，再试试' : '验证失败，请稍后再试'
        input.select()
      } catch {
        err.textContent = '网络异常，请重试'
      }
    })
    card.querySelector('button[name=cancel]').addEventListener('click', () => close(false))
  })
  return gatePromise
}

export function installAdminGate() {
  const nativeFetch = window.fetch.bind(window)
  window.__cgNativeFetch = nativeFetch // 供登录层之外（如需要）拿回原生 fetch
  window.fetch = async (input, init) => {
    const res = await nativeFetch(input, init)
    if (res.status === 401) {
      let data = null
      try { data = await res.clone().json() } catch { /* 非本门的 401 原样返回 */ }
      if (data && data.message === 'admin_auth_required') {
        const ok = await askPassword()
        if (ok) return nativeFetch(input, init) // 已拿到 cookie，重放原请求
      }
    }
    return res
  }
}
