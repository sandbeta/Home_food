/* 公网访问时的管理密码门。
   局域网与浏览器 mock 模式永远收不到 401，本模块零打扰。
   捕获 401 admin_auth_required → 弹密码层 → 换 httpOnly cookie → 自动重放原请求。 */

let pending = null

function askPassword() {
  if (pending) return pending
  pending = new Promise((resolve) => {
    const overlay = document.createElement('div')
    overlay.className = 'gate'
    overlay.innerHTML = `
      <form class="gate__panel" role="dialog" aria-modal="true" aria-label="管理验证">
        <h2 class="gate__title">厨房管理验证</h2>
        <p class="gate__note">这次是从公网进来的，输一下家里的管理密码。</p>
        <input class="gate__input" name="password" type="password" placeholder="管理密码" autocomplete="current-password" />
        <div class="gate__err" role="alert" aria-live="assertive"></div>
        <button class="btn btn--primary btn--block" type="submit">验证并继续</button>
        <button class="btn btn--ghost btn--block" type="button" name="cancel">先不看了</button>
      </form>`
    document.body.appendChild(overlay)
    const form = overlay.querySelector('form')
    const input = overlay.querySelector('input')
    const err = overlay.querySelector('.gate__err')
    const prev = document.activeElement
    const close = (ok) => {
      document.removeEventListener('keydown', onKey)
      overlay.remove()
      pending = null
      if (prev && document.contains(prev)) prev.focus?.()
      resolve(ok)
    }
    const onKey = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); close(false) }
      if (e.key === 'Tab') {
        const items = Array.from(form.querySelectorAll('input, button'))
        if (!items.length) return
        const first = items[0], last = items[items.length - 1]
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
      }
    }
    setTimeout(() => input.focus(), 40)
    document.addEventListener('keydown', onKey)
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(false) })
    form.querySelector('[name=cancel]').addEventListener('click', () => close(false))
    form.addEventListener('submit', async (ev) => {
      ev.preventDefault()
      err.textContent = ''
      try {
        const r = await (window.__lambNativeFetch || window.fetch)('/api/admin/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password: input.value }),
        })
        if (r.ok) return close(true)
        if (r.status === 503) { err.textContent = '家里还没设管理密码'; return }
        err.textContent = r.status === 401 ? '密码不对，再试一次' : '验证失败，稍后再试'
        input.select()
      } catch {
        err.textContent = '网络没接上，再试一次'
      }
    })
  })
  return pending
}

export function installAdminGate() {
  const nativeFetch = window.fetch.bind(window)
  window.__lambNativeFetch = nativeFetch
  window.fetch = async (input, init) => {
    const res = await nativeFetch(input, init)
    if (res.status === 401) {
      let data = null
      try { data = await res.clone().json() } catch { /* 与本门无关的 401 */ }
      if (data && data.message === 'admin_auth_required') {
        const ok = await askPassword()
        if (ok) return nativeFetch(input, init)
      }
    }
    return res
  }
}
